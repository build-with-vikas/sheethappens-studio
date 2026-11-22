// THE FILM — full tutorial with a visible cursor: every click, menu and panel is shown.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, SAFE = G.SAFE;
  const SANS = 'Inter, Helvetica, Arial, sans-serif';
  const CELL = 'Carlito, Calibri, "Liberation Sans", Arial, sans-serif';
  const MONO = '"JetBrains Mono", monospace';
  const XL = '#107C41', XL_D = '#0B5A2F', INK = '#111111', BG = '#F4F3EF', GREY = '#E4E4E0', RING = '#E03C31';

  // ---------- viewport + Excel world ----------
  const VP = { x: 40, y: 560, w: W - 80, h: 840, r: 30 };
  const ANCHOR = [VP.x + VP.w / 2, VP.y + VP.h / 2];
  const WW = VP.w, WH = VP.h;
  const TB = 44, TABS = 38, RIB = 86, FB = 36, CH = 26, RHT = 40, STATUS = 26, FS = 22;
  const RY = TB + TABS, FY = RY + RIB, TOP = FY + FB;
  const COLS = [40, 220, 80, 20, 90, 100, WW - 40 - 220 - 80 - 20 - 90 - 100];
  const colX = []; { let x = 0; for (const w of COLS) { colX.push(x); x += w; } }
  const LET = ['', 'A', 'B', 'C', 'D', 'E', 'F'];
  const rowY = (r) => TOP + CH + (r - 1) * RHT;
  const cellBox = (c, r) => ({ x: colX[c], y: rowY(r), w: COLS[c], h: RHT });
  const cellC = (c, r) => [colX[c] + COLS[c] / 2, rowY(r) + RHT / 2];
  const CHART = { x: 562, y: rowY(1) + 6, w: 270, h: 330 };
  const DC = [CHART.x + CHART.w / 2, CHART.y + 190], DR = 100;
  const PANEL = { x: 842, y: TOP, w: WW - 842, h: WH - TOP - STATUS };

  // tab positions (measured once, same font as drawn)
  const TABNAMES = ['File', 'Home', 'Insert', 'Draw', 'Page Layout', 'Formulas', 'Data', 'Review', 'View', 'Developer'];
  const TABX = {}; {
    const c = document.createElement('canvas').getContext('2d'); c.font = `400 15px ${SANS}`;
    let x = 18; for (const t of TABNAMES) { const w = c.measureText(t).width; TABX[t] = [x, w]; x += w + 20; }
  }
  const tabC = (name) => [TABX[name][0] + TABX[name][1] / 2, TB + TABS / 2];
  // ribbon buttons (world coords)
  const BTN = {
    checkbox: { x: 176, y: RY + 8, w: 66, h: 56, label: 'Checkbox' },
    pie: { x: 346, y: RY + 10, w: 40, h: 34 },
    textbox: { x: 470, y: RY + 8, w: 60, h: 56, label: 'Text Box' },
    pct: { x: 440, y: RY + 42, w: 24, h: 24 },
  };
  const btnC = (b) => [b.x + b.w / 2, b.y + b.h / 2];
  const GALLERY = { x: 330, y: FY - 2, w: 230, h: 176 };
  const doughnutItem = [GALLERY.x + 60, GALLERY.y + 136];
  const CTX_MENU = { x: DC[0] - 40, y: DC[1] - 120, w: 230, h: 176 };
  const formatItem = [CTX_MENU.x + 110, CTX_MENU.y + 150];
  const SLIDER = { x: PANEL.x + 14, y: PANEL.y + 150, w: PANEL.w - 28 };

  // ---------- ribbon / menus state ----------
  const between = (t, a, b) => t >= a && t < b;
  function ribbonTab(t) {
    if (between(t, ev.insertTab1, ev.boxesIn[7] + 0.6)) return 'Insert';
    if (between(t, ev.insertTab2, ev.chartIn + 0.4)) return 'Insert';
    if (between(t, ev.insertTab3, ev.drawBox[0] + 0.3)) return 'Insert';
    if (between(t, ev.devNote[0], ev.devNote[1])) return 'Developer';
    return 'Home';
  }
  const galleryOpen = (t) => between(t, ev.pieMenu, ev.chartIn);
  const ctxMenuOpen = (t) => between(t, ev.rightClick, ev.formatSeries + 0.15);
  const panelOpen = (t) => between(t, ev.formatSeries + 0.15, ev.s6);

  // ---------- cursor path: [time, x, y, click?] (world coords) ----------
  const CUR = [
    [ev.s1 - 0.2, 300, 520],
    [ev.drag1[0], ...cellC(2, 2), 'down'], [ev.drag1[1], ...cellC(2, 9)],
    [ev.insertTab1, ...tabC('Insert'), 'click'],
    [ev.checkboxBtn, ...btnC(BTN.checkbox), 'click'],
    ...ev.s2cTicks.map(([r, tt]) => [tt, ...cellC(2, r + 2), 'click']),
    [ev.clickE2, ...cellC(5, 2), 'click'],
    [ev.pctBtn, ...btnC(BTN.pct), 'click'],
    [ev.clickE3, ...cellC(5, 3), 'click'],
    [ev.drag4[0], ...cellC(5, 2), 'down'], [ev.drag4[1], ...cellC(5, 3)],
    [ev.insertTab2, ...tabC('Insert'), 'click'],
    [ev.pieMenu, ...btnC(BTN.pie), 'click'],
    [ev.chartIn, ...doughnutItem, 'click'],
    [ev.rightClick, DC[0] + 70, DC[1] - 60, 'right'],
    [ev.formatSeries, ...formatItem, 'click'],
    [ev.slider[0], SLIDER.x + SLIDER.w * 0.5, SLIDER.y, 'down'], [ev.slider[1], SLIDER.x + SLIDER.w * 0.75, SLIDER.y],
    [ev.fillDone, DC[0] + 70, DC[1] - 60, 'click'], [ev.fillLeft, DC[0] - 70, DC[1] + 60, 'click'],
    [ev.insertTab3, ...tabC('Insert'), 'click'],
    [ev.textBoxBtn, ...btnC(BTN.textbox), 'click'],
    [ev.drawBox[0], DC[0] - 40, DC[1] - 26, 'down'], [ev.drawBox[1], DC[0] + 40, DC[1] + 26],
    ...ev.testTicks.map(([r, tt]) => [tt, ...cellC(2, r + 2), 'click']),
  ];
  function cursorAt(t) {
    if (t < CUR[0][0] - 0.5 || t >= ev.endCard) return null;
    let i = CUR.findIndex((k) => k[0] > t);
    if (i === -1) return { x: CUR[CUR.length - 1][1], y: CUR[CUR.length - 1][2] };
    if (i === 0) return { x: CUR[0][1], y: CUR[0][2] };
    const a = CUR[i - 1], b = CUR[i];
    const dragging = a[3] === 'down';
    const dur = dragging ? b[0] - a[0] : Math.min(0.55, b[0] - a[0]);
    const u = ease.inOutCubic(clamp((t - (b[0] - dur)) / dur));
    return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u) };
  }

  // ---------- data state ----------
  const hook = (t) => t < ev.s1;
  function ticked(t) { // list of [row, time]
    if (hook(t)) return [...ev.hookDone.map((i) => [i, -9]), ...ev.hookTicks.filter(([, x]) => t >= x)];
    return [...ev.s2cTicks, ...ev.testTicks].filter(([, x]) => t >= x);
  }
  const isTicked = (t, i) => ticked(t).some(([k]) => k === i);
  const tickTime = (t, i) => (ticked(t).find(([k]) => k === i) || [0, -9])[1];
  function pct(t) {
    const list = hook(t) ? [...ev.hookDone.map((i) => [i, -9]), ...ev.hookTicks] : [...ev.s2cTicks, ...ev.testTicks];
    return list.reduce((s, [, x]) => s + ease.outCubic(clamp((t - x) / 0.35)), 0) / 8;
  }
  const typed = (w, times, t) => w.slice(0, times.filter((x) => x <= t).length);
  const boxesShown = (t, i) => hook(t) || t >= ev.boxesIn[i];

  function content(c, r, t) {
    const i = r - 2, H_ = hook(t);
    if (r === 1 && c === 1) return H_ || t >= ev.tasksIn[0] - 0.3 ? { s: 'Task', bold: true } : null;
    if (r === 1 && c === 2) return H_ || t >= ev.headerB ? { s: 'Done', bold: true } : null;
    if (c === 1 && i >= 0 && i < 8) return H_ || t >= ev.tasksIn[i] ? { s: S.TASKS[i], t0: H_ ? undefined : ev.tasksIn[i] } : null;
    if (c === 4 && (r === 2 || r === 3)) return H_ || t >= ev.labels ? { s: r === 2 ? 'Done' : 'Left', bold: true } : null;
    const n = ticked(t).length / 8;
    if (c === 5 && r === 2) {
      if (H_ || t >= ev.pctBtn) return { s: `${Math.round(n * 1000) / 10}%`, f: ev.F1, num: true };
      if (t >= ev.enterF1) return { s: String(Math.round(n * 1000) / 1000), f: ev.F1, num: true };
      if (t >= ev.typeF1[0]) return { s: typed(ev.F1, ev.typeF1, t), editing: true };
    }
    if (c === 5 && r === 3) {
      if (H_ || t >= ev.enterF2) return { s: `${Math.round((1 - n) * 1000) / 10}%`, f: ev.F2, num: true };
      if (t >= ev.typeF2[0]) return { s: typed(ev.F2, ev.typeF2, t), editing: true };
    }
    return null;
  }
  function active(t) {
    if (hook(t)) { const last = [...ev.hookTicks].reverse().find(([, x]) => t >= x - 0.3); const r = (last ? last[0] : 3) + 2; return { c: 2, r0: r, r1: r }; }
    if (t < ev.drag1[0]) { const k = ev.tasksIn.filter((x) => t >= x).length; return { c: 1, r0: Math.min(9, Math.max(2, k + 1)), r1: Math.min(9, Math.max(2, k + 1)) }; }
    if (t < ev.s2cTicks[0][1] - 0.3) return { c: 2, r0: 2, r1: 2 + Math.round(7 * clamp((t - ev.drag1[0]) / (ev.drag1[1] - ev.drag1[0]))) };
    if (t < ev.clickE2) { const last = [...ev.s2cTicks].reverse().find(([, x]) => t >= x - 0.3); const r = (last ? last[0] : 0) + 2; return { c: 2, r0: r, r1: r }; }
    if (t < ev.clickE3) return { c: 5, r0: 2, r1: 2 };
    if (t < ev.drag4[0]) return { c: 5, r0: 3, r1: 3 };
    if (t < ev.test) return { c: 5, r0: 2, r1: t < ev.drag4[1] ? 2 + Math.round(clamp((t - ev.drag4[0]) / (ev.drag4[1] - ev.drag4[0]))) : 3 };
    const last = [...ev.testTicks].reverse().find(([, x]) => t >= x - 0.3); const r = (last ? last[0] : 0) + 2; return { c: 2, r0: r, r1: r };
  }
  function formulaBarText(t, a) {
    if (between(t, ev.typeF3[0], ev.enterF3)) return typed(ev.F3, ev.typeF3, t);
    if (between(t, ev.enterF3, ev.test)) return ev.F3;
    const v = content(a.c, a.r0, t);
    if (v && (v.f || v.s)) return v.f || v.s;
    if (a.c === 2 && a.r0 >= 2 && boxesShown(t, a.r0 - 2)) return isTicked(t, a.r0 - 2) ? 'TRUE' : 'FALSE';
    return '';
  }

  // ---------- helpers ----------
  function txt(ctx, s, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
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
  const pop = (t, t0, d = 0.22) => ease.outBack(clamp((t - t0) / d), 2.2);
  // a red "look here" ring around a button, on screen in the world
  function callout(ctx, b, t, t0, t1) {
    if (!between(t, t0, t1)) return;
    const p = ease.outBack(clamp((t - t0) / 0.3), 2), a = clamp((t1 - t) / 0.2);
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = RING; ctx.lineWidth = 3.5;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, (b.w / 2 + 10) * p, (b.h / 2 + 8) * p, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  // ---------- Excel chrome ----------
  function chrome(ctx, t) {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, WW, WH);
    ctx.fillStyle = XL; ctx.fillRect(0, 0, WW, TB);
    txt(ctx, 'Progress.xlsx  -  Excel', WW / 2, TB / 2, { size: 17, color: '#FFFFFF', align: 'center' });
    ctx.fillStyle = '#F3F3F3'; ctx.fillRect(0, TB, WW, TABS);
    const tab = ribbonTab(t);
    for (const name of TABNAMES) {
      const [x, w] = TABX[name], on = name === tab;
      txt(ctx, name, x, TB + TABS / 2, { size: 15, color: on ? XL_D : '#333', weight: on ? 700 : 400 });
      if (on) { ctx.fillStyle = XL; ctx.fillRect(x, TB + TABS - 4, w, 3); }
    }
    ctx.fillStyle = '#FAFAFA'; ctx.fillRect(0, RY, WW, RIB); ctx.fillStyle = '#E1E1E1'; ctx.fillRect(0, RY + RIB - 1, WW, 1);
    const group = (label, x0, x1) => { txt(ctx, label, (x0 + x1) / 2, RY + RIB - 10, { size: 11, color: '#666', align: 'center' }); ctx.fillStyle = '#E1E1E1'; ctx.fillRect(x1 + 6, RY + 8, 1, RIB - 16); };
    if (tab === 'Insert') {
      rr(ctx, 20, RY + 10, 46, 40, 4, '#FFFFFF', '#9A9A9A'); txt(ctx, 'Table', 43, RY + 58, { size: 12, color: '#333', align: 'center' }); group('Tables', 16, 70);
      rr(ctx, 92, RY + 10, 50, 40, 4, '#FFFFFF', '#9A9A9A'); txt(ctx, 'Pictures', 117, RY + 58, { size: 12, color: '#333', align: 'center' }); group('Illustrations', 86, 160);
      // Checkbox button (Cell Controls)
      const b = BTN.checkbox; rr(ctx, b.x + 18, b.y + 6, 30, 30, 4, '#FFFFFF', '#666', 2);
      ctx.strokeStyle = XL; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(b.x + 25, b.y + 21); ctx.lineTo(b.x + 31, b.y + 28); ctx.lineTo(b.x + 42, b.y + 13); ctx.stroke();
      txt(ctx, 'Checkbox', b.x + b.w / 2, RY + 58, { size: 12, color: '#333', align: 'center' }); group('Cell Controls', 166, 256);
      // Charts group
      const icon = (x, kind) => {
        rr(ctx, x, RY + 10, 40, 34, 4, '#FFFFFF', '#BDBDBD');
        if (kind === 'col') { ctx.fillStyle = '#4472C4'; [[8, 14], [17, 8], [26, 18]].forEach(([dx, h]) => ctx.fillRect(x + dx, RY + 38 - h, 6, h)); }
        if (kind === 'line') { ctx.strokeStyle = '#4472C4'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 7, RY + 36); ctx.lineTo(x + 17, RY + 24); ctx.lineTo(x + 25, RY + 30); ctx.lineTo(x + 34, RY + 16); ctx.stroke(); }
        if (kind === 'pie') { ctx.lineWidth = 6; ctx.strokeStyle = '#4472C4'; ctx.beginPath(); ctx.arc(x + 17, RY + 27, 8, -Math.PI / 2, Math.PI * 0.8); ctx.stroke(); ctx.strokeStyle = '#ED7D31'; ctx.beginPath(); ctx.arc(x + 17, RY + 27, 8, Math.PI * 0.8, Math.PI * 1.5); ctx.stroke(); txt(ctx, '▾', x + 33, RY + 27, { size: 11, color: '#555', align: 'center' }); }
        if (kind === 'bar') { ctx.fillStyle = '#4472C4'; [[10, 22], [18, 14], [26, 26]].forEach(([dy, w]) => ctx.fillRect(x + 7, RY + dy, w, 5)); }
      };
      icon(262, 'col'); icon(304, 'line'); icon(BTN.pie.x, 'pie'); icon(388, 'bar');
      txt(ctx, 'Charts', 345, RY + 58, { size: 12, color: '#333', align: 'center' }); group('Charts', 256, 432);
      const tb = BTN.textbox; rr(ctx, tb.x + 14, tb.y + 6, 32, 30, 3, '#FFFFFF', '#666', 1.5); txt(ctx, 'A', tb.x + 30, tb.y + 21, { size: 18, weight: 700, color: '#333', align: 'center' });
      txt(ctx, 'Text Box', tb.x + tb.w / 2, RY + 58, { size: 12, color: '#333', align: 'center' }); group('Text', 444, 540);
    } else if (tab === 'Developer') {
      rr(ctx, 20, RY + 10, 46, 40, 4, '#FFFFFF', '#9A9A9A'); txt(ctx, 'Macros', 43, RY + 58, { size: 12, color: '#333', align: 'center' });
      const b = { x: 100, y: RY + 8, w: 60, h: 56 }; rr(ctx, b.x + 12, b.y + 6, 36, 30, 4, '#FFFFFF', '#666', 1.5); txt(ctx, 'Insert ▾', b.x + 30, RY + 58, { size: 12, color: '#333', align: 'center' });
      ctx.strokeStyle = XL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x + 20, b.y + 21); ctx.lineTo(b.x + 26, b.y + 27); ctx.lineTo(b.x + 37, b.y + 14); ctx.stroke();
      group('Controls', 90, 170);
      callout(ctx, b, t, ev.devNote[0] + 0.4, ev.devNote[1]);
    } else {
      rr(ctx, 20, RY + 12, 30, 36, 4, '#FFFFFF', '#9A9A9A', 1.5); txt(ctx, 'Paste', 35, RY + 58, { size: 12, color: '#444', align: 'center' }); group('Clipboard', 14, 64);
      rr(ctx, 84, RY + 12, 130, 24, 3, '#FFFFFF', '#C8C8C8'); txt(ctx, 'Aptos Narrow', 92, RY + 24, { size: 13, color: '#222' });
      txt(ctx, 'B', 90, RY + 52, { size: 16, weight: 700, color: '#222' }); txt(ctx, 'I', 116, RY + 52, { size: 16, color: '#222', fam: 'Liberation Serif' }); group('Font', 80, 230);
      rr(ctx, 410, RY + 12, 110, 24, 3, '#FFFFFF', '#C8C8C8'); txt(ctx, t >= ev.pctBtn ? 'Percentage' : 'General', 418, RY + 24, { size: 13, color: '#222' });
      txt(ctx, '$', 418, RY + 54, { size: 16, color: '#222' });
      const pb = BTN.pct, pressed = between(t, ev.pctBtn, ev.pctBtn + 0.25);
      rr(ctx, pb.x, pb.y, pb.w, pb.h, 3, pressed ? '#CFE7D8' : '#FAFAFA', pressed ? XL : null, 1.5); txt(ctx, '%', pb.x + pb.w / 2, pb.y + pb.h / 2 + 1, { size: 16, weight: 700, color: '#222', align: 'center' });
      txt(ctx, ',', 478, RY + 52, { size: 16, color: '#222' }); group('Number', 406, 524);
      callout(ctx, BTN.pct, t, ev.pctBtn - 0.7, ev.pctBtn + 0.5);
    }
    if (tab === 'Insert') {
      callout(ctx, BTN.checkbox, t, ev.insertTab1 + 0.3, ev.checkboxBtn + 0.6);
      callout(ctx, BTN.pie, t, ev.insertTab2 + 0.3, ev.pieMenu + 0.2);
      callout(ctx, BTN.textbox, t, ev.insertTab3 + 0.25, ev.textBoxBtn + 0.4);
    }
    // formula bar
    const a = active(t);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, FY, WW, FB); ctx.fillStyle = '#E1E1E1'; ctx.fillRect(0, FY + FB - 1, WW, 1);
    rr(ctx, 8, FY + 6, 84, FB - 12, 2, '#FFFFFF', '#C8C8C8');
    const nameBox = between(t, ev.enterF3 - 2, ev.test) && t >= ev.drawBox[0] ? 'TextBox 1' : `${LET[a.c]}${a.r0}`;
    txt(ctx, nameBox, 16, FY + FB / 2, { size: 15, color: '#222', fam: CELL });
    txt(ctx, 'fx', 120, FY + FB / 2, { size: 16, color: '#666', fam: 'Liberation Serif' });
    const fb = formulaBarText(t, a);
    if (fb) txt(ctx, fb, 158, FY + FB / 2, { size: 17, color: '#222', fam: CELL, weight: fb === 'TRUE' || fb === 'FALSE' ? 700 : 400 });
  }

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
    if (hook(t) || t >= ev.tasksIn[0]) { ctx.fillStyle = '#E3F1E8'; ctx.fillRect(colX[1], rowY(1), COLS[1] + COLS[2], RHT); }
    ctx.strokeStyle = '#E2E2E2'; ctx.lineWidth = 1;
    for (let r = 0; r <= nRows; r++) { const y = rowY(1) + r * RHT + 0.5; ctx.beginPath(); ctx.moveTo(COLS[0], y); ctx.lineTo(WW, y); ctx.stroke(); }
    for (let c = 1; c <= COLS.length; c++) { const xx = (colX[c] ?? WW) + 0.5; ctx.beginPath(); ctx.moveTo(xx, TOP); ctx.lineTo(xx, TOP + CH + nRows * RHT); ctx.stroke(); }
    ctx.fillStyle = '#C8C8C8'; ctx.fillRect(0, TOP + CH - 1, WW, 1); ctx.fillRect(COLS[0] - 1, TOP, 1, CH + nRows * RHT);
    for (let r = 1; r <= 9; r++) for (let c = 1; c <= 5; c++) {
      const v = content(c, r, t); if (!v || !v.s) continue;
      const b = cellBox(c, r), p = v.t0 !== undefined ? ease.outCubic(clamp((t - v.t0) / 0.18)) : 1;
      txt(ctx, v.s, v.num ? b.x + b.w - 8 : b.x + 8, b.y + b.h / 2 + 1 + (1 - p) * 10, { size: FS, fam: CELL, color: v.bold ? XL_D : '#111', weight: v.bold ? 700 : 400, alpha: p, align: v.num ? 'right' : 'left' });
      if (v.editing && Math.floor(t * 3.4) % 2 === 0) { ctx.font = `400 ${FS}px ${CELL}`; ctx.fillStyle = '#111'; ctx.fillRect(b.x + 9 + ctx.measureText(v.s).width, b.y + 8, 1.5, RHT - 16); }
    }
    for (let i = 0; i < 8; i++) {
      if (!boxesShown(t, i)) continue;
      const b = cellBox(2, i + 2), s = 20 * (hook(t) ? 1 : pop(t, ev.boxesIn[i])), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const on = isTicked(t, i), tt = tickTime(t, i), tp = on ? (tt < 0 ? 1 : ease.outBack(clamp((t - tt) / 0.2), 2)) : 0;
      rr(ctx, cx - s / 2, cy - s / 2, s, s, 4, on ? XL : '#FFFFFF', on ? XL : '#8A8A8A', 1.8);
      if (on) { ctx.save(); ctx.translate(cx, cy); ctx.scale(tp, tp); ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-1, 4); ctx.lineTo(6, -5); ctx.stroke(); ctx.restore(); }
      if (on && tt > 0 && t - tt < 0.5) { ctx.fillStyle = `rgba(80,200,120,${0.35 * (1 - (t - tt) / 0.5)})`; ctx.fillRect(colX[1], b.y, COLS[1] + COLS[2], b.h); }
      if (on) { ctx.strokeStyle = 'rgba(17,17,17,0.45)'; ctx.lineWidth = 1.5; const tb = cellBox(1, i + 2); ctx.font = `400 ${FS}px ${CELL}`; const w = ctx.measureText(S.TASKS[i]).width * tp; ctx.beginPath(); ctx.moveTo(tb.x + 8, tb.y + tb.h / 2 + 1); ctx.lineTo(tb.x + 8 + w, tb.y + tb.h / 2 + 1); ctx.stroke(); }
    }
    if (!(t >= ev.chartIn && t < ev.test)) {
      const s0 = cellBox(a.c, a.r0), s1 = cellBox(a.c, a.r1);
      ctx.strokeStyle = XL; ctx.lineWidth = 2.5; ctx.strokeRect(s0.x + 1, s0.y + 1, s0.w - 2, s1.y + s1.h - s0.y - 2);
      ctx.fillStyle = XL; ctx.fillRect(s0.x + s0.w - 4, s1.y + s1.h - 4, 7, 7);
    }
    const sy = WH - STATUS; ctx.fillStyle = '#F3F3F3'; ctx.fillRect(0, sy, WW, STATUS); ctx.fillStyle = '#E1E1E1'; ctx.fillRect(0, sy, WW, 1);
    txt(ctx, 'Ready', 14, sy + STATUS / 2, { size: 13, color: '#333' }); txt(ctx, 'Sheet1', 120, sy + STATUS / 2, { size: 13, color: XL_D, weight: 700 });
  }

  // ---------- chart + menus + panel ----------
  function chart(ctx, t) {
    if (!(hook(t) || t >= ev.chartIn)) return;
    const p = hook(t) ? 1 : 1 + 0.08 * (1 - ease.outCubic(clamp((t - ev.chartIn) / 0.2)));
    const holeU = hook(t) ? 1 : ease.inOutCubic(clamp((t - ev.slider[0]) / (ev.slider[1] - ev.slider[0])));
    const thick = lerp(DR * 0.5, DR * 0.25, holeU);
    const cDone = hook(t) || t >= ev.fillDone ? XL : '#4472C4', cLeft = hook(t) || t >= ev.fillLeft ? GREY : '#ED7D31';
    ctx.save();
    ctx.translate(CHART.x + CHART.w / 2, CHART.y + CHART.h / 2); ctx.scale(p, p); ctx.translate(-(CHART.x + CHART.w / 2), -(CHART.y + CHART.h / 2));
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4; rr(ctx, CHART.x, CHART.y, CHART.w, CHART.h, 6, '#FFFFFF', '#D0D0D0', 1); ctx.restore();
    if (!hook(t) && t < ev.test) { ctx.strokeStyle = XL; ctx.lineWidth = 2; ctx.strokeRect(CHART.x, CHART.y, CHART.w, CHART.h); }
    txt(ctx, hook(t) || t >= ev.enterF3 ? 'Weekly Progress' : 'Chart Title', CHART.x + CHART.w / 2, CHART.y + 32, { size: 19, weight: 700, color: '#333', align: 'center' });
    const v = pct(t), a0 = -Math.PI / 2, r = DR - thick / 2;
    ctx.lineWidth = thick; ctx.lineCap = 'butt';
    ctx.strokeStyle = cLeft; ctx.beginPath(); ctx.arc(DC[0], DC[1], r, a0 + v * Math.PI * 2, a0 + Math.PI * 2); ctx.stroke();
    if (v > 0.001) { ctx.strokeStyle = cDone; ctx.beginPath(); ctx.arc(DC[0], DC[1], r, a0, a0 + v * Math.PI * 2); ctx.stroke(); }
    // selected slice outline during fill steps
    if (between(t, ev.fillDone - 0.1, ev.fillLeft - 0.1) || between(t, ev.fillLeft - 0.1, ev.s6)) {
      ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(DC[0], DC[1], DR + 4, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    // the text box
    if (!hook(t) && between(t, ev.drawBox[0], ev.test)) {
      const u = clamp((t - ev.drawBox[0]) / (ev.drawBox[1] - ev.drawBox[0]));
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; ctx.strokeRect(DC[0] - 40, DC[1] - 26, 80 * u, 52 * u); ctx.restore();
    }
    if (hook(t) || t >= ev.enterF3) {
      const lp = hook(t) ? 1 : pop(t, ev.enterF3);
      ctx.save(); ctx.translate(DC[0], DC[1]); ctx.scale(lp, lp);
      txt(ctx, `${Math.round(v * 100)}%`, 0, -2, { size: 44, weight: 800, align: 'center', color: INK, spacing: -2 });
      ctx.restore();
    }
    if (!hook(t) && t >= ev.full && t < ev.full + 0.5) { ctx.fillStyle = `rgba(61,220,132,${0.45 * (1 - (t - ev.full) / 0.5)})`; ctx.fillRect(CHART.x, CHART.y, CHART.w, CHART.h); }
    ctx.restore();
  }
  function gallery(ctx, t) {
    if (!galleryOpen(t)) return;
    const g = GALLERY, p = clamp((t - ev.pieMenu) / 0.15);
    ctx.save(); ctx.globalAlpha = p;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 16; rr(ctx, g.x, g.y, g.w, g.h, 4, '#FFFFFF', '#C8C8C8'); ctx.restore();
    txt(ctx, '2-D Pie', g.x + 12, g.y + 18, { size: 13, weight: 700, color: '#333' });
    for (let k = 0; k < 3; k++) { const cx = g.x + 30 + k * 50, cy = g.y + 52; ctx.fillStyle = '#4472C4'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 15, -Math.PI / 2, Math.PI * (0.4 + k * 0.2)); ctx.fill(); ctx.fillStyle = '#ED7D31'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 15, Math.PI * (0.4 + k * 0.2), Math.PI * 1.5); ctx.fill(); }
    txt(ctx, 'Doughnut', g.x + 12, g.y + 96, { size: 13, weight: 700, color: '#333' });
    const [dx, dy] = doughnutItem, hot = t >= ev.chartIn - 0.6;
    if (hot) rr(ctx, dx - 24, dy - 22, 48, 44, 4, '#CFE7D8', XL, 1.5);
    ctx.lineWidth = 9; ctx.strokeStyle = '#4472C4'; ctx.beginPath(); ctx.arc(dx, dy, 13, -Math.PI / 2, Math.PI * 0.7); ctx.stroke(); ctx.strokeStyle = '#ED7D31'; ctx.beginPath(); ctx.arc(dx, dy, 13, Math.PI * 0.7, Math.PI * 1.5); ctx.stroke();
    if (hot) txt(ctx, 'Doughnut', dx + 34, dy, { size: 14, weight: 700, color: XL_D });
    ctx.restore();
  }
  function ctxMenu(ctx, t) {
    if (!ctxMenuOpen(t)) return;
    const m = CTX_MENU;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 16; rr(ctx, m.x, m.y, m.w, m.h, 4, '#FFFFFF', '#C8C8C8'); ctx.restore();
    const items = ['Delete', 'Reset to Match Style', 'Change Series Chart Type…', 'Select Data…', 'Format Data Series…'];
    items.forEach((it, k) => {
      const y = m.y + 18 + k * 34, hot = k === 4 && t >= ev.formatSeries - 0.5;
      if (hot) { ctx.fillStyle = '#CFE7D8'; ctx.fillRect(m.x + 4, y - 15, m.w - 8, 30); }
      txt(ctx, it, m.x + 14, y, { size: 14, color: '#222', weight: hot ? 700 : 400 });
    });
  }
  function panel(ctx, t) {
    if (!panelOpen(t)) return;
    const P = PANEL, sl = clamp((t - ev.formatSeries - 0.15) / 0.3);
    ctx.save(); ctx.translate((1 - ease.outCubic(sl)) * P.w, 0);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(P.x, P.y, P.w, P.h); ctx.fillStyle = '#D0D0D0'; ctx.fillRect(P.x, P.y, 1.5, P.h);
    txt(ctx, 'Format Data Series', P.x + 12, P.y + 24, { size: 14, weight: 700, color: '#222' });
    txt(ctx, 'Series Options', P.x + 12, P.y + 60, { size: 13, weight: 700, color: XL_D });
    txt(ctx, 'Doughnut Hole Size', P.x + 12, P.y + 118, { size: 12, color: '#333' });
    const holeU = ease.inOutCubic(clamp((t - ev.slider[0]) / (ev.slider[1] - ev.slider[0])));
    const val = Math.round(lerp(50, 75, holeU));
    ctx.fillStyle = '#C8C8C8'; ctx.fillRect(SLIDER.x, SLIDER.y - 2, SLIDER.w, 4);
    const kx = SLIDER.x + SLIDER.w * (val / 100); ctx.fillStyle = XL; ctx.fillRect(SLIDER.x, SLIDER.y - 2, kx - SLIDER.x, 4);
    ctx.beginPath(); ctx.arc(kx, SLIDER.y, 7, 0, 7); ctx.fillStyle = '#FFF'; ctx.fill(); ctx.strokeStyle = XL; ctx.lineWidth = 2; ctx.stroke();
    rr(ctx, P.x + 12, SLIDER.y + 18, 60, 26, 3, '#FFFFFF', '#C8C8C8'); txt(ctx, `${val}%`, P.x + 20, SLIDER.y + 31, { size: 14, weight: 700, color: '#222' });
    if (t >= S.L.s5b.t - 0.2) {
      txt(ctx, 'Fill', P.x + 12, SLIDER.y + 80, { size: 13, weight: 700, color: XL_D });
      txt(ctx, 'Color', P.x + 12, SLIDER.y + 112, { size: 12, color: '#333' });
      const col = t >= ev.fillLeft ? GREY : t >= ev.fillDone ? XL : '#4472C4';
      rr(ctx, P.x + 70, SLIDER.y + 100, 44, 24, 3, col, '#888', 1);
      [XL, GREY, '#4472C4', '#ED7D31'].forEach((c, k) => rr(ctx, P.x + 12 + k * 34, SLIDER.y + 136, 26, 20, 2, c, c === col ? INK : '#AAA', c === col ? 2.5 : 1));
    }
    ctx.restore();
  }
  function cursor(ctx, t, z) {
    const c = cursorAt(t); if (!c) return;
    const k = 1 / z * 1.6;
    // click ripples
    for (const p of CUR) {
      if (!p[3] || t < p[0] || t > p[0] + 0.45) continue;
      const u = (t - p[0]) / 0.45; ctx.strokeStyle = p[3] === 'right' ? `rgba(224,60,49,${1 - u})` : `rgba(16,124,65,${1 - u})`; ctx.lineWidth = 3 * k;
      ctx.beginPath(); ctx.arc(p[1], p[2], (6 + 22 * u) * k, 0, 7); ctx.stroke();
    }
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(k, k);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 17); ctx.lineTo(10, 26); ctx.lineTo(14, 24); ctx.lineTo(10, 15); ctx.lineTo(17, 15); ctx.closePath();
    ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }

  // ---------- camera ----------
  const WIDE_ = [478, 420], MID = [WW / 2, WH / 2];
  const CAM = [
    { t: 0, z: 1.08, f: WIDE_ },
    { t: ev.s1 - 0.01, z: 1.08, f: WIDE_ }, { t: ev.s1 + 0.6, z: 1.7, f: [260, 380] },
    { t: ev.s2, z: 1.7, f: [260, 380] }, { t: ev.s2 + 0.6, z: 1.45, f: [290, 300] },
    { t: ev.s2cTicks[0][1] - 0.6, z: 1.45, f: [290, 300] }, { t: ev.s2cTicks[0][1] - 0.1, z: 1.7, f: [260, 360] },
    { t: ev.s3, z: 1.7, f: [260, 360] }, { t: ev.s3 + 0.6, z: 1.5, f: [430, 300] },
    { t: ev.s4, z: 1.5, f: [430, 300] }, { t: ev.s4 + 0.6, z: 1.12, f: [490, 330] },
    { t: ev.s5, z: 1.12, f: [490, 330] }, { t: ev.s5 + 0.6, z: 1.04, f: [520, 420] },
    { t: ev.s6, z: 1.04, f: [520, 420] }, { t: ev.s6 + 0.6, z: 1.1, f: [510, 330] },
    { t: ev.test, z: 1.1, f: [510, 330] }, { t: ev.test + 0.6, z: 1.08, f: WIDE_ },
    { t: ev.endCard - 0.4, z: 1.08, f: WIDE_ }, { t: ev.endCard, z: 0.95, f: MID },
  ];
  function cam(t) {
    if (t <= CAM[0].t) return CAM[0];
    for (let i = 0; i < CAM.length - 1; i++) {
      const a = CAM[i], b = CAM[i + 1];
      if (t <= b.t) { const u = ease.inOutCubic(clamp((t - a.t) / Math.max(1e-6, b.t - a.t))); return { z: lerp(a.z, b.z, u), f: [lerp(a.f[0], b.f[0], u), lerp(a.f[1], b.f[1], u)] }; }
    }
    return CAM[CAM.length - 1];
  }
  function viewport(ctx, t) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18; rr(ctx, VP.x, VP.y, VP.w, VP.h, VP.r, '#FFFFFF'); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(VP.x, VP.y, VP.w, VP.h, VP.r); ctx.clip();
    ctx.fillStyle = '#EDEDED'; ctx.fillRect(VP.x, VP.y, VP.w, VP.h);
    const c = cam(t);
    ctx.translate(ANCHOR[0], ANCHOR[1]); ctx.scale(c.z, c.z); ctx.translate(-c.f[0], -c.f[1]);
    chrome(ctx, t); grid(ctx, t); chart(ctx, t); gallery(ctx, t); ctxMenu(ctx, t); panel(ctx, t); cursor(ctx, t, c.z);
    ctx.restore();
    rr(ctx, VP.x, VP.y, VP.w, VP.h, VP.r, null, 'rgba(0,0,0,0.08)', 2);
  }

  // ---------- chips: the exact path / formula, readable on a phone ----------
  const CHIPS = [
    [ev.insertTab1 - 0.2, ev.boxesIn[7] + 0.5, 'Insert  ›  Checkbox'],
    [ev.devNote[0], ev.devNote[1], 'Older Excel: Developer › Insert › ☑'],
    [ev.s2cTicks[0][1] - 0.1, ev.s3, 'Ticked = TRUE   Empty = FALSE'],
    [ev.typeF1[0], ev.pctBtn - 0.8, '=COUNTIF(B2:B9,TRUE)/8'],
    [ev.pctBtn - 0.8, ev.clickE3, 'Home  ›  %'],
    [ev.typeF2[0], ev.s4, 'E3:  =1-E2'],
    [ev.insertTab2 - 0.2, ev.chartIn + 0.7, 'Insert  ›  Pie ▾  ›  Doughnut'],
    [ev.rightClick, ev.slider[0], 'Right-click  ›  Format Data Series'],
    [ev.slider[0], S.L.s5b.t, 'Doughnut Hole Size: 75%'],
    [ev.fillDone, ev.s6, 'Fill: Done = Green, Left = Grey'],
    [ev.insertTab3 - 0.2, ev.typeF3[0], 'Insert  ›  Text Box'],
    [ev.typeF3[0], ev.test, 'Formula bar:  =E2'],
  ];
  function chips(ctx, t) {
    for (const [t0, t1, label] of CHIPS) {
      if (t < t0 || t >= t1) continue;
      const p = pop(t, t0, 0.25), out = clamp((t1 - t) / 0.15), mono = label.startsWith('=') || label.includes(':  =');
      ctx.save(); ctx.globalAlpha = out;
      const size = label.length > 30 ? 34 : 40;
      ctx.font = `700 ${size}px ${mono ? MONO : SANS}`;
      const w = Math.min(W - 60, ctx.measureText(label).width + 60);
      ctx.translate(W / 2, VP.y - 52); ctx.scale(p, p);
      rr(ctx, -w / 2, -34, w, 68, 34, INK);
      txt(ctx, label, 0, 2, { size, weight: 700, align: 'center', color: '#FFFFFF', fam: mono ? MONO : SANS });
      ctx.restore();
    }
  }
  function captions(ctx, t) {
    const y0 = SAFE.y + 40, LH = 100;
    for (const c of S.captions) {
      if (t < c.t - 0.01 || t >= c.end) continue;
      c.lines.forEach((l, i) => {
        const pin = ease.outExpo(clamp((t - c.t - i * 0.08) / 0.5)), pout = ease.inCubic(clamp((t - (c.end - 0.22)) / 0.22));
        const small = c.step && i === 0, size = small ? 54 : 84, y = small ? y0 + 6 : y0 + i * LH;
        ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 0.75, W, size * 1.25); ctx.clip();
        const dy = (1 - pin) * size * 1.1 - pout * size * 1.1;
        if (small) { ctx.font = `800 ${size}px ${SANS}`; const w = ctx.measureText(l).width + 40; rr(ctx, SAFE.x + 10, y + dy - 36, w, 72, 36, XL); txt(ctx, l, SAFE.x + 30, y + dy + 2, { size, weight: 800, color: '#FFFFFF' }); }
        else txt(ctx, l, SAFE.x + 10, y + dy, { size, weight: 800, color: i === 1 ? XL : INK, spacing: -3 });
        ctx.restore();
      });
    }
  }

  // ---------- cover, end card, subtitles ----------
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
      const y = cy + 290 + i * 122; ctx.font = `900 108px ${SANS}`; const w = ctx.measureText(l).width;
      if (i === S.TITLE.main.length - 1) { ctx.fillStyle = '#B9E4C9'; ctx.fillRect(W / 2 - w / 2 - 10, y + 18, w + 20, 34); }
      txt(ctx, l, W / 2, y, { size: 108, weight: 900, color: INK, align: 'center', spacing: -4 });
    });
    txt(ctx, S.TITLE.post.toUpperCase(), W / 2, cy + 560, { size: 38, weight: 700, color: XL_D, align: 'center', spacing: 6 });
    const mx = W / 2, my = cy + 760, r = 92;
    ctx.lineWidth = 34; ctx.strokeStyle = GREY; ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.stroke();
    ctx.strokeStyle = XL; ctx.beginPath(); ctx.arc(mx, my, r, -Math.PI / 2, Math.PI); ctx.stroke();
    txt(ctx, '75%', mx, my, { size: 50, weight: 800, align: 'center' });
    txt(ctx, '@sheethappens.daily', W / 2, cy + ch + 70, { size: 34, weight: 700, color: XL, align: 'center' });
  }
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
    if (q > 0) { ctx.save(); ctx.translate(W / 2, SAFE.y + 500); ctx.scale(q, q); ctx.lineWidth = 46; ctx.strokeStyle = XL; ctx.beginPath(); ctx.arc(0, 0, 130, 0, 7); ctx.stroke(); txt(ctx, '100%', 0, 0, { size: 72, weight: 800, align: 'center', spacing: -2 }); ctx.restore(); }
    const f = k(1.1);
    if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = INK; ctx.fillRect(SAFE.x + 10, SAFE.y + 770, 120, 6); txt(ctx, 'Follow for a new Excel build every day.', SAFE.x + 10, SAFE.y + 840, { size: 44, weight: 600, color: '#333', spacing: -1 }); ctx.restore(); }
  }
  function subtitles(ctx, t) {
    const VO = globalThis.VO || [];
    const line = VO.find((l) => t >= l.t - 0.05 && t < l.t + l.dur + 0.15);
    if (!line) return;
    const all = line.text.split(' ');
    const chars = all.reduce((n, w) => n + w.length + 1, 0);
    let acc = 0; const allT = all.map((w) => { const s0 = line.t + (acc / chars) * line.dur; acc += w.length + 1; return s0; });
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
    let x = W / 2 - total / 2; const lastOn = words.findLastIndex((_, j) => t >= times[j]);
    words.forEach((w, i) => { txt(ctx, w, x, y, { size, weight: 700, color: t >= times[i] ? (i === lastOn ? '#3DDC84' : '#FFFFFF') : 'rgba(255,255,255,0.45)' }); x += widths[i] + gap; });
    ctx.restore();
  }

  Studio.film({
    draw(ctx, t) {
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
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
