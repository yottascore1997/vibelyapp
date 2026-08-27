/**
 * Remove solid canvas background by flood-filling near-white from image edges.
 * Keeps bright whites inside artwork (e.g. latte foam, clouds) intact.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function parsePng(buf) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 8 || !buf.subarray(0, 8).equals(sig)) throw new Error("Not a PNG");
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  const idat = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    offset += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`Unsupported PNG colorType=${colorType} bitDepth=${bitDepth}`);
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const rgba = Buffer.alloc(width * height * 4);
  let src = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = Buffer.alloc(stride);
    raw.copy(row, 0, src, src + stride);
    src += stride;
    const recon = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const x = row[i];
      const a = i >= bpp ? recon[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let val = x;
      if (filter === 1) val = (x + a) & 255;
      else if (filter === 2) val = (x + b) & 255;
      else if (filter === 3) val = (x + Math.floor((a + b) / 2)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        val = (x + pr) & 255;
      }
      recon[i] = val;
    }
    for (let x = 0; x < width; x++) {
      const si = x * bpp;
      const di = (y * width + x) * 4;
      rgba[di] = recon[si];
      rgba[di + 1] = recon[si + 1];
      rgba[di + 2] = recon[si + 2];
      rgba[di + 3] = bpp === 4 ? recon[si + 3] : 255;
    }
    prev = recon;
  }
  return { width, height, rgba };
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const o = y * (stride + 1);
    raw[o] = 0;
    rgba.copy(raw, o + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function isCanvas(r, g, b, a, minLuma, maxChroma) {
  if (a < 8) return true; // already clear — treat as walkable seed neighbor
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return min >= minLuma && max - min <= maxChroma;
}

function floodClear(rgba, width, height, opts = {}) {
  const minLuma = opts.minLuma ?? 232;
  const maxChroma = opts.maxChroma ?? 18;
  const soft = opts.soft ?? 22;
  const n = width * height;
  const seen = new Uint8Array(n);
  const stack = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (seen[i]) return;
    const o = i * 4;
    if (!isCanvas(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3], minLuma - soft, maxChroma + 6))
      return;
    seen[i] = 1;
    stack.push(i);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const i = stack.pop();
    const o = i * 4;
    const r = rgba[o];
    const g = rgba[o + 1];
    const b = rgba[o + 2];
    const a = rgba[o + 3];
    const min = Math.min(r, g, b);
    if (a > 0) {
      if (min >= minLuma) {
        rgba[o + 3] = 0;
      } else {
        const t = (min - (minLuma - soft)) / soft;
        rgba[o + 3] = Math.max(0, Math.round(a * (1 - Math.min(1, Math.max(0, t)))));
      }
    }
    const x = i % width;
    const y = (i / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node make-transparent.js <png...>");
  process.exit(1);
}

for (const file of files) {
  const abs = path.resolve(file);
  const buf = fs.readFileSync(abs);
  const { width, height, rgba } = parsePng(buf);
  // Avatars are thin strips — slightly more aggressive
  const aggressive = /avatars/i.test(path.basename(abs));
  floodClear(rgba, width, height, {
    minLuma: aggressive ? 220 : 235,
    maxChroma: aggressive ? 28 : 20,
    soft: aggressive ? 28 : 20,
  });
  const out = writePng(width, height, rgba);
  fs.writeFileSync(abs, out);
  console.log(`ok ${path.basename(abs)} ${width}x${height} -> ${out.length} bytes`);
}
