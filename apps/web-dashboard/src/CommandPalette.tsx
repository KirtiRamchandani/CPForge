import { computeAchievements } from "@cp-forge/analytics-engine";
import type { Achievement } from "@cp-forge/analytics-engine";
import { useEffect, useMemo, useState } from "react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  pages: string[];
  onNavigate: (page: string) => void;
  onAction: (action: string) => void;
}

export const CommandPalette = ({ open, onClose, pages, onNavigate, onAction }: CommandPaletteProps) => {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const actions = [
      { label: "Why am I stuck?", action: "stuck" },
      { label: "Export dashboard JSON", action: "export" },
      { label: "Load demo data", action: "demo" },
      { label: "Import .cpforge file", action: "import" }
    ];
    const q = query.trim().toLowerCase();
    const nav = pages.map((page) => ({ label: `Go to ${page}`, action: `nav:${page}` }));
    return [...nav, ...actions.map((a) => ({ label: a.label, action: a.action }))].filter((item) =>
      !q ? true : item.label.toLowerCase().includes(q)
    );
  }, [pages, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) onClose();
      }
      if (event.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="palette-backdrop" onClick={onClose} role="presentation">
      <div className="palette" onClick={(event) => event.stopPropagation()} role="dialog">
        <input
          autoFocus
          className="palette-input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages and actions…"
          type="search"
          value={query}
        />
        <ul className="palette-list">
          {items.map((item) => (
            <li key={item.action}>
              <button
                onClick={() => {
                  if (item.action.startsWith("nav:")) onNavigate(item.action.slice(4));
                  else onAction(item.action);
                  onClose();
                }}
                type="button"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="palette-hint">Esc to close · Ctrl+K toggles palette</p>
      </div>
    </div>
  );
};

export const AchievementGrid = ({ achievements }: { achievements: Achievement[] }) => (
  <section className="achievement-grid">
    {achievements.map((badge) => (
      <article className={badge.unlocked ? "achievement unlocked" : "achievement"} key={badge.id} title={badge.detail}>
        <span>{badge.emoji}</span>
        <strong>{badge.title}</strong>
        <small>{badge.detail}</small>
      </article>
    ))}
  </section>
);

export { computeAchievements };
