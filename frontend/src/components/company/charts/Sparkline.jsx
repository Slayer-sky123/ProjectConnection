import React, { useMemo, useState } from "react";

/**
 * Premium sparkline with grid, average line, area fill & tooltip.
 * Props:
 *  - label: string
 *  - color: hex
 *  - data: [{x: epochMs, y: number}]
 */
export default function Sparkline({ label = "", color = "#3b82f6", data = [] }) {
  const pad = 10, viewW = 360, viewH = 100;
  const innerW = viewW - pad * 2, innerH = viewH - pad * 2;

  if (!data?.length) {
    return (
      <div className="rounded-xl border bg-slate-50 p-3 text-xs text-slate-600">
        {label ? `${label}: ` : ""}No data
      </div>
    );
  }

  const xs = data.map(p => p.x), ys = data.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const mapX = (x) => pad + ((x - minX) / spanX) * innerW;
  const mapY = (y) => pad + innerH - ((y - minY) / spanY) * innerH;

  const pts = useMemo(() => data.map(p => [mapX(p.x), mapY(p.y)]), [data]);  
  const pathLine = "M " + pts.map(p => p.join(",")).join(" L ");
  const area = `M ${pts[0][0]},${mapY(minY)} ` + pts.map(p => `L ${p[0]},${p[1]}`).join(" ") + ` L ${pts[pts.length-1][0]},${mapY(minY)} Z`;
  const avg = ys.reduce((a,b)=>a+b,0) / ys.length;
  const latest = data[data.length - 1];

  // tooltip
  const [tip, setTip] = useState(null);
  const onMove = (evt) => {
    const svg = evt.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    let best = null, bestD = Infinity;
    data.forEach((p, idx) => {
      const dx = mapX(p.x) - loc.x;
      const dy = mapY(p.y) - loc.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestD) { bestD = d2; best = { ...p, idx }; }
    });
    if (best) setTip({ x: mapX(best.x), y: mapY(best.y), raw: best });
  };
  const clearTip = () => setTip(null);

  const gradId = `spark-grad-${hash(label)}`;

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      {label && <div className="text-[12px] text-slate-600 mb-2">{label}</div>}
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full h-[110px]"
        onMouseMove={onMove}
        onMouseLeave={clearTip}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* grid bands */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = pad + (i/4) * innerH;
          return <line key={i} x1={pad} y1={y} x2={viewW - pad} y2={y} stroke="#e2e8f0" />;
        })}

        {/* average line */}
        <line x1={pad} y1={mapY(avg)} x2={viewW - pad} y2={mapY(avg)} stroke={color} strokeDasharray="3,3" opacity="0.5" />
        <rect x={viewW - pad - 60} y={mapY(avg) - 9} width="56" height="18" rx="6" fill="white" stroke="#e2e8f0" />
        <text x={viewW - pad - 32} y={mapY(avg) + 4} textAnchor="middle" fontSize="10" fill="#0f172a">avg {fmt(avg)}</text>

        {/* area + line */}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={pathLine} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

        {/* points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
        ))}

        {/* latest chip */}
        <g transform={`translate(${mapX(latest.x)}, ${mapY(latest.y)})`}>
          <circle r="3.5" fill={color} />
          <g transform="translate(8, -14)">
            <rect width="64" height="22" rx="6" fill="#0b1220" opacity="0.9" />
            <text x="32" y="14" textAnchor="middle" fontSize="10" fill="white">
              {fmt(latest.y)}
            </text>
          </g>
        </g>

        {/* tooltip */}
        {tip && (
          <g>
            <line x1={tip.x} y1={pad} x2={tip.x} y2={viewH - pad} stroke="#cbd5e1" strokeDasharray="3,3" />
            <circle cx={tip.x} cy={tip.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
            <Tooltip x={tip.x} y={tip.y} lines={[fmtDate(tip.raw.x), `value: ${fmt(tip.raw.y)}`]} />
          </g>
        )}
      </svg>
    </div>
  );
}

function fmt(v) {
  if (Math.abs(v) >= 1000000) return (v/1000000).toFixed(1) + "M";
  if (Math.abs(v) >= 1000) return (v/1000).toFixed(1) + "k";
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
function fmtDate(ms) {
  try { return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  catch { return String(ms); }
}
function hash(s=""){ let h=0; for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i); h|=0;} return Math.abs(h); }

function Tooltip({ x, y, lines=[] }) {
  const padding = 6, width = 120, height = 36 + (Math.max(0, lines.length-2)*12);
  const bx = Math.min(Math.max(x + 8, 8), 360 - width - 8);
  const by = Math.max(y - height - 8, 8);
  return (
    <g>
      <rect x={bx} y={by} width={width} height={height} rx="8" fill="#0b1220" opacity="0.96" />
      {lines.map((t,i)=>(
        <text key={i} x={bx + padding} y={by + padding + 12 + i*12} fontSize="11" fill="#e5e7eb">{t}</text>
      ))}
    </g>
  );
}
