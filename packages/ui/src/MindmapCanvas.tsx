import type { RoadmapNode } from "@cp-forge/schemas";
import React, { useCallback, useRef, useState } from "react";

export interface MindmapCanvasProps {
  node: RoadmapNode;
  onToggle?: (id: string) => void;
}

export const MindmapCanvas = ({ node, onToggle }: MindmapCanvasProps) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 40, y: 40 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const layout = layoutTree(node);

  const onWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    setScale((value) => Math.min(2.5, Math.max(0.4, value - event.deltaY * 0.001)));
  }, []);

  const onPointerDown = (event: React.PointerEvent) => {
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (event.clientX - drag.current.x),
      y: drag.current.oy + (event.clientY - drag.current.y)
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="mindmap-canvas-shell">
      <div className="mindmap-canvas-toolbar">
        <button onClick={() => setScale((s) => Math.min(2.5, s + 0.1))} type="button">
          Zoom +
        </button>
        <button onClick={() => setScale((s) => Math.max(0.4, s - 0.1))} type="button">
          Zoom −
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 40, y: 40 });
          }}
          type="button"
        >
          Reset
        </button>
        <span>{Math.round(scale * 100)}%</span>
      </div>
      <svg
        className="mindmap-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        role="img"
      >
        <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
          {layout.edges.map((edge) => (
            <line key={edge.id} stroke="#2b3a58" strokeWidth={2} x1={edge.x1} x2={edge.x2} y1={edge.y1} y2={edge.y2} />
          ))}
          {layout.nodes.map((item) => (
            <g key={item.id} transform={`translate(${item.x},${item.y})`}>
              <rect className={`mindmap-canvas-node mindmap-node-${item.status}`} height={56} rx={8} width={180} />
              <text fill="#e9f1ff" fontSize={12} fontWeight={700} x={10} y={22}>
                {truncate(item.title, 22)}
              </text>
              <text fill="#8fa3c4" fontSize={10} x={10} y={38}>
                {item.progress}% · {item.status.replaceAll("_", " ")}
              </text>
              <rect fill="#1b2942" height={6} rx={3} width={160} x={10} y={44} />
              <rect fill="#42d392" height={6} rx={3} width={(160 * item.progress) / 100} x={10} y={44} />
              {onToggle ? (
                <text
                  fill="#42d392"
                  fontSize={11}
                  onClick={() => onToggle(item.id)}
                  style={{ cursor: "pointer" }}
                  x={10}
                  y={54}
                >
                  + progress
                </text>
              ) : null}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

interface LayoutNode {
  id: string;
  title: string;
  status: string;
  progress: number;
  x: number;
  y: number;
}

interface LayoutEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const layoutTree = (root: RoadmapNode) => {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const xGap = 220;
  const yGap = 80;

  const walk = (node: RoadmapNode, depth: number, row: { value: number }): number => {
    const y = row.value * yGap;
    const x = depth * xGap;
    nodes.push({ id: node.id, title: node.title, status: node.status, progress: node.progress, x, y });
    if (node.children.length === 0) {
      row.value += 1;
      return y + 28;
    }
    let firstChildY = row.value * yGap;
    for (const child of node.children) {
      const childY = walk(child, depth + 1, row);
      edges.push({ id: `${node.id}-${child.id}`, x1: x + 180, y1: y + 28, x2: x + xGap, y2: childY + 28 });
    }
    return firstChildY;
  };

  walk(root, 0, { value: 0 });
  return { nodes, edges };
};

const truncate = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);
