import { SUPABASE_URL, SUPABASE_ANON_KEY, OWNER_EMAIL, REQUIRE_LOGIN } from './klipu-config.js';
import { FAQ } from './faq-data.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const page = document.body.dataset.page || '';
const configured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && /^https:\/\/.+\.supabase\.co/.test(SUPABASE_URL) && !/PASTE/.test(SUPABASE_ANON_KEY));
const safe = (fn, d) => { try { return fn(); } catch (e) { return d; } };

/* ---------- theme (dark is the default, matches the logo) ---------- */
const theme = safe(() => localStorage.getItem('klipu:theme'), null) || 'dark';
document.documentElement.dataset.theme = theme;

/* ---------- Supabase (loaded only when it is set up) ---------- */
let sbP = null;
function sb() {
  if (!sbP) sbP = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm').then((m) => m.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, detectSessionInUrl: true } }));
  return sbP;
}
const mapUser = (u) => u ? { uid: u.id, name: (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name)) || (u.email || '').split('@')[0] || 'Member', email: u.email || '' } : null;
let user = null, userReady;
const listeners = [];
const ready = new Promise((res) => { userReady = res; });
if (configured) {
  sb().then(async (c) => {
    c.auth.onAuthStateChange((_e, session) => { user = mapUser(session && session.user); listeners.forEach((cb) => cb(user)); });
    const { data } = await c.auth.getSession(); user = mapUser(data.session && data.session.user); listeners.forEach((cb) => cb(user)); userReady(user);
  }).catch(() => { userReady(null); });
} else userReady(null);

const authErr = (e) => {
  const m = String((e && e.message) || '').toLowerCase();
  if (/invalid login|invalid credentials/.test(m)) return 'Email or password is not right.';
  if (/already registered|already been registered/.test(m)) return 'This email already has an account. Try logging in.';
  if (/email not confirmed/.test(m)) return 'Please open the confirmation email we sent, then log in.';
  if (/password/.test(m) && /6|short|weak|least/.test(m)) return 'Choose a password with at least 8 characters.';
  if (/invalid.*email|email.*invalid/.test(m)) return 'That email does not look right.';
  if (/rate limit|too many|seconds/.test(m)) return 'Too many tries. Wait a little and try again.';
  if (/fetch|network/.test(m)) return 'No internet connection.';
  return 'Something went wrong. Try again.';
};
const wrap = async (fn) => { try { return await fn(); } catch (e) { throw new Error(authErr(e)); } };
const here = (p) => new URL(p, location.href).href;
const auth = {
  configured,
  async google(next) { return wrap(async () => { const c = await sb(); const { error } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: here('login.html?next=' + encodeURIComponent(next || 'index.html')) } }); if (error) throw error; return { redirecting: true }; }); },
  async signIn(email, pw) { return wrap(async () => { const c = await sb(); const { error } = await c.auth.signInWithPassword({ email, password: pw }); if (error) throw error; }); },
  async signUp(name, email, pw) { return wrap(async () => { const c = await sb(); const { data, error } = await c.auth.signUp({ email, password: pw, options: { data: { name }, emailRedirectTo: here('login.html') } }); if (error) throw error; return { needsConfirm: !data.session }; }); },
  async reset(email) { return wrap(async () => { const c = await sb(); const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: here('login.html') }); if (error) throw error; }); },
  async out() { const c = await sb(); await c.auth.signOut(); }
};

/* ---------- reviews: Supabase when set up, otherwise this device only ---------- */
const LKEY = 'klipu:reviews';
const localGet = () => safe(() => JSON.parse(localStorage.getItem(LKEY) || 'null'), null);
const row = (v) => ({ id: v.user_id, uid: v.user_id, name: v.name, rating: v.rating, text: v.text, at: Date.parse(v.created_at) || 0 });
const reviews = {
  shared: configured,
  async list() {
    if (!configured) { const r = localGet(); return r ? [r] : []; }
    const c = await sb(); const { data, error } = await c.from('reviews').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error; return data.map(row);
  },
  async mine() {
    if (!configured) return localGet();
    if (!user) return null;
    const c = await sb(); const { data, error } = await c.from('reviews').select('*').eq('user_id', user.uid).maybeSingle();
    if (error) throw error; return data ? row(data) : null;
  },
  async save(rating, text) {
    rating = Math.round(+rating); text = String(text || '').trim().slice(0, 500);
    if (!(rating >= 1 && rating <= 5)) throw new Error('Choose 1 to 5 stars.');
    if (!configured) { const r = { id: 'local', uid: 'local', name: 'You (this device)', rating, text, at: Date.now() }; safe(() => localStorage.setItem(LKEY, JSON.stringify(r))); return r; }
    if (!user) throw new Error('Please log in first.');
    const c = await sb(); const { error } = await c.from('reviews').upsert({ user_id: user.uid, name: String(user.name).slice(0, 40), rating, text, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw new Error('Could not save the review. Check your internet and try again.');
    return reviews.mine();
  },
  async remove(id) {
    if (!configured) { safe(() => localStorage.removeItem(LKEY)); return; }
    const c = await sb(); const { error } = await c.from('reviews').delete().eq('user_id', id); if (error) throw error;
  },
  isOwner: () => owner || !!(user && OWNER_EMAIL && user.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
};

/* ---------- owner check, owner settings, stats, who is online ---------- */
let ownerP = null, owner = false;
const checkOwner = () => {
  if (!configured || !user) { owner = false; return Promise.resolve(false); }
  if (!ownerP || ownerP.uid !== user.uid) {
    const uid = user.uid;
    ownerP = sb().then((c) => c.rpc('is_owner')).then(({ data }) => { owner = data === true; return owner; }).catch(() => false);
    ownerP.uid = uid;
  }
  return ownerP;
};
const SKEY = 'klipu:settings';
const emptySettings = () => ({ disabled: {}, announce: '' });
async function loadSettings() {
  if (!configured) return emptySettings();
  try {
    const c = await sb(); const { data, error } = await c.from('settings').select('key,value'); if (error) throw error;
    const o = emptySettings();
    for (const r of data) { if (r.key === 'disabled') o.disabled = r.value || {}; if (r.key === 'announce') o.announce = (r.value && r.value.text) || ''; }
    safe(() => localStorage.setItem(SKEY, JSON.stringify(o))); return o;
  } catch (e) { return safe(() => JSON.parse(localStorage.getItem(SKEY) || 'null'), null) || emptySettings(); }
}
const settingsP = loadSettings();
const owned = {
  async saveSettings(disabled, announce) {
    const c = await sb(); const now = new Date().toISOString();
    const { error } = await c.from('settings').upsert([{ key: 'disabled', value: disabled, updated_at: now }, { key: 'announce', value: { text: announce }, updated_at: now }], { onConflict: 'key' });
    if (error) throw new Error('Could not save. Is the SQL for settings run, and are you logged in as the owner?');
    safe(() => localStorage.removeItem(SKEY));
  },
  async stats() {
    const c = await sb(); const { data, error } = await c.from('stats').select('*').order('day', { ascending: false }).limit(60);
    if (error) throw new Error('Could not read the numbers. Run the stats SQL first.'); return data;
  }
};
async function bump(k, n) { if (!configured) return; try { const c = await sb(); await c.rpc('bump', { k, c: n || 1 }); } catch (e) { /* numbers are optional */ } }
const today = new Date().toISOString().slice(0, 10);
if (configured && page !== 'admin' && safe(() => localStorage.getItem('klipu:visit'), '') !== today) { safe(() => localStorage.setItem('klipu:visit', today)); bump('visit'); }

const liveCbs = []; let chan = null, chanReady = false; const mine = { page, working: false };
function startLive() {
  if (!configured || chan) return;
  sb().then((c) => {
    chan = c.channel('klipu-live', { config: { presence: { key: Math.random().toString(36).slice(2) + Date.now().toString(36) } } });
    chan.on('presence', { event: 'sync' }, () => liveCbs.forEach((f) => f(chan.presenceState())));
    chan.subscribe((st) => { if (st === 'SUBSCRIBED') { chanReady = true; chan.track({ ...mine }); } });
  }).catch(() => {});
}
const setWorking = (b) => { mine.working = !!b; if (chanReady) chan.track({ ...mine }); };
const watchLive = (cb) => { liveCbs.push(cb); if (chan && chanReady) cb(chan.presenceState()); };
startLive();

/* announcement bar from the admin page */
settingsP.then((st) => {
  if (!st.announce) return;
  const bar = document.createElement('div'); bar.className = 'ann'; bar.setAttribute('role', 'status'); bar.textContent = st.announce;
  const h = document.getElementById('siteHeader'); if (h) h.after(bar);
});

/* ---------- search index for the 3-dots menu ---------- */
const S = (title, where, url, words) => ({ title, where, url, words: (words || '') + ' ' + title });
const INDEX = [
  S('Home', 'Page', 'index.html', 'landing start welcome'),
  S('Clip app', 'Page', 'app.html', 'make clips video upload tool'),
  S('Reviews', 'Page', 'reviews.html', 'rating stars comments feedback'),
  S('FAQ', 'Page', 'faq.html', 'questions help answers support'),
  S('Log in / Sign up', 'Page', 'login.html', 'account google email password register'),
  S('How it works', 'Home', 'index.html#how', 'three steps process'),
  S('Features', 'Home', 'index.html#features', 'captions moments speaker post text'),
  S('Free and private', 'Home', 'index.html#private', 'price cost privacy upload device'),
  S('Who it is for', 'Home', 'index.html#for', 'creators podcasters teachers business'),
  S('Choose a video', 'Clip app', 'app.html#viewSetup', 'file upload source'),
  S('Clip length', 'Clip app setting', 'app.html#len', '30 seconds 1 minute duration'),
  S('Number of clips', 'Clip app setting', 'app.html#count', 'how many one best'),
  S('Language in the video', 'Clip app setting', 'app.html#lang', 'english hindi bengali auto detect'),
  S('Speech model', 'Clip app setting', 'app.html#model', 'tiny base accuracy whisper'),
  S('Clip quality', 'Clip app setting', 'app.html#quality', '540p 720p hd light'),
  S('Speed', 'Clip app setting', 'app.html#speed', 'safe balanced fast phone slow'),
  S('Shape of the clip', 'Clip app setting', 'app.html#pickFmt', '9:16 vertical square 4:5 16:9 4:3 ratio size'),
  S('Framing', 'Clip app setting', 'app.html#pickFrame', 'follow speaker centre split pip picture in picture'),
  S('Templates', 'Clip app setting', 'app.html#pickTpl', 'x post tiktok news breaking frame name handle'),
  S('Top line (topic + hook)', 'Clip app setting', 'app.html#pickTop', 'hook tag title above'),
  S('Caption style', 'Clip app setting', 'app.html#pickCap', 'pop karaoke bold movie bar comic neon typewriter slide box subtitles')
];
FAQ.forEach((f, i) => INDEX.push({ title: f[1], where: 'FAQ · ' + f[0], url: 'faq.html#q-' + i, words: f[1] + ' ' + f[2] + ' ' + f[0] }));
const norm = (s) => String(s).toLowerCase();
function search(q) {
  const t = norm(q).split(/\s+/).filter(Boolean);
  if (!t.length) return INDEX.filter((x) => x.where === 'Page' || x.where === 'Home');
  return INDEX.map((x) => {
    const hay = norm(x.words), ti = norm(x.title); let s = 0;
    for (const w of t) { if (!hay.includes(w)) return null; s += ti.includes(w) ? 3 : 1; if (ti.startsWith(w)) s += 2; }
    return { x, s };
  }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 12).map((o) => o.x);
}

/* ---------- header, menu, footer ---------- */
const NAV = [['index.html', 'Home', 'home'], ['app.html', 'Clip app', 'app'], ['reviews.html', 'Reviews', 'reviews'], ['faq.html', 'FAQ', 'faq']];
function build() {
  const hdr = document.createElement('header'); hdr.className = 'sh'; hdr.id = 'siteHeader';
  hdr.innerHTML = `<div class="sh-in">
    <a class="sh-logo" href="index.html" aria-label="Klipu home"><img src="logo.png" alt="Klipu" width="104" height="39"></a>
    <nav class="sh-nav" aria-label="Pages">${NAV.map((n) => `<a href="${n[0]}"${n[2] === page ? ' aria-current="page"' : ''}>${n[1]}</a>`).join('')}</nav>
    <div class="sh-r">
      <a class="sh-login" id="shLogin" href="login.html">Log in</a>
      <button class="sh-ic" id="shTheme" type="button" aria-label="Switch light or dark"></button>
      <button class="sh-ic" id="shMenu" type="button" aria-label="Menu and search" aria-expanded="false" aria-controls="shPanel"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></button>
    </div></div>
    <div class="sh-panel" id="shPanel" hidden>
      <div class="sh-box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4a6 6 0 104.2 10.3l4.8 4.8 1.4-1.4-4.8-4.8A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z"/></svg>
        <input id="shQ" type="search" placeholder="Search pages, settings and questions" autocomplete="off" aria-label="Search the whole site"></div>
      <ul class="sh-res" id="shRes" role="listbox"></ul>
      <div class="sh-foot"><div class="installbar" id="installBar" hidden><button class="sh-btn" id="installBtn" type="button">Install app</button><span class="note" id="installNote"></span></div>
        <button class="sh-btn" id="shOut" type="button" hidden>Log out</button></div>
    </div>`;
  document.body.prepend(hdr);
  const ft = document.createElement('footer'); ft.className = 'sf';
  ft.innerHTML = `<div class="sf-in"><div><a href="index.html"><img src="logo.png" alt="Klipu" width="92" height="34"></a><p>Free clips from long videos, made on your own phone. Your video never leaves your device.</p></div>
    <div><h4>Pages</h4><ul>${NAV.map((n) => `<li><a href="${n[0]}">${n[1]}</a></li>`).join('')}<li><a href="login.html">Log in</a></li></ul></div>
    <div><h4>Help</h4><ul><li><a href="faq.html">Questions and answers</a></li><li><a href="reviews.html">Leave a review</a></li></ul></div></div>
    <div class="sf-bt">© ${new Date().getFullYear()} Klipu · Built with Transformers.js and OpenAI Whisper.</div>`;
  document.body.append(ft);

  const panel = $('#shPanel'), btn = $('#shMenu'), q = $('#shQ'), res = $('#shRes');
  const render = () => {
    const r = search(q.value);
    res.innerHTML = r.length ? r.map((x) => `<li role="option"><a href="${x.url}"><b>${esc(x.title)}</b><span>${esc(x.where)}</span></a></li>`).join('')
      : `<li class="none">Nothing found for "${esc(q.value)}". Try another word, or open the <a href="faq.html">FAQ</a>.</li>`;
  };
  const toggle = (on) => { panel.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on) { render(); setTimeout(() => q.focus(), 30); } };
  btn.addEventListener('click', () => toggle(panel.hidden));
  q.addEventListener('input', render);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = res.querySelector('a'); if (a) location.href = a.getAttribute('href'); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); toggle(true); } });
  document.addEventListener('click', (e) => { if (!panel.hidden && !e.target.closest('#siteHeader')) toggle(false); });
  res.addEventListener('click', (e) => { const a = e.target.closest('a'); if (a) toggle(false); });

  const tb = $('#shTheme');
  const paint = () => { const d = document.documentElement.dataset.theme === 'dark'; tb.innerHTML = d
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a5 5 0 100 10 5 5 0 000-10zM11 1h2v3h-2zM11 20h2v3h-2zM1 11h3v2H1zM20 11h3v2h-3z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z"/></svg>'; tb.title = d ? 'Switch to light' : 'Switch to dark'; };
  paint();
  tb.addEventListener('click', () => { const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = n; safe(() => localStorage.setItem('klipu:theme', n)); paint(); });

  const lg = $('#shLogin'), out = $('#shOut');
  const who = (u) => { if (u) { lg.textContent = u.name.split(' ')[0]; lg.href = 'reviews.html'; lg.title = u.email; lg.classList.add('on'); out.hidden = false; } else { lg.textContent = 'Log in'; lg.href = 'login.html'; lg.classList.remove('on'); out.hidden = true; } };
  if (!configured) lg.href = 'login.html';
  listeners.push(who); who(user);
  out.addEventListener('click', async () => { await auth.out(); location.href = 'login.html'; });
}

/* ---------- review pop-up after clips are done ---------- */
async function askReview() {
  try {
    if (safe(() => localStorage.getItem('klipu:askedAt'), 0) > Date.now() - 864e5 * 3) return;
    if (await reviews.mine()) return;
    const el = document.createElement('div'); el.className = 'rv-pop'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Rate Klipu');
    let r = 0;
    el.innerHTML = `<div class="rv-card"><button class="rv-x" type="button" aria-label="Close">×</button>
      <h3>Your clips are ready 🎉</h3><p>How was Klipu? Your rating helps other people find it.</p>
      <div class="stars" id="pStars" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" data-n="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`).join('')}</div>
      <textarea id="pText" maxlength="500" rows="3" placeholder="Optional: what worked, what did not?"></textarea>
      <div class="rv-err" id="pErr" hidden></div>
      <div class="rv-row"><button class="primary" id="pSend" type="button">Send review</button><button class="ghost" id="pLater" type="button">Not now</button></div>
      <a href="reviews.html" class="rv-more">See all reviews</a></div>`;
    document.body.append(el);
    safe(() => localStorage.setItem('klipu:askedAt', String(Date.now())));
    const close = () => el.remove();
    const paint = () => el.querySelectorAll('#pStars button').forEach((b) => { const on = +b.dataset.n <= r; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(+b.dataset.n === r)); });
    el.addEventListener('click', async (e) => {
      if (e.target === el || e.target.closest('.rv-x') || e.target.closest('#pLater')) return close();
      const s = e.target.closest('#pStars button'); if (s) { r = +s.dataset.n; paint(); }
      if (e.target.closest('#pSend')) {
        const er = $('#pErr', el); er.hidden = true;
        if (configured && !user) { er.innerHTML = 'Please <a href="login.html?next=reviews.html">sign in</a> to leave a review.'; er.hidden = false; return; }
        try { await reviews.save(r, $('#pText', el).value); el.querySelector('.rv-card').innerHTML = '<h3>Thank you!</h3><p>Your review is saved.</p><a class="rv-more" href="reviews.html">See all reviews</a><div class="rv-row"><button class="ghost" id="pClose" type="button">Close</button></div>'; $('#pClose', el).onclick = close; }
        catch (x) { er.textContent = x.message; er.hidden = false; }
      }
    });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
  } catch (e) { /* never block the app */ }
}

/* ---------- install as an app + offline shell ---------- */
function pwa() {
  const bar = $('#installBar'), btn = $('#installBtn'), note = $('#installNote');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (bar && !standalone) {
    let ev = null;
    addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); ev = e; bar.hidden = false; });
    btn.addEventListener('click', async () => { if (!ev) { note.textContent = 'In Chrome, open the ⋮ menu and choose "Add to Home screen".'; return; } ev.prompt(); try { await ev.userChoice; } catch (e) { /* ok */ } ev = null; bar.hidden = true; });
    addEventListener('appinstalled', () => { bar.hidden = true; });
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

build(); pwa();

/* ---------- login is asked only when someone tries to make clips ---------- */
const gate = configured && REQUIRE_LOGIN;
let resolved = false; ready.then(() => { resolved = true; });
const goLogin = (next) => location.assign('login.html?next=' + encodeURIComponent(next));
if (gate && (page === 'app' || page === 'home')) {
  const guard = (e, next) => {
    if (user) return;
    e.preventDefault(); e.stopPropagation();
    if (resolved) goLogin(next); else ready.then((u) => { if (!u) goLogin(next); });
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('#drop, #file, #go')) return guard(e, 'app.html');
    const a = e.target.closest('a.lp-btn[href="app.html"]'); if (a) guard(e, 'app.html');
  }, true);
  document.addEventListener('drop', (e) => { if (e.target.closest && e.target.closest('#drop')) guard(e, 'app.html'); }, true);
}

export const site = { configured, checkOwner, settings: settingsP, owned, bump, setWorking, watchLive, get owner() { return owner; }, auth, reviews, esc, askReview, ready, get user() { return user; }, onUser(cb) { listeners.push(cb); cb(user); }, gate, page };
