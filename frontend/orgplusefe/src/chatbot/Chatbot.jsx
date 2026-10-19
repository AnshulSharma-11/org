import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BrandMark } from '../components/BrandLogo';
import { respond, starters } from './assistant';
import { clearChatCache } from './dataAnswers';
import './chatbot.css';

/* ───────── tiny markdown renderer (bold, italic, code, lists) — no HTML injection ───────── */
function inline(text, key) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g).filter(Boolean).map((p, i) => {
    if (p.startsWith('**')) return <strong key={`${key}${i}`}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`')) return <code key={`${key}${i}`}>{p.slice(1, -1)}</code>;
    if (p.startsWith('*') && p.length > 2) return <em key={`${key}${i}`}>{p.slice(1, -1)}</em>;
    return <React.Fragment key={`${key}${i}`}>{p}</React.Fragment>;
  });
}
function Rich({ text }) {
  const blocks = String(text || '').split(/\n{2,}/);
  return blocks.map((b, bi) => {
    const lines = b.split('\n');
    if (lines.every((l) => /^\s*-\s+/.test(l))) {
      return <ul key={bi}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*-\s+/, ''), `${bi}-${i}`)}</li>)}</ul>;
    }
    if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      return <ol key={bi}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*\d+\.\s+/, ''), `${bi}-${i}`)}</li>)}</ol>;
    }
    return <p key={bi}>{lines.map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{inline(l, `${bi}-${i}`)}</React.Fragment>)}</p>;
  });
}

const store = {
  get: (k, d) => { try { const v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  del: (k) => { try { sessionStorage.removeItem(k); } catch { /* ignore */ } },
};

const welcome = (role, first) => ({
  guest: 'Hi! I\'m the **ORGPLUS Assistant**. Ask me what ORGPLUS can do, how the HR and Employee panels differ, or how to sign in.',
  employee: `Hi${first ? ` ${first}` : ''}! I can check your **leave balance, payslips and attendance** live, or walk you through any task.`,
  hr: `Hello${first ? ` ${first}` : ''}! I can **brief you on what needs attention**, look up employees, and guide you through any HR task.`,
}[role]);

const PLACEHOLDER = { guest: 'Ask about ORGPLUS…', employee: 'Ask about leave, payslips, attendance…', hr: 'Ask about leaves, payroll, employees…' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let uid = 0;

function Chatbot() {
  const { isAdminAuth, adminUser, isEmployeeAuth, employeeUser } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  const empId = (/^\/employee\/(\d+)/.exec(loc.pathname) || [])[1];
  const role = /^\/admin(\/|$)/.test(loc.pathname) && !loc.pathname.startsWith('/admin/login') && isAdminAuth ? 'hr'
    : empId && isEmployeeAuth ? 'employee' : 'guest';
  const first = role === 'hr' ? (adminUser?.fullName || '').split(' ')[0] : role === 'employee' ? employeeUser?.firstName : '';
  const userId = role === 'hr' ? adminUser?.id : role === 'employee' ? empId : 'x';
  const key = `orgplus_chat_${role}_${userId || 'x'}`;

  const ctx = useMemo(() => ({ role, first, employeeId: empId, pathname: loc.pathname }), [role, first, empId, loc.pathname]);

  const [open, setOpen] = useState(() => store.get('orgplus_chat_open', false));
  // The conversation is stored together with the key it belongs to, so messages can never leak
  // from one signed-in person to another when the identity changes.
  const [conv, setConv] = useState(() => ({ key, list: store.get(key, []) }));
  if (conv.key !== key) setConv({ key, list: store.get(key, []) });
  const messages = conv.key === key ? conv.list : [];
  const setMessages = (fn) => setConv((c) => (c.key === key ? { key, list: typeof fn === 'function' ? fn(c.list) : fn } : c));
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [nudge, setNudge] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const prevRole = useRef(role);

  // wipe every saved conversation when someone signs out
  useEffect(() => {
    if (prevRole.current !== 'guest' && role === 'guest') {
      Object.keys(sessionStorage).filter((k) => k.startsWith('orgplus_chat_') && !/_(open|nudged)$/.test(k)).forEach(store.del);
      clearChatCache();
    }
    prevRole.current = role;
  }, [role]);

  useEffect(() => {
    if (conv.key !== key) return;
    if (conv.list.length) store.set(conv.key, conv.list.slice(-80)); else store.del(conv.key);
  }, [conv, key]);
  useEffect(() => { store.set('orgplus_chat_open', open); }, [open]);

  // friendly nudge, once per session
  useEffect(() => {
    if (open || store.get('orgplus_chat_nudged', false)) return undefined;
    const t1 = setTimeout(() => { setNudge(true); store.set('orgplus_chat_nudged', true); }, 2800);
    const t2 = setTimeout(() => setNudge(false), 11000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [open]);

  useEffect(() => { if (open) setNudge(false); }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open && !window.matchMedia('(pointer: coarse)').matches) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const push = (m) => setMessages((prev) => [...prev, { id: `${Date.now()}-${uid++}`, ...m }]);

  const send = useCallback(async (raw) => {
    const t = String(raw || '').trim().slice(0, 300);
    if (!t || busy) return;
    setText('');
    push({ from: 'user', text: t });
    setBusy(true);
    let reply;
    try {
      [reply] = await Promise.all([respond(t, ctx), wait(380 + Math.random() * 320)]);
    } catch {
      reply = { text: 'Something went wrong on my side. Please try again.' };
    }
    push({ from: 'bot', text: reply.text, facts: reply.facts, links: reply.links, chips: reply.chips });
    setBusy(false);
    if (reply.navigate) {
      setTimeout(() => { navigate(reply.navigate); if (window.innerWidth < 576) setOpen(false); }, 750);
    }
  }, [busy, ctx, navigate]);

  const go = (to) => { navigate(to); if (window.innerWidth < 576) setOpen(false); };
  const clear = () => { setMessages([]); clearChatCache(); inputRef.current?.focus(); };

  const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };

  const lastBot = [...messages].reverse().find((m) => m.from === 'bot');
  const intro = { id: 'intro', from: 'bot', text: welcome(role, first), chips: starters(ctx) };
  const shown = [intro, ...messages];
  const chipsFor = busy ? null : (messages.length ? lastBot : intro);

  return (
    <div className="cb-root" onKeyDown={onKey}>
      {open && (
        <section className="cb-panel" role="dialog" aria-label="ORGPLUS Assistant" aria-modal="false">
          <header className="cb-head">
            <BrandMark size={38} />
            <div className="cb-title">
              <strong>ORGPLUS Assistant</strong>
              <span><i className="cb-dot" />Online · no usage limits</span>
            </div>
            <button type="button" className="cb-ibtn" onClick={clear} title="Clear conversation" aria-label="Clear conversation"><i className="bi bi-trash3" /></button>
            <button type="button" className="cb-ibtn" onClick={() => setOpen(false)} title="Close" aria-label="Close assistant"><i className="bi bi-x-lg" /></button>
          </header>

          <div className="cb-body" ref={bodyRef} aria-live="polite">
            {shown.map((m) => (
              <div key={m.id} className={`cb-row ${m.from}`}>
                {m.from === 'bot' && <BrandMark size={28} className="cb-av" />}
                <div className="cb-col">
                  <div className="cb-bubble">
                    <Rich text={m.text} />
                    {m.facts && m.facts.length > 0 && (
                      <dl className="cb-facts">
                        {m.facts.map(([k, v], i) => (<div key={i}><dt>{k}</dt><dd>{v}</dd></div>))}
                      </dl>
                    )}
                  </div>
                  {m.links && m.links.length > 0 && (
                    <div className="cb-links">
                      {m.links.map((l) => (
                        <button type="button" key={l.to + l.label} onClick={() => go(l.to)}>{l.label}<i className="bi bi-arrow-right" /></button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="cb-row bot">
                <BrandMark size={28} className="cb-av" />
                <div className="cb-bubble cb-typing" aria-label="Assistant is typing"><i /><i /><i /></div>
              </div>
            )}

            {chipsFor && chipsFor.chips && chipsFor.chips.length > 0 && (
              <div className="cb-chips">
                {chipsFor.chips.map((c) => (<button type="button" key={c} onClick={() => send(c)}>{c}</button>))}
              </div>
            )}
          </div>

          <form className="cb-input" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input
              ref={inputRef} type="text" value={text} maxLength={300} autoComplete="off"
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER[role]} aria-label="Type your question"
            />
            <button type="submit" disabled={!text.trim() || busy} aria-label="Send message"><i className="bi bi-send-fill" /></button>
          </form>
        </section>
      )}

      {nudge && !open && (
        <div className="cb-nudge" role="status">
          <button type="button" onClick={() => setOpen(true)}>Need help? <b>Ask me anything</b> about ORGPLUS</button>
          <button type="button" className="x" onClick={() => setNudge(false)} aria-label="Dismiss"><i className="bi bi-x" /></button>
        </div>
      )}

      <button
        type="button" className={`cb-fab ${open ? 'on' : ''}`} onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'} aria-expanded={open}
      >
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-chat-dots-fill'}`} />
      </button>
    </div>
  );
}

/** Route layout: renders the current page and the assistant on top of every screen. */
export default function ChatLayout() {
  return (<><Outlet /><Chatbot /></>);
}
