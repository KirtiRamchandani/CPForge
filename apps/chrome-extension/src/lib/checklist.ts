export interface ChecklistWarning {
  title: string;
  why: string;
  fix: string;
  confidence: "high" | "medium" | "low";
}

export const analyzeCode = (code: string, language = "cpp"): ChecklistWarning[] => {
  const warnings: ChecklistWarning[] = [];
  const lines = code.split("\n");

  if (language === "cpp") {
    if (/\bint\b/.test(code) && /(\*|\+|\*\*|\^).*\bint\b/.test(code)) {
      warnings.push({
        title: "Integer overflow risk",
        why: "Multiplying or adding ints can overflow before widening.",
        fix: "Use long long for products and prefix sums.",
        confidence: "high"
      });
    }
    if (!/long long|int64|ll\b/i.test(code) && /\*\s*\w+\s*\*/.test(code)) {
      warnings.push({
        title: "Consider long long",
        why: "Products of ints often exceed 32-bit range in CP.",
        fix: "Cast operands to long long before multiply.",
        confidence: "medium"
      });
    }
    if (/cin\s*>>/.test(code) && !/ios::sync_with_stdio|tie\(nullptr\)|fastio/i.test(code)) {
      warnings.push({
        title: "Fast I/O not detected",
        why: "Large inputs may TLE with slow iostream sync.",
        fix: "Add ios::sync_with_stdio(false); cin.tie(nullptr);",
        confidence: "medium"
      });
    }
    if (/endl/.test(code)) {
      warnings.push({
        title: "Using endl",
        why: "endl flushes every line and can TLE.",
        fix: "Use '\\n' instead of endl.",
        confidence: "low"
      });
    }
    if (/while\s*\(\s*left\s*<=\s*right/.test(code) && /mid\s*=\s*\(\s*left\s*\+\s*right\s*\)\s*\/\s*2/.test(code) && !/left\s*=\s*mid\s*\+\s*1/.test(code)) {
      warnings.push({
        title: "Binary search boundary",
        why: "Inclusive bounds with mid = (l+r)/2 can infinite loop.",
        fix: "Use left = mid + 1 or switch to half-open interval.",
        confidence: "high"
      });
    }
    if (/%\s*\w+/.test(code) && !/\(\s*\w+\s*%/.test(code) && !/\+\s*\w+\s*\)/.test(code)) {
      warnings.push({
        title: "Modulo negative risk",
        why: "C++ modulo can be negative for negative operands.",
        fix: "Normalize: (x % m + m) % m",
        confidence: "medium"
      });
    }
  }

  if (/for\s*\([^)]*for\s*\(/.test(code) && /n\s*\*\s*n/.test(code)) {
    warnings.push({
      title: "Possible TLE",
      why: "Nested loops with n² pattern may exceed limits.",
      fix: "Target O(n log n) or better if n > 1e4.",
      confidence: "medium"
    });
  }

  if (/\[\s*1e5|\[\s*100000|\[\s*1<<20/.test(code)) {
    warnings.push({
      title: "Large static allocation",
      why: "Huge global arrays can MLE on some judges.",
      fix: "Use vectors sized to constraints or reuse buffers.",
      confidence: "medium"
    });
  }

  if (lines.some((line) => /visited|used|seen/.test(line) && !/fill|memset|assign\(.*0/.test(code))) {
    warnings.push({
      title: "Visited array may not reset",
      why: "Multi-test problems need cleared state.",
      fix: "fill(visited.begin(), visited.end(), false) each test.",
      confidence: "high"
    });
  }

  return warnings.slice(0, 8);
};

export const analyzePageTextareas = (): ChecklistWarning[] => {
  const areas = Array.from(document.querySelectorAll("textarea, .CodeMirror, .monaco-editor"));
  let code = "";
  for (const area of areas) {
    if (area instanceof HTMLTextAreaElement) code += area.value + "\n";
    else code += area.textContent ?? "";
  }
  if (!code.trim()) return [];
  const lang = location.hostname.includes("codeforces") ? "cpp" : "cpp";
  return analyzeCode(code, lang);
};
