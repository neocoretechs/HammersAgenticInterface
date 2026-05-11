/* Right rail: Robot Agent panel.
   - AG-UI streamed messages
   - A2UI action cards rendered inline
   - Goal submission → multi-step task plan */

const { useState: usSt, useEffect: usEf, useRef: usRf } = React;
const { Icon: IconA } = window.UI;

function A2UICard({ payload, onAction, fired }) {
  const conf = Math.round(payload.confidence * 100);
  return (
    <div className="a2-card fresh">
      <div className="a2-card-head">
        <span>A2UI</span>
        <span style={{ color:'var(--text-4)' }}>·</span>
        <span>DETECTION CARD</span>
        <span className="conf">{conf}% conf</span>
      </div>
      <div className="a2-card-body">
        <h3 style={{ textTransform:'capitalize' }}>{payload.class}</h3>
        <div className="meter"><span style={{ width: conf + '%' }} /></div>
        <div className="a2-actions">
          <button
            className={`a2-btn primary ${fired === 'approach' ? 'fired' : ''}`}
            onClick={() => onAction('approach', payload)}>
            {fired === 'approach' ? '✓ Approaching' : 'Approach'}
          </button>
          <button
            className={`a2-btn ${fired === 'avoid' ? 'fired' : ''}`}
            onClick={() => onAction('avoid', payload)}>
            {fired === 'avoid' ? '✓ Avoiding' : 'Avoid'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskPlanCard({ goal, steps, activeIdx }) {
  return (
    <div className="taskplan">
      <div className="taskplan-head">
        <span>A2UI · TASK PLAN</span>
        <span style={{ color:'var(--text-4)' }}>·</span>
        <span className="goal">"{goal}"</span>
      </div>
      {steps.map((s, i) => (
        <div key={i} className={`task-step ${i < activeIdx ? 'done' : i === activeIdx ? 'active' : ''}`}>
          <span className="num">{i+1}</span>
          <span className="label">{s.label}</span>
          <span className="tool">{s.tool}</span>
        </div>
      ))}
    </div>
  );
}

function MsgBlock({ by, children }) {
  return (
    <div className="msg-block">
      <div className="msg-by">
        {by.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="dot">·</span>}
            <span>{b}</span>
          </React.Fragment>
        ))}
      </div>
      {children}
    </div>
  );
}

function AgentPanel({ messages, onSendGoal, onA2Action, firedActions }) {
  const [draft, setDraft] = usSt('');
  const bodyRef = usRf(null);

  usEf(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const submit = () => {
    if (!draft.trim()) return;
    onSendGoal(draft.trim());
    setDraft('');
  };

  return (
    <>
      <div className="agent-head">
        <div className="agent-avatar">N</div>
        <div>
          <div className="agent-name">Robot Agent</div>
          <div className="agent-meta">AG-UI · GEMINI 2.0 FLASH · LLAMA.CPP LOCAL</div>
        </div>
      </div>
      <div className="agent-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <MsgBlock key={m.id ?? i} by={m.by}>
            {m.text && <div className="msg-text">{m.text}</div>}
            {m.a2 && (
              <A2UICard
                payload={m.a2}
                onAction={(action) => onA2Action(m.id, action, m.a2)}
                fired={firedActions[m.id]}
              />
            )}
            {m.taskplan && (
              <TaskPlanCard goal={m.taskplan.goal} steps={m.taskplan.steps} activeIdx={m.taskplan.activeIdx} />
            )}
          </MsgBlock>
        ))}
      </div>
      <div className="composer">
        <input
          placeholder="Set a goal for the rover…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        />
        <button onClick={submit}>SEND</button>
      </div>
    </>
  );
}

window.AgentPanel = AgentPanel;
