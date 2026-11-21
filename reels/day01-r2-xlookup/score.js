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

  // ID | Name | Dept
  const PEOPLE = [
    ['E101', 'Aisha Khan', 'Sales'], ['E102', 'Rahul Sharma', 'HR'], ['E103', 'Sara Ali', 'Finance'],
    ['E104', 'Arjun Mehta', 'IT'], ['E105', 'Priya Singh', 'Sales'], ['E106', 'Omar Farooq', 'Ops'],
  ];
  const FILL_NOTES = ['F5', 'G5', 'A5', 'C6', 'D6'].map(m);

    const chars = (str, t0, dt) => [...str].map((_, i) => t0 + i * dt);
  const VL = '=VLOOKUP(B9,A2:C7,1,0)', XF = '=XLOOKUP(B9,B2:B7,A2:A7)', NF = ',"Not found")';
  const ev = {
    namesIn: PEOPLE.map((_, i) => 0.3 + i * BEAT / 4),
    VL, XF, NF,
    typeV: chars(VL, 0.45, 0.065),
    enterV: 2.2,
    stamp: 2.8,
    clear: T(2),
    typeX: chars(XF, T(2, 1), 0.1),
    enterX: T(4),
    selName: T(6),
    typeName: chars('Omar Farooq', T(6, 1), 0.07),
    enterN: T(7),
    selZ: T(8),
    typeZ: chars('Zara', T(8, 0.5), 0.12),
    enterZ: T(8, 2),
    selNF: T(8, 2.5),
    typeNF: chars(NF, T(8, 3), 0.075),
    enterNF: T(9, 2),
    recap: T(10),
    endCard: T(12),
  };

  const captions = [
    { t: 0.05, end: T(2), lines: ['Still using', 'VLOOKUP? ❌'], color: '#C42B1C' },
    { t: T(2), end: T(4), lines: ['Do this instead ✅', 'Use XLOOKUP'] },
    { t: T(4), end: T(6), lines: ['It looks left.', 'No errors.'] },
    { t: T(6), end: T(8), lines: ['Change the name.', 'Updates instantly.'] },
    { t: T(8), end: T(10), lines: ['Bonus 🔥', 'No more #N/A'] },
    { t: T(10), end: T(12), lines: ['XLOOKUP', 'beats VLOOKUP.'] },
  ];

  const markers = {
    stamp: { t: ev.stamp, sync: 'v' },
    press: { t: ev.enterX, sync: 'av' },
    press2: { t: ev.enterN, sync: 'v' },
    press3: { t: ev.enterNF, sync: 'v' },
    end: ev.endCard,
  };

  const SCORE = { FPS, STYLE, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, S, m, chords, chordAt, PEOPLE, FILL_NOTES, ev, captions, markers };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
