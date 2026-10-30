/* app.js – Kapitel-Navigation, Inhaltsverzeichnis, Fortschritt */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const { Engine } = window;

  const chapters = $$('section.chapter');
  const index = new Map(chapters.map((c, i) => [c.id, i]));
  const PARTS = {
    P: 'Prolog',
    I: 'Teil I · Die Suche nach hartem Geld',
    II: 'Teil II · Papier, Macht und Fiat',
    III: 'Teil III · Bitcoin',
    A: 'Anhang'
  };
  const STORE = 'gdg-v1';
  const store = (() => {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
  })();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(store)); } catch { /* privat */ } };
  store.seen = store.seen || {};

  const label = (c) => {
    const n = +c.dataset.num;
    return n > 0 && c.dataset.part !== 'A' ? `Kapitel ${n}` : c.dataset.part === 'A' ? 'Anhang' : 'Prolog';
  };

  /* ---------- Kapitelköpfe & Navigation ---------- */
  chapters.forEach((c, i) => {
    c.classList.add('part-' + c.dataset.part);
    const nav = document.createElement('nav');
    nav.className = 'ch-nav';
    nav.setAttribute('aria-label', 'Kapitelnavigation');
    const prev = chapters[i - 1], next = chapters[i + 1];
    if (prev) {
      nav.insertAdjacentHTML('beforeend', `<a class="prev" href="#/${prev.id}"><span class="lbl">← ${label(prev)}</span><span class="tt">${prev.dataset.title}</span></a>`);
    }
    if (next) {
      nav.insertAdjacentHTML('beforeend', `<a class="next" href="#/${next.id}"><span class="lbl">Weiter: ${label(next)} →</span><span class="tt">${next.dataset.title}</span><span class="kbd">oder Pfeiltaste →</span></a>`);
    }
    c.appendChild(nav);
  });

  /* ---------- Inhaltsverzeichnis ---------- */
  const tocInner = $('#tocInner');
  const groups = {};
  chapters.forEach((c) => { (groups[c.dataset.part] = groups[c.dataset.part] || []).push(c); });
  Object.keys(PARTS).forEach((p) => {
    if (!groups[p]) return;
    const h = document.createElement('h2');
    h.textContent = PARTS[p];
    const grid = document.createElement('div');
    grid.className = 'toc-grid';
    groups[p].forEach((c) => {
      const a = document.createElement('a');
      a.href = '#/' + c.id;
      a.dataset.id = c.id;
      const n = c.dataset.part === 'P' ? '00' : c.dataset.part === 'A' ? '§' : String(c.dataset.num).padStart(2, '0');
      a.innerHTML = `<span class="n">${n}</span><span><span class="t">${c.dataset.title}</span><span class="d">${c.dataset.desc || ''}</span></span>`;
      grid.appendChild(a);
    });
    tocInner.append(h, grid);
  });

  const toc = $('#toc'), tocBtn = $('#tocBtn');
  const setToc = (open) => {
    toc.hidden = !open;
    tocBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      const cur = toc.querySelector('a.current');
      if (cur) cur.scrollIntoView({ block: 'center' });
    }
  };
  tocBtn.addEventListener('click', () => setToc(toc.hidden));
  toc.addEventListener('click', (e) => { if (e.target.closest('a')) setToc(false); });

  /* ---------- Einblenden beim Scrollen ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });

  function prepareReveal(c) {
    if (c.dataset.revealed) return;
    c.dataset.revealed = '1';
    $$('.prose > p, .prose > h2, .prose > h3, .prose > .note, .prose > blockquote, .prose > ul, .prose > ol, .prose > .tl > li, .prose > .route > a', c)
      .forEach((n) => { n.classList.add('reveal'); revealIO.observe(n); });
  }

  /* ---------- Router ---------- */
  let current = -1;
  const where = $('#where'), prevBtn = $('#prevBtn'), nextBtn = $('#nextBtn');

  function show(i) {
    if (i === current) return;
    if (current >= 0) {
      chapters[current].classList.remove('active');
      Engine.deactivate(chapters[current]);
    }
    current = i;
    const c = chapters[i];
    c.classList.add('active');
    window.scrollTo(0, 0);
    prepareReveal(c);
    Engine.mountIn(c);
    if (window.renderMathInElement && !c.dataset.math) {
      window.renderMathInElement(c, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
      c.dataset.math = '1';
    }
    where.innerHTML = c.dataset.part === 'P' ? '<b>Die Geschichte des Geldes</b>' :
      `${label(c)} von ${chapters.length - 2} · <b>${c.dataset.title}</b>`;
    document.title = (c.dataset.part === 'P' ? '' : c.dataset.title + ' – ') + 'Die Geschichte des Geldes';
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === chapters.length - 1;
    $$('a', toc).forEach((a) => {
      a.classList.toggle('current', a.dataset.id === c.id);
      a.classList.toggle('seen', !!store.seen[a.dataset.id]);
    });
    store.seen[c.id] = 1;
    store.last = c.id;
    save();
    updateProgress();
  }

  function route() {
    const slug = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if (slug && !index.has(slug)) {
      const target = document.getElementById(slug);
      const sec = target && target.closest('section.chapter');
      if (sec) { show(index.get(sec.id)); target.scrollIntoView(); return; }
    }
    show(index.has(slug) ? index.get(slug) : 0);
  }

  const go = (d) => {
    const j = current + d;
    if (j >= 0 && j < chapters.length) location.hash = '#/' + chapters[j].id;
  };
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Escape' && !toc.hidden) setToc(false);
  });

  /* ---------- Fortschrittsbalken ---------- */
  const bar = $('#progress');
  function updateProgress() {
    const h = document.documentElement.scrollHeight - innerHeight;
    const p = h > 0 ? scrollY / h : 0;
    const base = current / (chapters.length - 1);
    const step = 1 / (chapters.length - 1);
    bar.style.width = Math.min(100, (base + p * step) * 100) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  /* ---------- «Weiterlesen» im Prolog ---------- */
  const resume = $('#resume');
  if (resume && store.last && store.last !== 'prolog' && index.has(store.last)) {
    const c = chapters[index.get(store.last)];
    resume.innerHTML = `Du warst zuletzt bei <a href="#/${c.id}">${label(c)}: ${c.dataset.title}</a>.`;
    resume.hidden = false;
  }

  route();
})();
