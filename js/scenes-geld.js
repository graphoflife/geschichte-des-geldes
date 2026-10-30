/* scenes-geld.js – Animationen für Teil I und II (Geschichte des Geldes) */
(function () {
  'use strict';
  const { Scenes, C, U, I, Stage } = window.Engine;
  const { clamp, lerp, smooth, seg, sseg, easeOut, easeOutBack, mix, rgba, fmt, rng, pulse } = U;

  /* ======================================================================
     Prolog: Zeitstrahl der Geldformen mit «Härte»-Balken
     ====================================================================== */
  Scenes.define('title', {
    W: 960, H: 500, duration: 8.5,
    label: 'Neun Geldformen von Kieselsteinen bis Bitcoin, jeweils mit einem Balken, der zeigt, wie schwer es ist, mehr davon herzustellen.',
    draw(s, t) {
      const items = [
        { n: 'Kiesel', h: 0.03, c: '#9a9da2', d: () => I.pebble(s, 0, 0, 20, { seed: 4 }) },
        { n: 'Muscheln', h: 0.3, c: C.salt, d: () => I.shell(s, 0, 0, 44, { rot: -0.3 }) },
        { n: 'Glasperlen', h: 0.24, c: C.blue, d: () => { I.bead(s, -12, 6, 11, { color: C.blue }); I.bead(s, 11, -5, 11, { color: C.red }); I.bead(s, 8, 15, 8, { color: C.yellow }); } },
        { n: 'Rai-Steine', h: 0.55, c: C.sand, d: () => I.rai(s, 0, 0, 28) },
        { n: 'Salz', h: 0.34, c: C.salt, d: () => I.saltBar(s, 0, 0, 58) },
        { n: 'Silber', h: 0.7, c: C.silver, d: () => I.coin(s, 0, 0, 25, { color: C.silver, symbol: 'Ag' }) },
        { n: 'Gold', h: 0.88, c: C.coin, d: () => I.coin(s, 0, 0, 25, { color: C.coin, symbol: 'Au' }) },
        { n: 'Fiat', h: 0.05, c: C.money, d: () => I.note(s, 0, 0, 64) },
        { n: 'Bitcoin', h: 1.0, c: C.btc, d: () => I.btc(s, 0, 0, 26) }
      ];
      const x0 = 80, dx = (960 - 160) / (items.length - 1), base = 410, iconY = 125;
      s.text('Wie schwer ist es, mehr davon herzustellen?', 480, 54, { size: 30, align: 'center', italic: true, reveal: sseg(t, 0.2, 2.2) });
      s.line(40, base, 920, base, { color: C.faint, width: 2, progress: sseg(t, 0.3, 1.8) });
      items.forEach((it, i) => {
        const x = x0 + i * dx, t0 = 1.0 + i * 0.5;
        const a = seg(t, t0, t0 + 0.6);
        if (a <= 0) return;
        const bob = Math.sin(s.clock * 1.2 + i * 0.8) * 3;
        s.at(x, iconY + bob, easeOutBack(a), () => it.d());
        s.text(it.n, x, iconY + 64, { size: 19, align: 'center', color: C.ink2, alpha: a });
        const hb = sseg(t, t0 + 0.3, t0 + 1.4) * it.h * 185;
        if (hb > 0.5) {
          s.rect(x - 17, base - hb, 34, hb, { fill: rgba(it.c, 0.8), r: 3 });
          s.line(x - 17, base - hb, x + 17, base - hb, { color: mix(it.c, '#fff', 0.3), width: 2 });
        }
      });
      const fa = sseg(t, 6.6, 7.6);
      s.text('Härte', 40, base + 34, { size: 17, color: C.dim, alpha: fa, italic: true });
      s.text('Höhe der Balken: wie viel Aufwand es kostet, neue Einheiten zu erzeugen (qualitativ)', 480, 470, { size: 17, align: 'center', color: C.dim, alpha: fa });
    }
  });

  /* ======================================================================
     Kapitel 1: Doppelte Koinzidenz der Bedürfnisse
     ====================================================================== */
  Scenes.define('coincidence', {
    W: 960, H: 540, duration: 19,
    label: 'Fischerin, Schuster und Bäcker wollen tauschen, doch niemand hat, was der andere will – bis ein Gut auftaucht, das alle annehmen.',
    draw(s, t) {
      const A = { x: 170, y: 440, name: 'Fischerin', c: C.blue };
      const B = { x: 790, y: 440, name: 'Schuster', c: C.green };
      const K = { x: 480, y: 270, name: 'Bäcker', c: C.gold };
      const P = [A, B, K];
      const has = [t < 11.6 ? 'Fisch' : t < 14.2 ? 'Brot' : 'Schuhe', t < 14.2 ? 'Schuhe' : 'Brot', t < 11.6 ? 'Brot' : 'Fisch'];
      const wants = ['Schuhe', 'Brot', 'Fisch'];
      const salt = sseg(t, 15.2, 16.4);

      P.forEach((p, i) => {
        const a = sseg(t, 0.2 + i * 0.35, 0.9 + i * 0.35);
        const look = i === 0 ? 1 : i === 1 ? -1 : 0;
        I.person(s, p.x, p.y, 92, { color: p.c, alpha: a, look });
        s.text(p.name, p.x, p.y + 28, { size: 20, align: 'center', color: p.c, alpha: a, weight: 600 });
        const ha = sseg(t, 1.6 + i * 0.25, 2.2 + i * 0.25);
        s.text('hat: ' + has[i], p.x, p.y + 52, { size: 18, align: 'center', color: C.ink2, alpha: ha * (1 - salt * 0.6) });
        const wa = sseg(t, 2.8 + i * 0.3, 3.4 + i * 0.3) * (1 - salt);
        if (wa > 0) {
          const by = p.y - 140;
          I.bubble(s, p.x + 18, by, 146, 42, { tail: [p.x + 2, p.y - 102], alpha: wa });
          s.text('will: ' + wants[i], p.x + 18, by + 7, { size: 19, align: 'center', color: C.ink, alpha: wa, italic: true });
        }
      });

      // Versuch 1: Fisch gegen Schuhe → abgelehnt
      const a1 = sseg(t, 4.6, 5.8) * (1 - sseg(t, 8, 8.6));
      if (a1 > 0) {
        s.arrow(250, 395, 710, 395, { color: C.blue, width: 3, progress: sseg(t, 4.6, 5.8), alpha: a1 });
        s.text('Fisch gegen Schuhe?', 480, 380, { size: 19, align: 'center', color: C.blue, alpha: a1 });
        const r = sseg(t, 6.2, 6.8);
        I.cross(s, 862, 352, 30, { progress: r, alpha: a1 });
        s.text('«Ich will Brot.»', 800, 260, { size: 18, align: 'center', color: C.red, alpha: r * a1, italic: true });
      }
      // Versuch 2: Fisch gegen Brot → indirekter Tausch
      const a2 = sseg(t, 8.6, 9.6) * (1 - sseg(t, 11.4, 12));
      if (a2 > 0) {
        s.arrow(215, 365, 420, 290, { color: C.blue, width: 3, progress: sseg(t, 8.6, 9.6), alpha: a2 });
        s.arrow(430, 310, 225, 385, { color: C.gold, width: 3, progress: sseg(t, 9.8, 10.8), alpha: a2 });
        s.text('Fisch', 300, 312, { size: 18, color: C.blue, alpha: a2, align: 'center' });
        s.text('Brot', 340, 372, { size: 18, color: C.gold, alpha: a2, align: 'center' });
        I.check(s, 540, 200, 30, { progress: sseg(t, 9.8, 10.4), alpha: a2 });
      }
      // Versuch 3: Brot gegen Schuhe → klappt
      const a3 = sseg(t, 12, 13) * (1 - sseg(t, 14.4, 15));
      if (a3 > 0) {
        s.arrow(250, 395, 710, 395, { color: C.gold, width: 3, progress: sseg(t, 12, 13), alpha: a3 });
        s.arrow(710, 418, 250, 418, { color: C.green, width: 3, progress: sseg(t, 13, 13.8), alpha: a3 });
        s.text('Brot gegen Schuhe', 480, 380, { size: 19, align: 'center', color: C.gold, alpha: a3 });
        I.check(s, 862, 352, 30, { progress: sseg(t, 13.2, 13.8), alpha: a3 });
      }
      // Ein Gut, das alle annehmen
      if (salt > 0) {
        const cx = 480, cy = 418;
        P.forEach((p, i) => {
          const sx = p.x + (cx - p.x) * 0.18, sy = (p.y - 40) + (cy - (p.y - 40)) * 0.18;
          const ex = cx + (p.x - cx) * 0.2, ey = cy + (p.y - 40 - cy) * 0.2;
          s.line(sx, sy, ex, ey, { color: C.salt, width: 2.5, alpha: salt * 0.75, dash: [6, 6], dashOffset: -s.clock * 20 });
        });
        s.at(cx, cy, easeOutBack(salt), () => I.saltBar(s, 0, 0, 78));
        s.text('Salz', cx, cy + 40, { size: 19, align: 'center', color: C.salt, alpha: salt, weight: 600 });
      }

      s.captions(t, [
        [0.5, 4.2, 'Drei Menschen, drei Bedürfnisse.'],
        [4.6, 8.2, 'Die Fischerin will Schuhe – aber der Schuster will keinen Fisch.'],
        [8.6, 11.6, 'Indirekter Tausch: Sie nimmt Brot an – nicht zum Essen, sondern zum Weitertauschen.'],
        [12, 14.8, 'Ein Umweg, aber er funktioniert. Das Brot war ein Tauschmittel.'],
        [15.2, 19, 'Setzt sich ein Gut durch, das jeder gerne annimmt, braucht niemand mehr den perfekten Partner. Dieses Gut nennen wir Geld.']
      ], { top: 44 });
    }
  });

  /* ======================================================================
     Kapitel 1: Anzahl Tauschverhältnisse – mit und ohne Geld
     ====================================================================== */
  const GOODS = ['Fisch', 'Brot', 'Schuhe', 'Holz', 'Wolle', 'Salz', 'Eier', 'Milch', 'Äpfel', 'Töpfe', 'Seile', 'Messer', 'Honig', 'Wein', 'Käse', 'Leder', 'Kerzen', 'Stoff', 'Korn', 'Bier', 'Nägel', 'Körbe', 'Seife', 'Hüte', 'Pelze', 'Tee', 'Öl', 'Ziegel', 'Wachs', 'Teppiche'];

  Scenes.define('barter', {
    W: 960, H: 560,
    label: 'Ein Kreis von Gütern. Im Tauschhandel ist jedes Gut mit jedem verbunden, mit Geld nur noch mit der Münze in der Mitte.',
    setup(s) {
      const st = s.state;
      st.n = 8; st.mode = 0; st.target = 0; st.shown = 8;
      s.slider({ label: 'Anzahl Güter', min: 2, max: 30, value: 8, step: 1, onInput: (v) => { st.n = v; } });
      s.toggle(['Tauschhandel', 'Mit Geld'], 0, (i) => { st.target = i; });
    },
    update(s, dt) {
      const st = s.state;
      st.mode += (st.target - st.mode) * Math.min(1, dt * 3.5);
      st.shown += (st.n - st.shown) * Math.min(1, dt * 8);
    },
    draw(s) {
      const st = s.state, n = st.n, m = smooth(st.mode);
      const cx = 600, cy = 290, R = 205;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a), a]);
      }
      const pairs = (n * (n - 1)) / 2;
      const ea = clamp(22 / pairs, 0.14, 0.85) * (1 - m);
      if (ea > 0.005) {
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          s.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], { color: C.blue, width: 1.5, alpha: ea });
        }
      }
      if (m > 0.005) {
        pts.forEach(([x, y]) => s.line(x, y, lerp(x, cx, m * 0.88), lerp(y, cy, m * 0.88), { color: C.gold, width: 2, alpha: 0.85 * m }));
        s.at(cx, cy, easeOutBack(m), () => I.coin(s, 0, 0, 34, { symbol: '¤', glow: 18 }));
      }
      const fs = n <= 14 ? 19 : n <= 22 ? 16 : 0;
      pts.forEach(([x, y, a], i) => {
        s.circle(x, y, 8, { fill: C.bg, stroke: C.blue, width: 2.5 });
        if (fs) {
          const lx = cx + (R + 22) * Math.cos(a), ly = cy + (R + 22) * Math.sin(a) + fs * 0.35;
          const al = Math.abs(Math.cos(a)) < 0.2 ? 'center' : Math.cos(a) > 0 ? 'left' : 'right';
          s.text(GOODS[i], lx, ly + (Math.sin(a) > 0.95 ? 10 : Math.sin(a) < -0.95 ? -6 : 0), { size: fs, align: al, color: C.ink2 });
        }
      });
      // Zähler
      const nb = Math.round(pairs);
      s.text('Tauschhandel', 40, 80, { size: 20, color: C.blue, alpha: 1 - m * 0.55 });
      s.text(fmt(nb), 40, 140, { size: 56, color: C.blue, weight: 600, alpha: 1 - m * 0.55 });
      s.text('Tauschverhältnisse', 40, 168, { size: 18, color: C.dim, alpha: 1 - m * 0.55 });
      s.text('n·(n−1)/2', 40, 194, { size: 18, color: C.dim, italic: true, alpha: 1 - m * 0.55 });
      s.text('Mit Geld', 40, 300, { size: 20, color: C.gold, alpha: 0.45 + m * 0.55 });
      s.text(fmt(n), 40, 360, { size: 56, color: C.gold, weight: 600, alpha: 0.45 + m * 0.55 });
      s.text('Preise', 40, 388, { size: 18, color: C.dim, alpha: 0.45 + m * 0.55 });
      s.text('ein Preis pro Gut', 40, 414, { size: 18, color: C.dim, italic: true, alpha: 0.45 + m * 0.55 });
      if (n >= 6) s.text(`Faktor ${fmt(nb / n, 1)} einfacher`, 40, 500, { size: 18, color: C.ink2, alpha: m });
    }
  });

  /* ======================================================================
     Kapitel 2: Stock-to-Flow und die «Falle des leichten Geldes»
     ====================================================================== */
  const SF = [
    { n: 'Kieselsteine', f0: 0.25, e: 60, tau: 0.03, c: '#a4a7ac', who: 'Gewinner: wer schnell Kiesel sammelt. Der Preis fällt sofort zurück – wer gespart hat, hat nichts davon.' },
    { n: 'Salz', f0: 0.3, e: 4, tau: 0.5, c: C.salt, who: 'Gewinner: die Salzsieder. Nach wenigen Jahren ist der Preisvorteil weg.' },
    { n: 'Silber', f0: 0.05, e: 2.5, tau: 2, c: C.silver, who: 'Die Minen weiten die Förderung aus – der Preis sinkt über Jahre langsam zurück.' },
    { n: 'Gold', f0: 1 / 60, e: 1.5, tau: 3, c: C.gold, who: 'Gewinner: die Sparer. Selbst mehr Minen erhöhen den riesigen Bestand kaum.' },
    { n: 'Bitcoin', f0: 1 / 120, e: 0, tau: 1, c: C.btc, who: 'Gewinner: die Sparer. Mehr Aufwand erzeugt keine zusätzlichen Bitcoin (Kapitel 18).' }
  ];
  /* Modell: Bestand S wächst mit der Rate F (Anteil pro Jahr). Liegt der Preis über
     den Produktionskosten, weiten die Produzenten die Förderung aus – je nach Gut
     schnell (Kiesel) oder kaum (Gold) oder gar nicht (Bitcoin). Sb = Bestand ohne Schock. */
  function sfReset(st) { st.year = 0; st.S = 1; st.Sb = 1; st.F = SF[st.sel].f0; st.P = 1; st.hist = [[0, 1]]; }
  function sfStep(st, h) {
    const g = SF[st.sel];
    const D = st.year >= 2 ? 2 : 1;
    st.P = (D * st.Sb) / st.S;
    const Ft = g.f0 * (1 + g.e * Math.max(0, st.P - 1));
    st.F += (Ft - st.F) * Math.min(1, h / g.tau);
    st.S *= 1 + st.F * h;
    st.Sb *= 1 + g.f0 * h;
    st.year += h;
  }

  Scenes.define('stockflow', {
    W: 960, H: 520,
    label: 'Simulation: Nach einem Nachfrageschock steigt der Preis. Bei leicht herstellbarem Geld fällt er schnell zurück, bei hartem Geld bleibt er hoch.',
    setup(s) {
      const st = s.state;
      st.sel = 0;
      s.toggle(SF.map((g) => g.n), 0, (i) => { st.sel = i; sfReset(st); });
      s.button('↺ Nochmals', () => sfReset(st), 'accent');
      sfReset(st);
    },
    update(s, dt) {
      const st = s.state;
      if (st.year >= 30) return;
      let k = dt * 3;
      while (k > 1e-9) { const h = Math.min(0.004, k); sfStep(st, h); k -= h; }
      const lastY = st.hist[st.hist.length - 1][0];
      if (st.year - lastY >= 0.05 || st.year >= 30) st.hist.push([st.year, st.P]);
    },
    draw(s) {
      const st = s.state, g = SF[st.sel];
      // Lagertank
      const tx = 60, ty = 130, tw = 200, th = 300;
      s.text('Bestand', tx + tw / 2, 50, { size: 20, align: 'center', color: C.ink2 });
      s.text('(alle existierenden Einheiten)', tx + tw / 2, 74, { size: 15, align: 'center', color: C.dim, italic: true });
      const ratio = st.S / st.Sb;
      const lvl = clamp(ratio * 0.38, 0, 1) * th;
      const flowRel = st.F / 0.0167;
      const sw = clamp(2 + Math.sqrt(flowRel) * 2.2, 2, 46);
      s.rect(tx + tw / 2 - sw / 2, 96, sw, ty + th - lvl - 96, { fill: rgba(g.c, 0.55) });
      for (let i = 0; i < 6; i++) {
        const ph = (s.clock * 1.6 + i / 6) % 1;
        const yy = 96 + ph * (ty + th - lvl - 96);
        s.circle(tx + tw / 2 + Math.sin(i * 3.3) * sw * 0.3, yy, 2.2, { fill: mix(g.c, '#fff', 0.4), alpha: 0.8 });
      }
      s.rect(tx + tw / 2 - 26, 84, 52, 14, { fill: '#59606d', r: 3 });
      s.rect(tx, ty + th - lvl, tw, lvl, { fill: rgba(g.c, 0.45) });
      s.line(tx, ty + th - lvl, tx + tw, ty + th - lvl, { color: g.c, width: 2 });
      const base = ty + th - 0.38 * th;
      s.line(tx, base, tx + tw, base, { color: C.ink2, width: 1.2, dash: [5, 5], alpha: 0.6 });
      s.text('ohne Schock', tx + tw + 6, base + 5, { size: 13, color: C.dim });
      s.poly([[tx, ty], [tx, ty + th], [tx + tw, ty + th], [tx + tw, ty]], { stroke: C.ink2, width: 2.5 });
      s.text('Neuproduktion: ' + fmt(st.F * 100, st.F < 1 ? 1 : 0) + ' % pro Jahr', tx + tw / 2, ty + th + 34, { size: 17, align: 'center', color: g.c });
      s.text('Stock-to-Flow: ' + (st.F <= 1 ? fmt(1 / st.F, 0) : '< 1'), tx + tw / 2, ty + th + 58, { size: 15, align: 'center', color: C.dim });

      // Preisdiagramm
      const ax = { x: 380, y: 70, w: 530, h: 330 };
      ax.X = (v) => ax.x + (v / 30) * ax.w;
      ax.Y = (v) => ax.y + ax.h - (v / 2.5) * ax.h;
      s.text('Preis nach einem Nachfrageschock', ax.x, 40, { size: 20, color: C.ink2 });
      s.axes(ax, {
        xticks: [[0, '0'], [5, '5'], [10, '10'], [15, '15'], [20, '20'], [25, '25'], [30, '30 Jahre']],
        yticks: [[0, '0'], [1, '1×'], [2, '2×']], grid: true
      });
      s.line(ax.X(2), ax.y, ax.X(2), ax.y + ax.h, { color: C.yellow, width: 1.5, dash: [4, 5], alpha: 0.6 });
      s.text('Nachfrage ×2', ax.X(2) + 8, ax.y + 18, { size: 15, color: C.yellow });
      const pts = st.hist.map(([y, p]) => [ax.X(y), ax.Y(p)]);
      s.poly(pts, { stroke: g.c, width: 3.5, glow: 8 });
      const lastP = pts[pts.length - 1];
      if (lastP) s.circle(lastP[0], lastP[1], 5, { fill: g.c });
      s.text(g.n, ax.x + ax.w, ax.y + 18, { size: 22, align: 'right', color: g.c, weight: 600 });
      const wa = sseg(st.year, 14, 20);
      if (wa > 0) s.wrapText(g.who, ax.x + 16, ax.y + ax.h + 62, ax.w - 10, { size: 17, color: C.ink, italic: true, alpha: wa });
    }
  });

  /* ======================================================================
     Kapitel 3: Glasperlen – wer billiger produziert, holt sich die Güter
     ====================================================================== */
  Scenes.define('beads', {
    W: 960, H: 520, duration: 18,
    label: 'Ein westafrikanisches Dorf benutzt Glasperlen als Geld. Ein Schiff bringt massenhaft billige Perlen und fährt mit den Gütern des Dorfes davon.',
    setup(s) {
      const R = rng(11);
      const cols = [C.blue, C.red, C.yellow, C.teal, '#e9e1cf', C.purple];
      s.state.pile = Array.from({ length: 200 }, (_, i) => {
        const rr = 6.4 * Math.sqrt(i + 1);
        const th = 0.08 + R() * (Math.PI - 0.16);
        return [Math.cos(th) * rr * 1.3, -Math.sin(th) * rr * 0.55 - 5, cols[Math.floor(R() * cols.length)]];
      });
      s.state.goods = Array.from({ length: 12 }, (_, i) => ({
        x: 70 + (i % 6) * 34, y: 404 + Math.floor(i / 6) * 22, type: i % 3
      }));
    },
    draw(s, t) {
      const st = s.state;
      // Himmel/Land/Meer
      s.poly([[0, 380], [540, 380], [600, 396], [600, 520], [0, 520]], { fill: '#2a2119', closed: true });
      const sea = s.ctx.createLinearGradient(0, 370, 0, 520);
      sea.addColorStop(0, '#123247'); sea.addColorStop(1, '#0a1a26');
      s.ctx.fillStyle = sea; s.ctx.fillRect(560, 386, 400, 134);
      s.poly([[540, 380], [600, 396], [560, 396]], { fill: '#2a2119', closed: true });
      for (let k = 0; k < 4; k++) {
        const pts = [];
        for (let x = 600; x <= 960; x += 12) pts.push([x, 400 + k * 30 + Math.sin(x * 0.04 + s.clock * 1.5 + k) * 3]);
        s.poly(pts, { stroke: '#2b5a77', width: 1.5, alpha: 0.6 });
      }
      [110, 210, 300].forEach((x, i) => I.hut(s, x, 380, 70 + i * 4));

      // Schiff
      const shipX = t < 5 ? lerp(1100, 770, sseg(t, 1.8, 5)) : lerp(770, 1160, sseg(t, 14, 17.5));
      const bob = Math.sin(s.clock * 1.6) * 2.5;

      // Güter
      const leaving = 10;
      st.goods.forEach((gd, j) => {
        const start = 9.2 + j * 0.32;
        const p = j < leaving ? sseg(t, start, start + 1.1) : 0;
        let x = gd.x, y = gd.y;
        if (p >= 1) {
          x = shipX - 40 + (j % 5) * 18; y = 352 - Math.floor(j / 5) * 14 + bob;
        } else if (p > 0) {
          const ex = shipX - 40 + (j % 5) * 18, ey = 352 - Math.floor(j / 5) * 14;
          x = lerp(gd.x, ex, p); y = lerp(gd.y, ey, p) - Math.sin(Math.PI * p) * 120;
        }
        const col = [C.yellow, '#efe9da', '#b5651d'][gd.type];
        if (gd.type === 0) s.rect(x - 7, y - 6, 14, 12, { fill: col, r: 3, glow: 6 });
        else if (gd.type === 1) s.rect(x - 9, y - 4, 18, 8, { fill: col, r: 4 });
        else s.circle(x, y, 7, { fill: col });
      });
      I.ship(s, shipX, 372 + bob, 64, {});
      s.text('Händler', shipX, 470, { size: 16, align: 'center', color: C.dim, alpha: shipX < 960 ? 1 : 0 });

      // Perlenhaufen
      const N0 = 30, nIn = 150;
      let arrived = 0;
      for (let i = 0; i < nIn; i++) {
        const ts = 5.4 + i * 0.026;
        const p = seg(t, ts, ts + 0.9);
        if (p >= 1) { arrived++; continue; }
        if (p > 0) {
          const q = st.pile[N0 + i];
          const ex = 455 + q[0], ey = 380 + q[1];
          const x = lerp(shipX - 30, ex, p), y = lerp(340, ey, p) - Math.sin(Math.PI * p) * 90;
          I.bead(s, x, y, 5, { color: q[2] });
        }
      }
      const N = N0 + arrived;
      for (let i = 0; i < N; i++) {
        const q = st.pile[i];
        I.bead(s, 455 + q[0], 380 + q[1], 5, { color: q[2] });
      }

      // Anzeigen
      const kk = N0 / N;
      s.text('Kaufkraft einer Perle', 40, 46, { size: 18, color: C.ink2 });
      s.rect(40, 60, 240, 16, { fill: C.grid, r: 8 });
      s.rect(40, 60, 240 * kk, 16, { fill: mix(C.red, C.green, kk), r: 8 });
      s.text(fmt(kk * 100) + ' %', 290, 74, { size: 17, color: C.ink2 });
      s.text('Perlen im Dorf: ' + N, 40, 108, { size: 18, color: C.dim });
      let goodsLeft = 12;
      st.goods.forEach((gd, j) => { if (j < leaving && t > 9.2 + j * 0.32 + 0.55) goodsLeft--; });
      s.text('Güter im Dorf: ' + goodsLeft, 40, 134, { size: 18, color: C.dim });

      s.captions(t, [
        [0.3, 4.8, 'Glasperlen sind in Westafrika selten und aufwendig herzustellen – gutes Geld.'],
        [5.2, 9, 'Europäische Händler bringen Perlen, die in Venedig und Böhmen billig massenproduziert werden.'],
        [9.2, 13.6, 'Mit diesem «Geld» kaufen sie Gold, Elfenbein, Palmöl – und Menschen.'],
        [14, 18, 'Wer dein Geld billiger herstellen kann als du, bekommt deine Arbeit fast umsonst.']
      ], { top: 200 });
    }
  });

  /* ======================================================================
     Kapitel 4: Die Rai-Steine von Yap
     ====================================================================== */
  function islandBlob(s, x, y, r, seed, col) {
    const R = rng(seed), n = 14, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.7 + R() * 0.5);
      pts.push([x + Math.cos(a) * rr * 1.3, y + Math.sin(a) * rr * 0.8]);
    }
    s.poly(pts, { fill: '#d6c192', closed: true });
    s.poly(pts.map(([px, py]) => [x + (px - x) * 0.82, y + (py - y) * 0.78]), { fill: col || '#3f6b3a', closed: true });
  }

  function raiMap(s, t) {
    const g = s.ctx.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, '#0f2738'); g.addColorStop(1, '#0a1824');
    s.ctx.fillStyle = g; s.ctx.fillRect(0, 0, 960, 540);
    for (let k = 0; k < 10; k++) {
      const pts = [];
      for (let x = 0; x <= 960; x += 16) pts.push([x, 60 + k * 52 + Math.sin(x * 0.02 + s.clock * 0.8 + k * 1.7) * 4]);
      s.poly(pts, { stroke: '#1d4560', width: 1.2, alpha: 0.5 });
    }
    islandBlob(s, 230, 190, 58, 5);
    s.text('Yap', 230, 280, { size: 24, align: 'center', color: C.ink, weight: 600 });
    islandBlob(s, 760, 360, 24, 8);
    islandBlob(s, 800, 400, 18, 9);
    islandBlob(s, 735, 410, 14, 10);
    s.text('Palau', 790, 460, { size: 24, align: 'center', color: C.ink, weight: 600 });
    s.text('Kalksteinbrüche', 790, 486, { size: 16, align: 'center', color: C.dim, italic: true });
    const route = [];
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const x = (1 - u) * (1 - u) * 740 + 2 * (1 - u) * u * 520 + u * u * 290;
      const y = (1 - u) * (1 - u) * 370 + 2 * (1 - u) * u * 430 + u * u * 230;
      route.push([x, y]);
    }
    s.poly(route, { stroke: C.yellow, width: 2, dash: [8, 8], progress: sseg(t, 0.8, 2.6), alpha: 0.8 });
    s.text('≈ 400 km offenes Meer', 470, 450, { size: 19, align: 'center', color: C.yellow, alpha: sseg(t, 2, 2.8), italic: true });
    const u = sseg(t, 2.6, 6.6);
    if (t > 2.4) {
      const [cx, cy] = Stage.pointAt(route, u);
      const bob = Math.sin(s.clock * 2.2) * 3;
      I.canoe(s, cx, cy + bob, 34);
      I.rai(s, cx, cy - 34 + bob, 17, { seed: 2 });
    }
  }

  const RAI = [
    { x: 160, r: 52, from: 'Familie A' },
    { x: 400, r: 98, from: 'Familie A', to: 'Familie C' },
    { x: 640, r: 40, from: 'Familie B' },
    { x: 820, r: 64, from: 'Familie D' }
  ];

  function ground(s, y, col) {
    s.rect(0, y, 960, 540 - y, { fill: col || '#231c15' });
    s.line(0, y, 960, y, { color: '#4a3b2a', width: 2 });
  }

  function tag(s, x, y, str, o = {}) {
    const w = s.measure(str, 16, { weight: 600 }) + 22;
    s.rect(x - w / 2, y - 16, w, 26, { fill: o.fill || '#1b2029', stroke: o.stroke || C.faint, width: 1.5, r: 13, alpha: o.alpha, glow: o.glow });
    s.text(str, x, y + 2, { size: 16, align: 'center', color: o.color || C.ink, weight: 600, alpha: o.alpha });
  }

  function raiVillage(s, t) {
    ground(s, 410);
    const flash = pulse(t, 9.6, 11);
    RAI.forEach((r, i) => {
      I.rai(s, r.x, 410 - r.r, r.r, { seed: 20 + i, glow: r.to && t > 9.6 ? rgba(C.yellow, flash) : null });
      const ty = 410 - 2 * r.r - 24;
      if (r.to) {
        const p = sseg(t, 10, 10.8);
        tag(s, r.x, ty, 'gehört: ' + r.from, { alpha: 1 - p });
        tag(s, r.x, ty, 'gehört: ' + r.to, { alpha: p, stroke: C.yellow, color: C.yellow });
      } else tag(s, r.x, ty, 'gehört: ' + r.from);
    });
    s.text('Familie A bezahlt Familie C', 400, 150, { size: 18, align: 'center', color: C.yellow, italic: true, alpha: sseg(t, 9.4, 10) * (1 - sseg(t, 13.4, 14)) });
    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 120, y = 515;
      I.person(s, x, y, 52, { color: [C.blue, C.green, C.teal, C.purple, C.gold, C.maroon, C.blueD][i] });
      const a = sseg(t, 11.2 + i * 0.18, 11.6 + i * 0.18) * (1 - sseg(t, 14, 14.5));
      if (a > 0) { s.circle(x + 22, y - 62, 13, { fill: '#1b2029', stroke: C.green, width: 1.5, alpha: a }); I.check(s, x + 22, y - 62, 14, { width: 2.5, alpha: a }); }
    }
  }

  function raiSea(s, tt) {
    const g = s.ctx.createLinearGradient(0, 180, 0, 540);
    g.addColorStop(0, '#16405a'); g.addColorStop(1, '#071621');
    s.ctx.fillStyle = g; s.ctx.fillRect(0, 180, 960, 360);
    const surf = [];
    for (let x = 0; x <= 960; x += 12) surf.push([x, 180 + Math.sin(x * 0.03 + s.clock * 1.4) * 3]);
    s.poly(surf, { stroke: '#4d8fb3', width: 2 });
    s.poly([[0, 500], [200, 490], [500, 498], [760, 486], [960, 496], [960, 540], [0, 540]], { fill: '#3b3424', closed: true });
    const bob = Math.sin(s.clock * 1.8) * 3;
    const cx = lerp(480, 300, sseg(tt, 3, 6));
    I.canoe(s, cx, 176 + bob, 46);
    const r = 46;
    const fall = sseg(tt, 1.0, 4.2);
    const sx = 480, sy = lerp(176 - 46 - r * 0.2 + bob, 498 - r, fall);
    for (let i = 0; i < 10; i++) {
      const ph = (s.clock * 0.7 + i / 10) % 1;
      if (tt > 1.2) s.circle(sx + Math.sin(i * 7 + s.clock) * 26, sy - ph * (sy - 190), 2 + (i % 3), { stroke: '#8cc7e6', width: 1.2, alpha: (1 - ph) * 0.6 * (1 - sseg(tt, 5, 6.5)) });
    }
    const glow = tt > 4.2 ? rgba(C.yellow, 0.4 + 0.3 * Math.sin(s.clock * 3)) : null;
    I.rai(s, sx, sy, r, { seed: 41, glow });
    tag(s, sx, sy - r - 26, 'gehört: Familie E', { stroke: tt > 4.2 ? C.yellow : C.faint, color: tt > 4.2 ? C.yellow : C.ink, alpha: sseg(tt, 1.8, 2.4) });
  }

  function raiOKeefe(s, tt) {
    s.rect(0, 0, 960, 540, { fill: '#0b0f14' });
    s.rect(640, 400, 320, 140, { fill: '#0e2433' });
    ground(s, 400);
    s.rect(640, 401, 320, 139, { fill: '#0e2433' });
    for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let x = 640; x <= 960; x += 12) pts.push([x, 420 + k * 34 + Math.sin(x * 0.04 + s.clock * 1.5 + k) * 3]);
      s.poly(pts, { stroke: '#2b5a77', width: 1.4, alpha: 0.6 });
    }
    const bob = Math.sin(s.clock * 1.4) * 2;
    const shipX = lerp(1080, 820, sseg(tt, 0, 1.6));
    I.ship(s, shipX, 410 + bob, 80, { steam: true, hull: '#2f3540' });
    s.text('O’Keefes Schiff', shipX, 500, { size: 16, align: 'center', color: C.dim });
    const R = rng(77);
    const base = [[90, 34], [230, 50], [360, 28], [470, 44], [560, 30], [300, 22]];
    base.forEach(([x, r], i) => I.rai(s, x, 400 - r, r, { seed: 50 + i }));
    let n = base.length;
    const total = 60;
    for (let i = 0; i < total; i++) {
      const ts = 1.8 + i * 0.07;
      const p = seg(tt, ts, ts + 0.8);
      const x = 60 + R() * 540, r = 10 + R() * 18, lift = R() * 50;
      if (p <= 0) continue;
      const tx = x, ty = 400 - r - lift * 0.5;
      const px = lerp(shipX - 30, tx, p), py = lerp(360, ty, p) - Math.sin(Math.PI * p) * 140;
      I.rai(s, px, py, r, { seed: 100 + i });
      if (p >= 1) n++;
    }
    const v = base.length / n;
    s.text('Steine auf Yap: ' + n, 40, 140, { size: 20, color: C.ink2 });
    s.text('Wert pro Stein', 40, 176, { size: 18, color: C.ink2 });
    s.rect(40, 188, 260, 16, { fill: C.grid, r: 8 });
    s.rect(40, 188, 260 * v, 16, { fill: mix(C.red, C.green, v), r: 8 });
  }

  Scenes.define('rai', {
    W: 960, H: 540, duration: 30,
    label: 'Rai-Steine werden von Palau nach Yap gebracht, Eigentum wechselt ohne Bewegung des Steins, ein Stein sinkt und bleibt Geld, schliesslich flutet O’Keefe die Insel mit Steinen.',
    draw(s, t) {
      const p1 = 1 - sseg(t, 7, 8);
      const p2 = sseg(t, 7.5, 8.5) * (1 - sseg(t, 14.6, 15.4));
      const p3 = sseg(t, 15, 16) * (1 - sseg(t, 21.6, 22.4));
      const p4 = sseg(t, 22, 23);
      if (p1 > 0) s.alpha(p1, () => raiMap(s, t));
      if (p2 > 0) s.alpha(p2, () => raiVillage(s, t));
      if (p3 > 0) s.alpha(p3, () => raiSea(s, t - 15));
      if (p4 > 0) s.alpha(p4, () => raiOKeefe(s, t - 22));
      s.captions(t, [
        [0.3, 6.8, 'Auf Palau gebrochen, mit Kanus 400 km übers Meer gebracht: Monate Arbeit, oft lebensgefährlich.'],
        [8, 11, 'Grosse Steine bewegt niemand mehr. Wenn Familie A bezahlt …'],
        [11, 14.6, '… ändert sich nur das gemeinsame Wissen, wem der Stein gehört. Ein Hauptbuch in den Köpfen aller.'],
        [15.6, 21.6, 'Ein Stein versinkt im Sturm. Alle wissen, dass es ihn gibt – also bleibt er Geld.'],
        [22.6, 30, '1871: Mit Dampfschiff und Eisenwerkzeug bringt David O’Keefe Steine in Massen. Ihr Wert zerfällt.']
      ], { top: 40 });
    }
  });

  /* ======================================================================
     Radar-Diagramm: Eigenschaften verschiedener Geldformen
     ====================================================================== */
  function radarScene(cfg) {
    const n = cfg.axes.length;
    return {
      W: 960, H: 560,
      label: cfg.label,
      setup(s) {
        const st = s.state;
        st.sel = 0;
        st.auto = !cfg.overlay;
        st.timer = 0;
        st.vals = cfg.items[0].v.slice();
        st.rgb = U.hexToRgb(cfg.items[0].c);
        st.show = cfg.items.map((_, i) => (cfg.overlay ? 0 : i === 0 ? 1 : 0));
        const names = cfg.items.map((i) => i.name);
        if (cfg.overlay) names.push('Alle');
        st.tg = s.toggle(names, cfg.overlay ? names.length - 1 : 0, (i) => { st.sel = i; st.auto = false; });
        if (cfg.overlay) st.sel = names.length - 1;
      },
      update(s, dt) {
        const st = s.state;
        if (st.auto) {
          st.timer += dt;
          if (st.timer > 3.4) { st.timer = 0; st.sel = (st.sel + 1) % cfg.items.length; st.tg.set(st.sel); }
        }
        const k = 1 - Math.exp(-dt * 5);
        if (cfg.overlay) {
          const all = st.sel === cfg.items.length;
          st.show = st.show.map((v, i) => v + (((all || st.sel === i) ? 1 : 0) - v) * k);
        } else {
          const target = cfg.items[st.sel];
          st.vals = st.vals.map((v, i) => v + (target.v[i] - v) * k);
          const trgb = U.hexToRgb(target.c);
          st.rgb = st.rgb.map((v, i) => v + (trgb[i] - v) * k);
        }
      },
      draw(s) {
        const st = s.state;
        const cx = 320, cy = 295, R = 180;
        const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
        [0.25, 0.5, 0.75, 1].forEach((f) => {
          const pts = [];
          for (let i = 0; i < n; i++) pts.push([cx + Math.cos(ang(i)) * R * f, cy + Math.sin(ang(i)) * R * f]);
          s.poly(pts, { stroke: C.grid, width: f === 1 ? 1.8 : 1.2, closed: true });
        });
        cfg.axes.forEach((name, i) => {
          const a = ang(i);
          s.line(cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R, { color: C.grid, width: 1.2 });
          const lx = cx + Math.cos(a) * (R + 22), ly = cy + Math.sin(a) * (R + 22) + 6;
          const al = Math.abs(Math.cos(a)) < 0.25 ? 'center' : Math.cos(a) > 0 ? 'left' : 'right';
          s.text(name, lx, ly + (Math.sin(a) < -0.9 ? -6 : Math.sin(a) > 0.9 ? 10 : 0), { size: 16, align: al, color: C.ink2 });
        });
        const shape = (vals, col, alpha) => {
          const pts = vals.map((v, i) => [cx + Math.cos(ang(i)) * R * (v / 10), cy + Math.sin(ang(i)) * R * (v / 10)]);
          s.poly(pts, { fill: rgba(col, 0.2 * alpha), closed: true });
          s.poly(pts, { stroke: col, width: 3, closed: true, alpha, glow: 6 });
          pts.forEach(([x, y]) => s.circle(x, y, 4, { fill: col, alpha }));
        };
        if (cfg.overlay) {
          cfg.items.forEach((it, i) => { if (st.show[i] > 0.01) shape(it.v.map((v) => v * (0.3 + 0.7 * st.show[i])), it.c, st.show[i]); });
          let y = 130;
          cfg.items.forEach((it, i) => {
            const a = 0.35 + 0.65 * st.show[i];
            s.circle(626, y - 7, 8, { fill: it.c, alpha: a });
            s.text(it.name, 644, y, { size: 26, color: it.c, weight: 600, alpha: a });
            s.wrapText(it.note, 644, y + 28, 290, { size: 16, color: C.ink2, alpha: a });
            y += 120;
          });
        } else {
          const col = '#' + st.rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
          shape(st.vals, col, 1);
          const it = cfg.items[st.sel];
          s.text(it.name, 620, 150, { size: 40, color: it.c, weight: 600 });
          s.wrapText(it.note, 620, 196, 310, { size: 18, color: C.ink2, lineHeight: 1.45 });
        }
        s.text(cfg.footnote || 'Qualitative Einschätzung, 0 = schlecht, 10 = hervorragend', 480, 545, { size: 14, align: 'center', color: C.dim, italic: true });
      }
    };
  }
  window.Engine.radarScene = radarScene;

  Scenes.define('radar-waren', radarScene({
    label: 'Radar-Diagramm, das Kieselsteine, Muscheln, Rai-Steine, Salz, Vieh, Silber und Gold nach sechs Geldeigenschaften vergleicht.',
    axes: ['Knappheit', 'Haltbarkeit', 'Teilbarkeit', 'Transport', 'Prüfbarkeit', 'Einheitlichkeit'],
    items: [
      { name: 'Kieselsteine', c: '#a4a7ac', v: [0.3, 10, 3, 6, 9, 2], note: 'Haltbar und leicht zu erkennen – aber jeder kann sie ohne Aufwand sammeln. Null Knappheit.' },
      { name: 'Muscheln', c: C.salt, v: [4.5, 8, 6, 7, 7, 6], note: 'Handlich, zählbar, schwer zu fälschen. Knapp nur, solange niemand billigere Bezugsquellen findet.' },
      { name: 'Rai-Steine', c: C.sand, v: [7, 10, 1, 1, 7, 1], note: 'Sehr aufwendig herzustellen und ewig haltbar. Aber unteilbar und kaum zu bewegen – gelöst durch ein Hauptbuch im Kopf.' },
      { name: 'Salz', c: '#f3efe4', v: [3.5, 4, 9, 4, 6, 6], note: 'Lebenswichtig und gut teilbar. Aber schwer, feuchtigkeitsempfindlich und mit Industrie leicht herzustellen.' },
      { name: 'Vieh', c: C.brown, v: [5, 3, 1, 5, 6, 2], note: 'Läuft von selbst zum Markt und vermehrt sich. Aber man kann keine halbe Kuh bezahlen, und jede Kuh ist anders.' },
      { name: 'Silber', c: C.silver, v: [7, 8, 8, 6, 7, 9], note: 'Haltbar, teilbar, einheitlich – ideal für kleine Zahlungen. Wird jedoch industriell verbraucht und häufiger gefördert.' },
      { name: 'Gold', c: C.gold, v: [9, 10, 7, 7, 6, 9], note: 'Praktisch unzerstörbar, riesiger Bestand im Verhältnis zur Förderung. Die härteste Ware der Geschichte.' }
    ]
  }));

  /* ======================================================================
     Kapitel 6: Der römische Denar wird verwässert
     ====================================================================== */
  const DEN = [[14, 95, 'Augustus', 0, -14, 'center'], [64, 93, 'Nero', 0, -14, 'center'], [117, 85, 'Trajan', 0, -14, 'center'], [180, 75, 'Mark Aurel', 0, -14, 'center'], [211, 50, 'Septimius Severus', 12, 5, 'left'], [268, 5, 'Gallienus', -10, -16, 'right'], [270, 2, 'Claudius II.', 12, 8, 'left']];
  Scenes.define('denarius', {
    W: 960, H: 500, duration: 11,
    label: 'Diagramm: Der Silbergehalt des römischen Denars sinkt von rund 95 Prozent unter Augustus auf etwa 2 Prozent um 270 nach Christus.',
    draw(s, t) {
      const ax = { x: 90, y: 60, w: 560, h: 340 };
      ax.X = (v) => ax.x + (v / 300) * ax.w;
      ax.Y = (v) => ax.y + ax.h - (v / 100) * ax.h;
      const a0 = sseg(t, 0, 1);
      s.axes(ax, { alpha: a0, xticks: [[0, '0'], [100, '100'], [200, '200'], [300, '300 n. Chr.']], yticks: [[0, '0 %'], [25, '25 %'], [50, '50 %'], [75, '75 %'], [100, '100 %']], grid: true });
      s.text('Silbergehalt des Denars', ax.x, 36, { size: 20, color: C.ink2, alpha: a0 });
      const pts = DEN.map(([y, v]) => [ax.X(y), ax.Y(v)]);
      const p = sseg(t, 1.2, 7.5);
      s.poly(pts, { stroke: C.silver, width: 3.5, progress: p, glow: 6 });
      const head = Stage.pointAt(pts, p);
      const L = Stage.lengths(pts), tot = L[L.length - 1];
      DEN.forEach(([y, v, name, dx, dy, al], i) => {
        if (L[i] / tot <= p + 1e-6) {
          s.circle(ax.X(y), ax.Y(v), 5, { fill: C.silver });
          s.text(name, ax.X(y) + dx, ax.Y(v) + dy, { size: 15, align: al, color: C.ink2 });
        }
      });
      const curV = 100 - ((head[1] - ax.y) / ax.h) * 100;
      if (p > 0) s.circle(head[0], head[1], 6, { fill: C.yellow, glow: 12 });
      const cx = 810, cy = 230;
      const col = mix(C.copper, C.silver, clamp(curV / 100));
      I.coin(s, cx, cy, 92, { color: col, alpha: a0 });
      s.text(fmt(Math.max(0, curV)) + ' %', cx, cy + 10, { size: 34, align: 'center', color: mix(col, '#000', 0.6), weight: 700, alpha: a0 });
      s.text('Silber', cx, cy + 40, { size: 17, align: 'center', color: mix(col, '#000', 0.55), alpha: a0 });
      s.text('Rest: Kupfer', cx, cy + 128, { size: 16, align: 'center', color: C.dim, alpha: a0 });
      s.captions(t, [[7.8, 11, 'In gut 250 Jahren fiel der Silbergehalt von rund 95 % auf wenige Prozent.']], { y: 478 });
      s.text('Näherungswerte nach numismatischen Analysen', 650, 446, { size: 13, align: 'right', color: C.faint, alpha: a0 });
    }
  });

  /* ======================================================================
     Kapitel 6: Alles Gold der Welt als Würfel
     ====================================================================== */
  function isoBox(s, ox, oy, a, b, h, col, o = {}) {
    const c = 0.866, sn = 0.5;
    const P = (x, y, z) => [ox + (x - y) * c, oy + (x + y) * sn - z];
    const top = [P(0, 0, h), P(a, 0, h), P(a, b, h), P(0, b, h)];
    const right = [P(a, 0, 0), P(a, b, 0), P(a, b, h), P(a, 0, h)];
    const left = [P(0, b, 0), P(a, b, 0), P(a, b, h), P(0, b, h)];
    s.poly(right, { fill: mix(col, '#000', 0.32), closed: true, alpha: o.alpha });
    s.poly(left, { fill: mix(col, '#000', 0.12), closed: true, alpha: o.alpha });
    s.poly(top, { fill: mix(col, '#fff', 0.18), closed: true, alpha: o.alpha });
    if (o.glow) {
      s.poly(top, { stroke: mix(col, '#fff', 0.5), width: 1.5, closed: true, alpha: o.alpha, glow: o.glow });
      s.poly(left, { stroke: mix(col, '#fff', 0.5), width: 1.5, closed: true, alpha: o.alpha, glow: o.glow });
    }
    return P;
  }

  Scenes.define('goldcube', {
    W: 960, H: 540, duration: 13,
    label: 'Alles je geförderte Gold als Würfel mit etwa 22 Metern Kantenlänge, daneben ein Mensch. Die Jahresförderung ist nur eine dünne Schicht obendrauf.',
    draw(s, t) {
      const E = 176, ox = 320, oy = 300;
      const grow = sseg(t, 0.3, 2.6);
      const F = (x, y) => [ox + (x - y) * 0.866, oy + (x + y) * 0.5];
      s.poly([F(-30, -30), F(E + 90, -30), F(E + 90, E + 40), F(-30, E + 40)], { fill: '#12161c', closed: true, alpha: sseg(t, 0, 0.8) });
      const P = isoBox(s, ox, oy, E, E, E * grow, C.gold);
      if (grow > 0.98) {
        const [x1, y1] = P(E, 0, 0), [x2, y2] = P(E, E, 0);
        s.line(x1 + 10, y1 + 6, x2 + 10, y2 + 6, { color: C.ink2, width: 1.2, alpha: sseg(t, 2.6, 3.2) });
        s.text('≈ 22 m', (x1 + x2) / 2 + 30, (y1 + y2) / 2 + 26, { size: 17, color: C.ink2, alpha: sseg(t, 2.6, 3.2) });
      }
      s.text('Alles je geförderte Gold', 40, 50, { size: 24, color: C.gold, weight: 600, alpha: sseg(t, 0.5, 1.5) });
      s.text('≈ 216’000 Tonnen (Stand 2024)', 40, 80, { size: 18, color: C.ink2, alpha: sseg(t, 0.8, 1.8) });

      const pa = sseg(t, 3, 3.8);
      if (pa > 0) {
        const [px, py] = P(E + 18, E * 0.55, 0);
        I.person(s, px, py, 14.4, { color: C.blue, alpha: pa, eyes: false });
        s.line(px + 6, py - 16, px + 60, py - 70, { color: C.blue, width: 1.2, alpha: pa });
        s.text('Mensch, 1.8 m', px + 64, py - 74, { size: 16, color: C.blue, alpha: pa });
      }
      const slabZ = lerp(E + 150, E, sseg(t, 4.6, 6.8));
      const sa = sseg(t, 4.4, 5);
      if (sa > 0) {
        isoBox(s, ox, oy - slabZ, E, E, 2.9, C.yellow, { alpha: sa, glow: 14 });
        const [lx, ly] = P(0, E, slabZ);
        const la = sa * sseg(t, 6.6, 7.2);
        s.line(lx - 4, ly, 110, 140, { color: C.yellow, width: 1.2, alpha: la });
        s.text('Ein Jahr Bergbau:', 40, 110, { size: 18, color: C.yellow, alpha: la, weight: 600 });
        s.text('≈ 3’600 t – eine Schicht von 37 cm', 40, 132, { size: 16, color: C.ink2, alpha: la });
      }

      const ba = sseg(t, 8, 8.8);
      if (ba > 0) {
        const bx = 600, by = 150;
        s.text('Bestand ÷ Jahresproduktion', bx, by - 34, { size: 20, color: C.ink, alpha: ba, weight: 600 });
        s.text('(Stock-to-Flow-Verhältnis)', bx, by - 10, { size: 16, color: C.dim, alpha: ba, italic: true });
        const rows = [['Kupfer, Öl, Weizen', 0.6, '< 1', '#b87333'], ['Gold', 60, '≈ 60', C.gold], ['Bitcoin (ab 2024)', 120, '≈ 120', C.btc]];
        rows.forEach(([name, v, lab, col], i) => {
          const y = by + 40 + i * 78;
          const g = sseg(t, 8.6 + i * 0.7, 9.8 + i * 0.7);
          s.text(name, bx, y, { size: 17, color: C.ink2, alpha: ba });
          s.rect(bx, y + 10, Math.max(2, (v / 120) * 300 * g), 22, { fill: col, r: 4, alpha: ba });
          s.text(lab, bx + Math.max(2, (v / 120) * 300 * g) + 10, y + 28, { size: 17, color: col, alpha: g, weight: 600 });
        });
      }
      s.captions(t, [[10.8, 13, 'Selbst wenn alle Minen doppelt so viel fördern, wächst der Bestand nur um gut 3 % pro Jahr.']], { y: 516 });
    }
  });

  /* ======================================================================
     Kapitel 7: Teilreserve und Bank Run
     ====================================================================== */
  Scenes.define('bankrun', {
    W: 960, H: 520, duration: 21,
    label: 'Ein Tresor mit zehn Goldbarren, dazu werden dreissig Quittungen ausgegeben. Beim Bank Run bekommen nur die ersten zehn ihr Gold.',
    setup(s) {
      const R = rng(5);
      const order = Array.from({ length: 30 }, (_, i) => i);
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      s.state.rank = []; order.forEach((idx, k) => { s.state.rank[idx] = k; });
    },
    draw(s, t) {
      const st = s.state;
      const vx = 70, vy = 150, vw = 300, vh = 270;
      s.rect(vx, vy, vw, vh, { fill: '#12161c', stroke: '#59606d', width: 6, r: 10 });
      s.text('Tresor', vx + vw / 2, vy - 16, { size: 20, align: 'center', color: C.ink2 });
      const barPos = (i) => [vx + 55 + (i % 5) * 48, vy + vh - 40 - Math.floor(i / 5) * 34];
      const recPos = (i) => [440 + (i % 6) * 82, 150 + Math.floor(i / 6) * 60];
      let gold = 0, receipts = 0;
      for (let i = 0; i < 10; i++) {
        const tin = 0.6 + i * 0.4;
        const a = sseg(t, tin, tin + 0.4);
        // Barren i geht beim Run an die Quittung mit Rang i
        const servedBy = st.rank.indexOf(i);
        const tr = 13 + i * 0.24;
        const out = sseg(t, tr, tr + 0.5);
        if (a > 0 && out < 1) {
          const [bx, by] = barPos(i);
          const [rx, ry] = recPos(servedBy);
          I.goldBar(s, lerp(bx, rx, out), lerp(by, ry, out) - Math.sin(Math.PI * out) * 60, 40, { alpha: a * (1 - out * 0.6) });
        }
        if (t > tin + 0.2) gold++;
        if (t > tr + 0.5) gold--;
      }
      for (let i = 0; i < 30; i++) {
        const tin = i < 10 ? 0.8 + i * 0.4 : 5.6 + (i - 10) * 0.2;
        const a = sseg(t, tin, tin + 0.35);
        if (a <= 0) continue;
        receipts++;
        let [x, y] = recPos(i);
        if (t > 10.6 && t < 13) { x += Math.sin(s.clock * 40 + i) * 1.6 * pulse(t, 10.6, 13); }
        const k = st.rank[i];
        const tr = 13 + k * 0.24;
        const res = sseg(t, tr, tr + 0.5);
        s.rect(x - 32, y - 20, 64, 40, { fill: i < 10 ? C.paper : '#e6dcbc', r: 3, alpha: a * (1 - res * 0.45) });
        s.line(x - 22, y - 6, x + 20, y - 6, { color: '#9a8f72', width: 1.5, alpha: a });
        s.line(x - 22, y + 4, x + 12, y + 4, { color: '#9a8f72', width: 1.5, alpha: a });
        s.text('1 oz', x + 26, y + 15, { size: 11, align: 'right', color: '#7a6f52', alpha: a });
        if (res > 0) {
          if (k < 10) I.check(s, x, y, 26, { progress: res, width: 4 });
          else I.cross(s, x, y, 26, { progress: res, width: 4 });
        }
      }
      const cover = receipts ? (gold / receipts) * 100 : 0;
      s.text('Gold im Tresor: ' + gold, 70, 470, { size: 20, color: C.gold });
      s.text('Quittungen im Umlauf: ' + receipts, 440, 470, { size: 20, color: C.paper });
      if (t > 5.6 && t < 13) s.text('Deckung: ' + fmt(cover) + ' %', 440, 500, { size: 18, color: cover < 50 ? C.red : C.green });
      if (t > 10.6 && t < 13.2) s.text('Gerücht: «Die Bank hat nicht genug Gold!»', 480, 120, { size: 20, align: 'center', color: C.red, italic: true, alpha: pulse(t, 10.6, 13.2) });
      s.captions(t, [
        [0.4, 5.2, 'Kunden bringen Gold und erhalten Quittungen. Jede Quittung ist gedeckt.'],
        [5.6, 10.4, 'Selten holen alle gleichzeitig ab. Also verleiht der Bankier Quittungen ohne Gold: Teilreserve.'],
        [13, 21, 'Bank Run: Die ersten zehn bekommen ihr Gold. Alle anderen gehen leer aus.']
      ], { top: 44 });
    }
  });

  /* ======================================================================
     Kapitel 7: Telegraf gegen Goldschiff
     ====================================================================== */
  Scenes.define('telegraph', {
    W: 960, H: 480, duration: 13,
    label: 'Zwei Bahnen über den Atlantik: Telegrafensignale flitzen in Sekunden hin und her, während ein Schiff mit Gold zehn Tage braucht.',
    draw(s, t) {
      const L = 140, Rr = 820;
      s.text('New York', L - 20, 70, { size: 22, color: C.ink, weight: 600, align: 'right' });
      s.text('London', Rr + 20, 70, { size: 22, color: C.ink, weight: 600 });
      s.circle(L, 64, 6, { fill: C.ink2 });
      s.circle(Rr, 64, 6, { fill: C.ink2 });
      s.text('Telegraf (Atlantikkabel ab 1866)', 480, 120, { size: 18, align: 'center', color: C.blue });
      const ly = 160;
      s.line(L, ly, Rr, ly, { color: C.blueE, width: 3, progress: sseg(t, 0.2, 1.4) });
      let msgs = 0;
      const t0 = 1.6;
      if (t > t0) {
        const k = Math.floor((t - t0) / 0.32);
        msgs = Math.min(k + 1, 999);
        for (let i = Math.max(0, k - 2); i <= k; i++) {
          const u = ((t - t0) - i * 0.32) / 0.3;
          if (u < 0 || u > 1) continue;
          const dir = i % 2 === 0;
          const x = dir ? lerp(L, Rr, u) : lerp(Rr, L, u);
          s.circle(x, ly, 7, { fill: C.blue, glow: 18 });
        }
      }
      s.text('Nachrichten übermittelt: ' + (t > t0 ? fmt(msgs) : 0), 480, 205, { size: 18, align: 'center', color: C.ink2 });

      s.text('Gold per Dampfschiff · Tag ' + fmt(sseg(t, 1.6, 12.2) * 10, 1), 480, 270, { size: 18, align: 'center', color: C.gold });
      const sy = 360;
      s.rect(L, sy - 6, Rr - L, 70, { fill: '#0e2433', r: 6 });
      for (let k = 0; k < 2; k++) {
        const pts = [];
        for (let x = L; x <= Rr; x += 12) pts.push([x, sy + 14 + k * 24 + Math.sin(x * 0.05 + s.clock * 1.5 + k) * 3]);
        s.poly(pts, { stroke: '#2b5a77', width: 1.4, alpha: 0.6 });
      }
      const u = sseg(t, 1.6, 12.2);
      const sx = lerp(Rr - 40, L + 40, u);
      I.ship(s, sx, sy + 4 + Math.sin(s.clock * 1.6) * 2, 40, { steam: true, hull: '#3a3f48' });
      I.goldBar(s, sx - 10, sy - 26, 18);
      I.goldBar(s, sx + 10, sy - 26, 18);
      s.captions(t, [[3, 12.6, 'Informationen reisen mit Lichtgeschwindigkeit, Gold mit Schiffsgeschwindigkeit. Wer das Hauptbuch führt, gewinnt.']], { y: 464, size: 19 });
    }
  });

  /* ======================================================================
     Kapitel 8: Hyperinflation in Weimar – linear vs. logarithmisch
     ====================================================================== */
  const WEI = [[1914.5, 4.2], [1918.85, 7.4], [1919.5, 14], [1920.0, 64.8], [1920.5, 39.5], [1921.0, 64.9], [1921.5, 76.7], [1922.0, 191.8], [1922.5, 493.2], [1922.8, 3180], [1923.0, 17972], [1923.25, 24457], [1923.5, 353412], [1923.58, 4620455], [1923.67, 98860000], [1923.75, 25260208000], [1923.88, 4.2e12]];
  Scenes.define('weimar', {
    W: 960, H: 520, duration: 15,
    label: 'Wechselkurs Mark pro US-Dollar 1914 bis 1923, zuerst linear, dann auf logarithmischer Skala.',
    draw(s, t) {
      const ax = { x: 150, y: 60, w: 760, h: 360 };
      const L0 = 0, L1 = 13;
      ax.X = (v) => ax.x + ((v - 1914) / 10) * ax.w;
      const ylin = (v) => ax.y + ax.h - (v / 4.4e12) * ax.h;
      const ylog = (v) => ax.y + ax.h - ((Math.log10(Math.max(v, 1)) - L0) / (L1 - L0)) * ax.h;
      const m = sseg(t, 7, 9.6);
      ax.Y = (v) => lerp(ylin(v), ylog(v), m);
      const a0 = sseg(t, 0, 1);
      const linT = [[1e12, '1 Billion'], [2e12, '2 Billionen'], [3e12, '3 Billionen'], [4e12, '4 Billionen']].map(([v, l]) => [v, l, 1 - m]);
      const logT = [[1, '1'], [100, '100'], [1e4, '10’000'], [1e6, '1 Million'], [1e8, '100 Mio.'], [1e10, '10 Mrd.'], [1e12, '1 Billion']].map(([v, l]) => [v, l, m]);
      s.axes(ax, { alpha: a0, xticks: [[1914, '1914'], [1916, '1916'], [1918, '1918'], [1920, '1920'], [1922, '1922'], [1924, '1924']], yticks: linT.concat(logT), grid: true });
      s.text('Mark pro US-Dollar', ax.x, 36, { size: 20, color: C.ink2, alpha: a0 });
      s.text(m < 0.5 ? 'lineare Skala' : 'logarithmische Skala', ax.x + ax.w, 36, { size: 18, align: 'right', color: m < 0.5 ? C.dim : C.yellow, italic: true, alpha: a0 });
      const pts = [];
      for (let i = 0; i < WEI.length - 1; i++) {
        const [x1, v1] = WEI[i], [x2, v2] = WEI[i + 1];
        for (let k = 0; k < 14; k++) {
          const f = k / 14;
          pts.push([ax.X(lerp(x1, x2, f)), ax.Y(Math.exp(lerp(Math.log(v1), Math.log(v2), f)))]);
        }
      }
      const last = WEI[WEI.length - 1];
      pts.push([ax.X(last[0]), ax.Y(last[1])]);
      const p = sseg(t, 1.2, 6);
      s.poly(pts, { stroke: C.red, width: 3.5, progress: p, glow: 8 });
      if (p > 0 && p < 1) { const h = Stage.pointAt(pts, p); s.circle(h[0], h[1], 6, { fill: C.yellow, glow: 12 }); }
      const an = sseg(t, 10, 11);
      if (an > 0) {
        const x1 = ax.X(1914.5), y1 = ax.Y(4.2);
        s.circle(x1, y1, 6, { fill: C.ink, alpha: an });
        s.text('Juli 1914: 4.20 Mark', x1 + 12, y1 - 12, { size: 17, color: C.ink, alpha: an });
        const x2 = ax.X(1923.88), y2 = ax.Y(4.2e12);
        s.circle(x2, y2, 6, { fill: C.red, alpha: an, glow: 12 });
        s.text('Nov. 1923: 4’200’000’000’000 Mark', x2 - 12, y2 + 30, { size: 17, color: C.red, align: 'right', alpha: an, weight: 600 });
      }
      s.captions(t, [
        [5.6, 7.2, 'Linear sieht man nur die Explosion am Ende …'],
        [7.4, 9.8, '… also wechseln wir auf eine logarithmische Skala.'],
        [10.4, 15, 'Jeder Strich nach oben bedeutet: hundertmal mehr Mark für einen Dollar.']
      ], { y: 500 });
    }
  });

  /* ======================================================================
     Kapitel 9: 1971 – drei Diagramme
     ====================================================================== */
  const interp = (anchors, from, to, log) => {
    const out = [];
    for (let y = from; y <= to; y++) {
      let i = 0;
      while (i < anchors.length - 2 && anchors[i + 1][0] < y) i++;
      const [x1, v1] = anchors[i], [x2, v2] = anchors[i + 1];
      const f = clamp((y - x1) / (x2 - x1));
      out.push([y, log ? Math.exp(lerp(Math.log(v1), Math.log(v2), f)) : lerp(v1, v2, smooth(f) * 0.3 + f * 0.7)]);
    }
    return out;
  };
  const PROD = interp([[1948, 100], [1955, 120], [1960, 135], [1965, 160], [1973, 196.7], [1980, 210], [1985, 225], [1990, 240], [1995, 255], [2000, 280], [2005, 310], [2010, 333], [2013, 343]], 1948, 2013);
  const PAY = interp([[1948, 100], [1955, 122], [1960, 140], [1965, 162], [1973, 191.3], [1977, 194], [1980, 192], [1985, 189], [1990, 188], [1995, 186], [2000, 197], [2005, 203], [2010, 207], [2013, 208.9]], 1948, 2013);
  const M2 = interp([[1960, 0.30], [1965, 0.46], [1971, 0.68], [1975, 1.02], [1980, 1.6], [1985, 2.5], [1990, 3.28], [1995, 3.64], [2000, 4.92], [2005, 6.69], [2008, 8.19], [2010, 8.8], [2015, 12.3], [2019, 15.3], [2020, 19.1], [2021, 21.6], [2022, 21.4], [2023, 20.8], [2024, 21.5], [2025, 22.0]], 1960, 2025, true);
  const GOLDP = [[1960, 35], [1961, 35], [1962, 35], [1963, 35], [1964, 35], [1965, 35], [1966, 35], [1967, 35], [1968, 39], [1969, 41], [1970, 36], [1971, 41], [1972, 58], [1973, 97], [1974, 154], [1975, 161], [1976, 125], [1977, 148], [1978, 193], [1979, 306], [1980, 615], [1981, 460], [1982, 376], [1983, 424], [1984, 361], [1985, 317], [1986, 368], [1987, 447], [1988, 437], [1989, 381], [1990, 383], [1991, 362], [1992, 344], [1993, 360], [1994, 384], [1995, 384], [1996, 388], [1997, 331], [1998, 294], [1999, 279], [2000, 279], [2001, 271], [2002, 310], [2003, 363], [2004, 409], [2005, 444], [2006, 603], [2007, 695], [2008, 872], [2009, 972], [2010, 1225], [2011, 1572], [2012, 1669], [2013, 1411], [2014, 1266], [2015, 1160], [2016, 1251], [2017, 1257], [2018, 1268], [2019, 1393], [2020, 1770], [2021, 1799], [2022, 1800], [2023, 1943], [2024, 2386]];

  const DATASETS = [
    {
      name: 'Produktivität & Löhne', x0: 1948, x1: 2014, log: false, y0: 80, y1: 370,
      yticks: [[100, '100'], [200, '200'], [300, '300']],
      title: 'USA, Index 1948 = 100 (stilisiert nach EPI)',
      series: [{ d: PROD, c: C.blue, label: 'Produktivität' }, { d: PAY, c: C.gold, label: 'Lohn typischer Arbeitnehmer' }]
    },
    {
      name: 'Geldmenge M2', x0: 1960, x1: 2026, log: true, y0: 0.2, y1: 40,
      yticks: [[0.3, '0.3'], [1, '1'], [3, '3'], [10, '10'], [30, '30']],
      title: 'Geldmenge M2 der USA in Billionen Dollar (log. Skala, FRED)',
      series: [{ d: M2, c: C.green, label: 'M2' }],
      notes: [[1971, 0.68, '0.68 Bio. $ (1971)'], [2025, 22, '≈ 22 Bio. $ (2025)']]
    },
    {
      name: 'Goldpreis', x0: 1960, x1: 2026, log: true, y0: 20, y1: 5000,
      yticks: [[35, '35 $'], [100, '100 $'], [300, '300 $'], [1000, '1’000 $'], [3000, '3’000 $']],
      title: 'Goldpreis in US-Dollar pro Unze, Jahresmittel (log. Skala)',
      series: [{ d: GOLDP, c: C.gold, label: 'Gold' }],
      notes: [[1968, 35, '35 $ fix bis 1971'], [2024, 2386, '≈ 2’400 $ (2024)']]
    }
  ];

  Scenes.define('nixon', {
    W: 960, H: 520,
    label: 'Drei umschaltbare Diagramme rund um 1971: Produktivität und Löhne, Geldmenge M2 und Goldpreis.',
    setup(s) {
      const st = s.state;
      st.sel = 0; st.ta = 0;
      s.toggle(DATASETS.map((d) => d.name), 0, (i) => { st.sel = i; st.ta = 0; });
    },
    update(s, dt) { s.state.ta += dt; },
    draw(s) {
      const st = s.state, D = DATASETS[st.sel], ta = st.ta;
      const ax = { x: 100, y: 70, w: 800, h: 360 };
      ax.X = (v) => ax.x + ((v - D.x0) / (D.x1 - D.x0)) * ax.w;
      ax.Y = D.log ? (v) => ax.y + ax.h - ((Math.log10(v) - Math.log10(D.y0)) / (Math.log10(D.y1) - Math.log10(D.y0))) * ax.h
        : (v) => ax.y + ax.h - ((v - D.y0) / (D.y1 - D.y0)) * ax.h;
      const xt = [];
      for (let y = Math.ceil(D.x0 / 10) * 10; y <= D.x1; y += 10) xt.push([y, String(y)]);
      s.axes(ax, { xticks: xt, yticks: D.yticks, grid: true });
      s.text(D.title, ax.x, 40, { size: 18, color: C.ink2 });
      const nx = ax.X(1971.6);
      s.line(nx, ax.y, nx, ax.y + ax.h, { color: C.red, width: 2, dash: [6, 6], progress: sseg(ta, 0, 0.8) });
      s.text('15. Aug. 1971', nx + 8, ax.y + 20, { size: 16, color: C.red, alpha: sseg(ta, 0.4, 1) });
      const p = sseg(ta, 0.4, 3.4);
      D.series.forEach((se, k) => {
        const pts = se.d.map(([x, v]) => [ax.X(x), ax.Y(v)]);
        s.poly(pts, { stroke: se.c, width: 3.5, progress: p, glow: 6 });
        if (p >= 1) {
          const [lx, ly] = pts[pts.length - 1];
          s.circle(lx, ly, 5, { fill: se.c });
          if (!D.notes) s.text(se.label, lx - 6, ly + (k === 0 ? -16 : 26), { size: 17, align: 'right', color: se.c, weight: 600, alpha: sseg(ta, 3.2, 3.8) });
        }
      });
      (D.notes || []).forEach(([x, v, lab], i) => {
        const a = sseg(ta, 3.4 + i * 0.4, 4 + i * 0.4);
        s.circle(ax.X(x), ax.Y(v), 5, { fill: C.ink, alpha: a });
        s.text(lab, ax.X(x) + (i === 0 ? 10 : -10), ax.Y(v) + (i === 0 ? 26 : -14), { size: 16, align: i === 0 ? 'left' : 'right', color: C.ink, alpha: a });
      });
      if (st.sel === 0) {
        const a = sseg(ta, 3.8, 4.6);
        s.text('Bis 1973 wachsen beide gemeinsam – danach öffnet sich die Schere.', 480, 500, { size: 18, align: 'center', color: C.ink, italic: true, alpha: a });
      } else if (st.sel === 1) {
        s.text('Rund 32-mal mehr Dollar als 1971.', 480, 500, { size: 18, align: 'center', color: C.ink, italic: true, alpha: sseg(ta, 4.2, 5) });
      } else {
        s.text('Gemessen in Gold hat der Dollar seit 1971 über 98 % verloren.', 480, 500, { size: 18, align: 'center', color: C.ink, italic: true, alpha: sseg(ta, 4.2, 5) });
      }
    }
  });

  /* ======================================================================
     Kapitel 10: Cantillon-Effekt
     ====================================================================== */
  const CANT = [
    { n: 'Zentralbank', r: 40, c: C.yellow },
    { n: 'Banken & Finanzmärkte', r: 82, c: '#e9c54a' },
    { n: 'Staat & Grosskonzerne', r: 124, c: '#d3b25a' },
    { n: 'Vermögensbesitzer', r: 166, c: '#a9a37a' },
    { n: 'Lohnempfänger', r: 208, c: '#7fa1a8' },
    { n: 'Sparer & Rentner', r: 250, c: C.blue }
  ];
  Scenes.define('cantillon', {
    W: 960, H: 560, duration: 17,
    label: 'Konzentrische Ringe von der Zentralbank bis zu Sparern. Neues Geld breitet sich wie eine Welle aus, während die Preise steigen.',
    setup(s) {
      const R = rng(9);
      s.state.dots = CANT.map((g, i) => {
        const r0 = i === 0 ? 0 : CANT[i - 1].r;
        const n = Math.round(6 + i * 7);
        return Array.from({ length: n }, () => { const a = R() * Math.PI * 2, d = r0 + 6 + R() * (g.r - r0 - 12); return [Math.cos(a) * d, Math.sin(a) * d, R()]; });
      });
    },
    draw(s, t) {
      const cx = 290, cy = 290;
      const W = (tt) => 262 * sseg(tt, 3, 12.5);
      const Pr = (tt) => 100 + 10 * sseg(tt, 3.6, 13.5);
      const recv = CANT.map((g, i) => {
        const mid = i === 0 ? 20 : (CANT[i - 1].r + g.r) / 2;
        let lo = 3, hi = 12.5;
        for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (W(m) < mid) lo = m; else hi = m; }
        return lo;
      });
      const wave = W(t);
      for (let i = CANT.length - 1; i >= 0; i--) {
        const g = CANT[i];
        const a = sseg(t, 0.2 + (CANT.length - i) * 0.15, 0.8 + (CANT.length - i) * 0.15);
        const got = t > recv[i] ? 1 : 0;
        s.circle(cx, cy, g.r, { fill: mix('#14181f', g.c, 0.1 + got * 0.14), alpha: a });
        s.circle(cx, cy, g.r, { stroke: rgba(g.c, 0.7), width: 1.5, alpha: a });
      }
      s.state.dots.forEach((arr, i) => {
        arr.forEach(([dx, dy, ph]) => {
          const r = Math.hypot(dx, dy);
          if (wave > r) {
            const a = clamp((wave - r) / 30);
            I.coin(s, cx + dx, cy + dy, 4.5, { alpha: a * 0.95 });
          }
        });
      });
      if (wave > 0 && wave < 262) s.circle(cx, cy, wave, { stroke: C.yellow, width: 3, alpha: 0.7, glow: 14 });
      const dropY = lerp(-30, cy, easeOut(seg(t, 1.6, 3)));
      if (t > 1.6 && t < 3.2) I.coin(s, cx, dropY, 14, { symbol: '¤', glow: 12 });
      if (t > 3 && t < 4.4) s.circle(cx, cy, (t - 3) * 60, { stroke: C.yellow, width: 2, alpha: 1 - (t - 3) / 1.4 });
      s.text('neues Geld', cx, cy - 290 + 30, { size: 16, align: 'center', color: C.yellow, alpha: pulse(t, 1.2, 3.4) });

      // Preisniveau
      const P = Pr(t);
      const lx = 600;
      s.text('Preisniveau', lx, 46, { size: 18, color: C.ink2 });
      s.rect(lx, 58, 320, 14, { fill: C.grid, r: 7 });
      s.rect(lx, 58, ((P - 100) / 10) * 320, 14, { fill: C.red, r: 7 });
      s.text(fmt(P, 1), lx + 320, 46, { size: 18, align: 'right', color: C.red, weight: 600 });
      const OUT = [['schöpft', C.yellow], ['gewinnt', C.green], ['gewinnt', C.green], ['gewinnt', C.green], ['verliert', C.red], ['verliert', C.red]];
      CANT.forEach((g, i) => {
        const y = 118 + i * 66;
        s.circle(lx + 8, y - 6, 8, { fill: g.c });
        s.text(g.n, lx + 26, y, { size: 18, color: C.ink });
        const ra = sseg(t, recv[i], recv[i] + 0.5);
        if (ra > 0) {
          s.text('erhält neues Geld bei Preisniveau ' + fmt(Pr(recv[i]), 1), lx + 26, y + 22, { size: 15, color: C.dim, alpha: ra });
          s.text(OUT[i][0], lx + 330, y, { size: 16, align: 'right', color: OUT[i][1], weight: 600, alpha: sseg(t, 13.6, 14.4) });
        }
      });
      s.captions(t, [
        [0.6, 3, 'Neues Geld entsteht immer an einem bestimmten Ort …'],
        [3.4, 12.6, '… und breitet sich von dort aus. Die Preise steigen mit.'],
        [13.4, 17, 'Wer nah an der Quelle sitzt, kauft zu alten Preisen. Wer weit weg ist, zahlt schon die neuen.']
      ], { y: 545, maxW: 520, x: 290 });
    }
  });

  /* ======================================================================
     Kapitel 10: Inflationsrechner
     ====================================================================== */
  Scenes.define('inflationcalc', {
    W: 960, H: 440,
    label: 'Inflationsrechner: Ein Raster aus 100 Broten zeigt, wie viel Kaufkraft von 10’000 Franken nach einer bestimmten Zeit übrig bleibt.',
    setup(s) {
      const st = s.state;
      st.i = 3; st.n = 30; st.disp = 1;
      s.slider({ label: 'Inflation pro Jahr', min: 0, max: 15, step: 0.5, value: 3, format: (v) => fmt(v, 1) + ' %', onInput: (v) => { st.i = v; } });
      s.slider({ label: 'Jahre', min: 0, max: 50, step: 1, value: 30, format: (v) => v + ' J.', onInput: (v) => { st.n = v; } });
    },
    update(s, dt) {
      const st = s.state;
      const target = Math.pow(1 + st.i / 100, -st.n);
      st.disp += (target - st.disp) * Math.min(1, dt * 6);
    },
    draw(s) {
      const st = s.state;
      const r = st.disp;
      const lit = r * 100;
      const gx = 60, gy = 60, cs = 30, gap = 3;
      for (let k = 0; k < 100; k++) {
        const x = gx + (k % 10) * (cs + gap), y = gy + Math.floor(k / 10) * (cs + gap);
        const f = clamp(lit - k);
        s.rect(x, y, cs, cs, { fill: '#1a1f27', r: 7 });
        if (f > 0) {
          s.rect(x, y, cs * f, cs, { fill: '#d6a15a', r: 7 });
          s.rect(x + 4, y + 8, cs * f - 8 > 0 ? cs * f - 8 : 0, 3, { fill: '#b07b3c', r: 1.5 });
        }
      }
      s.text('Was 10’000 Franken heute kaufen: 100 Brote', gx, 40, { size: 17, color: C.dim });
      const tx = 440;
      s.text('Nach ' + st.n + ' Jahren mit ' + fmt(st.i, 1) + ' % Inflation', tx, 90, { size: 22, color: C.ink2 });
      s.text('CHF ' + fmt(10000 * r), tx, 160, { size: 60, color: C.yellow, weight: 600 });
      s.text('reale Kaufkraft von CHF 10’000', tx, 192, { size: 18, color: C.dim });
      s.text('Verlust: ' + fmt((1 - r) * 100, 0) + ' %', tx, 252, { size: 30, color: C.red, weight: 600 });
      if (st.i > 0) {
        s.text('Halbierung nach ≈ ' + fmt(72 / st.i, 0) + ' Jahren', tx, 302, { size: 22, color: C.ink2 });
        s.text('(Faustregel: 72 ÷ Inflationsrate)', tx, 328, { size: 16, color: C.dim, italic: true });
      } else s.text('Ohne Inflation bleibt die Kaufkraft erhalten.', tx, 302, { size: 20, color: C.green });
      s.text('Zum Vergleich: Ziel der meisten Zentralbanken ≈ 2 % pro Jahr', tx, 400, { size: 16, color: C.dim });
    }
  });

  /* ======================================================================
     Kapitel 11: Geld in Schichten (Layered Money)
     ====================================================================== */
  const ERAS = [
    { title: 'Klassischer Goldstandard (1871–1914)', layers: [['Gold', C.gold, 0.24], ['Banknoten & Zentralbankgeld', C.silver, 0.48], ['Bankeinlagen', C.blue, 0.74]] },
    { title: 'Bretton Woods (1944–1971)', layers: [['Gold', C.gold, 0.2], ['US-Dollar', C.green, 0.38], ['Andere Währungen (DM, Franken, Pfund …)', C.teal, 0.6], ['Bankeinlagen', C.blue, 0.84]] },
    { title: 'Seit 1971', layers: [['Staatsanleihen & Zentralbankgeld', C.green, 0.34], ['Bankeinlagen', C.blue, 0.56], ['Eurodollar & Schattenbanken', C.purple, 0.8], ['Derivate & Kredite', C.maroon, 1.0]] },
    { title: 'Bitcoin', layers: [['Bitcoin-Blockchain', C.btc, 0.24], ['Lightning & andere Layer 2', C.yellow, 0.5], ['Verwahrer & Börsen', C.dim, 0.74]] }
  ];
  function drawPyramid(s, era, cx, base, alpha, o = {}) {
    const lh = 64, W0 = 640;
    era.layers.forEach(([name, col, w], i) => {
      if (o.skipFirst && i === 0) return;
      const wb = (i === 0 ? w * 0.55 : era.layers[i - 1][2]) * W0;
      const wt = w * W0;
      const yb = base - i * lh, yt = yb - lh + 4;
      const quad = [[cx - wb / 2, yb], [cx + wb / 2, yb], [cx + wt / 2, yt], [cx - wt / 2, yt]];
      s.poly(quad, { fill: rgba(col, 0.28), closed: true, alpha });
      s.poly(quad, { stroke: col, width: 2, closed: true, alpha });
      const tw = s.measure(name, 18, { weight: 600 });
      const fs = Math.max(13, Math.min(18, (18 * (wt * 0.92)) / tw));
      s.text(name, cx, (yb + yt) / 2 + fs * 0.38, { size: fs, align: 'center', color: mix(col, '#fff', 0.35), weight: 600, alpha });
      s.text('Schicht ' + (i + 1), cx + Math.max(wt / 2, (tw * fs) / 36) + 14, (yb + yt) / 2 + 6, { size: 14, color: C.dim, alpha });
    });
  }
  Scenes.define('layers', {
    W: 960, H: 520, duration: 27,
    label: 'Umgekehrte Pyramiden des Geldes: Goldstandard, Bretton Woods, das System seit 1971 ohne Gold, und Bitcoin als neue Basisschicht.',
    draw(s, t) {
      const cx = 480, base = 440;
      const spans = [[0, 6.2], [6.6, 12.8], [13.2, 20], [20.4, 27]];
      spans.forEach(([a, b], i) => {
        const al = Math.min(sseg(t, a, a + 0.8), i === 3 ? 1 : 1 - sseg(t, b - 0.2, b + 0.4));
        if (al <= 0) return;
        s.text(ERAS[i].title, cx, 50, { size: 26, align: 'center', color: C.ink, weight: 600, alpha: al });
        drawPyramid(s, ERAS[i], cx, base, al, { skipFirst: i === 1 && t > 12 });
      });
      // Übergang 2 → 3: das Gold fällt heraus
      const gd = sseg(t, 12, 13.6);
      if (t > 12 && t < 14.2) {
        const g = ERAS[1].layers[0];
        const wb = g[2] * 0.55 * 640, wt = g[2] * 640;
        const dy = gd * 160;
        s.poly([[cx - wb / 2, base + dy], [cx + wb / 2, base + dy], [cx + wt / 2, base - 60 + dy], [cx - wt / 2, base - 60 + dy]], { fill: rgba(C.gold, 0.4), closed: true, alpha: 1 - gd });
        s.text('Gold', cx, base - 24 + dy, { size: 18, align: 'center', color: C.gold, alpha: 1 - gd, weight: 600 });
      }
      s.captions(t, [
        [0.6, 6, 'Jede Schicht ist ein Versprechen auf die Schicht darunter. Ganz unten: Gold – niemandes Schuld.'],
        [7, 12, 'Nach 1944 hängt die Welt am Dollar, und nur der Dollar hängt am Gold.'],
        [13.4, 19.8, '1971 fällt das Gold weg. Die Pyramide steht nun auf einem Versprechen, das beliebig wachsen kann.'],
        [20.8, 27, 'Bitcoin bietet wieder eine neutrale Basisschicht, die niemandes Schuld ist und die niemand vermehren kann.']
      ], { y: 506 });
    }
  });

  /* ======================================================================
     Kapitel 11 & 19: Härte gegen Geschwindigkeit
     ====================================================================== */
  const DIL = [
    ['Kieselsteine', 0.2, 0.03, '#a4a7ac'], ['Muscheln', 0.26, 0.3, C.salt], ['Salz', 0.14, 0.34, '#f3efe4'],
    ['Rai-Steine', 0.05, 0.56, C.sand], ['Silber', 0.3, 0.68, C.silver], ['Gold', 0.18, 0.9, C.gold],
    ['Banknoten (goldgedeckt)', 0.5, 0.66, C.paper], ['Bankbuchgeld (Telegraf)', 0.74, 0.5, C.blue], ['Fiat-Geld (digital)', 0.92, 0.08, C.money]
  ];
  function dilemmaScene(withBtc) {
    return {
      W: 960, H: 540, duration: withBtc ? 15 : 14,
      label: 'Streudiagramm: Härte gegen Geschwindigkeit. Gold ist hart aber langsam, Fiat schnell aber weich.' + (withBtc ? ' Bitcoin erscheint oben rechts: hart und schnell.' : ' Oben rechts bleibt ein Fragezeichen.'),
      draw(s, t) {
        const ax = { x: 110, y: 60, w: 790, h: 380 };
        ax.X = (v) => ax.x + v * ax.w;
        ax.Y = (v) => ax.y + ax.h - v * ax.h;
        const a0 = sseg(t, 0, 1);
        s.axes(ax, { alpha: a0 });
        s.text('Geschwindigkeit & Reichweite der Übertragung →', ax.x + ax.w, ax.y + ax.h + 34, { size: 17, align: 'right', color: C.ink2, alpha: a0 });
        s.text('Härte →', ax.x - 14, ax.y + 6, { size: 17, align: 'right', color: C.ink2, alpha: a0, rotate: -Math.PI / 2 });
        s.text('langsam', ax.x + 4, ax.y + ax.h + 34, { size: 14, color: C.dim, alpha: a0 });
        DIL.forEach(([n, x, y, c], i) => {
          const a = sseg(t, 1 + i * 0.45, 1.5 + i * 0.45);
          if (a <= 0) return;
          const X = ax.X(x), Y = ax.Y(y);
          s.circle(X, Y, 9 * easeOutBack(a), { fill: c });
          const right = x < 0.8;
          s.text(n, X + (right ? 16 : -16), Y + 6, { size: 17, align: right ? 'left' : 'right', color: mix(c, '#fff', 0.2), alpha: a });
        });
        const path = [[0.18, 0.9], [0.5, 0.66], [0.74, 0.5], [0.92, 0.08]];
        const pp = sseg(t, 6, 9);
        for (let i = 0; i < path.length - 1; i++) {
          const f = clamp(pp * 3 - i);
          if (f <= 0) continue;
          const [x1, y1] = path[i], [x2, y2] = path[i + 1];
          const X1 = ax.X(x1), Y1 = ax.Y(y1), X2 = ax.X(x2), Y2 = ax.Y(y2);
          const mx = (X1 + X2) / 2 + 30, my = (Y1 + Y2) / 2 - 30;
          s.curveArrow(X1 + 8, Y1 + 4, mx, my, X2 - 8, Y2 - 6, { color: C.red, width: 2.2, progress: f, alpha: 0.85 });
        }
        s.text('Die Geschichte tauschte Härte gegen Geschwindigkeit', ax.X(0.55), ax.Y(0.8), { size: 18, align: 'center', color: C.red, italic: true, alpha: sseg(t, 8.5, 9.5) });
        const qa = sseg(t, 10, 11);
        if (qa > 0) {
          const X = ax.X(0.9), Y = ax.Y(0.95);
          if (withBtc) {
            s.circle(X, Y, 30 + Math.sin(s.clock * 3) * 3, { fill: rgba(C.btc, 0.15), alpha: qa });
            s.at(X, Y, easeOutBack(qa), () => I.btc(s, 0, 0, 18, { glow: 20 }));
            s.text('Bitcoin', X - 30, Y + 8, { size: 22, align: 'right', color: C.btc, weight: 700, alpha: qa });
          } else {
            s.circle(X, Y, 26, { stroke: C.yellow, width: 2, dash: [5, 5], alpha: qa });
            s.text('?', X, Y + 14, { size: 40, align: 'center', color: C.yellow, weight: 700, alpha: qa * (0.7 + 0.3 * Math.sin(s.clock * 3)) });
          }
        }
        s.captions(t, withBtc ? [[11.4, 15, 'Zum ersten Mal: hart wie Gold und schnell wie das Internet – ohne Zentrale, die das Hauptbuch führt.']]
          : [[11.4, 14, 'Gibt es ein Geld, das hart ist UND schnell – ohne Zentrale, die das Hauptbuch führt?']], { y: 522 });
      }
    };
  }
  Scenes.define('dilemma', dilemmaScene(false));
  Scenes.define('dilemma-btc', dilemmaScene(true));
})();
