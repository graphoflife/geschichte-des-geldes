/* scenes-bitcoin.js – Animationen und Demos für Teil III (Bitcoin) */
(function () {
  'use strict';
  const { Scenes, C, U, I, Stage, el } = window.Engine;
  const { clamp, lerp, smooth, seg, sseg, easeOut, easeIn, easeOutBack, mix, rgba, fmt, rng, pulse, sup } = U;

  /* ======================================================================
     Kapitel 13: Double Spending
     ====================================================================== */
  Scenes.define('doublespend', {
    W: 960, H: 540, duration: 23,
    label: 'Alice kopiert eine digitale Münze und bezahlt Bob und Carol damit. Eine Bank verhindert das, ohne Bank verbreiten sich zwei widersprüchliche Transaktionen im Netzwerk.',
    setup(s) {
      const R = rng(21);
      const nodes = [];
      let tries = 0;
      while (nodes.length < 24 && tries++ < 20000) {
        const x = 110 + R() * 740, y = 105 + R() * 340;
        if (nodes.every(([a, b]) => Math.hypot(a - x, b - y) > 82)) nodes.push([x, y]);
      }
      const set = new Set();
      nodes.forEach((p, i) => {
        const d = nodes.map((q, j) => [Math.hypot(p[0] - q[0], p[1] - q[1]), j]).sort((a, b) => a[0] - b[0]);
        for (let k = 1; k <= 3; k++) { const j = d[k][1]; set.add(i < j ? i + '-' + j : j + '-' + i); }
      });
      const E = [...set].map((e) => e.split('-').map(Number));
      const dist = (src) => {
        const D = nodes.map(() => Infinity);
        D[src] = 0;
        const done = new Set();
        while (done.size < nodes.length) {
          let u = -1, b = Infinity;
          D.forEach((v, i) => { if (!done.has(i) && v < b) { b = v; u = i; } });
          if (u < 0) break;
          done.add(u);
          E.forEach(([a, c]) => {
            const v = a === u ? c : c === u ? a : -1;
            if (v < 0) return;
            const w = Math.hypot(nodes[u][0] - nodes[v][0], nodes[u][1] - nodes[v][1]);
            if (D[u] + w < D[v]) D[v] = D[u] + w;
          });
        }
        return D;
      };
      let sA = 0, sB = 0;
      nodes.forEach((p, i) => { if (p[0] < nodes[sA][0]) sA = i; if (p[0] > nodes[sB][0]) sB = i; });
      s.state.net = { nodes, E, dA: dist(sA), dB: dist(sB), sA, sB };
    },
    draw(s, t) {
      const pA = 1 - sseg(t, 6.6, 7.2);
      const pB = sseg(t, 7, 7.6) * (1 - sseg(t, 12.2, 12.8));
      const pC = sseg(t, 12.6, 13.2);

      if (pA > 0) s.alpha(pA, () => {
        I.person(s, 150, 420, 100, { color: C.blue, look: 1 });
        s.text('Alice', 150, 450, { size: 20, align: 'center', color: C.blue, weight: 600 });
        I.person(s, 820, 240, 90, { color: C.green, look: -1 });
        s.text('Bob', 820, 268, { size: 20, align: 'center', color: C.green, weight: 600 });
        I.person(s, 820, 470, 90, { color: C.purple, look: -1 });
        s.text('Carol', 820, 498, { size: 20, align: 'center', color: C.purple, weight: 600 });
        const c = sseg(t, 1.4, 2.4);
        const m1 = sseg(t, 2.8, 4.6), m2 = sseg(t, 3.0, 4.8);
        const f1 = [lerp(260, 720, m1), lerp(330, 190, m1) - Math.sin(Math.PI * m1) * 40];
        const f2 = [lerp(260 + 18 * c, 720, m2), lerp(330 + 18 * c, 420, m2) + Math.sin(Math.PI * m2) * 30];
        if (c > 0) I.file(s, f2[0], f2[1], 58, { label: '1 Münze', color: C.yellow, alpha: c });
        I.file(s, f1[0], f1[1], 58, { label: '1 Münze', color: C.yellow });
        if (c > 0 && m2 < 0.2) s.text('Kopieren · Einfügen', 300, 268, { size: 17, color: C.yellow, italic: true, alpha: c * (1 - m2 * 5), align: 'center' });
        const ok = sseg(t, 5, 5.6);
        if (ok > 0) {
          I.check(s, 880, 150, 30, { progress: ok });
          I.check(s, 880, 380, 30, { progress: ok });
          s.text('bezahlt!', 900, 196, { size: 17, color: C.green, alpha: ok, align: 'center' });
          s.text('bezahlt!', 900, 426, { size: 17, color: C.green, alpha: ok, align: 'center' });
        }
      });

      if (pB > 0) s.alpha(pB, () => {
        I.person(s, 140, 440, 96, { color: C.blue, look: 1 });
        s.text('Alice', 140, 470, { size: 20, align: 'center', color: C.blue, weight: 600 });
        I.bank(s, 480, 420, 90);
        s.text('Bank', 480, 452, { size: 20, align: 'center', color: C.silver, weight: 600 });
        I.person(s, 830, 290, 80, { color: C.green, look: -1 });
        s.text('Bob', 830, 316, { size: 18, align: 'center', color: C.green });
        I.person(s, 830, 470, 80, { color: C.purple, look: -1 });
        s.text('Carol', 830, 496, { size: 18, align: 'center', color: C.purple });
        const lx = 330, ly = 110;
        s.rect(lx, ly, 300, 128, { fill: '#141920', stroke: C.faint, width: 1.5, r: 10 });
        s.text('Hauptbuch der Bank', lx + 16, ly + 30, { size: 17, color: C.dim });
        const upd = sseg(t, 9, 9.5);
        s.text('Alice:', lx + 16, ly + 66, { size: 20, color: C.ink });
        s.text('Bob:', lx + 16, ly + 100, { size: 20, color: C.ink });
        s.text(upd < 0.5 ? '1' : '0', lx + 120, ly + 66, { size: 20, color: upd < 0.5 ? C.ink : C.red, mono: true });
        s.text(upd < 0.5 ? '0' : '1', lx + 120, ly + 100, { size: 20, color: upd < 0.5 ? C.ink : C.green, mono: true });
        s.arrow(200, 380, 410, 360, { color: C.yellow, width: 2.5, progress: sseg(t, 8, 9) });
        s.text('1 an Bob', 280, 352, { size: 16, color: C.yellow, alpha: sseg(t, 8.2, 8.8) });
        s.arrow(550, 350, 780, 270, { color: C.green, width: 2.5, progress: sseg(t, 9.5, 10.2) });
        const a2 = sseg(t, 10.4, 11.2);
        s.arrow(200, 410, 410, 400, { color: C.yellow, width: 2.5, progress: a2, dash: [6, 5] });
        s.text('1 an Carol?', 260, 440, { size: 16, color: C.yellow, alpha: a2 });
        const no = sseg(t, 11.2, 11.8);
        I.cross(s, 560, 410, 34, { progress: no });
        s.text('abgelehnt: Guthaben 0', 600, 420, { size: 16, color: C.red, alpha: no });
      });

      if (pC > 0) s.alpha(pC, () => {
        const { nodes, E, dA, dB, sA, sB } = s.state.net;
        const t0 = 13.6, v = 150;
        const col = (i) => {
          const a = t0 + dA[i] / v, b = t0 + 0.1 + dB[i] / v;
          if (t < Math.min(a, b)) return null;
          return a <= b ? C.green : C.purple;
        };
        E.forEach(([a, b]) => {
          const ca = col(a), cb = col(b);
          s.line(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], { color: ca && ca === cb ? ca : C.faint, width: 1.5, alpha: ca && ca === cb ? 0.6 : 0.7 });
        });
        nodes.forEach((p, i) => {
          const c = col(i);
          s.circle(p[0], p[1], 11, { fill: c ? rgba(c, 0.85) : '#1a2029', stroke: c || C.dim, width: 2 });
        });
        const ia = sseg(t, 13, 13.6);
        I.person(s, nodes[sA][0] - 40, nodes[sA][1] + 26, 50, { color: C.blue, alpha: ia });
        I.person(s, nodes[sB][0] + 40, nodes[sB][1] + 26, 50, { color: C.blue, alpha: ia });
        s.text('Alice → Bob', nodes[sA][0], nodes[sA][1] - 40, { size: 16, align: 'center', color: C.green, alpha: ia, weight: 600 });
        s.text('Alice → Carol', nodes[sB][0], nodes[sB][1] - 40, { size: 16, align: 'center', color: C.purple, alpha: ia, weight: 600 });
        const nG = nodes.filter((_, i) => col(i) === C.green).length, nP = nodes.filter((_, i) => col(i) === C.purple).length;
        s.text('sieht zuerst «an Bob»: ' + nG, 40, 500, { size: 17, color: C.green, alpha: ia });
        s.text('sieht zuerst «an Carol»: ' + nP, 920, 500, { size: 17, color: C.purple, alpha: ia, align: 'right' });
      });

      s.captions(t, [
        [0.4, 6.4, 'Eine digitale Münze ist nur eine Datei – und Dateien lassen sich kopieren.'],
        [7.4, 12.2, 'Die klassische Lösung: Eine Bank führt das Hauptbuch und lehnt den zweiten Versuch ab. Dafür musst du ihr vertrauen.'],
        [13, 23, 'Ohne Zentrale sieht jeder Knoten eine andere Transaktion zuerst. Wer hat recht?']
      ], { top: 40 });
    }
  });

  /* ======================================================================
     Kapitel 13: Die byzantinischen Generäle
     ====================================================================== */
  Scenes.define('generals', {
    W: 960, H: 540, duration: 33,
    label: 'Fünf Generäle umzingeln eine Burg. Ein Verräter sendet widersprüchliche Nachrichten, dann erzeugt er falsche Identitäten. Proof of Work macht Stimmen teuer.',
    draw(s, t) {
      const cx = 380, cy = 290, R = 185;
      const G = [0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [cx + R * Math.cos(a), cy + R * Math.sin(a) * 0.95]; });
      const TR = 3;
      const turn = sseg(t, 8.4, 9.2);
      const ATT = C.green, RET = C.purple;

      const castleFlash = Math.max(pulse(t, 5.4, 7.4) * 0, 0);
      I.castle(s, cx, cy + 40, 70, { color: castleFlash ? '#5d6472' : '#5d6472' });
      if (t > 5.4 && t < 7.6) s.circle(cx, cy + 5, 70, { stroke: C.green, width: 3, alpha: pulse(t, 5.4, 7.6), glow: 16 });
      if (t > 13.4 && t < 15.6) s.circle(cx, cy + 5, 70, { stroke: C.red, width: 3, alpha: pulse(t, 13.4, 15.6), glow: 16 });

      const msg = (from, to, t0, col) => {
        const p = sseg(t, t0, t0 + 1);
        if (p <= 0 || p >= 1) return;
        const [x1, y1] = G[from], [x2, y2] = G[to];
        s.line(x1, y1 - 30, x2, y2 - 30, { color: col, width: 1.2, alpha: 0.3, dash: [4, 6] });
        const x = lerp(x1, x2, p), y = lerp(y1, y2, p) - 30;
        s.rect(x - 10, y - 7, 20, 14, { fill: col, r: 3, glow: 10 });
      };
      const badge = (i, col, letter, a) => {
        if (a <= 0) return;
        const [x, y] = G[i];
        s.circle(x + 26, y - 50, 14, { fill: col, alpha: a });
        s.text(letter, x + 26, y - 44, { size: 16, align: 'center', color: '#0b0d11', weight: 700, alpha: a });
      };

      // Phase A: alle ehrlich
      const inA = t < 8;
      [1, 2, 3, 4].forEach((j, k) => msg(0, j, 1.6 + k * 0.25, ATT));
      // Phase B: Verräter
      [1, 2, 3, 4].forEach((j, k) => msg(0, j, 9.4 + k * 0.2, ATT));
      msg(TR, 2, 10.8, RET);
      msg(TR, 4, 11, RET);

      // Clone-Positionen (Sybil)
      const clones = [];
      for (let k = 0; k < 12; k++) {
        clones.push([60 + (k % 4) * 40 + (Math.floor(k / 4) % 2) * 20, 372 + Math.floor(k / 4) * 42]);
      }
      const cl = sseg(t, 17, 18.6) * (1 - sseg(t, 32.4, 33));

      G.forEach(([x, y], i) => {
        const col = i === TR ? mix(C.blue, C.red, turn) : C.blue;
        I.person(s, x, y, 58, { color: col, look: x < cx ? 1 : -1 });
        s.text(i === TR && turn > 0.5 ? 'Verräter' : 'General ' + (i + 1), x, y + 22, { size: 15, align: 'center', color: i === TR ? mix(C.ink2, C.red, turn) : C.ink2 });
      });
      clones.forEach(([x, y], k) => {
        const a = clamp(cl * 1.6 - k * 0.05);
        if (a > 0) I.person(s, x, y, 34, { color: C.red, alpha: a * 0.9, eyes: true });
      });

      if (inA) {
        badge(0, ATT, 'A', sseg(t, 1.2, 1.6) * (1 - sseg(t, 7.6, 8)));
        [1, 2, 3, 4].forEach((j, k) => badge(j, ATT, 'A', sseg(t, 2.6 + k * 0.25, 2.9 + k * 0.25) * (1 - sseg(t, 7.6, 8))));
      } else if (t < 16.2) {
        const out = 1 - sseg(t, 15.8, 16.2);
        badge(0, ATT, 'A', sseg(t, 9, 9.4) * out);
        badge(1, ATT, 'A', sseg(t, 10.4, 10.8) * out);
        badge(2, RET, 'R', sseg(t, 11.8, 12.2) * out);
        badge(4, RET, 'R', sseg(t, 12, 12.4) * out);
        badge(TR, C.red, '?', sseg(t, 10.4, 10.8) * out);
      }

      // Abstimmungsbalken
      const bx = 680, bw = 160;
      const vote = (title, aCount, rCount, unit, a) => {
        if (a <= 0) return;
        s.text(title, bx, 150, { size: 19, color: C.ink, alpha: a, weight: 600 });
        const max = Math.max(aCount, rCount, 1);
        s.text('Angriff', bx, 196, { size: 16, color: ATT, alpha: a });
        s.rect(bx, 206, (aCount / max) * bw, 24, { fill: ATT, r: 4, alpha: a });
        s.text(fmt(aCount) + ' ' + unit, bx + (aCount / max) * bw + 8, 224, { size: 16, color: ATT, alpha: a });
        s.text('Rückzug', bx, 268, { size: 16, color: C.red, alpha: a });
        s.rect(bx, 278, (rCount / max) * bw, 24, { fill: C.red, r: 4, alpha: a });
        s.text(fmt(rCount) + ' ' + unit, bx + (rCount / max) * bw + 8, 296, { size: 16, color: C.red, alpha: a });
      };
      const vC = sseg(t, 18.8, 19.6) * (1 - sseg(t, 24.4, 25));
      const nClones = Math.round(12 * clamp(cl * 1.6));
      vote('Abstimmung nach Köpfen', 4, 1 + nClones, 'Stimmen', vC);
      const vD = sseg(t, 25.4, 26.2);
      vote('Abstimmung nach Rechenleistung', 4, 1, 'CPU', vD);

      // Phase D: CPUs
      const cpu = sseg(t, 25, 26);
      if (cpu > 0) {
        G.forEach(([x, y], i) => {
          s.rect(x - 44, y - 44, 22, 22, { fill: '#22303a', stroke: i === TR ? C.red : C.teal, width: 2, r: 4, alpha: cpu });
          s.text('CPU', x - 33, y - 29, { size: 9, align: 'center', color: i === TR ? C.red : C.teal, alpha: cpu, weight: 700 });
        });
        clones.forEach(([x, y]) => s.line(x, y - 20, G[TR][0] - 33, G[TR][1] - 33, { color: C.red, width: 1, alpha: cpu * 0.45 * cl }));
      }

      s.captions(t, [
        [0.4, 4.8, 'Fünf Generäle belagern eine Stadt. Nur wenn alle gleichzeitig angreifen, gewinnen sie.'],
        [5, 8, 'Alle senden «Angriff» – alle sind sich einig. Die Stadt fällt.'],
        [8.6, 13, 'Doch einer ist ein Verräter. Er erzählt der Hälfte, der Befehl laute «Rückzug».'],
        [13.2, 16.4, 'Zwei greifen an, zwei ziehen sich zurück: Niederlage.'],
        [16.8, 24.6, 'Im offenen Internet kann der Verräter beliebig viele Identitäten erzeugen (Sybil-Angriff). Abstimmen nach Köpfen ist wertlos.'],
        [25, 33, 'Satoshis Idee: Jede Stimme kostet Rechenarbeit. Die Klone teilen sich dieselbe CPU – sie gewinnen nichts.']
      ], { y: 525, maxW: 900 });
    }
  });

  /* ======================================================================
     Kapitel 14: Hashfunktion – Lawineneffekt
     ====================================================================== */
  Scenes.define('avalanche', {
    W: 960, H: 380,
    label: 'Der SHA-256-Hash der Eingabe als 64 Hexadezimalzeichen und als Raster aus 256 Bits. Geänderte Bits leuchten auf.',
    setup(s) {
      const st = s.state;
      const wrap = el('label', 'field');
      wrap.innerHTML = '<span>Eingabe – tippe etwas und beobachte den Hash</span>';
      const ta = el('textarea', 'txt');
      ta.rows = 2;
      ta.spellcheck = false;
      ta.value = 'Hallo, Satoshi!';
      wrap.appendChild(ta);
      s.host.insertBefore(wrap, s.box);
      st.bytes = SHA256.bytes(ta.value);
      st.hex = SHA256.toHex(st.bytes);
      st.flash = new Float32Array(256);
      st.hexFlash = new Float32Array(64);
      st.changed = -1;
      const recompute = () => {
        const nb = SHA256.bytes(ta.value);
        let c = 0;
        for (let i = 0; i < 256; i++) {
          const a = (st.bytes[i >> 3] >> (7 - (i & 7))) & 1;
          const b = (nb[i >> 3] >> (7 - (i & 7))) & 1;
          if (a !== b) { st.flash[i] = 1; c++; }
        }
        const nh = SHA256.toHex(nb);
        for (let i = 0; i < 64; i++) if (nh[i] !== st.hex[i]) st.hexFlash[i] = 1;
        st.bytes = nb; st.hex = nh; st.changed = c;
      };
      ta.addEventListener('input', recompute);
      s.button('Ein Zeichen ändern', () => {
        const v = ta.value;
        if (!v) { ta.value = 'a'; } else {
          const last = v.charCodeAt(v.length - 1);
          ta.value = v.slice(0, -1) + String.fromCharCode(last === 33 ? 63 : last === 63 ? 33 : last + 1);
        }
        recompute();
      });
      s.button('Zurücksetzen', () => { ta.value = 'Hallo, Satoshi!'; recompute(); });
    },
    update(s, dt) {
      const st = s.state;
      for (let i = 0; i < 256; i++) st.flash[i] = Math.max(0, st.flash[i] - dt * 0.7);
      for (let i = 0; i < 64; i++) st.hexFlash[i] = Math.max(0, st.hexFlash[i] - dt * 0.7);
    },
    draw(s) {
      const st = s.state;
      s.text('SHA-256 (64 Hex-Zeichen)', 32, 36, { size: 15, color: C.dim });
      for (let i = 0; i < 64; i++) {
        s.text(st.hex[i], 32 + i * 13.95, 70, { size: 21, mono: true, color: mix(C.ink2, C.yellow, st.hexFlash[i]) });
      }
      s.text('dieselben 256 Bits (blau = 1)', 32, 104, { size: 15, color: C.dim });
      const cs = 26, gp = 2.06;
      for (let i = 0; i < 256; i++) {
        const x = 32 + (i % 32) * (cs + gp), y = 116 + Math.floor(i / 32) * (cs + gp);
        const bit = (st.bytes[i >> 3] >> (7 - (i & 7))) & 1;
        s.rect(x, y, cs, cs, { fill: bit ? rgba(C.blue, 0.85) : '#171c24', r: 4 });
        if (st.flash[i] > 0) s.rect(x, y, cs, cs, { fill: C.yellow, r: 4, alpha: st.flash[i] * 0.9 });
      }
      const msg = st.changed < 0 ? 'Ändere die Eingabe um ein einziges Zeichen …'
        : `${st.changed} von 256 Bits haben sich geändert (${fmt((st.changed / 256) * 100)} %) – im Schnitt ist es die Hälfte.`;
      s.text(msg, 480, 364, { size: 18, align: 'center', color: st.changed < 0 ? C.dim : C.yellow, italic: true });
    }
  });

  /* ======================================================================
     Kapitel 15: Hash-Lotterie auf dem Zahlenstrahl
     ====================================================================== */
  Scenes.define('hashspace', {
    W: 960, H: 360,
    label: 'Zahlenstrahl von 0 bis 2 hoch 256. Zufällige Hash-Versuche fallen darauf. Nur Treffer im kleinen grünen Zielbereich zählen.',
    setup(s) {
      const st = s.state;
      st.k = 3; st.drops = []; st.tries = 0; st.hits = 0; st.acc = 0; st.bursts = [];
      s.slider({ label: 'Zielbereich', min: 1, max: 6, value: 3, step: 1, format: (v) => '1 / ' + Math.pow(2, v), onInput: (v) => { st.k = v; st.tries = 0; st.hits = 0; } });
    },
    update(s, dt) {
      const st = s.state;
      const f = Math.pow(2, -st.k);
      st.acc += dt * 14;
      while (st.acc >= 1) { st.acc -= 1; st.drops.push({ x: Math.random(), t: 0, landed: false }); }
      st.drops.forEach((d) => {
        d.t += dt;
        if (!d.landed && d.t >= 0.55) {
          d.landed = true;
          st.tries++;
          if (d.x < f) { st.hits++; d.hit = true; st.bursts.push({ x: d.x, t: 0 }); }
        }
      });
      st.drops = st.drops.filter((d) => d.t < (d.hit ? 3 : 1.6));
      st.bursts.forEach((b) => { b.t += dt; });
      st.bursts = st.bursts.filter((b) => b.t < 1.2);
    },
    draw(s) {
      const st = s.state, f = Math.pow(2, -st.k);
      const x0 = 60, x1 = 900, y = 240;
      const X = (v) => x0 + v * (x1 - x0);
      s.rect(x0, y - 12, X(f) - x0, 24, { fill: rgba(C.green, 0.25) });
      s.line(X(f), y - 40, X(f), y + 24, { color: C.green, width: 2, dash: [5, 5] });
      s.text('Ziel', X(f) + 6, y - 28, { size: 16, color: C.green });
      s.line(x0, y, x1, y, { color: C.ink2, width: 2 });
      s.text('0', x0, y + 36, { size: 18, align: 'center', color: C.dim });
      s.text('2' + sup(256), x1, y + 36, { size: 18, align: 'center', color: C.dim });
      s.text('alle möglichen Hash-Werte', (x0 + x1) / 2, y + 36, { size: 16, align: 'center', color: C.dim, italic: true });
      st.drops.forEach((d) => {
        const x = X(d.x);
        if (!d.landed) {
          const yy = lerp(30, y, easeIn(d.t / 0.55));
          s.circle(x, yy, 4, { fill: C.ink2, alpha: 0.85 });
        } else {
          const a = 1 - (d.t - 0.55) / (d.hit ? 2.4 : 1.05);
          s.circle(x, y, d.hit ? 7 : 4, { fill: d.hit ? C.yellow : C.dim, alpha: clamp(a), glow: d.hit ? 14 : 0 });
        }
      });
      st.bursts.forEach((b) => {
        s.circle(X(b.x), y, 8 + b.t * 50, { stroke: C.yellow, width: 2, alpha: 1 - b.t / 1.2 });
        s.text('Treffer!', X(b.x) + 10, y - 50 - b.t * 20, { size: 18, color: C.yellow, alpha: 1 - b.t / 1.2, weight: 600 });
      });
      s.text('Versuche: ' + fmt(st.tries), 40, 40, { size: 18, color: C.ink2 });
      s.text('Treffer: ' + fmt(st.hits), 40, 66, { size: 18, color: C.yellow });
      const avg = st.hits ? st.tries / st.hits : null;
      s.text('Ø Versuche pro Treffer: ' + (avg ? fmt(avg, 1) : '–') + '  (erwartet: ' + Math.pow(2, st.k) + ')', 920, 40, { size: 18, align: 'right', color: C.ink2 });
      s.text('Halbiert man den Zielbereich, verdoppelt sich die nötige Arbeit.', 920, 66, { size: 16, align: 'right', color: C.dim, italic: true });
    }
  });

  /* ======================================================================
     Kapitel 15: Mining-Demo (echtes SHA-256 im Browser)
     ====================================================================== */
  const ZERO64 = '0'.repeat(64);
  function fmtHash(h, d) {
    let z = 0;
    while (z < h.length && h[z] === '0') z++;
    const ok = z >= d;
    return `<span class="${ok ? 'z' : ''}">${h.slice(0, z)}</span>${h.slice(z)}`;
  }

  Scenes.define('miner', {
    widget(host, stage) {
      const box = el('div', 'widget');
      box.innerHTML = `
        <div class="miner-grid">
          <div>
            <label class="field"><span>Block-Nummer</span><input class="txt" data-k="num" value="1" readonly></label>
            <label class="field"><span>Hash des vorherigen Blocks</span><input class="txt" data-k="prev" value="${ZERO64}" readonly></label>
            <label class="field"><span>Daten (Transaktionen) – frei editierbar</span><textarea class="txt" data-k="data" rows="2" spellcheck="false">Alice zahlt Bob 0.5 BTC</textarea></label>
            <label class="field"><span>Nonce</span><input class="txt" data-k="nonce" value="0" readonly></label>
            <div class="field"><span>Hash dieses Blocks</span><div class="hashout" data-k="hash"></div></div>
            <div class="miner-actions">
              <span style="font-size:14px;color:var(--dim)">Schwierigkeit (führende Nullen):</span>
              <div class="ctl-seg" data-k="diff">${[1, 2, 3, 4, 5, 6].map((d) => `<button type="button" data-d="${d}">${d}</button>`).join('')}</div>
            </div>
            <div class="miner-actions" style="margin-top:12px">
              <button type="button" class="ctl-btn btc" data-k="go">⛏ Minen</button>
              <button type="button" class="ctl-btn" data-k="stop" disabled>Stopp</button>
            </div>
            <div class="found" data-k="found" hidden></div>
          </div>
          <div>
            <div class="miner-stats">
              <div class="stat"><span>Versuche</span><b data-k="tries">0</b></div>
              <div class="stat"><span>Hashes pro Sekunde</span><b data-k="rate">–</b></div>
              <div class="stat"><span>Erwartet (16^k)</span><b data-k="exp">–</b></div>
              <div class="stat"><span>Zeit</span><b data-k="time">0.0 s</b></div>
            </div>
            <div class="miner-rain" data-k="rain" aria-hidden="true"></div>
          </div>
        </div>
        <p class="widget-note">Dein Browser berechnet hier echtes SHA-256. Jede zusätzliche Null bedeutet im Schnitt 16-mal mehr Versuche. Das Bitcoin-Netzwerk schafft rund 10<sup>21</sup> Versuche pro Sekunde.</p>`;
      host.insertBefore(box, host.querySelector('figcaption'));
      const q = {};
      box.querySelectorAll('[data-k]').forEach((n) => { q[n.dataset.k] = n; });
      let diff = 4, nonce = 0, running = false, tries = 0, t0 = 0, rain = [];
      const msg = (n) => `${q.num.value}|${q.prev.value}|${q.data.value}|${n}`;
      const setDiff = (d) => {
        diff = d;
        q.diff.querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.d === d));
        q.exp.textContent = fmt(Math.pow(16, d));
        show();
      };
      const show = () => {
        const h = SHA256.hex(msg(nonce));
        q.nonce.value = String(nonce);
        q.hash.innerHTML = fmtHash(h, diff);
        return h;
      };
      const stop = () => {
        running = false;
        q.go.disabled = false;
        q.stop.disabled = true;
      };
      const step = () => {
        if (!running) return;
        if (!stage.active) { stop(); return; }
        const target = '0'.repeat(diff);
        const end = performance.now() + 12;
        let h = '';
        let found = false;
        while (performance.now() < end) {
          for (let k = 0; k < 200; k++) {
            h = SHA256.hex(msg(nonce));
            tries++;
            if (h.startsWith(target)) { found = true; break; }
            nonce++;
          }
          if (found) break;
        }
        const el2 = (performance.now() - t0) / 1000;
        q.tries.textContent = fmt(tries);
        q.rate.textContent = fmt(tries / Math.max(el2, 1e-3));
        q.time.textContent = fmt(el2, 1) + ' s';
        q.nonce.value = String(nonce);
        q.hash.innerHTML = fmtHash(h, diff);
        rain.unshift(`<div class="${found ? 'hit' : ''}">${nonce} → ${h}</div>`);
        rain = rain.slice(0, 14);
        q.rain.innerHTML = rain.join('');
        if (found) {
          stop();
          q.found.hidden = false;
          q.found.innerHTML = `✓ Block gefunden! Nonce <b>${fmt(nonce)}</b> nach ${fmt(tries)} Versuchen in ${fmt(el2, 1)} s. Prüfen kostet dagegen genau <b>einen</b> Hash.`;
          return;
        }
        requestAnimationFrame(step);
      };
      q.go.addEventListener('click', () => {
        if (running) return;
        running = true;
        tries = 0;
        nonce = 0;
        t0 = performance.now();
        rain = [];
        q.found.hidden = true;
        q.go.disabled = true;
        q.stop.disabled = false;
        requestAnimationFrame(step);
      });
      q.stop.addEventListener('click', stop);
      q.diff.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { stop(); setDiff(+b.dataset.d); } });
      q.data.addEventListener('input', () => { stop(); nonce = 0; q.found.hidden = true; show(); });
      setDiff(4);
    }
  });

  /* ======================================================================
     Kapitel 16: Blockchain-Demo (nach Anders Brownworth)
     ====================================================================== */
  const CHAIN_DIFF = 3;
  Scenes.define('chain', {
    widget(host) {
      const data = ['Satoshi → Hal: 10 BTC', 'Laszlo → Jeremy: 10’000 BTC (2 Pizzen)', 'Alice → Bob: 0.5 BTC', 'Bob → Carol: 0.2 BTC'];
      const wrap = el('div', 'chain');
      host.insertBefore(wrap, host.querySelector('figcaption'));
      const blocks = data.map((d, i) => {
        const b = el('div', 'blk');
        b.innerHTML = `
          <h5>Block #${i + 1} <span class="tag">gültig</span></h5>
          <label class="field"><span>Nonce</span><input class="txt" type="number" min="0" data-k="nonce" value="0"></label>
          <label class="field"><span>Daten</span><textarea class="txt" rows="2" data-k="data" spellcheck="false"></textarea></label>
          <div class="field"><span>Vorheriger Hash</span><div class="hashout" data-k="prev"></div></div>
          <div class="field"><span>Hash</span><div class="hashout" data-k="hash"></div></div>
          <button type="button" class="ctl-btn" data-k="mine">⛏ Minen</button>`;
        wrap.appendChild(b);
        const q = { el: b, tag: b.querySelector('.tag') };
        b.querySelectorAll('[data-k]').forEach((n) => { q[n.dataset.k] = n; });
        q.data.value = d;
        return q;
      });
      const target = '0'.repeat(CHAIN_DIFF);
      const hashOf = (i, nonce, prev) => SHA256.hex(`${i + 1}|${nonce}|${blocks[i].data.value}|${prev}`);
      const recompute = () => {
        let prev = ZERO64;
        blocks.forEach((b, i) => {
          const h = hashOf(i, b.nonce.value, prev);
          const ok = h.startsWith(target);
          b.prev.textContent = prev;
          b.hash.innerHTML = fmtHash(h, CHAIN_DIFF);
          b.el.classList.toggle('bad', !ok);
          b.tag.textContent = ok ? 'gültig' : 'ungültig';
          prev = h;
        });
      };
      const mine = (i) => {
        let prev = ZERO64;
        for (let j = 0; j < i; j++) prev = hashOf(j, blocks[j].nonce.value, prev);
        let n = 0;
        while (!hashOf(i, n, prev).startsWith(target)) n++;
        blocks[i].nonce.value = n;
      };
      blocks.forEach((b, i) => {
        b.data.addEventListener('input', recompute);
        b.nonce.addEventListener('input', recompute);
        b.mine.addEventListener('click', () => { mine(i); recompute(); });
      });
      blocks.forEach((_, i) => mine(i));
      recompute();
      const note = el('p', 'widget-note');
      note.innerHTML = 'Gültig ist ein Block, wenn sein Hash mit ' + CHAIN_DIFF + ' Nullen beginnt (in dieser Demo – bei Bitcoin sind es heute rund 19 hexadezimale Nullen). <button type="button" class="ctl-btn" style="margin-left:6px;padding:5px 10px">Alles zurücksetzen</button>';
      host.insertBefore(note, host.querySelector('figcaption'));
      note.querySelector('button').addEventListener('click', () => { blocks.forEach((b, i) => { b.data.value = data[i]; }); blocks.forEach((_, i) => mine(i)); recompute(); });
    }
  });

  /* ======================================================================
     Kapitel 16: Wettrennen des Angreifers (Whitepaper, Abschnitt 11)
     ====================================================================== */
  function attackP(q, z) {
    const p = 1 - q;
    if (q >= p) return 1;
    const lam = z * (q / p);
    let sum = 1;
    for (let k = 0; k <= z; k++) {
      let po = Math.exp(-lam);
      for (let i = 1; i <= k; i++) po *= lam / i;
      sum -= po * (1 - Math.pow(q / p, z - k));
    }
    return Math.max(0, sum);
  }
  window.Engine.attackP = attackP;

  function pctLabel(P) {
    const pct = P * 100;
    if (pct >= 99.95) return '100 %';
    if (pct >= 10) return fmt(pct, 1) + ' %';
    if (pct >= 0.0001) {
      const d = Math.max(0, 1 - Math.floor(Math.log10(pct)));
      return fmt(pct, d) + ' %';
    }
    const e = Math.floor(Math.log10(pct));
    return fmt(pct / Math.pow(10, e), 1) + ' · 10' + sup(e) + ' %';
  }

  Scenes.define('race', {
    W: 960, H: 560,
    label: 'Diagramm der Erfolgswahrscheinlichkeit eines Angreifers abhängig von der Anzahl Bestätigungen, dazu ein simuliertes Wettrennen zwischen ehrlicher Kette und Angreifer.',
    setup(s) {
      const st = s.state;
      st.q = 0.1; st.z = 6;
      st.runs = 0; st.wins = 0;
      const reset = () => { st.hon = 0; st.att = 0; st.acc = 0; st.done = null; st.pause = 0; };
      reset();
      st.reset = reset;
      s.slider({ label: 'Rechenleistung des Angreifers q', min: 1, max: 49, step: 1, value: 10, format: (v) => v + ' %', onInput: (v) => { st.q = v / 100; st.runs = 0; st.wins = 0; reset(); } });
      s.slider({ label: 'Bestätigungen z', min: 0, max: 12, step: 1, value: 6, format: (v) => String(v), onInput: (v) => { st.z = v; st.runs = 0; st.wins = 0; reset(); } });
    },
    update(s, dt) {
      const st = s.state;
      if (st.done) {
        st.pause += dt;
        if (st.pause > 0.9) st.reset();
        return;
      }
      st.acc += dt;
      while (st.acc > 0.07 && !st.done) {
        st.acc -= 0.07;
        if (Math.random() < 1 - st.q) st.hon++; else st.att++;
        const accepted = st.hon >= st.z;
        if (accepted && st.att >= st.hon) { st.done = 'win'; st.runs++; st.wins++; }
        else if (st.hon - st.att > st.z + 14 || st.hon > 160) { st.done = 'lose'; st.runs++; }
      }
    },
    draw(s) {
      const st = s.state;
      const ax = { x: 120, y: 60, w: 430, h: 260 };
      const L0 = -12, L1 = 0;
      ax.X = (z) => ax.x + 18 + (z / 12) * (ax.w - 36);
      ax.Y = (P) => ax.y + ax.h - ((Math.max(Math.log10(Math.max(P, 1e-14)), L0) - L0) / (L1 - L0)) * ax.h;
      s.axes(ax, {
        xticks: [0, 2, 4, 6, 8, 10, 12].map((z) => [z, String(z)]),
        yticks: [[1, '100 %'], [1e-2, '1 %'], [1e-4, '0.01 %'], [1e-6, '10' + sup(-4) + ' %'], [1e-8, '10' + sup(-6) + ' %'], [1e-10, '10' + sup(-8) + ' %'], [1e-12, '10' + sup(-10) + ' %']],
        grid: true, tickSize: 14
      });
      s.text('Erfolgschance des Angreifers', ax.x, 36, { size: 18, color: C.ink2 });
      s.text('Bestätigungen z', ax.x + ax.w, ax.y + ax.h + 48, { size: 15, align: 'right', color: C.dim });
      for (let z = 0; z <= 12; z++) {
        const P = attackP(st.q, z);
        const X = ax.X(z), Y = ax.Y(P);
        const on = z === st.z;
        s.rect(X - 11, Y, 22, ax.y + ax.h - Y, { fill: on ? C.yellow : rgba(C.blue, 0.55), r: 3 });
      }
      const P = attackP(st.q, st.z);
      const rx = 600;
      s.text('Angreifer mit ' + Math.round(st.q * 100) + ' % der Rechenleistung,', rx, 92, { size: 19, color: C.ink2 });
      s.text('Händler wartet ' + st.z + ' Bestätigung' + (st.z === 1 ? '' : 'en') + ':', rx, 120, { size: 19, color: C.ink2 });
      s.text(pctLabel(P), rx, 186, { size: 46, color: C.yellow, weight: 600 });
      s.text(P >= 0.9995 ? 'Der Angriff gelingt sicher.' : 'also etwa 1 zu ' + fmt(1 / P), rx, 220, { size: 19, color: C.dim });
      s.text('Simuliert: ' + st.wins + ' von ' + st.runs + ' Angriffen erfolgreich', rx, 270, { size: 17, color: C.ink2 });
      s.text('(Formel von Satoshi Nakamoto, Whitepaper §11)', rx, 296, { size: 14, color: C.faint, italic: true });

      // Rennen
      const y1 = 418, y2 = 478, sq = 18, gap = 4, x0 = 170;
      const maxShow = 34;
      const start = Math.max(0, Math.max(st.hon, st.att) - maxShow);
      s.text('Ehrliche Kette', x0 - 16, y1 + 14, { size: 16, align: 'right', color: C.green });
      s.text('Angreifer', x0 - 16, y2 + 14, { size: 16, align: 'right', color: C.red });
      for (let i = start; i < st.hon; i++) {
        const x = x0 + (i - start) * (sq + gap);
        s.rect(x, y1, sq, sq, { fill: i === 0 ? C.yellow : rgba(C.green, 0.8), r: 3 });
      }
      for (let i = start; i < st.att; i++) {
        const x = x0 + (i - start) * (sq + gap);
        s.rect(x, y2, sq, sq, { fill: rgba(C.red, 0.8), r: 3 });
      }
      if (st.z > 0 && st.z - 1 >= start) {
        const x = x0 + (st.z - 1 - start) * (sq + gap) + sq / 2;
        s.line(x, y1 - 10, x, y2 + sq + 6, { color: C.yellow, width: 1.5, dash: [4, 4] });
        s.text('Händler liefert', x, y1 - 16, { size: 14, align: 'center', color: C.yellow });
      }
      if (st.done) {
        const a = clamp(st.pause * 3);
        s.text(st.done === 'win' ? 'Angreifer holt auf – Doppelausgabe gelungen!' : 'Angreifer gibt auf.', 480, 540, { size: 18, align: 'center', color: st.done === 'win' ? C.red : C.green, alpha: a, weight: 600 });
      } else s.text('Der gelbe Block enthält die Zahlung an den Händler.', 480, 540, { size: 15, align: 'center', color: C.dim, italic: true });
    }
  });

  /* ======================================================================
     Kapitel 17: Elliptische Kurve – Punktaddition
     ====================================================================== */
  const FP = 199;
  function modp(a) { return ((a % FP) + FP) % FP; }
  function inv(a) { let r = 1, b = modp(a), e = FP - 2; while (e > 0) { if (e & 1) r = (r * b) % FP; b = (b * b) % FP; e >>= 1; } return r; }
  function addF(P, Q) {
    if (!P) return Q;
    if (!Q) return P;
    const [x1, y1] = P, [x2, y2] = Q;
    if (x1 === x2 && modp(y1 + y2) === 0) return null;
    let m;
    if (x1 === x2 && y1 === y2) m = modp(3 * x1 * x1 * inv(2 * y1));
    else m = modp(modp(y2 - y1) * inv(x2 - x1));
    const x3 = modp(m * m - x1 - x2);
    const y3 = modp(m * (x1 - x3) - y1);
    return [x3, y3];
  }
  const FIELD = (() => {
    const sq = {};
    for (let y = 0; y < FP; y++) (sq[(y * y) % FP] = sq[(y * y) % FP] || []).push(y);
    const pts = [];
    for (let x = 0; x < FP; x++) { const r = (x * x * x + 7) % FP; (sq[r] || []).forEach((y) => pts.push([x, y])); }
    let best = null, bestOrd = 0;
    for (let i = 0; i < pts.length; i += 7) {
      let P = pts[i], k = 1;
      while (P && k < 400) { P = addF(P, pts[i]); k++; }
      if (k > bestOrd) { bestOrd = k; best = pts[i]; }
    }
    const seq = [best];
    for (let k = 1; k < 36; k++) seq.push(addF(seq[k - 1], best));
    return { pts, G: best, seq: seq.filter(Boolean), order: bestOrd };
  })();

  Scenes.define('ecc', {
    W: 960, H: 540, duration: 25,
    label: 'Die elliptische Kurve y² = x³ + 7: Zwei Punkte P und Q werden addiert. Danach dieselbe Kurve über einem endlichen Feld, wo Vielfache eines Punktes scheinbar zufällig springen.',
    draw(s, t) {
      const X = (x) => 60 + ((x + 3) / 8.5) * 840;
      const Y = (y) => 270 - y * 17;
      const xmin = -Math.cbrt(7), xmax = 5.5, Lr = xmax - xmin;
      const fr = (x) => Math.sqrt(Math.max(0, x * x * x + 7));
      const real = 1 - sseg(t, 11.6, 12.6);
      if (real > 0) s.alpha(real, () => {
        const a0 = sseg(t, 0, 1);
        s.line(40, Y(0), 920, Y(0), { color: C.faint, width: 1.5, alpha: a0 });
        s.line(X(0), 20, X(0), 520, { color: C.faint, width: 1.5, alpha: a0 });
        for (let k = -2; k <= 5; k++) if (k) s.text(String(k), X(k), Y(0) + 22, { size: 14, align: 'center', color: C.dim, alpha: a0 });
        const curve = [];
        for (let i = 60; i >= 0; i--) { const x = xmin + Math.pow(i / 60, 2) * Lr; curve.push([X(x), Y(-fr(x))]); }
        for (let i = 1; i <= 60; i++) { const x = xmin + Math.pow(i / 60, 2) * Lr; curve.push([X(x), Y(fr(x))]); }
        s.poly(curve, { stroke: C.blue, width: 3.5, progress: sseg(t, 1, 3.4), glow: 8 });
        s.text('y² = x³ + 7', 80, 60, { size: 30, color: C.blue, italic: true, alpha: sseg(t, 3, 3.8) });
        s.text('die Kurve von Bitcoin (secp256k1)', 80, 88, { size: 16, color: C.dim, alpha: sseg(t, 3.2, 4) });
        const P = [-1.8, fr(-1.8)], Q = [0.5, fr(0.5)];
        const m = (Q[1] - P[1]) / (Q[0] - P[0]);
        const x3 = m * m - P[0] - Q[0];
        const R1 = [x3, P[1] + m * (x3 - P[0])];
        const S = [x3, -R1[1]];
        const pa = sseg(t, 4, 4.8);
        const lx0 = -2.7, lx1 = 2.6;
        s.line(X(lx0), Y(P[1] + m * (lx0 - P[0])), X(lx1), Y(P[1] + m * (lx1 - P[0])), { color: C.yellow, width: 2.5, progress: sseg(t, 5, 6.8) });
        s.circle(X(P[0]), Y(P[1]), 7, { fill: C.yellow, alpha: pa });
        s.text('P', X(P[0]) - 14, Y(P[1]) - 12, { size: 24, color: C.yellow, italic: true, alpha: pa, align: 'right' });
        s.circle(X(Q[0]), Y(Q[1]), 7, { fill: C.yellow, alpha: pa });
        s.text('Q', X(Q[0]) - 6, Y(Q[1]) - 16, { size: 24, color: C.yellow, italic: true, alpha: pa, align: 'right' });
        const ra = sseg(t, 6.8, 7.5);
        s.circle(X(R1[0]), Y(R1[1]), 7, { stroke: C.ink, width: 2.5, alpha: ra });
        s.text('dritter Schnittpunkt', X(R1[0]) + 14, Y(R1[1]) - 10, { size: 17, color: C.ink2, alpha: ra });
        s.line(X(R1[0]), Y(R1[1]), X(S[0]), Y(S[1]), { color: C.ink2, width: 2, dash: [6, 6], progress: sseg(t, 7.6, 8.8) });
        const sa = sseg(t, 8.6, 9.2);
        s.circle(X(S[0]), Y(S[1]), 9, { fill: C.gold, alpha: sa, glow: 16 });
        s.text('P + Q', X(S[0]) + 16, Y(S[1]) + 8, { size: 26, color: C.gold, italic: true, alpha: sa, weight: 600 });
      });

      const fa = sseg(t, 12, 13);
      if (fa > 0) s.alpha(fa, () => {
        const FX = (x) => 150 + (x / FP) * 700, FY = (y) => 480 - (y / FP) * 380;
        s.text('y² ≡ x³ + 7  (mod ' + FP + ')', 40, 50, { size: 24, color: C.blue, italic: true });
        s.text('dieselbe Gleichung, aber mit ganzen Zahlen «modulo p»', 40, 76, { size: 15, color: C.dim });
        s.rect(FX(0) - 8, FY(FP) - 8, 716, 396, { stroke: C.grid, width: 1.5, r: 6 });
        FIELD.pts.forEach(([x, y]) => s.circle(FX(x), FY(y), 2.6, { fill: rgba(C.blue, 0.55) }));
        const kt = Math.max(0, (t - 13.4) / 0.24);
        const kMax = Math.min(FIELD.seq.length, Math.floor(kt) + 1);
        for (let k = 1; k < kMax; k++) {
          const [ax, ay] = FIELD.seq[k - 1], [bx, by] = FIELD.seq[k];
          s.line(FX(ax), FY(ay), FX(bx), FY(by), { color: C.yellow, width: 1.2, alpha: 0.18 + 0.5 * (k / kMax) });
        }
        if (t > 13.2) {
          const [gx, gy] = FIELD.seq[0];
          s.circle(FX(gx), FY(gy), 7, { fill: C.green, glow: 10 });
          s.text('G', FX(gx) + 10, FY(gy) - 8, { size: 20, color: C.green, italic: true, weight: 600 });
          const k = Math.max(1, kMax);
          const [cx, cy] = FIELD.seq[k - 1];
          s.circle(FX(cx), FY(cy), 8, { fill: C.gold, glow: 16 });
          s.text(k + '·G', FX(cx) + 12, FY(cy) + 22, { size: 18, color: C.gold, weight: 600 });
          s.text('k = ' + k, 920, 50, { size: 26, align: 'right', color: C.gold, weight: 600 });
        }
      });

      const fin = sseg(t, 21.6, 22.4);
      if (fin > 0) {
        s.rect(150, 190, 660, 150, { fill: 'rgba(10,12,16,0.92)', stroke: C.faint, width: 1.5, r: 14, alpha: fin });
        s.text('privater Schlüssel', 260, 240, { size: 20, align: 'center', color: C.dim, alpha: fin });
        s.text('k', 260, 290, { size: 44, align: 'center', color: C.gold, italic: true, alpha: fin, weight: 600 });
        s.text('öffentlicher Schlüssel', 700, 240, { size: 20, align: 'center', color: C.dim, alpha: fin });
        s.text('k · G', 700, 290, { size: 44, align: 'center', color: C.blue, italic: true, alpha: fin, weight: 600 });
        s.arrow(340, 262, 600, 262, { color: C.green, width: 3, alpha: fin });
        s.text('leicht', 470, 252, { size: 18, align: 'center', color: C.green, alpha: fin });
        s.arrow(600, 300, 340, 300, { color: C.red, width: 3, alpha: fin, dash: [6, 6] });
        s.text('praktisch unmöglich', 470, 326, { size: 18, align: 'center', color: C.red, alpha: fin });
      }

      s.captions(t, [
        [4, 6.6, 'Nimm zwei Punkte P und Q auf der Kurve und lege eine Gerade hindurch.'],
        [6.8, 9.2, 'Die Gerade schneidet die Kurve ein drittes Mal. Spiegle diesen Punkt an der x-Achse …'],
        [9.4, 11.6, '… und du erhältst P + Q. So «addiert» man Punkte auf einer elliptischen Kurve.'],
        [13.2, 21.4, 'Im endlichen Feld springt G, 2G, 3G, … scheinbar zufällig umher. Bei Bitcoin ist k eine Zahl mit 77 Stellen.'],
        [22, 25, 'Vorwärts rechnen dauert Millisekunden. Rückwärts bräuchte man länger als das Universum alt ist.']
      ], { y: 526 });
    }
  });

  /* ======================================================================
     Kapitel 18: Geldmenge und Inflationsrate von Bitcoin
     ====================================================================== */
  const HALV = [[2009.01, 0], [2012.91, 210000], [2016.52, 420000], [2020.36, 630000], [2024.30, 840000]];
  function heightAt(y) {
    if (y <= HALV[0][0]) return 0;
    for (let i = 0; i < HALV.length - 1; i++) {
      if (y <= HALV[i + 1][0]) return lerp(HALV[i][1], HALV[i + 1][1], (y - HALV[i][0]) / (HALV[i + 1][0] - HALV[i][0]));
    }
    return 840000 + (y - 2024.30) * 52560;
  }
  function supplyAt(h) {
    let sum = 0, r = 50, rem = h;
    while (rem > 0 && r > 1e-9) { const b = Math.min(rem, 210000); sum += b * r; rem -= b; r /= 2; }
    return sum;
  }
  const nowYear = () => { const d = new Date(); return d.getUTCFullYear() + (d - Date.UTC(d.getUTCFullYear(), 0, 1)) / (365.25 * 864e5); };
  window.Engine.btcSupplyNow = () => supplyAt(heightAt(nowYear()));
  window.Engine.btcHeightNow = () => Math.round(840000 + (Date.now() / 1000 - 1713571767) / 600);

  Scenes.define('supply', {
    W: 960, H: 540, duration: 14,
    label: 'Die Bitcoin-Geldmenge wächst in Stufen gegen 21 Millionen. Darunter fällt die jährliche Inflationsrate bei jeder Halbierung und unterschreitet die von Gold.',
    draw(s, t) {
      const ax = { x: 110, y: 60, w: 790, h: 210 };
      const x0 = 2009, x1 = 2060;
      ax.X = (y) => ax.x + ((y - x0) / (x1 - x0)) * ax.w;
      ax.Y = (v) => ax.y + ax.h - (v / 21e6) * ax.h;
      const ax2 = { x: 110, y: 330, w: 790, h: 140, X: ax.X };
      ax2.Y = (v) => ax2.y + ax2.h - (Math.min(v, 15) / 15) * ax2.h;
      const a0 = sseg(t, 0, 1);
      const xt = [2010, 2020, 2030, 2040, 2050, 2060].map((y) => [y, String(y)]);
      s.axes(ax, { alpha: a0, yticks: [[0, '0'], [5e6, '5 Mio.'], [10.5e6, '10.5 Mio.'], [15.75e6, '15.75 Mio.'], [21e6, '21 Mio.']], grid: true, tickSize: 14 });
      s.axes(ax2, { alpha: a0, xticks: xt, yticks: [[0, '0 %'], [5, '5 %'], [10, '10 %'], [15, '≥ 15 %']], grid: true, tickSize: 14 });
      s.text('Anzahl Bitcoin', ax.x, 40, { size: 18, color: C.ink2, alpha: a0 });
      s.text('Neue Bitcoin pro Jahr in % der Geldmenge (Inflationsrate)', ax2.x, ax2.y - 16, { size: 18, color: C.ink2, alpha: a0 });
      const halvs = [2012.91, 2016.52, 2020.36, 2024.30];
      for (let k = 1; k <= 8; k++) halvs.push(2024.30 + k * 3.993);
      const rewards = ['50', '25', '12.5', '6.25', '3.125', '1.56'];
      halvs.forEach((h, i) => {
        if (h > x1) return;
        s.line(ax.X(h), ax.y, ax.X(h), ax2.y + ax2.h, { color: C.faint, width: 1, dash: [3, 5], alpha: a0 * 0.8 });
      });
      [2009.01].concat(halvs).slice(0, 6).forEach((h, i) => {
        const nx = i < 5 ? [2009.01].concat(halvs)[i + 1] : h + 4;
        s.text(rewards[i], ax.X((h + nx) / 2), ax.y + ax.h - 8, { size: 13, align: 'center', color: C.dim, alpha: sseg(t, 1.6 + i * 0.5, 2.2 + i * 0.5) });
      });
      s.text('Belohnung pro Block (BTC):', ax.X(2009.2), ax.y + ax.h - 28, { size: 13, color: C.dim, alpha: sseg(t, 1.4, 2) });
      const pts = [];
      for (let y = x0; y <= x1; y += 0.1) pts.push([ax.X(y), ax.Y(supplyAt(heightAt(y)))]);
      s.poly(pts, { stroke: C.btc, width: 3.5, progress: sseg(t, 1, 6), glow: 8 });
      s.line(ax.x, ax.Y(21e6), ax.x + ax.w, ax.Y(21e6), { color: C.btc, width: 1.2, dash: [6, 6], alpha: sseg(t, 5, 6) });
      const inf = [];
      for (let y = 2010; y <= x1; y += 0.1) {
        const a = supplyAt(heightAt(y)), b = supplyAt(heightAt(y + 1));
        inf.push([ax2.X(y), ax2.Y(((b - a) / a) * 100)]);
      }
      s.poly(inf, { stroke: C.btc, width: 3, progress: sseg(t, 6.4, 10), glow: 6 });
      const ga = sseg(t, 10, 11);
      s.line(ax2.x, ax2.Y(1.7), ax2.x + ax2.w, ax2.Y(1.7), { color: C.gold, width: 2, dash: [8, 6], alpha: ga });
      s.text('Gold ≈ 1.7 % pro Jahr', ax2.x + ax2.w, ax2.Y(1.7) - 8, { size: 15, align: 'right', color: C.gold, alpha: ga });
      const ny = nowYear();
      const na = sseg(t, 6, 6.8);
      if (ny < x1) {
        const sup0 = supplyAt(heightAt(ny));
        s.line(ax.X(ny), ax.y - 6, ax.X(ny), ax2.y + ax2.h, { color: C.yellow, width: 2, alpha: na });
        s.text('heute ≈ ' + fmt(sup0 / 1e6, 2) + ' Mio. (' + fmt((sup0 / 21e6) * 100, 1) + ' %)', ax.X(ny) + 8, ax.Y(sup0) + 30, { size: 15, color: C.yellow, alpha: na });
        const a = supplyAt(heightAt(ny)), b = supplyAt(heightAt(ny + 1));
        s.text(fmt(((b - a) / a) * 100, 2) + ' %', ax.X(ny) + 8, ax2.Y(((b - a) / a) * 100) - 10, { size: 15, color: C.yellow, alpha: sseg(t, 9, 10) });
      }
      s.captions(t, [[11.4, 14, 'Die letzte Bitcoin-Belohnung wird um das Jahr 2140 ausgezahlt. Danach: null Inflation.']], { y: 528 });
    }
  });

  /* ======================================================================
     Kapitel 18: Schwierigkeitsanpassung
     ====================================================================== */
  Scenes.define('difficulty', {
    W: 960, H: 560, duration: 21,
    label: 'Zeitachse: Die Rechenleistung verdoppelt sich, Blöcke kommen schneller, bis die Schwierigkeit angepasst wird. Danach wieder alle zehn Minuten. Bei Gold bleibt die Förderung verdoppelt.',
    setup(s) {
      const R = rng(4);
      const T = 18, target = 0.5, epoch = 10;
      const H = (x) => (x < 5 ? 1 : x < 6 ? lerp(1, 2, smooth(x - 5)) : 2);
      let x = 0, D = 1, k = 0, eStart = 0;
      const blocks = [], adj = [[0, 1]];
      while (x < T) {
        const iv = (target * D) / H(x) * (0.7 + R() * 0.6);
        x += iv;
        if (x > T) break;
        blocks.push(x);
        k++;
        if (k % epoch === 0) {
          const actual = x - eStart;
          D = D * clamp((epoch * target) / actual, 0.25, 4);
          eStart = x;
          adj.push([x, D]);
        }
      }
      s.state.sim = { T, H, blocks, adj };
    },
    draw(s, t) {
      const { T, H, blocks, adj } = s.state.sim;
      const X = (x) => 150 + (x / T) * 700;
      const tau = clamp(t - 1.5, 0, T);
      const Dat = (x) => { let d = 1; adj.forEach(([ax, dv]) => { if (x >= ax) d = dv; }); return d; };
      const lane = (y, title, sub) => {
        s.text(title, 40, y, { size: 17, color: C.ink, weight: 600 });
        if (sub) s.text(sub, 40, y + 20, { size: 13, color: C.dim });
        s.line(150, y + 30, 910, y + 30, { color: C.grid, width: 1.2 });
      };
      lane(70, 'Rechenleistung', 'mehr Miner');
      lane(185, 'Blöcke', 'je ein Quadrat');
      lane(300, 'Schwierigkeit', 'alle 2016 Blöcke');
      lane(420, 'Neue Einheiten', 'pro Zeit');
      const stepLine = (f, y0, scale, col, dash) => {
        const pts = [];
        for (let x = 0; x <= tau; x += 0.02) pts.push([X(x), y0 - f(x) * scale]);
        s.poly(pts, { stroke: col, width: 3, dash });
      };
      stepLine(H, 100, 26, C.teal);
      stepLine(Dat, 330, 26, C.purple);
      stepLine((x) => H(x) / Dat(x), 450, 26, C.btc);
      stepLine(H, 450, 26, C.gold, [7, 6]);
      blocks.forEach((b) => { if (b <= tau) s.rect(X(b) - 5, 200, 10, 14, { fill: C.btc, r: 2 }); });
      adj.slice(1).forEach(([ax]) => {
        if (ax > tau) return;
        s.line(X(ax), 50, X(ax), 470, { color: C.purple, width: 1.2, dash: [3, 5], alpha: 0.7 });
        s.text('Anpassung', X(ax), 46, { size: 13, align: 'center', color: C.purple });
      });
      if (tau > 5) s.text('mehr Miner kommen dazu', X(6.1) + 6, 72, { size: 14, color: C.teal, alpha: sseg(tau, 5, 5.6) });
      const recent = blocks.filter((b) => b <= tau).slice(-6);
      const avg = recent.length > 1 ? (recent[recent.length - 1] - recent[0]) / (recent.length - 1) : 0.5;
      s.text('Ø Blockzeit: ' + fmt((avg / 0.5) * 10, 1) + ' min', 910, 260, { size: 18, align: 'right', color: C.btc, weight: 600 });
      s.text('Bitcoin', X(tau) + 6, 450 - (H(tau) / Dat(tau)) * 26 - 6, { size: 14, color: C.btc });
      s.text('Gold', X(tau) + 6, 450 - H(tau) * 26 - 6, { size: 14, color: C.gold });
      s.line(X(tau), 50, X(tau), 470, { color: C.ink2, width: 1, alpha: 0.4 });
      s.captions(t, [
        [1, 5.6, 'Alles läuft ruhig: im Schnitt ein Block alle zehn Minuten.'],
        [6, 10.6, 'Steigt der Preis, kommen mehr Miner dazu. Die Blöcke kommen schneller …'],
        [11, 15.6, '… bis das Netzwerk die Schwierigkeit erhöht. Danach wieder zehn Minuten.'],
        [16, 21, 'Bei Gold führen mehr Minen dauerhaft zu mehr Gold. Bei Bitcoin nicht.']
      ], { y: 545 });
    }
  });

  /* ======================================================================
     Kapitel 19: Gold, Fiat und Bitcoin im Vergleich
     ====================================================================== */
  Scenes.define('radar-cmp', window.Engine.radarScene({
    overlay: true,
    label: 'Radar-Diagramm, das Gold, Fiat-Geld und Bitcoin nach sieben Eigenschaften vergleicht.',
    axes: ['Knappheit', 'Haltbarkeit', 'Teilbarkeit', 'Transport', 'Prüfbarkeit', 'Zensurresistenz', 'Geschwindigkeit'],
    items: [
      { name: 'Gold', c: C.gold, v: [9, 10, 6, 3, 5, 5, 2], note: 'Hart und unzerstörbar – aber schwer, langsam, aufwendig zu prüfen. Grosse Mengen liegen in Tresoren.' },
      { name: 'Fiat', c: C.money, v: [1, 6, 9, 9, 6, 2, 9], note: 'Schnell und bequem – aber beliebig vermehrbar. Konten können gesperrt werden.' },
      { name: 'Bitcoin', c: C.btc, v: [10, 9, 10, 10, 10, 9, 8], note: 'Fest begrenzt, weltweit in Minuten übertragbar, von jedem selbst prüfbar.' }
    ],
    footnote: 'Qualitative Einschätzung aus Sicht dieser Seite, 0 = schlecht, 10 = hervorragend'
  }));

  /* ======================================================================
     Kapitel 19: Lightning-Kanal
     ====================================================================== */
  Scenes.define('lightning', {
    W: 960, H: 500, duration: 17,
    label: 'Alice und Bob öffnen einen Lightning-Kanal mit einer Transaktion auf der Blockchain, zahlen sich tausende Male hin und her und schliessen den Kanal mit einer zweiten Transaktion.',
    draw(s, t) {
      I.person(s, 120, 300, 96, { color: C.btc, look: 1 });
      s.text('Alice', 120, 330, { size: 20, align: 'center', color: C.btc, weight: 600 });
      I.person(s, 840, 300, 96, { color: C.blue, look: -1 });
      s.text('Bob', 840, 330, { size: 20, align: 'center', color: C.blue, weight: 600 });
      const open = sseg(t, 1.5, 2.6);
      const close = sseg(t, 13, 14);
      const x0 = 210, x1 = 750, y = 225, h = 30;
      let bal = 0.7;
      if (t > 3.2) bal = 0.5 + 0.22 * Math.sin((t - 3.2) * 2.3) * Math.cos((t - 3.2) * 0.9) + 0.06 * Math.sin((t - 3.2) * 7.1);
      if (t > 12.4) bal = lerp(0.5 + 0.22 * Math.sin(9.2 * 2.3) * Math.cos(9.2 * 0.9) + 0.06 * Math.sin(9.2 * 7.1), 0.42, sseg(t, 12.4, 13));
      const bx = lerp(x0, x1, bal);
      s.alpha(open, () => {
        s.rect(x0, y, x1 - x0, h, { fill: '#141920', stroke: C.faint, width: 1.5, r: h / 2 });
        s.rect(x0, y, bx - x0, h, { fill: rgba(C.btc, 0.7), r: h / 2 });
        s.rect(bx, y, x1 - bx, h, { fill: rgba(C.blue, 0.7), r: h / 2 });
        s.text('Kanal: 1 BTC', (x0 + x1) / 2, y - 16, { size: 18, align: 'center', color: C.ink2 });
        s.text(fmt(bal, 3), x0 + 12, y + 21, { size: 15, color: '#1d1000', weight: 700 });
        s.text(fmt(1 - bal, 3), x1 - 12, y + 21, { size: 15, align: 'right', color: '#08161b', weight: 700 });
      });
      let n = 0;
      if (t > 3.2) n = Math.min(Math.round(Math.pow(t - 3.2, 2.7) * 4.2), Math.round(Math.pow(9.2, 2.7) * 4.2));
      if (t > 3.2 && t < 12.4) {
        for (let k = 0; k < 5; k++) {
          const ph = ((t - 3.2) * (1.2 + k * 0.37) + k * 0.21) % 1;
          const dir = k % 2 === 0;
          const x = dir ? lerp(x0, x1, ph) : lerp(x1, x0, ph);
          I.bolt(s, x, y - 34 + (k % 3) * 6, 22, { color: C.yellow, alpha: 0.9 * Math.sin(Math.PI * ph) });
        }
      }
      s.text('Zahlungen im Kanal: ' + fmt(n), 480, 312, { size: 22, align: 'center', color: C.yellow, alpha: sseg(t, 3.2, 3.8), weight: 600 });
      s.text('jede in Millisekunden, fast gratis', 480, 340, { size: 16, align: 'center', color: C.dim, alpha: sseg(t, 3.6, 4.2), italic: true });
      // Blockchain
      const by = 420;
      s.text('Blockchain', 40, by - 14, { size: 15, color: C.dim });
      for (let i = 0; i < 18; i++) {
        const x = 40 + i * 50;
        const isOpen = i === 5, isClose = i === 13;
        const active = (isOpen && t > 1.5) || (isClose && t > 13);
        s.rect(x, by, 40, 40, { fill: active ? rgba(C.btc, 0.85) : '#171c24', stroke: active ? C.btc : C.faint, width: 1.5, r: 6, glow: active ? 12 : 0 });
        if (i < 17) s.line(x + 40, by + 20, x + 50, by + 20, { color: C.faint, width: 1.5 });
      }
      if (open > 0) {
        s.line(40 + 5 * 50 + 20, by, 300, y + h + 6, { color: C.btc, width: 1.5, dash: [4, 4], alpha: open });
        s.text('öffnen', 40 + 5 * 50 + 20, by + 62, { size: 15, align: 'center', color: C.btc, alpha: open });
      }
      if (close > 0) {
        s.line(40 + 13 * 50 + 20, by, 660, y + h + 6, { color: C.btc, width: 1.5, dash: [4, 4], alpha: close });
        s.text('schliessen', 40 + 13 * 50 + 20, by + 62, { size: 15, align: 'center', color: C.btc, alpha: close });
      }
      s.captions(t, [
        [0.4, 3, 'Alice und Bob hinterlegen gemeinsam 1 BTC – eine einzige Transaktion auf der Blockchain.'],
        [3.4, 12.4, 'Danach zahlen sie sich beliebig oft hin und her, indem sie neue Kontostände signieren.'],
        [13, 17, 'Beim Schliessen landet nur der Endstand in der Blockchain. Tausende Zahlungen, zwei Einträge.']
      ], { top: 40 });
    }
  });

  /* ======================================================================
     Kapitel 20: Tick tock, next block
     ====================================================================== */
  Scenes.define('blockclock', {
    W: 960, H: 380,
    label: 'Die aktuelle Blockhöhe von Bitcoin und eine symbolische Herzschlag-Linie, die bei jedem Block ausschlägt.',
    setup(s) {
      const st = s.state;
      st.height = window.Engine.btcHeightNow();
      st.live = false;
      const R = rng(99);
      st.beats = [];
      let x = 0;
      for (let i = 0; i < 400; i++) { x += 0.6 - Math.log(1 - R() * 0.98) * 1.6; st.beats.push(x); }
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 6000);
        fetch('https://mempool.space/api/blocks/tip/height', { signal: ctrl.signal })
          .then((r) => (r.ok ? r.text() : Promise.reject()))
          .then((txt) => { const h = parseInt(txt, 10); if (h > 800000) { st.height = h; st.live = true; } })
          .catch(() => {});
      } catch { /* offline */ }
    },
    draw(s) {
      const st = s.state, tt = s.clock;
      s.text(st.live ? 'Aktuelle Blockhöhe (live von mempool.space)' : 'Aktuelle Blockhöhe (geschätzt)', 480, 50, { size: 17, align: 'center', color: C.dim });
      s.text(fmt(st.height), 480, 128, { size: 72, align: 'center', color: C.btc, weight: 600, glow: rgba(C.btc, 0.5), glowBlur: 24 });
      s.text('Blöcke seit dem 3. Januar 2009', 480, 160, { size: 16, align: 'center', color: C.dim, italic: true });
      const y0 = 270, x0 = 40, x1 = 920, span = 12;
      const pts = [];
      for (let px = x0; px <= x1; px += 2) {
        const tx = tt - ((x1 - px) / (x1 - x0)) * span;
        let v = 0;
        st.beats.forEach((b) => {
          const d = tx - b;
          if (d > -0.05 && d < 0.5) v += Math.exp(-Math.pow((d - 0.08) / 0.035, 2)) * 60 - Math.exp(-Math.pow((d - 0.2) / 0.05, 2)) * 22;
        });
        pts.push([px, y0 - v + Math.sin(px * 0.3 + tt) * 0.6]);
      }
      s.poly(pts, { stroke: C.btc, width: 2.5, glow: 10 });
      let k = 0;
      st.beats.forEach((b, i) => {
        if (b > tt || b < tt - span) return;
        const px = x1 - ((tt - b) / span) * (x1 - x0);
        k++;
        s.text(i % 2 === 0 ? 'tick' : 'tock', px + 6, y0 - 70, { size: 16, color: C.ink2, italic: true, alpha: clamp(1 - (tt - b) / span) });
      });
      s.text('symbolischer Herzschlag – in Wirklichkeit kommt im Schnitt alle 10 Minuten ein Block', 480, 352, { size: 15, align: 'center', color: C.dim, italic: true });
    }
  });
})();
