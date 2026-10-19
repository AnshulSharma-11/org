/* ═══════════════════════════════════════════════════════════
   ORGPLUS assistant — language understanding engine
   ───────────────────────────────────────────────────────────
   Runs completely in the browser (no server, no API key, no
   per-message cost), so usage is unlimited.

   How it works
     1. The message is normalised: lower-case, light stemming,
        synonyms folded ("holiday" → "leave", "salary" → "payroll").
     2. Unknown words are spell-corrected against the vocabulary.
     3. Each intent's example phrases are scored with a weighted
        (IDF) cosine similarity — rare, meaningful words such as
        "payslip" count for more than common ones such as "how".
   ═══════════════════════════════════════════════════════════ */

const STOP = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or',
  'it', 'its', 'this', 'that', 'these', 'those', 'there', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will',
  'shall', 'please', 'pls', 'plz', 'you', 'your', 'yours', 'me', 'i', 'im', 'ive', 'we', 'us', 'just', 'so', 'as', 'by',
  'with', 'about', 'from', 'into', 'tell', 'want', 'wanna', 'need', 'like', 'let', 'know', 'what', 'whats', 'which',
  'some', 'any', 'kindly', 'also', 'really', 'very', 'much', 'have', 'has', 'had', 'get', 'give', 'make', 'ok', 'okay',
  'hey', 'there', 'then', 'than', 'if', 'but', 'my', 'mine', 'our', 'am', 'doing', 'something', 'anything', 'everything', 'thing', 'things', 'still', 'currently', 'right', 'now', 'today_',
]);

/** Words that mean the same thing are folded into one canonical word. */
const SYN = {
  // leave
  holiday: 'leave', vacation: 'leave', pto: 'leave', off: 'leave', absence: 'leave', leaves: 'leave', sabbatical: 'leave',
  // payroll
  salary: 'payroll', pay: 'payroll', payslip: 'payroll', paycheck: 'payroll', wage: 'payroll', wages: 'payroll',
  compensation: 'payroll', ctc: 'payroll', paystub: 'payroll', earnings: 'payroll', payment: 'payroll', paid: 'payroll',
  // attendance
  attendance: 'attendance', checkin: 'attendance', checkout: 'attendance', punch: 'attendance', timesheet: 'attendance',
  clock: 'attendance', present: 'attendance', absent: 'attendance', timing: 'attendance',
  // people
  staff: 'employee', worker: 'employee', personnel: 'employee', employees: 'employee', colleague: 'employee',
  headcount: 'employee', member: 'employee',
  // help desk
  ticket: 'help', helpdesk: 'help', complaint: 'help', grievance: 'help', support: 'help', assistance: 'help',
  issue: 'help', problem: 'help', query: 'help', escalate: 'help', complain: 'help', complaining: 'help',
  // documents
  doc: 'document', docs: 'document', file: 'document', files: 'document', certificate: 'document', resume: 'document',
  documents: 'document', paperwork: 'document', upload: 'upload', attach: 'upload',
  // org
  boss: 'manager', supervisor: 'manager', lead: 'manager', reporting: 'manager',
  // actions
  create: 'add', new: 'add', onboard: 'add', register: 'add', insert: 'add', register_: 'add',
  remove: 'delete', erase: 'delete', discard: 'delete', terminate: 'terminate', fire: 'terminate', resign: 'terminate',
  edit: 'update', modify: 'update', change: 'update', amend: 'update', correct: 'update', fix: 'update',
  accept: 'approve', sanction: 'approve', approval: 'approve', approved: 'approve',
  decline: 'reject', deny: 'reject', refuse: 'reject', rejected: 'reject',
  see: 'view', show: 'view', display: 'view', check: 'view', list: 'view', look: 'view', open: 'open',
  // quantity / state
  many: 'count', number: 'count', total: 'count', count: 'count', much: 'count',
  remaining: 'balance', left: 'balance', balance: 'balance', available: 'balance', quota: 'balance', entitled: 'balance',
  entitlement: 'balance', allowance: 'balance', spare: 'balance',
  waiting: 'pending', awaiting: 'pending', pending: 'pending', unapproved: 'pending',
  // reports
  analytics: 'report', chart: 'report', graph: 'report', insight: 'report', statistic: 'report', stats: 'report',
  dashboard: 'dashboard', overview: 'summary', summary: 'summary', briefing: 'summary', digest: 'summary', snapshot: 'summary',
  // ui
  theme: 'theme', dark: 'theme', light: 'theme', night: 'theme', appearance: 'theme',
  signin: 'login', 'log-in': 'login', logon: 'login', signon: 'login', logout: 'logout', signout: 'logout',
  password: 'password', passcode: 'password', pwd: 'password', credentials: 'password',
  birthday: 'birthday', bday: 'birthday', anniversary: 'anniversary', joined: 'hire', hired: 'hire', joiners: 'hire',
  joinee: 'hire', newcomer: 'hire', recruit: 'hire',
  dept: 'department', division: 'department', team: 'team', branch: 'branch', office: 'branch', location: 'branch',
  designation: 'designation', title: 'designation', role: 'designation', position: 'designation', job: 'designation',
  project: 'project', task: 'project', assignment: 'project', deadline: 'deadline', due: 'deadline', overdue: 'overdue', late: 'overdue',
  kind: 'type', kinds: 'type', category: 'type', categories: 'type', surname: 'name', lastname: 'name', firstname: 'name', fullname: 'name',
  leaving: 'terminate', quit: 'terminate', quitting: 'terminate', chatbot: 'bot', robot: 'bot', assistant: 'bot', bot: 'bot', confidential: 'privacy', private: 'privacy',
  hello: 'hello', hi: 'hello', hey_: 'hello', hola: 'hello', namaste: 'hello', greetings: 'hello',
  thanks: 'thanks', thank: 'thanks', thx: 'thanks', ty: 'thanks', cheers: 'thanks', appreciate: 'thanks',
  bye: 'bye', goodbye: 'bye', cya: 'bye', later: 'bye',
  free: 'free', unlimited: 'unlimited', limit: 'unlimited', cost: 'free', price: 'free', pricing: 'free', charge: 'free', fee: 'free',
  rating: 'rating', rate: 'rating', appraisal: 'rating', review: 'review', evaluation: 'review', feedback: 'review', kpi: 'review',
  phone: 'phone', mobile: 'phone', cell: 'phone', android: 'phone', iphone: 'phone', tablet: 'phone',
};

/** Very small stemmer – enough for English HR vocabulary. */
export function stem(w) {
  if (w.length <= 3) return w;
  if (SYN[w]) return w;
  if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es') && w.length > 4 && /(ch|sh|x|z|ss)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}

/** Question words and generic verbs — never enough on their own to identify a topic. */
const GENERIC = new Set(['up', 'how', 'where', 'when', 'why', 'which', 'who', 'find', 'view', 'open', 'count', 'add', 'update', 'delete', 'new']);

const canon = (w) => SYN[w] || SYN[stem(w)] || stem(w);

export function rawWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/'s\b/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Edit distance where swapping two neighbouring letters counts as one typo. */
function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/* ───────── index ───────── */
let VOCAB = new Set();
let IDF = new Map();
let ROWS = [];                 // { intent, tokens:Set, weight }

let SPELL = [];                // [word, canonical] — every word we know how to spell

const tokensOf = (text, fix = false) => {
  const out = [];
  rawWords(text).forEach((w) => {
    if (STOP.has(w)) return;
    let c = canon(w);
    if (fix && !VOCAB.has(c) && !SYN[w] && w.length >= 4 && !/\d/.test(w)) {
      const max = w.length >= 8 ? 2 : 1;
      let best = null, bd = max + 1;
      SPELL.forEach(([word, can]) => {
        if (word[0] !== w[0]) return;                         // typos rarely change the first letter
        if (w.startsWith(word) || word.startsWith(w)) return;  // "pasta" is not a typo of "past"
        const d = lev(w, word, max);
        if (d < bd) { bd = d; best = can; }
      });
      if (best) c = best;
    }
    if (!STOP.has(c)) out.push(c);
  });
  return out;
};

export function buildIndex(intents) {
  ROWS = [];
  const df = new Map();
  VOCAB = new Set();
  intents.forEach((intent) => {
    intent.phrases.forEach((p) => {
      const t = new Set(tokensOf(p));
      if (!t.size) return;
      // "do i have to pay" folds down to the single word "payroll", and a lone "how" says nothing — too vague to match on
      const content = rawWords(p).filter((w) => !STOP.has(w)).length;
      if (t.size < 2 && (content > 1 || GENERIC.has([...t][0]))) return;
      t.forEach((x) => { df.set(x, (df.get(x) || 0) + 1); VOCAB.add(x); });
      ROWS.push({ intent, tokens: t, phrase: p });
    });
  });
  SPELL = [...new Set([...VOCAB.values()].map((v) => v)), ...Object.keys(SYN)]
    .filter((w) => w.length >= 4).map((w) => [w, canon(w)]);
  const N = ROWS.length || 1;
  IDF = new Map([...df].map(([t, n]) => [t, Math.log(1 + N / n)]));
  ROWS.forEach((r) => { r.weight = [...r.tokens].reduce((a, t) => a + (IDF.get(t) || 0), 0); });
}

const idf = (t) => IDF.get(t) ?? 0.7;           // words we have never seen count against a match

function similarity(userSet, uW, row) {
  let overlap = 0, specific = false;
  userSet.forEach((t) => { if (row.tokens.has(t)) { overlap += idf(t); if (!GENERIC.has(t)) specific = true; } });
  if (!overlap || !specific) return 0;
  const cosine = overlap / Math.sqrt(uW * row.weight);
  // every word of the phrase was said → strong signal, nudged by how much of the user's message it explains
  const contain = row.tokens.size >= 2 ? (overlap / row.weight) * 0.9 * (0.7 + 0.3 * (overlap / uW)) : 0;
  return Math.max(cosine, contain);
}

/**
 * Finds the best intents for a message.
 * @returns {{best, score, ranked:[{intent,score}]}}
 */
export function match(text, { role, page = '' }) {
  const tokens = tokensOf(text, true);
  if (!tokens.length) return { best: null, score: 0, ranked: [] };
  const U = new Set(tokens);
  const uW = [...U].reduce((a, t) => a + idf(t), 0) || 1;

  const best = new Map();
  ROWS.forEach((row) => {
    const { roles } = row.intent;
    if (roles && roles !== '*' && !roles.includes(role)) return;
    let s = similarity(U, uW, row);
    if (s && row.intent.pages && row.intent.pages.some((p) => page.includes(p))) s += 0.06;   // context nudge
    if (s > (best.get(row.intent.id)?.score || 0)) best.set(row.intent.id, { intent: row.intent, score: s });
  });
  const ranked = [...best.values()].sort((a, b) => b.score - a.score);
  return { best: ranked[0]?.intent || null, score: ranked[0]?.score || 0, ranked: ranked.slice(0, 4) };
}

/* ───────── page navigation ("take me to payroll") ───────── */
const NAV_VERB = /^(please\s+)?(go\s*to|goto|take\s+me\s+to|bring\s+me\s+to|navigate\s+to|navigate|jump\s+to|redirect\s+me\s+to|open|visit|launch)\b/i;
const NAV_STRONG = /^(please\s+)?(go\s*to|goto|take\s+me\s+to|bring\s+me\s+to|navigate\s+to|navigate|jump\s+to|redirect\s+me\s+to)\b/i;

export function matchPage(text, pages) {
  const t = String(text || '').trim();
  const m = NAV_VERB.exec(t);
  if (!m) return null;
  const strong = NAV_STRONG.test(t);
  const rest = t.slice(m[0].length);
  const toks = new Set(tokensOf(rest, true));
  if (!toks.size) return null;
  let best = null, bs = 0;
  pages.forEach((pg) => {
    pg.names.forEach((n) => {
      const nt = new Set(tokensOf(n));
      if (!nt.size) return;
      let o = 0, w = 0, uw = 0;
      nt.forEach((x) => { w += idf(x) + 0.5; if (toks.has(x)) o += idf(x) + 0.5; });
      toks.forEach((x) => { uw += idf(x) + 0.5; });
      const s = o / Math.sqrt(w * uw);
      if (s > bs) { bs = s; best = pg; }
    });
  });
  const need = strong ? 0.55 : 0.8;
  return best && bs >= need ? { page: best, strong } : null;
}

/** Everything after trigger words — used to pull a person's name out of "find Priya Sharma". */
export function extractName(text) {
  const drop = new Set(['find', 'search', 'who', 'whos', 'is', 'lookup', 'look', 'up', 'details', 'detail', 'of', 'about', 'for', 'employee', 'employees',
    'staff', 'person', 'show', 'me', 'info', 'information', 'profile', 'contact', 'the', 'a', 'named', 'name', 'called', 'tell', 'get', 'give', 'please',
    'where', 'does', 'work', 'works', 'in', 'what', 'department', 'designation', 'email', 'phone', 'number', 'on', 'check', 'view', 'see', 'open']);
  return rawWords(text).filter((w) => !drop.has(w) && w.length > 1).join(' ');
}

export const norm = (s) => rawWords(s).join(' ');

/** Exposed for tests / debugging. */
export const debugTokens = (text) => tokensOf(text, true);
