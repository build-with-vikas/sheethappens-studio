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

  const PEOPLE = [
    ['Aisha', 'Khan'], ['Rahul', 'Sharma'], ['Sara', 'Ali'],
    ['Arjun', 'Mehta'], ['Priya', 'Singh'], ['Omar', 'Farooq'],
  ];
  const FILL_NOTES = ['F5', 'G5', 'A5', 'C6', 'D6'].map(m);

  const EMAIL = (p) => `${p[0].toLowerCase()}.${p[1].toLowerCase()}@work.com`;
  const ev = {
    namesIn: PEOPLE.map((_, i) => 0.35 + i * BEAT / 4),
    // the WRONG way first: slow manual typing, a red stamp, then wipe
    manual: [['Aisha', 2, 0.35], ['Rahul', 3, 1.15], ['Sara', 4, 1.95], ['Arj', 5, 2.75]].map(([w, r, t0]) => ({ w, r, times: [...w].map((_, i) => t0 + i * 0.13) })),
    stamp: 3.3,
    clear: T(2),
    selB2: T(2),
    typeB: [...'Aisha'].map((_, i) => T(2, 1) + i * BEAT / 2),
    ctrl1: T(3, 2),
    breath1: T(3, 3.5),
    e1: T(4),
    fillB: [1, 2, 3, 4, 5].map((k) => T(4) + k * BEAT / 2),
    selC2: T(5, 2),
    typeC: [...'Khan'].map((_, i) => T(5, 3) + i * BEAT / 4),
    ctrl2: T(6, 1),
    e2: T(6, 2),
    fillC: [1, 2, 3, 4, 5].map((k) => T(6, 2) + k * BEAT / 4),
    selD2: T(7),
    typeD: [...EMAIL(PEOPLE[0])].map((_, i) => T(7, 1) + i * BEAT / 4),
    ctrl3: T(8, 2),
    e3: T(9),
    fillD: [1, 2, 3, 4, 5].map((k) => T(9) + k * BEAT / 2),
    recap: T(10),
    endCard: T(12),
  };

  const captions = [
    { t: 0.05, end: T(2), lines: ["You're doing this ❌", 'typing every name'], color: '#C42B1C' },
    { t: T(2), end: T(3, 1), lines: ['Do this instead ✅', 'Type one example'] },
    { t: T(3, 1), end: T(4), lines: ['Then press', 'Ctrl + E'] },
    { t: T(4), end: T(5, 2), lines: ["That's it.", 'Flash Fill ✅'] },
    { t: T(5, 2), end: T(7), lines: ['Last names?', 'Same trick.'] },
    { t: T(7), end: T(10), lines: ['Bonus 🔥', 'It builds emails too'] },
    { t: T(10), end: T(12), lines: ['See a pattern?', 'Ctrl + E sees it too.'] },
  ];

  const markers = {
    stamp: { t: ev.stamp, sync: 'v' },
    press: { t: ev.e1, sync: 'av' },
    press2: { t: ev.e2, sync: 'v' },
    press3: { t: ev.e3, sync: 'v' },
    end: ev.endCard,
  };

  const SCORE = { FPS, STYLE, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, S, m, chords, chordAt, PEOPLE, FILL_NOTES, EMAIL, ev, captions, markers };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
