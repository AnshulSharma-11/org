import { INTENTS, FALLBACK, pagesFor, starters } from './knowledge';
import { buildIndex, match, matchPage, norm } from './engine';

buildIndex(INTENTS);

const HIGH = 0.5;    // confident → answer
const LOW = 0.3;     // unsure → offer suggestions
// phrases made only of everyday words (which the matcher ignores) are matched whole
const EXACT = {
  help: 'capabilities', menu: 'capabilities', commands: 'capabilities', options: 'capabilities', start: 'capabilities',
  'what can you do': 'capabilities', 'what do you do': 'capabilities', 'how can you help': 'capabilities', 'how can you help me': 'capabilities',
  'who are you': 'who_are_you', 'what are you': 'who_are_you', 'what is your name': 'who_are_you', 'whats your name': 'who_are_you',
  'how are you': 'how_are_you', 'how are you doing': 'how_are_you', 'how do you do': 'how_are_you', 'thank you': 'thanks',
  'any updates': 'hr_briefing', 'whats new': 'hr_briefing', 'any news': 'hr_briefing',
};
const NAME_LOOKUP = /^(who is|whos|who's|find|search for|search|look ?up|pull up|get me|details (of|for|about)|info(rmation)? (on|about|for)|show me)\s+\S+/i;
const byId = new Map(INTENTS.map((i) => [i.id, i]));

const asQuestion = (p) => {
  const t = p.charAt(0).toUpperCase() + p.slice(1);
  return /^(how|what|who|why|where|is|are|can|do|does|which|when)\b/i.test(p) ? `${t}?` : t;
};

/** Which intent would answer this message? (used by the UI and by tests) */
export function classify(text, ctx) {
  const raw = String(text || '').trim();
  if (!raw) return { id: null, score: 0 };
  const n = norm(raw);
  if (EXACT[n]) {
    const it = byId.get(EXACT[n]);
    if (it && (it.roles === '*' || it.roles.includes(ctx.role))) return { id: EXACT[n], score: 1 };
  }
  const hit = matchPage(raw, pagesFor(ctx));
  const { best, score, ranked } = match(raw, { role: ctx.role, page: ctx.pathname || '' });
  // "go to payroll" always navigates; a softer "open …" yields to a confident question match ("open help requests")
  if (hit && (hit.strong || score < 0.7)) return { id: 'nav', score: 1, page: hit.page };
  // HR typing a person's name ("who is Rohan Das", "find priya") → employee lookup
  if (ctx.role === 'hr' && score < 0.5 && NAME_LOOKUP.test(raw)) return { id: 'hr_find_employee', score: 0.6, ranked: [] };
  return { id: best?.id || null, score, ranked: ranked.map((r) => ({ id: r.intent.id, score: +r.score.toFixed(2) })) };
}

/** Produces the assistant's reply for a message. */
export async function respond(text, ctx) {
  const c = { ...ctx, raw: String(text || '').trim() };
  const r = classify(c.raw, c);
  if (r.id === 'nav') return { text: `Sure, taking you to **${r.page.label}**.`, navigate: r.page.to, intentId: 'nav' };

  if (r.id && r.score >= HIGH) {
    const out = await byId.get(r.id).run(c);
    return { ...out, intentId: r.id };
  }
  if (r.id && r.score >= LOW) {
    const [a, b, d] = r.ranked;
    // clear winner among the borderline → answer; otherwise ask which one was meant
    if (!b || a.score - b.score >= 0.1) {
      const out = await byId.get(r.id).run(c);
      return { ...out, intentId: r.id };
    }
    return {
      text: 'I want to be sure I understood you. Did you mean one of these?',
      chips: [a, b, d].filter(Boolean).map((x) => asQuestion(byId.get(x.id).phrases[0])),
      intentId: 'clarify',
    };
  }
  return { ...FALLBACK(c), intentId: 'fallback' };
}

export { starters, pagesFor };
