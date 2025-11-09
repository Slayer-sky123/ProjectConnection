import React, { useMemo, useState } from "react";

/**
 * Premium tiny multi-series line chart (pure SVG, no deps).
 * Props:
 *  - title: string
 *  - series: [{ name, color?, data: [{x: epochMs, y: number}] }]
 * Styling:
 *  - Soft grid, area fill, latest chip, average line
 *  - Hover tooltip (pure SVG)
 */
export default function MiniCharts({ title = "Chart", series = [] }) {
  const pad = 10;               // inner padding
  const viewW = 360, viewH = 120; // responsive via viewBox
  const innerW = viewW - pad * 2;
  const innerH = viewH - pad * 2;

  const all = useMemo(() => series.flatMap(s => s.data || []), [series]);
  if (!all.length) {
    return (
      <div className="rounded-2xl border bg-slate-50 p-4 text-xs text-slate-600">
        No data yet
      </div>
    );
  }

  // bounds
  const xs = all.map(p => p.x);
  const ys = all.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const mapX = (x) => pad + ((x - minX) / spanX) * innerW;
  const mapY = (y) => pad + innerH - ((y - minY) / spanY) * innerH;

  // axis ticks (4 horizontal bands)
  const bands = 4;
  const ticksY = Array.from({ length: bands + 1 }, (_, i) => minY + (i / bands) * (maxY - minY));

  // tooltip state
  const [tip, setTip] = useState(null);
  const onMove = (evt) => {
    const svg = evt.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    // find nearest point across all series
    let best = null, bestD = Infinity, bestSeries = null;
    series.forEach((s, sIdx) => {
      (s.data || []).forEach((p, idx) => {
        const dx = mapX(p.x) - loc.x;
        const dy = mapY(p.y) - loc.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestD) {
          bestD = d2; best = { ...p, idx }; bestSeries = { name: s.name || `Series ${sIdx+1}`, color: s.color || palette[sIdx % palette.length] };
        }
      });
    });
    if (best) {
      setTip({
        x: mapX(best.x),
        y: mapY(best.y),
        raw: best,
        series: bestSeries,
      });
    }
  };
  const clearTip = () => setTip(null);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-slate-600">{title}</div>
        {/* legend */}
        <div className="flex items-center gap-2">
          {series.map((s, i) => (
            <span key={s.name || i} className="inline-flex items-center gap-1 text-[11px] text-slate-600">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: s.color || palette[i % palette.length] }}
              />
              {s.name || `S${i+1}`}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full h-[140px]"
        onMouseMove={onMove}
        onMouseLeave={clearTip}
      >
        {/* bg */}
        <defs>
          {series.map((s, i) => {
            const color = s.color || palette[i % palette.length];
            const id = `grad-${hash(title + (s.name||i))}`;
            return (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.20" />
                <stop offset="100%" stopColor={color} stopOpacity="0.00" />
              </linearGradient>
            );
          })}
        </defs>

        {/* grid horizontal */}
        {ticksY.map((ty, i) => {
          const y = mapY(ty);
          return (
            <g key={i}>
              <line x1={pad} y1={y} x2={viewW - pad} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={pad - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#64748b">
                {fmtTick(ty)}
              </text>
            </g>
          );
        })}

        {/* average line for each series */}
        {series.map((s, i) => {
          const color = s.color || palette[i % palette.length];
          const vals = (s.data || []).map(d => d.y);
          const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
          if (avg == null) return null;
          const y = mapY(avg);
          return (
            <g key={`avg-${i}`}>
              <line x1={pad} y1={y} x2={viewW - pad} y2={y} stroke={color} strokeDasharray="3,3" opacity="0.5" />
              <rect x={viewW - pad - 64} y={y - 9} width="60" height="18" rx="6" fill="white" stroke="#e2e8f0" />
              <text x={viewW - pad - 34} y={y + 4} textAnchor="middle" fontSize="10" fill="#0f172a">
                avg {fmtTick(avg)}
              </text>
            </g>
          );
        })}

        {/* series: area + line + circles + latest chip */}
        {series.map((s, i) => {
          const color = s.color || palette[i % palette.length];
          const pts = (s.data || []).map(p => [mapX(p.x), mapY(p.y)]);
          if (!pts.length) return null;

          const pathLine = "M " + pts.map(p => p.join(",")).join(" L ");
          const area = `M ${pts[0][0]},${mapY(minY)} ` + pts.map(p => `L ${p[0]},${p[1]}`).join(" ") + ` L ${pts[pts.length-1][0]},${mapY(minY)} Z`;

          const latest = (s.data || [])[s.data.length - 1];
          const latestX = mapX(latest.x);
          const latestY = mapY(latest.y);
          const gradId = `grad-${hash(title + (s.name||i))}`;

          return (
            <g key={s.name || i}>
              <path d={area} fill={`url(#${gradId})`} />
              <path d={pathLine} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
              {pts.map((p, idx) => (
                <circle key={idx} cx={p[0]} cy={p[1]} r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
              ))}
              {/* latest chip */}
              <g transform={`translate(${latestX}, ${latestY})`}>
                <circle r="3.5" fill={color} />
                <g transform="translate(8, -14)">
                  <rect width="64" height="22" rx="6" fill="#0b1220" opacity="0.9" />
                  <text x="32" y="14" textAnchor="middle" fontSize="10" fill="white">
                    {fmtTick(latest.y)}
                  </text>
                </g>
              </g>
            </g>
          );
        })}

        {/* tooltip (nearest point) */}
        {tip && (
          <g>
            <line
              x1={tip.x} y1={pad}
              x2={tip.x} y2={viewH - pad}
              stroke="#cbd5e1" strokeDasharray="3,3"
            />
            <circle cx={tip.x} cy={tip.y} r="4" fill="#fff" stroke={tip.series.color} strokeWidth="2" />
            <Tooltip x={tip.x} y={tip.y} lines={[
              tip.series.name,
              `x: ${fmtDate(tip.raw.x)}`,
              `y: ${fmtTick(tip.raw.y)}`
            ]} />
          </g>
        )}
      </svg>
    </div>
  );
}

const palette = ["#3b82f6", "#10b981", "#a78bfa", "#f59e0b", "#ef4444", "#14b8a6"];

function fmtTick(v) {
  // Nice short number format
  if (Math.abs(v) >= 1000000) return (v/1000000).toFixed(1) + "M";
  if (Math.abs(v) >= 1000) return (v/1000).toFixed(1) + "k";
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
function fmtDate(ms) {
  try {
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return String(ms); }
}
function hash(s = "") {
  let h = 0; for (let i=0;i<s.length;i++){ h = (h<<5)-h + s.charCodeAt(i); h|=0; }
  return Math.abs(h);
}

function Tooltip({ x, y, lines = [] }) {
  const padding = 6, width = 130, height = 44 + (Math.max(0, lines.length - 2) * 12);
  const bx = Math.min(Math.max(x + 8, 8), 360 - width - 8);
  const by = Math.max(y - height - 8, 8);
  return (
    <g>
      <rect x={bx} y={by} width={width} height={height} rx="8" fill="#0b1220" opacity="0.96" />
      {lines.map((t, i) => (
        <text key={i} x={bx + padding} y={by + padding + 12 + i * 12} fontSize="11" fill="#e5e7eb">
          {t}
        </text>
      ))}
    </g>
  );
}
