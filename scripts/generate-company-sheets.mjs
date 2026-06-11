import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bank = JSON.parse(readFileSync(path.join(root, "packages/sheet-engine/src/generated-problems.json"), "utf8"));

const companies = ["amazon", "microsoft", "google", "meta", "netflix", "uber", "adobe", "flipkart"];
const header = "id,platform,title,url,difficulty,rating,topics,patterns,companies,level,status";

for (const company of companies) {
  const rows = bank.filter((p) => p.companies.includes(company));
  const dir = path.join(root, "sheets/company");
  mkdirSync(dir, { recursive: true });
  const csv = [
    header,
    ...rows.map((p) =>
      [p.id, p.platform, `"${p.title.replace(/"/g, '""')}"`, p.url, p.difficulty, p.rating ?? "", p.topics.join(";"), p.patterns.join(";"), company, p.level, p.status].join(",")
    )
  ].join("\n");
  writeFileSync(path.join(dir, `${company}.csv`), csv);
  console.log(`Wrote ${company}.csv (${rows.length} problems)`);
}
