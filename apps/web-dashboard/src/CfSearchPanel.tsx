import { useEffect, useMemo, useState } from "react";

interface CfIndexProblem {
  id: string;
  t: string;
  u: string;
  r: number;
  tp: string[];
}

export const CfSearchPanel = () => {
  const [index, setIndex] = useState<CfIndexProblem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/cf-search-index.json")
      .then((r) => r.json())
      .then((data: { problems: CfIndexProblem[] }) => setIndex(data.problems ?? []))
      .catch(() => setIndex([]))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return index
      .filter((p) => {
        const hay = [p.t, String(p.r), ...p.tp, p.id].join(" ").toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 80);
  }, [index, query]);

  return (
    <section className="cf-search-panel">
      <h2>Codeforces bank search · {loading ? "…" : `${index.length.toLocaleString()} problems`}</h2>
      <input
        className="search-input"
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search 11k+ Codeforces problems by title, rating, tag…"
        type="search"
        value={query}
      />
      {loading ? <p className="empty-sheet">Loading CF index…</p> : null}
      {!loading && query.length >= 2 && results.length === 0 ? <p className="empty-sheet">No matches.</p> : null}
      <div className="problem-table">
        {results.map((p) => (
          <a href={p.u} key={p.id} rel="noreferrer" target="_blank">
            <strong>{p.t}</strong>
            <span>codeforces</span>
            <span>{p.r || "—"}</span>
            <small>{p.tp.join(", ")}</small>
          </a>
        ))}
      </div>
    </section>
  );
};
