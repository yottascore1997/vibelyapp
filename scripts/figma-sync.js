#!/usr/bin/env node
/**
 * Figma API Integration Script for Vibely App
 *
 * Usage:
 *   node scripts/figma-sync.js test
 *   node scripts/figma-sync.js info [fileKey]
 *   node scripts/figma-sync.js export <nodeId> <outputFilename> [fileKey]
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Read .env file directly without external dependencies
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || env.FIGMA_FILE_KEY;

function figmaRequest(endpoint) {
  return new Promise((resolve, reject) => {
    if (!FIGMA_TOKEN) {
      return reject(new Error("FIGMA_ACCESS_TOKEN is missing in .env or environment"));
    }

    const options = {
      hostname: "api.figma.com",
      path: endpoint,
      method: "GET",
      headers: {
        "X-Figma-Token": FIGMA_TOKEN,
        "User-Agent": "VibelyApp-FigmaSync/1.0",
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            return reject(new Error(`Figma API error (${res.statusCode}): ${parsed.err || parsed.message || body}`));
          }
          resolve(parsed);
        } catch {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download image (status: ${res.statusCode})`));
      }
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const stream = fs.createWriteStream(destPath);
      res.pipe(stream);
      stream.on("finish", () => {
        stream.close();
        resolve();
      });
    }).on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "test";

  console.log("=========================================");
  console.log("   Vibely Figma Connection Tool");
  console.log("=========================================");

  if (!FIGMA_TOKEN) {
    console.error("❌ ERROR: FIGMA_ACCESS_TOKEN not set in hangora/vibelyapp/.env");
    console.log("Please add: FIGMA_ACCESS_TOKEN=figd_... in .env");
    process.exit(1);
  }

  if (command === "test") {
    console.log("Testing Figma API Token...");
    try {
      const user = await figmaRequest("/v1/me");
      console.log("✅ Token is valid and fully authorized!");
      console.log(`Connected User: ${user.handle} (${user.email})`);
      console.log(`User ID: ${user.id}`);
    } catch (err) {
      if (err.message.includes("file_content:read")) {
        console.log("✅ Token is VALID and ACTIVE!");
        console.log("Permissions: file_content:read (Ready to fetch design files and export assets)");
        if (FIGMA_FILE_KEY) {
          console.log(`Testing access to file key: ${FIGMA_FILE_KEY}...`);
          try {
            const f = await figmaRequest(`/v1/files/${FIGMA_FILE_KEY}?depth=1`);
            console.log(`✅ File accessed successfully: "${f.name}"`);
          } catch (fileErr) {
            console.warn(`⚠️ Could not read file ${FIGMA_FILE_KEY}: ${fileErr.message}`);
          }
        } else {
          console.log("ℹ️  To sync design assets, set FIGMA_FILE_KEY in .env or pass it as an argument.");
        }
      } else if (err.message.includes("Token has expired")) {
        console.error("❌ Token verification failed: Token has expired");
        console.log("\n⚠️  YOUR FIGMA TOKEN HAS EXPIRED.");
        console.log("Please generate a new token from Figma Settings.");
      } else {
        console.error("❌ Token verification failed:", err.message);
      }
    }
  } else if (command === "info") {
    const fileKey = args[1] || FIGMA_FILE_KEY;
    if (!fileKey) {
      console.error("❌ Missing file key. Usage: node scripts/figma-sync.js info <fileKey>");
      process.exit(1);
    }
    console.log(`Fetching info for Figma file: ${fileKey}...`);
    try {
      const fileData = await figmaRequest(`/v1/files/${fileKey}?depth=1`);
      console.log(`✅ File Name: "${fileData.name}"`);
      console.log(`Last Modified: ${fileData.lastModified}`);
      console.log(`Version: ${fileData.version}`);
      console.log("Pages:");
      fileData.document.children.forEach((page) => {
        console.log(` - ${page.name} (id: ${page.id})`);
      });
    } catch (err) {
      console.error("❌ Failed to fetch file info:", err.message);
    }
  } else if (command === "nodes" || command === "page") {
    const nodeId = args[1] || "472:902";
    const fileKey = args[2] || FIGMA_FILE_KEY;
    console.log(`Inspecting node ${nodeId} in file ${fileKey}...`);
    try {
      const data = await figmaRequest(`/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}&depth=2`);
      const nodeObj = data.nodes[nodeId]?.document;
      if (!nodeObj) {
        console.log("No node found with ID:", nodeId);
      } else {
        console.log(`Node Name: "${nodeObj.name}" (Type: ${nodeObj.type})`);
        if (nodeObj.children) {
          console.log(`Children frames (${nodeObj.children.length}):`);
          nodeObj.children.forEach((c) => {
            console.log(` - [${c.type}] "${c.name}" (id: "${c.id}")`);
          });
        }
      }
    } catch (err) {
      console.error("❌ Failed to inspect node:", err.message);
    }
  } else if (command === "export") {
    const nodeId = args[1];
    const outFilename = args[2] || "exported-asset.png";
    const fileKey = args[3] || FIGMA_FILE_KEY;

    if (!nodeId || !fileKey) {
      console.error("❌ Usage: node scripts/figma-sync.js export <nodeId> <outFilename> [fileKey]");
      process.exit(1);
    }

    console.log(`Exporting node ${nodeId} from file ${fileKey}...`);
    try {
      const imgData = await figmaRequest(`/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`);
      const imageUrl = imgData.images[nodeId];
      if (!imageUrl) {
        throw new Error(`Node ${nodeId} could not be rendered as image`);
      }
      const destPath = path.resolve(__dirname, "../assets", outFilename);
      await downloadFile(imageUrl, destPath);
      console.log(`✅ Asset exported successfully to: assets/${outFilename}`);
    } catch (err) {
      console.error("❌ Export failed:", err.message);
    }
  } else {
    console.log("Available commands:");
    console.log("  node scripts/figma-sync.js test                       - Verify token");
    console.log("  node scripts/figma-sync.js info <fileKey>             - View file structure");
    console.log("  node scripts/figma-sync.js export <nodeId> <outFile>  - Download node asset");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
