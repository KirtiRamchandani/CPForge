import { useEffect, useMemo, useState } from "react";

interface LcIndexProblem {
  id: string;
  t: string;
  u: string;
  d: string;
  r: number;
  tp: string[];
}

export const LeetCodeSearchPanel = () => {
  const [index, setIndex] = useState<LcIndexProblem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | undefined>();

  useEffect(() => {
    void fetch("/leetcode-search-index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("missing index"))))
      .then((data: { problems: LcIndexProblem[]; fetchedAt?: string }) => {
        setIndex(data.problems ?? []);
        setFetchedAt(data.fetchedAt);
      })
      .catch(() => setIndex([]))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return index
      .filter((p) => {
        const hay = [p.t, p.d, String(p.r), ...p.tp, p.id].join(" ").toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 80);
  }, [index, query]);

  return (
    <section className="cf-search-panel">
      <h2>
        LeetCode bank search · {loading ? "…" : `${index.length.toLocaleString()} free problems`}
        {fetchedAt ? <small className="feed-updated"> · updated {fetchedAt.slice(0, 10)}</small> : null}
      </h2>
      <input
        className="search-input"
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search LeetCode by title, difficulty, topic…"
        type="search"
        value={query}
      />
      {loading ? <p className="empty-sheet">Loading LeetCode index… Run cp-forge bank refresh if empty.</p> : null}
      {!loading && index.length === 0 ? (
        <p className="empty-sheet">No LeetCode index yet. Run <code>cp-forge bank refresh --leetcode</code>.</p>
      ) : null}
      {!loading && query.length >= 2 && results.length === 0 ? <p className="empty-sheet">No matches.</p> : null}
      <div className="problem-table">
        {results.map((p) => (
          <a href={p.u} key={p.id} rel="noreferrer" target="_blank">
            <strong>{p.t}</strong>
            <span>leetcode</span>
            <span>{p.d}</span>
            <small>{p.tp.join(", ")}</small>
          </a>
        ))}
      </div>
    </section>
  );
};
