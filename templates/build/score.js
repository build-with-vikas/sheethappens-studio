// THE SCORE — "How To Create Progress Doughnut Chart In Excel" (build format: cover, result-first hook, steps, demo, end card)
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, makeChords } = MU;

  const FPS = 30;
  const STYLE = 'flat';
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const clock = makeClock({ bpm: 120, offset: 0 });
  const { T, BEAT } = clock;
  const DURATION = T(15) + 0.5; // 30.5 s

  const TITLE = { pre: 'How To Create', main: ['Progress', 'Doughnut Chart'], post: 'In Excel' };

  const { chords, chordAt } = makeChords(clock, {
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F2' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    Bb: { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb1' },
    Fmaj9: { notes: ['A3', 'C4', 'E4', 'G4'], bass: 'F1' },
  }, [
    ...[0, 4, 8].flatMap((b) => [[b, 0, 4, 'F'], [b + 1, 0, 4, 'C'], [b + 2, 0, 4, 'Dm'], [b + 3, 0, 4, 'Bb']]),
    [12, 0, 4, 'F'], [13, 0, 4, 'Fmaj9'], [14, 0, 4, 'Fmaj9'], [15, 0, 4, 'Fmaj9'],
  ]);

  const TASKS = ['Plan the week', 'Send report', 'Team call', 'Update budget', 'Book travel', 'Review deck', 'Pay invoices', 'Gym'];
  const FILL_NOTES = ['F5', 'G5', 'A5', 'C6', 'D6', 'F6'].map(m);
  const chars = (str, t0, dt) => [...str].map((_, i) => t0 + i * dt);
  const F1 = '=COUNTIF(B2:B9,TRUE)/8', F2 = '=1-E2';

  const ev = {
    coverEnd: 0.6,
    // hook: finished sheet, 3 of 8 already done, four more ticks
    hookDone: [0, 1, 2],
    hookTicks: [[3, T(0, 2)], [4, T(0, 3)], [5, T(1, 0)], [6, T(1, 1)]],
    step1: T(1, 2),                                   // blank sheet, add tasks + checkboxes
    tasksIn: TASKS.map((_, i) => T(1, 2.5) + i * BEAT / 4),
    menu1: T(2, 1.5),
    boxesIn: TASKS.map((_, i) => T(2, 3) + i * BEAT / 8),
    step2: T(3, 2),
    labels: T(3, 2.5),
    F1, F2,
    typeF1: chars(F1, T(3, 3), 0.075),
    enterF1: T(4, 3),
    typeF2: chars(F2, T(5, 0), 0.08),
    enterF2: T(5, 1),
    step3: T(5, 2),
    select: T(5, 3),
    menu3: T(6, 0),
    chartIn: T(6, 3),
    step4: T(8),
    hole: [T(8, 1), T(8, 2.5)],
    recolor: T(8, 3),
    label: T(9, 1),
    step5: T(10),
    buildTicks: [0, 1, 2, 3, 4, 5].map((r, i) => [r, T(10, 1) + i * BEAT]),
    demo: T(12),
    demoTicks: [[6, T(12, 1)], [7, T(12, 3)]],
    full: T(12, 3),
    endCard: T(13, 2),
  };

  const captions = [
    { t: ev.coverEnd, end: ev.step1, lines: ['Tick a box.', 'Watch it fill.'] },
    { t: ev.step1, end: ev.step2, lines: ['Step 1', 'Tasks + checkboxes'], step: true },
    { t: ev.step2, end: ev.step3, lines: ['Step 2', 'Count the ticks'], step: true },
    { t: ev.step3, end: ev.step4, lines: ['Step 3', 'Doughnut chart'], step: true },
    { t: ev.step4, end: ev.step5, lines: ['Step 4', 'Style it'], step: true },
    { t: ev.step5, end: ev.demo, lines: ['Step 5', 'Tick your tasks'], step: true },
    { t: ev.demo, end: ev.endCard, lines: ['All done?', '100% ✅'] },
  ];

  const markers = {
    cover: { t: ev.coverEnd, sync: 'v' },
    chart: { t: ev.chartIn, sync: 'av' },
    full: { t: ev.full, sync: 'v' },
    end: ev.endCard,
  };

  const SCORE = { FPS, STYLE, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, chords, chordAt, m, TITLE, TASKS, FILL_NOTES, ev, captions, markers };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
