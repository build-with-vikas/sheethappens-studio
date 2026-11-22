// THE FILM — Build format reference: cover → finished result → numbered steps → demo → end card.
// "How To Create Progress Doughnut Chart In Excel". Every frame is a pure function of t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev, BEAT } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, SAFE = G.SAFE;
  const SANS = 'Inter, Helvetica, Arial, sans-serif';
  const CELL = 'Carlito, Calibri, "Liberation Sans", Arial, sans-serif';
  const XL = '#107C41', XL_D = '#0B5A2F', INK = '#111111', BG = '#F4F3EF', GREY = '#E4E4E0';

  // ---------- viewport + Excel world ----------
  const VP = { x: 40, y: 560, w: W - 80, h: 840, r: 30 };
  const ANCHOR = [VP.x + VP.w / 2, VP.y + VP.h / 2];
  const WW = VP.w, WH = VP.h;
  const TB = 44, TABS = 38, RIB = 86, FB = 36, CH = 26, RHT = 40, STATUS = 26, FS = 22;
  const TOP = TB + TABS + RIB + FB;
  const COLS = [40, 250, 90, 30, 110, 110, WW - 40 - 250 - 90 - 30 - 110 - 110];
  const colX = []; { let x = 0; for (const w of COLS) { colX.push(x); x += w; } }
  const LET = ['', 'A', 'B', 'C', 'D', 'E', 'F'];
  const rowY = (r) => TOP + CH + (r - 1) * RHT;
  const cellBox = (c, r) => ({ x: colX[c], y: rowY(r), w: COLS[c], h: RHT });
  const CHART = { x: 650, y: 238, w: 335, h: 348 }, DC = [CHART.x + CHART.w / 2, CHART.y + 196], DR = 122;

  // ---------- camera ----------
  const WIDE_ = [520, 412], MID = [WW / 2, WH / 2];
  const CAM = [
    { t: 0, z: 1.05, f: WIDE_ },
    { t: ev.step1 - 0.01, z: 1.05, f: WIDE_ },
    { t: ev.step1 + 0.5, z: 1.6, f: [300, 400] },
    { t: ev.step2, z: 1.6, f: [300, 400] },
    { t: ev.step2 + 0.5, z: 1.75, f: [560, 330] },
    { t: ev.step3, z: 1.75, f: [560, 330] },
    { t: ev.step3 + 0.6, z: 1.05, f: WIDE_ },
    { t: ev.step4, z: 1.05, f: WIDE_ },
    { t: ev.step4 + 0.6, z: 1.42, f: [662, 412] },
    { t: ev.step5, z: 1.42, f: [662, 412] },
    { t: ev.step5 + 0.6, z: 1.05, f: WIDE_ },
    { t: ev.endCard - 0.5, z: 1.05, f: WIDE_ },
    { t: ev.endCard, z: 0.95, f: MID },
  ];
  function cam(t) {
    if (t <= CAM[0].t) return CAM[0];
    for (let i = 0; i < CAM.length - 1; i++) {
      const a = CAM[i], b = CAM[i + 1];
      if (t <= b.t) { const u = ease.inOutCubic(clamp((t - a.t) / Math.max(1e-6, b.t - a.t))); return { z: lerp(a.z, b.z, u), f: [lerp(a.f[0], b.f[0], u), lerp(a.f[1], b.f[1], u)] }; }
    }
    return CAM[CAM.length - 1];
  }

  function txt(ctx, s, x, y, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = `${o.weight || 400} ${o.size || 20}px ${o.fam || SANS}`;
    if (o.spacing !== undefined) ctx.letterSpacing = `${o.spacing}px`;
    ctx.fillStyle = o.color || INK; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
  function rr(ctx, x, y, w, h, r, fill, stroke, lw = 1) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  const typed = (w, times, t) => w.slice(0, times.filter((x) => x <= t).length);
  const pop = (t, t0, d = 0.22) => ease.outBack(clamp((t - t0) / d), 2.2);
  const hook = (t) => t < ev.step1;

  // ---------- state ----------
  function ticks(t) { // [{row index, time}] that are ticked by t
    if (hook(t)) return [...ev.hookDone.map((i) => [i, -1]), ...ev.hookTicks.filter(([, x]) => t >= x)];
    return [...ev.buildTicks, ...ev.demoTicks].filter(([, x]) => t >= x);
  }
  function pct(t) { // smooth % for the ring: each tick eases in over 0.35 s
    const list = hook(t) ? [...ev.hookDone.map((i) => [i, -9]), ...ev.hookTicks] : [...ev.buildTicks, ...ev.demoTicks];
    return list.reduce((s, [, x]) => s + ease.outCubic(clamp((t - x) / 0.35)), 0) / S.TASKS.length;
  }
  const pctLabel = (t) => `${Math.round(ticks(t).length / S.TASKS.length * 100)}%`;
  const fmtPct = (p) => `${Math.round(p * 100 * 10) / 10}%`;

  function content(c, r, t) {
    const i = r - 2, H_ = hook(t);
    if (r === 1 && c === 1) return { s: 'Task', bold: true };
    if (r === 1 && c === 2) return { s: 'Done', bold: true };
    if (c === 1 && i >= 0 && i < 8) return H_ || t >= ev.tasksIn[i] ? { s: S.TASKS[i], t0: H_ ? undefined : ev.tasksIn[i] } : null;
    if (c === 4 && (r === 2 || r === 3)) return H_ || t >= ev.labels ? { s: r === 2 ? 'Done' : 'Left', bold: true } : null;
    if (c === 5 && r === 2) {
      const n = ticks(t).length / 8;
      if (H_ || t >= ev.enterF1) return { s: fmtPct(n), f: ev.F1, num: true };
      if (t >= ev.typeF1[0]) return { s: typed(ev.F1, ev.typeF1, t), editing: true };
    }
    if (c === 5 && r === 3) {
      const n = 1 - ticks(t).length / 8;
      if (H_ || t >= ev.enterF2) return { s: fmtPct(n), f: ev.F2, num: true };
      if (t >= ev.typeF2[0]) return { s: typed(ev.F2, ev.typeF2, t), editing: true };
    }
    return null;
  }
  function active(t) {
    if (hook(t)) { const last = [...ev.hookTicks].reverse().find(([, x]) => t >= x - 0.3); return { c: 2, r0: (last ? last[0] : 3) + 2, r1: (last ? last[0] : 3) + 2 }; }
    if (t < ev.menu1) { const k = ev.tasksIn.filter((x) => t >= x).length; return { c: 1, r0: Math.max(2, k + 1), r1: Math.max(2, k + 1) }; }
    if (t < ev.step2) return { c: 2, r0: 2, r1: 9 };
    if (t < ev.typeF2[0]) return { c: 5, r0: 2, r1: 2 };
    if (t < ev.select) return { c: 5, r0: 3, r1: 3 };
    if (t < ev.step5) return { c: 5, r0: 2, r1: 3 };
    const last = [...ev.buildTicks, ...ev.demoTicks].reverse().find(([, x]) => t >= x - 0.3);
    return { c: 2, r0: (last ? last[0] : 0) + 2, r1: (last ? last[0] : 0) + 2 };
  }
  function menuOpen(t) { return (t >= ev.menu1 && t < ev.boxesIn[0] + 0.3) || (t >= ev.menu3 && t < ev.chartIn + 0.2); }

  // ---------- drawing: Excel chrome ----------
  function chrome(ctx, t) {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, WW, WH);
    ctx.fillStyle = XL; ctx.fillRect(0, 0, WW, TB);
    txt(ctx, 'Progress.xlsx  -  Excel', WW / 2, TB / 2, { size: 17, color: '#FFFFFF', align: 'center' });
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(WW - 128, TB / 2); ctx.lineTo(WW - 116, TB / 2); ctx.stroke(); ctx.strokeRect(WW - 82, TB / 2 - 6, 12, 12);
    ctx.beginPath(); ctx.moveTo(WW - 36, TB / 2 - 6); ctx.lineTo(WW - 24, TB / 2 + 6); ctx.moveTo(WW - 24, TB / 2 - 6); ctx.lineTo(WW - 36, TB / 2 + 6); ctx.stroke();
    ctx.fillStyle = '#F3F3F3'; ctx.fillRect(0, TB, WW, TABS);
    const onInsert = menuOpen(t);
    let x = 18; ctx.font = `400 15px ${SANS}`;
    for (const tb of ['File', 'Home', 'Insert', 'Draw', 'Page Layout', 'Formulas', 'Data', 'Review', 'View']) {
      const w = ctx.measureText(tb).width, on = onInsert ? tb === 'Insert' : tb === 'Home';
      txt(ctx, tb, x, TB + TABS / 2, { size: 15, color: on ? XL_D : '#333', weight: on ? 700 : 400 });
      if (on) { ctx.fillStyle = XL; ctx.fillRect(x, TB + TABS - 4, w, 3); }
      x += w + 22;
    }
    const ry = TB + TABS;
    ctx.fillStyle = '#FAFAFA'; ctx.fillRect(0, ry, WW, RIB); ctx.fillStyle = '#E1E1E1'; ctx.fillRect(0, ry + RIB - 1, WW, 1);
    if (onInsert) { // Insert ribbon: Table, Pictures, Checkbox, Charts
      const items = [['Table', 20], ['Pictures', 110], ['Checkbox', 210], ['Charts', 320]];
      for (const [lab, ix] of items) { rr(ctx, ix + 14, ry + 12, 36, 32, 4, '#FFFFFF', '#9A9A9A', 1.5); txt(ctx, lab, ix + 32, ry + 62, { size: 12, color: '#333', align: 'center' }); }
      const hot = t < ev.step2 ? 210 : 320;
      rr(ctx, hot + 2, ry + 6, 60, 70, 6, null, XL, 2.5);
      // little doughnut icon on Charts, tick on Checkbox
      ctx.strokeStyle = XL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(226, ry + 28); ctx.lineTo(232, ry + 34); ctx.lineTo(242, ry + 22); ctx.stroke();
      ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(352, ry + 28, 9, -Math.PI / 2, Math.PI); ctx.stroke(); ctx.strokeStyle = '#BBB'; ctx.beginPath(); ctx.arc(352, ry + 28, 9, Math.PI, Math.PI * 1.5); ctx.stroke();
    } else {
      rr(ctx, 20, ry + 12, 30, 36, 4, '#FFFFFF', '#9A9A9A', 1.5); txt(ctx, 'Paste', 35, ry + 62, { size: 12, color: '#444', align: 'center' });
      rr(ctx, 90, ry + 12, 130, 24, 3, '#FFFFFF', '#C8C8C8'); txt(ctx, 'Aptos Narrow', 98, ry + 24, { size: 13, color: '#222' });
      txt(ctx, 'B', 96, ry + 52, { size: 16, weight: 700, color: '#222' }); txt(ctx, 'I', 124, ry + 52, { size: 16, color: '#222', fam: 'Liberation Serif' });
      rr(ctx, 414, ry + 12, 120, 24, 3, '#FFFFFF', '#C8C8C8'); txt(ctx, 'Percentage', 422, ry + 24, { size: 13, color: '#222' });
      txt(ctx, '$   %   ,', 418, ry + 52, { size: 15, color: '#222' });
    }
    const fy = ry + RIB, a = active(t);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, fy, WW, FB); ctx.fillStyle = '#E1E1E1'; ctx.fillRect(0, fy + FB - 1, WW, 1);
    rr(ctx, 8, fy + 6, 84, FB - 12, 2, '#FFFFFF', '#C8C8C8');
    txt(ctx, `${LET[a.c]}${a.r0}`, 16, fy + FB / 2, { size: 15, color: '#222', fam: CELL });
    txt(ctx, 'fx', 120, fy + FB / 2, { size: 16, color: '#666', fam: 'Liberation Serif' });
    const v = content(a.c, a.r0, t);
    if (v && (v.f || v.s)) txt(ctx, v.f || v.s, 158, fy + FB / 2, { size: 16, color: '#222', fam: CELL });
    else if (a.c === 2 && a.r0 >= 2 && boxesShown(t, a.r0 - 2)) txt(ctx, isTicked(t, a.r0 - 2) ? 'TRUE' : 'FALSE', 158, fy + FB / 2, { size: 16, color: '#222', fam: CELL });
  }
  const boxesShown = (t, i) => hook(t) || t >= ev.boxesIn[i];
  const isTicked = (t, i) => ticks(t).some(([k]) => k === i);

  function grid(ctx, t) {
    const a = active(t);
    ctx.fillStyle = '#F5F5F5'; ctx.fillRect(0, TOP, WW, CH);
    for (let c = 1; c < COLS.length; c++) {
      const sel = c === a.c;
      if (sel) { ctx.fillStyle = '#D3E9DC'; ctx.fillRect(colX[c], TOP, COLS[c], CH); ctx.fillStyle = XL; ctx.fillRect(colX[c], TOP + CH - 2, COLS[c], 2); }
      txt(ctx, LET[c], colX[c] + COLS[c] / 2, TOP + CH / 2, { size: 14, color: sel ? XL_D : '#555', align: 'center', fam: CELL, weight: sel ? 700 : 400 });
    }
    const nRows = Math.floor((WH - TOP - CH - STATUS) / RHT);
    ctx.fillStyle = '#F5F5F5'; ctx.fillRect(0, TOP + CH, COLS[0], nRows * RHT);
    for (let r = 1; r <= nRows; r++) {
      const sel = r >= a.r0 && r <= a.r1;
      if (sel) { ctx.fillStyle = '#D3E9DC'; ctx.fillRect(0, rowY(r), COLS[0], RHT); ctx.fillStyle = XL; ctx.fillRect(COLS[0] - 2, rowY(r), 2, RHT); }
      txt(ctx, String(r), COLS[0] / 2, rowY(r) + RHT / 2, { size: 14, color: sel ? XL_D : '#555', align: 'center', fam: CELL, weight: sel ? 700 : 400 });
    }
    if (a.r1 > a.r0) { const b0 = cellBox(a.c, a.r0 + 1), b1 = cellBox(a.c, a.r1); ctx.fillStyle = '#E8F2EC'; ctx.fillRect(b0.x, b0.y, b0.w, b1.y + b1.h - b0.y); }
    // header row tint
    if (hook(t) || t >= ev.tasksIn[0]) { ctx.fillStyle = '#E3F1E8'; ctx.fillRect(colX[1], rowY(1), COLS[1] + COLS[2], RHT); }
    ctx.strokeStyle = '#E2E2E2'; ctx.lineWidth = 1;
    for (let r = 0; r <= nRows; r++) { const y = rowY(1) + r * RHT + 0.5; ctx.beginPath(); ctx.moveTo(COLS[0], y); ctx.lineTo(WW, y); ctx.stroke(); }
    for (let c = 1; c <= COLS.length; c++) { const xx = (colX[c] ?? WW) + 0.5; ctx.beginPath(); ctx.moveTo(xx, TOP); ctx.lineTo(xx, TOP + CH + nRows * RHT); ctx.stroke(); }
    ctx.fillStyle = '#C8C8C8'; ctx.fillRect(0, TOP + CH - 1, WW, 1); ctx.fillRect(COLS[0] - 1, TOP, 1, CH + nRows * RHT);
    // cells
    for (let r = 1; r <= 9; r++) for (let c = 1; c <= 5; c++) {
      const v = content(c, r, t); if (!v || !v.s) continue;
      const b = cellBox(c, r), p = v.t0 !== undefined ? ease.outCubic(clamp((t - v.t0) / 0.18)) : 1;
      txt(ctx, v.s, v.num ? b.x + b.w - 8 : b.x + 8, b.y + b.h / 2 + 1 + (1 - p) * 10, { size: FS, fam: CELL, color: v.bold ? XL_D : '#111', weight: v.bold ? 700 : 400, alpha: p, align: v.num ? 'right' : 'left' });
      if (v.editing && Math.floor(t * 3.4) % 2 === 0) { ctx.font = `400 ${FS}px ${CELL}`; ctx.fillStyle = '#111'; ctx.fillRect(b.x + 9 + ctx.measureText(v.s).width, b.y + 8, 1.5, RHT - 16); }
    }
    // checkboxes
    for (let i = 0; i < 8; i++) {
      if (!boxesShown(t, i)) continue;
      const b = cellBox(2, i + 2), s = 20 * (hook(t) ? 1 : pop(t, ev.boxesIn[i])), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const on = isTicked(t, i), tk = ticks(t).find(([k]) => k === i), tp = on ? (tk[1] < 0 ? 1 : ease.outBack(clamp((t - tk[1]) / 0.2), 2)) : 0;
      rr(ctx, cx - s / 2, cy - s / 2, s, s, 4, on ? XL : '#FFFFFF', on ? XL : '#8A8A8A', 1.8);
      if (on) { ctx.save(); ctx.translate(cx, cy); ctx.scale(tp, tp); ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-1, 4); ctx.lineTo(6, -5); ctx.stroke(); ctx.restore(); }
      if (on && tk[1] > 0 && t - tk[1] < 0.5) { ctx.fillStyle = `rgba(80,200,120,${0.35 * (1 - (t - tk[1]) / 0.5)})`; ctx.fillRect(b.x, b.y, COLS[1] + COLS[2], b.h); }
      if (on) { ctx.strokeStyle = 'rgba(17,17,17,0.45)'; ctx.lineWidth = 1.5; const tb = cellBox(1, i + 2); ctx.font = `400 ${FS}px ${CELL}`; const w = ctx.measureText(S.TASKS[i]).width * tp; ctx.beginPath(); ctx.moveTo(tb.x + 8, tb.y + tb.h / 2 + 1); ctx.lineTo(tb.x + 8 + w, tb.y + tb.h / 2 + 1); ctx.stroke(); }
    }
    // selection
    if (t < ev.step4 || t >= ev.step5) {
      const s0 = cellBox(a.c, a.r0), s1 = cellBox(a.c, a.r1);
      ctx.strokeStyle = XL; ctx.lineWidth = 2.5; ctx.strokeRect(s0.x + 1, s0.y + 1, s0.w - 2, s1.y + s1.h - s0.y - 2);
      ctx.fillStyle = XL; ctx.fillRect(s0.x + s0.w - 4, s1.y + s1.h - 4, 7, 7);
    }
    // status bar
    const sy = WH - STATUS; ctx.fillStyle = '#F3F3F3'; ctx.fillRect(0, sy, WW, STATUS); ctx.fillStyle = '#E1E1E1'; ctx.fillRect(0, sy, WW, 1);
    txt(ctx, 'Ready', 14, sy + STATUS / 2, { size: 13, color: '#333' }); txt(ctx, 'Sheet1', 120, sy + STATUS / 2, { size: 13, color: XL_D, weight: 700 });
  }

  // ---------- the doughnut chart ----------
  function chart(ctx, t) {
    const shown = hook(t) || t >= ev.chartIn;
    if (!shown) return;
    const p = hook(t) ? 1 : 1 + 0.08 * (1 - ease.outCubic(clamp((t - ev.chartIn) / 0.2))); // slams in on the beat
    const styled = (k) => hook(t) || t >= k;
    const holeU = hook(t) ? 1 : ease.inOutCubic(clamp((t - ev.hole[0]) / (ev.hole[1] - ev.hole[0])));
    const thick = lerp(52, 30, holeU);
    const cDone = styled(ev.recolor) ? XL : '#4472C4', cLeft = styled(ev.recolor) ? GREY : '#ED7D31';
    ctx.save();
    ctx.translate(CHART.x + CHART.w / 2, CHART.y + CHART.h / 2); ctx.scale(p, p); ctx.translate(-(CHART.x + CHART.w / 2), -(CHART.y + CHART.h / 2));
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    rr(ctx, CHART.x, CHART.y, CHART.w, CHART.h, 6, '#FFFFFF', '#D0D0D0', 1); ctx.restore();
    if (!hook(t) && t >= ev.step4 && t < ev.step5) { ctx.strokeStyle = XL; ctx.lineWidth = 2; ctx.strokeRect(CHART.x, CHART.y, CHART.w, CHART.h); }
    txt(ctx, styled(ev.label) ? 'Weekly Progress' : 'Chart Title', CHART.x + CHART.w / 2, CHART.y + 34, { size: 20, weight: 700, color: '#333', align: 'center' });
    const v = pct(t), a0 = -Math.PI / 2;
    const r = DR - thick / 2;
    ctx.lineWidth = thick; ctx.lineCap = 'butt';
    ctx.strokeStyle = cLeft; ctx.beginPath(); ctx.arc(DC[0], DC[1], r, a0 + v * Math.PI * 2, a0 + Math.PI * 2); ctx.stroke();
    if (v > 0.001) { ctx.strokeStyle = cDone; ctx.beginPath(); ctx.arc(DC[0], DC[1], r, a0, a0 + v * Math.PI * 2); ctx.stroke(); }
    if (styled(ev.label)) {
      const lp = hook(t) ? 1 : pop(t, ev.label);
      ctx.save(); ctx.translate(DC[0], DC[1]); ctx.scale(lp, lp);
      txt(ctx, `${Math.round(v * 100)}%`, 0, -4, { size: 54, weight: 800, align: 'center', color: INK, spacing: -2 });
      txt(ctx, 'done', 0, 34, { size: 18, weight: 600, align: 'center', color: '#777' });
      ctx.restore();
    }
    // 100%: a green flash on the chart, on the beat
    if (!hook(t) && t >= ev.full && t < ev.full + 0.5) { ctx.fillStyle = `rgba(61,220,132,${0.45 * (1 - (t - ev.full) / 0.5)})`; ctx.fillRect(CHART.x, CHART.y, CHART.w, CHART.h); }
    ctx.restore();
  }

  function viewport(ctx, t) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
    rr(ctx, VP.x, VP.y, VP.w, VP.h, VP.r, '#FFFFFF'); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(VP.x, VP.y, VP.w, VP.h, VP.r); ctx.clip();
    ctx.fillStyle = '#EDEDED'; ctx.fillRect(VP.x, VP.y, VP.w, VP.h);
    const c = cam(t);
    ctx.translate(ANCHOR[0], ANCHOR[1]); ctx.scale(c.z, c.z); ctx.translate(-c.f[0], -c.f[1]);
    chrome(ctx, t); grid(ctx, t); chart(ctx, t);
    ctx.restore();
    rr(ctx, VP.x, VP.y, VP.w, VP.h, VP.r, null, 'rgba(0,0,0,0.08)', 2);
  }

  // ---------- menu path chips (screen space) ----------
  const CHIPS = [
    [ev.menu1, ev.boxesIn[7] + 0.4, 'Insert  ›  Checkbox'],
    [ev.typeF1[0], ev.enterF1 + 0.6, '=COUNTIF(B2:B9,TRUE)/8'],
    [ev.menu3, ev.chartIn + 0.8, 'Insert  ›  Charts  ›  Doughnut'],
    [ev.hole[0], ev.recolor, 'Format  ›  Hole size: 75%'],
    [ev.recolor, ev.label, 'Fill  ›  Green  +  Light grey'],
    [ev.label, ev.step5, 'Text box  ›  =E2'],
  ];
  function chips(ctx, t) {
    for (const [t0, t1, label] of CHIPS) {
      if (t < t0 || t >= t1) continue;
      const p = pop(t, t0, 0.25), out = clamp((t1 - t) / 0.15);
      ctx.save(); ctx.globalAlpha = out;
      ctx.font = `700 40px ${label.startsWith('=') ? '"JetBrains Mono", monospace' : SANS}`;
      const w = ctx.measureText(label).width + 64, x = W / 2, y = VP.y + 70;
      ctx.translate(x, y); ctx.scale(p, p);
      rr(ctx, -w / 2, -36, w, 72, 36, INK);
      txt(ctx, label, 0, 2, { size: 40, weight: 700, align: 'center', color: '#FFFFFF', fam: label.startsWith('=') ? '"JetBrains Mono", monospace' : SANS });
      ctx.restore();
    }
  }

  // ---------- captions ----------
  function captions(ctx, t) {
    const y0 = SAFE.y + 70, LH = 110;
    for (const c of S.captions) {
      if (t < c.t - 0.01 || t >= c.end) continue;
      c.lines.forEach((l, i) => {
        const pin = ease.outExpo(clamp((t - c.t - i * 0.08) / 0.5)), pout = ease.inCubic(clamp((t - (c.end - 0.22)) / 0.22));
        const size = c.step && i === 0 ? 60 : 92, y = c.step && i === 0 ? y0 + 10 : y0 + i * LH;
        ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 0.75, W, size * 1.25); ctx.clip();
        const dy = (1 - pin) * size * 1.1 - pout * size * 1.1;
        if (c.step && i === 0) { ctx.font = `800 ${size}px ${SANS}`; const w = ctx.measureText(l).width + 44; rr(ctx, SAFE.x + 10, y + dy - 40, w, 80, 40, XL); txt(ctx, l, SAFE.x + 32, y + dy + 2, { size, weight: 800, color: '#FFFFFF' }); }
        else txt(ctx, l, SAFE.x + 10, y + dy, { size, weight: 800, color: i === 1 ? XL : INK, spacing: -3 });
        ctx.restore();
      });
    }
  }

  // ---------- cover (first frame = grid thumbnail) ----------
  function cover(ctx, t) {
    if (t >= ev.coverEnd) return;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    const cx = 90, cy = 500, cw = W - 180, ch = 940;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14; rr(ctx, cx, cy, cw, ch, 36, '#FFFFFF'); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(cx, cy, cw, ch, 36); ctx.clip(); ctx.fillStyle = XL; ctx.fillRect(cx, cy, cw, 74); ctx.restore();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx + 44 + k * 30, cy + 37, 9, 0, 7); ctx.fill(); }
    txt(ctx, 'EXCEL BUILD', cx + cw - 36, cy + 38, { size: 26, weight: 700, color: '#FFFFFF', align: 'right', spacing: 3 });
    txt(ctx, S.TITLE.pre.toUpperCase(), W / 2, cy + 170, { size: 38, weight: 700, color: XL_D, align: 'center', spacing: 6 });
    S.TITLE.main.forEach((l, i) => {
      const y = cy + 290 + i * 122;
      ctx.font = `900 108px ${SANS}`; const w = ctx.measureText(l).width;
      if (i === S.TITLE.main.length - 1) { ctx.fillStyle = '#B9E4C9'; ctx.fillRect(W / 2 - w / 2 - 10, y + 18, w + 20, 34); }
      txt(ctx, l, W / 2, y, { size: 108, weight: 900, color: INK, align: 'center', spacing: -4 });
    });
    txt(ctx, S.TITLE.post.toUpperCase(), W / 2, cy + 560, { size: 38, weight: 700, color: XL_D, align: 'center', spacing: 6 });
    // mini preview of the build
    const mx = W / 2, my = cy + 760, r = 92;
    ctx.lineWidth = 34; ctx.strokeStyle = GREY; ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.stroke();
    ctx.strokeStyle = XL; ctx.beginPath(); ctx.arc(mx, my, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.5); ctx.stroke();
    txt(ctx, '75%', mx, my, { size: 50, weight: 800, align: 'center' });
    txt(ctx, '@sheethappens.daily', W / 2, cy + ch + 70, { size: 34, weight: 700, color: XL, align: 'center' });
  }

  // ---------- end card ----------
  function endCard(ctx, t) {
    if (t < ev.endCard) return;
    const p = ease.inOutCubic(clamp((t - ev.endCard + 0.05) / 0.45));
    ctx.fillStyle = BG; ctx.fillRect(0, H * (1 - p), W, H * p);
    if (p < 1) { ctx.fillStyle = XL; ctx.fillRect(0, H * (1 - p) - 14, W, 14); }
    const k = (d) => ease.outExpo(clamp((t - ev.endCard - d) / 0.5));
    const line = (s, y, size, color, d, weight = 800) => { const q = k(d); if (q <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 0.75, W, size * 1.3); ctx.clip(); txt(ctx, s, SAFE.x + 10, y + (1 - q) * size * 1.1, { size, weight, color, spacing: -3 }); ctx.restore(); };
    line('Save this.', SAFE.y + 70, 92, INK, 0.3);
    line('Build it at work.', SAFE.y + 180, 92, XL, 0.38);
    const q = ease.outBack(clamp((t - ev.endCard - 0.6) / 0.35), 1.8);
    if (q > 0) {
      const mx = W / 2, my = SAFE.y + 500;
      ctx.save(); ctx.translate(mx, my); ctx.scale(q, q);
      ctx.lineWidth = 46; ctx.strokeStyle = XL; ctx.beginPath(); ctx.arc(0, 0, 130, 0, 7); ctx.stroke();
      txt(ctx, '100%', 0, 0, { size: 72, weight: 800, align: 'center', spacing: -2 });
      ctx.restore();
    }
    const f = k(1.1);
    if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = INK; ctx.fillRect(SAFE.x + 10, SAFE.y + 770, 120, 6); txt(ctx, 'Follow for a new Excel build every day.', SAFE.x + 10, SAFE.y + 840, { size: 44, weight: 600, color: '#333', spacing: -1 }); ctx.restore(); }
  }

  // ---------- subtitles ----------
  function subtitles(ctx, t) {
    const VO = globalThis.VO || [];
    const line = VO.find((l) => t >= l.t - 0.05 && t < l.t + l.dur + 0.15);
    if (!line) return;
    const all = line.text.split(' ');
    const chars = all.reduce((n, w) => n + w.length + 1, 0);
    let acc = 0;
    const allT = all.map((w) => { const s0 = line.t + (acc / chars) * line.dur; acc += w.length + 1; return s0; });
    ctx.font = `700 46px ${SANS}`;
    const chunks = []; let cur = [];
    all.forEach((w, i) => { const test = [...cur.map((j) => all[j]), w].join(' '); if (cur.length && (cur.length >= 6 || ctx.measureText(test).width > 760 || /[.,?!]$/.test(all[cur[cur.length - 1]]))) { chunks.push(cur); cur = []; } cur.push(i); });
    if (cur.length) chunks.push(cur);
    const chs = [...chunks].reverse().find((c) => t >= allT[c[0]] - 0.05) || chunks[0];
    const words = chs.map((i) => all[i]), times = chs.map((i) => allT[i]);
    const size = 46, y = SAFE.y + SAFE.h - 40;
    const gap = ctx.measureText(' ').width, widths = words.map((w) => ctx.measureText(w).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
    const a = Math.min(clamp((t - line.t + 0.05) / 0.12), clamp((line.t + line.dur + 0.35 - t) / 0.15));
    ctx.save(); ctx.globalAlpha = a;
    rr(ctx, W / 2 - total / 2 - 28, y - size * 0.85, total + 56, size * 1.7, 18, 'rgba(17,17,17,0.88)');
    let x = W / 2 - total / 2;
    const lastOn = words.findLastIndex((_, j) => t >= times[j]);
    words.forEach((w, i) => { txt(ctx, w, x, y, { size, weight: 700, color: t >= times[i] ? (i === lastOn ? '#3DDC84' : '#FFFFFF') : 'rgba(255,255,255,0.45)' }); x += widths[i] + gap; });
    ctx.restore();
  }

  Studio.film({
    draw(ctx, t) {
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      txt(ctx, 'EXCEL BUILD', SAFE.x + 12, SAFE.y - 10, { size: 26, weight: 700, color: XL, spacing: 4 });
      viewport(ctx, t);
      chips(ctx, t);
      captions(ctx, t);
      endCard(ctx, t);
      subtitles(ctx, t);
      cover(ctx, t);
    },
    post: { paper: 0, vignette: 0, grain: 0.012 },
    fadeOut: 0,
  });
})();
