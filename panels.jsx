/* Camera feed, Detection list, Robot Commands, Telemetry sidebar */

const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;
const { Sparkline, Icon } = window.UI;

/* ---------- Camera ---------- */
function CameraFeed({ detections, paused }) {
  return (
    <div className="card camera-card">
      <div className="card-head">
        <span>CAMERA FEED — YOLO v11</span>
        <span style={{ marginLeft: 8, color:'var(--text-3)', textTransform:'none', letterSpacing:0 }}>
          /api/yolo/stream
        </span>
        <span className="right">
          <span className="status-pill">
            <span className="status-dot" />
            {paused ? 'PAUSED' : 'LIVE'}
          </span>
        </span>
      </div>
      <div className="camera-stage">
        <div className="camera-overlay-corner tl">FRAME {detections[0]?.frame_id ?? '—'}</div>
        <div className="camera-overlay-corner tr">RK3588.NPU0 · 30fps</div>
        <div className="camera-overlay-corner bl">1280×720 · MJPEG</div>
        <div className="camera-overlay-corner br">{detections.length} OBJ</div>
        <div className="crosshair" />
        <div className="scan-line" />
        <div className="camera-center">
          <Icon name="cam" size={32} />
          <span>MJPEG STREAM · 1280×720 · 30fps</span>
        </div>
        {detections.slice(0, 6).map((d, i) => {
          const cls = d.object.cluster;
          const c = cls === 'electronics' ? 'c2' : cls === 'people' ? 'c3' : '';
          const b = d.object.bbox;
          return (
            <div key={d.frame_id + '-' + i}
                 className={`bbox ${c}`}
                 style={{
                   left: `${b.x * 100}%`,
                   top: `${b.y * 100}%`,
                   width: `${b.w * 100}%`,
                   height: `${b.h * 100}%`,
                 }}>
              <div className="lbl">{d.object.class}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Detection list ---------- */
function DetectionStream({ detections }) {
  return (
    <div className="card">
      <div className="card-head">
        <span>YOLO DETECTION STREAM</span>
        <span className="right" style={{ color:'var(--text-3)' }}>{detections.length} objects</span>
      </div>
      <div>
        {detections.slice(0, 6).map((d, i) => {
          const time = new Date(d.t).toLocaleTimeString('en-GB');
          return (
            <div key={d.t + '-' + i} className={`det-row ${i === 0 ? 'fresh' : ''}`}>
              <span className="conf">{Math.round(d.object.confidence * 100)}%</span>
              <span className="lbl">{d.object.class}</span>
              <span className="raw">{d.object.confidence.toFixed(2)}</span>
              <span className="ts">{time}</span>
            </div>
          );
        })}
        {detections.length === 0 && (
          <div className="view-empty">No detections yet — waiting on /api/yolo/stream</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Robot Commands ---------- */
function RobotCommands({ onMacro, lastCommand, armedMacro }) {
  return (
    <div className="card">
      <div className="card-head">
        <span>ROBOT COMMANDS</span>
        <span className="right" style={{ color:'var(--text-3)' }}>
          — {lastCommand ?? 'no command sent'}
        </span>
      </div>
      <div className="cmd-grid">
        <button className="cmd-btn" onClick={() => onMacro('TURN_LEFT')}>
          <span className="glyph"><Icon name="arrow-left" size={18} /></span>
          <span>TURN LEFT</span>
        </button>
        <button className="cmd-btn" onClick={() => onMacro('FORWARD')}>
          <span className="glyph"><Icon name="arrow-up" size={18} /></span>
          <span>FORWARD</span>
        </button>
        <button className="cmd-btn" onClick={() => onMacro('TURN_RIGHT')}>
          <span className="glyph"><Icon name="arrow-right" size={18} /></span>
          <span>TURN RIGHT</span>
        </button>

        <button className={`cmd-btn macro ${armedMacro==='PATROL'?'armed':''}`} onClick={() => onMacro('PATROL')}>
          <span className="glyph"><Icon name="patrol" size={18} /></span>
          <span>PATROL</span>
        </button>
        <button className={`cmd-btn macro ${armedMacro==='RETURN_HOME'?'armed':''}`} onClick={() => onMacro('RETURN_HOME')}>
          <span className="glyph"><Icon name="home" size={18} /></span>
          <span>RETURN HOME</span>
        </button>
        <button className={`cmd-btn macro ${armedMacro==='DOCK'?'armed':''}`} onClick={() => onMacro('DOCK')}>
          <span className="glyph"><Icon name="dock" size={18} /></span>
          <span>DOCK</span>
        </button>

        <button className="cmd-btn danger" style={{ gridColumn:'1 / -1' }} onClick={() => onMacro('E-STOP')}>
          <span className="glyph"><Icon name="stop" size={16} /></span>
          <span>EMERGENCY STOP</span>
        </button>
      </div>
    </div>
  );
}

/* ---------- Sidebar telemetry ---------- */
function TelemetryRail({ tele }) {
  const speedHist = tele.speedHist;
  const detsHist = tele.detsHist;
  return (
    <>
      <div className="nav-section-title">LIVE TELEMETRY</div>
      <div className="tele-card">
        <div className="tele-label">Speed</div>
        <div className="tele-value">{tele.speed.toFixed(2)}<span className="unit">m/s</span></div>
        <Sparkline values={speedHist} color="var(--text)" />
      </div>
      <div className="tele-card">
        <div className="tele-label">Battery</div>
        <div className="tele-value">{tele.battery}<span className="unit">%</span></div>
        <div className="tele-bar"><span style={{ width: tele.battery + '%' }} /></div>
      </div>
      <div className="tele-card">
        <div className="tele-label">Detections / min</div>
        <div className="tele-value">{tele.dpm}</div>
        <Sparkline values={detsHist} color="var(--accent)" fillOpacity={0.18}/>
      </div>
      <div className="tele-card">
        <div className="tele-label">Uptime</div>
        <div className="tele-value" style={{ fontSize:18 }}>{tele.uptime}</div>
      </div>
      <div className="tele-card">
        <div className="tele-label">CPU · NPU</div>
        <div className="tele-value" style={{ fontSize:14 }}>
          {tele.cpu}% · {tele.npu}%
        </div>
        <div className="tele-bar"><span style={{ width: tele.npu + '%', background:'var(--info)' }} /></div>
      </div>
    </>
  );
}

window.Panels = { CameraFeed, DetectionStream, RobotCommands, TelemetryRail };
