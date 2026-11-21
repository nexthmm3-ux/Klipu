import './site.js';
/* ---------- landing page: nav shadow, scroll reveal, tabs, soft character field ---------- */
(function () {
  try {
    let waiting = [...document.querySelectorAll('.lp-r')];
    const check = () => { const h = innerHeight || 700; waiting = waiting.filter(e => { if (e.getBoundingClientRect().top < h * 0.94) { e.classList.add('in'); return false; } return true; }); };
    addEventListener('scroll', check, { passive: true }); addEventListener('resize', check); addEventListener('load', check);
    const tm = setInterval(() => { check(); if (!waiting.length) clearInterval(tm); }, 400); check();
    const WHO = [
      ['Creators', 'You filmed a long video and the best ten seconds are buried in it. Finding them again is the job nobody wants.', 'Add the video. The strongest moments come back cut, captioned and ranked, ready for Shorts, Reels and TikTok.', 'One long video', 'A set of ranked clips'],
      ['Podcasters', 'Ninety minutes recorded, two clips posted. The rest of the episode never leaves the feed it was published in.', 'Every episode comes back as captioned clips with a title and hashtags, so the week of posts is chosen in minutes.', '60 to 120 minute episodes', 'A week of clips'],
      ['Teachers', 'A recorded lesson has a few moments students keep asking about, and nobody has time to cut them out.', 'Add the lesson and get short captioned clips of the key explanations to share with a class.', 'A full lesson', 'Short clips of key ideas'],
      ['Small businesses', 'Talks, demos and customer stories are recorded, filed and forgotten. Social posts never make it onto the to-do list.', 'The recording goes in the same afternoon and captioned clips come out, each with post text already written.', 'Talks and demos', 'Social clips, same day']];
    const tabs = document.getElementById('lpTabs'), panel = document.getElementById('lpPanel');
    const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const show = i => {
      tabs.innerHTML = WHO.map((w, n) => `<button class="lp-tab" role="tab" type="button" aria-selected="${n === i}" data-i="${n}">${esc(w[0])}</button>`).join('');
      const w = WHO[i];
      panel.innerHTML = `<div><p class="who">${esc(w[0])}</p><p class="pain">${esc(w[1])}</p><p class="fix">${esc(w[2])}</p></div><div class="lp-ft"><div><small>From</small><b>${esc(w[3])}</b></div><div class="arrow">↓</div><div><small>To</small><b>${esc(w[4])}</b></div></div>`;
    };
    tabs.addEventListener('click', e => { const b = e.target.closest('.lp-tab'); if (b) show(Number(b.dataset.i)); });
    show(0);

    // soft field of small characters that fade in and out as they drift (cheap: one canvas, opacity only)
    const host = document.getElementById('lpAscii'), cv = host.querySelector('canvas'), cx = cv.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const G = '-=+xX+x=', CELL = 12, LINE = 18;
    let w = 0, h = 0, cells = [], raf = 0, vis = true;
    const hash = (a, b) => { let s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = (x - xi) ** 2 * (3 - 2 * (x - xi)), v = (y - yi) ** 2 * (3 - 2 * (y - yi)); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
    const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const size = () => {
      const r = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      cv.width = w * dpr; cv.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells = [];
      for (let y = 4, row = 0; y < h; y += LINE, row++) for (let x = (row % 2) * CELL / 2; x < w; x += CELL) cells.push({ x, y, g: G[Math.floor(hash(x, y) * G.length)] });
    };
    const draw = now => {
      const t = now / 1000, dark = document.documentElement.dataset.theme !== 'light';
      cx.clearRect(0, 0, w, h);
      cx.font = `400 ${LINE - 6}px ui-monospace, Menlo, Consolas, monospace`; cx.textBaseline = 'top';
      const ink = dark ? '77,155,255' : '10,86,240';
      for (const c of cells) {
        const n = vn(c.x * 0.012 + t * 0.045, c.y * 0.03 - t * 0.028) * 0.65 + vn(c.x * 0.025 + 17 + t * 0.045, c.y * 0.063 + 5 - t * 0.028) * 0.35;
        const a = sm(0.5, 0.78, n) * (dark ? 0.32 : 0.34);
        if (a < 0.03) continue;
        cx.fillStyle = `rgba(${ink},${a.toFixed(3)})`; cx.fillText(c.g, c.x, c.y);
      }
    };
    const loop = now => { raf = 0; if (!vis || document.hidden) return; draw(now); raf = requestAnimationFrame(loop); };
    const go = () => { if (!raf && !still) raf = requestAnimationFrame(loop); };
    size(); draw(performance.now());
    new ResizeObserver(() => { size(); draw(performance.now()); }).observe(host);
    try { new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) go(); }).observe(host); } catch (e) { /* ok */ }
    document.addEventListener('visibilitychange', go); go();
  } catch (e) { /* the landing page is decoration: never break the app */ }
})();
