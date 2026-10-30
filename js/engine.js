/* ==========================================================================
   engine.js – eine kleine Canvas-Animations-Engine im Stil von 3Blue1Brown

   Jede Szene ist ein Objekt { W, H, duration, setup, update, draw }.
   - draw(s, t) zeichnet den Zustand zum Zeitpunkt t (Sekunden).
     Zeitbasierte Szenen sind damit deterministisch und lassen sich spulen.
   - Interaktive Szenen nutzen setup(s) für Regler/Knöpfe und update(s, dt).
   Gezeichnet wird immer in einem virtuellen Koordinatensystem (W × H),
   das automatisch auf die tatsächliche Grösse skaliert wird.
   ========================================================================== */
(function () {
  'use strict';

  const SERIF = '"Source Serif 4", Georgia, serif';
  const MONO = '"JetBrains Mono", ui-monospace, monospace';

  const C = {
    bg: '#0a0c10', ink: '#ece9e2', ink2: '#c9c6bf', dim: '#8b9099', faint: '#3a404b', grid: '#1a2029',
    blue: '#58C4DD', blueD: '#29ABCA', blueE: '#1C758A', teal: '#5CD0B3', green: '#83C167',
    yellow: '#F4D345', gold: '#F0AC5F', goldD: '#C78D46', red: '#FC6255', maroon: '#C55F73',
    purple: '#9A72AC', btc: '#F7931A', brown: '#A27C5B', silver: '#C9CED6', copper: '#C27C4A',
    salt: '#ECE7DA', sand: '#C9B48A', sea: '#0e2433', paper: '#E8DFC4', money: '#8FB38A', coin: '#E6BC4E'
  };

  /* ---------- Mathe-Helfer ---------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => { t = clamp(t); return t * t * t * (t * (6 * t - 15) + 10); };
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const easeIn = (t) => Math.pow(clamp(t), 3);
  const easeOutBack = (t) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const sseg = (t, a, b) => smooth(seg(t, a, b));
  const pulse = (t, a, b) => { const x = seg(t, a, b); return Math.sin(Math.PI * x); };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = (h, a) => { const [r, g, b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; };
  function mix(h1, h2, t) {
    const a = hexToRgb(h1), b = hexToRgb(h2);
    return '#' + a.map((v, i) => Math.round(lerp(v, b[i], clamp(t))).toString(16).padStart(2, '0')).join('');
  }

  /* Zahlen im Schweizer Format: 1’234’567.8 */
  function fmt(n, d = 0) {
    const neg = n < 0;
    let [i, f] = Math.abs(n).toFixed(d).split('.');
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, '’');
    return (neg ? '−' : '') + i + (f ? '.' + f : '');
  }
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');

  const U = { clamp, lerp, smooth, easeOut, easeIn, easeOutBack, seg, sseg, pulse, rng, rgba, mix, fmt, sup, hexToRgb };

  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(typeof r === 'number' ? r : 0, Math.abs(w) / 2, Math.abs(h) / 2);
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
    };
  }

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  const ICON_PLAY = '<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9.5-5.5z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 16 16"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>';
  const ICON_REPLAY = '<svg viewBox="0 0 16 16"><path d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5M3 2v3.2h3.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- Globale Animationsschleife ---------- */
  const stages = new Set();
  let last = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    for (const s of stages) if (s.active && s.visible) s.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Stage ---------- */
  class Stage {
    constructor(host, def) {
      this.host = host;
      this.def = def;
      this.W = def.W || 960;
      this.H = def.H || 540;
      this.duration = def.duration || 0;
      this.loop = !!def.loop;
      this.t = 0;
      this.clock = 0;
      this.playing = false;
      this.started = false;
      this.visible = false;
      this.active = true;
      this.state = {};
      this.mouse = { x: -1, y: -1, down: false, inside: false };

      const cap = host.querySelector('figcaption');
      this.box = el('div', 'stage-box');
      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('role', 'img');
      this.canvas.setAttribute('aria-label', def.label || (cap ? cap.textContent : 'Animation'));
      this.box.appendChild(this.canvas);
      host.insertBefore(this.box, cap);
      this.ctx = this.canvas.getContext('2d');

      if (this.duration && def.controls !== false) this.buildControls(cap);
      this.ui = el('div', 'stage-ui');
      host.insertBefore(this.ui, cap);
      if (def.setup) def.setup(this);

      this.resize();
      new ResizeObserver(() => this.resize()).observe(this.box);
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          this.visible = e.isIntersecting && e.intersectionRatio >= 0.12;
          if (this.visible && !this.started) {
            this.started = true;
            if (reducedMotion && this.duration && !this.loop) { this.t = this.duration; this.syncCtrl(); }
            else this.play();
          }
        }
      }, { threshold: [0, 0.15, 0.5, 1] });
      io.observe(this.canvas);

      const pt = (e) => {
        const r = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - r.left) / r.width) * this.W;
        this.mouse.y = ((e.clientY - r.top) / r.height) * this.H;
      };
      this.canvas.addEventListener('pointermove', (e) => { pt(e); this.mouse.inside = true; if (def.onMove) def.onMove(this, this.mouse); });
      this.canvas.addEventListener('pointerleave', () => { this.mouse.inside = false; });
      this.canvas.addEventListener('pointerdown', (e) => { pt(e); this.mouse.down = true; if (def.onDown) def.onDown(this, this.mouse); });
      window.addEventListener('pointerup', () => { this.mouse.down = false; });

      stages.add(this);
      this.draw();
    }

    buildControls(cap) {
      const bar = el('div', 'stage-ctrl');
      const bp = el('button'); bp.type = 'button';
      const br = el('button'); br.type = 'button'; br.innerHTML = ICON_REPLAY;
      br.setAttribute('aria-label', 'Neu starten'); br.title = 'Neu starten';
      const range = document.createElement('input');
      range.type = 'range'; range.min = 0; range.max = 1000; range.value = 0; range.step = 1;
      range.setAttribute('aria-label', 'Zeitleiste der Animation');
      bp.onclick = () => {
        if (this.playing) this.pause();
        else if (this.t >= this.duration - 1e-3) this.restart();
        else this.play();
      };
      br.onclick = () => this.restart();
      range.addEventListener('input', () => {
        this.t = (range.value / 1000) * this.duration;
        this.pause();
        this.draw();
      });
      bar.append(bp, br, range);
      this.host.insertBefore(bar, cap);
      this.ctrl = { bp, range };
      this.syncCtrl();
    }

    play() { this.playing = true; this.syncCtrl(); }
    pause() { this.playing = false; this.syncCtrl(); }
    restart() { this.t = 0; if (this.def.reset) this.def.reset(this); this.play(); }
    syncCtrl() {
      if (!this.ctrl) return;
      this.ctrl.bp.innerHTML = this.playing ? ICON_PAUSE : ICON_PLAY;
      this.ctrl.bp.setAttribute('aria-label', this.playing ? 'Pause' : 'Abspielen');
      this.ctrl.range.value = this.duration ? (this.t / this.duration) * 1000 : 0;
    }

    frame(dt) {
      this.clock += dt;
      if (this.playing) {
        this.t += dt;
        if (this.duration && this.t >= this.duration) {
          if (this.loop) this.t -= this.duration;
          else { this.t = this.duration; this.playing = false; this.syncCtrl(); }
        }
        if (this.ctrl) this.ctrl.range.value = (this.t / this.duration) * 1000;
      }
      if (this.def.update) this.def.update(this, dt);
      this.draw();
    }

    resize() {
      const w = this.box.clientWidth;
      if (!w) return;
      const h = (w * this.H) / this.W;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.style.height = h + 'px';
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.k = this.canvas.width / this.W;
      this.draw();
    }

    draw() {
      if (!this.k) return;
      const ctx = this.ctx;
      ctx.setTransform(this.k, 0, 0, this.k, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, this.W, this.H);
      try { this.def.draw(this, this.t); } catch (err) {
        if (!this.failed) console.error('Fehler in Szene', this.host.dataset.scene, err);
        this.failed = true;
      }
    }

    /* ---------- UI-Bausteine ---------- */
    slider(o) {
      const wrap = el('label', 'ctl ctl-slider');
      const name = el('span', 'ctl-name', o.label);
      const input = document.createElement('input');
      input.type = 'range';
      input.min = o.min; input.max = o.max; input.step = o.step || 1; input.value = o.value;
      const out = el('output', 'ctl-val', o.format ? o.format(+o.value) : String(o.value));
      input.addEventListener('input', () => {
        const v = +input.value;
        out.textContent = o.format ? o.format(v) : String(v);
        if (o.onInput) o.onInput(v);
      });
      wrap.append(name, input, out);
      this.ui.appendChild(wrap);
      return input;
    }

    toggle(labels, idx, fn) {
      const wrap = el('div', 'ctl ctl-seg');
      wrap.setAttribute('role', 'group');
      const btns = labels.map((l, i) => {
        const b = el('button', i === idx ? 'on' : '', l);
        b.type = 'button';
        b.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
        b.onclick = () => { set(i); fn(i); };
        wrap.appendChild(b);
        return b;
      });
      const set = (i) => btns.forEach((x, j) => { x.classList.toggle('on', i === j); x.setAttribute('aria-pressed', i === j ? 'true' : 'false'); });
      this.ui.appendChild(wrap);
      return { set, el: wrap };
    }

    button(label, fn, cls) {
      const b = el('button', 'ctl ctl-btn ' + (cls || ''), label);
      b.type = 'button';
      b.onclick = fn;
      this.ui.appendChild(b);
      return b;
    }

    /* ---------- Zeichen-Helfer ---------- */
    font(size, o = {}) {
      return `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px ${o.mono ? MONO : SERIF}`;
    }

    alpha(a, fn) {
      if (a <= 0) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha *= a;
      fn();
      ctx.restore();
    }

    at(x, y, sc, fn, rot) {
      if (sc <= 0) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      ctx.scale(sc, sc);
      fn();
      ctx.restore();
    }

    text(str, x, y, o = {}) {
      const a = o.alpha ?? 1;
      if (a <= 0 || str === '' || str == null) return 0;
      const ctx = this.ctx;
      const size = o.size || 22;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.font = this.font(size, o);
      ctx.fillStyle = o.color || C.ink;
      ctx.textAlign = o.align || 'left';
      ctx.textBaseline = o.baseline || 'alphabetic';
      const w = ctx.measureText(str).width;
      if (o.reveal !== undefined && o.reveal < 1) {
        let x0 = x;
        if (ctx.textAlign === 'center') x0 = x - w / 2;
        else if (ctx.textAlign === 'right') x0 = x - w;
        ctx.beginPath();
        ctx.rect(x0 - 4, y - size * 1.4, (w + 8) * Math.max(0, o.reveal), size * 2.4);
        ctx.clip();
      }
      if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowBlur || 16; }
      if (o.rotate) { ctx.translate(x, y); ctx.rotate(o.rotate); ctx.fillText(str, 0, 0); }
      else ctx.fillText(String(str), x, y);
      ctx.restore();
      return w;
    }

    measure(str, size, o = {}) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = this.font(size, o);
      const w = ctx.measureText(str).width;
      ctx.restore();
      return w;
    }

    wrapLines(str, maxW, o = {}) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = this.font(o.size || 22, o);
      const out = [];
      for (const para of String(str).split('\n')) {
        const words = para.split(' ');
        let line = '';
        for (const w of words) {
          const test = line ? line + ' ' + w : w;
          if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
          else line = test;
        }
        out.push(line);
      }
      ctx.restore();
      return out;
    }

    wrapText(str, x, y, maxW, o = {}) {
      const lines = this.wrapLines(str, maxW, o);
      const size = o.size || 22;
      const lh = size * (o.lineHeight || 1.35);
      let y0 = y;
      if (o.valign === 'bottom') y0 = y - (lines.length - 1) * lh;
      else if (o.valign === 'middle') y0 = y - ((lines.length - 1) * lh) / 2;
      lines.forEach((l, i) => this.text(l, x, y0 + i * lh, o));
      return lines.length * lh;
    }

    /* Untertitel, die zu bestimmten Zeiten ein- und ausblenden.
       list: [[start, ende, 'Text'], …] */
    captions(t, list, o = {}) {
      const size = o.size || 21;
      for (const [a, b, str] of list) {
        if (t < a || t > b + 0.45) continue;
        const al = Math.min(sseg(t, a, a + 0.5), 1 - sseg(t, b, b + 0.45));
        if (al <= 0) continue;
        const lines = this.wrapLines(str, o.maxW || this.W - 120, { size, italic: true });
        const lh = size * 1.32;
        const top = o.top !== undefined;
        const yBase = top ? o.top : (o.y ?? this.H - 24);
        const y0 = top ? yBase : yBase - (lines.length - 1) * lh;
        const wMax = Math.max(...lines.map((l) => this.measure(l, size, { italic: true })));
        const cx = o.x ?? this.W / 2;
        this.rect(cx - wMax / 2 - 16, y0 - size * 1.05, wMax + 32, lines.length * lh + size * 0.55, { fill: 'rgba(10,12,16,0.78)', r: 8, alpha: al });
        lines.forEach((l, i) => this.text(l, cx, y0 + i * lh, { size, align: 'center', italic: true, color: o.color || C.ink, alpha: al }));
      }
    }

    line(x1, y1, x2, y2, o = {}) {
      const p = o.progress ?? 1;
      const a = o.alpha ?? 1;
      if (p <= 0 || a <= 0) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.strokeStyle = o.color || C.ink;
      ctx.lineWidth = o.width || 2;
      ctx.lineCap = o.cap || 'round';
      if (o.dash) ctx.setLineDash(o.dash);
      if (o.dashOffset) ctx.lineDashOffset = o.dashOffset;
      if (o.glow) { ctx.shadowColor = o.color || C.ink; ctx.shadowBlur = o.glow; }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(lerp(x1, x2, p), lerp(y1, y2, p));
      ctx.stroke();
      ctx.restore();
    }

    arrow(x1, y1, x2, y2, o = {}) {
      const p = o.progress ?? 1;
      if (p <= 0 || (o.alpha ?? 1) <= 0) return;
      const ex = lerp(x1, x2, p), ey = lerp(y1, y2, p);
      const ang = Math.atan2(ey - y1, ex - x1);
      const hs = o.head || 13;
      const len = Math.hypot(ex - x1, ey - y1);
      const cut = Math.min(len, hs * 0.75);
      this.line(x1, y1, ex - Math.cos(ang) * cut, ey - Math.sin(ang) * cut, o);
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      ctx.fillStyle = o.color || C.ink;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - hs * Math.cos(ang - 0.42), ey - hs * Math.sin(ang - 0.42));
      ctx.lineTo(ex - hs * Math.cos(ang + 0.42), ey - hs * Math.sin(ang + 0.42));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* gekrümmter Pfeil über einen Kontrollpunkt (quadratische Bézierkurve) */
    curveArrow(x1, y1, cx, cy, x2, y2, o = {}) {
      const p = o.progress ?? 1;
      if (p <= 0) return;
      const pts = [];
      const n = 40;
      for (let i = 0; i <= n * p; i++) {
        const u = i / n;
        pts.push([(1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2, (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2]);
      }
      if (pts.length < 2) return;
      const [ax, ay] = pts[pts.length - 2], [bx, by] = pts[pts.length - 1];
      this.poly(pts.slice(0, -1), { stroke: o.color || C.ink, width: o.width || 2, alpha: o.alpha, dash: o.dash });
      this.arrow(ax, ay, bx, by, { color: o.color, width: o.width || 2, head: o.head || 12, alpha: o.alpha });
    }

    circle(x, y, r, o = {}) {
      const a = o.alpha ?? 1;
      if (r <= 0 || a <= 0) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha *= a;
      const p = o.progress ?? 1;
      const a0 = o.start ?? -Math.PI / 2;
      ctx.beginPath();
      ctx.arc(x, y, r, a0, a0 + Math.PI * 2 * p);
      if (o.glow) { ctx.shadowColor = o.fill || o.stroke; ctx.shadowBlur = o.glow; }
      if (o.fill && p >= 1) { ctx.fillStyle = o.fill; ctx.fill(); }
      if (o.stroke) {
        ctx.strokeStyle = o.stroke;
        ctx.lineWidth = o.width || 2;
        if (o.dash) ctx.setLineDash(o.dash);
        ctx.stroke();
      }
      ctx.restore();
    }

    rect(x, y, w, h, o = {}) {
      const a = o.alpha ?? 1;
      if (a <= 0 || w === 0 || h === 0) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.beginPath();
      if (o.r) ctx.roundRect(x, y, w, h, Math.min(o.r, Math.abs(w) / 2, Math.abs(h) / 2));
      else ctx.rect(x, y, w, h);
      if (o.glow) { ctx.shadowColor = o.fill || o.stroke; ctx.shadowBlur = o.glow; }
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
      if (o.stroke) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = o.stroke;
        ctx.lineWidth = o.width || 2;
        if (o.dash) ctx.setLineDash(o.dash);
        ctx.stroke();
      }
      ctx.restore();
    }

    poly(pts, o = {}) {
      const a = o.alpha ?? 1;
      if (!pts || pts.length < 2 || a <= 0) return;
      const p = o.progress ?? 1;
      if (p <= 0) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      if (p >= 1) {
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        if (o.closed) ctx.closePath();
      } else {
        const L = Stage.lengths(pts);
        const target = L[L.length - 1] * p;
        for (let i = 1; i < pts.length; i++) {
          if (L[i] <= target) ctx.lineTo(pts[i][0], pts[i][1]);
          else {
            const f = (target - L[i - 1]) / (L[i] - L[i - 1] || 1);
            ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
            break;
          }
        }
      }
      if (o.fill && p >= 1) { ctx.fillStyle = o.fill; ctx.fill(); }
      if (o.stroke) {
        ctx.strokeStyle = o.stroke;
        ctx.lineWidth = o.width || 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (o.dash) ctx.setLineDash(o.dash);
        if (o.glow) { ctx.shadowColor = o.stroke; ctx.shadowBlur = o.glow; }
        ctx.stroke();
      }
      ctx.restore();
    }

    static lengths(pts) {
      const L = [0];
      for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return L;
    }

    /* Punkt bei Anteil p entlang einer Polylinie (für den «Stift» beim Zeichnen) */
    static pointAt(pts, p) {
      const L = Stage.lengths(pts);
      const target = L[L.length - 1] * clamp(p);
      for (let i = 1; i < pts.length; i++) {
        if (L[i] >= target) {
          const f = (target - L[i - 1]) / (L[i] - L[i - 1] || 1);
          return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
        }
      }
      return pts[pts.length - 1];
    }

    /* Achsen mit Ticks: ax = { x, y, w, h, X(v), Y(v) } */
    axes(ax, o = {}) {
      const a = o.alpha ?? 1;
      const col = o.color || C.faint;
      this.line(ax.x, ax.y + ax.h, ax.x + ax.w, ax.y + ax.h, { color: col, width: 1.6, alpha: a, progress: o.progress });
      this.line(ax.x, ax.y + ax.h, ax.x, ax.y, { color: col, width: 1.6, alpha: a, progress: o.progress });
      (o.xticks || []).forEach(([v, label]) => {
        const X = ax.X(v);
        this.line(X, ax.y + ax.h, X, ax.y + ax.h + 6, { color: col, width: 1.4, alpha: a });
        this.text(label, X, ax.y + ax.h + 26, { size: o.tickSize || 16, align: 'center', color: C.dim, alpha: a });
      });
      (o.yticks || []).forEach(([v, label, al]) => {
        const Y = ax.Y(v);
        const aa = a * (al ?? 1);
        if (o.grid) this.line(ax.x, Y, ax.x + ax.w, Y, { color: C.grid, width: 1, alpha: aa });
        this.line(ax.x - 6, Y, ax.x, Y, { color: col, width: 1.4, alpha: aa });
        this.text(label, ax.x - 12, Y + 5, { size: o.tickSize || 16, align: 'right', color: C.dim, alpha: aa });
      });
    }
  }

  /* ---------- Symbole / Icons ---------- */
  const I = {
    coin(s, x, y, r, o = {}) {
      const ctx = s.ctx, col = o.color || C.coin;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, mix(col, '#ffffff', 0.38));
      g.addColorStop(1, mix(col, '#000000', 0.22));
      ctx.fillStyle = g;
      if (o.glow) { ctx.shadowColor = col; ctx.shadowBlur = o.glow; }
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = mix(col, '#000', 0.42);
      ctx.lineWidth = Math.max(1, r * 0.07);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(mix(col, '#000', 0.5), 0.55);
      ctx.lineWidth = Math.max(0.8, r * 0.045);
      ctx.stroke();
      if (o.symbol) {
        ctx.fillStyle = mix(col, '#000', 0.55);
        ctx.font = `700 ${r * (o.symbol.length > 1 ? 0.62 : 0.95)}px ${SERIF}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(o.symbol, x, y + r * 0.04);
      }
      ctx.restore();
    },

    btc(s, x, y, r, o = {}) {
      I.coin(s, x, y, r, { color: C.btc, alpha: o.alpha, glow: o.glow });
      const ctx = s.ctx;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      ctx.translate(x, y);
      ctx.rotate(-0.24);
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${r * 1.12}px ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', r * 0.02, r * 0.07);
      const sw = r * 0.085, sh = r * 0.2;
      ctx.fillRect(-r * 0.17, -r * 0.6, sw, sh);
      ctx.fillRect(r * 0.05, -r * 0.6, sw, sh);
      ctx.fillRect(-r * 0.17, r * 0.44, sw, sh);
      ctx.fillRect(r * 0.05, r * 0.44, sw, sh);
      ctx.restore();
    },

    goldBar(s, x, y, w, o = {}) {
      const h = w * 0.34, inset = w * 0.15, ctx = s.ctx, col = o.color || C.coin;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y + h / 2);
      ctx.lineTo(x + w / 2, y + h / 2);
      ctx.lineTo(x + w / 2 - inset, y - h / 2);
      ctx.lineTo(x - w / 2 + inset, y - h / 2);
      ctx.closePath();
      const g = ctx.createLinearGradient(x, y - h / 2, x, y + h / 2);
      g.addColorStop(0, mix(col, '#fff', 0.35));
      g.addColorStop(1, mix(col, '#000', 0.18));
      ctx.fillStyle = g;
      if (o.glow) { ctx.shadowColor = col; ctx.shadowBlur = o.glow; }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = mix(col, '#000', 0.45);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    },

    person(s, x, y, h, o = {}) {
      const ctx = s.ctx, col = o.color || C.blue;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      ctx.fillStyle = col;
      const hr = h * 0.17;
      const hy = y - h * 0.8;
      ctx.beginPath(); ctx.arc(x, hy, hr, 0, Math.PI * 2); ctx.fill();
      const bw = h * 0.28;
      ctx.beginPath();
      ctx.moveTo(x - bw, y);
      ctx.quadraticCurveTo(x - bw, y - h * 0.6, x, y - h * 0.6);
      ctx.quadraticCurveTo(x + bw, y - h * 0.6, x + bw, y);
      ctx.closePath();
      ctx.fill();
      if (o.eyes !== false && h >= 26) {
        const look = o.look || 0;
        const er = h * 0.05, ex = h * 0.065;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x - ex + look * h * 0.03, hy - h * 0.01, er, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + ex + look * h * 0.03, hy - h * 0.01, er, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#16181d';
        const pr = er * 0.55;
        ctx.beginPath(); ctx.arc(x - ex + look * h * 0.045, hy - h * 0.005, pr, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + ex + look * h * 0.045, hy - h * 0.005, pr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },

    hut(s, x, y, size, o = {}) {
      const w = size, h = size * 0.5;
      s.rect(x - w / 2, y - h, w, h, { fill: '#7a5c3c', alpha: o.alpha });
      s.rect(x - w * 0.11, y - h * 0.7, w * 0.22, h * 0.7, { fill: '#2b2015', alpha: o.alpha });
      s.poly([[x - w * 0.68, y - h + 2], [x, y - h - size * 0.58], [x + w * 0.68, y - h + 2]], { fill: '#c49a54', closed: true, alpha: o.alpha });
      s.poly([[x - w * 0.68, y - h + 2], [x, y - h - size * 0.58], [x + w * 0.68, y - h + 2]], { stroke: '#8b6a34', width: 1.5, closed: true, alpha: o.alpha });
    },

    ship(s, x, y, size, o = {}) {
      const a = o.alpha;
      s.poly([[x - size, y - size * 0.2], [x + size * 1.05, y - size * 0.2], [x + size * 0.78, y + size * 0.22], [x - size * 0.82, y + size * 0.22]], { fill: o.hull || '#5c3f2b', closed: true, alpha: a });
      s.line(x - size, y - size * 0.2, x + size * 1.05, y - size * 0.2, { color: '#8a6446', width: 2, alpha: a });
      if (o.steam) {
        s.rect(x - size * 0.6, y - size * 0.55, size * 1.2, size * 0.35, { fill: '#d8d4cb', alpha: a });
        s.rect(x - size * 0.1, y - size * 1.05, size * 0.22, size * 0.5, { fill: '#3b3b3b', alpha: a });
        s.rect(x - size * 0.1, y - size * 1.05, size * 0.22, size * 0.1, { fill: C.red, alpha: a });
        const t = s.clock;
        for (let i = 0; i < 4; i++) {
          const ph = (t * 0.6 + i / 4) % 1;
          s.circle(x + ph * size * 0.5, y - size * 1.1 - ph * size * 0.7, size * (0.08 + ph * 0.16), { fill: '#9aa0a8', alpha: (a ?? 1) * (1 - ph) * 0.5 });
        }
      } else {
        s.line(x, y - size * 0.2, x, y - size * 1.45, { color: '#6b4d36', width: 3, alpha: a });
        s.poly([[x + 4, y - size * 1.4], [x + 4, y - size * 0.32], [x + size * 0.8, y - size * 0.36]], { fill: '#ece5d1', closed: true, alpha: a });
        s.poly([[x - 4, y - size * 1.25], [x - 4, y - size * 0.32], [x - size * 0.7, y - size * 0.36]], { fill: '#d9d0b8', closed: true, alpha: a });
        s.poly([[x, y - size * 1.45], [x + size * 0.25, y - size * 1.38], [x, y - size * 1.31]], { fill: C.red, closed: true, alpha: a });
      }
    },

    canoe(s, x, y, size, o = {}) {
      const a = o.alpha;
      s.poly([[x - size, y - size * 0.1], [x + size, y - size * 0.1], [x + size * 0.7, y + size * 0.12], [x - size * 0.7, y + size * 0.12]], { fill: '#6e4b30', closed: true, alpha: a });
      s.line(x - size * 0.5, y - size * 0.1, x - size * 0.4, y - size * 0.45, { color: '#8a6446', width: 2, alpha: a });
      s.line(x + size * 0.5, y - size * 0.1, x + size * 0.4, y - size * 0.45, { color: '#8a6446', width: 2, alpha: a });
      s.line(x - size * 0.4, y - size * 0.45, x + size * 0.4, y - size * 0.45, { color: '#8a6446', width: 2, alpha: a });
      s.line(x - size * 0.2, y - size * 0.45, x - size * 0.25, y - size * 0.75, { color: '#8a6446', width: 1.5, alpha: a });
      s.line(x + size * 0.2, y - size * 0.45, x + size * 0.25, y - size * 0.75, { color: '#8a6446', width: 1.5, alpha: a });
      s.rect(x - size * 0.35, y - size * 0.8, size * 0.7, size * 0.07, { fill: '#7a5a3a', alpha: a });
    },

    shell(s, x, y, size, o = {}) {
      const ctx = s.ctx;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      ctx.translate(x, y);
      ctx.rotate(o.rot || 0);
      const rx = size * 0.55, ry = size * 0.4;
      const g = ctx.createRadialGradient(-rx * 0.3, -ry * 0.4, 1, 0, 0, rx);
      g.addColorStop(0, '#fbf6e9');
      g.addColorStop(1, '#c8b48c');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9d8a63';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = '#5b4a2e';
      ctx.lineWidth = Math.max(1, size * 0.05);
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const u = -0.42 + (i / 16) * 0.84;
        const px = u * rx * 2, py = Math.sin(i * 1.1) * size * 0.015;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.lineWidth = Math.max(0.8, size * 0.025);
      for (let i = 1; i < 9; i++) {
        const px = (-0.36 + (i / 9) * 0.72) * rx * 2;
        ctx.beginPath(); ctx.moveTo(px, -size * 0.07); ctx.lineTo(px, size * 0.07); ctx.stroke();
      }
      ctx.restore();
    },

    bead(s, x, y, r, o = {}) {
      const ctx = s.ctx, col = o.color || C.blue;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, mix(col, '#fff', 0.45));
      g.addColorStop(1, mix(col, '#000', 0.25));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (r > 5) {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = r * 0.16;
        ctx.beginPath(); ctx.arc(x, y, r * 0.62, -2.3, -0.9); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },

    pebble(s, x, y, r, o = {}) {
      const R = rng(o.seed || 1);
      const n = 11, pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = r * (0.82 + R() * 0.3);
        pts.push([x + Math.cos(a) * rr * 1.18, y + Math.sin(a) * rr * 0.82]);
      }
      const ctx = s.ctx;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n];
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p[0], p[1], mx, my);
      }
      const p0 = pts[0], q0 = pts[1];
      ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + q0[0]) / 2, (p0[1] + q0[1]) / 2);
      const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r * 1.3);
      g.addColorStop(0, o.light || '#a9abae');
      g.addColorStop(1, o.dark || '#55585e');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    },

    rai(s, x, y, r, o = {}) {
      const ctx = s.ctx;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 24; }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.moveTo(x + r * 0.23, y);
      ctx.arc(x, y, r * 0.23, 0, Math.PI * 2, true);
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.2, x, y, r);
      g.addColorStop(0, '#ddd2b6');
      g.addColorStop(1, '#a3957a');
      ctx.fillStyle = g;
      ctx.fill('evenodd');
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#7d7059';
      ctx.lineWidth = Math.max(1, r * 0.04);
      ctx.stroke();
      const R = rng(o.seed || 3);
      ctx.fillStyle = 'rgba(90,80,60,0.35)';
      for (let i = 0; i < Math.min(40, r * 0.9); i++) {
        const a = R() * Math.PI * 2, d = r * (0.3 + R() * 0.65);
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(0.6, r * 0.025), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },

    saltBar(s, x, y, w, o = {}) {
      const h = w * 0.3, ctx = s.ctx;
      ctx.save();
      ctx.globalAlpha *= (o.alpha ?? 1);
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x - w / 2 + h * 0.5, y - h / 2);
      ctx.lineTo(x + w / 2 - h * 0.5, y - h / 2);
      ctx.lineTo(x + w / 2, y);
      ctx.lineTo(x + w / 2 - h * 0.5, y + h / 2);
      ctx.lineTo(x - w / 2 + h * 0.5, y + h / 2);
      ctx.closePath();
      const g = ctx.createLinearGradient(x, y - h / 2, x, y + h / 2);
      g.addColorStop(0, '#fbf8f0');
      g.addColorStop(1, '#c8c0ad');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#a49b86';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(150,140,120,0.5)';
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + h * 0.5, y - h / 2); ctx.lineTo(x - w / 2 + h * 0.5, y + h / 2);
      ctx.moveTo(x + w / 2 - h * 0.5, y - h / 2); ctx.lineTo(x + w / 2 - h * 0.5, y + h / 2);
      ctx.stroke();
      ctx.restore();
    },

    note(s, x, y, w, o = {}) {
      const h = w * 0.5, col = o.color || C.money;
      s.rect(x - w / 2, y - h / 2, w, h, { fill: col, r: 3, alpha: o.alpha });
      s.rect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, { stroke: mix(col, '#000', 0.4), width: 1.2, r: 2, alpha: o.alpha });
      s.circle(x, y, h * 0.28, { stroke: mix(col, '#000', 0.45), width: 1.4, alpha: o.alpha });
      s.circle(x, y - h * 0.05, h * 0.09, { fill: mix(col, '#000', 0.35), alpha: o.alpha });
      s.text(o.value || '100', x - w / 2 + 6, y - h / 2 + h * 0.3, { size: h * 0.22, color: mix(col, '#000', 0.5), weight: 700, alpha: o.alpha });
      s.text(o.value || '100', x + w / 2 - 6, y + h / 2 - 6, { size: h * 0.22, color: mix(col, '#000', 0.5), weight: 700, align: 'right', alpha: o.alpha });
    },

    castle(s, x, y, size, o = {}) {
      const a = o.alpha, col = o.color || '#5d6472', st = mix(col, '#fff', 0.25);
      const w = size * 1.5, h = size * 0.62;
      const crenel = (x0, y0, ww, n) => {
        const cw = ww / (n * 2 - 1);
        for (let i = 0; i < n; i++) s.rect(x0 + i * 2 * cw, y0 - cw * 0.9, cw, cw * 0.9, { fill: col, alpha: a });
      };
      s.rect(x - w / 2, y - h, w, h, { fill: col, alpha: a });
      crenel(x - w / 2, y - h, w, 7);
      const tw = size * 0.5, th = size * 1.08;
      s.rect(x - tw / 2, y - th, tw, th, { fill: mix(col, '#fff', 0.08), alpha: a });
      crenel(x - tw / 2, y - th, tw, 3);
      s.rect(x - size * 0.13, y - size * 0.32, size * 0.26, size * 0.32, { fill: '#1b1e24', r: size * 0.12, alpha: a });
      s.rect(x - w / 2, y - h, w, h, { stroke: st, width: 1.2, alpha: (a ?? 1) * 0.6 });
    },

    bank(s, x, y, size, o = {}) {
      const a = o.alpha, col = o.color || C.silver;
      const w = size * 1.5;
      s.poly([[x - w / 2 - 6, y - size * 0.95], [x, y - size * 1.35], [x + w / 2 + 6, y - size * 0.95]], { fill: col, closed: true, alpha: a });
      s.rect(x - w / 2, y - size * 0.95, w, size * 0.1, { fill: mix(col, '#000', 0.15), alpha: a });
      for (let i = 0; i < 4; i++) {
        const cx = x - w / 2 + w * (0.14 + i * 0.24);
        s.rect(cx - size * 0.07, y - size * 0.85, size * 0.14, size * 0.72, { fill: mix(col, '#000', 0.05), alpha: a });
      }
      s.rect(x - w / 2 - 6, y - size * 0.13, w + 12, size * 0.13, { fill: mix(col, '#000', 0.2), alpha: a });
    },

    file(s, x, y, w, o = {}) {
      const h = w * 1.25, f = w * 0.28, col = o.color || C.ink2;
      s.poly([[x - w / 2, y - h / 2], [x + w / 2 - f, y - h / 2], [x + w / 2, y - h / 2 + f], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], { fill: rgba(col, 0.12), stroke: col, width: 2, closed: true, alpha: o.alpha });
      s.poly([[x + w / 2 - f, y - h / 2], [x + w / 2 - f, y - h / 2 + f], [x + w / 2, y - h / 2 + f]], { stroke: col, width: 2, alpha: o.alpha });
      if (o.label) s.text(o.label, x, y + 6, { size: w * 0.24, align: 'center', color: col, weight: 600, alpha: o.alpha });
    },

    check(s, x, y, size, o = {}) {
      s.poly([[x - size * 0.5, y], [x - size * 0.12, y + size * 0.38], [x + size * 0.55, y - size * 0.4]], { stroke: o.color || C.green, width: o.width || 4, alpha: o.alpha, progress: o.progress });
    },

    cross(s, x, y, size, o = {}) {
      const p = o.progress ?? 1;
      s.line(x - size * 0.4, y - size * 0.4, x + size * 0.4, y + size * 0.4, { color: o.color || C.red, width: o.width || 4, alpha: o.alpha, progress: clamp(p * 2) });
      s.line(x + size * 0.4, y - size * 0.4, x - size * 0.4, y + size * 0.4, { color: o.color || C.red, width: o.width || 4, alpha: o.alpha, progress: clamp(p * 2 - 1) });
    },

    bubble(s, x, y, w, h, o = {}) {
      s.rect(x - w / 2, y - h / 2, w, h, { fill: o.fill || '#1b2029', stroke: o.stroke || C.faint, width: 1.5, r: h / 2, alpha: o.alpha });
      if (o.tail) {
        const [tx, ty] = o.tail;
        s.circle(lerp(x, tx, 0.55), lerp(y + h / 2, ty, 0.55), 5, { fill: o.fill || '#1b2029', stroke: o.stroke || C.faint, width: 1.5, alpha: o.alpha });
        s.circle(lerp(x, tx, 0.85), lerp(y + h / 2, ty, 0.85), 3, { fill: o.fill || '#1b2029', stroke: o.stroke || C.faint, width: 1.5, alpha: o.alpha });
      }
    },

    bolt(s, x, y, size, o = {}) {
      s.poly([[x + size * 0.15, y - size * 0.5], [x - size * 0.25, y + size * 0.05], [x + size * 0.02, y + size * 0.05], [x - size * 0.15, y + size * 0.5], [x + size * 0.28, y - size * 0.08], [x + size * 0.02, y - size * 0.08]], { fill: o.color || C.yellow, closed: true, alpha: o.alpha });
    }
  };

  /* ---------- Registrierung & Einbindung ---------- */
  const registry = {};
  const Scenes = {
    define(name, def) { registry[name] = def; },
    get(name) { return registry[name]; }
  };

  function mountIn(root) {
    root.querySelectorAll('[data-scene]').forEach((host) => {
      if (host._stage) { host._stage.active = true; return; }
      const def = registry[host.dataset.scene];
      if (!def) { console.warn('Unbekannte Szene:', host.dataset.scene); return; }
      try {
        if (def.widget) {
          host._stage = { active: true };
          def.widget(host, host._stage);
          return;
        }
        host._stage = new Stage(host, def);
      } catch (err) {
        console.error('Szene «' + host.dataset.scene + '» konnte nicht geladen werden:', err);
        host._stage = { active: false };
      }
    });
  }

  function deactivate(root) {
    root.querySelectorAll('[data-scene]').forEach((host) => {
      if (host._stage) host._stage.active = false;
    });
  }

  window.Engine = { Stage, Scenes, C, U, I, el, mountIn, deactivate, SERIF, MONO };
})();
