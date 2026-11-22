// THE SCORE — full tutorial: "How To Create a Progress Doughnut Chart In Excel".
// Every visual is anchored to the sentence that explains it (vo.js, written by make_vo.py), so the
// voice never has to rush: the picture waits for the words.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const VO = node ? require('./vo.js') : globalThis.VO;
  const { m, makeClock, makeChords } = MU;

  const FPS = 30;
  const STYLE = 'flat';
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const clock = makeClock({ bpm: 90, offset: 0 }); // calm lo-fi bed under the teaching voice
  const { T, BEAT } = clock;

  const L = Object.fromEntries(VO.map((v) => [v.key, v]));
  const at = (k, f) => L[k].t + f * L[k].dur;
  const DURATION = Math.ceil((L.end.t + L.end.dur + 0.9) * 10) / 10;

  const TITLE = { pre: 'How To Create', main: ['Progress', 'Doughnut Chart'], post: 'In Excel' };
  const bars = Math.ceil(DURATION / (BEAT * 4)) + 1;
  const prog = ['F', 'C', 'Dm', 'Bb'];
  const { chords, chordAt } = makeChords(clock, {
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F2' }, C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' }, Bb: { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb1' },
  }, Array.from({ length: bars }, (_, b) => [b, 0, 4, prog[b % 4]]));

  const TASKS = ['Plan the week', 'Send report', 'Team call', 'Update budget', 'Book travel', 'Review deck', 'Pay invoices', 'Gym'];
  const FILL_NOTES = ['F5', 'G5', 'A5', 'C6', 'D6', 'F6'].map(m);
  const spread = (str, t0, t1) => [...str].map((_, i, a) => t0 + (i / Math.max(1, a.length - 1)) * (t1 - t0));
  const F1 = '=COUNTIF(B2:B9,TRUE)/8', F2 = '=1-E2', F3 = '=E2';

  const fullT = L.full.t - 0.25;
  const ev = {
    coverEnd: 0.6,
    hookDone: [0, 1, 2],
    hookTicks: [3, 4, 5, 6].map((r, i) => [r, L.hook.t + 0.6 + i * 0.75]),
    // step 1: tasks + header
    s1: L.s1.t,
    tasksIn: TASKS.map((_, i) => L.s1.t + 0.7 + i * 0.25),
    headerB: at('s1', 0.75),
    // step 2: select B2:B9, Insert tab, Checkbox
    s2: L.s2.t,
    drag1: [at('s2', 0.18), at('s2', 0.38)],
    insertTab1: at('s2', 0.55),
    checkboxBtn: at('s2', 0.86),
    boxesIn: TASKS.map((_, i) => at('s2', 0.86) + 0.1 + i * 0.06),
    devNote: [L.s2b.t, L.s2b.t + L.s2b.dur + 0.3],
    s2cTicks: [[0, at('s2c', 0.1)], [1, at('s2c', 0.4)], [2, at('s2c', 0.7)]],
    // step 3: formula
    s3: L.s3.t,
    labels: L.s3.t + 0.1,
    clickE2: at('s3', 0.12),
    F1, F2, F3,
    typeF1: spread(F1, at('s3', 0.3), at('s3', 0.95)),
    enterF1: L.s3b.t + 0.15,
    pctBtn: at('s3b', 0.72),
    clickE3: L.s3c.t + 0.05,
    typeF2: spread(F2, at('s3c', 0.35), at('s3c', 0.7)),
    enterF2: at('s3c', 0.9),
    // step 4: chart
    s4: L.s4.t,
    drag4: [at('s4', 0.12), at('s4', 0.25)],
    insertTab2: at('s4', 0.38),
    pieMenu: at('s4', 0.6),
    chartIn: at('s4', 0.86),
    // step 5: format
    s5: L.s5.t,
    rightClick: at('s5', 0.2),
    formatSeries: at('s5', 0.42),
    slider: [at('s5', 0.62), at('s5', 0.92)],
    fillDone: at('s5b', 0.2), fillLeft: at('s5b', 0.62),
    // step 6: label
    s6: L.s6.t,
    insertTab3: at('s6', 0.14),
    textBoxBtn: at('s6', 0.3),
    drawBox: [at('s6', 0.38), at('s6', 0.5)],
    typeF3: spread(F3, at('s6', 0.66), at('s6', 0.8)),
    enterF3: at('s6', 0.92),
    // test
    test: L.test.t,
    testTicks: [3, 4, 5, 6, 7].map((r, i) => [r, i < 4 ? L.test.t + 0.3 + i * ((fullT - L.test.t - 0.3) / 4) : fullT]),
    full: fullT,
    endCard: L.end.t - 0.35,
  };

  const captions = [
    { t: ev.coverEnd, end: ev.s1, lines: ['Tick a box.', 'Watch it fill.'] },
    { t: ev.s1, end: ev.s2, lines: ['Step 1', 'Type your tasks'], step: true },
    { t: ev.s2, end: ev.s3, lines: ['Step 2', 'Insert checkboxes'], step: true },
    { t: ev.s3, end: ev.s4, lines: ['Step 3', 'Count the ticks'], step: true },
    { t: ev.s4, end: ev.s5, lines: ['Step 4', 'Doughnut chart'], step: true },
    { t: ev.s5, end: ev.s6, lines: ['Step 5', 'Style the ring'], step: true },
    { t: ev.s6, end: ev.test, lines: ['Step 6', 'Add the % label'], step: true },
    { t: ev.test, end: ev.endCard, lines: ['Now test it.', 'Tick, tick, tick ✅'] },
  ];

  const markers = {
    cover: { t: ev.coverEnd, sync: 'v' },
    boxes: ev.checkboxBtn,
    chart: { t: ev.chartIn, sync: 'v' },
    full: { t: ev.full, sync: 'v' },
    end: ev.endCard,
  };

  const SCORE = { FPS, STYLE, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, chords, chordAt, m, TITLE, TASKS, FILL_NOTES, ev, captions, markers, L };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
