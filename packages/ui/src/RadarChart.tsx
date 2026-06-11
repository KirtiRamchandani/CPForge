export const RadarChart = ({
  title,
  data
}: {
  title: string;
  data: Record<string, number>;
}) => {
  const entries = Object.entries(data).slice(0, 8);
  if (entries.length === 0) {
    return (
      <section className="chart-panel">
        <h2>{title}</h2>
        <p className="chart-empty">No readiness data yet. Solve company-tagged problems to fill the radar.</p>
      </section>
    );
  }

  const size = 220;
  const center = size / 2;
  const radius = 82;
  const levels = [25, 50, 75, 100];
  const angleStep = (Math.PI * 2) / entries.length;

  const pointAt = (index: number, value: number) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const r = (value / 100) * radius;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r
    };
  };

  const polygon = entries
    .map(([, value], index) => {
      const { x, y } = pointAt(index, value);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="chart-panel radar-panel">
      <h2>{title}</h2>
      <svg aria-label={title} className="radar-chart" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        {levels.map((level) => (
          <polygon
            key={level}
            fill="none"
            points={entries
              .map((_, index) => {
                const { x, y } = pointAt(index, level);
                return `${x},${y}`;
              })
              .join(" ")}
            stroke="#2a3550"
            strokeWidth="1"
          />
        ))}
        {entries.map(([label], index) => {
          const outer = pointAt(index, 100);
          const inner = { x: center, y: center };
          return (
            <line
              key={label}
              stroke="#2a3550"
              strokeWidth="1"
              x1={inner.x}
              x2={outer.x}
              y1={inner.y}
              y2={outer.y}
            />
          );
        })}
        <polygon fill="rgba(66, 211, 146, 0.35)" points={polygon} stroke="#42d392" strokeWidth="2" />
        {entries.map(([label, value], index) => {
          const labelPoint = pointAt(index, 112);
          return (
            <text
              className="radar-label"
              dominantBaseline="middle"
              key={label}
              textAnchor="middle"
              x={labelPoint.x}
              y={labelPoint.y}
            >
              {label.slice(0, 10)}
            </text>
          );
        })}
      </svg>
      <ul className="radar-legend">
        {entries.map(([label, value]) => (
          <li key={label}>
            <span>{label}</span>
            <strong>{value}%</strong>
          </li>
        ))}
      </ul>
    </section>
  );
};
