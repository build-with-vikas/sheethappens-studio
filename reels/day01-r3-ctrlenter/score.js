// THE SCORE — Excel Flash Fill (Ctrl+E) reel. Single source of truth for music AND picture.
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
  const clock = makeClock({ bpm: 120, offset: 0 }); // 1 beat = 0.5s, 1 bar = 2s
  const { T, BEAT } = clock;
  const DURATION = T(14); // 28s

  const S = {
    wrong: [0, T(2)], first: [T(2), T(5, 2)], last: [T(5, 2), T(7)],
    bonus: [T(7), T(10)], recap: [T(10), T(12)], end: [T(12), DURATION],
  };

  const { chords, chordAt } = makeChords(clock, {
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F2' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    Bb: { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb1' },
    Fmaj9: { notes: ['A3', 'C4', 'E4', 'G4'], bass: 'F1' },
  }, [
    ...[0, 4, 8].flatMap((b) => [[b, 0, 4, 'F'], [b + 1, 0, 4, 'C'], [b + 2, 0, 4, 'Dm'], [b + 3, 0, 4, 'Bb']]),
    [12, 0, 4, 'Fmaj9'], [13, 0, 4, 'Fmaj9'],
  ]);

  // Item | Price
  const PEOPLE = [
    ['Laptop', 45000], ['Mouse', 800], ['Monitor', 12000],
    ['Keyboard', 1500], ['Webcam', 2500], ['Headset', 3000],
  ];
  const FILL_NOTES = ['F5', 'G5', 'A5', 'C6', 'D6'].map(m);

  const EMAIL = (p) => `${p[0].toLowerCase()}.${p[1].toLowerCase()}@work.com`;
  const chars = (str, t0, dt) => [...str].map((_, i) => t0 + i * dt);
  const ev = {
    namesIn: PEOPLE.map((_, i) => 0.3 + i * BEAT / 4),
    // WRONG way: typing "Ordered" in C2, C3, C4 one by one
    manual: [2, 3, 4].map((r, k) => ({ w: k < 2 ? 'Ordered' : 'Ord', r, times: chars(k < 2 ? 'Ordered' : 'Ord', 0.45 + k * 1.05, 0.12) })),
    stamp: 3.3,
    clear: T(2),
    drag1: [T(2, 0.5), T(2, 1.5)],               // select C2:C7
    type1: chars('Ordered', T(2, 2), 0.1),
    ctrl1: T(3, 2),
    e1: T(4),                                   // Ctrl+Enter: all six at once
    picks: [T(5, 2), T(5, 3), T(6, 0)],           // Ctrl-click C3, C5, C7
    type2: chars('Urgent', T(6, 1), 0.1),
    ctrl2: T(6, 3),
    e2: T(7),
    drag3: [T(7, 2), T(8, 0)],                    // select D2:D7
    type3: chars('=B2*1.18', T(8, 0.5), 0.1),
    ctrl3: T(8, 3),
    e3: T(9),
    recap: T(10),
    endCard: T(12),
  };

  const captions = [
    { t: 0.05, end: T(2), lines: ["You're doing this ❌", 'one cell at a time'], color: '#C42B1C' },
    { t: T(2), end: T(4), lines: ['Do this instead ✅', 'Select. Type once.'] },
    { t: T(4), end: T(5, 2), lines: ['Ctrl + Enter.', 'All filled.'] },
    { t: T(5, 2), end: T(7, 2), lines: ['Scattered cells?', 'Same trick.'] },
    { t: T(7, 2), end: T(10), lines: ['Bonus 🔥', 'Formulas too'] },
    { t: T(10), end: T(12), lines: ['Type once.', 'Ctrl + Enter.'] },
  ];

  const markers = {
    stamp: { t: ev.stamp, sync: 'v' },
    press: { t: ev.e1, sync: 'av' },
    press2: { t: ev.e2, sync: 'v' },
    press3: { t: ev.e3, sync: 'v' },
    end: ev.endCard,
  };

  const SCORE = { FPS, STYLE, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, S, m, chords, chordAt, PEOPLE, FILL_NOTES, ev, captions, markers };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
