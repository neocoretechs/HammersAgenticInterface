/* Secondary views: Event Log (full), Telemetry (charts), RAG (graph), Settings */

const { useState: vS, useEffect: vE, useMemo: vM } = React;
const { Sparkline: SparklineV, Icon: IconV } = window.UI;
const { RagGraph } = window;
const { RAG_SEED, RAG_EDGES } = window.MockData;

function EventLogView({ events }) {
  return (
    <div className="card">
      <div className="card-head">
        <span>EVENT LOG · AG-UI MESSAGE BUS</span>
        <span className="right" style={{ color:'var(--text-3)' }}>{events.length} events</span>
      </div>
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        {events.length === 0 && <div className="view-empty">Waiting on event stream…</div>}
        {events.map((e, i) => (
          <div className="evt-row" key={e.id}>
            <span className="ts">{new Date(e.t).toLocaleTimeString('en-GB')}</span>
            <span className={`src ${e.src}`}>{e.src.toUpperCase()}</span>
            <span className="body">{e.body}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TelemetryView({ tele }) {
  return (
    <>
      <div className="card">
        <div className="card-head"><span>TELEMETRY · MOTION</span></div>
        <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <div>
            <div className="tele-label">Linear velocity (m/s)</div>
            <div className="tele-value">{tele.speed.toFixed(2)}</div>
            <div style={{ height: 80 }}>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
                <SparklineInner values={tele.speedHist} color="var(--text)" h={40} />
              </svg>
            </div>
          </div>
          <div>
            <div className="tele-label">Angular velocity (rad/s)</div>
            <div className="tele-value">{tele.angular.toFixed(2)}</div>
            <div style={{ height: 80 }}>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
                <SparklineInner values={tele.angularHist} color="var(--info)" h={40} />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><span>TELEMETRY · COMPUTE</span></div>
        <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24 }}>
          {[
            ['CPU load', tele.cpu, '%', 'var(--text)'],
            ['NPU load', tele.npu, '%', 'var(--info)'],
            ['Battery', tele.battery, '%', 'var(--accent)'],
          ].map(([label, value, unit, color]) => (
            <div key={label}>
              <div className="tele-label">{label}</div>
              <div className="tele-value">{value}<span className="unit">{unit}</span></div>
              <div className="tele-bar"><span style={{ width: value + '%', background: color }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-head"><span>TELEMETRY · YOLO</span></div>
        <div style={{ padding:'14px 16px' }}>
          <div className="tele-label">Detections / minute</div>
          <div className="tele-value">{tele.dpm}</div>
          <div style={{ height: 60, marginTop: 6 }}>
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
              <SparklineInner values={tele.detsHist} color="var(--accent)" h={30} />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}

function SparklineInner({ values, color, h }) {
  if (!values || values.length === 0) return null;
  const w = 100;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1 || 1);
  const pts = values.map((v, i) => [i * step, h - ((v - min) / range) * (h - 2) - 1]);
  const d = pts.map(([x,y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const fill = `${d} L${w},${h} L0,${h} Z`;
  return (
    <>
      <path d={fill} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
    </>
  );
}

function RagView({ ragNodes, ragRecent }) {
  const [selected, setSelected] = vS(null);
  return (
    <>
      <div className="card">
        <div className="card-head">
          <span>RAG · SEMANTIC MEMORY</span>
          <span style={{ marginLeft: 8, color:'var(--text-3)', textTransform:'none', letterSpacing:0 }}>
            llama.cpp · embed-mxbai · {ragNodes.length} nodes · {RAG_EDGES.length} edges
          </span>
          <span className="right" style={{ color:'var(--text-3)' }}>scrolling write log →</span>
        </div>
        <div style={{ padding: 12 }}>
          <RagGraph nodes={ragNodes} edges={RAG_EDGES} recentIds={ragRecent} onNodeClick={setSelected} />
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <span>{selected ? `NODE · ${selected.label}` : 'NODE INSPECTOR'}</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          {selected ? (
            <pre style={{
              fontFamily:'var(--mono)', fontSize:12, margin:0,
              color:'var(--text-2)', whiteSpace:'pre-wrap'
            }}>
{`{
  "id": "${selected.id}",
  "label": "${selected.label}",
  "cluster": "${selected.cluster}",
  "weight": ${selected.weight},
  "first_seen_t": "+${selected.t}s",
  "embedding_dim": 768,
  "edges": ${JSON.stringify(RAG_EDGES.filter(e => e.includes(selected.id)).map(e => e[0] === selected.id ? e[1] : e[0]))}
}`}
            </pre>
          ) : (
            <div className="view-empty" style={{ padding: '20px 0' }}>
              Click a node in the graph to inspect it.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SettingsView() {
  return (
    <div className="card">
      <div className="card-head"><span>SETTINGS · ENDPOINTS</span></div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="endpoint-bar">
          <span className="meth">WS</span>
          <span className="url">ws://rover.local:8765/api/yolo/stream</span>
          <span className="status">● connected</span>
        </div>
        <div className="endpoint-bar">
          <span className="meth">SSE</span>
          <span className="url">http://rover.local:8080/agui/events</span>
          <span className="status">● connected</span>
        </div>
        <div className="endpoint-bar">
          <span className="meth">POST</span>
          <span className="url">http://rover.local:8080/a2ui/render</span>
          <span className="status">● 200 OK · 12ms</span>
        </div>
        <div className="endpoint-bar">
          <span className="meth">POST</span>
          <span className="url">http://rover.local:8080/cmd/macro</span>
          <span className="status">● 200 OK</span>
        </div>
        <div className="endpoint-bar">
          <span className="meth">GET</span>
          <span className="url">http://rover.local:8080/rag/graph</span>
          <span className="status">● 200 OK · 4ms</span>
        </div>
      </div>
      <div className="card-head" style={{ borderTop: '1px solid var(--line)' }}><span>STACK</span></div>
      <div style={{ padding: '14px 16px', fontFamily:'var(--mono)', fontSize:12, color:'var(--text-2)', lineHeight: 1.8 }}>
        <div>Inference  · llama.cpp · gemini-2.0-flash · qwen2.5-vl-7b</div>
        <div>Vision     · YOLO v11 · RK3588 NPU · 30fps · 1280×720</div>
        <div>Backend    · Java 21 · C++ 20 · gRPC over UNIX socket</div>
        <div>Renderer   · React 18 · A2UI v0.4 · AG-UI v0.2</div>
        <div>Storage    · sqlite-vec · 768d · cosine</div>
      </div>
    </div>
  );
}

window.Views = { EventLogView, TelemetryView, RagView, SettingsView };
