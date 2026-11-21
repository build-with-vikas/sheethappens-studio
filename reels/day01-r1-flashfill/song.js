// THE SONG — upbeat 120 BPM groove; every keypress, cell fill and title has its own sound.
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const Genre = require('./engine/audio/genres');
const sc = require('./score');
const { T, BEAT, DURATION, ev, clock, chordAt } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drums = bus(), bass = bus(), pad = bus(), keys = bus(), fx = bus(), verb = bus(), dly = bus();

// backing: bar 0 without drums (the hook), full groove after, soft outro
Genre.play('edm', { clock, from: 0, to: 2, chordAt, buses: { drums, bass, pad, keys }, drums: false, gain: 0.7 });
const g = Genre.play('edm', { clock, from: 2, to: 12, chordAt, buses: { drums, bass, pad, keys } });
Genre.play('edm', { clock, from: 12, to: 14, chordAt, buses: { drums, bass, pad, keys }, drums: false, gain: 0.6 });
const kicks = (g && g.kicks) || [];

// hits
const CR = I.crash(18);
for (const t of [ev.e1, ev.e2, ev.e3, ev.endCard]) { drums.addMono(CR, t, 0.35); fx.addMono(I.subBoom(1.2), t, 0.5); }

// names popping into column A
ev.namesIn.forEach((t, i) => fx.addMono(I.pop(1 + i * 0.08), t, 0.25, -0.2));
// typing: a crisp key tick per letter
for (const t of [...ev.typeB, ...ev.typeC, ...ev.typeD]) fx.addMono(I.woodTick(1.6), t, 0.35, 0.1);
// the wrong way: slow manual typing, then a buzzer on the stamp
for (const mm of ev.manual) for (const t of mm.times) fx.addMono(I.woodTick(1.3), t, 0.3, -0.1);
fx.addMono(I.bwomp(), ev.stamp, 0.6);
fx.addMono(I.thud(70, 0.1), ev.stamp, 0.5);
// Ctrl / E keycaps
for (const t of [ev.ctrl1, ev.ctrl2, ev.ctrl3]) fx.addMono(I.tvClick(), t, 0.5);
for (const t of [ev.e1, ev.e2, ev.e3]) { fx.addMono(I.tvClick(), t, 0.6); fx.addMono(I.thud(90, 0.08), t, 0.5); }
// flash fill: each cell is a rising marimba note
for (const fills of [ev.fillB, ev.fillC, ev.fillD]) fills.forEach((t, i) => {
  const x = I.marimba(sc.FILL_NOTES[i], { thock: 0 });
  keys.addMono(x, t, 0.5, -0.4 + i * 0.2); verb.addMono(x, t, 0.2); dly.addMono(x, t, 0.08);
});
// captions swap with a soft whoosh
for (const c of sc.captions.slice(1)) fx.addMono(I.noiseSweep(0.25, 3000, 800, { q: 1, pink: true }), c.t - 0.12, 0.12);
// end card chime
const chime = I.marimba(sc.m('F6'), { thock: 0 });
keys.addMono(chime, ev.endCard, 0.4); verb.addMono(chime, ev.endCard, 0.3);

// mix
MIX.sidechain([pad, bass], kicks);
const stems = { drums, bass, pad, keys, fx, verb: reverb(verb, { room: 0.8, damp: 0.3 }), dly: pingpong(dly, BEAT * 0.75, 0.35, 3500) };
const GAIN = { drums: 0.5, bass: 0.6, pad: 0.7, keys: 1.0, fx: 1.0, verb: 1, dly: 1 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.breath1, ev.e1); // a quarter-beat of silence before the big press
MIX.fadeOut(mix, DURATION - 1.4, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -13 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS` : ''})`);
