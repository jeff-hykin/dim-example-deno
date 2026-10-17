// Small themed SVG charts (Desktop's /theme.css colors), already loaded, so a new chart hot-loads with no new
// dependency (a new npm package would make Vite re-bundle deps and reload the page). docs/fast_edit.md.
import type { CSSProperties } from "react";

export interface Datum {
  label: string;
  value: number;
}

const palette = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)"];
const frame: CSSProperties = { width: "100%", display: "block", overflow: "visible" };
const text: CSSProperties = { fill: "var(--dim)", fontSize: 11, fontFamily: "inherit" };

/** Vertical bars, one per datum; `color` a CSS color (default: the theme's categorical colors in turn). */
export function BarChart(
  { data, height = 180, color, unit = "" }: {
    data: Datum[];
    height?: number;
    color?: string;
    unit?: string;
  },
) {
  const width = 600;
  const max = Math.max(1, ...data.map((d) => d.value));
  const band = width / Math.max(1, data.length);
  const plot = height - 34;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={frame} role="img">
      <line x1={0} x2={width} y1={plot + 4} y2={plot + 4} stroke="var(--border)" />
      {data.map((d, i) => {
        const h = (d.value / max) * (plot - 14);
        const x = i * band + band * 0.15;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={plot + 4 - h}
              width={band * 0.7}
              height={h}
              rx={3}
              fill={color ?? palette[i % palette.length]}
            />
            <text
              x={x + band * 0.35}
              y={plot - h - 2}
              textAnchor="middle"
              style={{ ...text, fill: "var(--fg)" }}
            >
              {d.value}
              {unit}
            </text>
            <text x={x + band * 0.35} y={height - 8} textAnchor="middle" style={text}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** A line through the data in order (labels along the bottom). */
export function LineChart(
  { data, height = 180, color = "var(--accent)", unit = "" }: {
    data: Datum[];
    height?: number;
    color?: string;
    unit?: string;
  },
) {
  const width = 600;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const plot = height - 34;
  const x = (
    i: number,
  ) => (data.length < 2 ? width / 2 : (i / (data.length - 1)) * (width - 40) + 20);
  const y = (v: number) => plot + 4 - ((v - min) / (max - min || 1)) * (plot - 14);
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={frame} role="img">
      <line x1={0} x2={width} y1={plot + 4} y2={plot + 4} stroke="var(--border)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r={3} fill={color} />
          <text
            x={x(i)}
            y={y(d.value) - 8}
            textAnchor="middle"
            style={{ ...text, fill: "var(--fg)" }}
          >
            {d.value}
            {unit}
          </text>
          <text x={x(i)} y={height - 8} textAnchor="middle" style={text}>{d.label}</text>
        </g>
      ))}
    </svg>
  );
}
