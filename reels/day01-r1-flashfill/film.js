// THE FILM v2 — "real Excel, styled": an authentic Excel window inside a viewport, a moving camera,
// and clean editorial type. No glow. Every frame is a pure function of t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev, BEAT } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, SAFE = G.SAFE;
  const SANS = 'Inter, Helvetica, Arial, sans-serif';
  const CELL = 'Carlito, Calibri, "Liberation Sans", Arial, sans-serif'; // Calibri-metric
  const XL = '#107C41', XL_D = '#0B5A2F', INK = '#111111', BG = '#F4F3EF';

  // ---------- viewport on screen ----------
  const VP = { x: 40, y: 560, w: W - 80, h: 840, r: 30 };
  const ANCHOR = [VP.x + VP.w / 2, VP.y + VP.h / 2];

  // ---------- the Excel window in world coords (fills the viewport at zoom 1) ----------
  const WW = VP.w, WH = VP.h;
  const TB = 44, TABS = 38, RIB = 86, FB = 36, CH = 26, RHT = 34, STATUS = 26;
  const TOP = TB + TABS + RIB + FB; // where the column headers start
  const COLS = [40, 200, 140, 140, 300, WW - 40 - 200 - 140 - 140 - 300];
  const colX = []; { let x = 0; for (const w of COLS) { colX.push(x); x += w; } }
  const LET = ['', 'A', 'B', 'C', 'D', 'E'];
  const rowY = (r) => TOP + CH + (r - 1) * RHT;
  const cellBox = (c, r) => ({ x: colX[c], y: rowY(r), w: COLS[c], h: RHT });
  const cc = (c, r) => [colX[c] + COLS[c] / 2, rowY(r) + RHT / 2];

  // ---------- camera keyframes: { t, z, f:[x,y] } ----------
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const FB_ = [230, 360], FC_ = [340, 360], FD_ = [452, 360], MID = [WW / 2, WH / 2];
  const punch = (te, f, z) => [{ t: te, z: z + 0.05, f }, { t: te + 0.12, z: z + 0.15, f, ease: 'outExpo' }, { t: te + 1.0, z, f }];
  const CAM = [
    { t: 0, z: 1.85, f: FB_ },
    { t: ev.clear + 0.4, z: 2.0, f: FB_ },
    ...punch(ev.e1, FB_, 2.0),
    { t: ev.selC2 - 0.1, z: 2.0, f: FB_ },
    { t: ev.selC2 + 0.5, z: 2.0, f: FC_ },
    ...punch(ev.e2, FC_, 2.0),
    { t: ev.selD2 - 0.1, z: 2.0, f: FC_ },
    { t: ev.selD2 + 0.6, z: 1.38, f: FD_ },
    ...punch(ev.e3, FD_, 1.38),
    { t: ev.recap + 0.1, z: 1.38, f: FD_ },
    { t: ev.recap + 0.9, z: 1.0, f: MID },
    { t: ev.endCard, z: 1.0, f: MID },
  ];
  function T(b, beat = 0) { return S.T(b, beat); }
  function cam(t) {
    if (t <= CAM[0].t) return CAM[0];
    for (let i = 0; i < CAM.length - 1; i++) {
      const a = CAM[i], b = CAM[i + 1];
      if (t <= b.t) {
        const u = ease[b.ease || 'inOutCubic'](clamp((t - a.t) / (b.t - a.t)));
        return { z: lerp(a.z, b.z, u), f: [lerp(a.f[0], b.f[0], u), lerp(a.f[1], b.f[1], u)] };
      }
    }
    return CAM[CAM.length - 1];
  }

  function txt(ctx, s, x, y, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = `${o.weight || 400} ${o.size || 20}px ${o.fam || SANS}`;
    if (o.spacing !== undefined) ctx.letterSpacing = `${o.spacing}px`;
    ctx.fillStyle = o.color || INK;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'middle';
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function rr(ctx, x, y, w, h, r, fill, stroke, lw = 1) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  // ---------- cell contents ----------
  const typed = (w, times, t) => w.slice(0, times.filter((x) => x <= t).length);
  function content(c, r, t) {
    const i = r - 2;
    if (r === 1) return ['', 'Full Name', 'First Name', 'Last Name', 'Email', ''][c] ? { s: ['', 'Full Name', 'First Name', 'Last Name', 'Email'][c], bold: true } : null;
    if (i < 0 || i > 5) return null;
    if (c === 1) return { s: S.PEOPLE[i].join(' ') };
    if (c === 2 && t < ev.clear) { const m = ev.manual.find((x) => x.r === r); return m ? { s: typed(m.w, m.times, t), wrong: true } : null; }
    if (c === 2) return i === 0 ? { s: typed('Aisha', ev.typeB, t) } : t >= ev.fillB[i - 1] ? { s: S.PEOPLE[i][0], t0: ev.fillB[i - 1] } : null;
    if (c === 3) return i === 0 ? { s: typed('Khan', ev.typeC, t) } : t >= ev.fillC[i - 1] ? { s: S.PEOPLE[i][1], t0: ev.fillC[i - 1] } : null;
    if (c === 4) return i === 0 ? { s: typed(S.EMAIL(S.PEOPLE[0]), ev.typeD, t) } : t >= ev.fillD[i - 1] ? { s: S.EMAIL(S.PEOPLE[i]), t0: ev.fillD[i - 1] } : null;
    return null;
  }
  function active(t) { // selected column, rows r0..r1, typing?
    if (t < ev.clear) { const m = [...ev.manual].reverse().find((x) => t >= x.times[0] - 0.05); return { c: 2, r0: m ? m.r : 2, r1: m ? m.r : 2 }; }
    if (t < ev.selC2) return { c: 2, r0: 2, r1: t >= ev.e1 ? 2 + ev.fillB.filter((x) => x <= t).length : 2 };
    if (t < ev.selD2) return { c: 3, r0: 2, r1: t >= ev.e2 ? 2 + ev.fillC.filter((x) => x <= t).length : 2 };
    return { c: 4, r0: 2, r1: t >= ev.e3 ? 2 + ev.fillD.filter((x) => x <= t).length : 2 };
  }

  // ---------- the Excel window ----------
  function excel(ctx, t) {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, WW, WH);
    // title bar
    ctx.fillStyle = XL; ctx.fillRect(0, 0, WW, TB);
    txt(ctx, 'Book1  -  Excel', WW / 2, TB / 2, { size: 17, color: '#FFFFFF', align: 'center', weight: 400 });
    // autosave pill + window controls
    txt(ctx, 'AutoSave', 18, TB / 2, { size: 14, color: '#E6F3EC' });
    rr(ctx, 92, TB / 2 - 9, 34, 18, 9, null, '#E6F3EC', 1.5);
    ctx.fillStyle = '#E6F3EC'; ctx.beginPath(); ctx.arc(101, TB / 2, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(WW - 128, TB / 2); ctx.lineTo(WW - 116, TB / 2); ctx.stroke();
    ctx.strokeRect(WW - 82, TB / 2 - 6, 12, 12);
    ctx.beginPath(); ctx.moveTo(WW - 36, TB / 2 - 6); ctx.lineTo(WW - 24, TB / 2 + 6); ctx.moveTo(WW - 24, TB / 2 - 6); ctx.lineTo(WW - 36, TB / 2 + 6); ctx.stroke();
    // tabs
    ctx.fillStyle = '#F3F3F3'; ctx.fillRect(0, TB, WW, TABS);
    const tabs = ['File', 'Home', 'Insert', 'Draw', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'];
    let x = 18;
    ctx.font = `400 15px ${SANS}`;
    for (const tb of tabs) {
      const w = ctx.measureText(tb).width;
      txt(ctx, tb, x, TB + TABS / 2, { size: 15, color: tb === 'Home' ? XL_D : '#333', weight: tb === 'Home' ? 700 : 400 });
      if (tb === 'Home') { ctx.fillStyle = XL; ctx.fillRect(x, TB + TABS - 4, w, 3); }
      x += w + 22;
    }
    // ribbon
    const ry = TB + TABS;
    ctx.fillStyle = '#FAFAFA'; ctx.fillRect(0, ry, WW, RIB);
    ctx.fillStyle = '#E1E1E1'; ctx.fillRect(0, ry + RIB - 1, WW, 1);
    // clipboard group
    rr(ctx, 20, ry + 12, 30, 36, 4, '#FFFFFF', '#9A9A9A', 1.5); rr(ctx, 28, ry + 8, 14, 8, 2, '#9A9A9A');
    txt(ctx, 'Paste', 35, ry + 62, { size: 12, color: '#444', align: 'center' });
    ctx.fillStyle = '#E1E1E1'; ctx.fillRect(74, ry + 10, 1, RIB - 26);
    // font group
    rr(ctx, 90, ry + 12, 130, 24, 3, '#FFFFFF', '#C8C8C8'); txt(ctx, 'Aptos Narrow', 98, ry + 24, { size: 13, color: '#222' });
    rr(ctx, 226, ry + 12, 40, 24, 3, '#FFFFFF', '#C8C8C8'); txt(ctx, '11', 236, ry + 24, { size: 13, color: '#222' });
    txt(ctx, 'B', 96, ry + 52, { size: 16, weight: 700, color: '#222' });
    txt(ctx, 'I', 124, ry + 52, { size: 16, color: '#222', fam: 'Liberation Serif' });
    txt(ctx, 'U', 146, ry + 52, { size: 15, color: '#222' }); ctx.fillStyle = '#222'; ctx.fillRect(146, ry + 61, 11, 1.5);
    ctx.fillStyle = '#F2C200'; ctx.fillRect(184, ry + 60, 18, 4); txt(ctx, 'ab', 184, ry + 50, { size: 13, color: '#222' });
    ctx.fillStyle = '#D13438'; ctx.fillRect(220, ry + 60, 18, 4); txt(ctx, 'A', 224, ry + 50, { size: 15, color: '#222' });
    ctx.fillStyle = '#E1E1E1'; ctx.fillRect(284, ry + 10, 1, RIB - 26);
    // alignment group
    for (let k = 0; k < 3; k++) for (let l = 0; l < 4; l++) { ctx.fillStyle = '#555'; ctx.fillRect(300 + k * 30, ry + 16 + l * 6, l % 2 ? 14 : 20, 2); }
    for (let k = 0; k < 3; k++) for (let l = 0; l < 4; l++) { ctx.fillStyle = '#555'; const w = l % 2 ? 14 : 20; ctx.fillRect(300 + k * 30 + (k === 1 ? (20 - w) / 2 : k === 2 ? 20 - w : 0), ry + 46 + l * 6, w, 2); }
    ctx.fillStyle = '#E1E1E1'; ctx.fillRect(400, ry + 10, 1, RIB - 26);
    // number group
    rr(ctx, 414, ry + 12, 120, 24, 3, '#FFFFFF', '#C8C8C8'); txt(ctx, 'General', 422, ry + 24, { size: 13, color: '#222' });
    txt(ctx, '$   %   ,', 418, ry + 52, { size: 15, color: '#222' });
    ctx.fillStyle = '#E1E1E1'; ctx.fillRect(552, ry + 10, 1, RIB - 26);
    // styles group: tiny tiles
    const tiles = ['#FFFFFF', '#F8CBAD', '#C6EFCE', '#FFEB9C'];
    tiles.forEach((c, k) => rr(ctx, 568 + k * 44, ry + 14, 38, 28, 3, c, '#C8C8C8'));
    txt(ctx, 'Styles', 652, ry + 62, { size: 12, color: '#444', align: 'center' });
    ctx.fillStyle = '#E1E1E1'; ctx.fillRect(752, ry + 10, 1, RIB - 26);
    txt(ctx, 'Σ  AutoSum', 768, ry + 24, { size: 14, color: '#222' });
    txt(ctx, 'Sort & Filter', 768, ry + 52, { size: 14, color: '#222' });
    // formula bar
    const fy = ry + RIB;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, fy, WW, FB);
    ctx.fillStyle = '#E1E1E1'; ctx.fillRect(0, fy + FB - 1, WW, 1);
    const a = active(t);
    rr(ctx, 8, fy + 6, 84, FB - 12, 2, '#FFFFFF', '#C8C8C8');
    txt(ctx, `${LET[a.c]}${a.r0}`, 16, fy + FB / 2, { size: 15, color: '#222', fam: CELL });
    txt(ctx, 'fx', 120, fy + FB / 2, { size: 16, color: '#666', fam: 'Liberation Serif' });
    ctx.fillStyle = '#E1E1E1'; ctx.fillRect(146, fy + 6, 1, FB - 12);
    const v = content(a.c, a.r0, t);
    if (v && v.s) txt(ctx, v.s, 158, fy + FB / 2, { size: 16, color: '#222', fam: CELL });
    // column headers
    ctx.fillStyle = '#F5F5F5'; ctx.fillRect(0, TOP, WW, CH);
    for (let c = 1; c < COLS.length; c++) {
      const sel = c === a.c;
      if (sel) { ctx.fillStyle = '#D3E9DC'; ctx.fillRect(colX[c], TOP, COLS[c], CH); ctx.fillStyle = XL; ctx.fillRect(colX[c], TOP + CH - 2, COLS[c], 2); }
      txt(ctx, LET[c], colX[c] + COLS[c] / 2, TOP + CH / 2, { size: 14, color: sel ? XL_D : '#555', align: 'center', fam: CELL, weight: sel ? 700 : 400 });
    }
    // row headers + grid
    const nRows = Math.floor((WH - TOP - CH - STATUS) / RHT);
    ctx.fillStyle = '#F5F5F5'; ctx.fillRect(0, TOP + CH, COLS[0], nRows * RHT);
    for (let r = 1; r <= nRows; r++) {
      const sel = r >= a.r0 && r <= a.r1;
      if (sel) { ctx.fillStyle = '#D3E9DC'; ctx.fillRect(0, rowY(r), COLS[0], RHT); ctx.fillStyle = XL; ctx.fillRect(COLS[0] - 2, rowY(r), 2, RHT); }
      txt(ctx, String(r), COLS[0] / 2, rowY(r) + RHT / 2, { size: 14, color: sel ? XL_D : '#555', align: 'center', fam: CELL, weight: sel ? 700 : 400 });
    }
    // range shading (Excel's grey-green selection tint)
    if (a.r1 > a.r0) { const b0 = cellBox(a.c, a.r0 + 1), b1 = cellBox(a.c, a.r1); ctx.fillStyle = '#E8F2EC'; ctx.fillRect(b0.x, b0.y, b0.w, b1.y + b1.h - b0.y); }
    ctx.strokeStyle = '#E2E2E2'; ctx.lineWidth = 1;
    for (let r = 0; r <= nRows; r++) { const y = rowY(1) + r * RHT + 0.5; ctx.beginPath(); ctx.moveTo(COLS[0], y); ctx.lineTo(WW, y); ctx.stroke(); }
    for (let c = 1; c <= COLS.length; c++) { const xx = (colX[c] ?? WW) + 0.5; ctx.beginPath(); ctx.moveTo(xx, TOP); ctx.lineTo(xx, TOP + CH + nRows * RHT); ctx.stroke(); }
    ctx.fillStyle = '#C8C8C8'; ctx.fillRect(0, TOP + CH - 1, WW, 1); ctx.fillRect(COLS[0] - 1, TOP, 1, CH + nRows * RHT);
    // cells
    for (let r = 1; r <= 7; r++) for (let c = 1; c <= 4; c++) {
      const v2 = content(c, r, t);
      if (!v2 || !v2.s) continue;
      const b = cellBox(c, r);
      let alpha = 1, dy = 0;
      if (v2.t0 !== undefined) { const p = ease.outCubic(clamp((t - v2.t0) / 0.18)); alpha = p; dy = (1 - p) * 10; }
      txt(ctx, v2.s, b.x + 7, b.y + b.h / 2 + 1 + dy, { size: 19, fam: CELL, color: '#111', weight: v2.bold ? 700 : 400, alpha });
    }
    // caret while typing
    for (const [c, times, stop] of [[2, ev.typeB, ev.e1 - 0.3], [3, ev.typeC, ev.e2 - 0.3], [4, ev.typeD, ev.e3 - 0.3]]) {
      if (t >= times[0] - BEAT && t < stop && Math.floor(t * 3.4) % 2 === 0) {
        ctx.font = `400 19px ${CELL}`;
        const s = content(c, 2, t).s;
        ctx.fillStyle = '#111'; ctx.fillRect(colX[c] + 8 + ctx.measureText(s).width, rowY(2) + 7, 1.5, RHT - 14);
      }
    }
    // selection border + fill handle
    const s0 = cellBox(a.c, a.r0), s1 = cellBox(a.c, a.r1);
    ctx.strokeStyle = XL; ctx.lineWidth = 2.5;
    ctx.strokeRect(s0.x + 1, s0.y + 1, s0.w - 2, s1.y + s1.h - s0.y - 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(s0.x + s0.w - 5, s1.y + s1.h - 5, 9, 9);
    ctx.fillStyle = XL; ctx.fillRect(s0.x + s0.w - 4, s1.y + s1.h - 4, 7, 7);
    // Flash Fill options smart tag
    for (const [c, done, until] of [[2, ev.fillB[4], ev.selC2], [3, ev.fillC[4], ev.selD2], [4, ev.fillD[4], 1e9]]) {
      if (t >= done && t < until) {
        const p = ease.outBack(clamp((t - done) / 0.25), 2);
        const bx = colX[c] + COLS[c] - 4, by = rowY(3) + 4;
        ctx.save(); ctx.translate(bx + 14, by + 12); ctx.scale(p, p);
        rr(ctx, -14, -12, 28, 24, 2, '#FFFFFF', '#9A9A9A', 1);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-8, -6 + k * 5); ctx.lineTo(4, -6 + k * 5); ctx.stroke(); }
        ctx.fillStyle = '#F2B400'; ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(3, 1); ctx.lineTo(7, 1); ctx.lineTo(4, 9); ctx.lineTo(11, -2); ctx.lineTo(7, -2); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // status bar
    const sy = WH - STATUS;
    ctx.fillStyle = '#F3F3F3'; ctx.fillRect(0, sy, WW, STATUS);
    ctx.fillStyle = '#E1E1E1'; ctx.fillRect(0, sy, WW, 1);
    const ff = (t >= ev.fillB[4] && t < ev.selC2) || (t >= ev.fillC[4] && t < ev.selD2) || t >= ev.fillD[4];
    txt(ctx, ff ? 'Flash Fill Changed Cells: 5' : 'Ready', 14, sy + STATUS / 2, { size: 13, color: '#333' });
    txt(ctx, 'Sheet1', 140 + (ff ? 120 : 0), sy + STATUS / 2, { size: 13, color: XL_D, weight: 700 });
    txt(ctx, '100%', WW - 16, sy + STATUS / 2, { size: 13, color: '#333', align: 'right' });
  }

  function viewport(ctx, t) {
    // card shadow + frame
    const inP = ease.outExpo(clamp((t - 0.0) / 0.6));
    ctx.save();
    ctx.globalAlpha = inP;
    ctx.translate(0, (1 - inP) * 80);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
    rr(ctx, VP.x, VP.y, VP.w, VP.h, VP.r, '#FFFFFF'); ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(VP.x, VP.y, VP.w, VP.h, VP.r); ctx.clip();
    ctx.fillStyle = '#EDEDED'; ctx.fillRect(VP.x, VP.y, VP.w, VP.h);
    const c = cam(t);
    ctx.translate(ANCHOR[0], ANCHOR[1]); ctx.scale(c.z, c.z); ctx.translate(-c.f[0], -c.f[1]);
    excel(ctx, t);
    ctx.restore();
    rr(ctx, VP.x, VP.y, VP.w, VP.h, VP.r, null, 'rgba(0,0,0,0.08)', 2);
    ctx.restore();
  }

  // ---------- keycaps (flat, physical, no glow) ----------
  function keycaps(ctx, t, ctrlT, eT, cy, scale = 1, hold = 0.9) {
    const show0 = ctrlT - 0.3, show1 = eT + hold;
    if (t < show0 || t > show1) return;
    const inP = ease.outBack(clamp((t - show0) / 0.3), 1.6), outP = clamp((show1 - t) / 0.2);
    const keys = [{ label: 'Ctrl', w: 210, down: ctrlT }, { label: 'E', w: 130, down: eT }];
    const up = eT + 0.35, gap = 80 * scale, h = 120 * scale;
    const total = (keys[0].w + keys[1].w) * scale + gap;
    let x = W / 2 - total / 2;
    ctx.save(); ctx.globalAlpha = outP;
    ctx.translate(0, (1 - inP) * 60);
    keys.forEach((k, i) => {
      const w = k.w * scale, pressed = t >= k.down && t < up;
      const d = pressed ? 8 * scale : 0;
      rr(ctx, x, cy - h / 2 + 10 * scale, w, h, 20 * scale, '#BDBDB8');
      rr(ctx, x, cy - h / 2 + d, w, h - 4 * scale, 20 * scale, pressed ? '#ECECE8' : '#FFFFFF', '#D0D0CB', 2);
      txt(ctx, k.label, x + w / 2, cy - 2 * scale + d, { size: 50 * scale, weight: 700, align: 'center', color: INK });
      x += w;
      if (i === 0) txt(ctx, '+', x + gap / 2, cy, { size: 56 * scale, weight: 400, align: 'center', color: '#666' });
      x += gap;
    });
    ctx.restore();
  }

  // ---------- editorial captions: mask reveal, line by line ----------
  function captions(ctx, t) {
    const y0 = SAFE.y + 70, LH = 110;
    for (const c of S.captions) {
      if (t < c.t - 0.01 || t >= c.end) continue;
      c.lines.forEach((l, i) => {
        const tin = c.t + i * 0.08;
        const pin = ease.outExpo(clamp((t - tin) / 0.5));
        const pout = ease.inCubic(clamp((t - (c.end - 0.22)) / 0.22));
        const size = 92, y = y0 + i * LH;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, y - size * 0.75, W, size * 1.25); ctx.clip();
        const dy = (1 - pin) * size * 1.1 - pout * size * 1.1;
        txt(ctx, l, SAFE.x + 10, y + dy, { size, weight: 800, color: i === 1 ? (c.color || XL) : INK, spacing: -3, base: 'middle' });
        ctx.restore();
      });
    }
  }

  // ---------- end card ----------
  function endCard(ctx, t) {
    if (t < ev.endCard) return;
    const p = ease.inOutCubic(clamp((t - ev.endCard + 0.05) / 0.45));
    ctx.fillStyle = BG; ctx.fillRect(0, H * (1 - p), W, H * p); // a clean wipe up
    if (p < 1) { ctx.fillStyle = XL; ctx.fillRect(0, H * (1 - p) - 14, W, 14); }
    const k = (d) => ease.outExpo(clamp((t - ev.endCard - d) / 0.5));
    const line = (s, y, size, color, d, weight = 800) => {
      const q = k(d); if (q <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 0.75, W, size * 1.3); ctx.clip();
      txt(ctx, s, SAFE.x + 10, y + (1 - q) * size * 1.1, { size, weight, color, spacing: -3 });
      ctx.restore();
    };
    line('Save this.', SAFE.y + 70, 92, INK, 0.3);
    line('You will need it.', SAFE.y + 180, 92, XL, 0.38);
    keycaps(ctx, t, ev.endCard + 0.55, ev.endCard + 0.8, SAFE.y + 470, 1.2, 99);
    line('= Flash Fill', SAFE.y + 680, 72, INK, 0.9, 700);
    const f = k(1.2);
    if (f > 0) {
      ctx.save(); ctx.globalAlpha = f; ctx.translate(0, (1 - f) * 30);
      ctx.fillStyle = INK; ctx.fillRect(SAFE.x + 10, SAFE.y + 820, 120, 6);
      txt(ctx, 'Follow for one Excel trick a day.', SAFE.x + 10, SAFE.y + 890, { size: 46, weight: 600, color: '#333', spacing: -1 });
      ctx.restore();
    }
  }

  // ---------- spoken-word subtitles: word-by-word highlight ----------
  function subtitles(ctx, t) {
    const VO = globalThis.VO || [];
    const line = VO.find((l) => t >= l.t - 0.05 && t < l.t + l.dur + 0.15);
    if (!line) return;
    const all = line.text.split(' ');
    const chars = all.reduce((n, w) => n + w.length + 1, 0);
    let acc = 0;
    const allT = all.map((w) => { const s0 = line.t + (acc / chars) * line.dur; acc += w.length + 1; return s0; });
    // split into short chunks (max 5 words or ~760 px) and show the chunk being spoken
    ctx.font = `700 46px ${SANS}`;
    const chunks = []; let cur = [];
    all.forEach((w, i) => {
      const test = [...cur.map((j) => all[j]), w].join(' ');
      if (cur.length && (cur.length >= 6 || ctx.measureText(test).width > 760 || /[.,?!]$/.test(all[cur[cur.length - 1]]))) { chunks.push(cur); cur = []; }
      cur.push(i);
    });
    if (cur.length) chunks.push(cur);
    const ch = [...chunks].reverse().find((c) => t >= allT[c[0]] - 0.05) || chunks[0];
    const words = ch.map((i) => all[i]), times = ch.map((i) => allT[i]);
    const size = 46, y = SAFE.y + SAFE.h - 40;
    ctx.font = `700 ${size}px ${SANS}`;
    const gap = ctx.measureText(' ').width;
    const widths = words.map((w) => ctx.measureText(w).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
    const a = Math.min(clamp((t - line.t + 0.05) / 0.12), clamp((line.t + line.dur + 0.35 - t) / 0.15));
    ctx.save(); ctx.globalAlpha = a;
    rr(ctx, W / 2 - total / 2 - 28, y - size * 0.85, total + 56, size * 1.7, 18, 'rgba(17,17,17,0.88)');
    let x = W / 2 - total / 2;
    words.forEach((w, i) => {
      const on = t >= times[i];
      txt(ctx, w, x, y, { size, weight: 700, color: on ? (i === words.findLastIndex((_, j) => t >= times[j]) ? '#3DDC84' : '#FFFFFF') : 'rgba(255,255,255,0.45)' });
      x += widths[i] + gap;
    });
    ctx.restore();
  }

  function wrongStamp(ctx, t) {
    if (t < ev.stamp || t >= ev.clear) return;
    const p = 1 + 0.3 * (1 - ease.outCubic(clamp((t - ev.stamp) / 0.15))); // slams in big, settles
    const cx = W / 2, cy = VP.y + VP.h * 0.42, R = 150 * p;
    ctx.save();
    ctx.fillStyle = 'rgba(196,43,28,0.10)'; ctx.fillRect(VP.x, VP.y, VP.w, VP.h);
    ctx.translate(cx, cy); ctx.rotate(-0.12);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = '#C42B1C'; ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 26 * p; ctx.lineCap = 'round';
    const k = R * 0.42;
    ctx.beginPath(); ctx.moveTo(-k, -k); ctx.lineTo(k, k); ctx.moveTo(k, -k); ctx.lineTo(-k, k); ctx.stroke();
    ctx.restore();
    txt(ctx, 'TOO SLOW', cx, cy + 200 * p, { size: 64 * p, weight: 800, align: 'center', color: '#C42B1C', spacing: 2 });
  }

  Studio.film({
    draw(ctx, t) {
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      // tiny brand tag, top-left of the safe area
      txt(ctx, 'EXCEL TIP', SAFE.x + 12, SAFE.y - 10, { size: 26, weight: 700, color: XL, spacing: 4, alpha: clamp(t / 0.3) });
      viewport(ctx, t);
      const ky = VP.y + VP.h - 110;
      keycaps(ctx, t, ev.ctrl1, ev.e1, ky);
      keycaps(ctx, t, ev.ctrl2, ev.e2, ky);
      keycaps(ctx, t, ev.ctrl3, ev.e3, ky);
      wrongStamp(ctx, t);
      captions(ctx, t);
      endCard(ctx, t);
      subtitles(ctx, t);
    },
    post: { paper: 0, vignette: 0, grain: 0.015 },
    fadeOut: 0,
  });
})();
