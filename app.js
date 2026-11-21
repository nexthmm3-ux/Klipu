import { site } from './site.js';
import { CATALOG } from './controls.js';
const $ = (id) => document.getElementById(id);
const state = { file: null, duration: 0, segs: [], clips: [], slots: [], busy: false };

/* ---------- YOUR PROMO / AD SETTINGS: edit these two lines ---------- */
const PROMO = {
  top:    { text: '', url: '' },   // e.g. { text: 'Try my other app', url: 'https://example.com' }
  bottom: { text: '', url: '' }
};
for (const [k, id] of [['top', 'adTop'], ['bottom', 'adBottom']]) {
  const p = PROMO[k], el = $(id);
  if (p.text && p.url) {
    const tag = document.createElement('b'); tag.textContent = 'Ad';
    const a = document.createElement('a'); a.href = p.url; a.target = '_blank'; a.rel = 'sponsored noopener'; a.textContent = p.text;
    el.append(tag, a); el.hidden = false;
  }
}


/* ads.json (next to index.html) can hold the same two slots, so you never have to edit this file for a new sponsor.
   Example: {"top":{"text":"Try my other app","url":"https://example.com"},"bottom":{"text":"","url":""}} */
(async () => {
  try {
    const r = await fetch('ads.json', { cache: 'no-store' }); if (!r.ok) return;
    const j = await r.json();
    for (const [k, id] of [['top', 'adTop'], ['bottom', 'adBottom']]) {
      const p = j && j[k], el = $(id);
      if (!p || !el || !p.text || !/^https?:\/\//i.test(p.url || '')) continue;
      el.replaceChildren(); const tag = document.createElement('b'); tag.textContent = 'Ad';
      const a = document.createElement('a'); a.href = p.url; a.target = '_blank'; a.rel = 'sponsored noopener'; a.textContent = p.text;
      el.append(tag, a); el.hidden = false;
    }
  } catch (e) { /* no ads.json: fine */ }
})();

/* ---------- the Klipu mark burned into the bottom of every clip ----------
   KLIPU_MARK.on = true puts it on every clip. Later, "watch an ad to remove it" can simply set this to false for that visitor. */
const KLIPU_MARK = { on: true, img: new Image() };
KLIPU_MARK.img.src = 'mark.png';
function drawMark(g, W, H, vertical, plate) {
  const m = KLIPU_MARK; if (!m.on || !m.img.complete || !m.img.naturalWidth) return;
  const w = Math.round(W * (vertical ? 0.42 : 0.24)), hgt = Math.round(w * m.img.naturalHeight / m.img.naturalWidth);
  const x = vertical ? Math.round((W - w) / 2) : W - w - Math.round(W * 0.025), y = H - hgt - Math.round(H * (vertical ? 0.04 : 0.03));
  if (plate) { g.save(); g.fillStyle = '#07080d'; rrect(g, x - w * 0.06, y - hgt * 0.1, w * 1.12, hgt * 1.2, hgt * 0.3); g.fill(); g.restore(); }
  g.save(); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = Math.round(w * 0.04); g.globalAlpha = 0.96;
  g.drawImage(m.img, x, y, w, hgt); g.restore();
}

/* ---------- helpers ---------- */
const fmt = (t) => {
  t = Math.max(0, Math.round(t));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
};
const timeout = (ms, msg) => new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms));
const once = (el, ev) => new Promise((r) => el.addEventListener(ev, r, { once: true }));
function showErr(e) {
  console.error(e);
  $('errTxt').textContent = 'Something went wrong:\n' + (e && e.message ? e.message : e);
  $('errTxt').hidden = false; $('back').hidden = false;
}
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason, m = r && r.message ? r.message : '';
  if ((r && r.name === 'AbortError') || /play\(\)|interrupted/i.test(m)) { e.preventDefault(); return; } // harmless video play/pause clash
  showErr(r);
});
let t0 = 0, tick = null;
const startTimer = () => { t0 = Date.now(); clearInterval(tick); $('elapsed').textContent = 'Elapsed 0:00'; tick = setInterval(() => { $('elapsed').textContent = 'Elapsed ' + fmt((Date.now() - t0) / 1000); }, 1000); };
const stopTimer = () => clearInterval(tick);
const setStage = (txt, pct) => { $('stageTxt').textContent = txt; if (pct != null) $('barFill').style.width = Math.min(100, pct) + '%'; };
let wl = null, wantAwake = false;
let nosleep = null;
function noSleep(on) { // a silent looping video keeps the screen on even where the wake-lock API is missing (e.g. a downloaded file)
  try {
    if (on) {
      if (!nosleep) { nosleep = document.createElement('video'); nosleep.className = 'hidvid'; nosleep.muted = true; nosleep.loop = true; nosleep.playsInline = true; nosleep.setAttribute('playsinline', ''); nosleep.src = 'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAJKEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggEeTbuMU6uEHFO7a1OsggI07AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjAuMTYuMTAwV0GNTGF2ZjYwLjE2LjEwMESJiECPQAAAAAAAFlSua8GuAQAAAAAAADjXgQFzxYghBnoVTYDsvZyBACK1nIN1bmSIgQCGhVZfVlA4g4EBI+ODhAvrwgDgibCBQLqBQJqBAhJUw2f8c3OgY8CAZ8iaRaOHRU5DT0RFUkSHjUxhdmY2MC4xNi4xMDBzc9ZjwItjxYghBnoVTYDsvWfIoUWjh0VOQ09ERVJEh5RMYXZjNjAuMzEuMTAyIGxpYnZweGfIoUWjiERVUkFUSU9ORIeTMDA6MDA6MDEuMDAwMDAwMDAwAB9DtnVAj+eBAKOqgQAAgPACAJ0BKkAAQAAARwiFhYiFhIgCAgAGcDxCYAqyIPcwAP7/q1CAo5aBAMgA0QEAARAQABgAGFgv9AAIjoAAo5aBAZAA0QEAARAQABgAGFgv9AAIjoAAo5aBAlgA0QEAARAQABgAGFgv9AAIjoAAo5aBAyAA0QEAARAQABgAGFgv9AAIjoAAHFO7a5G7j7OBALeK94EB8YIBn/CBAw=='; document.body.appendChild(nosleep); }
      const p = nosleep.play(); if (p && p.catch) p.catch(() => {});
    } else if (nosleep) nosleep.pause();
  } catch (e) { /* ok */ }
}
async function keepAwake(on) {
  wantAwake = on; noSleep(on);
  try {
    if (on && !wl && navigator.wakeLock) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); }
    else if (!on && wl) { await wl.release(); wl = null; }
  } catch (e) { /* not available here */ }
}
document.addEventListener('visibilitychange', () => { if (wantAwake && document.visibilityState === 'visible') keepAwake(true); });

/* ---------- file selection ---------- */
function chooseFile(f) {
  if (!f) return;
  disposeRenderer();
  state.file = f;
  $('fname').textContent = f.name;
  $('fmeta').textContent = (f.size / 1048576).toFixed(0) + ' MB · click to change';
  // read the length with a short-lived element, then release it so it does not hold memory
  const u = URL.createObjectURL(f), v = document.createElement('video');
  v.preload = 'metadata'; v.src = u;
  v.onloadedmetadata = () => { state.duration = v.duration; $('fmeta').textContent += ' · ' + fmt(v.duration); v.removeAttribute('src'); v.load(); URL.revokeObjectURL(u); };
  v.onerror = () => { URL.revokeObjectURL(u); };
  $('go').disabled = false;
}
$('file').addEventListener('change', (e) => chooseFile(e.target.files[0]));
const drop = $('drop');
['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => chooseFile(e.dataTransfer.files[0]));
drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('file').click(); } });

/* ---------- audio extraction (16 kHz mono) ---------- */
async function extractAudio(file) {
  let buf;
  try { buf = await file.arrayBuffer(); }
  catch (e) { throw new Error('This file is too large for the browser to read at once. Try a smaller or compressed version of the video.'); }
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  let audio;
  try { audio = await ctx.decodeAudioData(buf); }
  catch (e) { throw new Error('The browser could not read the sound of this video. Try an MP4 (H.264) file, or a smaller one.'); }
  buf = null;
  const ch = audio.numberOfChannels, out = new Float32Array(audio.length);
  for (let c = 0; c < ch; c++) { const d = audio.getChannelData(c); for (let i = 0; i < d.length; i++) out[i] += d[i] / ch; }
  ctx.close();
  return out;
}

/* ---------- speech to text ----------
   The listening work runs in background workers (up to 3 at the same time on a fast phone), so the page and the game never freeze.
   If the browser cannot start a worker, the same code runs on the page instead. Finished 30-second pieces are saved, so a stopped job resumes. */
const SR_ = 16000, WIN_ = 30 * SR_;
let ASR_LANG = '';
const LANGS = { en: '', hi: 'hindi', bn: 'bengali', auto: '' };
const modelFor = () => 'Xenova/whisper-' + $('model').value + ($('lang').value === 'en' ? '.en' : '');
function loadCache(key) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); if (v && Array.isArray(v.segs) && Array.isArray(v.done)) return v; } catch (e) { /* no saved progress */ }
  return { segs: [], done: [] };
}
function saveCache(key, cache) { try { localStorage.setItem(key, JSON.stringify(cache)); } catch (e) { /* storage full or blocked */ } }
const isLoud = (piece) => {
  if (piece.length < SR_) return false;
  let sum = 0, n = 0; for (let i = 0; i < piece.length; i += 8) { sum += piece[i] * piece[i]; n++; }
  return Math.sqrt(sum / n) > 0.004;
};

// Self-contained: it is also copied into the worker, so it may only use its own arguments and browser globals.
async function transcribeChunk(piece, off, asr, lang) {
  const out = [], SR = 16000;
  const res = await asr(piece, lang ? { return_timestamps: true, language: lang, task: 'transcribe' } : { return_timestamps: true });
  const list = res.chunks && res.chunks.length ? res.chunks : [{ text: res.text, timestamp: [0, piece.length / SR] }];
  for (const c of list) {
    const text = (c.text || '').trim();
    if (text.length < 2 || /^[\[(].*[\])]$/.test(text)) continue;
    const a = (c.timestamp && c.timestamp[0]) || 0;
    let b = c.timestamp && c.timestamp[1];
    if (b == null || b <= a) b = Math.min(a + 5, piece.length / SR);
    out.push({ start: off + a, end: off + b, text });
  }
  return out;
}
// Self-contained: runs inside each background worker.
function asrWorkerMain() {
  let asr = null;
  self.postMessage({ t: 'hello' });
  self.onmessage = async (e) => {
    const m = e.data;
    try {
      if (m.t === 'init') {
        let tf = null, local = false;
        if (m.localLib) { try { tf = await import(m.localLib); local = true; } catch (err) { tf = null; } }
        if (!tf) tf = await import(m.cdnLib);
        const env = tf.env;
        env.allowLocalModels = !!m.localLib; env.allowRemoteModels = true; env.localModelPath = m.modelPath;
        if (local && m.wasmPaths) env.backends.onnx.wasm.wasmPaths = m.wasmPaths;
        try { env.backends.onnx.wasm.numThreads = 1; } catch (err) { /* default */ }
        const files = {};
        asr = await tf.pipeline('automatic-speech-recognition', m.model, {
          device: 'wasm',
          progress_callback: (p) => {
            if (p.status === 'progress' && p.file) {
              files[p.file] = { loaded: p.loaded, total: p.total };
              let l = 0, t = 0; for (const k in files) { l += files[k].loaded; t += files[k].total; }
              if (t) self.postMessage({ t: 'dl', frac: l / t });
            }
          }
        });
        self.postMessage({ t: 'ready' });
      } else if (m.t === 'job') {
        const segs = await transcribeChunk(m.audio, m.off, asr, m.lang);
        self.postMessage({ t: 'result', idx: m.idx, segs });
      }
    } catch (err) { self.postMessage({ t: 'error', message: String(err && err.message ? err.message : err), idx: m.idx }); }
  };
}
const ASR_WORKER_SRC = () => transcribeChunk.toString() + '\n(' + asrWorkerMain.toString() + ')();';

function libUrls() {
  const isHttp = location.protocol.startsWith('http');
  return {
    isHttp,
    localLib: isHttp ? new URL('./vendor/transformers.min.js', location.href).href : '',
    cdnLib: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1',
    modelPath: new URL('./models/', location.href).href,
    wasmPaths: new URL('./vendor/', location.href).href
  };
}
const lanes = (kind, max) => { // kind: 'asr' (listening) or 'cut' (making clips)
  const mode = $('speed').value, hc = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  if (mode === 'safe' || mem <= 2) return 1;
  const cap = mode === 'fast' ? max : (kind === 'asr' ? 2 : 1);
  return Math.max(1, Math.min(cap, hc >= 8 ? 3 : hc >= 4 ? 2 : 1));
};
function listeningText(doneWin, totalWin, startWin, startMs, n) {
  const el = Math.max((performance.now() - startMs) / 1000, 1), rate = (doneWin - startWin) / el; // windows per second
  const left = rate > 0 ? (totalWin - doneWin) / rate : 0;
  return 'Listening to the video… ' + fmt(doneWin * 30) + ' of ' + fmt(totalWin * 30) + (n > 1 ? ' · ' + n + ' helpers working' : '') + (doneWin > startWin ? ' · about ' + fmt(left) + ' left' : '');
}

function transcribePool(audio, modelId, key, cache) {
  return new Promise((resolve, reject) => {
    const total = Math.ceil(audio.length / WIN_), done = new Set(cache.done), queue = [];
    for (let i = 0; i < total; i++) if (!done.has(i)) queue.push(i);
    const urls = libUrls(), want = Math.min(lanes('asr', modelId.includes('base') ? 2 : 3), queue.length);
    const workers = [], startWin = done.size, startMs = { v: 0 };
    let settled = false, inflight = 0, anyReady = false, blobUrl = null;
    const noWorker = (why) => Object.assign(new Error(why), { fallback: true });
    const kill = () => { workers.forEach((w) => { try { w.terminate(); } catch (e) { /* gone */ } }); if (blobUrl) URL.revokeObjectURL(blobUrl); };
    const fail = (e) => { if (settled) return; settled = true; kill(); reject(e); };
    const report = () => setStage(listeningText(done.size, total, startWin, startMs.v, workers.filter((w) => w.ready && !w.dead).length), 10 + (done.size / total) * 85);
    const finish = () => {
      if (settled) return; settled = true; kill();
      cache.segs.sort((a, b) => a.start - b.start); resolve(cache.segs);
    };
    const record = (idx, segs) => { for (const s of segs) cache.segs.push(s); done.add(idx); cache.done.push(idx); saveCache(key, cache); };
    const pump = (w) => {
      while (!settled && queue.length) {
        const idx = queue.shift(), s = idx * WIN_, piece = audio.slice(s, Math.min(s + WIN_, audio.length));
        if (!isLoud(piece)) { record(idx, []); continue; }
        w.cur = idx; inflight++;
        w.postMessage({ t: 'job', idx, off: s / SR_, audio: piece, lang: ASR_LANG }, [piece.buffer]);
        return;
      }
      w.cur = null;
      if (!queue.length && !inflight) finish();
    };
    const spawn = (k) => {
      let w;
      try { w = new Worker(blobUrl || (blobUrl = URL.createObjectURL(new Blob([ASR_WORKER_SRC()], { type: 'text/javascript' })))); }
      catch (e) { if (k === 0) fail(noWorker('worker not allowed')); return; }
      w.k = k; w.cur = null; w.ready = false; w.dead = false; workers.push(w);
      let hello = false;
      const die = (err) => {
        if (w.dead) return; w.dead = true; try { w.terminate(); } catch (e) { /* gone */ }
        if (w.cur != null) { queue.unshift(w.cur); inflight--; w.cur = null; }
        if (k === 0 && !anyReady) { fail(err.fallback ? err : Object.assign(noWorker(err.message), { detail: err.message })); return; }
        if (workers.every((x) => x.dead)) { fail(err); return; }
        workers.filter((x) => !x.dead && x.ready && x.cur == null).forEach(pump); // others take over the work
      };
      const helloTimer = setTimeout(() => { if (!hello) die(noWorker('worker did not start')); }, 6000);
      w.onerror = (ev) => { clearTimeout(helloTimer); die(new Error('The speech worker stopped: ' + (ev.message || 'unknown error'))); };
      w.onmessage = (e) => {
        const m = e.data;
        if (m.t === 'hello') { hello = true; clearTimeout(helloTimer); w.postMessage({ t: 'init', model: modelId, localLib: urls.localLib, cdnLib: urls.cdnLib, modelPath: urls.modelPath, wasmPaths: urls.wasmPaths }); }
        else if (m.t === 'dl') { if (k === 0 && !anyReady) setStage('Downloading speech model (first time only) ' + Math.round(m.frac * 100) + '%', 2 + m.frac * 8); }
        else if (m.t === 'ready') {
          w.ready = true;
          if (!anyReady) { anyReady = true; startMs.v = performance.now(); for (let j = 1; j < want; j++) setTimeout(() => spawn(j), 300 * j); }
          setStage('Listening to the video…', 10);
          pump(w);
        } else if (m.t === 'result') { inflight--; w.cur = null; record(m.idx, m.segs); report(); pump(w); }
        else if (m.t === 'error') {
          if (k === 0 && !anyReady) { die(Object.assign(noWorker(m.message), { detail: m.message })); return; }
          if (m.idx != null) { die(new Error(m.message)); return; }
          die(new Error(m.message));
        }
      };
    };
    if (!queue.length) { finish(); return; }
    spawn(0);
  });
}

async function transcribeOnMain(audio, modelId, key, cache) {
  setStage('Loading speech model…', 2);
  const urls = libUrls();
  let tf = null, local = false;
  if (urls.isHttp) { try { tf = await import(urls.localLib); local = true; } catch (e) { tf = null; } }
  if (!tf) tf = await import(urls.cdnLib);
  const { pipeline, env } = tf;
  env.allowLocalModels = urls.isHttp; env.allowRemoteModels = true; env.localModelPath = urls.modelPath;
  if (local) env.backends.onnx.wasm.wasmPaths = urls.wasmPaths;
  try { env.backends.onnx.wasm.numThreads = 1; } catch (e) { /* default */ }
  const files = {};
  const progress_callback = (p) => {
    if (p.status === 'progress' && p.file) {
      files[p.file] = { loaded: p.loaded, total: p.total };
      let l = 0, t = 0; for (const k in files) { l += files[k].loaded; t += files[k].total; }
      if (t) setStage('Downloading speech model (first time only) ' + Math.round(l / t * 100) + '%', 2 + (l / t) * 8);
    }
  };
  let asr;
  try { asr = await pipeline('automatic-speech-recognition', modelId, { device: 'wasm', progress_callback }); }
  catch (e) { throw new Error('The speech engine could not start. Check your internet and try again.\n(' + (e && e.message ? e.message : e) + ')'); }
  const total = Math.ceil(audio.length / WIN_), done = new Set(cache.done), startWin = done.size, startMs = performance.now();
  for (let idx = 0; idx < total; idx++) {
    if (done.has(idx)) continue;
    const s = idx * WIN_, piece = audio.subarray(s, Math.min(s + WIN_, audio.length));
    const segs = isLoud(piece) ? await transcribeChunk(piece, s / SR_, asr, ASR_LANG) : [];
    for (const x of segs) cache.segs.push(x);
    done.add(idx); cache.done.push(idx); saveCache(key, cache);
    setStage(listeningText(done.size, total, startWin, startMs, 1), 10 + (done.size / total) * 85);
    await new Promise((r) => setTimeout(r, 0));
  }
  cache.segs.sort((a, b) => a.start - b.start);
  return cache.segs;
}

async function transcribe(audio, modelId, key) {
  const cache = loadCache(key), total = Math.ceil(audio.length / WIN_);
  if (cache.done.length >= total) { cache.segs.sort((a, b) => a.start - b.start); return cache.segs; } // finished earlier
  setStage('Loading speech model…', 2);
  try { return await transcribePool(audio, modelId, key, cache); }
  catch (e) {
    if (!e || !e.fallback) throw e;
    console.warn('Background worker not available, running on the page instead.', e);
    return transcribeOnMain(audio, modelId, key, loadCache(key));
  }
}

/* ---------- picking the key moments ---------- */
const STOP = new Set(('the and for are but not you all any can had her was one our out has have this that with from they will would there their what about which when your said them than then into some could other these also been were just like very more over such only even most make made much those because while where does did how its his she him who why get got going gonna want really thing things yeah okay well kind lot know think see say way use used using been being both each few many may might must should too own same here our out off yes').split(/\s+/));
const CUES = /\b(most important|key (point|thing|idea)|the secret|the reason|here'?s (why|how|the)|mistake|remember|number (one|1|two|2|three|3)|biggest|the truth|let me (tell|show|explain)|for example|to sum up|in summary|the problem|the solution|lesson|how to|never|always)\b/gi;
const toks = (s) => (s.toLowerCase().match(/[\p{L}\p{M}']+/gu) || []).filter((w) => w.length > 2 && !STOP.has(w));
const endsSentence = (s) => /[.!?।॥]["')\]]?$/.test(s.trim());

function pickClips(segs, L, N) {
  if (!segs.length) return [];
  const df = new Map(), buckets = new Map();
  for (const s of segs) {
    const b = Math.floor(s.start / 30);
    if (!buckets.has(b)) buckets.set(b, new Set());
    toks(s.text).forEach((w) => buckets.get(b).add(w));
  }
  buckets.forEach((set) => set.forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  const nb = buckets.size;
  const idf = (w) => Math.log(nb / (1 + (df.get(w) || 0))) + 1;

  const cands = [];
  for (let i = 0; i < segs.length; i++) {
    if (i > 0 && !endsSentence(segs[i - 1].text)) continue;
    const st = segs[i].start;
    let j = i;
    while (j < segs.length - 1 && segs[j].end - st < L - 5) j++;
    while (j < segs.length - 1 && !endsSentence(segs[j].text) && segs[j].end - st < L + 15) j++;
    const dur = segs[j].end - st;
    if (dur < L * 0.6) continue;
    const tf = new Map(); let text = '';
    for (let k = i; k <= j; k++) { text += segs[k].text + ' '; toks(segs[k].text).forEach((w) => tf.set(w, (tf.get(w) || 0) + 1)); }
    let sc = 0; const ranked = [];
    tf.forEach((c, w) => { const v = Math.sqrt(c) * idf(w); sc += v; ranked.push([w, v]); });
    sc /= Math.sqrt(dur);
    const cues = (text.match(CUES) || []).length;
    sc += Math.min(cues, 4) * 2;
    sc += (text.split(/\s+/).length / dur) * 1.5;
    ranked.sort((a, b) => b[1] - a[1]);
    cands.push({ start: st, end: segs[j].end, score: sc, text: text.trim(), words: ranked.slice(0, 3).map((r) => r[0]), i, j, idf });
  }
  cands.sort((a, b) => b.score - a.score);
  const chosen = [];
  for (const c of cands) {
    if (chosen.length >= N) break;
    if (chosen.every((p) => c.end + 10 < p.start || c.start > p.end + 10)) chosen.push(c);
  }
  const allSc = cands.map((x) => x.score).sort((a, b) => a - b);
  const pctOf = (s) => { let k = 0; while (k < allSc.length && allSc[k] <= s) k++; return allSc.length > 1 ? (k - 1) / (allSc.length - 1) : 1; };
  chosen.sort((a, b) => a.start - b.start);
  return chosen.map((c, n) => ({
    n: n + 1, start: c.start, end: c.end, text: c.text, words: c.words, score: Math.round(55 + 40 * pctOf(c.score)),
    title: c.words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' · ') || 'Clip ' + (n + 1),
    tag: c.words.slice(0, 2).map((w) => w[0].toUpperCase() + w.slice(1)).join(' · ') || 'Key moment',
    hook: hookFor(segs, c, idf),
    i: c.i, j: c.j
  }));
}
/* the best single sentence of the clip, shown on top as the hook */
function hookFor(segs, c, idf) {
  const sents = []; let cur = '';
  for (let k = c.i; k <= c.j; k++) { cur += (cur ? ' ' : '') + segs[k].text.trim(); if (endsSentence(segs[k].text) || k === c.j) { sents.push(cur); cur = ''; } }
  let best = null, bs = -1;
  sents.forEach((t, n) => {
    const len = t.length; if (len < 22 || len > 140) return;
    const ws = toks(t); let sc = ws.reduce((a, w) => a + idf(w), 0) / Math.sqrt(ws.length || 1);
    sc += ((t.match(CUES) || []).length) * 3 + (/\?$/.test(t) ? 2 : 0) + (n === 0 ? 1 : 0);
    if (sc > bs) { bs = sc; best = t; }
  });
  let h = (best || (sents[0] || '')).replace(/\b([\w']+)([,.\s]+)\1\b/gi, '$1').replace(/^(and|so|but|um|uh|well|yeah|okay|ok)[,\s]+/i, '').trim();
  if (h.length > 72) { h = h.slice(0, 72); h = h.slice(0, h.lastIndexOf(' ')) + '…'; }
  return h ? h[0].toUpperCase() + h.slice(1) : '';
}

/* ---------- page 2: one slot per clip ---------- */
function buildSlots(n) {
  const list = $('slots'); list.replaceChildren(); state.slots = [];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div'); el.className = 'slot';
    el.innerHTML = '<div class="n"></div><div><h3></h3><div class="tc"></div><div class="live" hidden></div><div class="bar"><i></i></div>' +
      '<div class="srow"><span class="pct">0%</span><span class="sstat">Waiting</span></div><div class="row acts" hidden></div></div>';
    el.querySelector('.n').textContent = String(i + 1).padStart(2, '0');
    el.querySelector('h3').textContent = 'Clip ' + (i + 1);
    el.querySelector('.tc').textContent = 'Waiting for the key moments…';
    const slot = { el, h: el.querySelector('h3'), tc: el.querySelector('.tc'), bar: el.querySelector('.bar > i'), pct: el.querySelector('.pct'), stat: el.querySelector('.sstat'), acts: el.querySelector('.acts'), live: el.querySelector('.live'), lastP: -1, url: null };
    state.slots.push(slot); list.appendChild(el);
  }
}
function trimSlots(n) { while (state.slots.length > n) { state.slots.pop().el.remove(); } }
function fillSlot(slot, c) {
  slot.h.textContent = c.hook || c.title;
  slot.tc.textContent = fmt(c.start) + ' – ' + fmt(c.end) + ' · ' + Math.round(c.end - c.start) + ' s';
}
function setSlotP(slot, p, text) {
  p = Math.max(0, Math.min(100, Math.round(p)));
  if (p !== slot.lastP) { slot.lastP = p; slot.bar.style.width = p + '%'; slot.pct.textContent = p + '%'; }
  if (text) slot.stat.textContent = text;
}
/* ---------- post text for each clip: title, description, hashtags (made here, nothing is sent anywhere) ---------- */
function postInfo(c) {
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').replace(/…$/, '').trim();
  let title = clean(c.hook) || clean(c.title);
  if (title.length > 70) { title = title.slice(0, 70); title = title.slice(0, title.lastIndexOf(' ') > 30 ? title.lastIndexOf(' ') : 70); }
  const sents = clean(c.text).split(/(?<=[.!?।॥])\s+/).filter((s) => s.length > 20);
  let desc = (sents[0] || clean(c.text)); if (sents[1] && desc.length < 90) desc += ' ' + sents[1];
  if (desc.length > 180) { desc = desc.slice(0, 180); desc = desc.slice(0, desc.lastIndexOf(' ')) + '…'; }
  const tags = [];
  (c.words || []).forEach((w) => { const t = w.replace(/[^\p{L}\p{N}]/gu, ''); if (t.length > 2 && tags.length < 4) tags.push('#' + t[0].toUpperCase() + t.slice(1)); });
  ['#Shorts', '#Reels', '#FYP'].forEach((t) => { if (!tags.includes(t)) tags.push(t); });
  return { title, desc, tags: tags.join(' '), score: c.score || 0 };
}
function copyText(text, btn) {
  const done = () => { const o = btn.dataset.o || btn.textContent; btn.dataset.o = o; btn.textContent = 'Copied'; setTimeout(() => (btn.textContent = o), 1400); };
  const fallback = () => { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = 'Press and hold to copy'; } t.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
}
function addPostInfo(slot, c) {
  if (!c) return;
  const old = slot.el.querySelector('.post'); if (old) old.remove();
  const p = postInfo(c), box = document.createElement('div'); box.className = 'post';
  const sc = document.createElement('div'); sc.className = 'score';
  sc.innerHTML = '<span>Moment score</span><b></b><span class="sbar"><i></i></span><span>estimate</span>';
  sc.querySelector('b').textContent = String(p.score); sc.querySelector('i').style.width = p.score + '%';
  const t = document.createElement('div'); t.className = 'pt'; t.textContent = p.title;
  const d = document.createElement('div'); d.className = 'pd'; d.textContent = p.desc;
  const hs = document.createElement('div'); hs.className = 'ph'; hs.textContent = p.tags;
  const row = document.createElement('div'); row.className = 'copyrow';
  const b1 = document.createElement('button'); b1.className = 'ghost'; b1.type = 'button'; b1.textContent = 'Copy title';
  const b2 = document.createElement('button'); b2.className = 'ghost'; b2.type = 'button'; b2.textContent = 'Copy description + tags';
  b1.addEventListener('click', () => copyText(p.title, b1));
  b2.addEventListener('click', () => copyText(p.desc + '\n\n' + p.tags, b2));
  row.append(b1, b2); box.append(sc, t, d, hs, row);
  slot.acts.parentNode.appendChild(box);
}

function finishSlot(slot, url, ext, n) {
  if (slot.url) URL.revokeObjectURL(slot.url);
  slot.url = url; slot.el.classList.remove('failed'); slot.el.classList.add('done');
  setSlotP(slot, 100, 'Ready');
  slot.acts.replaceChildren();
  const pv = document.createElement('button'); pv.className = 'ghost'; pv.textContent = 'Preview';
  pv.addEventListener('click', () => {
    const v = $('pv'); v.src = url; v.hidden = false;
    const p = v.play(); if (p && p.catch) p.catch(() => {});
    v.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  const a = document.createElement('a'); a.href = url; a.download = 'clip-' + n + '.' + ext; a.textContent = 'Download clip ' + n;
  slot.acts.append(pv, a); slot.acts.hidden = false;
  addPostInfo(slot, state.clips[n - 1]);
}
function failSlot(slot, e, onRetry, label) {
  slot.el.classList.add('failed'); { const op = slot.el.querySelector('.post'); if (op) op.remove(); }
  slot.stat.textContent = label || 'Failed';
  slot.acts.replaceChildren();
  const msg = document.createElement('div'); msg.className = 'msg'; msg.textContent = (e && e.message) ? e.message : String(e);
  const b = document.createElement('button'); b.className = 'ghost'; b.textContent = 'Try again';
  b.addEventListener('click', onRetry);
  slot.acts.append(msg, b); slot.acts.hidden = false;
}
function showView(name) {
  $('viewSetup').hidden = name !== 'setup';
  $('viewWork').hidden = name !== 'work';
  document.body.classList.toggle('working', name === 'work');
  window.scrollTo(0, 0);
  if (name === 'work') game.start(); else game.stop();
}
function summary() {
  const total = state.slots.length, ok = state.slots.filter((s) => s.el.classList.contains('done')).length;
  $('stepLabel').textContent = 'Done';
  setStage(ok === total ? 'All ' + ok + ' clips are ready. Tap Download on each one.' : ok + ' of ' + total + ' clips are ready. Tap Try again on the others.', 100);
  $('back').hidden = false;
}

/*REMUX_START*/
/* MediaRecorder files have no length stored, so phone galleries show "0:01". These two functions write the length in. */
function fixMp4(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), td = new TextDecoder();
  const u32 = (o) => dv.getUint32(o), typ = (o) => td.decode(u8.subarray(o + 4, o + 8));
  const CONT = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'mvex', 'moof', 'traf']);
  function parse(s, e) {
    const out = [];
    while (s + 8 <= e) {
      let size = u32(s), hdr = 8;
      if (size === 1) { size = Number(dv.getBigUint64(s + 8)); hdr = 16; } else if (size === 0) size = e - s;
      if (size < hdr || s + size > e) break;
      const b = { type: typ(s), start: s, size, body: s + hdr, end: s + size };
      if (CONT.has(b.type)) b.kids = parse(b.body, b.end);
      out.push(b); s += size;
    }
    return out;
  }
  const top = parse(0, u8.length), find = (b, t) => (b.kids || []).find((k) => k.type === t), all = (b, t) => (b.kids || []).filter((k) => k.type === t);
  const ftyp = top.find((b) => b.type === 'ftyp'), moov = top.find((b) => b.type === 'moov');
  if (!moov || !find(moov, 'mvex')) return null; // not fragmented, nothing to do
  const trex = {};
  for (const x of all(find(moov, 'mvex'), 'trex')) trex[u32(x.body + 4)] = { dur: u32(x.body + 12), size: u32(x.body + 16), flags: u32(x.body + 20) };
  const tracks = {}; // id -> {samples, chunks}
  for (const mf of top.filter((b) => b.type === 'moof')) {
    for (const tf of all(mf, 'traf')) {
      const th = find(tf, 'tfhd'), tfl = u32(th.body) & 0xffffff, id = u32(th.body + 4);
      let p = th.body + 8, base = mf.start, dDur = trex[id].dur, dSize = trex[id].size, dFl = trex[id].flags;
      if (tfl & 1) { base = Number(dv.getBigUint64(p)); p += 8; }
      if (tfl & 2) p += 4;
      if (tfl & 8) { dDur = u32(p); p += 4; }
      if (tfl & 0x10) { dSize = u32(p); p += 4; }
      if (tfl & 0x20) { dFl = u32(p); p += 4; }
      const T = tracks[id] || (tracks[id] = { samples: [], chunks: [] });
      let cursor = null;
      for (const tr of all(tf, 'trun')) {
        const ver = u8[tr.body], fl = u32(tr.body) & 0xffffff, n = u32(tr.body + 4);
        let q = tr.body + 8, off = cursor == null ? base : cursor, firstFl = null;
        if (fl & 1) { off = base + dv.getInt32(q); q += 4; }
        if (fl & 4) { firstFl = u32(q); q += 4; }
        const chunk = { from: off, count: n, bytes: 0 };
        for (let i = 0; i < n; i++) {
          const s = { dur: dDur, size: dSize, flags: i === 0 && firstFl != null ? firstFl : dFl, cts: 0 };
          if (fl & 0x100) { s.dur = u32(q); q += 4; }
          if (fl & 0x200) { s.size = u32(q); q += 4; }
          if (fl & 0x400) { s.flags = u32(q); q += 4; }
          if (fl & 0x800) { s.cts = ver ? dv.getInt32(q) : u32(q); q += 4; }
          T.samples.push(s); chunk.bytes += s.size;
        }
        cursor = off + chunk.bytes; T.chunks.push(chunk);
      }
    }
  }
  const w32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const cat = (arrs) => { let n = 0; for (const a of arrs) n += a.length; const o = new Uint8Array(n); let p = 0; for (const a of arrs) { o.set(a, p); p += a.length; } return o; };
  const box = (t, ...parts) => { const body = cat(parts.map((x) => (x instanceof Uint8Array ? x : Uint8Array.from(x)))); return cat([Uint8Array.from(w32(body.length + 8)), Uint8Array.from([...t].map((c) => c.charCodeAt(0))), body]); };
  const full = (t, ver, fl, ...parts) => box(t, [ver, (fl >> 16) & 255, (fl >> 8) & 255, fl & 255], ...parts);
  const raw = (b) => u8.subarray(b.start, b.end);
  const mvhd = find(moov, 'mvhd'), mvVer = u8[mvhd.body], movTs = u32(mvhd.body + (mvVer ? 20 : 12));
  const chunkOffsets = []; // patched after moov size known
  let movDur = 0, mdatParts = [], mdatPos = 0;
  const trakOut = [];
  const patch32 = (arr, off, v) => { arr[off] = v >>> 24; arr[off + 1] = (v >>> 16) & 255; arr[off + 2] = (v >>> 8) & 255; arr[off + 3] = v & 255; };
  for (const trak of all(moov, 'trak')) {
    const tkhd = find(trak, 'tkhd'), id = u32(tkhd.body + (u8[tkhd.body] ? 20 : 12)), T = tracks[id];
    const mdia = find(trak, 'mdia'), mdhd = find(mdia, 'mdhd'), mv = u8[mdhd.body], ts = u32(mdhd.body + (mv ? 20 : 12));
    const hdlr = find(mdia, 'hdlr'), isVideo = td.decode(u8.subarray(hdlr.body + 8, hdlr.body + 12)) === 'vide';
    const minf = find(mdia, 'minf'), stbl = find(minf, 'stbl'), stsd = find(stbl, 'stsd');
    const S = T ? T.samples : [];
    let dur = 0; for (const s of S) dur += s.dur;
    movDur = Math.max(movDur, Math.round(dur / ts * movTs));
    const stts = []; for (const s of S) { const l = stts[stts.length - 1]; if (l && l[1] === s.dur) l[0]++; else stts.push([1, s.dur]); }
    const hasCts = S.some((s) => s.cts !== 0), nonSync = S.map((s, i) => ((s.flags & 0x10000) ? 0 : i + 1)).filter((x) => x);
    const stsc = [], offs = []; let ci = 0;
    for (const c of (T ? T.chunks : [])) { ci++; const l = stsc[stsc.length - 1]; if (!l || l[1] !== c.count) stsc.push([ci, c.count]); }
    const kids = [raw(stsd),
      full('stts', 0, 0, w32(stts.length), stts.flatMap((x) => [...w32(x[0]), ...w32(x[1])])),
      new Uint8Array(0)];
    if (hasCts) { // run-length ctts
      const runs = []; for (const s of S) { const l = runs[runs.length - 1]; if (l && l[1] === s.cts) l[0]++; else runs.push([1, s.cts]); }
      kids[2] = full('ctts', 1, 0, w32(runs.length), runs.flatMap((r) => [...w32(r[0]), ...w32(r[1] >>> 0)]));
    }
    if (isVideo && nonSync.length) kids.push(full('stss', 0, 0, w32(S.length - nonSync.length), S.map((s, i) => i + 1).filter((i) => !nonSync.includes(i)).flatMap((i) => w32(i))));
    kids.push(full('stsc', 0, 0, w32(stsc.length), stsc.flatMap((x) => [...w32(x[0]), ...w32(x[1]), ...w32(1)])));
    kids.push(full('stsz', 0, 0, w32(0), w32(S.length), S.flatMap((s) => w32(s.size))));
    const stcoIdx = kids.length;
    kids.push(full('stco', 0, 0, w32((T ? T.chunks : []).length), (T ? T.chunks : []).flatMap(() => w32(0))));
    // copy mdia/minf pieces, swapping stbl
    const newStbl = box('stbl', ...kids.filter((k) => k.length));
    const stcoPos = (() => { // offset of first chunk entry inside newStbl
      let p = 8; for (let i = 0; i < kids.length; i++) { if (!kids[i].length) continue; if (i === stcoIdx) return p + 16; p += kids[i].length; } return -1; })();
    const mdhdCopy = Uint8Array.from(raw(mdhd)); patch32(mdhdCopy, 8 + (mv ? 24 : 16), dur);
    if (mv) patch32(mdhdCopy, 8 + 16, 0);
    const tkhdCopy = Uint8Array.from(raw(tkhd)), tv = u8[tkhd.body]; const tdur = Math.round(dur / ts * movTs);
    if (tv) { patch32(tkhdCopy, 8 + 28, 0); patch32(tkhdCopy, 8 + 32, tdur); } else patch32(tkhdCopy, 8 + 20, tdur);
    const minfKids = minf.kids.map((k) => (k.type === 'stbl' ? newStbl : raw(k)));
    const newMinf = box('minf', ...minfKids);
    const newMdia = box('mdia', ...mdia.kids.map((k) => (k.type === 'minf' ? newMinf : k.type === 'mdhd' ? mdhdCopy : raw(k))));
    const trakBytes = box('trak', ...trak.kids.map((k) => (k.type === 'mdia' ? newMdia : k.type === 'tkhd' ? tkhdCopy : raw(k))));
    // locate stco entries in the final trak bytes
    const rel = (() => { const needle = trakBytes; for (let i = 0; i + 4 < needle.length; i++) if (needle[i] === 0x73 && needle[i + 1] === 0x74 && needle[i + 2] === 0x63 && needle[i + 3] === 0x6f) return i + 4 + 8; return -1; })();
    for (const c of (T ? T.chunks : [])) { offs.push(mdatPos); mdatParts.push(u8.subarray(c.from, c.from + c.bytes)); mdatPos += c.bytes; }
    trakOut.push({ bytes: trakBytes, rel, offs, count: offs.length });
  }
  const mvhdCopy = Uint8Array.from(raw(mvhd)); patch32(mvhdCopy, 8 + (mvVer ? 28 : 16), movDur); if (mvVer) patch32(mvhdCopy, 8 + 24, 0);
  const moovKids = moov.kids.filter((k) => k.type !== 'mvex').map((k) => (k.type === 'mvhd' ? mvhdCopy : k.type === 'trak' ? null : raw(k))).filter(Boolean);
  const ftypBytes = ftyp ? raw(ftyp) : new Uint8Array(0);
  const trakBuf = trakOut.map((t) => t.bytes);
  const moovBytes = box('moov', ...moovKids, ...trakBuf);
  const dataStart = ftypBytes.length + moovBytes.length + 8;
  // patch stco entries (each trak's position inside moovBytes)
  let at = 8 + moovKids.reduce((n, k) => n + k.length, 0);
  for (const t of trakOut) { for (let i = 0; i < t.count; i++) patch32(moovBytes, at + t.rel + i * 4, dataStart + t.offs[i]); at += t.bytes.length; }
  return cat([ftypBytes, moovBytes, Uint8Array.from([...w32(mdatPos + 8), 0x6d, 0x64, 0x61, 0x74]), ...mdatParts]);
}

function fixWebm(u8, seconds) {
  const rd = (p) => { let b = u8[p], n = 1; while (n < 9 && !(b & (0x80 >> (n - 1)))) n++; let v = b & ((0x80 >> (n - 1)) - 1), unk = v === (0x80 >> (n - 1)) - 1; for (let i = 1; i < n; i++) { v = v * 256 + u8[p + i]; if (u8[p + i] !== 255) unk = false; } return { len: n, val: v, unk }; };
  const idAt = (p) => { let n = 1; while (n < 4 && !(u8[p] & (0x80 >> (n - 1)))) n++; let v = 0; for (let i = 0; i < n; i++) v = v * 256 + u8[p + i]; return { len: n, val: v }; };
  let p = 0;
  const eh = idAt(p), es = rd(p + eh.len); p += eh.len + es.len + es.val; // EBML header
  const sg = idAt(p); if (sg.val !== 0x18538067) return null;
  const ss = rd(p + sg.len); let q = p + sg.len + ss.len;
  while (q < u8.length) {
    const id = idAt(q), sz = rd(q + id.len), body = q + id.len + sz.len;
    if (id.val === 0x1549a966) { // Info
      let r = body, scale = 1000000;
      while (r < body + sz.val) { const i2 = idAt(r), s2 = rd(r + i2.len), b2 = r + i2.len + s2.len;
        if (i2.val === 0x4489) return null; // already has a length
        if (i2.val === 0x2ad7b1) { scale = 0; for (let k = 0; k < s2.val; k++) scale = scale * 256 + u8[b2 + k]; }
        r = b2 + s2.val; }
      const dur = new Uint8Array(11), dv = new DataView(dur.buffer);
      dur[0] = 0x44; dur[1] = 0x89; dur[2] = 0x88; dv.setFloat64(3, seconds * 1e9 / scale);
      const newSize = sz.val + 11, sizeBytes = new Uint8Array(8); sizeBytes[0] = 1; let v = newSize; for (let k = 7; k >= 1; k--) { sizeBytes[k] = v % 256; v = Math.floor(v / 256); }
      const out = new Uint8Array(u8.length + 11 + (8 - sz.len));
      let o = 0; out.set(u8.subarray(0, q + id.len), o); o += q + id.len; out.set(sizeBytes, o); o += 8;
      out.set(u8.subarray(body, body + sz.val), o); o += sz.val; out.set(dur, o); o += 11; out.set(u8.subarray(body + sz.val), o);
      return out;
    }
    if (sz.unk) return null;
    q = body + sz.val;
  }
  return null;
}
/*REMUX_END*/

/* ---------- cutting a clip (records video + audio + captions + top line) ---------- */
const live = new Set(); // every open video renderer, so we can always clean up
function closeRenderer(r) {
  if (!r) return;
  live.delete(r);
  try { r.v.pause(); } catch (e) { /* ok */ }
  r.v.removeAttribute('src'); try { r.v.load(); } catch (e) { /* ok */ }
  r.v.remove(); r.cv.remove();
  URL.revokeObjectURL(r.url);
  if (r.actx) r.actx.close().catch(() => {});
}
function disposeRenderer() { [...live].forEach(closeRenderer); }
const mediaErrText = (er) => {
  const names = { 1: 'loading was cancelled', 2: 'the file could not be read', 3: 'the picture could not be decoded', 4: 'this video format is not supported' };
  return er ? (names[er.code] || 'error ' + er.code) + (er.message ? ' — ' + er.message : '') : 'no response';
};
async function openRenderer() {
  let why = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const v = document.createElement('video'), cv = document.createElement('canvas');
    v.className = 'hidvid'; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
    cv.className = 'offscreen'; cv.setAttribute('aria-hidden', 'true');
    document.body.append(v, cv);
    const url = URL.createObjectURL(state.file);
    v.src = url; v.load();
    const res = await new Promise((resolve) => {
      const done = (r) => { clearTimeout(tm); v.removeEventListener('loadedmetadata', ok); v.removeEventListener('error', bad); resolve(r); };
      const ok = () => done('ok'), bad = () => done('error');
      const tm = setTimeout(() => done('timeout'), 45000);
      v.addEventListener('loadedmetadata', ok); v.addEventListener('error', bad);
      if (v.readyState >= 1) ok();
    });
    if (res === 'ok') {
      const r = { v, cv, url, actx: null, adest: null };
      try {
        r.actx = new (window.AudioContext || window.webkitAudioContext)();
        const src = r.actx.createMediaElementSource(v);
        r.adest = r.actx.createMediaStreamDestination();
        src.connect(r.adest);
      } catch (e) { console.warn('No sound capture', e); r.adest = null; }
      live.add(r); return r;
    }
    why = res === 'error' ? mediaErrText(v.error) : 'it took too long to open';
    v.removeAttribute('src'); v.remove(); cv.remove(); URL.revokeObjectURL(url);
  }
  throw Object.assign(new Error('The video could not be opened (' + why + '). Close other tabs and apps, keep this tab open, then tap Try again.'), { fatal: true });
}

/* words with their own timing, grouped 2-3 at a time, so the caption can pop and highlight the word being said */
function capChunks(c, maxWords) {
  const words = [];
  for (let k = c.i; k <= c.j; k++) {
    const s = state.segs[k], ws = s.text.split(/\s+/).filter(Boolean), tot = ws.reduce((n, w) => n + w.length + 1, 0);
    let at = s.start;
    for (const w of ws) { const d = (s.end - s.start) * (w.length + 1) / tot; words.push({ w, s: at, e: at + d }); at += d; }
  }
  const chunks = []; let cur = [];
  for (const w of words) {
    cur.push(w);
    const len = cur.reduce((n, x) => n + x.w.length + 1, 0);
    if (cur.length >= maxWords || len > (maxWords > 3 ? 34 : 20) || /[.!?,;:]$/.test(w.w)) { chunks.push({ s: cur[0].s, e: cur[cur.length - 1].e, words: cur }); cur = []; }
  }
  if (cur.length) chunks.push({ s: cur[0].s, e: cur[cur.length - 1].e, words: cur });
  for (let i = 0; i < chunks.length - 1; i++) chunks[i].e = chunks[i + 1].s; // no flicker between chunks
  return chunks;
}
const easeBack = (x) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function wrapText(ctx, text, maxW) {
  const lines = []; let line = '';
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
const FONT_ = '"Inter", "Segoe UI", Roboto, Arial, sans-serif';
function strokeFill(g, text, x, y, lw, fill) { g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = '#000'; g.strokeText(text, x, y); g.fillStyle = fill; g.fillText(text, x, y); }
function drawCaption(g, W, H, fs, vertical, ch, t, style) {
  const pops = style === 'pop' || style === 'comic', age = Math.max(0, t - ch.s);
  const pop = pops && age < 0.16 ? 0.78 + 0.22 * easeBack(age / 0.16) : 1;
  const weight = style === 'box' ? '600' : '800';
  let size = style === 'karaoke' || style === 'box' ? Math.round(fs * 0.85) : style === 'comic' ? Math.round(fs * 1.1) : fs; g.font = weight + ' ' + size + 'px ' + FONT_;
  const text = ch.words.map((x) => x.w).join(' ');
  const maxW = W * 0.9, full = g.measureText(text).width;
  if (full > maxW) { size = Math.floor(size * maxW / full); g.font = weight + ' ' + size + 'px ' + FONT_; }
  const gap = g.measureText(' ').width + size * 0.12, widths = ch.words.map((x) => g.measureText(x.w).width), total = widths.reduce((a, b) => a + b, 0) + gap * (ch.words.length - 1);
  let act = 0; for (let i = 0; i < ch.words.length; i++) if (t >= ch.words[i].s) act = i;
  g.save();
  g.translate(W / 2, H * (vertical ? 0.74 : 0.87));
  if (style === 'slide') { const k = Math.min(1, age / 0.2), e = 1 - Math.pow(1 - k, 3); g.translate(0, (1 - e) * size * 0.9); g.globalAlpha = k; }
  if (style === 'comic') g.rotate(-0.035);
  g.scale(pop, pop);
  g.textAlign = 'left'; g.textBaseline = 'middle';
  if (style === 'box') { const bw = total + size * 1.2, bh = size * 1.7; g.fillStyle = 'rgba(0,0,0,0.72)'; g.beginPath(); if (g.roundRect) g.roundRect(-bw / 2, -bh / 2, bw, bh, size * 0.3); else g.rect(-bw / 2, -bh / 2, bw, bh); g.fill(); }
  if (style === 'type') { // letters appear one by one
    const k = Math.max(0, Math.min(1, age / Math.max(0.3, (ch.e - ch.s) * 0.7))), n = Math.max(1, Math.ceil(text.length * k));
    g.textAlign = 'left'; strokeFill(g, text.slice(0, n), -g.measureText(text).width / 2, 0, size * 0.22, '#ffffff');
    if (n < text.length || Math.floor(t * 3) % 2 === 0) { const cx = -g.measureText(text).width / 2 + g.measureText(text.slice(0, n)).width + size * 0.12; g.fillStyle = '#ffd60a'; g.fillRect(cx, -size * 0.45, size * 0.08, size * 0.9); }
    g.restore(); return;
  }
  let x = -total / 2;
  ch.words.forEach((wd, i) => {
    const on = i === act;
    let fill = '#ffffff', lw = size * 0.24, line = '#000';
    if (style === 'pop') fill = on ? '#ffd60a' : '#ffffff';
    else if (style === 'karaoke') fill = i <= act ? '#3ddc84' : '#ffffff';
    else if (style === 'movie') fill = '#ffe14d';
    else if (style === 'box') lw = 0;
    else if (style === 'comic') { fill = '#ffe600'; lw = size * 0.34; line = '#c4001a'; }
    else if (style === 'neon') { fill = on ? '#7df9ff' : '#ffffff'; lw = 0; }
    else if (style === 'bar') { lw = size * 0.16; if (on) { g.fillStyle = '#1f6bff'; g.beginPath(); const bx = x - size * 0.22, bw = widths[i] + size * 0.44, bh = size * 1.3; if (g.roundRect) g.roundRect(bx, -bh / 2, bw, bh, size * 0.25); else g.rect(bx, -bh / 2, bw, bh); g.fill(); } }
    g.save(); if (pops && on) { g.translate(x + widths[i] / 2, 0); g.scale(1.1, 1.1); g.translate(-(x + widths[i] / 2), 0); }
    if (style === 'neon') { g.shadowColor = on ? '#00e5ff' : '#ff3df5'; g.shadowBlur = size * 0.6; g.fillStyle = fill; g.fillText(wd.w, x, 0); g.fillText(wd.w, x, 0); }
    else if (lw) { g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = line; g.strokeText(wd.w, x, 0); g.fillStyle = fill; g.fillText(wd.w, x, 0); }
    else { g.fillStyle = fill; g.fillText(wd.w, x, 0); }
    g.restore(); x += widths[i] + gap;
  });
  g.restore();
}
function drawTop(g, W, H, fs, vertical, c, mode, t, grad) {
  if (mode === 'off') return;
  const age = Math.min(1, t / 0.5), top = H * (vertical ? 0.03 : 0.04);
  g.save(); g.globalAlpha = age; g.translate(0, (1 - age) * -14);
  g.fillStyle = grad; g.fillRect(0, 0, W, H * (vertical ? 0.26 : 0.34));
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const tag = c.tag.toUpperCase(), tf = Math.round(fs * 0.62);
  g.font = '800 ' + tf + 'px ' + FONT_;
  const tw = g.measureText(tag).width + tf * 1.4, th = tf * 1.7;
  g.fillStyle = '#1f6bff'; g.beginPath();
  if (g.roundRect) g.roundRect((W - tw) / 2, top, tw, th, th / 2); else g.rect((W - tw) / 2, top, tw, th);
  g.fill(); g.fillStyle = '#fff'; g.fillText(tag, W / 2, top + th / 2 + 1);
  if (mode === 'hook' && c.hook) {
    const hf = Math.round(fs * (vertical ? 0.92 : 1.05)); g.font = '800 ' + hf + 'px ' + FONT_;
    const lines = wrapText(g, c.hook, W * 0.88).slice(0, vertical ? 2 : 3), lh = hf * 1.2;
    lines.forEach((l, i) => strokeFill(g, l, W / 2, top + th + hf * 0.9 + i * lh, hf * 0.2, '#ffffff'));
  }
  g.restore();
}

/* ---------- templates: the clip sits inside a ready-made post / broadcast frame (9:16 only) ---------- */
function rrect(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
function buildTpl(kind, W, H, hook, name, handle) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const hole = { x: Math.round(W * 0.04), w: Math.round(W * 0.92), y: Math.round(H * 0.37) }; hole.h = Math.round(hole.w * 9 / 16);
  const pad = W * 0.05, dark = kind !== 'xlight', ink = dark ? '#ffffff' : '#0f1419', sub = dark ? '#9aa4ad' : '#536471';
  g.fillStyle = kind === 'xlight' ? '#ffffff' : kind === 'news' ? '#0a1024' : '#000000'; g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  const text = (hook || 'Your hook goes here').trim();
  if (kind === 'xlight' || kind === 'xdark') {
    const ay = H * 0.185, ar = W * 0.045;
    g.fillStyle = '#cfd9de'; g.beginPath(); g.arc(pad + ar, ay + ar, ar, 0, 7); g.fill();
    const nf = Math.round(W * 0.036); g.font = '700 ' + nf + 'px ' + FONT_; g.fillStyle = ink;
    const nm = name || 'Your Name'; g.fillText(nm, pad + ar * 2 + W * 0.025, ay + ar * 0.85);
    const nw = g.measureText(nm).width; g.fillStyle = '#1d9bf0'; g.beginPath(); g.arc(pad + ar * 2 + W * 0.025 + nw + nf * 0.7, ay + ar * 0.85 - nf * 0.32, nf * 0.42, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = Math.max(1.5, nf * 0.1); g.beginPath(); const cx0 = pad + ar * 2 + W * 0.025 + nw + nf * 0.7, cy0 = ay + ar * 0.85 - nf * 0.32; g.moveTo(cx0 - nf * 0.2, cy0); g.lineTo(cx0 - nf * 0.05, cy0 + nf * 0.16); g.lineTo(cx0 + nf * 0.24, cy0 - nf * 0.16); g.stroke();
    g.font = '400 ' + Math.round(nf * 0.82) + 'px ' + FONT_; g.fillStyle = sub; g.fillText(handle || '@yourhandle', pad + ar * 2 + W * 0.025, ay + ar * 1.7);
    const hf = Math.round(W * 0.048); g.font = '500 ' + hf + 'px ' + FONT_; g.fillStyle = ink;
    wrapText(g, text, W - pad * 2).slice(0, 3).forEach((l, i) => g.fillText(l, pad, ay + ar * 2 + hf * 1.5 + i * hf * 1.25));
  } else if (kind === 'tiktok') {
    const tf = Math.round(W * 0.034); g.font = '800 ' + tf + 'px ' + FONT_; const tag = 'WAIT FOR IT', tw = g.measureText(tag).width + tf * 1.1;
    g.fillStyle = '#e5322b'; rrect(g, pad, H * 0.17, tw, tf * 1.9, tf * 0.4); g.fill(); g.fillStyle = '#fff'; g.fillText(tag, pad + tf * 0.55, H * 0.17 + tf * 1.32);
    const hf = Math.round(W * 0.055); g.font = '800 ' + hf + 'px ' + FONT_; g.fillStyle = '#fff';
    wrapText(g, text, W - pad * 2).slice(0, 2).forEach((l, i) => g.fillText(l, pad, H * 0.17 + tf * 1.9 + hf * 1.45 + i * hf * 1.2));
    g.font = '500 ' + Math.round(W * 0.03) + 'px ' + FONT_; g.fillStyle = sub; g.fillText(handle || '@yourhandle', pad, hole.y - H * 0.012);
  } else if (kind === 'news') {
    const by = H * 0.165, bh = H * 0.042; g.fillStyle = '#dc2626'; rrect(g, pad, by, W - pad * 2, bh, bh * 0.18); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(pad + bh * 0.5, by + bh / 2, bh * 0.13, 0, 7); g.fill();
    const bf = Math.round(bh * 0.42); g.font = '800 ' + bf + 'px ' + FONT_; g.fillText('BREAKING NEWS', pad + bh * 0.8, by + bh * 0.64);
    g.font = '800 ' + Math.round(bf * 0.85) + 'px ' + FONT_; const lw = g.measureText('LIVE').width + bf; g.fillStyle = '#fff'; rrect(g, W - pad - lw - bh * 0.2, by + bh * 0.18, lw, bh * 0.64, bh * 0.1); g.fill(); g.fillStyle = '#dc2626'; g.fillText('LIVE', W - pad - lw - bh * 0.2 + bf * 0.5, by + bh * 0.64);
    const hy = by + bh * 1.2, hh = H * 0.085; g.fillStyle = '#141b34'; g.fillRect(pad, hy, W - pad * 2, hh); g.fillStyle = '#dc2626'; g.fillRect(pad, hy, W * 0.008, hh);
    const hf = Math.round(W * 0.04); g.font = '800 ' + hf + 'px ' + FONT_; g.fillStyle = '#fff';
    wrapText(g, text.toUpperCase(), W - pad * 2 - W * 0.04).slice(0, 2).forEach((l, i) => g.fillText(l, pad + W * 0.025, hy + hf * 1.15 + i * hf * 1.2));
    g.font = '700 ' + Math.round(W * 0.028) + 'px ' + FONT_; g.fillStyle = '#facc15'; g.fillText('SPECIAL COVERAGE • DEVELOPING STORY', pad, hy + hh + H * 0.02);
  }
  g.fillStyle = '#000'; rrect(g, hole.x - 1, hole.y - 1, hole.w + 2, hole.h + 2, W * 0.02); g.fill();
  return { cv, hole, kind };
}

function showLength(blob, ext, secs) {
  return blob.arrayBuffer().then((ab) => {
    const u8 = new Uint8Array(ab);
    const fixed = ext === 'mp4' ? fixMp4(u8) : fixWebm(u8, secs);
    return fixed ? new Blob([fixed], { type: blob.type }) : blob;
  }).catch((e) => { console.warn('length fix skipped', e); return blob; });
}

async function makeClip(c, slot) {
  setSlotP(slot, 0, 'Opening the video…');
  const r = await openRenderer();
  try {
    const v = r.v, vw = v.videoWidth, vh = v.videoHeight, fmtv = $('fmt').value, framing = $('frame').value;
    if (!vw || !vh) throw new Error('This file has sound but no picture, so a video clip cannot be made.');
    const orig = fmtv === 'orig', ratio = orig ? vw / vh : fmtv.split(':')[0] / fmtv.split(':')[1];
    let area = $('quality').value === 'hd' ? 921600 : 518400; if (orig) area = Math.min(area, vw * vh);
    let H = Math.round(Math.sqrt(area / ratio)), W = Math.round(H * ratio); W -= W % 2; H -= H % 2;
    const vertical = H >= W * 0.95;
    const tplKind = $('tpl').value, useTpl = tplKind !== 'none' && vertical && !orig;
    const cv = r.cv; cv.width = W; cv.height = H;
    cv.classList.remove('offscreen'); cv.classList.add('livecv'); slot.live.replaceChildren(cv); slot.live.hidden = false; // small live picture of what is being recorded
    const g = cv.getContext('2d');
    const cstyle = $('capstyle').value, chunks = cstyle !== 'none' ? capChunks(c, ({ pop: 3, bar: 3, comic: 3, neon: 4 })[cstyle] || 5) : [], mode = $('top').value;
    const fs = Math.round(W * (vertical ? 0.07 : 0.045));
    const topFrac = vertical ? 0.26 : 0.34, topH = Math.ceil(H * topFrac), topCv = document.createElement('canvas'); topCv.width = W; topCv.height = topH;
    if (mode !== 'off' && !useTpl) { const tg = topCv.getContext('2d'), gr2 = tg.createLinearGradient(0, 0, 0, topH); gr2.addColorStop(0, 'rgba(0,0,0,0.7)'); gr2.addColorStop(1, 'rgba(0,0,0,0)'); drawTop(tg, W, H, fs, vertical, c, mode, 1, gr2); }

    /* follow the speaker: watch which part of the picture moves the most (the person talking) and keep the frame on it */
    const sc0 = Math.max(W / vw, H / vh), frac = Math.min(1, (W / sc0) / vw); // how much of the video's width the frame shows
    const tpl = useTpl ? buildTpl(tplKind, W, H, c.hook || c.title || '', $('tplName').value.trim(), $('tplHandle').value.trim()) : null;
    const follow = !orig && !useTpl && (framing === 'follow' || framing === 'pip') && frac < 0.97;
    const TW = 96, TH = Math.max(24, Math.round(TW * vh / vw)), tcv = document.createElement('canvas'); tcv.width = TW; tcv.height = TH;
    const tg2 = tcv.getContext('2d', { willReadFrequently: true });
    let prev = null, E = new Float32Array(TW), cx = 0.5, winStart = Math.round((TW - TW * frac) / 2), lastSwitch = -9, sampleN = 0;
    const wb = Math.max(1, Math.round(TW * frac));
    function sample(t) {
      tg2.drawImage(v, 0, 0, TW, TH);
      const d = tg2.getImageData(0, 0, TW, TH).data, lum = new Uint8Array(TW * TH);
      for (let i = 0, p = 0; i < d.length; i += 4, p++) lum[p] = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      if (prev) {
        for (let x = 0; x < TW; x++) { let s = 0; for (let y = 0; y < TH; y++) { const k = y * TW + x, df = lum[k] - prev[k]; s += df < 0 ? -df : df; } E[x] = E[x] * 0.95 + (s / TH) * 0.05; }
        let acc = 0; const pre = new Float32Array(TW + 1); for (let x = 0; x < TW; x++) { acc += E[x]; pre[x + 1] = acc; }
        let best = winStart, bs = -1; for (let s0 = 0; s0 + wb <= TW; s0++) { const sm = pre[s0 + wb] - pre[s0]; if (sm > bs) { bs = sm; best = s0; } }
        const cur = pre[winStart + wb] - pre[winStart];
        sampleN++;
        if (best !== winStart && bs > cur * 1.4 + 0.02 && t - lastSwitch > 1.5) { const far = Math.abs(best - winStart) > TW * 0.2; winStart = best; lastSwitch = t; if (far) cx = (winStart + wb / 2) / TW; }
      }
      prev = lum;
      const target = (winStart + wb / 2) / TW; cx += (target - cx) * 0.1;
    }
    let ci = 0;
    const draw = () => {
      const t = v.currentTime;
      if (follow) { try { sample(t); } catch (e) { /* keep the last frame position */ } }
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (orig) g.drawImage(v, 0, 0, W, H);
      else if (tpl) {
        g.drawImage(tpl.cv, 0, 0); const hl = tpl.hole, ar = hl.w / hl.h; let sw = vw, sh = vw / ar; if (sh > vh) { sh = vh; sw = vh * ar; }
        g.save(); rrect(g, hl.x, hl.y, hl.w, hl.h, W * 0.016); g.clip(); g.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, hl.x, hl.y, hl.w, hl.h); g.restore();
      }
      else if (framing === 'split') {
        const ar = W / (H / 2); let sw = Math.min(vw, vh * ar), sh = sw / ar; if (sh > vh) { sh = vh; sw = vh * ar; }
        const sy = (vh - sh) * 0.3, lx = Math.max(0, Math.min(vw - sw, vw * 0.27 - sw / 2)), rx = Math.max(0, Math.min(vw - sw, vw * 0.73 - sw / 2));
        g.drawImage(v, lx, sy, sw, sh, 0, 0, W, H / 2); g.drawImage(v, rx, sy, sw, sh, 0, H / 2, W, H / 2);
        g.fillStyle = '#fff'; g.fillRect(0, H / 2 - 1.5, W, 3);
      }
      else if (framing === 'fit') { // whole video, with a soft blurred copy behind it
        g.imageSmoothingEnabled = true; tg2.drawImage(v, 0, 0, TW, TH); g.filter = 'none'; g.drawImage(tcv, 0, 0, W, H); g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, W, H);
        const s2 = Math.min(W / vw, H / vh), dw = vw * s2, dh = vh * s2; g.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
      } else {
        const sw = Math.min(vw, W / sc0), sh = Math.min(vh, H / sc0);
        const half = (follow ? frac : 1) / 2, cxx = follow ? Math.max(half, Math.min(1 - half, cx)) : 0.5;
        const sx = Math.max(0, Math.min(vw - sw, cxx * vw - sw / 2)), sy = (vh - sh) * 0.3;
        g.drawImage(v, sx, sy, sw, sh, 0, 0, W, H);
        if (framing === 'pip' && !follow) { /* the video is already as narrow as the frame: nothing to add */ }
        else if (framing === 'pip') { const pw = W * 0.4, ph = pw * vh / vw, px2 = W - pw - W * 0.04, py2 = H * 0.5; g.fillStyle = '#fff'; rrect(g, px2 - 3, py2 - 3, pw + 6, ph + 6, 10); g.fill(); g.save(); rrect(g, px2, py2, pw, ph, 8); g.clip(); g.drawImage(v, px2, py2, pw, ph); g.restore(); }
      }
      if (mode !== 'off' && !useTpl) { g.globalAlpha = Math.min(1, Math.max(0, t - c.start) / 0.5); g.drawImage(topCv, 0, 0); g.globalAlpha = 1; }
      while (ci > 0 && chunks[ci].s > t) ci--;
      while (ci < chunks.length - 1 && chunks[ci].e <= t) ci++;
      const ch = chunks[ci];
      if (ch && t >= c.start - 0.05 && t >= ch.s - 0.05 && t < ch.e + 0.25) drawCaption(g, W, H, fs, vertical, ch, t, cstyle);
      drawMark(g, W, H, vertical, !!tpl && tpl.kind === 'xlight');
    };
    if (!window.MediaRecorder) throw new Error('This browser cannot record clips. Use Chrome.');
    const mimes = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/webm;codecs=h264,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = mimes.find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
    const stream = cv.captureStream(24), bps = $('quality').value === 'hd' ? 3500000 : 2200000;
    if (r.adest) r.adest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: bps } : { videoBitsPerSecond: bps });
    const parts = [];
    rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
    const stopped = new Promise((res) => (rec.onstop = res));
    let recording = false;
    const stopRec = () => { try { if (rec.state !== 'inactive') rec.stop(); } catch (e) { /* ok */ } };

    setSlotP(slot, 0, 'Getting ready…');
    const preRoll = follow ? Math.min(1.5, c.start) : 0, from = c.start - preRoll; // a short run-up lets the speaker be found before recording starts
    if (Math.abs(v.currentTime - from) > 0.05) {
      const seeked = once(v, 'seeked');
      v.currentTime = from;
      await Promise.race([seeked, timeout(30000, 'The video did not jump to the clip start. Try an MP4 (H.264) file.')]);
    }
    draw();
    if (r.actx) await r.actx.resume();
    if (!preRoll) { rec.start(500); recording = true; }
    try { await v.play(); } catch (e) { stopRec(); throw new Error('The browser did not allow playback. Tap the page once and try again.'); }
    setSlotP(slot, 0, recording ? (r.adest ? 'Recording…' : 'Recording (no sound)…') : 'Finding the speaker…');
    let lastT = v.currentTime, lastMove = Date.now(), endT = c.start;
    await new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (recording && (v.currentTime >= c.end || v.ended)) { clearInterval(timer); resolve(); return; }
        if (v.ended && !recording) { clearInterval(timer); reject(new Error('The clip start is at the very end of the video.')); return; }
        if (v.currentTime !== lastT) { lastT = v.currentTime; lastMove = Date.now(); }
        else if (Date.now() - lastMove > 15000) { clearInterval(timer); reject(new Error('Playback stalled. Keep this tab visible and try again.')); return; }
        draw();
        if (!recording && v.currentTime >= c.start - 0.02) { rec.start(500); recording = true; setSlotP(slot, 0, r.adest ? 'Recording…' : 'Recording (no sound)…'); }
        if (recording) { endT = v.currentTime; setSlotP(slot, (v.currentTime - c.start) / (c.end - c.start) * 100); }
      }, 42);
    }).catch((e) => { v.pause(); stopRec(); throw e; });
    const secs = Math.max(1, endT - c.start);
    v.pause(); stopRec(); await stopped;
    setSlotP(slot, 100, 'Finishing…');
    let blob = new Blob(parts, { type: ext === 'mp4' ? 'video/mp4' : 'video/webm' });
    if (!blob.size) throw new Error('The recording came out empty.');
    blob = await showLength(blob, ext, secs);
    finishSlot(slot, URL.createObjectURL(blob), ext, c.n);
  } finally { slot.live.hidden = true; slot.live.replaceChildren(); closeRenderer(r); }
}

/* clips are cut a few at a time; if the phone cannot open that many videos at once, the rest go one by one */
async function cutAll() {
  const n = state.clips.length;
  let retry = [], fatal = null;
  const run = async (list, limit) => {
    let k = 0;
    const lane = async () => {
      while (k < list.length) {
        const i = list[k++], slot = state.slots[i];
        if (fatal) { failSlot(slot, fatal, () => retrySlot(i), 'Skipped'); continue; }
        try { await makeClip(state.clips[i], slot); }
        catch (e) {
          console.error(e);
          if (e && e.fatal && limit > 1) { retry.push(i); slot.lastP = -1; setSlotP(slot, 0, 'Waiting'); }
          else { failSlot(slot, e, () => retrySlot(i)); if (e && e.fatal) fatal = e; }
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(limit, list.length) }, lane));
  };
  const timer = setInterval(() => {
    const avg = state.slots.reduce((a, s) => a + Math.max(0, s.lastP), 0) / n, ready = state.slots.filter((s) => s.el.classList.contains('done')).length;
    setStage('Cutting your clips… ' + ready + ' of ' + n + ' ready', avg);
  }, 400);
  try {
    await run(state.clips.map((_, i) => i), lanes('cut', 3));
    if (retry.length) { const l = retry; retry = []; await run(l, 1); }
  } finally { clearInterval(timer); }
}

/* ---------- the whole job ---------- */
async function runAll() {
  if (!state.file || state.busy) return;
  state.busy = true; site.bump('video'); site.setWorking(true);
  const N = +$('count').value, L = +$('len').value;
  $('errTxt').hidden = true; $('back').hidden = true;
  const pv = $('pv'); pv.pause(); pv.hidden = true; pv.removeAttribute('src');
  disposeRenderer(); buildSlots(N); showView('work'); startTimer(); keepAwake(true);
  $('stepLabel').textContent = 'Step 1 of 2 · Finding the key moments';
  setStage('Reading the sound of the video…', 1);
  try {
    let audio = await extractAudio(state.file);
    ASR_LANG = LANGS[$('lang').value] || '';
    const mid = modelFor(), key = 'cc2:' + state.file.name + ':' + state.file.size + ':' + state.file.lastModified + ':' + mid + ':' + ASR_LANG;
    state.segs = await transcribe(audio, mid, key);
    audio = null;
    if (!state.segs.length) throw new Error('No speech was found in this video.');
    setStage('Choosing the key moments…', 96);
    state.clips = pickClips(state.segs, L, N);
    if (!state.clips.length) throw new Error('Could not find enough clear speech to cut clips from.');
    trimSlots(state.clips.length);
    state.clips.forEach((c, i) => fillSlot(state.slots[i], c));
    $('stepLabel').textContent = 'Step 2 of 2 · Cutting the clips';
    await cutAll();
    summary();
    site.bump('clip', document.querySelectorAll('.slot.done').length);
    site.askReview();
  } catch (e) { $('stepLabel').textContent = 'Stopped'; showErr(e); }
  finally { state.busy = false; site.setWorking(false); stopTimer(); keepAwake(false); }
}
async function retrySlot(i) {
  if (state.busy) return;
  state.busy = true; keepAwake(true);
  const slot = state.slots[i], c = state.clips[i];
  slot.el.classList.remove('failed'); slot.acts.hidden = true; slot.lastP = -1; setSlotP(slot, 0, 'Starting again…');
  $('stepLabel').textContent = 'Cutting clip ' + (i + 1);
  disposeRenderer();
  try { await makeClip(c, slot); }
  catch (e) { console.error(e); failSlot(slot, e, () => retrySlot(i)); }
  finally { state.busy = false; keepAwake(false); summary(); }
}
$('go').addEventListener('click', runAll);
$('back').addEventListener('click', () => {
  if (state.busy) return;
  state.slots.forEach((s) => { if (s.url) URL.revokeObjectURL(s.url); });
  const pv = $('pv'); pv.pause(); pv.hidden = true; pv.removeAttribute('src');
  disposeRenderer();
  showView('setup');
});

(function autoSpeed() { // laptops with plenty of power start on Balanced, phones on Safe
  const hc = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4, touch = navigator.maxTouchPoints > 0;
  if (!touch && hc >= 8 && mem >= 8) $('speed').value = 'balanced';
})();
/* ---------- visual pickers: every choice shows a small live preview ---------- */
(function pickers() {
  const SAMPLE = [['Remember', 0], ['the', 0.45], ['reason', 0.8]];
  const mkChunk = () => ({ s: 0, e: 2.1, words: SAMPLE.map((x, i) => ({ w: x[0], s: x[1], e: i < 2 ? SAMPLE[i + 1][1] : 1.5 })) });
  const OPTS = {
    pickFmt: { input: 'fmt', items: [['orig', 'Same as video', 'Keeps the original frame'], ['9:16', 'Vertical 9:16', 'Reels, Shorts, TikTok'], ['4:5', 'Portrait 4:5', 'Instagram / Facebook feed'], ['1:1', 'Square 1:1', 'Posts on any app'], ['16:9', 'Wide 16:9', 'YouTube, TV'], ['4:3', 'Classic 4:3', 'Older screens, slides']] },
    pickFrame: { input: 'frame', items: [['follow', 'Follow the speaker', 'Frame stays on whoever is talking'], ['center', 'Centre', 'Always the middle of the video'], ['fit', 'Whole video', 'Everyone visible, blurred edges'], ['split', 'Split screen', 'Left person on top, right person below'], ['pip', 'Picture in picture', 'Speaker big, whole scene in a corner']] },
    pickTpl: { input: 'tpl', items: [['none', 'No template', 'Just the clip'], ['xlight', 'X post, light', 'White post card with your name'], ['xdark', 'X post, dark', 'Black post card'], ['tiktok', 'TikTok hook', 'Red tag and a bold hook'], ['news', 'Breaking news', 'Red banner and headline bar']] },
    pickTop: { input: 'top', items: [['hook', 'Hook + topic', 'Topic tag and the key sentence'], ['tag', 'Topic tag only', 'Small label on top'], ['off', 'None', 'Nothing on top']] },
    pickCap: { input: 'capstyle', items: [['pop', 'Pop', 'Bold, current word pops in yellow'], ['karaoke', 'Karaoke', 'Words turn green as spoken'], ['bold', 'Bold white', 'Big white text, black outline'], ['movie', 'Movie subtitle', 'Plain yellow text'], ['bar', 'Highlight bar', 'Current word on a blue bar'], ['comic', 'Comic', 'Big yellow, red outline, tilted'], ['neon', 'Neon glow', 'Glowing cyan and pink'], ['type', 'Typewriter', 'Letters appear one by one'], ['slide', 'Slide up', 'Each line slides in'], ['box', 'Classic box', 'Text on a dark box'], ['none', 'No captions', 'Clean picture']] }
  };
  const previews = [];
  function frame(g, W, H) {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#2b3a55'); gr.addColorStop(1, '#6b3b4f');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.arc(W * 0.5, H * 0.62, H * 0.3, 0, 7); g.fill(); g.fillRect(W * 0.32, H * 0.78, W * 0.36, H);
  }
  for (const [boxId, cfg] of Object.entries(OPTS)) {
    const box = $(boxId), input = $(cfg.input);
    for (const [val, title, desc] of cfg.items) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'card'; b.setAttribute('aria-pressed', String(input.value === val));
      let vis;
      if (boxId === 'pickFmt') { vis = document.createElement('div'); vis.className = 'shape'; const i = document.createElement('i'); const rr = val === 'orig' ? 16 / 9 : val.split(':')[0] / val.split(':')[1]; i.style.aspectRatio = String(rr); if (rr < 1) { i.style.height = '100%'; i.style.width = 'auto'; } else { i.style.width = rr > 1.5 ? '88%' : '70%'; i.style.height = 'auto'; } vis.appendChild(i); }
      else { vis = document.createElement('canvas'); vis.width = 320; vis.height = 180; previews.push({ cv: vis, kind: boxId, val, input: cfg.input, drawn: false }); }
      const t = document.createElement('b'); t.textContent = title; const d = document.createElement('span'); d.textContent = desc;
      b.append(vis, t, d);
      b.addEventListener('click', () => { input.value = val; previews.forEach((p) => { p.drawn = false; }); box.querySelectorAll('.card').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
      box.appendChild(b);
    }
  }
  function frameDemo(g, W, H, val, time) { // two people side by side; the bright box is what the clip will show
    g.fillStyle = '#10151c'; g.fillRect(0, 0, W, H);
    const px = [W * 0.27, W * 0.73];
    px.forEach((x) => { g.fillStyle = '#4b5a6c'; g.beginPath(); g.arc(x, H * 0.42, H * 0.17, 0, 7); g.fill(); g.fillRect(x - H * 0.26, H * 0.62, H * 0.52, H); });
    const who = Math.floor(time / 1.6) % 2, bw = W * 0.3, bh = H;
    let bx = px[who] - bw / 2; if (val === 'center') bx = W / 2 - bw / 2;
    g.lineWidth = 3; g.strokeStyle = '#22e4f5';
    if (val === 'split') { g.fillStyle = '#10151c'; g.fillRect(0, 0, W, H); const hw = W * 0.34, hx = (W - hw) / 2; g.fillStyle = '#4b5a6c'; g.beginPath(); g.arc(W / 2, H * 0.2, H * 0.1, 0, 7); g.fill(); g.fillRect(W / 2 - H * 0.14, H * 0.3, H * 0.28, H * 0.2); g.beginPath(); g.arc(W / 2, H * 0.7, H * 0.1, 0, 7); g.fill(); g.fillRect(W / 2 - H * 0.14, H * 0.8, H * 0.28, H * 0.2); g.fillStyle = '#22e4f5'; g.fillRect(hx, H / 2 - 1.5, hw, 3); g.font = '700 ' + Math.round(H * 0.08) + 'px sans-serif'; g.textAlign = 'center'; g.fillText('host', W * 0.8, H * 0.2); g.fillText('guest', W * 0.8, H * 0.75); return; }
    if (val === 'pip') { g.strokeStyle = '#22e4f5'; g.strokeRect(W * 0.3, 2, W * 0.4, H - 4); g.strokeRect(W * 0.56, H * 0.58, W * 0.14, H * 0.3); g.fillStyle = '#22e4f5'; g.font = '700 ' + Math.round(H * 0.08) + 'px sans-serif'; g.textAlign = 'center'; g.fillText('speaker', W * 0.5, H * 0.12); return; }
    if (val === 'fit') { g.strokeRect(2, 2, W - 4, H - 4); g.fillStyle = '#22e4f5'; g.font = '700 ' + Math.round(H * 0.1) + 'px sans-serif'; g.textAlign = 'center'; g.fillText('everyone', W / 2, H * 0.92); }
    else { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, bx, H); g.fillRect(bx + bw, 0, W - bx - bw, H); g.strokeRect(bx + 1.5, 1.5, bw - 3, bh - 3); }
    if (val === 'follow') { g.fillStyle = '#22e4f5'; g.font = '700 ' + Math.round(H * 0.1) + 'px sans-serif'; g.textAlign = 'center'; g.fillText('talking…', px[who], H * 0.1); }
  }
  const sampleClip = { tag: 'Pricing · Mistake', hook: 'The biggest mistake founders make' };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function paint(time) {
    const grad = (g, W, H) => { const x = g.createLinearGradient(0, 0, 0, H * 0.4); x.addColorStop(0, 'rgba(0,0,0,0.72)'); x.addColorStop(1, 'rgba(0,0,0,0)'); return x; };
    for (const p of previews) {
      const sel = $(p.input).value === p.val;
      if (!sel && p.drawn) continue; // only the chosen card moves, the rest stay still
      p.drawn = !sel;
      const g = p.cv.getContext('2d'), W = p.cv.width, H = p.cv.height, fs = Math.round(W * 0.09);
      frame(g, W, H);
      if (p.kind === 'pickFrame') { frameDemo(g, W, H, p.val, reduce || !sel ? 0 : time); }
      else if (p.kind === 'pickTpl') {
        g.fillStyle = '#1b222b'; g.fillRect(0, 0, W, H);
        if (p.val === 'none') { g.fillStyle = 'rgba(255,255,255,0.55)'; g.font = '600 ' + Math.round(H * 0.1) + 'px ' + FONT_; g.textAlign = 'center'; g.fillText('no template', W / 2, H / 2); }
        else { const th = H, tw = Math.round(H * 9 / 16), t2 = buildTpl(p.val, tw, th, 'The biggest mistake founders make', $('tplName').value, $('tplHandle').value); g.drawImage(t2.cv, (W - tw) / 2, 0); const hl = t2.hole; g.save(); g.beginPath(); g.rect((W - tw) / 2 + hl.x, hl.y, hl.w, hl.h); g.clip(); g.translate((W - tw) / 2 + hl.x, hl.y); frame(g, hl.w, hl.h); g.restore(); }
      }
      else if (p.kind === 'pickTop') { drawTop(g, W, H, fs, false, sampleClip, p.val, 1, grad(g, W, H)); }
      else {
        const t = reduce || !sel ? (p.val === 'type' ? 2.1 : 0.9) : time % 2.4;
        if (p.val === 'none') { g.fillStyle = 'rgba(255,255,255,0.55)'; g.font = '600 ' + Math.round(fs * 0.8) + 'px ' + FONT_; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('no captions', W / 2, H * 0.87); }
        else { const ch = mkChunk(); drawCaption(g, W, H, fs, false, ch, t, p.val); }
      }
    }
  }
  let last = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (now - last < 120 || $('viewSetup').hidden || document.hidden) return;
    last = now; paint(now / 1000);
  }
  document.fonts && document.fonts.ready ? document.fonts.ready.then(() => requestAnimationFrame(loop)) : requestAnimationFrame(loop);
})();

/* ---------- the game: tap to fly between the pillars ----------
   It runs in its own background worker (drawn on an offscreen canvas), so nothing the page does can slow it down.
   If the browser cannot do that, the same game code runs on the page instead. */
/*GAME_START*/
function gameMain(io) {
  const cv = io.canvas, g = cv.getContext('2d');
  const W = 360, H = 480, GROUND = 44, PW = 54, SPACING = 215, R = 13, X = 96, PER_LEVEL = 5, POWER_FROM = 10;
  const NAMES = ['Sky Starter', 'Cloud Runner', 'Wind Rider', 'Storm Chaser', 'Sun Chaser', 'Star Pilot', 'Comet Rider', 'Galaxy Hawk', 'Cosmic Eagle', 'Sky Legend'];
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const dpr = cv.width / W;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  let col = { bg: '#202a33', fg: '#e8ecf0', muted: '#8b96a3', line: '#27313b', accent: '#22e4f5', surface: '#161c23' };
  let st = 'ready', y = 0, vy = 0, pipes = [], orbs = [], score = 0, best = 0, made = 0, running = false, raf = 0, last = 0, clock = 0, overAt = 0;
  let shield = false, boost = 0, invuln = 0, toast = null, unlocked = {}, shown = '';
  const levelOf = (s) => Math.floor(s / PER_LEVEL) + 1;
  const gapNow = () => Math.max(122, 146 - (levelOf(score) - 1) * 3);
  const speedNow = () => (2.3 + Math.min(levelOf(score) - 1, 6) * 0.12) * (boost > 0 ? 1.6 : 1);
  const label = () => { const t = levelOf(score) + '|' + score + '|' + best; if (t !== shown) { shown = t; io.send({ t: 'score', score, best, level: levelOf(score) }); } };
  function unlock(id, name) { if (unlocked[id]) return false; unlocked[id] = 1; io.send({ t: 'ach', id, name }); return true; }
  function reset() { y = H / 2 - 30; vy = 0; pipes = []; orbs = []; score = 0; made = 0; shield = false; boost = 0; invuln = 0; toast = null; st = 'ready'; label(); }
  function addPipe(x) {
    const gp = gapNow(), top = 56 + Math.random() * (H - GROUND - gp - 112);
    pipes.push({ x, top, gap: gp, passed: false }); made++;
    if (made >= POWER_FROM + 2 && Math.random() < 0.55) orbs.push({ x: x + PW / 2, y: top + gp / 2, kind: Math.random() < 0.5 ? 'shield' : 'boost' });
  }
  function flap() {
    if (st === 'over') { if (performance.now() - overAt > 450) reset(); return; }
    if (st === 'ready') { st = 'play'; addPipe(W + 40); }
    vy = -6.3;
  }
  function addScore(n) {
    const before = levelOf(score);
    score += n;
    if (score > best) { best = score; io.send({ t: 'best', v: best }); }
    if (score >= 1) unlock('first', 'First flight');
    const after = levelOf(score);
    if (after > before) {
      const name = NAMES[Math.min(after - 2, NAMES.length - 1)], fresh = unlock('lv' + after, name);
      toast = { text: 'Level ' + after, sub: (fresh ? 'Achievement unlocked: ' : '') + name + (after === 3 ? ' · power-ups on!' : ''), t: 170 };
    }
    label();
  }
  function hit(p) {
    const box = (rx, ry, rw, rh) => { const cx = Math.max(rx, Math.min(X, rx + rw)), cy = Math.max(ry, Math.min(y, ry + rh)); const dx = X - cx, dy = y - cy; return dx * dx + dy * dy < R * R; };
    return box(p.x, 0, PW, p.top) || box(p.x, p.top + p.gap, PW, H - GROUND - (p.top + p.gap));
  }
  function update(dt) {
    clock += dt;
    if (invuln > 0) invuln -= dt;
    if (boost > 0) boost -= dt;
    if (toast) { toast.t -= dt; if (toast.t <= 0) toast = null; }
    if (st === 'ready') { y = H / 2 - 30 + Math.sin(clock / 14) * 7; return; }
    if (st !== 'play') return;
    vy = Math.min(vy + 0.36 * dt, 9); y += vy * dt;
    const sp = speedNow() * dt;
    for (const p of pipes) p.x -= sp;
    for (const o of orbs) o.x -= sp;
    if (pipes.length && pipes[0].x < -PW - 6) pipes.shift();
    orbs = orbs.filter((o) => o.x > -30);
    if (!pipes.length || pipes[pipes.length - 1].x < W - SPACING) addPipe(W + 10);
    for (const p of pipes) if (!p.passed && p.x + PW < X - R) { p.passed = true; addScore(boost > 0 ? 2 : 1); }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i], dx = o.x - X, dy = o.y - y;
      if (dx * dx + dy * dy < (R + 12) * (R + 12)) {
        orbs.splice(i, 1);
        if (o.kind === 'shield') { shield = true; toast = { text: 'Shield!', sub: 'You can survive one crash', t: 110 }; }
        else { boost = 240; toast = { text: 'Boost!', sub: 'Faster, safe and double points', t: 110 }; }
        unlock('power', 'Power collector');
      }
    }
    if (y - R < 0) { y = R; vy = 0; }
    if (boost > 0 || invuln > 0) { if (y + R > H - GROUND) { y = H - GROUND - R; vy = -6; } return; }
    const grounded = y + R > H - GROUND, hp = pipes.find(hit);
    if (grounded || hp) {
      if (shield) {
        shield = false; invuln = 80;
        if (hp) { y = hp.top + hp.gap / 2; vy = 0; } else { y = H - GROUND - R - 2; vy = -7; }
        toast = { text: 'Shield used', sub: 'Saved you!', t: 80 };
      } else { st = 'over'; overAt = performance.now(); label(); }
    }
  }
  function roundBox(x, ry, w, h, r) { if (g.roundRect) { g.beginPath(); g.roundRect(x, ry, w, h, r); g.fill(); } else g.fillRect(x, ry, w, h); }
  function banner(t1, t2, by) {
    g.fillStyle = col.surface; g.globalAlpha = 0.93;
    const bw = 264, bh = t2 ? 84 : 56, bx = (W - bw) / 2;
    roundBox(bx, by, bw, bh, 10);
    g.globalAlpha = 1; g.fillStyle = col.fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 22px ' + FONT; g.fillText(t1, W / 2, by + (t2 ? 28 : bh / 2));
    if (t2) { g.font = '500 13px ' + FONT; g.fillStyle = col.muted; g.fillText(t2, W / 2, by + 58); }
  }
  function drawOrb(o) {
    const pulse = 1 + Math.sin(clock / 6) * 0.08;
    g.save(); g.translate(o.x, o.y); g.scale(pulse, pulse);
    g.fillStyle = col.surface; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill();
    g.lineWidth = 3; g.strokeStyle = col.accent; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.stroke();
    g.fillStyle = col.accent; g.beginPath();
    if (o.kind === 'shield') { g.moveTo(-5, -6); g.lineTo(5, -6); g.lineTo(5, 1); g.quadraticCurveTo(5, 6, 0, 8); g.quadraticCurveTo(-5, 6, -5, 1); }
    else { g.moveTo(2, -8); g.lineTo(-5, 1); g.lineTo(-1, 1); g.lineTo(-2, 8); g.lineTo(5, -2); g.lineTo(1, -2); }
    g.closePath(); g.fill(); g.restore();
  }
  function draw() {
    g.fillStyle = col.bg; g.fillRect(0, 0, W, H);
    g.fillStyle = col.line; g.globalAlpha = 0.6;
    for (const c of [[70, 90, 34], [250, 60, 26], [300, 210, 30], [30, 260, 22]]) { g.beginPath(); g.ellipse(c[0] - (clock * 0.15) % 40, c[1], c[2], c[2] * 0.45, 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    for (const p of pipes) {
      g.fillStyle = col.muted;
      g.fillRect(p.x, 0, PW, p.top); g.fillRect(p.x - 4, p.top - 16, PW + 8, 16);
      const by = p.top + p.gap; g.fillRect(p.x, by, PW, H - GROUND - by); g.fillRect(p.x - 4, by, PW + 8, 16);
    }
    for (const o of orbs) drawOrb(o);
    g.fillStyle = col.line; g.fillRect(0, H - GROUND, W, GROUND);
    g.fillStyle = col.muted; g.fillRect(0, H - GROUND, W, 3);
    if (boost > 0) { g.strokeStyle = col.accent; g.lineWidth = 3; g.globalAlpha = 0.6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(X - 18 - i * 10, y - 8 + i * 8); g.lineTo(X - 44 - i * 14, y - 8 + i * 8); g.stroke(); } g.globalAlpha = 1; }
    g.save(); g.translate(X, y); g.rotate(Math.max(-0.45, Math.min(1.0, vy * 0.07)));
    if (invuln > 0 && Math.floor(clock / 4) % 2 === 0) g.globalAlpha = 0.45;
    g.fillStyle = col.accent; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
    g.fillStyle = col.surface; g.beginPath(); g.ellipse(-3, 3, 7, 5, -0.4, 0, 7); g.fill();
    g.fillStyle = col.fg; g.beginPath(); g.moveTo(R - 1, -2); g.lineTo(R + 9, 2); g.lineTo(R - 1, 6); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(5, -4, 3.6, 0, 7); g.fill();
    g.fillStyle = '#10151c'; g.beginPath(); g.arc(6, -4, 1.7, 0, 7); g.fill();
    g.globalAlpha = 1;
    if (shield) { g.strokeStyle = col.accent; g.lineWidth = 3; g.globalAlpha = 0.55 + Math.sin(clock / 5) * 0.25; g.beginPath(); g.arc(0, 0, R + 7, 0, 7); g.stroke(); g.globalAlpha = 1; }
    g.restore();
    g.fillStyle = col.fg; g.globalAlpha = 0.85; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 44px ' + FONT; g.fillText(String(score), W / 2, 44); g.globalAlpha = 1;
    g.textAlign = 'left'; g.font = '700 13px ' + FONT; g.fillStyle = col.muted;
    g.fillText('LEVEL ' + levelOf(score), 12, 18);
    if (boost > 0) { g.fillStyle = col.accent; g.fillText('BOOST ' + Math.ceil(boost / 60) + 's', 12, 36); }
    else if (shield) { g.fillStyle = col.accent; g.fillText('SHIELD READY', 12, 36); }
    if (st === 'ready') banner('Tap to fly', 'Stay between the pillars', 84);
    if (st === 'over') banner('Game over', 'Score ' + score + ' · tap to play again', 84);
    if (toast && st === 'play') { g.globalAlpha = Math.min(1, toast.t / 30); banner(toast.text, toast.sub, 84); g.globalAlpha = 1; }
  }
  function loop(now) {
    if (!running) return;
    raf = io.raf(loop);
    if (now - last < (io.minFrame || 15)) return;
    const dt = Math.min((now - last) / 16.667, 3); last = now;
    update(dt); draw();
  }
  function start() { if (running) return; running = true; reset(); last = performance.now(); raf = io.raf(loop); }
  function stop() { running = false; io.caf(raf); }
  io.onMessage((m) => {
    if (m.t === 'init') { best = m.best || 0; unlocked = m.unlocked || {}; if (m.col) col = m.col; shown = ''; label(); }
    else if (m.t === 'colors') col = m.col;
    else if (m.t === 'start') start();
    else if (m.t === 'stop') stop();
    else if (m.t === 'tap') flap();
  });
  return { dbg: () => ({ y, vy, pipes, orbs, score, st, shield, boost, invuln, level: levelOf(score), best }), flap, update, draw };
}
/*GAME_END*/

const GAME_WORKER_SRC = () => 'const gameMain = ' + gameMain.toString() + ';\n' +
  'let ioFn = null;\n' +
  'self.onmessage = function (e) {\n' +
  '  const m = e.data;\n' +
  '  if (m.t === "canvas") {\n' +
  '    gameMain({ canvas: m.canvas, minFrame: m.minFrame, send: function (x) { self.postMessage(x); }, onMessage: function (fn) { ioFn = fn; },\n' +
  '      raf: function (f) { return self.requestAnimationFrame ? self.requestAnimationFrame(f) : setTimeout(function () { f(performance.now()); }, 16); },\n' +
  '      caf: function (id) { if (self.cancelAnimationFrame) self.cancelAnimationFrame(id); else clearTimeout(id); } });\n' +
  '    self.postMessage({ t: "ready" });\n' +
  '  } else if (ioFn) { ioFn(m); }\n' +
  '};';

const game = (() => {
  const W = 360, H = 480;
  const BADGES = [['first', 'First flight'], ['lv2', 'Sky Starter'], ['lv3', 'Cloud Runner'], ['lv4', 'Wind Rider'], ['lv5', 'Storm Chaser'], ['power', 'Power collector']];
  let canvas = $('game'), post = () => {}, wantRun = false, initPromise = null, best = 0, unlocked = {};
  try { best = +localStorage.getItem('cc-best') || 0; unlocked = JSON.parse(localStorage.getItem('cc-ach') || '{}') || {}; } catch (e) { /* no storage */ }
  const css = (n, d) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d;
  const colors = () => ({ bg: css('--track', '#dfe4e9'), fg: css('--fg', '#10151c'), muted: css('--muted', '#5b6672'), line: css('--line', '#d3d9df'), accent: css('--accent-ink', '#4d9bff'), surface: css('--surface', '#fff') });
  function renderBadges() {
    const box = $('badges'); box.replaceChildren();
    for (const [id, name] of BADGES) { const s = document.createElement('span'); s.className = 'badge' + (unlocked[id] ? ' on' : ''); s.textContent = name; box.appendChild(s); }
  }
  function onMsg(m) {
    if (m.t === 'score') $('gameScore').textContent = 'Level ' + m.level + ' · Score ' + m.score + ' · Best ' + m.best;
    else if (m.t === 'best') { best = m.v; try { localStorage.setItem('cc-best', String(best)); } catch (e) { /* ok */ } }
    else if (m.t === 'ach') { unlocked[m.id] = 1; try { localStorage.setItem('cc-ach', JSON.stringify(unlocked)); } catch (e) { /* ok */ } renderBadges(); }
  }
  const sizeCanvas = (cv) => { const dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
  const bindInput = (cv) => cv.addEventListener('pointerdown', (e) => { e.preventDefault(); post({ t: 'tap' }); });
  function freshCanvas() {
    const old = canvas, fresh = document.createElement('canvas');
    fresh.id = 'game'; fresh.tabIndex = 0; fresh.setAttribute('aria-label', old.getAttribute('aria-label') || 'Game');
    old.replaceWith(fresh); canvas = fresh; sizeCanvas(fresh); return fresh;
  }
  function startOnPage(cv) {
    const listeners = [];
    gameMain({ canvas: cv, minFrame: 32, send: onMsg, onMessage: (fn) => listeners.push(fn), raf: (f) => requestAnimationFrame(f), caf: (id) => cancelAnimationFrame(id) });
    post = (m) => listeners.forEach((fn) => fn(m));
    bindInput(cv);
  }
  async function init() {
    renderBadges();
    sizeCanvas(canvas);
    if (window.OffscreenCanvas && canvas.transferControlToOffscreen && window.Worker) {
      let w = null;
      try {
        w = new Worker(URL.createObjectURL(new Blob([GAME_WORKER_SRC()], { type: 'text/javascript' })));
        const off = canvas.transferControlToOffscreen();
        const ok = await new Promise((resolve) => {
          const tm = setTimeout(() => resolve(false), 3000);
          w.onerror = () => { clearTimeout(tm); resolve(false); };
          w.onmessage = (e) => { if (e.data.t === 'ready') { clearTimeout(tm); resolve(true); } else onMsg(e.data); };
          w.postMessage({ t: 'canvas', canvas: off, minFrame: 28 }, [off]);
        });
        if (ok) { w.onmessage = (e) => onMsg(e.data); post = (m) => w.postMessage(m); bindInput(canvas); return; }
      } catch (e) { console.warn('Game worker failed', e); }
      if (w) w.terminate();
      startOnPage(freshCanvas()); // the first canvas can no longer be drawn on, so use a new one
      return;
    }
    startOnPage(canvas);
  }
  document.addEventListener('keydown', (e) => {
    if (!wantRun || (e.code !== 'Space' && e.code !== 'ArrowUp')) return;
    const t = e.target && e.target.tagName;
    if (t === 'SELECT' || t === 'INPUT' || t === 'BUTTON' || t === 'A') return;
    e.preventDefault(); post({ t: 'tap' });
  });
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => post({ t: 'colors', col: colors() })); } catch (e) { /* ok */ }
  return {
    start() {
      wantRun = true;
      if (!initPromise) initPromise = init().then(() => post({ t: 'init', best, unlocked, col: colors() }));
      initPromise.then(() => { if (wantRun) { post({ t: 'colors', col: colors() }); post({ t: 'start' }); } });
    },
    stop() { wantRun = false; post({ t: 'stop' }); }
  };
})();

/* ---------- things the owner has switched off (the owner still sees everything) ---------- */
(async function applyLocks() {
  const [st] = await Promise.all([site.settings, site.ready]);
  let asVisitor = false; try { asVisitor = localStorage.getItem('klipu:asVisitor') === '1'; } catch (e) {}
  if (await site.checkOwner()) {
    if (!asVisitor) return;
    const pill = document.createElement('button'); pill.type = 'button'; pill.textContent = 'Visitor preview on. Tap to go back to owner view';
    pill.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:60;padding:12px 14px;border-radius:12px;border:0;background:#1f6bff;color:#fff;font:600 14px system-ui,sans-serif';
    pill.onclick = () => { try { localStorage.removeItem('klipu:asVisitor'); } catch (e) {} location.reload(); };
    document.body.appendChild(pill);
  }
  for (const g of CATALOG) {
    const off = (st.disabled && st.disabled[g.key]) || []; if (!off.length) continue;
    if (g.kind === 'select') {
      const sel = $(g.id);
      [...sel.options].forEach((o) => { if (off.includes(o.value)) o.remove(); });
      if (off.includes(sel.value) && sel.options.length) { sel.selectedIndex = 0; sel.dispatchEvent(new Event('change')); }
    } else {
      const cards = [...$(g.box).querySelectorAll('.card')], input = $(g.input);
      g.items.forEach(([val], i) => { if (off.includes(val) && cards[i]) cards[i].hidden = true; });
      if (off.includes(input.value)) { const first = cards.find((c) => !c.hidden); if (first) first.click(); }
    }
  }
})();
