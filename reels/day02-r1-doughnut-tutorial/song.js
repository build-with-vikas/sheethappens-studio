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

// backing: a calm lo-fi bed under the teaching voice
const g = Genre.play('lofi', { clock, from: 0, to: Math.ceil(DURATION / (BEAT * 4)), chordAt, buses: { drums, bass, pad, keys }, gain: 0.55 });
const kicks = (g && g.kicks) || [];

// hits
const CR = I.crash(18);
for (const t of [ev.chartIn, ev.full]) { drums.addMono(CR, t, 0.22); fx.addMono(I.subBoom(1.0), t, 0.35); }
ev.tasksIn.forEach((t, i) => fx.addMono(I.pop(1 + i * 0.06), t, 0.18, -0.2));
ev.boxesIn.forEach((t) => fx.addMono(I.woodTick(1.8), t, 0.18, 0.2));
for (const t of [...ev.typeF1, ...ev.typeF2, ...ev.typeF3]) fx.addMono(I.woodTick(1.6), t, 0.22, 0.1);
// every mouse click is a soft click
for (const t of [ev.insertTab1, ev.checkboxBtn, ev.clickE2, ev.pctBtn, ev.clickE3, ev.insertTab2, ev.pieMenu, ev.chartIn, ev.rightClick, ev.formatSeries, ev.fillDone, ev.fillLeft, ev.insertTab3, ev.textBoxBtn, ev.enterF1, ev.enterF2, ev.enterF3]) fx.addMono(I.tvClick(), t, 0.35);
const tickList = [...ev.hookTicks, ...ev.s2cTicks, ...ev.testTicks];
tickList.forEach(([, t], i) => { const n = sc.FILL_NOTES[i % sc.FILL_NOTES.length]; const x = I.marimba(n, { thock: 0 }); keys.addMono(x, t, 0.4, -0.3 + (i % 4) * 0.2); verb.addMono(x, t, 0.18); fx.addMono(I.tvClick(), t, 0.25); });
const chime = I.marimba(sc.m('F6'), { thock: 0 });
keys.addMono(chime, ev.full + 0.05, 0.45); verb.addMono(chime, ev.full + 0.05, 0.3);

// mix
MIX.sidechain([pad, bass], kicks);
const stems = { drums, bass, pad, keys, fx, verb: reverb(verb, { room: 0.8, damp: 0.3 }), dly: pingpong(dly, BEAT * 0.75, 0.35, 3500) };
const GAIN = { drums: 0.5, bass: 0.6, pad: 0.7, keys: 1.0, fx: 1.0, verb: 1, dly: 1 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.fadeOut(mix, DURATION - 1.4, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -13 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS` : ''})`);
