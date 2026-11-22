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
Genre.play('edm', { clock, from: 0, to: 1.5, chordAt, buses: { drums, bass, pad, keys }, drums: false, gain: 0.7 });
const g = Genre.play('edm', { clock, from: 1.5, to: 13.5, chordAt, buses: { drums, bass, pad, keys } });
Genre.play('edm', { clock, from: 13.5, to: 15.25, chordAt, buses: { drums, bass, pad, keys }, drums: false, gain: 0.6 });
const kicks = (g && g.kicks) || [];

// hits
const CR = I.crash(18);
for (const t of [ev.coverEnd, ev.chartIn, ev.full, ev.endCard]) { drums.addMono(CR, t, 0.28); fx.addMono(I.subBoom(1.0), t, 0.4); }
// tasks pop in, checkboxes appear
ev.tasksIn.forEach((t, i) => fx.addMono(I.pop(1 + i * 0.06), t, 0.2, -0.2));
ev.boxesIn.forEach((t, i) => fx.addMono(I.woodTick(1.8), t, 0.2, 0.2));
// typing
for (const t of [...ev.typeF1, ...ev.typeF2]) fx.addMono(I.woodTick(1.6), t, 0.26, 0.1);
for (const t of [ev.enterF1, ev.enterF2, ev.menu1, ev.menu3, ev.select]) fx.addMono(I.tvClick(), t, 0.5);
// every tick plays the next note up: the ring fills, the melody climbs
const tickList = [...ev.hookTicks, ...ev.buildTicks, ...ev.demoTicks];
tickList.forEach(([, t], i) => {
  const n = sc.FILL_NOTES[i % sc.FILL_NOTES.length];
  const x = I.marimba(n, { thock: 0 }); keys.addMono(x, t, 0.5, -0.3 + (i % 4) * 0.2); verb.addMono(x, t, 0.2); fx.addMono(I.tvClick(), t, 0.3);
});
// styling whooshes
for (const t of [ev.hole[0], ev.recolor, ev.label]) fx.addMono(I.noiseSweep(0.3, 3000, 900, { q: 1, pink: true }), t - 0.1, 0.15);
for (const c of sc.captions.slice(1)) fx.addMono(I.noiseSweep(0.25, 3000, 800, { q: 1, pink: true }), c.t - 0.12, 0.1);
const chime = I.marimba(sc.m('F6'), { thock: 0 });
keys.addMono(chime, ev.full + 0.05, 0.5); verb.addMono(chime, ev.full + 0.05, 0.35);

// mix
MIX.sidechain([pad, bass], kicks);
const stems = { drums, bass, pad, keys, fx, verb: reverb(verb, { room: 0.8, damp: 0.3 }), dly: pingpong(dly, BEAT * 0.75, 0.35, 3500) };
const GAIN = { drums: 0.5, bass: 0.6, pad: 0.7, keys: 1.0, fx: 1.0, verb: 1, dly: 1 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.chartIn - 0.15, ev.chartIn); // a quarter-beat of silence before the big press
MIX.fadeOut(mix, DURATION - 1.4, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -13 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS` : ''})`);
