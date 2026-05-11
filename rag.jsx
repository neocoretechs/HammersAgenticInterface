/* RAG semantic memory graph — force-ish layout, but seeded.
   Nodes pulse when freshly written; edges illuminate on focus. */

const { useState: useStateRG, useEffect: useEffectRG, useRef: useRefRG } = React;

function RagGraph({ nodes, edges, recentIds = [], onNodeClick }) {
  const ref = useRefRG(null);
  const [size, setSize] = useStateRG({ w: 600, h: 480 });
  const [hover, setHover] = useStateRG(null);
  const CC = window.MockData.CLUSTER_COLORS;

  useEffectRG(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const byId = {};
  nodes.forEach(n => byId[n.id] = n);

  // gentle drift so the graph feels alive
  const [t, setT] = useStateRG(0);
  useEffectRG(() => {
    let raf;
    const tick = () => { setT(x => x + 1); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const drift = (n, axis) => {
    const seed = (n.id.charCodeAt(1) || 1) + (axis === 'x' ? 0 : 7);
    return Math.sin((t / 80) + seed) * 4;
  };

  const px = (n) => n.x * size.w + drift(n, 'x');
  const py = (n) => n.y * size.h + drift(n, 'y');

  return (
    <div className="rag-stage" ref={ref}>
      <svg width="100%" height="100%" style={{ position:'absolute', inset:0 }}>
        {/* edges */}
        {edges.map(([a, b], i) => {
          const na = byId[a], nb = byId[b];
          if (!na || !nb) return null;
          const focused = hover && (hover === a || hover === b);
          return (
            <line
              key={i}
              x1={px(na)} y1={py(na)}
              x2={px(nb)} y2={py(nb)}
              stroke={focused ? 'var(--accent)' : 'var(--line-2)'}
              strokeWidth={focused ? 1.4 : 0.8}
              opacity={focused ? 0.9 : 0.5}
            />
          );
        })}
        {/* nodes */}
        {nodes.map(n => {
          const fresh = recentIds.includes(n.id);
          const r = 4 + Math.min(14, n.weight * 0.6);
          const color = CC[n.cluster] || '#999';
          return (
            <g key={n.id}
               onMouseEnter={() => setHover(n.id)}
               onMouseLeave={() => setHover(null)}
               onClick={() => onNodeClick && onNodeClick(n)}
               style={{ cursor:'pointer' }}>
              {fresh && (
                <circle cx={px(n)} cy={py(n)} r={r + 6} fill="none"
                        stroke={color} opacity={0.6}>
                  <animate attributeName="r" from={r} to={r + 18} dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={px(n)} cy={py(n)} r={r}
                      fill={color}
                      opacity={hover && hover !== n.id ? 0.5 : 1}
                      stroke="var(--bg-elev)" strokeWidth="1.5" />
              <text x={px(n) + r + 6} y={py(n) + 3.5}
                    fontFamily="var(--mono)" fontSize="10.5"
                    fill="var(--text-2)">
                {n.label}
                <tspan fill="var(--text-3)" fontSize="9.5"> ×{n.weight}</tspan>
              </text>
            </g>
          );
        })}
      </svg>

      <div className="rag-cluster-legend">
        <div style={{ color:'var(--text-3)', letterSpacing:'0.12em' }}>CLUSTERS</div>
        {Object.entries(CC).map(([k, v]) => (
          <div className="row" key={k}>
            <span className="swatch" style={{ background: v }} />
            <span>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.RagGraph = RagGraph;
