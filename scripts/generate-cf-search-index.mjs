import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = JSON.parse(readFileSync(path.join(root, "datasets/cf-problemset-cache.json"), "utf8"));

const index = cache.problems.map((p) => ({
  id: p.id,
  t: p.title,
  u: p.url,
  r: p.rating ?? 0,
  tp: (p.topics ?? []).slice(0, 4)
}));

const out = path.join(root, "apps/web-dashboard/public/cf-search-index.json");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ count: index.length, problems: index }));
console.log(`Wrote cf-search-index.json (${index.length} problems, ${(Buffer.byteLength(JSON.stringify(index)) / 1024 / 1024).toFixed(2)} MB)`);
