/* Small reusable primitives. */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

function Sparkline({ values, color, height = 18, fillOpacity = 0.12 }) {
  if (!values || values.length === 0) return null;
  const w = 100;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1 || 1);
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return [x, y];
  });
  const d = pts.map(([x,y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const fill = `${d} L${w},${height} L0,${height} Z`;
  return (
    <svg className="tele-spark" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <path d={fill} fill={color} opacity={fillOpacity} />
      <path d={d} fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
}

function Icon({ name, size = 14 }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    className: 'icon',
  };
  switch (name) {
    case 'dashboard': return (
      <svg {...props}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
    );
    case 'log': return (
      <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    );
    case 'tele': return (
      <svg {...props}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>
    );
    case 'rag': return (
      <svg {...props}><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7.5 7.5L11 16.5M16.5 7.5L13 16.5M8 6h8"/></svg>
    );
    case 'settings': return (
      <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    );
    case 'cam': return (
      <svg {...props}><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
    );
    case 'arrow-left': return (
      <svg {...props}><path d="M15 5l-7 7 7 7"/></svg>
    );
    case 'arrow-up': return (
      <svg {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    );
    case 'arrow-right': return (
      <svg {...props}><path d="M9 5l7 7-7 7"/></svg>
    );
    case 'home': return (
      <svg {...props}><path d="M3 11l9-8 9 8M5 9v11h14V9"/></svg>
    );
    case 'patrol': return (
      <svg {...props}><circle cx="12" cy="12" r="8"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/></svg>
    );
    case 'dock': return (
      <svg {...props}><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M12 14V4M8 8l4-4 4 4"/></svg>
    );
    case 'stop': return (
      <svg {...props}><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
    );
    case 'send': return (
      <svg {...props}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
    );
    default: return null;
  }
}

window.UI = { Sparkline, Icon };
