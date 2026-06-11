import type { RoadmapNode } from "@cp-forge/schemas";
import type { ReactNode } from "react";
import React, { useState } from "react";

export interface MindmapProps {
  node: RoadmapNode;
  onToggle?: (id: string) => void;
  selectedId?: string;
}

export const MindmapTree = ({ node, onToggle, selectedId }: MindmapProps) => {
  const [open, setOpen] = useState(true);
  const selected = selectedId === node.id;

  return (
    <section className={`mindmap-node mindmap-node-${node.status} ${selected ? "mindmap-node-selected" : ""}`}>
      <button className="mindmap-node-title" onClick={() => setOpen((value) => !value)} type="button">
        <span>{node.children.length ? (open ? "▾" : "▸") : "•"}</span>
        <strong>{node.title}</strong>
        <small>{node.status.replaceAll("_", " ")}</small>
      </button>
      <div className="mindmap-progress" aria-label={`${node.title} progress ${node.progress}%`}>
        <span style={{ width: `${node.progress}%` }} />
      </div>
      <button className="mindmap-check" onClick={() => onToggle?.(node.id)} type="button">
        Mark progress
      </button>
      {open && node.children.length > 0 ? (
        <div className="mindmap-children">
          {node.children.map((child) => (
            <MindmapTree key={child.id} node={child} onToggle={onToggle} selectedId={selectedId} />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export const StatCard = ({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) => (
  <article className="stat-card">
    <span>{label}</span>
    <strong>{value}</strong>
    {detail ? <p>{detail}</p> : null}
  </article>
);

export const BarChart = ({ title, data }: { title: string; data: Record<string, number> }) => {
  const entries = Object.entries(data).slice(0, 8);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return (
    <section className="chart-panel">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="chart-empty">No solved data yet. Run `cp-forge launch` or import your `.cpforge` workspace.</p>
      ) : (
        entries.map(([label, value]) => (
          <div className="chart-row" key={label}>
            <span>{label}</span>
            <div>
              <i style={{ width: `${(value / max) * 100}%` }} />
            </div>
            <strong>{value}</strong>
          </div>
        ))
      )}
    </section>
  );
};

export const ActivityGrid = ({ title, data }: { title: string; data: Record<string, number> }) => {
  const entries = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-28);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return (
    <section className="chart-panel activity-grid-panel">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="chart-empty">Solve problems to build your activity grid.</p>
      ) : (
        <div className="activity-grid">
          {entries.map(([day, value]) => (
            <div
              className="activity-cell"
              key={day}
              style={{ opacity: 0.25 + (value / max) * 0.75 }}
              title={`${day}: ${value}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export { MindmapCanvas } from "./MindmapCanvas";
export { RadarChart } from "./RadarChart";
