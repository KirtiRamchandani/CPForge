import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sheetsDir = path.join(root, "sheets");
const outFile = path.join(root, "packages", "sheet-engine", "src", "generated-problems.json");

const blind75 = [
  ["1", "Two Sum", "easy", 800, ["arrays", "hashing"], ["hash map"]],
  ["121", "Best Time to Buy and Sell Stock", "easy", 900, ["arrays"], ["prefix min"]],
  ["217", "Contains Duplicate", "easy", 850, ["arrays", "hashing"], ["hash set"]],
  ["238", "Product of Array Except Self", "medium", 1200, ["arrays"], ["prefix product"]],
  ["53", "Maximum Subarray", "medium", 1100, ["arrays"], ["kadane"]],
  ["152", "Maximum Product Subarray", "medium", 1300, ["arrays"], ["kadane"]],
  ["153", "Find Minimum in Rotated Sorted Array", "medium", 1400, ["arrays", "binary-search"], ["binary search on answer"]],
  ["33", "Search in Rotated Sorted Array", "medium", 1400, ["arrays", "binary-search"], ["binary search"]],
  ["15", "3Sum", "medium", 1500, ["arrays"], ["two pointers"]],
  ["11", "Container With Most Water", "medium", 1400, ["arrays"], ["two pointers"]],
  ["371", "Sum of Two Integers", "medium", 1300, ["bit-manipulation"], ["bitwise"]],
  ["191", "Number of 1 Bits", "easy", 900, ["bit-manipulation"], ["bit count"]],
  ["338", "Counting Bits", "easy", 950, ["bit-manipulation", "dynamic-programming"], ["DP bits"]],
  ["268", "Missing Number", "easy", 900, ["arrays", "bit-manipulation"], ["xor"]],
  ["190", "Reverse Bits", "easy", 950, ["bit-manipulation"], ["bit reverse"]],
  ["70", "Climbing Stairs", "easy", 900, ["dynamic-programming"], ["1D DP"]],
  ["322", "Coin Change", "medium", 1500, ["dynamic-programming"], ["knapsack DP"]],
  ["300", "Longest Increasing Subsequence", "medium", 1600, ["dynamic-programming"], ["LIS DP"]],
  ["1143", "Longest Common Subsequence", "medium", 1600, ["dynamic-programming"], ["2D DP"]],
  ["139", "Word Break", "medium", 1500, ["dynamic-programming", "strings"], ["DP strings"]],
  ["39", "Combination Sum", "medium", 1400, ["backtracking"], ["backtracking"]],
  ["198", "House Robber", "medium", 1300, ["dynamic-programming"], ["1D DP"]],
  ["213", "House Robber II", "medium", 1500, ["dynamic-programming"], ["circular DP"]],
  ["91", "Decode Ways", "medium", 1500, ["dynamic-programming", "strings"], ["DP strings"]],
  ["62", "Unique Paths", "medium", 1200, ["dynamic-programming"], ["grid DP"]],
  ["55", "Jump Game", "medium", 1300, ["arrays", "greedy"], ["greedy"]],
  ["133", "Clone Graph", "medium", 1400, ["graphs"], ["bfs shortest path"]],
  ["207", "Course Schedule", "medium", 1500, ["graphs"], ["topological sort"]],
  ["417", "Pacific Atlantic Water Flow", "medium", 1600, ["graphs", "matrices"], ["multi-source bfs"]],
  ["200", "Number of Islands", "medium", 1300, ["graphs"], ["dfs connected components"]],
  ["128", "Longest Consecutive Sequence", "medium", 1400, ["arrays", "hashing"], ["hash set"]],
  ["261", "Graph Valid Tree", "medium", 1400, ["graphs"], ["union find"]],
  ["323", "Number of Connected Components in an Undirected Graph", "medium", 1300, ["graphs"], ["union find"]],
  ["208", "Implement Trie (Prefix Tree)", "medium", 1400, ["tries"], ["trie"]],
  ["212", "Word Search II", "hard", 1800, ["tries", "backtracking"], ["trie + backtracking"]],
  ["79", "Word Search", "medium", 1400, ["backtracking", "matrices"], ["backtracking"]],
  ["23", "Merge k Sorted Lists", "hard", 1700, ["linked-lists", "heap"], ["heap"]],
  ["206", "Reverse Linked List", "easy", 900, ["linked-lists"], ["iterative reverse"]],
  ["143", "Reorder List", "medium", 1500, ["linked-lists"], ["two pointers"]],
  ["19", "Remove Nth Node From End of List", "medium", 1200, ["linked-lists"], ["two pointers"]],
  ["73", "Set Matrix Zeroes", "medium", 1300, ["matrices"], ["in-place"]],
  ["54", "Spiral Matrix", "medium", 1300, ["matrices"], ["simulation"]],
  ["48", "Rotate Image", "medium", 1400, ["matrices"], ["transpose"]],
  ["56", "Merge Intervals", "medium", 1400, ["intervals"], ["sort merge"]],
  ["57", "Insert Interval", "medium", 1400, ["intervals"], ["merge intervals"]],
  ["435", "Non-overlapping Intervals", "medium", 1500, ["intervals", "greedy"], ["greedy"]],
  ["20", "Valid Parentheses", "easy", 900, ["stack"], ["stack"]],
  ["3", "Longest Substring Without Repeating Characters", "medium", 1200, ["strings"], ["sliding-window"]],
  ["424", "Longest Repeating Character Replacement", "medium", 1500, ["strings"], ["sliding-window"]],
  ["76", "Minimum Window Substring", "hard", 1700, ["strings"], ["sliding-window"]],
  ["242", "Valid Anagram", "easy", 850, ["strings", "hashing"], ["frequency map"]],
  ["49", "Group Anagrams", "medium", 1200, ["strings", "hashing"], ["hash map"]],
  ["125", "Valid Palindrome", "easy", 850, ["strings"], ["two pointers"]],
  ["5", "Longest Palindromic Substring", "medium", 1400, ["strings"], ["expand around center"]],
  ["647", "Palindomic Substrings", "medium", 1400, ["strings"], ["expand around center"]],
  ["271", "Encode and Decode Strings", "medium", 1300, ["strings"], ["delimiter encoding"]],
  ["104", "Maximum Depth of Binary Tree", "easy", 900, ["trees"], ["dfs"]],
  ["100", "Same Tree", "easy", 850, ["trees"], ["dfs"]],
  ["226", "Invert Binary Tree", "easy", 900, ["trees"], ["dfs"]],
  ["124", "Binary Tree Maximum Path Sum", "hard", 1700, ["trees"], ["dfs postorder"]],
  ["297", "Serialize and Deserialize Binary Tree", "hard", 1700, ["trees"], ["bfs"]],
  ["572", "Subtree of Another Tree", "easy", 950, ["trees"], ["dfs match"]],
  ["105", "Construct Binary Tree from Preorder and Inorder Traversal", "medium", 1500, ["trees"], ["divide and conquer"]],
  ["98", "Validate Binary Search Tree", "medium", 1300, ["trees", "bst"], ["inorder bounds"]],
  ["230", "Kth Smallest Element in a BST", "medium", 1400, ["trees", "bst"], ["inorder"]],
  ["235", "Lowest Common Ancestor of a Binary Search Tree", "medium", 1300, ["trees", "bst"], ["bst walk"]],
  ["199", "Binary Tree Right Side View", "medium", 1300, ["trees"], ["bfs levels"]],
  ["1448", "Count Good Nodes in Binary Tree", "medium", 1300, ["trees"], ["dfs"]],
  ["110", "Balanced Binary Tree", "easy", 950, ["trees"], ["height dfs"]],
  ["543", "Diameter of Binary Tree", "easy", 1000, ["trees"], ["dfs height"]],
  ["2", "Add Two Numbers", "medium", 1300, ["linked-lists"], ["carry simulation"]],
  ["21", "Merge Two Sorted Lists", "easy", 900, ["linked-lists"], ["merge"]],
  ["347", "Top K Frequent Elements", "medium", 1400, ["heap", "hashing"], ["bucket sort"]],
  ["295", "Find Median from Data Stream", "hard", 1800, ["heap"], ["two heaps"]],
  ["703", "Kth Largest Element in a Stream", "easy", 1000, ["heap"], ["min heap"]],
  ["215", "Kth Largest Element in an Array", "medium", 1400, ["heap", "arrays"], ["quickselect"]],
  ["252", "Meeting Rooms", "easy", 900, ["intervals"], ["sort"]],
  ["253", "Meeting Rooms II", "medium", 1500, ["intervals", "heap"], ["heap"]]
];

const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const toProblem = ([platformId, title, difficulty, rating, topics, patterns], companies = []) => ({
  id: `leetcode-${platformId}-${slugify(title)}`,
  platform: "leetcode",
  platformId,
  title,
  url: `https://leetcode.com/problems/${slugify(title)}/`,
  difficulty,
  rating,
  topics,
  patterns,
  companies,
  level: difficulty === "easy" ? "beginner" : difficulty === "medium" ? "intermediate" : "advanced",
  status: "unseen",
  attempts: 0,
  confidence: 0,
  notes: "",
  mistakes: [],
  source: "curated"
});

const fromJson = (filePath) => {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const walkSheets = (dir) => {
  const problems = [];
  if (!fs.existsSync(dir)) return problems;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) problems.push(...walkSheets(full));
    else if (entry.name.endsWith(".json")) problems.push(...fromJson(full));
    else if (entry.name.endsWith(".csv")) problems.push(...fromCsv(full));
  }
  return problems;
};

const fromCsv = (filePath) => {
  const lines = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const title = record.title || record.Problem || "Imported Problem";
    const slug = slugify(title);
    return {
      id: `sheet-${slug}`,
      platform: record.platform || "leetcode",
      platformId: record.platformId || slug,
      title,
      url: record.url || record.URL || `https://leetcode.com/problems/${slug}/`,
      difficulty: record.difficulty || "medium",
      rating: record.rating ? Number(record.rating) : 1200,
      topics: (record.topics || record.topic || "").split(/[;|]/).map((s) => s.trim()).filter(Boolean),
      patterns: (record.patterns || record.pattern || "").split(/[;|]/).map((s) => s.trim()).filter(Boolean),
      companies: (record.companies || record.company || "").split(/[;|]/).map((s) => s.trim().toLowerCase()).filter(Boolean),
      level: record.level || "intermediate",
      status: "unseen",
      attempts: 0,
      confidence: 0,
      notes: record.notes || "",
      mistakes: [],
      source: "sheet-csv"
    };
  });
};

const cfExtras = [
  ["4A", "Watermelon", "800", ["implementation"], ["parity"]],
  ["71A", "Way Too Long Words", "800", ["strings"], ["simulation"]],
  ["158A", "Next Round", "800", ["implementation"], ["simulation"]],
  ["50A", "Domino piling", "800", ["math"], ["greedy"]],
  ["231A", "Team", "800", ["implementation"], ["counting"]],
  ["282A", "Bit++", "800", ["implementation"], ["simulation"]],
  ["339A", "Helpful Maths", "800", ["sorting"], ["sort"]],
  ["486A", "Calculating Function", "900", ["math"], ["formula"]],
  ["580A", "Kefa and First Steps", "900", ["arrays"], ["two pointers"]],
  ["977A", "Wrong Subtraction", "900", ["math"], ["simulation"]],
  ["546A", "Soldier and Bananas", "800", ["math"], ["arithmetic"]],
  ["791A", "Bear and Big Brother", "800", ["math"], ["simulation"]],
  ["977B", "Two-gram", "900", ["strings"], ["frequency"]],
  ["110A", "Nearly Lucky Number", "800", ["implementation"], ["validation"]],
  ["112A", "Petya and Strings", "800", ["strings"], ["compare"]],
  ["118A", "String Task", "800", ["strings"], ["transform"]],
  ["133A", "HQ9+", "800", ["implementation"], ["interpreter"]],
  ["160A", "Twins", "800", ["sorting"], ["greedy"]],
  ["200B", "Drinks", "800", ["math"], ["average"]],
  ["263A", "Beautiful Matrix", "800", ["matrices"], ["manhattan"]],
  ["271A", "Beautiful Year", "800", ["implementation"], ["set"]],
  ["281A", "Word Capitalization", "800", ["strings"], ["capitalize"]],
  ["318A", "Even Odds", "800", ["math"], ["binary search"]],
  ["337A", "Puzzles", "800", ["sorting"], ["greedy"]],
  ["339B", "Xenia and Ringroad", "800", ["implementation"], ["simulation"]],
  ["432A", "Choosing Teams", "800", ["sorting"], ["greedy"]],
  ["443A", "Anton and Letters", "800", ["strings"], ["set"]],
  ["467A", "George and Accommodation", "800", ["implementation"], ["count"]],
  ["520A", "Pangram", "800", ["strings"], ["set"]],
  ["584A", "Olesya and Rodion", "800", ["constructive"], ["build"]],
  ["617A", "Elephant", "800", ["math"], ["greedy"]],
  ["677A", "Vanya and Fence", "800", ["math"], ["ceil"]],
  ["705A", "Hulk", "800", ["strings"], ["construct"]],
  ["734A", "Anton and Danik", "800", ["strings"], ["count"]],
  ["735A", "Kathmandu", "800", ["implementation"], ["parse"]],
  ["742A", "Arpa's Overnight Party", "800", ["math"], ["parity"]],
  ["749A", "Bachgold Problem", "800", ["math"], ["greedy"]],
  ["750A", "New Year and Hurry", "800", ["greedy"], ["knapsack-lite"]],
  ["758A", "Lucky Conversion", "800", ["strings"], ["swap"]],
  ["760B", "Frodo and the Ring", "800", ["greedy"], ["construct"]],
  ["761A", "Union of Doubles", "800", ["strings"], ["construct"]],
  ["785A", "Anton and Polyhedra", "800", ["implementation"], ["lookup"]],
  ["786B", "Berland trade", "800", ["greedy"], ["sort"]],
  ["791B", "Getting AC", "800", ["greedy"], ["exchange"]],
  ["812A", "Sagheer and Nubian Market", "800", ["binary-search"], ["binary search on answer"]],
  ["831A", "Tram", "800", ["simulation"], ["track max"]],
  ["832A", "Garland", "800", ["strings"], ["compare"]],
  ["834A", "Elevator or Stairs", "800", ["math"], ["compare"]],
  ["835A", "The Office", "800", ["math"], ["area"]],
  ["837A", "Text Splitting", "800", ["strings"], ["split"]],
  ["839A", "Bus Game", "800", ["simulation"], ["track"]],
  ["841A", "Anton and letter", "800", ["strings"], ["set"]],
  ["842A", "Display", "800", ["math"], ["formula"]],
  ["844A", "Diverse Substring", "800", ["strings"], ["sliding-window"]],
  ["845A", "Chess Tournament", "800", ["math"], ["count"]],
  ["847A", "Union Jack", "800", ["geometry"], ["construct"]],
  ["848A", "From Y to Y", "800", ["strings"], ["run length"]],
  ["849A", "Football", "800", ["strings"], ["compare"]],
  ["851A", "Arpa and the Contest", "800", ["math"], ["formula"]],
  ["852A", "Digits Permutation", "800", ["strings"], ["permutation"]],
  ["854A", "Fraction", "800", ["math"], ["reduce"]],
  ["855A", "Tom Riddle's Diary", "800", ["strings"], ["frequency"]],
  ["856A", "Similar Words", "800", ["strings"], ["compare"]],
  ["857A", "Two Co-Prime Arrays", "800", ["math"], ["coprime"]],
  ["858A", "Polycarp at the ATM", "800", ["math"], ["ceil"]],
  ["859A", "Declined Invitations", "800", ["simulation"], ["count"]],
  ["860A", "Remove Smallest", "800", ["greedy"], ["adjacent"]],
  ["861A", "Hayato and School", "800", ["strings"], ["construct"]],
  ["862A", "Mahmoud and Ehab and the xor", "800", ["math"], ["xor"]],
  ["863A", "Turn the Lights Off", "800", ["simulation"], ["reverse"]],
  ["864A", "Bus", "800", ["implementation"], ["count"]],
  ["865A", "Cheating", "800", ["math"], ["formula"]],
  ["455A", "Boredom", "1500", ["dynamic-programming"], ["1D DP"]],
  ["20C", "Dijkstra?", "1900", ["graphs"], ["dijkstra"]],
  ["165E", "Compatible Numbers", "2100", ["bit-manipulation"], ["bitmask DP"]]
];

const toCfProblem = ([platformId, title, rating, topics, patterns]) => {
  const match = String(platformId).match(/^(\d+)([A-Z]?)$/i);
  const contest = match?.[1] ?? "4";
  const index = match?.[2]?.toUpperCase() || "A";
  return {
    id: `codeforces-${contest}${index}-${slugify(title)}`,
    platform: "codeforces",
    platformId: `${contest}${index}`,
    title,
    url: `https://codeforces.com/problemset/problem/${contest}/${index}`,
  difficulty: rating,
  rating: Number(rating),
  topics,
  patterns,
  companies: [],
  level: Number(rating) < 1200 ? "newbie" : Number(rating) < 1600 ? "specialist" : "expert",
  status: "unseen",
  attempts: 0,
  confidence: 0,
  notes: "",
  mistakes: [],
  source: "cf-curated"
  };
};

const companyPatternMap = {
  netflix: ["arrays", "hashing", "heap", "strings"],
  uber: ["graphs", "heap", "dynamic-programming", "greedy", "arrays"],
  adobe: ["arrays", "strings", "dynamic-programming", "trees", "backtracking"],
  flipkart: ["arrays", "dynamic-programming", "graphs", "greedy"],
  amazon: ["arrays", "sliding-window", "trees", "graphs", "heap"],
  google: ["graphs", "dynamic-programming", "greedy", "binary-search"],
  microsoft: ["arrays", "strings", "trees", "dynamic-programming"],
  meta: ["arrays", "strings", "graphs", "dynamic-programming"]
};

const enrichCompanyTags = (problem) => {
  const companies = new Set(problem.companies ?? []);
  for (const [company, patterns] of Object.entries(companyPatternMap)) {
    const hit = patterns.some(
      (pattern) =>
        problem.topics?.some((topic) => topic.includes(pattern)) ||
        problem.patterns?.some((item) => item.toLowerCase().includes(pattern))
    );
    if (hit) companies.add(company);
  }
  if (problem.platform === "leetcode" && (problem.rating ?? 0) >= 1100 && (problem.rating ?? 0) <= 1700) {
    ["netflix", "uber", "adobe", "flipkart"].forEach((company) => companies.add(company));
  }
  return { ...problem, companies: [...companies] };
};

const merged = new Map();
for (const item of blind75.map((row) => toProblem(row, ["amazon", "google", "meta", "microsoft"]))) {
  merged.set(item.id, item);
}
for (const item of walkSheets(sheetsDir)) {
  if (item?.id) merged.set(item.id, { ...item, source: item.source ?? "sheet" });
}
for (const item of cfExtras.map(toCfProblem)) {
  merged.set(item.id, item);
}

const datasetsFile = path.join(root, "datasets", "cf-problems-sample.json");
if (fs.existsSync(datasetsFile)) {
  for (const item of fromJson(datasetsFile)) {
    if (item?.id) merged.set(item.id, { ...item, source: item.source ?? "dataset" });
  }
}

const output = [...merged.values()]
  .map(enrichCompanyTags)
  .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");

const blindPack = {
  title: "Blind 75",
  description: "High-frequency interview problems for local-first practice.",
  problems: output.filter((p) => p.source === "curated").map((p) => p.id)
};
const neetcodePack = {
  title: "NeetCode 150",
  description: "Extended interview curriculum beyond Blind 75.",
  problems: output.filter((p) => p.platform === "leetcode").map((p) => p.id).slice(0, 150)
};
const cfPack = {
  title: "CF Specialist Ladder",
  description: "Codeforces problems from 800 to 2100 for rating growth.",
  problems: output.filter((p) => p.platform === "codeforces").map((p) => p.id)
};
fs.writeFileSync(path.join(root, "packs", "blind-75.json"), `${JSON.stringify(blindPack, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(root, "packs", "neetcode-150.json"), `${JSON.stringify(neetcodePack, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(root, "packs", "cf-specialist.json"), `${JSON.stringify(cfPack, null, 2)}\n`, "utf8");
console.log(`Synced ${output.length} problems to ${path.relative(root, outFile)}`);
