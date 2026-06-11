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
  }
  return problems;
};

const merged = new Map();
for (const item of blind75.map((row) => toProblem(row, ["amazon", "google", "meta", "microsoft"]))) {
  merged.set(item.id, item);
}
for (const item of walkSheets(sheetsDir)) {
  if (item?.id) merged.set(item.id, { ...item, source: item.source ?? "sheet" });
}

const output = [...merged.values()].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");

const blindPack = {
  title: "Blind 75",
  description: "High-frequency interview problems for local-first practice.",
  problems: output.filter((p) => p.source === "curated").map((p) => p.id)
};
fs.writeFileSync(path.join(root, "packs", "blind-75.json"), `${JSON.stringify(blindPack, null, 2)}\n`, "utf8");
console.log(`Synced ${output.length} problems to ${path.relative(root, outFile)}`);
