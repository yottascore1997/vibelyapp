/** Popular hangout area / college-style clusters for cold-start discovery */

export type AreaCluster = {
  id: string;
  label: string;
  cityId: string;
  keywords: string[];
};

export const AREA_CLUSTERS: AreaCluster[] = [
  // Nagpur
  { id: "nagpur-fc", label: "FC Road", cityId: "nagpur", keywords: ["fc road", "f.c. road", "dharampeth"] },
  { id: "nagpur-sitabuldi", label: "Sitabuldi", cityId: "nagpur", keywords: ["sitabuldi", "sadar"] },
  { id: "nagpur-mihan", label: "MIHAN", cityId: "nagpur", keywords: ["mihan", "airport"] },
  { id: "nagpur-vnits", label: "VNIT", cityId: "nagpur", keywords: ["vnit", "college", "campus"] },
  { id: "nagpur-empress", label: "Empress City", cityId: "nagpur", keywords: ["empress", "civil lines"] },
  // Pune
  { id: "pune-fc", label: "FC Road", cityId: "pune", keywords: ["fc road", "fergusson", "deccan"] },
  { id: "pune-koregaon", label: "Koregaon Park", cityId: "pune", keywords: ["koregaon", "kp", "lane"] },
  { id: "pune-hinjewadi", label: "Hinjewadi", cityId: "pune", keywords: ["hinjewadi", "it park"] },
  // Mumbai
  { id: "mumbai-bandra", label: "Bandra", cityId: "mumbai", keywords: ["bandra", "linking road"] },
  { id: "mumbai-powai", label: "Powai", cityId: "mumbai", keywords: ["powai", "iit", "hiranandani"] },
  { id: "mumbai-andheri", label: "Andheri", cityId: "mumbai", keywords: ["andheri", "lokhandwala"] },
  // Delhi
  { id: "delhi-cp", label: "Connaught Place", cityId: "delhi", keywords: ["cp", "connaught", "central delhi"] },
  { id: "delhi-hauz", label: "Hauz Khas", cityId: "delhi", keywords: ["hauz khas", "hk village"] },
  // Bangalore
  { id: "blr-indiranagar", label: "Indiranagar", cityId: "bangalore", keywords: ["indiranagar", "100 feet"] },
  { id: "blr-koramangala", label: "Koramangala", cityId: "bangalore", keywords: ["koramangala", "kormangala"] },
  // Hyderabad
  { id: "hyd-jubilee", label: "Jubilee Hills", cityId: "hyderabad", keywords: ["jubilee", "road no"] },
  { id: "hyd-hitech", label: "Hitech City", cityId: "hyderabad", keywords: ["hitech", "gachibowli", "madhapur"] },
];

export function clustersForCity(cityId?: string | null): AreaCluster[] {
  if (!cityId) return AREA_CLUSTERS.slice(0, 6);
  const list = AREA_CLUSTERS.filter((c) => c.cityId === cityId);
  return list.length > 0 ? list : AREA_CLUSTERS.slice(0, 6);
}

export function planMatchesCluster(
  plan: { location?: string | null; title?: string | null; destination?: string | null },
  cluster: AreaCluster
): boolean {
  const hay = `${plan.location || ""} ${plan.title || ""} ${plan.destination || ""}`.toLowerCase();
  return cluster.keywords.some((k) => hay.includes(k.toLowerCase()));
}
