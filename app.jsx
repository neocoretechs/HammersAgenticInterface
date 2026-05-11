/* Main App — wires the fake event stream into all panels.
   Engine ticks at ~600ms producing YOLO packets, telemetry deltas,
   and event-bus entries. Goal submissions decompose into task plans. */

const { useState: aS, useEffect: aE, useMemo: aM, useRef: aR, useCallback: aC } = React;
const { CameraFeed, DetectionStream, RobotCommands, TelemetryRail } = window.Panels;
const { AgentPanel } = window;
const { EventLogView, TelemetryView, RagView, SettingsView } = window.Views;
const { Icon: AppIcon } = window.UI;
const { makeYoloPacket, AGENT_SCRIPT, RAG_SEED, RAG_EDGES } = window.MockData;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "scientific",
  "showBBoxLabels": true,
  "streamRate": 600,
  "showScanLine": true
}/*EDITMODE-END*/;

let _msgSeq = 0;
const newMsgId = () => `m${++_msgSeq}`;
let _evtSeq = 0;
const newEvtId = () => `e${++_evtSeq}`;

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'log',       label: 'Event Log', icon: 'log' },
  { id: 'tele',      label: 'Telemetry', icon: 'tele' },
  { id: 'rag',       label: 'RAG Memory', icon: 'rag' },
  { id: 'settings',  label: 'Settings',   icon: 'settings' },
];

function decomposeGoal(goal) {
  // Trivial goal → plan synthesizer. Picks a plausible plan.
  const g = goal.toLowerCase();
  if (g.includes('dock') || g.includes('charge')) {
    return [
      { label: 'Localize against floor map',     tool: 'slam.localize' },
      { label: 'Plan path to docking station',   tool: 'nav.plan' },
      { label: 'Navigate at reduced velocity',   tool: 'motion.drive' },
      { label: 'Align with charging contacts',   tool: 'dock.align' },
      { label: 'Engage charging circuit',        tool: 'power.dock' },
    ];
  }
  if (g.includes('patrol')) {
    return [
      { label: 'Load patrol waypoints',          tool: 'nav.load' },
      { label: 'Stream YOLO v11 detections',     tool: 'yolo.stream' },
      { label: 'Cluster novel objects → RAG',    tool: 'rag.write' },
      { label: 'Loop until interrupted',         tool: 'control.loop' },
    ];
  }
  if (g.includes('find') || g.includes('locate') || g.includes('look for')) {
    const target = goal.replace(/.*?(find|locate|look for)\s*/i, '').trim() || 'target';
    return [
      { label: `Query RAG memory for "${target}"`, tool: 'rag.query' },
      { label: 'Plan exploration arc',             tool: 'nav.explore' },
      { label: 'Drive while running YOLO v11',     tool: 'motion.drive' },
      { label: `Confirm sighting of ${target}`,    tool: 'yolo.match' },
      { label: 'Render approach card via A2UI',    tool: 'a2ui.render' },
    ];
  }
  if (g.includes('map') || g.includes('explore')) {
    return [
      { label: 'Initialize SLAM keyframe',       tool: 'slam.init' },
      { label: 'Drive perimeter sweep',          tool: 'motion.drive' },
      { label: 'Persist landmarks to RAG',       tool: 'rag.write' },
      { label: 'Publish floor-map artifact',     tool: 'slam.publish' },
    ];
  }
  // generic fallback
  return [
    { label: 'Parse goal with LLM',              tool: 'llm.parse' },
    { label: 'Query RAG for context',            tool: 'rag.query' },
    { label: 'Synthesize action plan',           tool: 'plan.compose' },
    { label: 'Dispatch via AG-UI bus',           tool: 'agui.emit' },
    { label: 'Render result in A2UI',            tool: 'a2ui.render' },
  ];
}

function App() {
  const [tweaks, setTweaks] = aS(TWEAK_DEFAULTS);
  const setTweak = aC((k, v) => {
    if (typeof k === 'object') {
      setTweaks(t => ({ ...t, ...k }));
      window.parent.postMessage({ type:'__edit_mode_set_keys', edits: k }, '*');
    } else {
      setTweaks(t => ({ ...t, [k]: v }));
      window.parent.postMessage({ type:'__edit_mode_set_keys', edits: { [k]: v } }, '*');
    }
  }, []);

  // theme attr
  aE(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
  }, [tweaks.theme]);

  const [view, setView] = aS('dashboard');
  const [paused, setPaused] = aS(false);

  // === detections (rolling) ===
  const [detections, setDetections] = aS(() => Array.from({ length: 4 }, () => makeYoloPacket(Date.now() - Math.random()*4000)));
  // === messages (agent panel) ===
  const [messages, setMessages] = aS(() => {
    const seeded = AGENT_SCRIPT.map(m => ({ ...m, id: newMsgId() }));
    return seeded;
  });
  const [firedActions, setFiredActions] = aS({});
  // === events (bus log) ===
  const [events, setEvents] = aS([]);
  // === telemetry ===
  const [tele, setTele] = aS({
    speed: 0.49, angular: 0.12, battery: 87, dpm: 19,
    cpu: 38, npu: 64,
    speedHist: Array.from({ length: 32 }, () => 0.4 + Math.random() * 0.2),
    angularHist: Array.from({ length: 32 }, () => Math.random() * 0.3),
    detsHist: Array.from({ length: 32 }, () => 14 + Math.floor(Math.random() * 10)),
    uptime: '00:01:20',
    startedAt: Date.now() - 80_000,
  });
  // === rag ===
  const [ragNodes, setRagNodes] = aS(RAG_SEED);
  const [ragRecent, setRagRecent] = aS([]);
  // === macro ===
  const [armedMacro, setArmedMacro] = aS(null);
  const [lastCommand, setLastCommand] = aS(null);

  const pushEvent = aC((src, body) => {
    setEvents(prev => [{ id: newEvtId(), t: Date.now(), src, body }, ...prev].slice(0, 200));
  }, []);

  // --- main tick -------------------------------------------------
  aE(() => {
    if (paused) return;
    const id = setInterval(() => {
      // 1. emit a YOLO packet
      const pkt = makeYoloPacket();
      setDetections(prev => [pkt, ...prev].slice(0, 24));
      pushEvent('yolo', `frame ${pkt.frame_id} · ${pkt.object.class} ${(pkt.object.confidence*100).toFixed(0)}% bbox(${pkt.object.bbox.x.toFixed(2)},${pkt.object.bbox.y.toFixed(2)},${pkt.object.bbox.w.toFixed(2)},${pkt.object.bbox.h.toFixed(2)})`);

      // 2. occasionally have AG-UI render an A2UI card for high-conf detections
      if (pkt.object.confidence > 0.85 && Math.random() < 0.45) {
        const id = newMsgId();
        setMessages(prev => [...prev, {
          id,
          by: ['AGENT', 'AG-UI', 'gemini-2.0-flash'],
          text: <>YOLO detected <strong>{pkt.object.class}</strong> at {Math.round(pkt.object.confidence*100)}% confidence. Rendering A2UI action card:</>,
          a2: { class: pkt.object.class, confidence: pkt.object.confidence, cluster: pkt.object.cluster },
        }].slice(-30));
        pushEvent('a2', `render:DetectionCard{class:"${pkt.object.class}", conf:${pkt.object.confidence.toFixed(2)}}`);
      }

      // 3. occasionally write the new class to RAG
      if (Math.random() < 0.18) {
        const cls = pkt.object.class;
        setRagNodes(prev => {
          const existing = prev.find(n => n.label === cls);
          if (existing) {
            return prev.map(n => n.label === cls ? { ...n, weight: n.weight + 1 } : n);
          }
          // place near cluster centroid
          const sib = prev.filter(n => n.cluster === pkt.object.cluster);
          const cx = sib.length ? sib.reduce((a,b)=>a+b.x,0)/sib.length : 0.5;
          const cy = sib.length ? sib.reduce((a,b)=>a+b.y,0)/sib.length : 0.5;
          const id = `n${prev.length + 1 + Math.floor(Math.random()*99)}`;
          const node = {
            id, label: cls, cluster: pkt.object.cluster,
            x: cx + (Math.random() - 0.5) * 0.16,
            y: cy + (Math.random() - 0.5) * 0.16,
            weight: 1, t: 0,
          };
          return [...prev, node];
        });
        const targetId = ragNodes.find(n => n.label === cls)?.id;
        if (targetId) {
          setRagRecent([targetId]);
          setTimeout(() => setRagRecent([]), 1800);
        }
        pushEvent('tel', `rag.write{class:"${cls}", cluster:"${pkt.object.cluster}"}`);
      }

      // 4. telemetry tick
      setTele(prev => {
        const speed = Math.max(0.05, Math.min(1.4,
          prev.speed + (Math.random() - 0.5) * 0.15 + (armedMacro === 'PATROL' ? 0.05 : armedMacro === 'DOCK' ? -0.04 : 0)));
        const angular = Math.max(-0.6, Math.min(0.6, prev.angular + (Math.random() - 0.5) * 0.15));
        const battery = Math.max(20, prev.battery - (Math.random() < 0.05 ? 1 : 0));
        const dpm = Math.max(8, Math.min(34, prev.dpm + (Math.random() < 0.4 ? (Math.random()<0.5?-1:1) : 0)));
        const cpu = Math.max(20, Math.min(80, prev.cpu + (Math.random() - 0.5) * 6));
        const npu = Math.max(40, Math.min(95, prev.npu + (Math.random() - 0.5) * 8));
        const elapsed = Math.floor((Date.now() - prev.startedAt) / 1000);
        const hh = String(Math.floor(elapsed/3600)).padStart(2,'0');
        const mm = String(Math.floor((elapsed%3600)/60)).padStart(2,'0');
        const ss = String(elapsed%60).padStart(2,'0');
        return {
          ...prev,
          speed, angular, battery, dpm,
          cpu: Math.round(cpu), npu: Math.round(npu),
          speedHist: [...prev.speedHist.slice(-31), speed],
          angularHist: [...prev.angularHist.slice(-31), angular],
          detsHist: [...prev.detsHist.slice(-31), dpm],
          uptime: `${hh}:${mm}:${ss}`,
        };
      });
    }, tweaks.streamRate);
    return () => clearInterval(id);
  }, [paused, tweaks.streamRate, armedMacro, ragNodes]);

  // --- macro handling --------------------------------------------
  const onMacro = aC((cmd) => {
    setLastCommand(`${cmd} · ${new Date().toLocaleTimeString('en-GB')}`);
    pushEvent('ag', `cmd.dispatch{macro:"${cmd}"}`);
    if (['PATROL','RETURN_HOME','DOCK'].includes(cmd)) {
      setArmedMacro(cmd);
      // synthesize a task plan from the macro
      const plan = decomposeGoal(cmd);
      const id = newMsgId();
      setMessages(prev => [...prev, {
        id,
        by: ['AGENT', 'AG-UI', 'gemini-2.0-flash'],
        text: <>Executing macro <code>{cmd}</code>. Decomposing into steps:</>,
        taskplan: { goal: cmd, steps: plan, activeIdx: 0 },
      }].slice(-30));
      animatePlan(id, plan);
    } else if (cmd === 'E-STOP') {
      setArmedMacro(null);
      pushEvent('ag', `safety.estop · all motion halted`);
    }
  }, []);

  // --- goal decomposition ----------------------------------------
  const animatePlan = aC((msgId, plan) => {
    let i = 0;
    const step = () => {
      i++;
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        return { ...m, taskplan: { ...m.taskplan, activeIdx: Math.min(i, plan.length) } };
      }));
      if (i < plan.length) {
        setTimeout(step, 1500 + Math.random() * 800);
      } else {
        // mark macro complete
        setTimeout(() => setArmedMacro(null), 800);
      }
    };
    setTimeout(step, 800);
  }, []);

  const onSendGoal = aC((goal) => {
    const userId = newMsgId();
    setMessages(prev => [...prev, {
      id: userId,
      by: ['USER', 'GOAL'],
      text: <>{goal}</>,
    }]);
    pushEvent('ag', `user.goal "${goal}"`);
    const planId = newMsgId();
    const plan = decomposeGoal(goal);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: planId,
        by: ['AGENT', 'AG-UI', 'gemini-2.0-flash'],
        text: <>Decomposed goal into {plan.length} steps. Streaming via AG-UI bus:</>,
        taskplan: { goal, steps: plan, activeIdx: 0 },
      }].slice(-30));
      pushEvent('a2', `render:TaskPlan{steps:${plan.length}}`);
      animatePlan(planId, plan);
    }, 500);
  }, []);

  const onA2Action = aC((msgId, action, payload) => {
    setFiredActions(p => ({ ...p, [msgId]: action }));
    setLastCommand(`${action.toUpperCase()} ${payload.class} · ${new Date().toLocaleTimeString('en-GB')}`);
    pushEvent('a2', `action.fire{action:"${action}", target:"${payload.class}"}`);
    pushEvent('ag', `motion.${action}{target:"${payload.class}"}`);
  }, []);

  // --- tweaks panel wiring ---------------------------------------
  const [tweaksOpen, setTweaksOpen] = aS(false);
  aE(() => {
    const onMsg = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type:'__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">NEOCORETECH<span>S</span></div>
          <div className="brand-divider" />
          <div className="brand-title">Embodied Robot Command Portal</div>
        </div>
        <div className="topbar-spacer" />
        <span className="protocol-pill active">AG-UI</span>
        <span className="protocol-pill a2ui active">A2UI</span>
        <span className="status-pill">
          <span className="status-dot" />
          {paused ? 'ROBOT PAUSED' : 'ROBOT ONLINE'}
        </span>
      </div>

      <div className="app">
        <aside className="col-nav">
          <div className="nav-section-title">NAVIGATION</div>
          <ul className="nav-list">
            {NAV.map(n => (
              <li key={n.id}
                  className={`nav-item ${view === n.id ? 'active' : ''}`}
                  onClick={() => setView(n.id)}>
                <AppIcon name={n.icon} />
                <span>{n.label}</span>
              </li>
            ))}
          </ul>
          <TelemetryRail tele={tele} />
        </aside>

        <main className="col-main">
          {view === 'dashboard' && (
            <>
              <CameraFeed detections={detections} paused={paused} />
              <DetectionStream detections={detections} />
              <RobotCommands onMacro={onMacro} lastCommand={lastCommand} armedMacro={armedMacro} />
            </>
          )}
          {view === 'log' && <EventLogView events={events} />}
          {view === 'tele' && <TelemetryView tele={tele} />}
          {view === 'rag' && <RagView ragNodes={ragNodes} ragRecent={ragRecent} />}
          {view === 'settings' && <SettingsView />}
        </main>

        <aside className="col-agent">
          <AgentPanel
            messages={messages}
            onSendGoal={onSendGoal}
            onA2Action={onA2Action}
            firedActions={firedActions}
          />
        </aside>
      </div>

      {tweaksOpen && window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks" onClose={() => {
          setTweaksOpen(false);
          window.parent.postMessage({ type:'__edit_mode_dismissed' }, '*');
        }}>
          <window.TweakSection title="Theme">
            <window.TweakRadio label="Aesthetic"
              value={tweaks.theme}
              onChange={v => setTweak('theme', v)}
              options={[
                { value:'scientific', label:'Scientific' },
                { value:'terminal',   label:'Terminal' },
              ]}
            />
          </window.TweakSection>
          <window.TweakSection title="Stream">
            <window.TweakSlider label="Tick rate (ms)"
              value={tweaks.streamRate}
              onChange={v => setTweak('streamRate', v)}
              min={200} max={2000} step={100}
            />
            <window.TweakToggle label="Pause stream"
              value={paused}
              onChange={setPaused}
            />
          </window.TweakSection>
          <window.TweakSection title="Camera overlay">
            <window.TweakToggle label="Bbox labels"
              value={tweaks.showBBoxLabels}
              onChange={v => setTweak('showBBoxLabels', v)}
            />
            <window.TweakToggle label="Scan line"
              value={tweaks.showScanLine}
              onChange={v => setTweak('showScanLine', v)}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
