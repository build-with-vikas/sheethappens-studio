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
for (const t of [ev.enterX, ev.enterN, ev.enterNF, ev.endCard]) { drums.addMono(CR, t, 0.3); fx.addMono(I.subBoom(1.2), t, 0.45); }
// rows pop in
ev.namesIn.forEach((t, i) => fx.addMono(I.pop(1 + i * 0.08), t, 0.22, -0.2));
// typing
for (const t of [...ev.typeV, ...ev.typeX, ...ev.typeName, ...ev.typeZ, ...ev.typeNF]) fx.addMono(I.woodTick(1.6), t, 0.28, 0.1);
// every Enter: a key click
for (const t of [ev.enterV, ev.enterX, ev.enterN, ev.enterZ, ev.enterNF]) { fx.addMono(I.tvClick(), t, 0.6); fx.addMono(I.thud(90, 0.08), t, 0.4); }
// errors: a low bwomp; the stamp: buzzer
fx.addMono(I.bwomp(), ev.enterV + 0.05, 0.35);
fx.addMono(I.bwomp(), ev.stamp, 0.6); fx.addMono(I.thud(70, 0.1), ev.stamp, 0.5);
fx.addMono(I.bwomp(), ev.enterZ + 0.05, 0.3);
// success: a rising marimba arpeggio after each good result
for (const t0 of [ev.enterX, ev.enterN, ev.enterNF]) sc.FILL_NOTES.slice(0, 4).forEach((n, i) => {
  const x = I.marimba(n, { thock: 0 }); const t = t0 + 0.06 + i * BEAT / 4;
  keys.addMono(x, t, 0.45, -0.3 + i * 0.2); verb.addMono(x, t, 0.2); dly.addMono(x, t, 0.06);
});
for (const c of sc.captions.slice(1)) fx.addMono(I.noiseSweep(0.25, 3000, 800, { q: 1, pink: true }), c.t - 0.12, 0.12);
const chime = I.marimba(sc.m('F6'), { thock: 0 });
keys.addMono(chime, ev.endCard, 0.4); verb.addMono(chime, ev.endCard, 0.3);

// mix
MIX.sidechain([pad, bass], kicks);
const stems = { drums, bass, pad, keys, fx, verb: reverb(verb, { room: 0.8, damp: 0.3 }), dly: pingpong(dly, BEAT * 0.75, 0.35, 3500) };
const GAIN = { drums: 0.5, bass: 0.6, pad: 0.7, keys: 1.0, fx: 1.0, verb: 1, dly: 1 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.enterX - 0.15, ev.enterX); // a quarter-beat of silence before the big press
MIX.fadeOut(mix, DURATION - 1.4, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -13 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS` : ''})`);
