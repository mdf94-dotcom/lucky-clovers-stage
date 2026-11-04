"use strict";
// The Lucky Clovers' Stage: the band engine, the cast, and the stage window (from the Rhine Foundry module).
// ====================================================================== 🎸 Studio Band (shared, everyone aboard hears it)
// Fifteen instruments, a dozen genres. Every part is written from the genre's chord loop, so any mix fits together.
// State is shared field by field (newest edit wins per field), so several people can work on the same song at once.
// While anyone has the studio open, everyone online hears the band (each player can mute it for themselves).
const NN = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const pcOf = (m) => ((m % 12) + 12) % 12;
const QUAL = { maj: [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], "5": [0, 7] };
const QN = { maj: "", m: "m", "7": "7", m7: "m7", maj7: "maj7", "5": "5" };
const third = (ch) => QUAL[ch[1]].includes(3) ? 3 : QUAL[ch[1]].includes(4) ? 4 : 7;
const sev = (ch) => QUAL[ch[1]].includes(10) ? 10 : QUAL[ch[1]].includes(11) ? 11 : 12;
const regRoot = (r, lo) => lo + pcOf(r - lo);                       // the root placed in [lo, lo+11]
const chordName = (ch) => NN[pcOf(ch[0])] + QN[ch[1]];
function voice(ch, center) {                                         // chord tones packed close around a center note
  const out = new Set(); for (const iv of QUAL[ch[1]]) { let m = ch[0] + iv; while (m < center - 6) m += 12; while (m > center + 5) m -= 12; out.add(m); }
  if (ch[1] === "5") out.add(Math.min(...out) + 12);
  return [...out].sort((a, b) => a - b);
}
const gvoice = (ch) => { const r = regRoot(ch[0], 40), q = ch[1], t = third(ch);
  if (q === "5") return [r, r + 7, r + 12];
  if (q === "7" || q === "m7" || q === "maj7") return [r, r + 7, r + sev(ch), r + 12 + t, r + 19];
  return [r, r + 7, r + 12, r + 12 + t, r + 19]; };

// ---------------------------------------------------------------- pattern strings: x hit, X accent, g ghost, s short, u upstroke, - hold, . rest
const VEL = { x: 1, X: 1.25, g: 0.38, s: 0.85, u: 0.6, p: 0.8, r: 1, f: 1, o: 1, 3: 1, 7: 1, 6: 1, a: 0.9 };
const PCH = (str, s) => str ? str[s % str.length] : ".";
const holdSteps = (str, s, max = 12) => { let n = 1; while (n < max && PCH(str, s + n) === "-") n++; return n; };
const gapSteps = (str, s, max = 8) => { let n = 1; while (n < max && ".-".includes(PCH(str, s + n))) n++; return n; };
const DK = ["k", "s", "h", "o", "c", "t", "T", "r"], DLAB = ["Kick", "Snare", "Hi-hat", "Open hat", "Clap", "Low tom", "High tom", "Ride"];
const PK = ["lo", "hi", "bo", "sh", "tb", "cb", "cl", "tri"], PLAB = ["Conga low", "Conga high", "Bongo", "Shaker", "Tambourine", "Cowbell", "Clave", "Triangle"];
const FXLAB = ["808 hit", "Wobble", "Wicka", "Baby scratch", "Chirp", "Riser", "Air horn", "Rewind"];
const ROWLAB = ["Root", "3rd", "5th", "Octave", "3rd ↑", "5th ↑", "Oct ↑", "3rd ↑↑"];
const PERC_DEF = [
  { sh: "xgxgxgxgxgxgxgxg", tb: "....x.......x..." },
  { lo: "x.....x...x.....", hi: "...x.x..x...x.xx", bo: "..g...g...g...g.", sh: "gggggggggggggggg" },
  { cb: "x...x...x...x...", cl: "x..x..x...x.x...", tri: "x.......x......." }
];

// ---------------------------------------------------------------- genres
const GEN = {
  pop: { name: "Studio Pop", blurb: "The Lucky Clovers' house sound.", bpm: 96, tonic: 9, scale: [0, 3, 5, 7, 10], kit: "acoustic",
    prog: [[45, "m"], [41, "maj"], [48, "maj"], [43, "maj"]],
    drums: [{ k: "x......x..x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, { k: "x.....x...x..x..", s: "....x..g.g..x...", h: "xgxgxgxgxgxgxgxg", o: "..............x." }, { k: "x.........x.....", s: "........x.......", h: "x...x...x...x..." }],
    comp: "x.....x...x.....", strum: "x...x.u...u.x.u.", bass: "r----.r-r---..f-", riff: "chop", gtr: "clean", bassTone: "finger", dens: [0.4, 0.45, 0.7], fx: { rev: 1, delay: 0.15 },
    start: { drums: 0, bass: 1, piano: 0, guitar: 0, sax: 0 } },
  funk: { name: "Funk", blurb: "Tight sixteenths, slap bass, horn stabs.", bpm: 104, sw16: 0.08, tonic: 4, scale: [0, 2, 3, 5, 7, 9, 10], kit: "tight",
    prog: [[40, "m7"], [40, "m7"], [45, "7"], [47, "m7"]],
    drums: [{ k: "x.........x..x..", s: "....x..g.g..x..g", h: "xxxxxxxxxxxxxx.x", o: "..............x." }, { k: "x..x...x.xx...x.", s: "....x..g.g.gx..g", h: "x.xxx.xxx.xxx.x.", o: "......x.......x." }, { k: "x.........x.....", s: "....x.......x...", h: "..x...x...x...x." }],
    comp: "s..s..s.s.s..s..", strum: "x..u..x.u.x..u..", stab: "....x..x.....x..", bass: "r.ro..r.r.o.r.7a", riff: "chop", gtr: "clean", bassTone: "slap", stacc: true, dens: [0.45, 0.5, 0.75], fx: { rev: 0.6, delay: 0.1 },
    start: { drums: 0, bass: 1, guitar: 2, keys: 2, brass: 0, perc: 1 } },
  rock: { name: "Rock", blurb: "Power chords, open hats and a big room.", bpm: 128, tonic: 4, scale: [0, 3, 5, 7, 10], kit: "rock",
    prog: [[40, "5"], [48, "5"], [43, "5"], [50, "5"]],
    drums: [{ k: "x.......x.x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, { k: "x.x...x.x.x...x.", s: "....x.......x...", r: "x.x.x.x.x.x.x.x." }, { k: "x...x...x...x...", s: "....x.......x...", h: "x...x...x...x..." }],
    comp: "x.......x.x.....", strum: "x.x.x.x.x.x.x.x.", bass: "r.r.r.r.r.r.r.r.", riff: "power", gtr: "drive", bassTone: "pick", dens: [0.4, 0.45, 0.72], fx: { rev: 1.2, delay: 0.1 },
    start: { drums: 0, bass: 1, guitar: 2, organ: 0, keytar: 2 } },
  jazz: { name: "Swing Jazz", blurb: "Ride cymbal, walking bass, a ii–V–I.", bpm: 138, swing: 0.33, tonic: 0, scale: [0, 2, 4, 5, 7, 9, 11], kit: "brush", crash: false,
    prog: [[50, "m7"], [43, "7"], [48, "maj7"], [45, "7"]],
    drums: [{ r: "x...x.x.x...x.x.", h: "....x.......x...", k: "x...............", s: "..g....g..g....g" }, { r: "x...x.x.x...x.x.", h: "....x.......x...", s: "..g.x..g..g.x..g", k: "x.....g...g....." }, { s: "g.g.g.g.g.g.g.g.", r: "x.......x......." }],
    comp: "x.....x.........", strum: "x...x...x...x...", stab: "......x.......x.", bass: "r-------f-------", riff: "comp", gtr: "clean", bassTone: "upright", dens: [0.45, 0.5, 0.7], fx: { rev: 1, delay: 0 },
    start: { drums: 0, bass: 2, piano: 1, sax: 0, brass: 1 } },
  blues: { name: "Blues Shuffle", blurb: "Twelve bars, swung eighths, a harmonica.", bpm: 92, swing: 0.33, tonic: 9, scale: [0, 3, 5, 6, 7, 10], kit: "acoustic",
    prog: [[45, "7"], [45, "7"], [45, "7"], [45, "7"], [50, "7"], [50, "7"], [45, "7"], [45, "7"], [52, "7"], [50, "7"], [45, "7"], [52, "7"]],
    drums: [{ k: "x.......x.......", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, { k: "x.....x.x.....x.", s: "....x..g....x..g", r: "x.x.x.x.x.x.x.x." }, { k: "x.......x.......", s: "....x.......x...", h: "....x.......x..." }],
    comp: "..x...x...x...x.", strum: "x.x.x.x.x.x.x.x.", bass: "r.3.f.6.o.6.f.3.", riff: "boogie", gtr: "clean", bassTone: "finger", dens: [0.4, 0.5, 0.7], fx: { rev: 1, delay: 0 },
    start: { drums: 0, bass: 1, guitar: 2, harmonica: 1, piano: 1, organ: 0 } },
  lofi: { name: "Lo-fi Beats", blurb: "Dusty drums, sleepy chords, vinyl crackle.", bpm: 78, sw16: 0.16, tonic: 0, scale: [0, 2, 4, 5, 7, 9, 11], kit: "dusty", crash: false,
    prog: [[41, "maj7"], [40, "m7"], [38, "m7"], [48, "maj7"]],
    drums: [{ k: "x......x..x.....", s: "....x.......x...", h: "x.x.x.xgx.x.x.xg" }, { k: "x..x...x..x..x..", s: "....x.......x.g.", h: "xgx.xgx.xgx.xgxx" }, { k: "x.........x.....", s: "........x.......", h: "x...x...x...x..." }],
    comp: "x.........x.....", strum: "x.......x.......", bass: "r-----..r--...f-", riff: "pick", gtr: "clean", bassTone: "finger", dens: [0.3, 0.4, 0.6], fx: { rev: 1.1, delay: 0.25, lofi: true },
    start: { drums: 0, bass: 1, piano: 0, keys: 0, guitar: 1 } },
  synthwave: { name: "Synthwave", blurb: "Neon arpeggios, gated drums, keytar heroics.", bpm: 108, tonic: 9, scale: [0, 2, 3, 5, 7, 8, 10], kit: "electro",
    prog: [[45, "m"], [41, "maj"], [48, "maj"], [43, "maj"]],
    drums: [{ k: "x...x...x...x...", s: "....x.......x...", c: "....x.......x...", h: "..x...x...x...x." }, { k: "x...x...x...x...", s: "....x.......x...", c: "....x.......x...", h: "xxxxxxxxxxxxxxxx" }, { k: "x.......x.......", s: "............x...", h: "x.x.x.x.x.x.x.x." }],
    comp: "x.x.x.x.x.x.x.x.", strum: "x.......x.......", bass: "rorororororororo", arp16: true, riff: "arp16", gtr: "drive", bassTone: "synth", dens: [0.4, 0.45, 0.75], fx: { rev: 1.2, delay: 0.45 },
    start: { drums: 0, bass: 1, keys: 1, keytar: 0, strings: 0 } },
  reggae: { name: "Reggae", blurb: "One-drop beat, offbeat skank, organ bubble, dub echo.", bpm: 76, sw16: 0.1, tonic: 7, scale: [0, 2, 4, 7, 9], kit: "rim",
    prog: [[43, "maj"], [48, "maj"], [50, "maj"], [48, "maj"]],
    drums: [{ k: "........x.......", s: "........x.......", h: "x.x.x.x.x.x.x.x." }, { k: "x...x...x...x...", s: "........x.......", h: "..x...x...x...x." }, { k: "x.......x.......", s: "....x.......x...", h: "x.xxx.xxx.xxx.xx" }],
    comp: "....s.......s...", organ: "..s.s.ss..s.s.ss", strum: "....s.......s...", bass: ".r-r..f-r-...o..", riff: "skank", gtr: "clean", bassTone: "dub", dens: [0.35, 0.4, 0.6], fx: { rev: 0.9, delay: 0.45 },
    start: { drums: 0, bass: 1, guitar: 2, organ: 1, brass: 0 } },
  bossa: { name: "Bossa Nova", blurb: "Nylon strings, rim clicks, a soft sway.", bpm: 126, tonic: 7, scale: [0, 2, 4, 5, 7, 9, 11], kit: "rim", crash: false,
    prog: [[45, "m7"], [50, "7"], [43, "maj7"], [40, "7"]],
    drums: [{ k: "x..xx..xx..xx..x", s: "x..x..x...x..x..", h: "x.x.x.x.x.x.x.x." }, { k: "x..xx..xx..xx..x", s: "x..x..x...x..x..", h: "xgxgxgxgxgxgxgxg", r: "x...x...x...x..." }, { s: "x..x..x...x..x..", h: "..x...x...x...x." }],
    perc: [{ sh: "xgxgxgxgxgxgxgxg", cl: "x..x..x...x..x.." }, null, null],
    comp: "x..x..x...x..x..", strum: "x..x..x...x..x..", bass: "r-----f-f-----r-", riff: "bossa", gtr: "nylon", bassTone: "upright", dens: [0.4, 0.45, 0.65], fx: { rev: 0.9, delay: 0.1 },
    start: { drums: 0, bass: 1, guitar: 2, strings: 0, sax: 0, perc: 0 } },
  house: { name: "House", blurb: "Four on the floor, piano stabs, offbeat bass.", bpm: 124, tonic: 9, scale: [0, 2, 3, 5, 7, 8, 10], kit: "909",
    prog: [[45, "m7"], [41, "maj7"], [48, "maj"], [43, "maj"]],
    drums: [{ k: "x...x...x...x...", c: "....x.......x...", o: "..x...x...x...x.", h: "x...x...x...x..." }, { k: "x...x...x...x...", c: "....x.......x...", s: "...........g...g", h: "xx.xxx.xxx.xxx.x", o: "..x...x...x...x." }, { c: "............x...", o: "..x...x...x...x." }],
    perc: [{ sh: "..x...x...x...x.", tb: "....x.......x..." }, null, null],
    comp: "..x..x...x..x...", strum: "..s...s...s...s.", bass: "..r...r...r...r.", riff: "arp16", gtr: "clean", bassTone: "synth", dens: [0.35, 0.45, 0.7], fx: { rev: 1, delay: 0.3 },
    start: { drums: 0, bass: 1, piano: 1, perc: 0, choir: 1 } },
  frontier: { name: "Frontier", blurb: "A sheriff's saloon on the red sand: train beat, boom-chick, harmonica.", bpm: 112, tonic: 9, scale: [0, 2, 3, 5, 7, 8, 11], kit: "brush",
    prog: [[45, "m"], [43, "maj"], [41, "maj"], [40, "maj"]],
    drums: [{ k: "x.......x.......", s: "ggggxgggggggxggg" }, { k: "x...x...x...x...", s: "ggggxgggggggxggg", r: "x.x.x.x.x.x.x.x." }, { k: "x.......x.......", t: "x..x..x...x..x.." }],
    perc: [{ cl: "x.x...x.x...x.x.", sh: "..x...x...x...x." }, null, { cb: "x.......x.......", tri: "x...............", cl: "x.x...x.x...x.x." }],
    comp: "x.s.x.s.x.s.x.s.", strum: "x.u.x.u.x.u.x.u.", bass: "r...f...r...f...", riff: "chick", gtr: "clean", bassTone: "upright", dens: [0.4, 0.45, 0.7], fx: { rev: 1, delay: 0.15 },
    start: { drums: 0, bass: 1, guitar: 2, harmonica: 1, lute: 0, perc: 0 } },
  epic: { name: "Epic Orchestral", blurb: "Taiko, strings, brass and choir for the big moments.", bpm: 88, tonic: 2, scale: [0, 2, 3, 5, 7, 8, 10], kit: "taiko",
    prog: [[38, "m"], [46, "maj"], [41, "maj"], [48, "maj"]],
    drums: [{ k: "x.......x.......", t: "x.....x.x.......", T: "....x.......x..." }, { k: "x..x..x.x..x..x.", t: "x.x.x.x.x.x.xxxx", T: "....x.......x...", s: "....x.......x..." }, { k: "x...............", t: "x.......x......." }],
    comp: "x...............", strum: "x.......x.......", stab: "x.....x.x.......", bass: "r-------r---o---", riff: "trem", gtr: "clean", bassTone: "upright", dens: [0.35, 0.4, 0.65], fx: { rev: 1.6, delay: 0 },
    start: { drums: 0, strings: 1, brass: 1, choir: 0, bass: 0, piano: 2 } }
};
const GEN_ORDER = ["pop", "funk", "rock", "jazz", "blues", "lofi", "synthwave", "reggae", "bossa", "house", "frontier", "epic"];
const KITS = {
  acoustic: { kf: 150, ke: 45, kd: 0.38, sn: "std", hf: 7500 }, tight: { kf: 170, ke: 50, kd: 0.25, sn: "tight", hf: 8500 },
  rock: { kf: 140, ke: 40, kd: 0.45, sn: "big", hf: 7000 }, brush: { kf: 110, ke: 50, kd: 0.3, sn: "brush", hf: 6500 },
  dusty: { kf: 120, ke: 38, kd: 0.5, sn: "dusty", hf: 6000 }, electro: { kf: 160, ke: 38, kd: 0.45, sn: "gated", hf: 9000 },
  rim: { kf: 130, ke: 45, kd: 0.35, sn: "rim", hf: 7500 }, "909": { kf: 180, ke: 45, kd: 0.4, sn: "tight", hf: 9500 },
  taiko: { kf: 90, ke: 35, kd: 0.8, sn: "big", hf: 6000, taiko: true }
};

// ---------------------------------------------------------------- instruments
// lo = bottom of the register its pads and custom pattern use
const INST_B = [
  { k: "drums", name: "Drums", icon: "🥁", role: "drums", v: ["Main", "Busy", "Breakdown"], mix: 0.9, rev: 0.08 },
  { k: "perc", name: "Percussion", icon: "🔔", role: "perc", v: ["Shaker", "Hand drums", "Bells & wood"], mix: 0.5, rev: 0.15, pan: 0.25 },
  { k: "bass", name: "Bass", icon: "🔊", v: ["Roots", "Groove", "Walking"], mix: 0.75, rev: 0.03, lo: 40 },
  { k: "piano", name: "Piano", icon: "🎹", v: ["Chords", "Rhythm", "Melody"], mix: 0.5, rev: 0.28, lo: 55, pan: -0.1 },
  { k: "keys", name: "Synth Keys", icon: "🎛️", v: ["Pad", "Arpeggio", "Stabs"], mix: 0.34, rev: 0.4, lo: 57, pan: 0.15, dly: 0.6 },
  { k: "organ", name: "Organ", icon: "🎼", v: ["Hold", "Rhythm", "Swells"], mix: 0.42, rev: 0.25, lo: 53, pan: -0.2 },
  { k: "guitar", name: "Guitar", icon: "🎸", v: ["Strum", "Fingerpick", "Genre riff"], mix: 0.5, rev: 0.2, lo: 52, pan: 0.3, dly: 0.3 },
  { k: "lute", name: "Lute", icon: "🪕", v: ["Arpeggio", "Tremolo tune", "Strum"], mix: 0.45, rev: 0.3, lo: 60, pan: -0.35 },
  { k: "strings", name: "Strings", icon: "🎻", v: ["Long notes", "Pizzicato", "Counter-melody"], mix: 0.42, rev: 0.45, lo: 55, pan: -0.15 },
  { k: "brass", name: "Brass", icon: "🎺", v: ["Stabs", "Swells", "Fanfare"], mix: 0.4, rev: 0.3, lo: 57, pan: 0.2 },
  { k: "sax", name: "Saxophone", icon: "🎷", v: ["Melody", "Answer", "Solo"], mix: 0.36, rev: 0.32, lo: 57, pan: 0.1, dly: 0.3 },
  { k: "keytar", name: "Keytar", icon: "🎹", tilt: true, v: ["Lead", "Arpeggio", "Shred"], mix: 0.3, rev: 0.3, lo: 64, pan: -0.05, dly: 1 },
  { k: "harmonica", name: "Harmonica", icon: "🌵", v: ["Chords", "Melody", "Bluesy"], mix: 0.32, rev: 0.25, lo: 60, pan: 0.25 },
  { k: "choir", name: "Choir", icon: "🎤", v: ["Ooh", "Aah", "Chant"], mix: 0.4, rev: 0.6, lo: 53 },
  { k: "dj", name: "DJ Set", icon: "🎧", role: "dj", v: ["808 sub", "Wobble", "Scratch"], mix: 0.6, rev: 0.05, lo: 28 }
];
const INST_K = Object.fromEntries(INST_B.map(I => [I.k, I]));
const DEF_ON = ["drums", "bass", "piano"];

// ---------------------------------------------------------------- melodies (same on every client: seeded from the genre's name)
const MELC = {};
function hashS(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngS(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function MELS(G, key) {
  if (MELC[key]) return MELC[key];
  const [dA, dB, dC] = G.dens;
  const n = G.prog.length;
  // reroll (deterministically) until each line has enough notes to carry a tune
  const pick = (tag, o, min) => { let best = null; for (let k = 0; k < 8; k++) { const m = genMel(G, hashS(key + tag + k), { ...o, dens: o.dens * (1 + k * 0.12) }); if (!best || m.size > best.size) best = m; if (m.size >= min) return m; } return best; };
  return (MELC[key] = {
    A: pick("A", { dens: dA, grid: 2, lo: 62, hi: 79 }, n * 3),
    B: pick("B", { dens: dB, grid: 2, lo: 65, hi: 84, answer: true }, n * 1.5),
    C: pick("C", { dens: dC, grid: 1, lo: 62, hi: 86, solo: true }, n * 6),
    D: pick("D", { dens: 0.2, grid: 4, lo: 57, hi: 74, long: true }, n * 1.5)
  });
}
function genMel(G, seed, o) {
  const R = rngS(seed), bars = G.prog.length, L = bars * 16;
  const sc = []; for (let m = o.lo; m <= o.hi; m++) if (G.scale.includes(pcOf(m - G.tonic))) sc.push(m);
  const near = (m) => { let b = 0; sc.forEach((x, j) => { if (Math.abs(x - m) < Math.abs(sc[b] - m)) b = j; }); return b; };
  const strength = (s) => s % 16 === 0 ? 1 : s % 8 === 0 ? 0.85 : s % 4 === 0 ? 0.65 : s % 2 === 0 ? 0.45 : 0.25;
  // a two-bar motif (rhythm + contour), repeated with small changes so the tune has a hook
  const motif = [];
  for (let s = 0; s < 32; s++) {
    if (s % o.grid) continue;
    if (!o.solo && s >= 28) continue;                     // breathe at the end of each phrase
    if (o.answer && s < 16) continue;                     // answers sit in the second bar
    const p = (s === 0 || (o.answer && s === 16)) ? 0.85 : Math.min(0.95, o.dens * strength(s) * (o.answer ? 2.2 : 1.7));
    if (R() < p) motif.push({ s, d: [-2, -1, -1, 1, 1, 2, 0, 3, -3][Math.floor(R() * 9)] });
  }
  if (!motif.length) motif.push({ s: o.answer ? 16 : 0, d: 0 });
  let idx = Math.floor(sc.length / 2);
  const notes = [];
  for (let p = 0; p * 32 < L; p++) {
    const vary = p > 0 && R() < 0.5;
    for (const m of motif) {
      if (vary && R() < 0.2) continue;
      const gs = p * 32 + m.s; if (gs >= L) break;
      idx += m.d + (vary && R() < 0.3 ? (R() < 0.5 ? -1 : 1) : 0);
      if (idx < 1) idx = 2; if (idx > sc.length - 2) idx = sc.length - 3;
      let mid = sc[idx];
      const ch = G.prog[Math.floor(gs / 16) % bars], pcs = QUAL[ch[1]].map(x => pcOf(ch[0] + x));
      if (gs % 4 === 0 || o.long) {                         // strong beats land on chord tones
        for (let d = 0; d <= 4; d++) {
          if (pcs.includes(pcOf(mid + d)) && mid + d <= o.hi) { mid += d; break; }
          if (pcs.includes(pcOf(mid - d)) && mid - d >= o.lo) { mid -= d; break; }
        }
        idx = near(mid);
      }
      notes.push([gs, mid]);
    }
  }
  const out = new Map();
  notes.forEach(([gs, m], j) => {
    const nx = j + 1 < notes.length ? notes[j + 1][0] : L; let gap = nx - gs;
    let len = Math.min(gap, o.long ? 12 : o.solo ? 3 : 6);
    if (G.stacc && !o.long) len = Math.min(len, 2);
    if (gap >= 4 && !o.solo) len = Math.min(gap, 8);       // phrase endings ring out
    out.set(gs, [m, Math.max(1, len), gs % 4 === 0 ? 1 : 0.82]);
  });
  return out;
}

// ---------------------------------------------------------------- the synth engine
const now_ = () => (game.time?.serverTime ?? Date.now()) / 1000;   // shared clock, so every client is on the same beat
function driveCurve(k) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }

const Band = {
  ctx: null, ch: {}, running: false, timer: null, next: 0, hits: {}, hitBy: {}, liveAt: {}, ks: {}, noise: null, vol: 0.6, sig: "", step: -1, L: 64, userStopped: false,
  init() {
    const c = this.ctx = actx();
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.mg = c.createGain(); this.mg.gain.value = this.vol;
    this.lofi = c.createBiquadFilter(); this.lofi.type = "lowpass"; this.lofi.frequency.value = 20000;
    this.sum = c.createGain(); this.sum.connect(this.lofi).connect(comp).connect(this.mg).connect(c.destination);
    const len = c.sampleRate * 2.4, ir = c.createBuffer(2, len, c.sampleRate);
    for (let k = 0; k < 2; k++) { const d = ir.getChannelData(k); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const ro = c.createGain(); ro.gain.value = 0.45; this.rev.connect(ro).connect(this.sum);
    // ping-pong echo, timed to a dotted eighth
    const dl = this.dl = c.createDelay(2), dr = this.dr = c.createDelay(2), fb = c.createGain(), fl = c.createBiquadFilter(), pl = c.createStereoPanner(), pr = c.createStereoPanner();
    this.dIn = c.createGain(); fb.gain.value = 0.38; fl.type = "lowpass"; fl.frequency.value = 2800; pl.pan.value = -0.7; pr.pan.value = 0.7;
    this.dIn.connect(dl); dl.connect(pl).connect(this.sum); dl.connect(dr); dr.connect(pr).connect(this.sum); dr.connect(fl).connect(fb).connect(dl);
    for (const I of INST_B) {
      const inp = c.createGain(); inp.gain.value = 0; const sh = c.createWaveShaper(); const tone = c.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 18000;
      const pan = c.createStereoPanner(); pan.pan.value = I.pan ?? 0; inp.connect(sh).connect(tone).connect(pan).connect(this.sum);
      const rs = c.createGain(); rs.gain.value = I.rev; pan.connect(rs).connect(this.rev);
      const ds = c.createGain(); ds.gain.value = 0; pan.connect(ds).connect(this.dIn);
      this.ch[I.k] = { inp, sh, tone, pan, rs, ds };
    }
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.noise = nb;
    // a browser won't start sound before the first click; resume on the next one
    const wake = () => { c.resume?.(); if (c.state === "running") document.removeEventListener("pointerdown", wake, true); };
    document.addEventListener("pointerdown", wake, true);
  },
  start() {
    if (!this.ctx) this.init();
    this.ctx.resume?.();
    if (this.running) return; this.running = true; this.sig = "";
    this.timer = setInterval(() => { try { this.tick(); } catch (e) { console.error("Rhine Band |", e); } }, 25);
  },
  stop() { clearInterval(this.timer); this.running = false; this.step = -1; if (this.ctx) for (const k in this.ch) this.ch[k].inp.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); },
  setVol(v) { this.vol = v; if (this.mg) this.mg.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); },
  tick() {
    const V = bandView(), G = GEN[V.song.gk ?? V.song.genre], STEP = 60 / V.song.bpm / 4, L = this.L = G.prog.length * 16, c = this.ctx;
    const off = now_() - c.currentTime; if (this.off === undefined || Math.abs(off - this.off) > 0.04) this.off = off;
    const songNow = c.currentTime + this.off - V.song.t0;
    const sig = `${V.song.gk ?? V.song.genre}|${V.song.bpm}|${V.song.t0}`;
    if (sig !== this.sig) { this.sig = sig; this.next = Math.floor(songNow / STEP) + 1; this.mixFor(V, G, c.currentTime, STEP); }
    if (this.next * STEP < songNow - 0.25) this.next = Math.floor(songNow / STEP) + 1;
    while (this.next * STEP < songNow + 0.12) {
      const st = this.next, s = ((st % L) + L) % L, i = s % 16;
      const sw = (i % 4 === 2 ? (G.swing ?? 0) * 2 * STEP : 0) + (i % 2 === 1 ? (G.sw16 ?? 0) * STEP : 0);
      const t = st * STEP + sw + V.song.t0 - this.off;
      this.st = st;
      if (t >= c.currentTime - 0.005) this.play(V, G, s, Math.max(t, c.currentTime), STEP);
      this.next++;
    }
  },
  mixFor(V, G, t, STEP) {
    const c = this.ctx;
    this.lofi.frequency.setTargetAtTime(G.fx.lofi ? 3400 : 20000, t, 0.1);
    this.dl.delayTime.setTargetAtTime(STEP * 3, t, 0.05); this.dr.delayTime.setTargetAtTime(STEP * 3, t, 0.05);
    for (const I of INST_B) {
      const S = V.inst[I.k], C = this.ch[I.k], live = performance.now() - (this.liveAt[I.k] ?? 0) < 1800;
      const drive = I.k === "guitar" && G.gtr === "drive";
      if (C.drive !== drive) { C.drive = drive; C.sh.curve = drive ? (this._dc ??= driveCurve(18)) : null; }
      const g = (S.on ? S.vol : live ? Math.max(0.6, S.vol) : 0) * I.mix * (drive ? 0.55 : 1);
      C.inp.gain.setTargetAtTime(g, t, 0.03);
      C.pan.pan.setTargetAtTime(S.pan, t, 0.05);
      C.tone.frequency.setTargetAtTime(400 * Math.pow(45, S.tone), t, 0.05);
      C.rs.gain.setTargetAtTime(I.rev * G.fx.rev * S.fx * 2, t, 0.05);
      C.ds.gain.setTargetAtTime((I.dly ?? 0.15) * G.fx.delay * S.fx * 2, t, 0.05);
    }
  },
  play(V, G, s, t, STEP) {
    this.step = s; this.mixFor(V, G, t, STEP);
    const tr = V.song.key, bars = G.prog.length, bar = s >> 4;
    const T = (ch) => [ch[0] + tr, ch[1]];
    if (G.fx.lofi) { const r = (s * 7919) % 13; if (r < 4) this.nz(t + r * 0.01, 0.006, this.sum, { type: "lowpass", f: 3500, peak: 0.05 + r * 0.01 }); }
    for (const I of INST_B) {
      const S = V.inst[I.k]; if (!S.on) continue;
      const cx = { B: this, G, V, s, i: s % 16, bar, ch: T(G.prog[bar % bars]), nch: T(G.prog[(bar + 1) % bars]), t, STEP, v: S.v, k: I.k, tr, out: this.ch[I.k].inp, I };
      let hit = false;
      try { hit = S.v === 3 ? customPart(cx, V.cells[I.k]) : PARTS_B[I.k](cx); } catch (e) { console.error(`Rhine Band | ${I.k}`, e); }
      if (hit) { const d = (t - this.ctx.currentTime) * 1000; setTimeout(() => { this.hits[I.k] = performance.now(); this.hitBy[I.k] = null; }, Math.max(0, d)); }
    }
  },

  // ---- building blocks
  env(g, t, a, peak, dec, sus = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t + a + dec); },
  osc(type, f, t, dur, out, { a = 0.005, peak = 0.5, dec = dur, det = 0, lp = 0, q = 0.7, slide = 0 } = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + a + dec);
    let n = o; if (lp) { const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = lp; fl.Q.value = q; o.connect(fl); n = fl; }
    n.connect(g).connect(out); this.env(g, t, a, peak, dec); o.start(t); o.stop(t + a + dec + 0.05); return o;
  },
  nz(t, dur, out, { type = "highpass", f = 6000, q = 0.7, peak = 0.4, rate = 1, a = 0.002 } = {}) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = rate;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain();
    s.connect(fl).connect(g).connect(out); this.env(g, t, a, peak, dur); s.start(t, (t * 7.31) % 0.5); s.stop(t + a + dur + 0.05); return { s, fl, g };
  },
  vib(t, f, rate, depth, delay, end) { const c = this.ctx, l = c.createOscillator(), g = c.createGain(); l.frequency.value = rate; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(f * depth, t + delay); l.connect(g); l.start(t); l.stop(end); return g; },

  // ---- drums & percussion
  drum(r, t, v, K, out) {
    switch (r) {
      case 0: { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(K.kf, t); o.frequency.exponentialRampToValueAtTime(K.ke, t + 0.13); o.connect(g).connect(out); this.env(g, t, 0.002, v, K.kd); o.start(t); o.stop(t + K.kd + 0.1);
        if (K.sn === "gated" || K.sn === "tight") this.nz(t, 0.012, out, { f: 3000, peak: 0.2 * v }); if (K.taiko) this.nz(t, 0.25, out, { type: "lowpass", f: 400, peak: 0.5 * v }); break; }
      case 1: {
        const sn = K.sn;
        if (sn === "rim") { this.osc("square", 1700, t, 0.03, out, { peak: 0.25 * v }); this.nz(t, 0.03, out, { type: "bandpass", f: 2500, q: 2, peak: 0.4 * v }); }
        else if (sn === "brush") this.nz(t, 0.22, out, { type: "bandpass", f: 3200, q: 0.5, peak: 0.28 * v, a: 0.015 });
        else if (sn === "tight") { this.nz(t, 0.12, out, { type: "bandpass", f: 2400, q: 0.7, peak: 0.55 * v }); this.osc("triangle", 220, t, 0.06, out, { peak: 0.35 * v }); }
        else if (sn === "big" || sn === "gated") { this.nz(t, sn === "gated" ? 0.22 : 0.3, out, { type: "bandpass", f: 1600, q: 0.5, peak: 0.6 * v }); this.osc("triangle", 160, t, 0.14, out, { peak: 0.4 * v }); }
        else if (sn === "dusty") { this.nz(t, 0.16, out, { type: "lowpass", f: 3000, peak: 0.45 * v }); this.osc("triangle", 180, t, 0.08, out, { peak: 0.3 * v }); }
        else { this.nz(t, 0.18, out, { type: "bandpass", f: 1900, q: 0.6, peak: 0.55 * v }); this.osc("triangle", 185, t, 0.1, out, { peak: 0.35 * v }); }
        break; }
      case 2: this.nz(t, 0.045, out, { f: K.hf, peak: 0.26 * v }); break;
      case 3: this.nz(t, 0.3, out, { f: K.hf - 500, peak: 0.24 * v }); break;
      case 4: for (const d of [0, 0.011, 0.023]) this.nz(t + d, d === 0.023 ? 0.16 : 0.02, out, { type: "bandpass", f: 1300, q: 1.2, peak: 0.5 * v }); break;
      case 5: case 6: { const f = K.taiko ? (r === 5 ? 68 : 120) : (r === 5 ? 110 : 180); this.osc("sine", f, t, K.taiko ? 0.7 : 0.3, out, { peak: 0.75 * v, slide: 0.62 }); if (K.taiko) this.nz(t, 0.12, out, { type: "lowpass", f: 900, peak: 0.4 * v }); break; }
      case 7: this.nz(t, 0.45, out, { type: "bandpass", f: 5200, q: 1.2, peak: 0.2 * v }); this.osc("square", 3730, t, 0.18, out, { peak: 0.02 * v }); break;
    }
  },
  crash(t, out) { this.nz(t, 1.3, out, { f: 5000, peak: 0.24 }); },
  perc(r, t, v, out) {
    switch (r) {
      case 0: this.osc("sine", 185, t, 0.26, out, { peak: 0.6 * v, slide: 0.9 }); this.nz(t, 0.01, out, { f: 2000, peak: 0.1 * v }); break;
      case 1: this.osc("sine", 270, t, 0.2, out, { peak: 0.55 * v, slide: 0.92 }); this.nz(t, 0.01, out, { f: 2500, peak: 0.1 * v }); break;
      case 2: this.osc("sine", 430, t, 0.12, out, { peak: 0.5 * v, slide: 0.9 }); break;
      case 3: this.nz(t, 0.06, out, { f: 6000, peak: 0.22 * v, a: 0.012 }); break;
      case 4: this.nz(t, 0.16, out, { f: 8000, peak: 0.25 * v }); this.osc("sine", 6200, t, 0.1, out, { peak: 0.03 * v }); break;
      case 5: { const c = this.ctx, g = c.createGain(), bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 2; bp.connect(g).connect(out); this.env(g, t, 0.002, 0.5 * v, 0.28);
        for (const f of [540, 800]) { const o = c.createOscillator(); o.type = "square"; o.frequency.value = f; o.connect(bp); o.start(t); o.stop(t + 0.35); } break; }
      case 6: this.osc("sine", 2500, t, 0.05, out, { peak: 0.35 * v }); break;
      case 7: this.osc("sine", 4200, t, 1.0, out, { peak: 0.06 * v }); this.osc("sine", 6100, t, 0.7, out, { peak: 0.03 * v }); break;
    }
  },

  // ---- pitched voices
  piano(m, t, out, v = 1, dur = 1.4) {
    dur = Math.max(0.5, Math.min(2.2, dur)); const f = mtof(m);
    this.osc("triangle", f, t, dur, out, { a: 0.004, peak: 0.4 * v, lp: 3200 });
    this.osc("sine", f * 2, t, dur * 0.5, out, { a: 0.003, peak: 0.12 * v }); this.osc("sine", f * 3, t, dur * 0.25, out, { a: 0.002, peak: 0.05 * v });
  },
  synth(m, t, out, dur = 0.14, v = 1, type = "square", lp = 2400) { this.osc(type, mtof(m), t, dur, out, { a: 0.004, peak: 0.22 * v, lp, q: 3 }); },
  pad(m, t, out, dur, v = 1) { for (const det of [-9, 0, 9]) this.osc("sawtooth", mtof(m), t, dur, out, { a: 0.35, peak: 0.09 * v, dec: dur, det, lp: 1100 }); },
  organ(m, t, out, dur, v = 1, att = 0.008) {
    const c = this.ctx, g = c.createGain(), f = mtof(m), trem = c.createGain(); trem.gain.value = 0.85;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 6.2; lg.gain.value = 0.15; lfo.connect(lg).connect(trem.gain);
    for (const [h, w] of [[1, 0.5], [2, 0.35], [3, 0.22], [4, 0.18], [6, 0.08], [8, 0.06]]) { const o = c.createOscillator(); o.frequency.value = f * h; const og = c.createGain(); og.gain.value = w; o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.15); }
    g.connect(trem).connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2 * v, t + att); g.gain.setValueAtTime(0.2 * v, t + Math.max(att, dur - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    lfo.start(t); lfo.stop(t + dur + 0.15);
  },
  strings(m, t, out, dur, v = 1, att = 0.25) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400; lp.Q.value = 0.5;
    const vb = this.vib(t, f, 5.2, 0.005, 0.2, t + dur + 0.7);
    for (const det of [-10, 0, 10]) { const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det; vb.connect(o.frequency); o.connect(lp); o.start(t); o.stop(t + dur + 0.7); }
    lp.connect(g).connect(out); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.085 * v, t + att); g.gain.setValueAtTime(0.085 * v, t + Math.max(att, dur)); g.gain.linearRampToValueAtTime(0, t + Math.max(att, dur) + 0.5);
  },
  brass(m, t, out, dur, v = 1, att = 0.03) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 1.5;
    lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(2900, t + att + 0.06); lp.frequency.linearRampToValueAtTime(1700, t + Math.max(att + 0.1, dur));
    const vb = this.vib(t, f, 5, 0.004, 0.3, t + dur + 0.2);
    for (const det of [-6, 6]) { const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det; vb.connect(o.frequency); o.connect(lp); o.start(t); o.stop(t + dur + 0.2); }
    lp.connect(g).connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + att); g.gain.setValueAtTime(0.16 * v, t + Math.max(att, dur - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
  },
  sax(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), lp = c.createBiquadFilter(), bp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(2600, t + 0.06); lp.frequency.linearRampToValueAtTime(1800, t + dur); lp.Q.value = 2;
    bp.type = "peaking"; bp.frequency.value = 1100; bp.gain.value = 6; bp.Q.value = 1.4;
    const vb = this.vib(t, f, 5.4, 0.006, Math.min(dur, 0.3), t + dur + 0.15);
    for (const [type, det] of [["sawtooth", 0], ["square", 4]]) { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det; vb.connect(o.frequency); const og = c.createGain(); og.gain.value = type === "square" ? 0.33 : 1; o.connect(og).connect(lp); o.start(t); o.stop(t + dur + 0.15); }
    lp.connect(bp).connect(g).connect(out);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42 * v, t + 0.04); g.gain.setValueAtTime(0.36 * v, t + Math.max(0.05, dur - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    this.nz(t, 0.06, out, { type: "bandpass", f: 2400, q: 1, peak: 0.04 * v });
  },
  keytar(m, t, out, dur, v = 1, from = null) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 5;
    lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(4500, t + 0.03); lp.frequency.exponentialRampToValueAtTime(2400, t + Math.max(0.1, dur));
    const vb = this.vib(t, f, 5.6, 0.008, Math.min(dur, 0.35), t + dur + 0.2);
    for (const [type, mul, det, w] of [["sawtooth", 1, 0, 1], ["sawtooth", 1, 9, 0.8], ["square", 0.5, 0, 0.5]]) {
      const o = c.createOscillator(); o.type = type; o.detune.value = det;
      if (from !== null && from !== m) { o.frequency.setValueAtTime(mtof(from) * mul, t); o.frequency.exponentialRampToValueAtTime(f * mul, t + 0.06); } else o.frequency.setValueAtTime(f * mul, t);
      vb.connect(o.frequency); const og = c.createGain(); og.gain.value = w; o.connect(og).connect(lp); o.start(t); o.stop(t + dur + 0.2);
    }
    lp.connect(g).connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13 * v, t + 0.01); g.gain.setValueAtTime(0.12 * v, t + Math.max(0.02, dur - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
  },
  harp(m, t, out, dur, v = 1, bend = false) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), bp = c.createBiquadFilter(), lp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1300; bp.Q.value = 0.9; lp.type = "lowpass"; lp.frequency.value = 3200;
    const vb = this.vib(t, f, 6.2, 0.012, 0.15, t + dur + 0.15);
    for (const [type, det] of [["square", 0], ["sawtooth", 6]]) { const o = c.createOscillator(); o.type = type; o.detune.value = det;
      if (bend) { o.frequency.setValueAtTime(f * 0.94, t); o.frequency.linearRampToValueAtTime(f, t + 0.15); } else o.frequency.setValueAtTime(f, t);
      vb.connect(o.frequency); o.connect(bp); o.start(t); o.stop(t + dur + 0.15); }
    bp.connect(lp).connect(g).connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.03); g.gain.setValueAtTime(0.45 * v, t + Math.max(0.04, dur - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    this.nz(t, 0.05, out, { type: "bandpass", f: 1800, q: 1, peak: 0.05 * v });
  },
  choir(m, t, out, dur, v = 1, vowel = "ah", att = 0.2) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), src = c.createGain(); src.gain.value = 1;
    const vb = this.vib(t, f, 5, 0.006, 0.3, t + dur + 0.6);
    for (const det of [-8, 8]) { const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det; vb.connect(o.frequency); o.connect(src); o.start(t); o.stop(t + dur + 0.6); }
    const F = vowel === "oo" ? [[350, 1], [800, 0.4], [2400, 0.12]] : [[750, 1], [1150, 0.55], [2600, 0.2]];
    for (const [fq, w] of F) { const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fq; bp.Q.value = 7; const bg = c.createGain(); bg.gain.value = w; src.connect(bp).connect(bg).connect(g); }
    g.connect(out); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5 * v, t + att); g.gain.setValueAtTime(0.5 * v, t + Math.max(att, dur)); g.gain.linearRampToValueAtTime(0, t + Math.max(att, dur) + 0.45);
  },
  bass(m, t, out, dur, v = 1, tone = "finger") {
    const f = mtof(m), d = Math.max(0.08, dur);
    if (tone === "slap") { this.osc("sawtooth", f, t, d, out, { a: 0.003, peak: 0.3 * v, lp: 1600, q: 2 }); this.osc("sine", f, t, d, out, { a: 0.004, peak: 0.45 * v }); this.nz(t, 0.02, out, { f: 2500, peak: 0.12 * v }); }
    else if (tone === "pick") { this.osc("sawtooth", f, t, d, out, { a: 0.004, peak: 0.25 * v, lp: 1200 }); this.osc("sine", f, t, d, out, { a: 0.004, peak: 0.45 * v }); }
    else if (tone === "upright") { this.osc("triangle", f, t, Math.min(d, 0.9), out, { a: 0.01, peak: 0.55 * v, lp: 700 }); this.osc("sine", f * 2, t, 0.1, out, { a: 0.004, peak: 0.08 * v }); }
    else if (tone === "synth") { this.osc("sawtooth", f, t, d, out, { a: 0.005, peak: 0.28 * v, lp: 750, q: 4 }); this.osc("square", f / 2, t, d, out, { a: 0.005, peak: 0.15 * v, lp: 400 }); }
    else if (tone === "dub") { this.osc("sine", f, t, d, out, { a: 0.01, peak: 0.75 * v }); this.osc("triangle", f, t, d, out, { a: 0.01, peak: 0.15 * v, lp: 380 }); }
    else { this.osc("triangle", f, t, d, out, { a: 0.006, peak: 0.4 * v, lp: 900 }); this.osc("sine", f, t, d, out, { a: 0.006, peak: 0.4 * v }); }
  },
  sub808(m, t, out, dur, v = 1) { const f = mtof(m); const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05); o.connect(g).connect(out); this.env(g, t, 0.004, 0.8 * v, Math.max(0.2, dur)); o.start(t); o.stop(t + dur + 0.1); this.osc("triangle", f * 2, t, 0.15, out, { peak: 0.1 * v }); },
  ksBuf(m) {
    if (this.ks[m]) return this.ks[m];
    const c = this.ctx, sr = c.sampleRate, N = Math.max(2, Math.round(sr / mtof(m))), len = Math.floor(sr * 1.8), b = c.createBuffer(1, len, sr), d = b.getChannelData(0);
    const ring = new Float32Array(N); for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    let p = 0; for (let i = 0; i < len; i++) { const a = ring[p], nb = ring[(p + 1) % N]; d[i] = a; ring[p] = (a + nb) * 0.4985; p = (p + 1) % N; }
    return (this.ks[m] = b);
  },
  pluck(m, t, out, v = 1, dur = 1.6, tone = "clean") {
    const c = this.ctx, s = c.createBufferSource(), g = c.createGain(), lp = c.createBiquadFilter(); s.buffer = this.ksBuf(m);
    lp.type = "lowpass"; lp.frequency.value = { clean: 3800, drive: 5000, nylon: 2000, lute: 4800, muted: 1500 }[tone] ?? 3800;
    dur = Math.max(0.05, dur); g.gain.setValueAtTime(0.7 * v, t); g.gain.setValueAtTime(0.7 * v, t + Math.max(0.01, dur - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = s.connect(lp); if (tone === "lute") { const pk = c.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = 320; pk.gain.value = 5; n = n.connect(pk); }
    n.connect(g).connect(out); s.start(t); s.stop(t + dur + 0.02);
  },
  wobble(m, t, out, dur, rate) {
    const c = this.ctx, lp = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = 7; lfo.frequency.value = rate; lg.gain.value = 460; lfo.connect(lg).connect(lp.frequency);
    for (const [type, mm, det] of [["sawtooth", m, -6], ["sawtooth", m, 6], ["square", m + 12, 0]]) { const o = c.createOscillator(); o.type = type; o.frequency.value = mtof(mm); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); }
    lp.connect(g).connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.setValueAtTime(0.3, t + Math.max(0.03, dur - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lfo.start(t); lfo.stop(t + dur + 0.05);
  },
  scratch(t, out, shape = [600, 2600, 500], dur = 0.16, v = 1) {
    const { s, fl } = this.nz(t, dur, out, { type: "bandpass", f: shape[0], q: 6, peak: 0.6 * v, rate: 0.6 });
    const n = shape.length; shape.forEach((f, i) => fl.frequency.linearRampToValueAtTime(f, t + dur * (i / (n - 1))));
    s.playbackRate.setValueAtTime(0.4, t); s.playbackRate.linearRampToValueAtTime(1.6, t + dur / 2); s.playbackRate.linearRampToValueAtTime(0.3, t + dur);
  },
  riser(t, out, dur) { const { fl } = this.nz(t, dur, out, { type: "bandpass", f: 400, q: 3, peak: 0.25, a: dur * 0.9 }); fl.frequency.exponentialRampToValueAtTime(6000, t + dur); },
  djFx(r, t, out, root = 33, bpm = 100) {
    [() => { this.drum(0, t, 1, KITS["909"], out); this.sub808(root, t, out, 0.5); }, () => this.wobble(root, t, out, 0.5, bpm / 60 * 2), () => this.scratch(t, out), () => this.scratch(t, out, [2600, 600, 2600, 600], 0.3),
      () => this.scratch(t, out, [3000, 1200], 0.07), () => this.riser(t, out, 1.2), () => { for (const d of [0, 0.18, 0.36]) this.osc("sawtooth", 466, t + d, 0.15, out, { peak: 0.25, lp: 2400 }); }, () => this.scratch(t, out, [400, 3200], 0.5)][r]?.();
  }
};

// ---------------------------------------------------------------- one sound per instrument (pads, custom patterns and the parts all use these)
function noteOf(cx, k, m, d, v = 1, opt = {}) {
  const B = cx.B, t = cx.t, out = cx.out, G = cx.G;
  switch (k) {
    case "bass": return B.bass(m, t, out, d, v, G.bassTone);
    case "piano": return B.piano(m, t, out, v, Math.max(d, 0.6));
    case "keys": return opt.pad ? B.pad(m, t, out, d, v) : B.synth(m, t, out, Math.max(0.1, d), v, opt.sq ? "square" : "sawtooth", 2400);
    case "organ": return B.organ(m, t, out, d, v, opt.att);
    case "guitar": return B.pluck(m, t, out, v * 0.8, Math.max(d, 0.12), opt.tone ?? G.gtr);
    case "lute": return B.pluck(m, t, out, v * 0.8, Math.max(d, 0.4), "lute");
    case "strings": return opt.pizz ? B.pluck(m, t, out, v * 0.7, 0.35, "nylon") : B.strings(m, t, out, d, v, opt.att ?? 0.2);
    case "brass": return B.brass(m, t, out, d, v, opt.att);
    case "sax": return B.sax(m, t, out, d, v);
    case "keytar": return B.keytar(m, t, out, d, v, opt.from ?? null);
    case "harmonica": return B.harp(m, t, out, d, v, opt.bend);
    case "choir": return B.choir(m, t, out, d, v, opt.vowel ?? "ah", opt.att);
    case "dj": return B.sub808(m, t, out, d, v);
  }
}

// ---------------------------------------------------------------- the parts
function mel(cx, which, k, shift = 0, opt = {}) {
  const n = MELS(cx.G, cx.V.song.gk ?? cx.V.song.genre)[which].get(cx.s); if (!n) return false;
  const m = n[0] + cx.tr + shift; noteOf(cx, k, m, n[1] * cx.STEP * 0.95, n[2], { ...opt, from: opt.glide ? Band._last?.[k] : null });
  (Band._last ??= {})[k] = m; return true;
}
function chordHits(cx, str, center, k, opt = {}, max = 8) {
  const c = PCH(str, cx.s); if (".-".includes(c)) return false;
  const len = c === "s" ? 1 : Math.min(max, gapSteps(str, cx.s, max));
  for (const m of voice(cx.ch, center)) noteOf(cx, k, m, len * cx.STEP * 0.92, (VEL[c] ?? 1) * 0.85, opt);
  return true;
}
function bassNote(cx, c, lo = 40) {
  const base = regRoot(cx.ch[0], lo);
  if (c === "a") return regRoot(cx.nch[0], lo) - 1;
  return base + ({ r: 0, f: 7, o: 12, 3: third(cx.ch), 7: sev(cx.ch), 6: 9, 5: 7 }[c] ?? 0);
}
function customPart(cx, cells) {
  if (!cells) return false; let hit = false; const I = cx.I, i = cx.i;
  for (let r = 0; r < 8; r++) {
    if (!cells.has(`${r}.${i}`)) continue;
    if (I.role === "drums") { cx.B.drum(r, cx.t, 1, KITS[cx.G.kit], cx.out); hit = true; continue; }
    if (I.role === "perc") { cx.B.perc(r, cx.t, 1, cx.out); hit = true; continue; }
    if (I.role === "dj") { cx.B.djFx(r, cx.t, cx.out, regRoot(cx.ch[0], 28), cx.V.song.bpm); hit = true; continue; }
    if (i > 0 && cells.has(`${r}.${i - 1}`)) continue;                     // held from the cell before
    let n = 1; while (i + n < 16 && cells.has(`${r}.${i + n}`)) n++;
    const base = regRoot(cx.ch[0], I.lo), t3 = third(cx.ch);
    const m = base + [0, t3, 7, 12, 12 + t3, 19, 24, 24 + t3][r];
    noteOf(cx, cx.k, m, n * cx.STEP * 0.95, 0.9, { att: 0.05, vowel: "ah" }); hit = true;
  }
  return hit;
}
const PARTS_B = {
  drums(cx) {
    const P = cx.G.drums[cx.v], K = KITS[cx.G.kit]; let hit = false;
    DK.forEach((key, r) => { const c = PCH(P[key], cx.s); const v = VEL[c]; if (c !== "." && v) { cx.B.drum(r, cx.t, v * (cx.i % 4 ? 0.92 : 1), K, cx.out); hit = true; } });
    if (cx.s === 0 && cx.v < 2 && cx.G.crash !== false) cx.B.crash(cx.t, cx.out);
    if (cx.v === 1 && cx.bar === cx.G.prog.length - 1 && cx.i >= 12) { cx.B.drum(cx.i < 14 ? 6 : 5, cx.t, 0.85, K, cx.out); hit = true; }
    return hit;
  },
  perc(cx) {
    const P = cx.G.perc?.[cx.v] ?? PERC_DEF[cx.v]; let hit = false;
    PK.forEach((key, r) => { const c = PCH(P[key], cx.s); if (c !== "." && VEL[c]) { cx.B.perc(r, cx.t, VEL[c], cx.out); hit = true; } });
    return hit;
  },
  bass(cx) {
    if (cx.v === 2) {                                                      // walking quarters, stepping into the next chord
      if (cx.i % 4) return false; const q = cx.i / 4, b = regRoot(cx.ch[0], 40), nb = regRoot(cx.nch[0], 40);
      const seq = cx.bar % 2 ? [b, b + 7, b + third(cx.ch) + 12 > 55 ? b + 5 : b + third(cx.ch) + 12, nb + 1] : [b, b + third(cx.ch), b + 7, nb - 1];
      cx.B.bass(seq[q], cx.t, cx.out, cx.STEP * 3.6, q ? 0.85 : 1, cx.G.bassTone === "synth" ? "finger" : cx.G.bassTone); return true;
    }
    const str = cx.v === 0 ? "r------.r------." : cx.G.bass, c = PCH(str, cx.s);
    if (!"rfo3765a".includes(c) || c === ".") return false;
    cx.B.bass(bassNote(cx, c), cx.t, cx.out, holdSteps(str, cx.s) * cx.STEP * 0.92, VEL[c] ?? 1, cx.G.bassTone); return true;
  },
  dj(cx) {
    const r = regRoot(cx.ch[0], 28);
    if (cx.v === 0) { const str = cx.G.sub ?? "r-----.r--r---..", c = PCH(str, cx.s); if (c !== "r") return false; cx.B.sub808(r, cx.t, cx.out, holdSteps(str, cx.s) * cx.STEP); return true; }
    if (cx.v === 1) { if (cx.i % 8) return false; cx.B.wobble(r, cx.t, cx.out, cx.STEP * 7.8, cx.V.song.bpm / 60 * (cx.bar % 2 ? 4 : 2)); return true; }
    if (cx.i === 0 && cx.bar === cx.G.prog.length - 1) cx.B.riser(cx.t, cx.out, cx.STEP * 15);
    if (cx.i === 0 || cx.i === 8) cx.B.sub808(r, cx.t, cx.out, cx.STEP * 6, 0.8);
    const sc = { 4: [[700, 2600, 600], 0.18], 6: [[2400, 500], 0.1], 12: [[500, 2800, 400, 2600], 0.26], 15: [[2600, 900], 0.08] }[cx.i];
    if (sc && (cx.bar % 2 || cx.i !== 15)) { cx.B.scratch(cx.t, cx.out, sc[0], sc[1]); return true; }
    return cx.i === 0 || cx.i === 8;
  },
  piano(cx) {
    if (cx.v === 0) { const str = cx.G.pianoA ?? "x.......x..x....", c = PCH(str, cx.s); if (c === ".") return false;
      const v = cx.i === 0 ? 1 : 0.65; cx.B.piano(regRoot(cx.ch[0], 43), cx.t, cx.out, v * 0.8, 1.6); for (const m of voice(cx.ch, 62)) cx.B.piano(m, cx.t, cx.out, v * 0.7, 1.4); return true; }
    if (cx.v === 1) return chordHits(cx, cx.G.comp, 64, "piano");
    return mel(cx, "A", "piano", 12);
  },
  keys(cx) {
    if (cx.v === 0) { if (cx.i) return false; for (const m of [...voice(cx.ch, 64), regRoot(cx.ch[0], 48)]) cx.B.pad(m, cx.t, cx.out, cx.STEP * 15.5); return true; }
    if (cx.v === 1) { if (!cx.G.arp16 && cx.i % 2) return false; const vc = voice(cx.ch, 64), seq = [...vc, vc[0] + 12, ...vc.slice(1).reverse()];
      const n = cx.G.arp16 ? cx.i : cx.i / 2; noteOf(cx, "keys", seq[n % seq.length] + 12, cx.STEP * 0.9, 0.85, { sq: true }); return true; }
    return chordHits(cx, cx.G.stab ?? "..x...x...x...x.", 64, "keys", {}, 1);
  },
  organ(cx) {
    if (cx.v === 0) { if (cx.i) return false; for (const m of voice(cx.ch, 60)) cx.B.organ(m, cx.t, cx.out, cx.STEP * 15.6, 0.8, 0.03); return true; }
    if (cx.v === 1) return chordHits(cx, cx.G.organ ?? cx.G.comp, 62, "organ", {}, 4);
    if (cx.i || cx.bar % 2) return false; for (const m of voice(cx.ch, 60)) cx.B.organ(m, cx.t, cx.out, cx.STEP * 30, 0.9, cx.STEP * 24); return true;
  },
  guitar(cx) {
    const G = cx.G, vc = gvoice(cx.ch), tone = G.gtr, B = cx.B, t = cx.t, o = cx.out, S = cx.STEP, i = cx.i;
    const strum = (notes, v, dur, up = false) => (up ? [...notes].reverse() : notes).forEach((m, k) => B.pluck(m, t + k * 0.012, o, v * 0.55, dur, tone));
    if (cx.v === 0) { const c = PCH(G.strum, cx.s); if (".-".includes(c)) return false;
      const len = Math.min(8, gapSteps(G.strum, cx.s)); strum(c === "u" ? vc.slice(-4) : vc, VEL[c] ?? 1, c === "s" ? S * 0.9 : len * S * 1.1, c === "u"); return true; }
    if (cx.v === 1) { if (i % 2) return false; const seq = [0, 3, 2, 4, 1, 3, 2, 4]; B.pluck(vc[seq[i / 2] % vc.length], t, o, 0.6, 1.4, tone === "drive" ? "clean" : tone); return true; }
    switch (G.riff) {
      case "power": { if (i % 2) return false; const acc = i === 0 || i === 8; strum(vc.slice(0, 3), acc ? 1 : 0.6, acc ? S * 3.5 : S * 0.8); return true; }
      case "boogie": { if (i % 2) return false; const r = regRoot(cx.ch[0], 40), top = [7, 7, 9, 9, 10, 10, 9, 9][i / 2]; B.pluck(r, t, o, 0.5, S * 1.8, tone); B.pluck(r + top, t + 0.008, o, 0.45, S * 1.8, tone); return true; }
      case "comp": return chordHits(cx, G.comp, 60, "guitar", { tone: "clean" }, 2);
      case "pick": { const at = { 0: 0, 3: 1, 6: 2, 10: 3, 13: 2 }[i]; if (at === undefined) return false; B.pluck(vc[(at + 1) % vc.length] + 12, t, o, 0.5, S * 4, tone); return true; }
      case "arp16": { const v4 = voice(cx.ch, 64); B.pluck(v4[i % v4.length] + 12, t, o, i % 4 ? 0.3 : 0.5, S * 0.8, "muted"); return true; }
      case "skank": { const c = PCH(G.comp, cx.s); if (c === ".") return false; voice(cx.ch, 66).forEach((m, k) => B.pluck(m + 12, t + k * 0.004, o, 0.55, S * 1.1, "clean")); return true; }
      case "bossa": { if (i === 0 || i === 8) { B.pluck(i ? vc[1] : vc[0], t, o, 0.6, S * 6, "nylon"); return true; }
        if (![3, 6, 10, 13].includes(i)) return false; voice(cx.ch, 60).forEach((m, k) => B.pluck(m, t + k * 0.006, o, 0.4, S * 2.5, "nylon")); return true; }
      case "chick": { if (i % 4) return false; if (i % 8 === 0) { B.pluck(i ? vc[1] : vc[0], t, o, 0.7, S * 3, tone); return true; }
        voice(cx.ch, 62).forEach((m, k) => B.pluck(m, t + k * 0.006, o, 0.45, S * 0.9, tone)); return true; }
      case "trem": { const v3 = voice(cx.ch, 64); B.pluck(v3[v3.length - 1] + 12, t, o, i % 4 ? 0.3 : 0.45, S * 1.1, "clean"); return true; }
      default: { if (![0, 3, 6, 8, 10, 13, 14].includes(i)) return false; const acc = i === 0 || i === 6 || i === 10;
        vc.slice(2).forEach((m, k) => B.pluck(m + 12, t + k * 0.006, o, acc ? 0.5 : 0.28, acc ? 0.14 : 0.07, "clean")); return true; }
    }
  },
  lute(cx) {
    if (cx.v === 0) { if (cx.i % 2) return false; const vc = voice(cx.ch, 64), seq = [0, 1, 2, 1, 3, 2, 1, 2], all = [...vc, vc[0] + 12]; noteOf(cx, "lute", all[seq[cx.i / 2] % all.length], cx.STEP * 3, 0.7); return true; }
    if (cx.v === 1) {                                                        // tremolo: re-pluck the held melody note
      const M = MELS(cx.G, cx.V.song.gk ?? cx.V.song.genre).A; let back = 0, n = null; while (back < 8 && !(n = M.get(cx.s - back))) back++;
      if (!n || back >= n[1]) return false; noteOf(cx, "lute", n[0] + cx.tr, cx.STEP * 1.2, back ? 0.45 : 0.8); return true;
    }
    return chordHits(cx, cx.G.strum, 62, "lute");
  },
  strings(cx) {
    if (cx.v === 0) { if (cx.i) return false; for (const m of [regRoot(cx.ch[0], 43), ...voice(cx.ch, 62)]) cx.B.strings(m, cx.t, cx.out, cx.STEP * 15.5, 0.8, 0.35); return true; }
    if (cx.v === 1) { if (cx.i % 2) return false; const vc = voice(cx.ch, 60), seq = [0, 2, 1, 2, 0, 2, 1, 2]; noteOf(cx, "strings", vc[seq[cx.i / 2] % vc.length], 0.3, cx.i % 8 ? 0.6 : 0.9, { pizz: true }); return true; }
    return mel(cx, "D", "strings", 0, { att: 0.15 });
  },
  brass(cx) {
    if (cx.v === 0) return chordHits(cx, cx.G.stab ?? "....x.......x.x.", 62, "brass", { att: 0.02 }, 2);
    if (cx.v === 1) { if (cx.i || cx.bar % 2) return false; for (const m of voice(cx.ch, 60)) cx.B.brass(m, cx.t, cx.out, cx.STEP * 30, 0.8, cx.STEP * 20); return true; }
    const n = MELS(cx.G, cx.V.song.gk ?? cx.V.song.genre).A.get(cx.s); if (!n) return false;
    const m = n[0] + cx.tr, pcs = QUAL[cx.ch[1]].map(x => pcOf(cx.ch[0] + x)); let h = m - 3; while (h > m - 9 && !pcs.includes(pcOf(h))) h--;
    const d = n[1] * cx.STEP * 0.9; cx.B.brass(m - 12, cx.t, cx.out, d, 0.9); cx.B.brass(h - 12, cx.t, cx.out, d, 0.7); return true;
  },
  sax(cx) { return mel(cx, ["A", "B", "C"][cx.v], "sax", -12); },
  keytar(cx) {
    if (cx.v === 0) return mel(cx, "A", "keytar", 0, { glide: true });
    if (cx.v === 1) { const vc = voice(cx.ch, 69), seq = [vc[0], vc[1], vc[2], vc[0] + 12, vc[2], vc[1], vc[0] + 12, vc[1] + 12]; noteOf(cx, "keytar", seq[cx.i % 8], cx.STEP * 0.85, cx.i % 4 ? 0.7 : 1); return true; }
    return mel(cx, "C", "keytar", 0, { glide: true });
  },
  harmonica(cx) {
    if (cx.v === 0) return chordHits(cx, cx.G.harp ?? "x.......x.......", 67, "harmonica");
    if (cx.v === 1) return mel(cx, "B", "harmonica", -12);
    return mel(cx, "C", "harmonica", -12, { bend: (cx.s * 5) % 3 === 0 });
  },
  choir(cx) {
    if (cx.v === 0) { if (cx.i) return false; for (const m of voice(cx.ch, 60)) cx.B.choir(m, cx.t, cx.out, cx.STEP * 15.5, 0.7, "oo", 0.4); return true; }
    if (cx.v === 1) { if (cx.i || cx.bar % 2) return false; for (const m of voice(cx.ch, 64)) cx.B.choir(m, cx.t, cx.out, cx.STEP * 30, 0.8, "ah", cx.STEP * 10); return true; }
    const n = MELS(cx.G, cx.V.song.gk ?? cx.V.song.genre).A.get(cx.s); if (!n) return false; const r = regRoot(cx.ch[0], 48);
    for (const m of [r, r + 7]) cx.B.choir(m, cx.t, cx.out, n[1] * cx.STEP * 0.9, 0.6, "ah", 0.05); return true;
  }
};



// ====================================================================== 🍀 The Lucky Clovers' Stage (Incredibox-style)
// The playable characters are the band. Drop a sound on a character and they play it, on their own instrument:
// Ollie plays winds, Quickare piano (and his trick shots), Triton everything (keytar first, plus a second instrument),
// Big Green sings (and calls the beasts), Binko runs the DJ set. Anyone can set anyone's sound.
// Extras: combo bonuses, spotlight solos, song sections with a Drop, a GM guest seat, recording takes for Spopify,
// and a hype meter. While someone has the stage open, or the GM turns on table music, everyone online hears it,
// and the characters' tokens bounce in time wherever they stand.

// ---- small helpers for shaping voices
const formant = (B, src, t, vowel, out, gain = 1) => {
  const c = B.ctx, F = { oo: [[330, 1], [870, 0.45], [2240, 0.12]], ah: [[750, 1], [1150, 0.55], [2600, 0.2]], eh: [[530, 1], [1840, 0.5], [2480, 0.2]], ee: [[300, 1], [2300, 0.4], [3000, 0.2]], aw: [[570, 1], [840, 0.6], [2410, 0.15]] }[vowel] ?? [[750, 1], [1150, 0.5], [2600, 0.2]];
  const g = c.createGain(); g.gain.value = gain; for (const [f, w] of F) { const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 7; const bg = c.createGain(); bg.gain.value = w; src.connect(bp).connect(bg).connect(g); }
  g.connect(out); return g;
};
const ampEnv = (g, t, a, peak, dur, rel = 0.1) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.setValueAtTime(Math.max(0.0002, peak * 0.9), t + Math.max(a + 0.01, dur)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + 0.01, dur) + rel); };

// ---- extra voices the cast needs
Object.assign(Band, {
  flute(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), vb = this.vib(t, f, 5.2, 0.007, Math.min(dur, 0.25), t + dur + 0.25);
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f; vb.connect(o.frequency); o.connect(g);
    const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = "triangle"; o2.frequency.value = f * 2; g2.gain.value = 0.1; o2.connect(g2).connect(g);
    g.connect(out); ampEnv(g, t, 0.05, 0.3 * v, dur, 0.12); o.start(t); o.stop(t + dur + 0.25); o2.start(t); o2.stop(t + dur + 0.25);
    this.nz(t, Math.max(0.08, dur * 0.6), out, { type: "bandpass", f: Math.min(8000, f * 2.5), q: 1.2, peak: 0.045 * v, a: 0.03 });
  },
  clarinet(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = Math.min(4000, f * 5); lp.Q.value = 1.2;
    const vb = this.vib(t, f, 5, 0.004, 0.3, t + dur + 0.25), o = c.createOscillator(); o.type = "square"; o.frequency.value = f; vb.connect(o.frequency);
    o.connect(lp).connect(g).connect(out); ampEnv(g, t, 0.04, 0.15 * v, dur); o.start(t); o.stop(t + dur + 0.2);
  },
  ocarina(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), vb = this.vib(t, f, 4.6, 0.005, 0.25, t + dur + 0.25), o = c.createOscillator();
    o.type = "sine"; o.frequency.value = f; vb.connect(o.frequency); o.connect(g).connect(out); ampEnv(g, t, 0.03, 0.32 * v, dur, 0.08); o.start(t); o.stop(t + dur + 0.2);
    this.nz(t, 0.05, out, { type: "bandpass", f: f * 3, q: 2, peak: 0.03 * v });
  },
  whistle(m, t, out, dur, v = 1, from = null) {
    const c = this.ctx, f = mtof(m + 12), g = c.createGain(), o = c.createOscillator(), vb = this.vib(t, f, 6, 0.01, 0.15, t + dur + 0.2); o.type = "sine";
    if (from) { o.frequency.setValueAtTime(mtof(from + 12), t); o.frequency.exponentialRampToValueAtTime(f, t + 0.07); } else o.frequency.setValueAtTime(f, t);
    vb.connect(o.frequency); o.connect(g).connect(out); ampEnv(g, t, 0.02, 0.2 * v, dur, 0.06); o.start(t); o.stop(t + dur + 0.15);
  },
  didge(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), lp = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain(), o = c.createOscillator();
    lp.type = "lowpass"; lp.Q.value = 9; lp.frequency.value = 500; lfo.frequency.value = 2.2; lg.gain.value = 300; lfo.connect(lg).connect(lp.frequency);
    o.type = "sawtooth"; o.frequency.value = f; o.connect(lp).connect(g).connect(out); ampEnv(g, t, 0.15, 0.35 * v, dur, 0.3);
    o.start(t); o.stop(t + dur + 0.4); lfo.start(t); lfo.stop(t + dur + 0.4); this.osc("sine", f, t, dur, out, { a: 0.1, peak: 0.25 * v });
  },
  shimmer(m, t, out, v = 1) { const f = mtof(m); [[1, 0.12], [2.76, 0.06], [5.4, 0.03]].forEach(([h, w]) => this.osc("sine", f * h, t, 1.6 / h, out, { a: 0.002, peak: w * v })); },
  saloon(m, t, out, v = 1, dur = 0.8) { this.piano(m, t, out, v * 0.7, dur); this.osc("triangle", mtof(m) * 1.012, t, Math.max(0.4, dur), out, { a: 0.003, peak: 0.22 * v, lp: 4200 }); },
  musicbox(m, t, out, v = 1) { const f = mtof(m); this.osc("sine", f, t, 1.2, out, { peak: 0.24 * v }); this.osc("sine", f * 3, t, 0.4, out, { peak: 0.07 * v }); this.osc("sine", f * 4.2, t, 0.25, out, { peak: 0.04 * v }); },
  shot(r, t, out, v = 1) {
    switch (r) {
      case 0: { const { fl } = this.nz(t, 0.35, out, { type: "bandpass", f: 300, q: 2, peak: 0.35 * v, a: 0.08 }); fl.frequency.exponentialRampToValueAtTime(2500, t + 0.35); break; } // Gust
      case 1: this.nz(t, 0.08, out, { type: "lowpass", f: 1200, peak: 0.6 * v }); this.osc("sine", 160, t, 0.12, out, { peak: 0.5 * v, slide: 0.5 }); break; // Powder
      case 2: this.nz(t, 0.5, out, { f: 4000, peak: 0.12 * v, a: 0.05 }); break; // Mist
      case 3: this.osc("sine", 3200, t, 0.35, out, { peak: 0.14 * v, slide: 0.35 }); this.nz(t, 0.02, out, { f: 3000, peak: 0.3 * v }); break; // Trick Shot (ricochet)
      case 4: for (let k = 0; k < 6; k++) this.nz(t + k * 0.025, 0.012, out, { f: 2500 + k * 400, peak: (0.25 - 0.03 * k) * v }); this.osc("sawtooth", 900, t, 0.3, out, { peak: 0.04 * v, lp: 2000, slide: 2 }); break; // Flare
      case 5: this.nz(t, 0.25, out, { type: "lowpass", f: 5000, peak: 0.8 * v }); this.osc("sine", 90, t, 0.3, out, { peak: 0.8 * v, slide: 0.4 }); this.nz(t + 0.02, 0.9, out, { type: "bandpass", f: 600, q: 0.5, peak: 0.08 * v, a: 0.05 }); break; // Season's End
    }
  },
  accordion(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1300; bp.Q.value = 0.7;
    for (const [type, mul] of [["square", 1], ["square", 1.0045], ["sawtooth", 2]]) { const o = c.createOscillator(); o.type = type; o.frequency.value = f * mul; const og = c.createGain(); og.gain.value = mul === 2 ? 0.3 : 1; o.connect(og).connect(bp); o.start(t); o.stop(t + dur + 0.15); }
    bp.connect(g).connect(out); ampEnv(g, t, 0.03, 0.13 * v, dur, 0.08);
  },
  theremin(m, t, out, dur, v = 1, from = null) {
    const c = this.ctx, f = mtof(m), g = c.createGain(), o = c.createOscillator(), vb = this.vib(t, f, 6, 0.013, 0.1, t + dur + 0.3); o.type = "sine";
    if (from) { o.frequency.setValueAtTime(mtof(from), t); o.frequency.exponentialRampToValueAtTime(f, t + 0.15); } else o.frequency.setValueAtTime(f, t);
    vb.connect(o.frequency); o.connect(g).connect(out); ampEnv(g, t, 0.08, 0.22 * v, dur, 0.2); o.start(t); o.stop(t + dur + 0.3);
  },
  talkbox(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), src = c.createGain(); src.gain.value = 1;
    for (const type of ["sawtooth", "square"]) { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.connect(src); o.start(t); o.stop(t + dur + 0.15); }
    const g = c.createGain(); g.connect(out); ampEnv(g, t, 0.02, 0.5 * v, dur, 0.08);
    for (const [f0, f1, w] of [[330, 760, 1], [870, 1150, 0.5]]) { const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 8; bp.frequency.setValueAtTime(f0, t); bp.frequency.linearRampToValueAtTime(f1, t + Math.max(0.05, dur * 0.6)); const bg = c.createGain(); bg.gain.value = w; src.connect(bp).connect(bg).connect(g); }
  },
  throat(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), o = c.createOscillator(), bp = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
    o.type = "sawtooth"; o.frequency.value = f; bp.type = "bandpass"; bp.Q.value = 18; bp.frequency.value = f * 8; lfo.frequency.value = 0.35; lg.gain.value = f * 3; lfo.connect(lg).connect(bp.frequency);
    o.connect(bp).connect(g).connect(out); const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 400; o.connect(lp).connect(g);
    ampEnv(g, t, 0.2, 0.3 * v, dur, 0.3); o.start(t); o.stop(t + dur + 0.4); lfo.start(t); lfo.stop(t + dur + 0.4);
  },
  hum(m, t, out, dur, v = 1) { this.osc("sine", mtof(m), t, dur, out, { a: 0.1, peak: 0.28 * v }); this.osc("triangle", mtof(m), t, dur, out, { a: 0.1, peak: 0.1 * v, lp: 600 }); },
  burp(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), o = c.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f * 1.15, t); o.frequency.exponentialRampToValueAtTime(f * 0.85, t + Math.max(0.08, dur));
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 23; lg.gain.value = f * 0.06; lfo.connect(lg).connect(o.frequency);
    const g = c.createGain(); ampEnv(g, t, 0.01, 0.6 * v, dur, 0.06); formant(this, o, t, "aw", g, 1); g.connect(out);
    o.start(t); o.stop(t + dur + 0.1); lfo.start(t); lfo.stop(t + dur + 0.1); this.osc("sine", f, t, dur, out, { a: 0.01, peak: 0.35 * v });
  },
  shout(t, out, v = 1, pitch = 220) {
    const c = this.ctx, o = c.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(pitch * 1.2, t); o.frequency.exponentialRampToValueAtTime(pitch * 0.9, t + 0.18);
    const g = c.createGain(); ampEnv(g, t, 0.01, 0.55 * v, 0.14, 0.06); formant(this, o, t, "eh", g); g.connect(out); o.start(t); o.stop(t + 0.3);
    this.nz(t, 0.05, out, { type: "bandpass", f: 1800, q: 2, peak: 0.25 * v });
  },
  howl(m, t, out, dur, v = 1) {
    const c = this.ctx, f = mtof(m), o = c.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur * 0.4); o.frequency.exponentialRampToValueAtTime(f * 0.9, t + dur);
    const vb = this.vib(t, f, 5, 0.01, 0.3, t + dur + 0.2); vb.connect(o.frequency);
    const g = c.createGain(); ampEnv(g, t, 0.15, 0.4 * v, dur, 0.2); formant(this, o, t, "oo", g); g.connect(out); o.start(t); o.stop(t + dur + 0.3);
  },
  bird(t, out, v = 1) { for (let k = 0; k < 3; k++) { const o = this.osc("sine", 2500 + k * 300, t + k * 0.07, 0.05, out, { peak: 0.1 * v }); o.frequency.exponentialRampToValueAtTime(4200 + k * 200, t + k * 0.07 + 0.05); } },
  vocoder(m, t, out, dur, v = 1, vowel = "ah") { const c = this.ctx, src = c.createGain(); for (const d of [0, 4, 7]) { const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m + d); o.connect(src); o.start(t); o.stop(t + dur + 0.1); } const g = c.createGain(); ampEnv(g, t, 0.005, 0.35 * v, dur, 0.04); formant(this, src, t, vowel, g); g.connect(out); },
  servo(t, out, v = 1) { const o = this.osc("square", 300, t, 0.12, out, { peak: 0.1 * v, lp: 2000 }); o.frequency.exponentialRampToValueAtTime(900, t + 0.12); },
  hydraulic(t, out, v = 1) { this.nz(t, 0.25, out, { type: "lowpass", f: 900, peak: 0.3 * v, a: 0.01 }); this.osc("sine", 70, t, 0.12, out, { peak: 0.5 * v, slide: 0.6 }); },
  glitch(m, t, out, STEP, v = 1) { for (let k = 0; k < 4; k++) this.osc("square", mtof(m + (k % 2) * 12), t + k * STEP / 4, STEP / 6, out, { peak: 0.09 * v, lp: 3000 }); },
  cannon(t, out, v = 1) { this.nz(t, 1.3, out, { type: "lowpass", f: 300, peak: 0.9 * v }); this.osc("sine", 55, t, 0.9, out, { peak: 1 * v, slide: 0.5 }); this.osc("sawtooth", 1400, t, 0.4, out, { peak: 0.08 * v, lp: 3000, slide: 0.2 }); },
  goat(t, out, v = 1, m = 69) { const c = this.ctx, f = mtof(m), o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(); o.type = "sawtooth"; o.frequency.value = f; lfo.frequency.value = 14; lg.gain.value = f * 0.035; lfo.connect(lg).connect(o.frequency); const g = c.createGain(); ampEnv(g, t, 0.02, 0.4 * v, 0.32, 0.08); formant(this, o, t, "eh", g); g.connect(out); o.start(t); o.stop(t + 0.45); lfo.start(t); lfo.stop(t + 0.45); },
  honk(t, out, v = 1) { this.osc("square", 350, t, 0.18, out, { peak: 0.14 * v, lp: 1400 }); this.osc("square", 353, t, 0.18, out, { peak: 0.12 * v, lp: 1400 }); },
  bell(t, out, v = 1) { this.osc("sine", 2400, t, 0.6, out, { peak: 0.1 * v }); this.osc("sine", 3300, t, 0.4, out, { peak: 0.05 * v }); },
  beatbox(r, t, out, v = 1) {
    switch (r) {
      case 0: this.osc("sine", 125, t, 0.2, out, { peak: 0.85 * v, slide: 0.38 }); this.nz(t, 0.035, out, { type: "lowpass", f: 700, peak: 0.45 * v }); break;
      case 1: this.nz(t, 0.14, out, { type: "bandpass", f: 1800, q: 0.9, peak: 0.6 * v }); this.nz(t, 0.05, out, { type: "bandpass", f: 650, q: 2, peak: 0.35 * v }); break;
      case 2: this.nz(t, 0.04, out, { f: 6500, peak: 0.3 * v, a: 0.006 }); break;
      case 3: this.nz(t, 0.22, out, { f: 5500, peak: 0.24 * v, a: 0.012 }); break;
      case 4: this.nz(t, 0.06, out, { type: "bandpass", f: 2500, q: 3, peak: 0.5 * v }); break;
      case 5: case 6: this.choir(r === 5 ? 45 : 52, t, out, 0.18, 0.75 * v, "oo", 0.01); break;
      case 7: this.nz(t, 0.3, out, { type: "bandpass", f: 4500, q: 1.5, peak: 0.14 * v }); break;
    }
  },
  cheer(t, out) { const { fl } = this.nz(t, 2.2, out, { type: "bandpass", f: 900, q: 0.6, peak: 0.25, a: 0.5 }); fl.frequency.linearRampToValueAtTime(1600, t + 1.5); }
});


// ---------------------------------------------------------------- real instruments: recorded samples, loaded when first needed
// Grand piano: Salamander Grand Piano by Alexander Holm (CC BY 3.0). Orchestra, band and folk instruments: MusyngKite soundfont
// by Benjamin Gleitz, via midi-js-soundfonts (CC BY-SA 3.0). Drum kit and taiko: FluidR3_GM by Frank Wen (MIT).
// Each pack is one file in worlds/rhine/audio/band: a little header, then one short recording every few notes.
const SMP = { base: "samples/", inst: {}, pending: {} };
function smpLoad(name) {
  if (name in SMP.inst) return Promise.resolve(SMP.inst[name]);
  if (SMP.pending[name]) return SMP.pending[name];
  const ctx = Band.ctx; if (!ctx) return Promise.resolve(null);
  return (SMP.pending[name] = (async () => {
    const r = await fetch(`${SMP.base}${name}.bin`); if (!r.ok) throw new Error(`${r.status}`);
    const buf = await r.arrayBuffer(), hl = new DataView(buf).getUint32(0, true);
    const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl))), base = 4 + hl;
    const notes = await Promise.all(head.notes.map(async ([m, off, len]) => {
      const b = await ctx.decodeAudioData(buf.slice(base + off, base + off + len)), d = b.getChannelData(0);
      let k = 0; while (k < d.length && Math.abs(d[k]) < 0.003) k++;                 // skip the encoder's silent lead-in so hits land on the beat
      return [m, b, Math.max(0, k - 32) / b.sampleRate];
    }));
    notes.sort((a, b) => a[0] - b[0]);
    return (SMP.inst[name] = { notes, gain: head.gain ?? 1 });
  })().catch(e => { console.warn(`Rhine Stage | couldn't load the ${name} samples`, e); return (SMP.inst[name] = false); }));
}
// where each instrument sounds natural: [lowest, highest, sustains?, attack, release, level]
const PROF = {
  grand_piano: [28, 100, 0, 0.002, 0.35, 0.72], bright_piano: [36, 96, 0, 0.002, 0.3, 0.6], honkytonk: [36, 96, 0, 0.002, 0.3, 0.52], epiano: [36, 91, 0, 0.002, 0.3, 0.8], epiano2: [36, 91, 0, 0.002, 0.3, 0.8],
  harpsichord: [41, 89, 0, 0.002, 0.2, 0.7], clavinet: [48, 84, 0, 0.002, 0.1, 1], celesta: [60, 96, 0, 0.002, 0.4, 0.4], glockenspiel: [72, 103, 0, 0.002, 0.4, 0.35], music_box: [60, 96, 0, 0.002, 0.4, 0.45],
  vibraphone: [53, 89, 0, 0.002, 0.5, 0.6], marimba: [45, 84, 0, 0.002, 0.25, 0.7], xylophone: [65, 96, 0, 0.002, 0.2, 0.5], tubular_bells: [60, 77, 0, 0.002, 0.8, 0.5], dulcimer: [55, 86, 0, 0.002, 0.4, 0.6], kalimba: [55, 86, 0, 0.002, 0.3, 0.7],
  drawbar_organ: [36, 84, 1, 0.01, 0.1, 0.9], rock_organ: [36, 84, 1, 0.01, 0.1, 0.9], church_organ: [29, 84, 1, 0.06, 0.5, 0.9], accordion: [48, 84, 1, 0.03, 0.1, 0.9],
  harmonica: [60, 84, 1, 0.03, 0.12, 2.3], bagpipe: [57, 79, 1, 0.04, 0.15, 1.4],
  guitar_nylon: [40, 84, 0, 0.002, 0.25, 1.1], guitar_steel: [40, 84, 0, 0.002, 0.25, 1], guitar_jazz: [40, 84, 0, 0.002, 0.2, 1], guitar_clean: [40, 86, 0, 0.002, 0.2, 1],
  guitar_muted: [40, 84, 0, 0.002, 0.06, 1], guitar_overdrive: [40, 84, 1, 0.003, 0.12, 0.8], guitar_distortion: [40, 84, 1, 0.003, 0.12, 0.75],
  banjo: [48, 86, 0, 0.002, 0.15, 1], sitar: [48, 84, 0, 0.002, 0.4, 1], koto: [48, 86, 0, 0.002, 0.3, 1], shamisen: [48, 84, 0, 0.002, 0.2, 1],
  bass_acoustic: [28, 55, 0, 0.004, 0.12, 0.4], bass_finger: [28, 55, 0, 0.004, 0.08, 1.1], bass_pick: [28, 55, 0, 0.003, 0.08, 1.1], bass_fretless: [28, 55, 0, 0.01, 0.12, 1.1], bass_slap: [28, 55, 0, 0.002, 0.08, 1.1], bass_synth: [28, 55, 0, 0.004, 0.06, 1],
  violin: [55, 93, 1, 0.07, 0.3, 1.6], viola: [48, 81, 1, 0.07, 0.3, 1.6], cello: [36, 72, 1, 0.07, 0.3, 1.7], contrabass: [28, 55, 1, 0.07, 0.3, 1.7], tremolo_strings: [43, 88, 1, 0.05, 0.3, 1.4],
  pizzicato: [36, 84, 0, 0.002, 0.15, 1.1], harp: [36, 96, 0, 0.002, 0.6, 1.1], fiddle: [55, 88, 1, 0.03, 0.15, 1.5], strings: [36, 88, 1, 0.15, 0.5, 1.5], strings_slow: [36, 88, 1, 0.35, 0.7, 1.5], timpani: [38, 55, 0, 0.002, 0.6, 1.2],
  choir_aahs: [48, 79, 1, 0.2, 0.5, 1.5], voice_oohs: [48, 79, 1, 0.15, 0.4, 0.85], synth_voice: [48, 84, 1, 0.1, 0.4, 1.0], orchestra_hit: [48, 72, 0, 0.002, 0.3, 0.9],
  trumpet: [55, 82, 1, 0.02, 0.15, 1.7], trombone: [40, 72, 1, 0.03, 0.15, 1.8], tuba: [28, 58, 1, 0.04, 0.15, 2.0], muted_trumpet: [55, 82, 1, 0.02, 0.12, 1.8], french_horn: [41, 77, 1, 0.06, 0.25, 1.9], brass: [41, 82, 1, 0.03, 0.2, 1.8],
  soprano_sax: [60, 88, 1, 0.03, 0.12, 2.4], alto_sax: [53, 84, 1, 0.03, 0.12, 2.9], tenor_sax: [46, 77, 1, 0.03, 0.12, 2.9], bari_sax: [36, 69, 1, 0.03, 0.12, 2.8],
  oboe: [58, 89, 1, 0.03, 0.12, 2.0], english_horn: [52, 81, 1, 0.03, 0.12, 2.0], bassoon: [34, 67, 1, 0.03, 0.12, 2.2], clarinet: [50, 88, 1, 0.03, 0.12, 1.9],
  piccolo: [74, 102, 1, 0.03, 0.12, 1.8], flute: [60, 96, 1, 0.04, 0.15, 3.0], recorder: [60, 91, 1, 0.03, 0.1, 2.2], pan_flute: [60, 91, 1, 0.04, 0.2, 2.4],
  blown_bottle: [60, 84, 1, 0.06, 0.2, 2.2], shakuhachi: [55, 84, 1, 0.05, 0.2, 2.4], whistle: [72, 100, 1, 0.02, 0.1, 2.45], ocarina: [60, 88, 1, 0.03, 0.12, 2.4], shanai: [60, 84, 1, 0.03, 0.12, 1.6],
  bird_tweet: [72, 96, 0, 0.002, 0.2, 0.6],
  perc_organ: [36, 84, 1, 0.005, 0.08, 1.6], reed_organ: [36, 84, 1, 0.05, 0.2, 1.7], tango_accordion: [48, 84, 1, 0.02, 0.1, 1.9], guitar_harmonics: [52, 96, 0, 0.002, 0.6, 1.3],
  synth_strings: [36, 88, 1, 0.2, 0.5, 1.3], synth_brass: [36, 84, 1, 0.01, 0.15, 1.8], calliope: [55, 91, 1, 0.02, 0.1, 2.7], charang: [48, 88, 1, 0.005, 0.15, 2.8],
  pad_warm: [36, 84, 1, 0.4, 0.8, 1.5], pad_choir: [40, 84, 1, 0.3, 0.8, 1.75], pad_bowed: [40, 84, 1, 0.3, 0.8, 1.3], pad_halo: [40, 88, 1, 0.4, 1, 1.8], pad_sweep: [40, 84, 1, 0.3, 0.8, 1.4],
  fx_rain: [48, 84, 1, 0.3, 0.8, 1], fx_crystal: [60, 96, 0, 0.002, 0.8, 2], fx_atmosphere: [40, 84, 1, 0.2, 0.8, 1.4], fx_goblins: [48, 72, 1, 0.1, 0.5, 1], fx_echoes: [48, 84, 1, 0.05, 0.8, 1.35], fx_scifi: [48, 84, 0, 0.01, 0.5, 1.45],
  breath_noise: [0, 127, 1, 0.3, 0.6, 1.25], seashore: [0, 127, 1, 0.8, 1.5, 0.9], helicopter: [0, 127, 1, 0.6, 1, 1.05], applause: [0, 127, 1, 0.4, 1.2, 0.9],
  gunshot: [0, 127, 0, 0.001, 0.2, 0.8], woodblock: [0, 127, 0, 0.001, 0.05, 2.5], orchkit: [0, 127, 0, 0.001, 0.3, 1.2], drumkit: [0, 127, 0, 0.001, 0.1, 1], taiko: [0, 127, 0, 0.001, 0.3, 1.3]
};
const fold = (m, lo, hi) => { while (m < lo) m += 12; while (m > hi) m -= 12; return m < lo ? m + 12 : m; };
const SMP_LEVEL = 0.5;            // samples are level-matched in the pack; this sets them against the synth parts
Object.assign(Band, {
  // play a recorded note; false means it isn't loaded (yet), so the caller falls back to its synth voice
  sample(name, m, t, out, dur, v = 1, o = {}) {
    const I = SMP.inst[name]; if (I === undefined) { smpLoad(name); return false; } if (!I) return false;
    const P = PROF[name] ?? [0, 127, 0, 0.003, 0.2, 1];
    if (!o.raw) m = fold(Math.round(m), P[0], P[1]);
    let best = I.notes[0]; for (const n of I.notes) if (Math.abs(n[0] - m) < Math.abs(best[0] - m)) best = n;
    const [n0, buf, lead] = best, c = this.ctx, s = c.createBufferSource(), g = c.createGain(), rate = Math.pow(2, (m - n0) / 12);
    s.buffer = buf;
    if (o.from != null && o.from !== m) { s.playbackRate.setValueAtTime(rate * Math.pow(2, (fold(o.from, P[0], P[1]) - m) / 12), t); s.playbackRate.exponentialRampToValueAtTime(rate, t + (o.glide ?? 0.07)); }
    else s.playbackRate.value = rate;
    const att = o.att ?? P[3], rel = o.rel ?? P[4], natural = (buf.duration - lead) / rate;
    const sus = o.sus ?? !!P[2], hum = o.exact ? 0 : Math.random() * 0.006;                 // a hair of human looseness
    t += hum; v *= o.exact ? 1 : 0.94 + Math.random() * 0.12;
    let len = sus ? Math.max(0.05, dur) : Math.max(0.05, Math.min(natural, o.ring ?? Math.max(dur, 0.1)));
    if (sus && len > natural - 0.35 && buf.duration > 1.4) { s.loop = true; s.loopStart = Math.min(0.7, buf.duration * 0.3); s.loopEnd = buf.duration - 0.3; }
    else len = Math.min(len, natural);
    const peak = Math.max(0.0002, v * P[5] * I.gain * SMP_LEVEL * (o.gain ?? 1));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + att);
    if (o.swell) g.gain.linearRampToValueAtTime(peak * o.swell, t + Math.max(att, len));
    else g.gain.setValueAtTime(peak, t + Math.max(att, len));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(att, len) + rel);
    let n = s; if (o.lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; n = s.connect(f); }
    n.connect(g).connect(out); s.start(t, lead); s.stop(t + Math.max(att, len) + rel + 0.05); return true;
  },
  // an instrument by name: the recording if it's here, otherwise the closest synth voice
  inst(name, m, t, out, dur, v = 1, o = {}) { if (this.sample(name, m, t, out, dur, v, o)) return; (SYN_FB[name] ?? SYN_FB._)(this, m, t, out, dur, v, o); },
  gk() { try { return bandView().song.genre; } catch { return "pop"; } }
});
// the original synth voices, kept as the fallback
const SYN = Object.fromEntries(["piano", "saloon", "musicbox", "shimmer", "organ", "strings", "brass", "sax", "harp", "choir", "flute", "clarinet", "ocarina", "whistle", "accordion", "bass", "pluck", "drum", "perc", "crash", "bird", "bell"].map(k => [k, Band[k]]));
const SYN_FB = {
  _: () => {},                                                          // no close synth match: stay quiet for the moment it takes to load, rather than play a piano
  flute: (B, m, t, out, d, v) => SYN.flute.call(B, m, t, out, d, v), clarinet: (B, m, t, out, d, v) => SYN.clarinet.call(B, m, t, out, d, v), ocarina: (B, m, t, out, d, v) => SYN.ocarina.call(B, m, t, out, d, v),
  accordion: (B, m, t, out, d, v) => SYN.accordion.call(B, m, t, out, d, v), harmonica: (B, m, t, out, d, v) => SYN.harp.call(B, m, t, out, d, v),
  strings: (B, m, t, out, d, v) => SYN.strings.call(B, m, t, out, d, v), brass: (B, m, t, out, d, v) => SYN.brass.call(B, m, t, out, d, v), alto_sax: (B, m, t, out, d, v) => SYN.sax.call(B, m, t, out, d, v),
  choir_aahs: (B, m, t, out, d, v) => SYN.choir.call(B, m, t, out, d, v, "ah"), voice_oohs: (B, m, t, out, d, v) => SYN.choir.call(B, m, t, out, d, v, "oo"),
  bass_finger: (B, m, t, out, d, v) => SYN.bass.call(B, m, t, out, d, v, "finger"), guitar_clean: (B, m, t, out, d, v) => SYN.pluck.call(B, m, t, out, v, d, "clean"),
  drawbar_organ: (B, m, t, out, d, v) => SYN.organ.call(B, m, t, out, d, v)
};
for (const [k, a] of Object.entries({ piccolo: "flute", recorder: "flute", pan_flute: "flute", blown_bottle: "ocarina", shakuhachi: "flute", whistle: "flute", oboe: "clarinet", english_horn: "clarinet", bassoon: "clarinet", shanai: "clarinet", bagpipe: "accordion",
  soprano_sax: "alto_sax", tenor_sax: "alto_sax", bari_sax: "alto_sax", trumpet: "brass", muted_trumpet: "brass", trombone: "brass", tuba: "brass", french_horn: "brass",
  violin: "strings", viola: "strings", cello: "strings", contrabass: "strings", tremolo_strings: "strings", fiddle: "strings", strings_slow: "strings", synth_voice: "choir_aahs",
  rock_organ: "drawbar_organ", church_organ: "drawbar_organ", bass_acoustic: "bass_finger", bass_pick: "bass_finger", bass_slap: "bass_finger", bass_fretless: "bass_finger", bass_synth: "bass_finger",
  guitar_nylon: "guitar_clean", guitar_steel: "guitar_clean", guitar_jazz: "guitar_clean", guitar_muted: "guitar_clean", guitar_overdrive: "guitar_clean", guitar_distortion: "guitar_clean",
  banjo: "guitar_clean", sitar: "guitar_clean", koto: "guitar_clean", shamisen: "guitar_clean", pizzicato: "guitar_clean", harp: "guitar_clean", dulcimer: "guitar_clean", kalimba: "guitar_clean" })) SYN_FB[k] = SYN_FB[a];

// ---- the old voices now reach for the real instrument first
const ORG = { rock: "rock_organ", funk: "rock_organ", blues: "rock_organ", epic: "church_organ" };
const BASS_S = { finger: "bass_finger", pick: "bass_pick", slap: "bass_slap", upright: "bass_acoustic", synth: "bass_synth", dub: "bass_finger" };
const ELECTRO = new Set(["electro", "909"]);
Object.assign(Band, {
  piano(m, t, out, v = 1, dur = 1.4) { if (!this.sample("grand_piano", m, t, out, dur, v, { ring: Math.max(0.6, dur * 1.5) })) SYN.piano.call(this, m, t, out, v, dur); },
  saloon(m, t, out, v = 1, dur = 0.8) { if (!this.sample("honkytonk", m, t, out, dur, v, { ring: Math.max(0.4, dur * 1.4) })) SYN.saloon.call(this, m, t, out, v, dur); },
  musicbox(m, t, out, v = 1) { if (!this.sample("music_box", m, t, out, 1.4, v)) SYN.musicbox.call(this, m, t, out, v); },
  shimmer(m, t, out, v = 1) { if (!this.sample("celesta", m, t, out, 1.6, v * 0.8)) SYN.shimmer.call(this, m, t, out, v); },
  organ(m, t, out, dur, v = 1, att = 0.008) { if (!this.sample(ORG[this.gk()] ?? "drawbar_organ", m, t, out, dur, v, { att: Math.max(0.008, att) })) SYN.organ.call(this, m, t, out, dur, v, att); },
  strings(m, t, out, dur, v = 1, att = 0.25) { if (!this.sample(att > 0.3 ? "strings_slow" : "strings", m, t, out, dur, v, { att: Math.max(0.04, att) })) SYN.strings.call(this, m, t, out, dur, v, att); },
  brass(m, t, out, dur, v = 1, att = 0.03) { if (!this.sample("brass", m, t, out, dur, v, { att: Math.max(0.02, att), swell: att > 0.3 ? 1.3 : 0 })) SYN.brass.call(this, m, t, out, dur, v, att); },
  sax(m, t, out, dur, v = 1) { if (!this.sample(m < 58 ? "tenor_sax" : "alto_sax", m, t, out, dur, v)) SYN.sax.call(this, m, t, out, dur, v); },
  harp(m, t, out, dur, v = 1, bend = false) { if (!this.sample("harmonica", m, t, out, dur, v, bend ? { from: m - 1, glide: 0.15 } : {})) SYN.harp.call(this, m, t, out, dur, v, bend); },
  choir(m, t, out, dur, v = 1, vowel = "ah", att = 0.2) { if (!this.sample(vowel === "oo" ? "voice_oohs" : "choir_aahs", m, t, out, dur, v, { att: Math.max(0.03, att) })) SYN.choir.call(this, m, t, out, dur, v, vowel, att); },
  flute(m, t, out, dur, v = 1) { if (!this.sample("flute", m, t, out, dur, v)) SYN.flute.call(this, m, t, out, dur, v); },
  clarinet(m, t, out, dur, v = 1) { if (!this.sample("clarinet", m, t, out, dur, v)) SYN.clarinet.call(this, m, t, out, dur, v); },
  ocarina(m, t, out, dur, v = 1) { if (!this.sample("ocarina", m, t, out, dur, v)) SYN.ocarina.call(this, m, t, out, dur, v); },
  whistle(m, t, out, dur, v = 1, from = null) { if (!this.sample("whistle", m + 12, t, out, dur, v, from ? { from: from + 12 } : {})) SYN.whistle.call(this, m, t, out, dur, v, from); },
  accordion(m, t, out, dur, v = 1) { if (!this.sample("accordion", m, t, out, dur, v)) SYN.accordion.call(this, m, t, out, dur, v); },
  bass(m, t, out, dur, v = 1, tone = "finger") { if (!this.sample(BASS_S[tone] ?? "bass_finger", m, t, out, dur, v, { lp: tone === "dub" ? 700 : 0, sus: true, rel: 0.06 })) SYN.bass.call(this, m, t, out, dur, v, tone); },
  pluck(m, t, out, v = 1, dur = 1.6, tone = "clean") {
    const g = this.gk(), name = { clean: g === "jazz" ? "guitar_jazz" : "guitar_clean", drive: g === "rock" ? "guitar_distortion" : "guitar_overdrive", nylon: "guitar_nylon", lute: "guitar_nylon", muted: "guitar_muted", banjo: "banjo" }[tone] ?? "guitar_clean";
    if (!this.sample(name, m, t, out, dur, v, { ring: dur })) SYN.pluck.call(this, m, t, out, v, dur, tone);
  },
  drum(r, t, v, K, out) {
    if (!K || ELECTRO.has(Object.keys(KITS).find(k => KITS[k] === K))) return SYN.drum.call(this, r, t, v, K, out);
    const tk = !!K.taiko;
    if (tk && [0, 5, 6].includes(r)) { if (this.sample("taiko", r === 0 ? 36 : r === 5 ? 41 : 52, t, out, 2, v, { raw: true, exact: true })) return; return SYN.drum.call(this, r, t, v, K, out); }
    if (K.sn === "brush" && r === 1) return SYN.drum.call(this, r, t, v, K, out);
    const note = [36, K.sn === "rim" ? 37 : 38, 42, 46, 39, 45, 48, 51][r], lift = [3, 1, 0.5, 0.6, 0.45, 2.7, 2.7, 0.8][r];
    if (!this.sample("drumkit", note, t, out, 2, v * lift, { raw: true, exact: true, ring: r === 3 ? 0.5 : 2 })) SYN.drum.call(this, r, t, v, K, out);
  },
  crash(t, out) { if (ELECTRO.has(GEN[this.gk()]?.kit) || !this.sample("drumkit", 49, t, out, 2, 0.7, { raw: true, exact: true })) SYN.crash.call(this, t, out); },
  perc(r, t, v, out) { if (!this.sample("drumkit", [64, 63, 60, 70, 54, 56, 75, 81][r], t, out, 2, v * [1.3, 1.3, 1.3, 1, 1, 0.9, 1, 0.8][r], { raw: true, exact: true })) SYN.perc.call(this, r, t, v, out); },
  bird(t, out, v = 1) { if (!this.sample("bird_tweet", 84 + Math.floor(Math.random() * 5), t, out, 0.6, v)) SYN.bird.call(this, t, out, v); },
  bell(t, out, v = 1) { if (!this.sample("glockenspiel", 84, t, out, 1, v)) SYN.bell.call(this, t, out, v); }
});
// the old strings part plucked a guitar for pizzicato; give it the real thing
PARTS_B.strings = function (cx) {
  if (cx.v === 0) { if (cx.i) return false; for (const m of [regRoot(cx.ch[0], 43), ...voice(cx.ch, 62)]) cx.B.strings(m, cx.t, cx.out, cx.STEP * 15.5, 0.8, 0.35); return true; }
  if (cx.v === 1) { if (cx.i % 2) return false; const vc = voice(cx.ch, 60), seq = [0, 2, 1, 2, 0, 2, 1, 2]; cx.B.inst("pizzicato", vc[seq[cx.i / 2] % vc.length], cx.t, cx.out, 0.4, cx.i % 8 ? 0.6 : 0.9); return true; }
  return mel(cx, "D", "strings", 0, { att: 0.15 });
};

// ---- the cast and what each can play
const melOn = (cx, which, fn, shift = 0) => { const n = MELS(cx.G, cx.V.song.gk ?? cx.V.song.genre)[which].get(cx.s); if (!n) return false; fn(n[0] + cx.tr + shift, n[1] * cx.STEP * 0.95, n[2]); return true; };
const P = (inst, v) => (cx) => PARTS_B[inst]({ ...cx, v, k: inst });
const drumsAs = (cx, v, voiceFn) => { const Pt = cx.G.drums[v]; let hit = false; DK.forEach((key, r) => { const c = PCH(Pt[key], cx.s); if (c !== "." && VEL[c]) { voiceFn(r, VEL[c]); hit = true; } }); return hit; };
const scaleNotes = (cx, lo, count) => { const t0 = regRoot(cx.G.tonic + cx.tr, lo), out = []; for (let o = 0; out.length < count; o += 12) for (const iv of cx.G.scale) if (out.length < count) out.push(t0 + o + iv); return out; };
const pat = (str, cx) => PCH(str, cx.s);
let lastWhistle = null, lastTheremin = null;

// ---- ways to play any instrument; each remembers which recordings it needs so they can load ahead of time
const tag = (fn, ...names) => (fn.smp = names, fn);
const I_ = (cx, name, m, d, v, o = {}) => cx.B.inst(name, m, cx.t, cx.out, d, v, o);
const LM = (name, which = "A", shift = 0, o = {}) => tag((cx) => melOn(cx, which, (m, d, v) => I_(cx, name, m, d, v * (o.v ?? 1), o), shift), name);
const LPad = (name, center = 60, o = {}) => tag((cx) => { if (cx.i || (o.two && cx.bar % 2)) return false; const d = cx.STEP * (o.two ? 31.5 : 15.5);
  for (const m of voice(cx.ch, center)) I_(cx, name, m, d, o.v ?? 0.6, o); if (o.root) I_(cx, name, regRoot(cx.ch[0], o.root), d, o.v ?? 0.6, o); return true; }, name);
const LComp = (name, center = 62, key = "comp", o = {}) => tag((cx) => { const str = cx.G[key] ?? cx.G.comp, c = PCH(str, cx.s); if (".-".includes(c)) return false;
  const len = c === "s" ? 1 : Math.min(o.max ?? 4, gapSteps(str, cx.s, o.max ?? 4)); for (const m of voice(cx.ch, center)) I_(cx, name, m, len * cx.STEP * 0.92, (VEL[c] ?? 1) * (o.v ?? 0.7), o); return true; }, name);
const LArp = (name, center = 64, o = {}) => tag((cx) => { const ev = o.every ?? 2; if (cx.i % ev) return false; const vc = voice(cx.ch, center), seq = [...vc, vc[0] + 12, ...vc.slice(1).reverse()];
  I_(cx, name, seq[(cx.i / ev) % seq.length], cx.STEP * ev * (o.len ?? 1.6), (cx.i % 4 ? 0.55 : 0.8) * (o.v ?? 1), o); return true; }, name);
const LStrum = (name, o = {}) => tag((cx) => { const str = cx.G.strum, c = PCH(str, cx.s); if (".-".includes(c)) return false;
  const vc = gvoice(cx.ch), notes = c === "u" ? vc.slice(-4).reverse() : vc, len = c === "s" ? cx.STEP * 0.9 : Math.min(8, gapSteps(str, cx.s)) * cx.STEP * 1.1;
  notes.forEach((m, k) => cx.B.inst(name, m, cx.t + k * 0.013, cx.out, len, (VEL[c] ?? 1) * (o.v ?? 0.45), { ...o, ring: len, raw: true })); return true; }, name);
const LBass = (name, walk = false, o = {}) => tag((cx) => {
  if (walk) { if (cx.i % 4) return false; const q = cx.i / 4, b = regRoot(cx.ch[0], 40), nb = regRoot(cx.nch[0], 40); I_(cx, name, [b, b + third(cx.ch), b + 7, nb - 1][q], cx.STEP * 3.6, (q ? 0.85 : 1) * (o.v ?? 1), o); return true; }
  const str = o.str ?? cx.G.bass, c = PCH(str, cx.s); if (c === "." || !"rfo3765a".includes(c)) return false;
  I_(cx, name, bassNote(cx, c), Math.min(o.max ?? 16, holdSteps(str, cx.s)) * cx.STEP * 0.92, (VEL[c] ?? 1) * (o.v ?? 1), o); return true; }, name);
const LRoll = (name, o = {}) => tag((cx) => { if (cx.i % 2) return false; const vc = gvoice(cx.ch), roll = [2, 3, 4, 2, 3, 4, 2, 3]; I_(cx, name, vc[roll[cx.i / 2] % vc.length] + 12, 0.5, cx.i % 4 ? 0.45 : 0.65, o); return true; }, name);
const LDrone = (name, lo = 45, o = {}) => tag((cx) => { if (cx.i || cx.bar % 2) return false; const r = regRoot(cx.ch[0], lo); for (const m of [r, r + 7]) I_(cx, name, m, cx.STEP * 31.5, o.v ?? 0.5, o); return true; }, name);
const both = (...fns) => tag((cx) => fns.reduce((h, f) => f(cx) || h, false), ...fns.flatMap(f => f.smp ?? []));
const timp = tag((cx) => { const r = regRoot(cx.ch[0], 40);
  if (cx.i === 0) { I_(cx, "timpani", r, 1, 1); return true; } if (cx.i === 8) { I_(cx, "timpani", r + 7 > 55 ? r - 5 : r + 7, 1, 0.75); return true; }
  if (cx.bar % 2 && cx.i >= 12) { I_(cx, "timpani", r, 0.3, 0.35 + (cx.i - 12) * 0.15); return true; } return false; }, "timpani");
const warDrums = tag((cx) => { const c = PCH("x..x..x.x.x.xx.X", cx.s); if (c === ".") return false; cx.B.drum(cx.i % 8 === 0 ? 5 : cx.i > 12 ? 6 : 0, cx.t, VEL[c] ?? 1, KITS.taiko, cx.out); return true; }, "taiko");
const orchHit = tag((cx) => { const c = PCH(cx.G.stab ?? "x.....x.x.......", cx.s); if (".-".includes(c)) return false; const r = regRoot(cx.ch[0], 55); for (const m of [r, r + 7]) I_(cx, "orchestra_hit", m, 0.5, 0.75); return true; }, "orchestra_hit");
const powerChords = tag((cx) => { if (cx.i % 2) return false; const r = regRoot(cx.ch[0], 40), acc = cx.i === 0 || cx.i === 8 || cx.i === 14; for (const m of [r, r + 7, r + 12]) cx.B.inst("guitar_distortion", m, cx.t, cx.out, cx.STEP * (acc ? 3 : 0.8), acc ? 0.8 : 0.5, { raw: true }); return true; }, "guitar_distortion");
const boogie = tag((cx) => { if (cx.i % 2) return false; const r = regRoot(cx.ch[0], 36), iv = [0, 4, 7, 9, 10, 9, 7, 4][cx.i / 2]; cx.B.piano(r + (iv === 4 ? third(cx.ch) : iv), cx.t, cx.out, cx.i % 4 ? 0.55 : 0.75, cx.STEP * 1.8); return true; }, "grand_piano");
const rolling = tag((cx) => { const vc = voice(cx.ch, 60), seq = [regRoot(cx.ch[0], 43), vc[0], vc[1], vc[2], vc[0] + 12, vc[2], vc[1], vc[0]]; cx.B.piano(seq[cx.i % 8] + (cx.i >= 8 && cx.i % 8 ? 12 : 0), cx.t, cx.out, cx.i % 8 ? 0.45 : 0.7, cx.STEP * 3); return true; }, "grand_piano");
const octaves = tag((cx) => { const c = PCH("x..x..x.x..x..x.", cx.s); if (c === ".") return false; const r = regRoot(cx.ch[0], 36); cx.B.piano(r, cx.t, cx.out, 0.75, cx.STEP * 2); cx.B.piano(r + 12, cx.t, cx.out, 0.6, cx.STEP * 2); if (cx.i === 0 || cx.i === 8) for (const m of voice(cx.ch, 64)) cx.B.piano(m, cx.t, cx.out, 0.6, cx.STEP * 3); return true; }, "grand_piano");
const tuba = tag((cx) => { if (cx.i % 4) return false; const r = regRoot(cx.ch[0], 33); I_(cx, "tuba", cx.i % 8 ? r + 7 : r, cx.STEP * 1.6, cx.i ? 0.8 : 1); return true; }, "tuba");
const bottle = tag((cx) => { const c = PCH("x...x.x.x...x.x.", cx.s); if (c === ".") return false; const r = regRoot(cx.ch[0], 60); I_(cx, "blown_bottle", cx.i % 8 === 6 ? r + 7 : r, cx.STEP * 1.4, 0.8); return true; }, "blown_bottle");
const bells = tag((cx) => { if (cx.i % 8 || (cx.bar % 2 && cx.i)) return false; const vc = voice(cx.ch, 67); I_(cx, "tubular_bells", cx.i ? vc[1] : regRoot(cx.ch[0], 60), 3, 0.7); return true; }, "tubular_bells");
const ride = (cx, v = 0.6) => { if (cx.i % 4 === 0 || cx.i % 4 === 3) cx.B.sample("drumkit", 51, cx.t, cx.out, 2, cx.i % 4 ? v * 0.6 : v, { raw: true, exact: true }); };
const withKit = (kit) => (cx) => { const G = { ...cx.G, kit: kit(cx.G.kit) }; return PARTS_B.drums({ ...cx, G, v: 0, k: "drums" }); };

const CAST = [
  { k: "ollie", name: "Ollie", find: ["Oleander", "Ollie"], inst: "Winds", color: "#e874a6", groove: "sway", pan: -0.35, mix: 0.75, rev: 0.32, dly: 0.35, lo: 64, loops: [
    { fam: "Flutes & whistles", id: "flute", icon: "🌬️", label: "Flute tune", play: tag((cx) => melOn(cx, "A", (m, d, v) => cx.B.flute(m, cx.t, cx.out, d, v)), "flute") },
    { fam: "Flutes & whistles", id: "piccolo", icon: "🐦", label: "Piccolo", play: LM("piccolo", "C", 12, { v: 0.8 }) },
    { fam: "Flutes & whistles", id: "recorder", icon: "🎶", label: "Recorder", play: LM("recorder", "B") },
    { fam: "Flutes & whistles", id: "pipes", icon: "✨", label: "Pan pipes", play: tag((cx) => { if (cx.i % 2) return false; const vc = voice(cx.ch, 74), seq = [0, 1, 2, 1, 0, 2, 1, 2]; I_(cx, "pan_flute", vc[seq[cx.i / 2] % vc.length], cx.STEP * 1.6, cx.i % 4 ? 0.55 : 0.8); return true; }, "pan_flute") },
    { fam: "Flutes & whistles", id: "ocarina", icon: "🥚", label: "Ocarina", play: tag((cx) => melOn(cx, "B", (m, d, v) => cx.B.ocarina(m - 12, cx.t, cx.out, d, v)), "ocarina") },
    { fam: "Flutes & whistles", id: "whistle", icon: "😗", label: "Tin whistle", play: tag((cx) => melOn(cx, "C", (m, d, v) => { cx.B.whistle(m, cx.t, cx.out, Math.min(d, cx.STEP * 2), v, lastWhistle); lastWhistle = m; }), "whistle") },
    { fam: "Flutes & whistles", id: "shaku", icon: "🎋", label: "Shakuhachi", play: LM("shakuhachi", "D") },
    { fam: "Flutes & whistles", id: "bottle", icon: "🍾", label: "Jug bottle", play: bottle },
    { fam: "Flutes & whistles", id: "breath", icon: "🍃", label: "Breath pad", play: tag((cx) => { if (cx.i) return false; for (const m of voice(cx.ch, 72).slice(-2)) cx.B.flute(m, cx.t, cx.out, cx.STEP * 15, 0.45); return true; }, "flute") },
    { fam: "Reeds", id: "clarinet", icon: "🎵", label: "Clarinet", play: tag((cx) => melOn(cx, "D", (m, d, v) => cx.B.clarinet(m, cx.t, cx.out, d, v)), "clarinet") },
    { fam: "Reeds", id: "oboe", icon: "🦢", label: "Oboe", play: LM("oboe", "B") },
    { fam: "Reeds", id: "ehorn", icon: "🌒", label: "English horn", play: LM("english_horn", "D", -12) },
    { fam: "Reeds", id: "bassoon", icon: "🐸", label: "Bassoon bass", play: LBass("bassoon", false, { max: 3 }) },
    { fam: "Saxophones", id: "sax", icon: "🎷", label: "Sax melody", play: tag(P("sax", 0), "alto_sax", "tenor_sax") },
    { fam: "Saxophones", id: "saxsolo", icon: "🔥", label: "Sax solo", play: tag(P("sax", 2), "alto_sax", "tenor_sax") },
    { fam: "Saxophones", id: "soprano", icon: "🐍", label: "Soprano sax", play: LM("soprano_sax", "C") },
    { fam: "Saxophones", id: "bari", icon: "🐻", label: "Bari sax riff", play: LBass("bari_sax", false, { max: 3 }) },
    { fam: "Horns", id: "trumpet", icon: "🎺", label: "Trumpet", play: LM("trumpet", "A") },
    { fam: "Horns", id: "muted", icon: "🌃", label: "Muted trumpet", play: LM("muted_trumpet", "B") },
    { fam: "Folk & magic", id: "harp", icon: "🌵", label: "Harmonica", play: tag(P("harmonica", 1), "harmonica") },
    { fam: "Folk & magic", id: "bagpipe", icon: "🏴", label: "Bagpipes", play: both(LDrone("bagpipe", 45, { v: 0.35 }), LM("bagpipe", "A")) },
    { fam: "Folk & magic", id: "shanai", icon: "🐫", label: "Shehnai", play: LM("shanai", "C") },
    { fam: "Folk & magic", id: "didge", icon: "🪵", label: "Didgeridoo", play: (cx) => { if (cx.i % 8) return false; cx.B.didge(regRoot(cx.ch[0], 36), cx.t, cx.out, cx.STEP * 7.6, cx.i ? 0.7 : 1); return true; } },
    { fam: "Folk & magic", id: "shimmer", icon: "💫", label: "Lightbearer shimmer", play: tag((cx) => { if (cx.i % 4 && cx.i % 4 !== 3) return false; const vc = voice(cx.ch, 86); cx.B.shimmer(vc[(cx.i + cx.bar) % vc.length], cx.t, cx.out, cx.i % 4 ? 0.5 : 0.8); return true; }, "celesta") }
  ] },
  { k: "quickare", name: "Quickare", find: ["Quickare"], inst: "Piano & trick shots", color: "#e8a64a", groove: "tilt", pan: 0.15, mix: 0.85, rev: 0.28, dly: 0.1, lo: 55, loops: [
    { fam: "Grand piano", id: "chords", icon: "🎹", label: "Chords", play: tag(P("piano", 0), "grand_piano") },
    { fam: "Grand piano", id: "rhythm", icon: "🎶", label: "Rhythm", play: tag(P("piano", 1), "grand_piano") },
    { fam: "Grand piano", id: "melody", icon: "🎵", label: "Melody", play: tag(P("piano", 2), "grand_piano") },
    { fam: "Grand piano", id: "ballad", icon: "🌙", label: "Ballad", play: tag((cx) => { let hit = false;
      if (cx.i === 0) { cx.B.piano(regRoot(cx.ch[0], 36), cx.t, cx.out, 0.7, 2); for (const m of voice(cx.ch, 60)) cx.B.piano(m, cx.t, cx.out, 0.5, 2); hit = true; }
      return melOn(cx, "D", (m, d, v) => cx.B.piano(m + 12, cx.t, cx.out, 0.7 * v, d)) || hit; }, "grand_piano") },
    { fam: "Grand piano", id: "arpeg", icon: "🌊", label: "Rolling arpeggios", play: rolling },
    { fam: "Grand piano", id: "octaves", icon: "🏛️", label: "Big octaves", play: octaves },
    { fam: "Grand piano", id: "boogie", icon: "🕺", label: "Boogie-woogie", play: boogie },
    { fam: "Grand piano", id: "sparkle", icon: "✨", label: "Sparkle", play: tag((cx) => { if (cx.i % 2) return false; const vc = voice(cx.ch, 79), seq = [...vc, vc[1] + 12, ...vc.slice().reverse()]; cx.B.piano(seq[(cx.i / 2) % seq.length], cx.t, cx.out, 0.38, 0.7); return true; }, "grand_piano") },
    { fam: "Saloon & parlor", id: "stride", icon: "🤠", label: "Saloon stride", play: tag((cx) => { const i = cx.i; if (i % 4) return false;
      if (i % 8 === 0) { cx.B.saloon(regRoot(cx.ch[0], 36) + (i === 8 ? 7 : 0), cx.t, cx.out, 0.85, 0.5); return true; }
      for (const m of voice(cx.ch, 62)) cx.B.saloon(m, cx.t, cx.out, 0.6, 0.35); return true; }, "honkytonk") },
    { fam: "Saloon & parlor", id: "honky", icon: "🥃", label: "Out-of-tune saloon", play: tag((cx) => { const c = pat(cx.G.comp, cx); if (".-".includes(c)) return false; for (const m of voice(cx.ch, 64)) cx.B.saloon(m, cx.t, cx.out, 0.6, c === "s" ? 0.2 : 0.6); return true; }, "honkytonk") },
    { fam: "Saloon & parlor", id: "harpsi", icon: "👑", label: "Harpsichord", play: LArp("harpsichord", 60, { every: 1, len: 2 }) },
    { fam: "Electric", id: "rhodes", icon: "🌆", label: "Electric piano", play: LComp("epiano", 62, "comp", { v: 0.75 }) },
    { fam: "Electric", id: "clav", icon: "🦆", label: "Funky clavinet", play: LComp("clavinet", 60, "comp", { max: 2 }) },
    { fam: "Bells & boxes", id: "musicbox", icon: "🎁", label: "Music box", play: tag((cx) => melOn(cx, "A", (m, d, v) => cx.B.musicbox(m + 12, cx.t, cx.out, v)), "music_box") },
    { fam: "Bells & boxes", id: "celesta", icon: "❄️", label: "Celesta", play: LM("celesta", "B", 12) },
    { fam: "Trick shots", id: "trick", icon: "🔫", label: "Trick Shots", play: (cx) => {
      const r = { 0: cx.bar % 2 ? 0 : 5, 4: 1, 6: 3, 10: 1, 12: 4, 14: cx.bar % 2 ? 2 : -1 }[cx.i]; if (r === undefined || r < 0) return false; cx.B.shot(r, cx.t, cx.out, 0.9); return true; } }
  ] },
  { k: "triton", name: "Captain Triton", find: ["Captain Triton", "Triton"], inst: "Keytar & everything", color: "#4fb6e8", groove: "headbang", pan: 0, mix: 0.75, rev: 0.3, dly: 0.6, lo: 60, two: true, loops: [
    { slot: 1, fam: "Keytar", id: "lead", icon: "⚡", label: "Keytar lead", play: P("keytar", 0) },
    { slot: 1, fam: "Keytar", id: "arp", icon: "🌀", label: "Keytar arpeggio", play: P("keytar", 1) },
    { slot: 1, fam: "Keytar", id: "shred", icon: "🔥", label: "Keytar shred", play: P("keytar", 2) },
    { slot: 1, fam: "Keytar", id: "talk", icon: "🗣️", label: "Talk-box keytar", play: (cx) => melOn(cx, "A", (m, d, v) => cx.B.talkbox(m, cx.t, cx.out, d, v)) },
    { slot: 2, fam: "Strings", id: "strings", icon: "🏰", label: "String section", play: tag(P("strings", 0), "strings_slow") },
    { slot: 2, fam: "Strings", id: "violin", icon: "🎻", label: "Violin melody", play: LM("violin", "A") },
    { slot: 2, fam: "Strings", id: "viola", icon: "🪕", label: "Viola", play: LM("viola", "D", -12) },
    { slot: 2, fam: "Strings", id: "cello", icon: "🐋", label: "Cello", play: LM("cello", "B", -12) },
    { slot: 2, fam: "Strings", id: "contra", icon: "🗿", label: "Contrabass", play: LBass("contrabass", false, { str: "r-------r-------" }) },
    { slot: 2, fam: "Strings", id: "tremolo", icon: "⛈️", label: "Tremolo strings", play: LPad("tremolo_strings", 60, { root: 43, v: 0.55 }) },
    { slot: 2, fam: "Strings", id: "pizz", icon: "🐾", label: "Pizzicato", play: LArp("pizzicato", 60, { len: 1 }) },
    { slot: 2, fam: "Strings", id: "orchharp", icon: "🪽", label: "Harp", play: LArp("harp", 60, { every: 1, len: 3, v: 0.8 }) },
    { slot: 2, fam: "Strings", id: "fiddle", icon: "🌾", label: "Fiddle", play: LM("fiddle", "C") },
    { slot: 2, fam: "Brass & drums", id: "brass", icon: "🎺", label: "Brass section", play: tag(P("brass", 0), "brass") },
    { slot: 2, fam: "Brass & drums", id: "horn", icon: "📯", label: "French horns", play: LM("french_horn", "D", -12) },
    { slot: 2, fam: "Brass & drums", id: "trombone", icon: "🦬", label: "Trombone stabs", play: LComp("trombone", 52, "stab", { max: 2, v: 0.8 }) },
    { slot: 2, fam: "Brass & drums", id: "tuba", icon: "🐘", label: "Oom-pah tuba", play: tuba },
    { slot: 2, fam: "Brass & drums", id: "timpani", icon: "🥁", label: "Timpani", play: timp },
    { slot: 2, fam: "Keys & mallets", id: "organ", icon: "⛪", label: "Organ", play: tag(P("organ", 1), "drawbar_organ", "rock_organ", "church_organ") },
    { slot: 2, fam: "Keys & mallets", id: "church", icon: "🕯️", label: "Cathedral organ", play: LPad("church_organ", 57, { root: 36, two: true, v: 0.5 }) },
    { slot: 2, fam: "Keys & mallets", id: "accordion", icon: "🪗", label: "Sea-shanty accordion", play: tag((cx) => { if (cx.i % 4) return false; if (cx.i % 8 === 0) { cx.B.accordion(regRoot(cx.ch[0], 45), cx.t, cx.out, cx.STEP * 2, 0.9); return true; } for (const m of voice(cx.ch, 64)) cx.B.accordion(m, cx.t, cx.out, cx.STEP * 1.6, 0.6); return true; }, "accordion") },
    { slot: 2, fam: "Keys & mallets", id: "marimba", icon: "🪵", label: "Marimba", play: LArp("marimba", 60) },
    { slot: 2, fam: "Keys & mallets", id: "vibes", icon: "🌫️", label: "Vibraphone", play: LComp("vibraphone", 64, "comp", { max: 6 }) },
    { slot: 2, fam: "Keys & mallets", id: "xylo", icon: "💀", label: "Xylophone", play: LM("xylophone", "B", 12) },
    { slot: 2, fam: "Keys & mallets", id: "glock", icon: "🌟", label: "Glockenspiel", play: LArp("glockenspiel", 79, { every: 4, len: 3, v: 0.8 }) },
    { slot: 2, fam: "Keys & mallets", id: "bells", icon: "🔔", label: "Tower bells", play: bells },
    { slot: 2, fam: "Keys & mallets", id: "kalimba", icon: "🫧", label: "Kalimba", play: LArp("kalimba", 64, { len: 2 }) },
    { slot: 2, fam: "Keys & mallets", id: "dulcimer", icon: "🎐", label: "Dulcimer", play: LArp("dulcimer", 64, { every: 1, len: 2, v: 0.7 }) },
    { slot: 2, fam: "Guitars & folk", id: "guitar", icon: "🎸", label: "Guitar", play: tag(P("guitar", 2), "guitar_clean", "guitar_overdrive", "guitar_nylon") },
    { slot: 2, fam: "Guitars & folk", id: "acoustic", icon: "🔥", label: "Campfire strum", play: LStrum("guitar_steel") },
    { slot: 2, fam: "Guitars & folk", id: "nylon", icon: "🌹", label: "Spanish guitar", play: LArp("guitar_nylon", 60, { every: 1, len: 3, v: 0.75 }) },
    { slot: 2, fam: "Guitars & folk", id: "jazzgtr", icon: "🎩", label: "Jazz guitar", play: LComp("guitar_jazz", 60, "comp", { max: 3 }) },
    { slot: 2, fam: "Guitars & folk", id: "power", icon: "🤘", label: "Power chords", play: powerChords },
    { slot: 2, fam: "Guitars & folk", id: "banjo", icon: "🪕", label: "Banjo", play: LRoll("banjo") },
    { slot: 2, fam: "Guitars & folk", id: "lute", icon: "🎼", label: "Lute", play: tag(P("lute", 0), "guitar_nylon") },
    { slot: 2, fam: "Guitars & folk", id: "sitar", icon: "🪷", label: "Sitar", play: LM("sitar", "B") },
    { slot: 2, fam: "Guitars & folk", id: "koto", icon: "🌸", label: "Koto", play: LArp("koto", 64, { len: 2 }) },
    { slot: 2, fam: "Guitars & folk", id: "shamisen", icon: "🏯", label: "Shamisen", play: LM("shamisen", "C") },
    { slot: 2, fam: "Bass", id: "bass", icon: "🔊", label: "Bass", play: tag(P("bass", 1), "bass_finger", "bass_pick", "bass_slap", "bass_acoustic", "bass_synth") },
    { slot: 2, fam: "Bass", id: "upright", icon: "🦒", label: "Upright bass", play: tag((cx) => { if (cx.i % 4) return false; const q = cx.i / 4, b = regRoot(cx.ch[0], 40), nb = regRoot(cx.nch[0], 40); cx.B.bass([b, b + third(cx.ch), b + 7, nb - 1][q], cx.t, cx.out, cx.STEP * 3.4, q ? 0.8 : 1, "upright"); return true; }, "bass_acoustic") },
    { slot: 2, fam: "Bass", id: "fretless", icon: "🌙", label: "Fretless bass", play: LBass("bass_fretless") },
    { slot: 2, fam: "Bass", id: "slap", icon: "👋", label: "Slap bass", play: LBass("bass_slap", false, { str: "r..r.or.r..ro.7." }) },
    { slot: 2, fam: "Bass", id: "synthbass", icon: "🎛️", label: "Synth bass", play: LBass("bass_synth") },
    { slot: 2, fam: "Oddities", id: "theremin", icon: "👻", label: "Theremin", play: (cx) => melOn(cx, "D", (m, d, v) => { cx.B.theremin(m + 12, cx.t, cx.out, d, v, lastTheremin); lastTheremin = m + 12; }) }
  ] },
  { k: "biggreen", name: "Big Green", find: ["Big Green"], inst: "Vocals & beast calls", color: "#6fcf5a", groove: "bounce", pan: -0.1, mix: 0.8, rev: 0.4, dly: 0.15, lo: 48, loops: [
    { fam: "Singing", id: "ooh", icon: "🎤", label: "Ooh", play: tag(P("choir", 0), "voice_oohs") },
    { fam: "Singing", id: "aah", icon: "😮", label: "Aah", play: tag(P("choir", 1), "choir_aahs") },
    { fam: "Singing", id: "chant", icon: "📣", label: "Chant", play: tag(P("choir", 2), "choir_aahs") },
    { fam: "Singing", id: "doo", icon: "🎙️", label: "Doo-wop", play: tag((cx) => melOn(cx, "B", (m, d, v) => cx.B.choir(m, cx.t, cx.out, Math.min(d, cx.STEP * 3), 0.8 * v, "oo", 0.02), -12), "voice_oohs") },
    { fam: "Singing", id: "lullaby", icon: "🌛", label: "Lullaby", play: LM("voice_oohs", "D", -12, { att: 0.08 }) },
    { fam: "Singing", id: "gospel", icon: "🙏", label: "Gospel stabs", play: LComp("choir_aahs", 62, "stab", { max: 3, att: 0.03 }) },
    { fam: "Singing", id: "opera", icon: "🎭", label: "Opera", play: tag((cx) => melOn(cx, "D", (m, d, v) => cx.B.choir(m, cx.t, cx.out, d, 1.1 * v, "ah", 0.06)), "choir_aahs") },
    { fam: "Singing", id: "ghost", icon: "🌀", label: "Ghost voice", play: LM("synth_voice", "A", 0, { v: 0.8 }) },
    { fam: "Singing", id: "hum", icon: "🍗", label: "Humming between bites", play: (cx) => melOn(cx, "A", (m, d, v) => cx.B.hum(m - 12, cx.t, cx.out, d, 0.9 * v)) },
    { fam: "Singing", id: "throat", icon: "🏔️", label: "Throat singing", play: (cx) => { if (cx.i) return false; cx.B.throat(regRoot(cx.ch[0], 36), cx.t, cx.out, cx.STEP * 15.5, 0.9); return true; } },
    { fam: "Mouth & body", id: "beatbox", icon: "👄", label: "Beatbox", play: (cx) => drumsAs(cx, 0, (r, v) => cx.B.beatbox(r, cx.t, cx.out, v)) },
    { fam: "Mouth & body", id: "beatbox2", icon: "💥", label: "Busy beatbox", play: (cx) => drumsAs(cx, 1, (r, v) => cx.B.beatbox(r, cx.t, cx.out, v)) },
    { fam: "Mouth & body", id: "rap", icon: "🧢", label: "Rap chant", play: (cx) => { const c = PCH("x.x.xx.x..x.x.x.", cx.s); if (c === ".") return false; cx.B.shout(cx.t, cx.out, cx.i % 4 ? 0.5 : 0.8, mtof(regRoot(cx.ch[0], 45) + (cx.i % 8 === 4 ? 3 : 0))); return true; } },
    { fam: "Mouth & body", id: "burp", icon: "🤢", label: "Burp bass", play: (cx) => { const c = PCH(cx.G.bass, cx.s); if (!"rfo3765a".includes(c)) return false; cx.B.burp(bassNote(cx, c, 40), cx.t, cx.out, holdSteps(cx.G.bass, cx.s) * cx.STEP * 0.9, 0.9); return true; } },
    { fam: "Mouth & body", id: "hey", icon: "🙌", label: "HEY! shouts", play: (cx) => { if (!(cx.i === 12 || (cx.i === 14 && cx.bar % 2))) return false; cx.B.shout(cx.t, cx.out, 1, 260); return true; } },
    { fam: "Beast calls", id: "howl", icon: "🐺", label: "Beastmaster howl", play: (cx) => { if (cx.i || cx.bar % 2) return false; cx.B.howl(regRoot(cx.ch[0], 57), cx.t, cx.out, cx.STEP * 14, 0.9); return true; } },
    { fam: "Beast calls", id: "birds", icon: "🐦", label: "Beastmaster birds", play: tag((cx) => { if (PCH("..x...x.x.....x.", cx.s) === ".") return false; cx.B.bird(cx.t, cx.out, 0.9); return true; }, "bird_tweet") }
  ] },
  { k: "binko", name: "Binko", find: ["Binko"], inst: "DJ set", color: "#b07af0", groove: "nod", pan: 0.3, mix: 0.9, rev: 0.06, dly: 0.1, lo: 28, loops: [
    { fam: "Beats", id: "beat", icon: "🥁", label: "Main beat", play: tag((cx) => P("drums", 0)(cx) | P("dj", 0)(cx), "drumkit") },
    { fam: "Beats", id: "beat2", icon: "⚙️", label: "Busy beat", play: tag((cx) => P("drums", 1)(cx) | P("dj", 0)(cx), "drumkit") },
    { fam: "Beats", id: "break", icon: "🌫️", label: "Breakdown", play: tag(P("drums", 2), "drumkit") },
    { fam: "Beats", id: "livekit", icon: "🪘", label: "Live drum kit", play: tag(withKit(k => ELECTRO.has(k) || k === "taiko" ? "rock" : k), "drumkit") },
    { fam: "Beats", id: "drummachine", icon: "📼", label: "Drum machine", play: withKit(k => ELECTRO.has(k) ? k : "909") },
    { fam: "Beats", id: "taiko", icon: "⛩️", label: "Taiko war drums", play: warDrums },
    { fam: "Beats", id: "hands", icon: "🔔", label: "Hand drums", play: tag(P("perc", 1), "drumkit") },
    { fam: "Decks", id: "scratch", icon: "💿", label: "Scratches", play: P("dj", 2) },
    { fam: "Decks", id: "wobble", icon: "🌊", label: "Wobble", play: (cx) => { const h = P("dj", 1)(cx); if (cx.i % 4 === 0) cx.B.drum(0, cx.t, 0.8, KITS[cx.G.kit], cx.out); return h || cx.i % 4 === 0; } },
    { fam: "Decks", id: "subbass", icon: "🔉", label: "Sub bass", play: LBass("bass_synth", false, { v: 1.1 }) },
    { fam: "Decks", id: "orchhit", icon: "🎻", label: "Orchestra hits", play: orchHit },
    { fam: "Decks", id: "vocoder", icon: "🤖", label: "Robot vocoder", play: (cx) => { if (PCH("x.xx.x.x..x.x.x.", cx.s) === ".") return false; cx.B.vocoder(voice(cx.ch, 60)[0], cx.t, cx.out, cx.STEP * 0.8, 0.8, ["ah", "ee", "oo", "eh"][(cx.i >> 2) % 4]); return true; } },
    { fam: "Decks", id: "servo", icon: "🦾", label: "Mech servos", play: (cx) => { const i = cx.i; if (i % 8 === 0) { cx.B.drum(0, cx.t, 0.9, KITS[cx.G.kit], cx.out); return true; } if (i % 8 === 4) { cx.B.hydraulic(cx.t, cx.out); return true; } if (i % 4 === 2) { cx.B.servo(cx.t, cx.out, 0.9); return true; } return false; } },
    { fam: "Decks", id: "glitch", icon: "📟", label: "Glitch stutter", play: (cx) => { if (!(cx.i === 12 || (cx.i === 6 && cx.bar % 2))) return false; cx.B.glitch(voice(cx.ch, 72)[cx.bar % 3], cx.t, cx.out, cx.STEP); return true; } },
    { fam: "Effects", id: "airhorn", icon: "📯", label: "Airhorn", play: (cx) => { if (cx.i || cx.bar % 4) return false; cx.B.djFx(6, cx.t, cx.out); return true; } },
    { fam: "Effects", id: "rewind", icon: "⏪", label: "Rewind", play: (cx) => { if (cx.i !== 8 || cx.bar % 4 !== 3) return false; cx.B.djFx(7, cx.t, cx.out); return true; } },
    { fam: "Effects", id: "cannon", icon: "💥", label: "Colidascope cannon", play: (cx) => { if (cx.i === 0 && cx.bar % 4 === 3) { cx.B.riser(cx.t, cx.out, cx.STEP * 15); return true; } if (cx.i === 0 && cx.bar % 4 === 0) { cx.B.cannon(cx.t, cx.out, 0.9); return true; } return false; } }
  ] }
];
// guests the GM can seat: one at a time
const GUESTS = [
  { id: "cat", name: "Cat", find: ["Cat"], icon: "🐐", label: "Goat bleats", color: "#d8c8a8", play: (cx) => { if (!(cx.i === 4 || (cx.i === 12 && cx.bar % 2))) return false; cx.B.goat(cx.t, cx.out, 0.9, regRoot(cx.ch[0], 64)); return true; } },
  { id: "hoodwink", name: "Hoodwink", find: ["Hoodwink"], icon: "🤡", label: "Honk horn & bell", color: "#e84a4a", play: (cx) => { if (cx.i === 6 || cx.i === 14) { cx.B.honk(cx.t, cx.out, 0.9); return true; } if (cx.i === 0 && cx.bar % 2) { cx.B.bell(cx.t, cx.out); return true; } return false; } },
  { id: "saguaro", name: "Saguaro", find: ["Saguaro"], icon: "🌵", label: "Hide drum", color: "#7ab35a", play: (cx) => { const c = PCH("x..x..x.x..x.x..", cx.s); if (c === ".") return false; cx.B.drum(cx.i % 8 === 0 ? 5 : 6, cx.t, 0.8, KITS.taiko, cx.out); return true; } }
];
const CAST_K = Object.fromEntries(CAST.map(C => [C.k, C]));
const GUEST_K = Object.fromEntries(GUESTS.map(g => [g.id, g]));
const findActor = (names) => game.actors.find(a => a.type === "character" && names.some(n => a.name.toLowerCase().startsWith(n.toLowerCase()))) ?? game.actors.find(a => names.some(n => a.name.toLowerCase().startsWith(n.toLowerCase())));
const castActor = (C) => findActor(C.find);
const headImg = (names) => { const a = findActor(names); return a?.prototypeToken?.texture?.src || a?.img || ""; };
const loopsOf = (C, S) => [S.loop, S.loop2].filter(Boolean).map(id => C.loops.find(l => l.id === id)).filter(Boolean);
const preloadLoop = (L) => { if (Band.ctx) for (const n of L?.play?.smp ?? []) smpLoad(n); };
let castIds = null, castIdsAt = 0;

// ---- combo bonuses: certain pairings unlock an extra layer after two bars together
const has = (V, k, ids) => { const S = V.cast[k]; return !S.mute && (ids.includes(S.loop) || ids.includes(S.loop2)); };
const COMBOS = [
  { id: "saloon", name: "Saloon Night", color: "#e8a64a", who: ["quickare", "ollie"], test: (V) => has(V, "quickare", ["stride", "honky", "boogie"]) && has(V, "ollie", ["harp", "whistle"]),
    layer: (cx) => { if (cx.i % 8 === 0) cx.B.drum(0, cx.t, 0.6, KITS.acoustic, cx.out); else if (cx.i % 8 === 4) cx.B.drum(4, cx.t, 0.7, KITS.acoustic, cx.out); if (cx.i === 0 && cx.bar % 4 === 0) cx.B.shout(cx.t, cx.out, 0.6, 330); } },
  { id: "neon", name: "Neon Duet", color: "#ff4fd8", who: ["binko", "triton"], test: (V) => has(V, "binko", ["beat", "beat2", "break", "servo", "drummachine"]) && has(V, "triton", ["lead", "arp", "shred", "talk"]),
    layer: (cx) => { const vc = voice(cx.ch, 84); cx.B.synth(vc[cx.i % vc.length], cx.t, cx.out, cx.STEP * 0.7, 0.35, "square", 3000); } },
  { id: "campfire", name: "Campfire Harmony", color: "#ff9a3c", who: ["biggreen", "ollie"], test: (V) => has(V, "biggreen", ["ooh", "hum", "doo", "lullaby"]) && has(V, "ollie", ["flute", "ocarina", "clarinet", "recorder", "pipes"]),
    layer: (cx) => { if ((cx.s * 5) % 7 < 2) cx.B.nz(cx.t, 0.02, cx.out, { type: "bandpass", f: 2200, q: 1, peak: 0.08 }); if (cx.i === 0) for (const m of voice(cx.ch, 67)) cx.B.choir(m, cx.t, cx.out, cx.STEP * 15, 0.35, "oo", 0.5); } },
  { id: "beast", name: "Beast Mode", color: "#3fcf6a", who: ["biggreen", "binko"], test: (V) => has(V, "biggreen", ["howl", "birds", "burp"]) && has(V, "binko", ["wobble", "beat2", "servo", "taiko"]),
    layer: (cx) => { if (cx.i === 8 && cx.bar % 2) cx.B.burp(regRoot(cx.ch[0], 33), cx.t, cx.out, cx.STEP * 6, 0.6); if (cx.i % 4 === 2) cx.B.perc(1, cx.t, 0.6, cx.out); } },
  { id: "showdown", name: "Trick Shot Showdown", color: "#c94a3a", who: ["quickare", "triton"], test: (V) => has(V, "quickare", ["trick"]) && has(V, "triton", ["guitar", "brass", "banjo", "power", "nylon", "acoustic"]),
    layer: (cx) => melOn(cx, "B", (m, d, v) => cx.B.whistle(m - 12, cx.t, cx.out, Math.min(d, cx.STEP * 3), 0.7 * v)) },
  { id: "chamber", name: "Moonlight Chamber", color: "#9ab6ff", who: ["quickare", "triton"], test: (V) => has(V, "quickare", ["ballad", "musicbox", "arpeg", "celesta"]) && has(V, "triton", ["strings", "theremin", "violin", "cello", "orchharp", "viola"]),
    layer: (cx) => { if (cx.i % 4 === 0) cx.B.shimmer(voice(cx.ch, 88)[(cx.i / 4) % 3], cx.t, cx.out, 0.6); } },
  { id: "orchestra", name: "Grand Orchestra", color: "#e8d28a", who: ["ollie", "triton"], test: (V) => has(V, "ollie", ["flute", "piccolo", "oboe", "clarinet", "ehorn", "bassoon", "trumpet"]) && has(V, "triton", ["strings", "violin", "viola", "cello", "contra", "tremolo", "horn", "brass", "timpani", "orchharp"]),
    layer: (cx) => { if (cx.i === 0) { cx.B.inst("timpani", regRoot(cx.ch[0], 40), cx.t, cx.out, 1, 0.8); if (cx.bar % 4 === 0) cx.B.crash(cx.t, cx.out); } if (cx.i === 0 && cx.bar % 2 === 0) cx.B.inst("harp", regRoot(cx.ch[0], 60) + 12, cx.t, cx.out, 2, 0.5); } },
  { id: "jazzclub", name: "Jazz Club", color: "#c9a0ff", who: ["quickare", "triton"], test: (V) => has(V, "quickare", ["chords", "rhythm", "rhodes"]) && has(V, "triton", ["upright", "jazzgtr", "vibes", "fretless"]),
    layer: (cx) => ride(cx, 0.45) },
  { id: "march", name: "Highland March", color: "#5ab0a0", who: ["ollie", "binko"], test: (V) => has(V, "ollie", ["bagpipe", "piccolo"]) && has(V, "binko", ["taiko", "livekit", "beat"]),
    layer: (cx) => { const c = PCH("x.xxx.x.x.xxx.xx", cx.s); if (c !== ".") cx.B.sample("drumkit", 38, cx.t, cx.out, 1, cx.i % 4 ? 0.3 : 0.55, { raw: true, exact: true }); } },
  { id: "eastern", name: "Eastern Garden", color: "#ff8fb0", who: ["ollie", "triton"], test: (V) => has(V, "ollie", ["shaku", "shanai", "pipes"]) && has(V, "triton", ["koto", "shamisen", "sitar"]),
    layer: (cx) => { if ((cx.s * 7) % 11 < 2 && cx.i % 2 === 0) { const sc = scaleNotes(cx, 79, 8); cx.B.inst("glockenspiel", sc[(cx.s * 3) % sc.length], cx.t, cx.out, 1.5, 0.35); } } },
  { id: "robot", name: "Robot Choir", color: "#7af0e0", who: ["binko", "biggreen"], test: (V) => has(V, "binko", ["vocoder", "servo"]) && has(V, "biggreen", ["ooh", "aah", "chant", "opera", "ghost"]),
    layer: (cx) => { if (cx.i === 0) cx.B.vocoder(voice(cx.ch, 60)[0], cx.t, cx.out, cx.STEP * 15, 0.35, "oo"); } },
  { id: "full", name: "Full band! The Lucky Clovers are in the pocket", color: "#ffd76a", who: CAST.map(C => C.k), test: (V) => CAST.every(C => { const S = V.cast[C.k]; return (S.loop || S.loop2) && !S.mute; }),
    layer: (cx) => { if (cx.i === 0 && cx.bar % 2 === 0) cx.B.crash(cx.t, cx.out); } }
];

// ---- spotlight solos: two bars, once, then back to the loop
const SOLOS = {
  ollie: (cx, j) => { const sc = scaleNotes(cx, 72, 12); if (j < 24) { cx.B.flute(sc[j < 12 ? j : 23 - j], cx.t, cx.out, cx.STEP * 0.9, 0.9); return true; } if (j % 2 === 0) { cx.B.flute(sc[11] + (j % 4 ? 2 : 0), cx.t, cx.out, cx.STEP * 1.6, 1); return true; } return false; },
  quickare: (cx, j) => { if (j === 0 || j === 28) { cx.B.shot(5, cx.t, cx.out, 1); } const sc = scaleNotes(cx, 60, 16); if (j < 28) { cx.B.piano(sc[15 - (j % 16)], cx.t, cx.out, 0.7, 0.4); return true; } return j === 28; },
  triton: (cx, j) => { const sc = scaleNotes(cx, 64, 14); if (j < 26) { const m = sc[j < 13 ? j : 25 - j]; cx.B.keytar(m, cx.t, cx.out, cx.STEP * 0.9, 1, m - 2); return true; } if (j === 26) { cx.B.keytar(sc[13], cx.t, cx.out, cx.STEP * 6, 1); return true; } return false; },
  biggreen: (cx, j) => { if (j === 0) { cx.B.choir(regRoot(cx.ch[0], 64) + 12, cx.t, cx.out, cx.STEP * 14, 1.2, "ah", 0.05); return true; } if (j >= 16 && j % 4 === 0) { cx.B.shout(cx.t, cx.out, 1, 240 + j * 4); return true; } return false; },
  binko: (cx, j) => { if (j === 0) cx.B.djFx(6, cx.t, cx.out); if (j === 31) { cx.B.cannon(cx.t, cx.out); return true; } if (j % 2 === 0 && j < 30) { cx.B.scratch(cx.t, cx.out, j % 4 ? [2400, 600] : [600, 2600, 500], cx.STEP * 0.9, 0.8); return true; } return false; }
};
const DRUMMY = (k, S) => (k === "binko" && [S.loop, S.loop2].some(id => id && !["orchhit", "subbass", "vocoder", "scifi", "echoes", "rain", "atmos", "ocean", "chopper", "applause"].includes(id))) || (k === "biggreen" && /beatbox/.test(S.loop ?? ""));
const BASSY = ["bass", "upright", "fretless", "slap", "synthbass", "contra", "subbass", "bassoon", "bari", "burp", "tuba", "ostinato"];
// song feels: one dropdown changes how the whole band sounds, at the next bar, for everyone
const SECTIONS = {
  verse: { label: "🎵 Normal", color: "#d9b45a", song: true },
  intro: { label: "🌅 Intro: soft, no beat", color: "#5a7ad8", song: true, lp: 1500, mute: DRUMMY },
  chorus: { label: "🔥 Chorus: bigger", color: "#ffd76a", song: true, gain: 1.18, wet: 1.4, hype: 15, extra: (B, s, t, out) => { if (s % 32 === 0) B.crash(t, out); } },
  drop: { label: "💥 Drop: Binko alone, then slam", color: "#e84a3a", song: true },
  unplugged: { label: "🪕 Unplugged: no drums or DJ", color: "#c99a5a", lp: 7000, wet: 1.2, mute: (k, S) => k === "binko" || DRUMMY(k, S) },
  breakdown: { label: "🥁 Breakdown: beat and bass only", color: "#a05ae8", mute: (k, S) => !(DRUMMY(k, S) || [S.loop, S.loop2].some(id => BASSY.includes(id))) },
  whisper: { label: "🤫 Whisper: hushed and far away", color: "#7a8aa0", gain: 0.55, lp: 2600, wet: 1.6, mute: DRUMMY },
  campfire: { label: "🏕️ Campfire: quiet, crackling fire", color: "#ff9a3c", gain: 0.85, lp: 5000, wet: 0.7, mute: DRUMMY, crackle: "fire" },
  dreamy: { label: "☁️ Dreamy: soft focus, long echoes", color: "#c8b0ff", lp: 4200, wet: 2, dly: 2.2, trem: [0.15, 0.3] },
  underwater: { label: "🌊 Underwater", color: "#3a8ad8", lp: 520, wet: 1.6, trem: [0.35, 0.6] },
  cathedral: { label: "⛪ Cathedral: huge stone hall", color: "#e8e0c0", wet: 3, dly: 0.3, lp: 9000 },
  canyon: { label: "🏜️ Echo canyon", color: "#d87a3a", dly: 3, wet: 1.3 },
  radio: { label: "📻 Old radio", color: "#a0a070", hp: 550, lp: 3200, gain: 1.15, wet: 0.4, crackle: "vinyl" },
  haunted: { label: "👻 Haunted: shaky and ghostly", color: "#6a5a8a", lp: 2400, wet: 2.6, dly: 1.5, trem: [0.45, 6] },
  battle: { label: "⚔️ Battle: louder, war drum every bar", color: "#c93a2a", gain: 1.22, wet: 0.8, hype: 20, extra: (B, s, t, out) => { if (s % 16 === 0) { B.crash(t, out); B.drum(5, t, 0.9, KITS.taiko, out); } } },
  stadium: { label: "🏟️ Stadium: big room, cheering crowd", color: "#ffb84a", gain: 1.15, wet: 1.9, hype: 20, extra: (B, s, t, out, STEP) => { if (s % 64 === 0) B.inst("applause", 60, t, out, STEP * 20, 0.45, { raw: true }); if (s % 32 === 0) B.crash(t, out); } },
  dropbuild: { label: "💥 Drop", color: "#e84a3a", hidden: true, mute: (k) => k !== "binko" }
};
// the packs nearly every song uses, fetched as soon as the band starts
const SMP_CORE = ["grand_piano", "drumkit", "strings", "strings_slow", "brass", "choir_aahs", "voice_oohs", "flute", "alto_sax", "tenor_sax", "clarinet", "ocarina", "harmonica", "honkytonk", "celesta", "music_box", "bass_finger", "bass_acoustic", "guitar_clean", "guitar_nylon"];
const _bandStart = Band.start;
Band.start = function () { _bandStart.call(this); for (const n of SMP_CORE) smpLoad(n); };

// ---- more sounds for everyone
const LOOPN = (cx) => cx.G.prog.length * 16;
const delayMel = (name, which, d, shift = 0, o = {}) => tag((cx) => { const L = LOOPN(cx), n = MELS(cx.G, cx.V.song.gk ?? cx.V.song.genre)[which].get((((cx.s - d) % L) + L) % L); if (!n) return false;
  I_(cx, name, n[0] + cx.tr + shift, n[1] * cx.STEP * 0.95, n[2] * (o.v ?? 0.7), o); return true; }, name);
const inScale = (cx, m) => cx.G.scale.includes(pcOf(m - cx.G.tonic - cx.tr));
const LHarm = (name, which = "A", shift = 0, o = {}) => tag((cx) => melOn(cx, which, (m, d, v) => {
  I_(cx, name, m, d, v * (o.v ?? 0.8), o); let h = m - 4; if (!inScale(cx, h)) h = m - 3; I_(cx, name, h, d, v * (o.v ?? 0.8) * 0.75, o); }, shift), name);
const once = (name, m, every = 2, steps = 31, o = {}) => tag((cx) => { if (cx.i || cx.bar % every) return false; I_(cx, name, typeof m === "function" ? m(cx) : m, cx.STEP * steps, o.v ?? 0.7, { raw: true, ...o }); return true; }, name);
const hits = (name, str, notes, o = {}) => tag((cx) => { const c = PCH(str, cx.s); if (c === ".") return false; const m = notes[cx.i % notes.length];
  cx.B.sample(name, m, cx.t, cx.out, o.dur ?? 1, (VEL[c] ?? 1) * (o.v ?? 0.8), { raw: true, exact: true }) || (o.fb && o.fb(cx)); return true; }, name);
const fanfare = (name, center = 62) => tag((cx) => { if (cx.bar % 2) return false; const at = { 0: [0, 3, 0.9], 3: [0, 1, 0.7], 4: [1, 8, 1] }[cx.i]; if (!at) return false;
  const vc = voice(cx.ch, center); for (const m of at[0] ? [...vc.slice(1), vc[0] + 12] : vc) I_(cx, name, m, cx.STEP * at[1], at[2] * 0.6, { att: 0.01 }); return true; }, name);
const gliss = tag((cx) => { if (cx.bar % 4 !== 3 || cx.i < 12) return false; const sc = scaleNotes(cx, 60, 26), k0 = (cx.i - 12) * 6;
  for (let k = 0; k < 6; k++) cx.B.piano(sc[Math.min(25, k0 + k)], cx.t + k * cx.STEP / 6, cx.out, 0.35 + 0.05 * (k0 + k) / 6, 0.5); return true; }, "grand_piano");
const gospel = tag((cx) => { const c = PCH(cx.G.comp, cx.s); if (".-".includes(c)) return false; const len = Math.min(6, gapSteps(cx.G.comp, cx.s, 6)) * cx.STEP;
  const r = regRoot(cx.ch[0], 36); cx.B.piano(r, cx.t, cx.out, 0.7, len); cx.B.piano(r + 12, cx.t, cx.out, 0.55, len); voice(cx.ch, 64).forEach((m, k) => cx.B.piano(m, cx.t + 0.012 * k, cx.out, 0.55, len)); return true; }, "grand_piano");
const ostinato = tag((cx) => { if (cx.i % 2) return false; const r = regRoot(cx.ch[0], 43); I_(cx, "cello", [r, r + 7, r + 12, r + 7][(cx.i / 2) % 4], cx.STEP * 1.7, cx.i % 4 ? 0.6 : 0.85, { att: 0.02, rel: 0.08 }); return true; }, "cello");
const concert = tag((cx) => { let h = false;
  if (cx.i === 0 || cx.i === 8) { cx.B.sample("orchkit", 36, cx.t, cx.out, 2, cx.i ? 0.7 : 1, { raw: true, exact: true }); h = true; }
  if (cx.bar % 2 && cx.i >= 12) { cx.B.sample("orchkit", 38, cx.t, cx.out, 1, 0.35 + 0.1 * (cx.i - 12), { raw: true, exact: true }); cx.B.sample("orchkit", 38, cx.t + cx.STEP / 2, cx.out, 1, 0.4 + 0.1 * (cx.i - 12), { raw: true, exact: true }); h = true; }
  if (cx.i === 0 && cx.bar % 4 === 0) { cx.B.sample("orchkit", 57, cx.t, cx.out, 3, 0.8, { raw: true, exact: true }); h = true; }
  return h; }, "orchkit");
const yodel = tag((cx) => { if (cx.i % 4) return false; const r = regRoot(cx.ch[0], 55), hi = (cx.i / 4) % 2; I_(cx, "synth_voice", hi ? r + 12 : r + 4, cx.STEP * 1.8, 0.8, { att: 0.02 }); return true; }, "synth_voice");
const shanty = tag((cx) => { if (cx.i % 8) return false; for (const m of voice(cx.ch, 55)) I_(cx, "choir_aahs", m, cx.STEP * 3, 0.65, { att: 0.02 }); if (cx.i === 8) cx.B.drum(0, cx.t, 0.7, KITS.acoustic, cx.out); return true; }, "choir_aahs");
const monks = tag((cx) => melOn(cx, "D", (m, d, v) => { I_(cx, "choir_aahs", m - 12, d, 0.75 * v, { att: 0.12 }); I_(cx, "choir_aahs", m - 19, d, 0.6 * v, { att: 0.12 }); }), "choir_aahs");
const trap = tag((cx) => { const k = cx.i >= 12 && cx.bar % 2 ? 2 : 1; for (let j = 0; j < k; j++) cx.B.drum(2, cx.t + j * cx.STEP / 2, cx.i % 4 ? 0.5 : 0.8, KITS[cx.G.kit], cx.out); return true; }, "drumkit");
const four = tag((cx) => { const K = KITS[cx.G.kit]; let h = false; if (cx.i % 4 === 0) { cx.B.drum(0, cx.t, 1, K, cx.out); h = true; } if (cx.i === 4 || cx.i === 12) { cx.B.drum(4, cx.t, 0.8, K, cx.out); h = true; } if (cx.i % 4 === 2) { cx.B.drum(3, cx.t, 0.55, K, cx.out); h = true; } return h; }, "drumkit");
const latin = tag((cx) => { let h = false; const p = (n, v) => { cx.B.sample("drumkit", n, cx.t, cx.out, 1, v, { raw: true, exact: true }); h = true; };
  if (PCH("x..x..x...x.x...", cx.s) !== ".") p(cx.i < 8 ? 65 : 66, 0.8); if (PCH("x.x.x..x", cx.s) !== ".") p(cx.i % 4 ? 68 : 67, 0.8); if (PCH("..x...x.", cx.s) !== ".") p(cx.i % 8 === 2 ? 73 : 74, 0.5); return h; }, "drumkit");
const clock = tag((cx) => { if (cx.i % 2) return false; cx.B.sample("woodblock", cx.i % 4 ? 72 : 79, cx.t, cx.out, 0.5, cx.i % 4 ? 0.55 : 0.8, { raw: true, exact: true }) || cx.B.perc(6, cx.t, 0.6, cx.out); return true; }, "woodblock");
const six = hits("gunshot", "x...x.x.......x.", [60, 60, 64, 57], { v: 0.7, dur: 1.2, fb: (cx) => cx.B.shot(1, cx.t, cx.out, 0.8) });
const scifi = hits("fx_scifi", "x.....x...x.....", [60, 67, 72, 64], { v: 0.6, dur: 1.5 });
const MORE = {
  ollie: [
    { fam: "Flutes & whistles", id: "flurry", icon: "🌪️", label: "Flute flurry", play: LArp("flute", 76, { every: 1, len: 1.2, v: 0.6 }) },
    { fam: "Flutes & whistles", id: "duet", icon: "👯", label: "Flute duet", play: LHarm("flute", "A") },
    { fam: "Flutes & whistles", id: "canon", icon: "🔁", label: "Recorder round", play: both(LM("recorder", "A", 0, { v: 0.8 }), delayMel("recorder", "A", 8, 12, { v: 0.55 })) },
    { fam: "Flutes & whistles", id: "bottles", icon: "🍶", label: "Bottle chords", play: LPad("blown_bottle", 64, { v: 0.45 }) },
    { fam: "Saxophones", id: "saxsect", icon: "🎷", label: "Sax section stabs", play: both(LComp("alto_sax", 66, "stab", { max: 2, v: 0.4 }), LComp("tenor_sax", 55, "stab", { max: 2, v: 0.4 })) },
    { fam: "Horns", id: "fanfare", icon: "🏇", label: "Trumpet fanfare", play: fanfare("trumpet", 67) },
    { fam: "Folk & magic", id: "harpchug", icon: "🚂", label: "Harmonica chug", play: LComp("harmonica", 64, "comp", { max: 2, v: 0.55 }) },
    { fam: "Folk & magic", id: "calliope", icon: "🎠", label: "Steam calliope", play: LM("calliope", "A") },
    { fam: "Folk & magic", id: "wind", icon: "🏜️", label: "Desert wind", play: once("breath_noise", 60, 2, 31, { v: 0.6 }) }
  ],
  quickare: [
    { fam: "Grand piano", id: "gospel", icon: "⛪", label: "Gospel piano", play: gospel },
    { fam: "Grand piano", id: "gliss", icon: "🌠", label: "Glissando", play: gliss },
    { fam: "Saloon & parlor", id: "ragtime", icon: "🎩", label: "Ragtime", play: both(CAST_K.quickare.loops.find(l => l.id === "stride").play, LM("honkytonk", "C", 0, { v: 0.6 })) },
    { fam: "Saloon & parlor", id: "toy", icon: "🧸", label: "Toy piano", play: LArp("music_box", 76, { every: 2, len: 1.5, v: 0.8 }) },
    { fam: "Electric", id: "house", icon: "🏠", label: "Piano house stabs", play: LComp("bright_piano", 64, "stab", { max: 2, v: 0.75 }) },
    { fam: "Electric", id: "wurli", icon: "🌇", label: "Wurlitzer", play: LArp("epiano2", 64, { every: 2, len: 2 }) },
    { fam: "Electric", id: "perc", icon: "🔘", label: "Percussive organ", play: LComp("perc_organ", 62, "comp", { max: 2, v: 0.7 }) },
    { fam: "Bells & boxes", id: "crystal", icon: "🔮", label: "Crystal keys", play: LM("fx_crystal", "B", 12, { v: 0.8 }) },
    { fam: "Trick shots", id: "six", icon: "🎯", label: "Six-shooter", play: six }
  ],
  triton: [
    { fam: "Keytar & synths", id: "charang", icon: "🎸", label: "Charang lead", play: LM("charang", "A") },
    { fam: "Keytar & synths", id: "synthbrass", icon: "🚀", label: "Synth brass", play: LComp("synth_brass", 62, "stab", { max: 2, v: 0.7 }) },
    { fam: "Keytar & synths", id: "synthstr", icon: "🌌", label: "Synth strings", play: LPad("synth_strings", 60, { root: 43, v: 0.55 }) },
    { fam: "Keytar & synths", id: "warmpad", icon: "🕯️", label: "Warm pad", play: LPad("pad_warm", 60, { two: true, v: 0.6 }) },
    { fam: "Keytar & synths", id: "halo", icon: "😇", label: "Halo pad", play: LPad("pad_halo", 64, { two: true, v: 0.55 }) },
    { fam: "Keytar & synths", id: "sweep", icon: "🌫️", label: "Sweep pad", play: LPad("pad_sweep", 60, { two: true, v: 0.55 }) },
    { fam: "Keytar & synths", id: "glass", icon: "🥂", label: "Bowed glass", play: LPad("pad_bowed", 64, { v: 0.55 }) },
    { fam: "Strings", id: "staccato", icon: "✂️", label: "Staccato strings", play: LComp("strings", 62, "comp", { max: 1, att: 0.01, rel: 0.08 }) },
    { fam: "Strings", id: "ostinato", icon: "🐎", label: "Cello ostinato", play: ostinato },
    { fam: "Brass & drums", id: "brassfan", icon: "👑", label: "Brass fanfare", play: fanfare("brass", 62) },
    { fam: "Brass & drums", id: "concert", icon: "🪇", label: "Concert drums", play: concert },
    { fam: "Keys & mallets", id: "tango", icon: "🌹", label: "Tango accordion", play: LComp("tango_accordion", 62, "comp", { max: 2, v: 0.7 }) },
    { fam: "Keys & mallets", id: "reed", icon: "🏡", label: "Parlor reed organ", play: LPad("reed_organ", 57, { root: 45, v: 0.55 }) },
    { fam: "Guitars & folk", id: "harmonics", icon: "💎", label: "Guitar harmonics", play: LArp("guitar_harmonics", 72, { every: 4, len: 3 }) }
  ],
  biggreen: [
    { fam: "Singing", id: "harmony", icon: "👥", label: "Harmony oohs", play: LHarm("voice_oohs", "B", -12) },
    { fam: "Singing", id: "echo", icon: "📢", label: "Call and response", play: both(LM("choir_aahs", "A", -12, { v: 0.8 }), delayMel("voice_oohs", "A", 8, -12, { v: 0.5 })) },
    { fam: "Singing", id: "monks", icon: "📿", label: "Monk chant", play: monks },
    { fam: "Singing", id: "choirpad", icon: "☁️", label: "Choir pad", play: LPad("pad_choir", 60, { v: 0.6 }) },
    { fam: "Singing", id: "shanty", icon: "⚓", label: "Sea shanty", play: shanty },
    { fam: "Singing", id: "yodel", icon: "🏔️", label: "Yodel", play: yodel },
    { fam: "Mouth & body", id: "whistling", icon: "😙", label: "Whistling while he works", play: LM("whistle", "B", -12, { v: 0.8 }) },
    { fam: "Beast calls", id: "goblins", icon: "👺", label: "Goblin chatter", play: once("fx_goblins", 60, 2, 28) }
  ],
  binko: [
    { fam: "Beats", id: "four", icon: "🪩", label: "Four on the floor", play: four },
    { fam: "Beats", id: "trap", icon: "💎", label: "Trap hats", play: trap },
    { fam: "Beats", id: "latin", icon: "💃", label: "Latin percussion", play: latin },
    { fam: "Beats", id: "clock", icon: "⏰", label: "Clock tick", play: clock },
    { fam: "Decks", id: "scifi", icon: "👽", label: "Sci-fi zaps", play: scifi },
    { fam: "Decks", id: "echoes", icon: "🌀", label: "Echo drops", play: once("fx_echoes", (cx) => regRoot(cx.ch[0], 60), 1, 14, { raw: false }) },
    { fam: "Atmosphere", id: "rain", icon: "🌧️", label: "Rain", play: once("fx_rain", 60, 2, 31) },
    { fam: "Atmosphere", id: "atmos", icon: "🌌", label: "Atmosphere", play: once("fx_atmosphere", (cx) => regRoot(cx.ch[0], 55), 2, 31, { raw: false, v: 0.6 }) },
    { fam: "Atmosphere", id: "ocean", icon: "🌊", label: "Ocean waves", play: once("seashore", 60, 2, 31) },
    { fam: "Effects", id: "chopper", icon: "🚁", label: "Helicopter", play: once("helicopter", 60, 4, 30, { v: 0.6 }) },
    { fam: "Effects", id: "applause", icon: "👏", label: "Crowd applause", play: once("applause", 60, 4, 24) }
  ]
};
for (const C of CAST) C.loops.push(...(MORE[C.k] ?? []));
for (const L of CAST_K.triton.loops) if (L.fam === "Keytar") L.fam = "Keytar & synths";

// ---- the engine plays the cast (plus guest, combo layers, sections and solos)
const _bandInit = Band.init;
Object.assign(Band, {
  solo: null, combo: {}, comboMsg: null, spotNow: null, secNow: "verse", dropHit: 0, st: 0,
  init() {
    _bandInit.call(this); const c = this.ctx; this.cch = {};
    // feel effects on the whole band: a high-pass (old radio) and a tremolo (underwater, haunted, dreamy)
    this.hpf = c.createBiquadFilter(); this.hpf.type = "highpass"; this.hpf.frequency.value = 20;
    this.trem = c.createGain(); this.trem.gain.value = 1; this.tlfo = c.createOscillator(); this.tlfo.frequency.value = 4; this.tdep = c.createGain(); this.tdep.gain.value = 0;
    this.tlfo.connect(this.tdep).connect(this.trem.gain); this.tlfo.start();
    this.sum.disconnect(); this.sum.connect(this.hpf).connect(this.trem).connect(this.lofi);
    for (const k of [...CAST.map(C => C.k), "guest", "bonus"]) {
      const C = CAST_K[k];
      const inp = c.createGain(); inp.gain.value = 0; const sh = c.createWaveShaper(), tone = c.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 18000;
      const pan = c.createStereoPanner(); pan.pan.value = C?.pan ?? (k === "guest" ? 0.45 : 0); inp.connect(sh).connect(tone).connect(pan).connect(this.sum);
      const rs = c.createGain(); rs.gain.value = C?.rev ?? 0.3; pan.connect(rs).connect(this.rev);
      const ds = c.createGain(); ds.gain.value = 0; pan.connect(ds).connect(this.dIn);
      this.cch[k] = { inp, sh, tone, pan, rs, ds };
    }
    // a clean tap of the whole band for recording takes
    try { const rc = c.createDynamicsCompressor(); rc.threshold.value = -16; rc.ratio.value = 4; this.recDest = c.createMediaStreamDestination(); this.lofi.connect(rc).connect(this.recDest); } catch (e) { this.recDest = null; }
  },
  stop() { clearInterval(this.timer); this.running = false; this.step = -1; if (this.ctx) for (const k in this.cch) this.cch[k].inp.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); },
  section(V) {
    const sec = V.song.sec || "verse", ss = V.song.secSt || 0, st = this.st ?? 0;
    if (st < ss) return { name: V.song.secPrev || "verse", phase: -1 };
    if (sec === "drop") { const j = st - ss; return j < 16 ? { name: "dropbuild", phase: j } : { name: "chorus", phase: j }; }
    return { name: sec, phase: st - ss };
  },
  spotFor(V) { for (const C of CAST) { const sp = V.spot[C.k], S = V.cast[C.k]; if (sp != null && (S.loop || S.loop2) && this.st >= sp && this.st < sp + 32) return C.k; } return null; },   // only someone who is playing can take a solo
  mixFor(V, G, t, STEP) {
    const sec = this.section(V), spot = this.spotFor(V), F = SECTIONS[sec.name] ?? SECTIONS.verse;
    this.lofi.frequency.setTargetAtTime(Math.min(F.lp ?? 20000, G.fx.lofi ? 3400 : 20000), t, 0.1);
    this.hpf?.frequency.setTargetAtTime(F.hp ?? 20, t, 0.1);
    if (this.tdep) { const [dep, rate] = F.trem ?? [0, 4]; this.tdep.gain.setTargetAtTime(dep, t, 0.2); this.trem.gain.setTargetAtTime(1 - dep, t, 0.2); this.tlfo.frequency.setTargetAtTime(rate, t, 0.2); }
    this.sum.gain.setTargetAtTime(F.gain ?? 1, t, 0.05);
    this.dl.delayTime.setTargetAtTime(STEP * 3, t, 0.05); this.dr.delayTime.setTargetAtTime(STEP * 3, t, 0.05);
    const wet = F.wet ?? 1, dlyM = F.dly ?? 1;
    for (const C of CAST) {
      const S = V.cast[C.k], ch = this.cch[C.k], playing = (S.loop || S.loop2) && !S.mute;
      let g = playing ? S.vol * C.mix : 0;
      if (spot === C.k) g = S.vol * C.mix * 1.25; else if (spot) g *= 0.45;
      if (this.solo && this.solo !== C.k) g = 0;
      if (F.mute?.(C.k, S)) g = 0;
      const drive = C.k === "triton" && (S.loop === "guitar" || S.loop2 === "guitar") && G.gtr === "drive";
      if (ch.drive !== drive) { ch.drive = drive; ch.sh.curve = drive ? (this._dc ??= driveCurve(18)) : null; }
      ch.inp.gain.setTargetAtTime(g * (drive ? 0.7 : 1), t, 0.03);
      ch.rs.gain.setTargetAtTime(C.rev * G.fx.rev * wet, t, 0.05);
      ch.ds.gain.setTargetAtTime(C.dly * (dlyM > 1 ? Math.max(G.fx.delay, 0.25) * dlyM : G.fx.delay * dlyM) * (wet > 1 ? 1.2 : 1), t, 0.05);
    }
    const gst = V.guest && !this.solo && sec.name !== "dropbuild" ? 0.8 * (spot ? 0.45 : 1) : 0;
    this.cch.guest.inp.gain.setTargetAtTime(gst, t, 0.03);
    this.cch.bonus.inp.gain.setTargetAtTime(this.solo ? 0 : 0.7, t, 0.03);
  },
  play(V, G, s, t, STEP) {
    this.step = s; this.mixFor(V, G, t, STEP);
    const tr = V.song.key, bars = G.prog.length, bar = s >> 4, T = (ch) => [ch[0] + tr, ch[1]];
    const base = { B: this, G, V, s, i: s % 16, bar, ch: T(G.prog[bar % bars]), nch: T(G.prog[(bar + 1) % bars]), t, STEP, tr };
    const later = (fn) => { const d = (t - this.ctx.currentTime) * 1000; setTimeout(fn, Math.max(0, d)); };
    const sec = this.section(V), spot = this.spotFor(V), F = SECTIONS[sec.name] ?? SECTIONS.verse; this.secNow = sec.name; this.spotNow = spot;
    if (G.fx.lofi || F.crackle === "vinyl") { const r = (s * 7919) % 13; if (r < 4) this.nz(t + r * 0.01, 0.006, this.sum, { type: "lowpass", f: 3500, peak: 0.05 + r * 0.01 }); }
    if (F.crackle === "fire") { const r = (s * 2741) % 11; if (r < 3) this.nz(t + r * 0.013, 0.012 + r * 0.006, this.sum, { type: "bandpass", f: 1800 + r * 700, q: 0.8, peak: 0.07 + r * 0.02 }); if (s % 16 === 0) this.nz(t, STEP * 15, this.sum, { type: "lowpass", f: 600, peak: 0.03, a: 0.3 }); }
    for (const C of CAST) {
      const S = V.cast[C.k], out = this.cch[C.k].inp, cx = { ...base, out, I: { lo: C.lo } };
      let hit = false;
      for (const L of loopsOf(C, S)) { try { hit = !!L.play(cx) || hit; } catch (e) { console.error(`Rhine Stage | ${C.k}.${L.id}`, e); } }
      if (spot === C.k) { try { hit = !!SOLOS[C.k](cx, this.st - V.spot[C.k]) || hit; } catch (e) { console.error("Rhine Stage | solo", e); } }
      if (hit && (!S.mute || spot === C.k)) later(() => { this.hits[C.k] = performance.now(); });
    }
    if (V.guest && GUEST_K[V.guest]) { let hit = false; try { hit = GUEST_K[V.guest].play({ ...base, out: this.cch.guest.inp }); } catch (e) {} if (hit) later(() => { this.hits.guest = performance.now(); }); }
    // combos: two bars together unlocks the layer
    const bout = this.cch.bonus.inp;
    if (s % 16 === 0) for (const K of COMBOS) {
      const n = K.test(V) ? (this.combo[K.id] ?? 0) + 1 : 0; this.combo[K.id] = n;
      if (n === 2) { later(() => { this.comboMsg = { ...K, until: performance.now() + 4500 }; }); if (K.id === "full") this.cheer(t, bout); else this.shimmer(84, t, bout, 0.8); }
    }
    for (const K of COMBOS) if ((this.combo[K.id] ?? 0) >= 2) { try { K.layer({ ...base, out: bout }); } catch (e) {} }
    // sections
    try { F.extra?.(this, s, t, bout, STEP); } catch (e) { console.error("Rhine Stage | feel", e); }
    if (sec.name === "dropbuild" && sec.phase === 0) this.riser(t, bout, STEP * 15);
    if (sec.name === "chorus" && V.song.sec === "drop" && sec.phase === 16) { this.cannon(t, bout); this.crash(t, bout); later(() => { this.dropHit = performance.now(); }); }
  }
});

// ---------------------------------------------------------------- major or minor: the same style, made happy or sad
// Scales switch to their parallel major or minor; chords move to the matching degree (minor's bIII, bVI, bVII become iii, vi, V).
function modal(G, mode) {
  const isMin = G.scale.includes(3) && !G.scale.includes(4);
  if (!mode || (mode === "minor") === isMin) return G;
  const toMaj = mode === "major", n = G.scale.length;
  const scale = n === 5 ? (toMaj ? [0, 2, 4, 7, 9] : [0, 3, 5, 7, 10]) : n === 6 ? (toMaj ? [0, 2, 3, 4, 7, 9] : [0, 3, 5, 6, 7, 10]) : (toMaj ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10]);
  const DM = toMaj ? { 1: 2, 3: 4, 6: 5, 8: 9, 10: 7 } : { 1: 2, 4: 3, 6: 5, 9: 8, 11: 10 };
  const QM = toMaj ? { 0: "maj", 2: "m", 4: "m", 5: "maj", 7: "maj", 9: "m" } : { 0: "m", 2: "m", 3: "maj", 5: "m", 7: "m", 8: "maj", 10: "maj" };
  const prog = G.prog.map(([r, q]) => {
    const d = pcOf(r - G.tonic), nd = DM[d] ?? d, base = QM[nd] ?? (q.startsWith("m") ? "m" : "maj");
    let nq = base; if (q === "5") nq = "5"; else if (q.includes("7")) nq = base === "m" ? (nd === 7 && q === "7" ? "7" : "m7") : (q === "7" || nd === 7 ? "7" : "maj7");
    return [r + (nd - d), nq];
  });
  return { ...G, scale, prog };
}
function modeKey(genre, mode) {
  if (!mode) return genre; const k = `${genre}~${mode}`;
  if (!GEN[k]) { const M = modal(GEN[genre], mode); if (M === GEN[genre]) return genre; GEN[k] = M; }
  return k;
}
const isMinorG = (G) => G.scale.includes(3) && !G.scale.includes(4);

// ---------------------------------------------------------------- shared state (newest edit wins, field by field)
let myBand = null, viewCache = null, maxSeen = 0, lam = 0, flushT = null;
const BandLog = [];
const userColor = (u) => { const c = u?.color; return c?.css ?? (typeof c === "string" ? c : c ? String(c) : "#d9b45a"); };
function parseF(f) { if (typeof f === "string") { try { return JSON.parse(f); } catch { return null; } } return f ?? null; }
function myF() { if (!myBand) { const f = parseF(game.user.flags?.[MOD]?.band); myBand = f?.f ? f : { f: {} }; } return myBand.f; }
function bandView() {
  if (viewCache) return viewCache;
  const W = {};
  for (const u of game.users) {
    const f = u.id === game.user.id ? myF() : parseF(u.flags?.[MOD]?.band)?.f; if (!f) continue;
    for (const [key, val] of Object.entries(f)) { if (!Array.isArray(val)) continue; const [v, at] = val; if (at > maxSeen) maxSeen = at; if (!W[key] || at > W[key][1]) W[key] = [v, at, u.id]; }
  }
  const g = (key, d) => W[key] ? W[key][0] : d;
  const genre = GEN[g("song.genre")] ? g("song.genre") : "pop";
  const song = { genre, bpm: Math.max(60, Math.min(180, +g("song.bpm", GEN[genre].bpm) || GEN[genre].bpm)), key: +g("song.key", 0) || 0, t0: +g("song.t0", 0) || 0,
    sec: SECTIONS[g("song.sec")] && !SECTIONS[g("song.sec")].hidden ? g("song.sec") : "verse", secSt: +g("song.secSt", 0) || 0, secPrev: g("song.secPrev", "verse"),
    mode: ["major", "minor"].includes(g("song.mode")) ? g("song.mode") : "" };
  song.gk = modeKey(genre, song.mode);
  const cast = {}, spot = {};
  for (const C of CAST) {
    let last = null; for (const fld of ["loop", "loop2", "mute", "vol"]) { const w = W[`s.${C.k}.${fld}`]; if (w && (!last || w[1] > last[1])) last = w; }
    const ok = (id) => C.loops.some(l => l.id === id) ? id : "";
    const l1 = ok(g(`s.${C.k}.loop`, "")), l2 = C.two ? ok(g(`s.${C.k}.loop2`, "")) : "";
    const older = (W[`s.${C.k}.loop`]?.[1] ?? 0) <= (W[`s.${C.k}.loop2`]?.[1] ?? 0) ? "loop" : "loop2";
    cast[C.k] = { loop: l1, loop2: l2 === l1 ? "" : l2, older, mute: !!g(`s.${C.k}.mute`, false), vol: +g(`s.${C.k}.vol`, 0.8), by: last?.[2] ?? null };
    // a spotlight belongs to the song it was called in: once the beat restarts (new style, speed or setlist) the old one is void,
    // so it can't replay later when the step counter comes back around
    const sp = g(`spot.${C.k}`, null), spAt = W[`spot.${C.k}`]?.[1] ?? 0, t0At = W["song.t0"]?.[1] ?? 0;
    spot[C.k] = typeof sp === "number" && spAt >= t0At ? sp : null;
  }
  const guest = GUEST_K[g("guest", "")] ? g("guest", "") : "";
  return (viewCache = { song, cast, spot, guest });
}
function stamp() { lam = Math.max(lam + 0.001, Date.now() / 1000, maxSeen + 0.001); return lam; }
function bandSet(fields) {
  const at = stamp(), f = myF(); for (const [k, v] of Object.entries(fields)) f[k] = [v, at];
  viewCache = null; BandWin.win?.rendered && BandWin.win.refresh();
  clearTimeout(flushT); flushT = setTimeout(() => game.user.update({ [`flags.${MOD}.band`]: JSON.stringify(myBand) }), 450);   // quick runs of clicks go out as one save
}
const changeSong = (patch) => { const sec = bandView().song.sec; bandSet({ ...patch, "song.t0": now_(), "song.secSt": 0, "song.sec": sec === "drop" ? "chorus" : sec }); };
const keyName = (song) => { const G = GEN[song.gk ?? song.genre]; return NN[pcOf(G.tonic + song.key)] + (G.scale.includes(3) && !G.scale.includes(4) ? " minor" : G.scale.includes(4) ? " major" : ""); };
function nextBarStep() {
  const V = bandView(), STEP = 60 / V.song.bpm / 4;
  const st = Band.running ? Band.st : Math.floor((now_() - V.song.t0) / STEP);
  let b = (Math.floor(st / 16) + 1) * 16; if (b - st < 3) b += 16; return b;
}
function giveLoop(k, id) {
  const C = CAST_K[k], L = C?.loops.find(l => l.id === id); if (!L) return false; SND.click();
  let fld = "loop";
  if (C.two) { const S = bandView().cast[k]; fld = S.loop === id ? "loop" : S.loop2 === id ? "loop2" : !S.loop ? "loop" : !S.loop2 ? "loop2" : S.older; }   // a third sound replaces the one he started first
  bandSet({ [`s.${k}.${fld}`]: id, [`s.${k}.mute`]: false }); return true;
}
function bandDiff(prev, next, uid) {
  if (!prev) return; const who = nameOf(uid), say = (s) => { BandLog.unshift({ s: `${who} ${s}`, c: userColor(game.users.get(uid)) }); BandLog.length = Math.min(BandLog.length, 8); };
  if (prev.song.genre !== next.song.genre) say(`switched the genre to ${GEN[next.song.genre].name}`);
  if (prev.song.mode !== next.song.mode) say(next.song.mode === "major" ? "made it happy (major)" : next.song.mode === "minor" ? "made it sad (minor)" : "set it back to the style's own key");
  if (prev.song.bpm !== next.song.bpm) say(`set the tempo to ${next.song.bpm}`);
  if (prev.song.secSt !== next.song.secSt && next.song.secSt) say(`set the feel to ${SECTIONS[next.song.sec].label.replace(/:.*/, "")}`);
  if (prev.guest !== next.guest) say(next.guest ? `brought ${GUEST_K[next.guest].name} on stage` : "sent the guest home");
  for (const C of CAST) {
    const a = prev.cast[C.k], b = next.cast[C.k];
    for (const fld of ["loop", "loop2"]) if (a[fld] !== b[fld]) say(b[fld] ? `gave ${C.name} ${C.loops.find(l => l.id === b[fld]).label}` : `took a sound off ${C.name}`);
    if (a.mute !== b.mute) say(`${b.mute ? "muted" : "unmuted"} ${C.name}`);
    if (prev.spot[C.k] !== next.spot[C.k] && next.spot[C.k] != null) say(`put ${C.name} in the spotlight`);
  }
}

// ---------------------------------------------------------------- setlists
const SONG_FIELDS = (genre, cast, extra = {}) => {
  const f = { "song.genre": genre, "song.bpm": GEN[genre].bpm, "song.key": 0, "song.mode": "", "song.sec": "verse", "song.secSt": 0, ...extra };
  for (const C of CAST) { const v = cast[C.k]; const [a, b] = Array.isArray(v) ? v : [v ?? "", ""]; f[`s.${C.k}.loop`] = a; if (C.two) f[`s.${C.k}.loop2`] = b; f[`s.${C.k}.mute`] = false; }
  return f;
};
const STARTERS = [
  { name: "Battle Anthem", f: SONG_FIELDS("rock", { binko: "beat2", triton: ["lead", "guitar"], quickare: "rhythm", biggreen: "chant", ollie: "" }) },
  { name: "Boss Showdown", f: SONG_FIELDS("epic", { binko: "beat2", triton: ["", "brass"], quickare: "chords", biggreen: "opera", ollie: "breath" }) },
  { name: "Metal Brawl", f: SONG_FIELDS("rock", { binko: "beat2", triton: ["shred", "guitar"], quickare: "trick", biggreen: "beatbox2", ollie: "saxsolo" }, { "song.bpm": 150 }) },
  { name: "Saloon Shootout", f: SONG_FIELDS("frontier", { binko: "beat", triton: ["", "banjo"], quickare: "trick", biggreen: "hey", ollie: "whistle" }) },
  { name: "Tavern Night", f: SONG_FIELDS("frontier", { binko: "beat", triton: ["", "accordion"], quickare: "stride", biggreen: "doo", ollie: "harp" }) },
  { name: "Campfire", f: SONG_FIELDS("lofi", { binko: "beat", triton: ["", "lute"], quickare: "chords", biggreen: "ooh", ollie: "flute" }) },
  { name: "Moonlight", f: SONG_FIELDS("lofi", { binko: "", triton: ["", "theremin"], quickare: "ballad", biggreen: "hum", ollie: "ocarina" }, { "song.bpm": 70 }) },
  { name: "Chase!", f: SONG_FIELDS("synthwave", { binko: "beat2", triton: ["arp", "bass"], quickare: "sparkle", biggreen: "", ollie: "" }, { "song.bpm": 132 }) },
  { name: "Neon Cruise", f: SONG_FIELDS("synthwave", { binko: "beat", triton: ["lead", "bass"], quickare: "sparkle", biggreen: "aah", ollie: "shimmer" }) },
  { name: "Robot Rave", f: SONG_FIELDS("house", { binko: "vocoder", triton: ["arp", "bass"], quickare: "rhythm", biggreen: "aah", ollie: "pipes" }) },
  { name: "Beast Hunt", f: SONG_FIELDS("epic", { binko: "wobble", triton: ["", "brass"], quickare: "", biggreen: "howl", ollie: "didge" }) },
  { name: "Sneaking Around", f: SONG_FIELDS("funk", { binko: "break", triton: ["", "bass"], quickare: "", biggreen: "beatbox", ollie: "clarinet" }, { "song.bpm": 96 }) },
  { name: "Mirth Carnival", f: SONG_FIELDS("jazz", { binko: "beat", triton: ["", "upright"], quickare: "honky", biggreen: "doo", ollie: "sax" }) },
  { name: "Red Line Walk", f: SONG_FIELDS("bossa", { binko: "hands", triton: ["", "guitar"], quickare: "melody", biggreen: "throat", ollie: "breath" }) },
  { name: "Sad Goodbye", f: SONG_FIELDS("lofi", { binko: "", triton: ["", "strings"], quickare: "ballad", biggreen: "ooh", ollie: "flute" }, { "song.bpm": 68 }) },
  { name: "Dread", f: SONG_FIELDS("epic", { binko: "break", triton: ["", "organ"], quickare: "musicbox", biggreen: "throat", ollie: "" }, { "song.bpm": 72 }) },
  { name: "Dance Party", f: SONG_FIELDS("house", { binko: "beat2", triton: ["talk", "bass"], quickare: "rhythm", biggreen: "beatbox", ollie: "pipes" }) },
  { name: "Grand Overture", f: SONG_FIELDS("epic", { binko: "taiko", triton: ["strings", "horn"], quickare: "octaves", biggreen: "aah", ollie: "trumpet" }) },
  { name: "Jazz Club", f: SONG_FIELDS("jazz", { binko: "livekit", triton: ["", "upright"], quickare: "chords", biggreen: "doo", ollie: "muted" }) },
  { name: "Highland March", f: SONG_FIELDS("epic", { binko: "taiko", triton: ["timpani", "concert"], quickare: "", biggreen: "chant", ollie: "bagpipe" }, { "song.bpm": 100 }) },
  { name: "Eastern Garden", f: SONG_FIELDS("lofi", { binko: "hands", triton: ["", "koto"], quickare: "celesta", biggreen: "hum", ollie: "shaku" }, { "song.bpm": 72 }) },
  { name: "Chamber Waltz", f: SONG_FIELDS("pop", { binko: "", triton: ["", "cello"], quickare: "arpeg", biggreen: "lullaby", ollie: "oboe" }, { "song.bpm": 84 }) },
  { name: "Haunted Waltz", f: SONG_FIELDS("epic", { binko: "clock", triton: ["glass", "theremin"], quickare: "musicbox", biggreen: "monks", ollie: "" }, { "song.bpm": 70, "song.sec": "haunted" }) },
  { name: "Ragtime Saloon", f: SONG_FIELDS("frontier", { binko: "beat", triton: ["banjo", "tuba"], quickare: "ragtime", biggreen: "shanty", ollie: "harpchug" }) },
  { name: "Rainy Night", f: SONG_FIELDS("lofi", { binko: "rain", triton: ["warmpad", "fretless"], quickare: "wurli", biggreen: "harmony", ollie: "" }, { "song.bpm": 72 }) },
  { name: "Carnival of Mirth", f: SONG_FIELDS("jazz", { binko: "clock", triton: ["tuba", "glock"], quickare: "toy", biggreen: "yodel", ollie: "calliope" }) },
  { name: "Sunny Picnic", f: SONG_FIELDS("pop", { binko: "beat", triton: ["acoustic", "glock"], quickare: "chords", biggreen: "whistling", ollie: "recorder" }, { "song.mode": "major", "song.bpm": 110 }) },
  { name: "Victory Parade", f: SONG_FIELDS("epic", { binko: "concert", triton: ["brassfan", "strings"], quickare: "octaves", biggreen: "aah", ollie: "fanfare" }, { "song.mode": "major", "song.bpm": 104 }) },
  { name: "Island Vibes", f: SONG_FIELDS("reggae", { binko: "beat", triton: ["", "guitar"], quickare: "rhythm", biggreen: "doo", ollie: "sax" }) }
];
const allSongs = () => [...STARTERS.map(s => ({ ...s, starter: true })), ...(game.settings.get(MOD, "bandSongs")?.list ?? [])];
function songSnapshot() { const V = bandView(), f = { "song.genre": V.song.genre, "song.bpm": V.song.bpm, "song.key": V.song.key, "song.mode": V.song.mode, "song.sec": "verse", "song.secSt": 0 }; for (const C of CAST) { const S = V.cast[C.k]; f[`s.${C.k}.loop`] = S.loop; if (C.two) f[`s.${C.k}.loop2`] = S.loop2; f[`s.${C.k}.mute`] = S.mute; f[`s.${C.k}.vol`] = S.vol; } return f; }
function loadSong(song) { if (!song?.f) return; bandSet({ ...song.f, "song.t0": now_() }); }
HANDLERS.bandSong = async ({ song }) => {
  const all = foundry.utils.deepClone(game.settings.get(MOD, "bandSongs") ?? { list: [] });
  all.list = [song, ...(all.list ?? []).filter(s => s.name !== song.name)].slice(0, 60);
  await game.settings.set(MOD, "bandSongs", all);
};
HANDLERS.bandRelease = async ({ name, path, by }) => {
  let pl = game.playlists.getName("Spopify Releases");
  if (!pl) { const folder = game.folders.find(f => f.type === "Playlist" && f.name === "Moods"); pl = await Playlist.create({ name: "Spopify Releases", folder: folder?.id ?? null, mode: 0, fade: 2000 }); }
  await pl.createEmbeddedDocuments("PlaylistSound", [{ name: `${name} (${by})`, path, volume: 0.6, repeat: false }]);
  await ChatMessage.create({ speaker: { alias: "Spopify" }, content: `<div><h3 style="margin:0">🎧 New Lucky Clovers release</h3><p style="margin:.2em 0"><b>${esc(name)}</b>, recorded by ${esc(by)}. It's in the <b>Spopify Releases</b> playlist.</p></div>` });
};

// ---------------------------------------------------------------- recording a take for Spopify
const Rec = { mr: null, chunks: [], started: 0, timer: null };
function startRec() {
  if (!game.user.can("FILES_UPLOAD")) return ui.notifications.warn("Recording needs permission to upload files. Ask the GM.");
  if (!Band.running) Band.start(); if (!Band.recDest || typeof MediaRecorder === "undefined") return ui.notifications.warn("This browser can't record audio.");
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
  Rec.chunks = []; Rec.mr = new MediaRecorder(Band.recDest.stream, { mimeType: mime });
  Rec.mr.ondataavailable = (e) => { if (e.data.size) Rec.chunks.push(e.data); };
  Rec.mr.onstop = () => finishRec().catch(e => console.error("Rhine Stage | recording", e));
  Rec.mr.start(1000); Rec.started = performance.now(); Rec.timer = setTimeout(stopRec, 60000); BandWin.win?.refresh();
}
function stopRec() { clearTimeout(Rec.timer); if (Rec.mr?.state === "recording") Rec.mr.stop(); }
async function finishRec() {
  const blob = new Blob(Rec.chunks, { type: "audio/webm" }), secs = Math.round((performance.now() - Rec.started) / 1000); Rec.mr = null; BandWin.win?.refresh();
  if (secs < 2) return;
  const name = await foundry.applications.api.DialogV2.prompt({ window: { title: "Release this take on Spopify" }, content: `<p>${secs} seconds recorded. Name the track:</p><input name="n" type="text" value="${esc(GEN[bandView().song.genre].name)} take" autofocus>`, ok: { label: "Release", callback: (ev, b) => b.form.elements.n.value } }).catch(() => null);
  if (!name) return ui.notifications.info("Take discarded.");
  // on the web page, a take downloads to your computer
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${String(name).replace(/[^\w\- ]+/g, "").trim() || "take"}.webm`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  ui.notifications.info(`"${name}" saved to your downloads.`);
}

// ---------------------------------------------------------------- who hears it: the studio crowd, or the whole table
const jammers = () => game.users.filter(u => u.active && u.flags?.[MOD]?.bandJam === true);
const tableOn = () => !!game.settings.get(MOD, "bandTable")?.on;
function bandSync() {
  const open = !!BandWin.win?.rendered, hear = game.settings.get(MOD, "bandHear");
  const want = open ? !Band.userStopped : ((jammers().length > 0 || tableOn()) && hear);
  if (want && !Band.running) Band.start(); else if (!want && Band.running) Band.stop();
  if (Band.mg) Band.setVol(game.settings.get(MOD, "bandVol"));
  bandChip(); BandWin.win?.rendered && BandWin.win.refresh();
}
function bandChip() {
  let el = document.getElementById("rhine-bandchip"); const jam = jammers(), table = tableOn();
  if ((!jam.length && !table) || BandWin.win?.rendered) { el?.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "rhine-bandchip"; document.body.appendChild(el); }
  const hear = game.settings.get(MOD, "bandHear"), V = bandView();
  const playing = CAST.filter(C => (V.cast[C.k].loop || V.cast[C.k].loop2) && !V.cast[C.k].mute);
  el.innerHTML = `<style>#rhine-bandchip{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:80;background:#140f0bee;border:2px solid #d9b45a;border-radius:20px;padding:3px 10px;color:#f3e6c8;font-family:"Modesto Condensed",serif;font-size:16px;display:flex;gap:8px;align-items:center;box-shadow:0 2px 10px #000a}
#rhine-bandchip button{background:#3a2a1e;color:#f3e6c8;border:1px solid #d9b45a;border-radius:12px;font-family:inherit;font-size:14px;line-height:20px;padding:0 10px;cursor:pointer}#rhine-bandchip input{width:70px;accent-color:#d9b45a}</style>
<span>🍀 ${table ? "Table music" : "The band is jamming"}: <b>${esc(GEN[V.song.genre].name)}</b> ·</span>${playing.map(C => `<span style="color:${C.color}">●</span>${esc(C.name.replace("Captain ", ""))}`).join(" ") || "<i>nobody playing</i>"}
<button type="button" data-a="join">Join</button><button type="button" data-a="hear">${hear ? "🔊" : "🔇"}</button>${hear ? `<input type="range" min="0" max="1" step="0.05" value="${game.settings.get(MOD, "bandVol")}" title="Band volume">` : ""}`;
  el.querySelector('[data-a="join"]').onclick = () => BandWin.open();
  if (!isStudio()) { const j = el.querySelector('[data-a="join"]'); j.textContent = "In the Studio Room"; j.disabled = true; j.title = "The stage opens in the Studio Room scene"; }
  el.querySelector('[data-a="hear"]').onclick = () => game.settings.set(MOD, "bandHear", !hear);
  el.querySelector("input")?.addEventListener("change", e => game.settings.set(MOD, "bandVol", +e.target.value));
}
async function setTable(on) {
  if (!game.user.isGM) return;
  await game.settings.set(MOD, "bandTable", { on, by: game.user.id });
  if (on) {
    for (const p of game.playlists.playing) await p.stopAll();                 // the band replaces the playlists while it's on
    const name = canvas.scene?.flags?.rhine?.stageSong; const s = name && allSongs().find(x => x.name === name); if (s) loadSong(s);
  }
}
Hooks.once("init", () => {
  game.settings.register(MOD, "bandHear", { name: "Lucky Clovers' Stage: hear the band", hint: "Hear the band when someone is playing on the stage, or when the GM turns on table music.", scope: "client", config: true, type: Boolean, default: true, onChange: () => bandSync() });
  game.settings.register(MOD, "bandVol", { scope: "client", config: false, type: Number, default: 0.6, onChange: () => bandSync() });
  game.settings.register(MOD, "bandSongs", { scope: "world", config: false, type: Object, default: { list: [] } });
  game.settings.register(MOD, "bandTable", { scope: "world", config: false, type: Object, default: { on: false }, onChange: () => { viewCache = null; bandSync(); } });
});
Hooks.once("ready", () => { if (game.user.flags?.[MOD]?.bandJam) game.user.update({ [`flags.${MOD}.bandJam`]: false }); setTimeout(bandSync, 1500); canvas.app?.ticker.add(stageTokens); });
Hooks.on("userConnected", () => { viewCache = null; bandSync(); });
Hooks.on("updateUser", (user, changes) => {
  const f = changes.flags?.[MOD]; if (!f) return;
  if ("band" in f) { const prev = viewCache ?? bandView(); viewCache = null; if (user.id !== game.user.id) { try { bandDiff(prev, bandView(), user.id); } catch (e) {} } BandWin.win?.rendered && BandWin.win.refresh(); bandChip(); }
  if ("bandJam" in f) bandSync();
});
Hooks.on("canvasReady", () => {
  if (!game.user.isGM || primaryGM()?.id !== game.user.id || !tableOn()) return;
  const name = canvas.scene?.flags?.rhine?.stageSong; const s = name && allSongs().find(x => x.name === name); if (s) loadSong(s);
});

// ---- tokens bounce in time with their character's sound
function stageTokens() {
  if (!canvas.ready) return;
  // asleep while the band is quiet: settle any token mid-bounce once, then do nothing each frame
  if (!Band.running) { if (stageTokens.idle) return; for (const tok of canvas.tokens?.placeables ?? []) { const m = tok.mesh; if (m && m._rbPivot !== undefined) m.pivot.y = m._rbPivot; } stageTokens.idle = true; return; }
  stageTokens.idle = false;
  const tn = performance.now();
  if (!castIds || tn - castIdsAt > 3000) { castIds = Object.fromEntries([...CAST.map(C => [C.k, castActor(C)?.id]), ...GUESTS.map(g => ["g:" + g.id, findActor(g.find)?.id])]); castIdsAt = tn; }
  const guest = viewCache?.guest;
  for (const [k, aid] of Object.entries(castIds)) {
    if (!aid) continue; const hk = k.startsWith("g:") ? (guest === k.slice(2) ? "guest" : null) : k;
    const p = Band.running && hk ? Math.exp(-(tn - (Band.hits[hk] ?? 0)) / 130) : 0;
    for (const tok of canvas.tokens?.placeables ?? []) {
      if (tok.actor?.id !== aid || !tok.mesh) continue; const m = tok.mesh;
      if (m._rbPivot === undefined) m._rbPivot = m.pivot.y;
      m.pivot.y = m._rbPivot + (p > 0.02 ? (10 * p) / (Math.abs(m.scale.y) || 1) : 0);
    }
  }
}

// ---------------------------------------------------------------- the click-through guide (❓ in the stage, and automatically the first time)
const STAGE_TOUR = [
  { sel: ".st-stage", title: "Welcome to the stage 🍀", text: "This is the Lucky Clovers' band. Each head is a band member, and each one plays their own instrument. Grey heads are waiting for a sound." },
  { sel: ".st-tray", title: "The sounds", text: "Each tab holds one character's sounds, sorted into families: Ollie's flutes, reeds, saxes and horns; Quickare's grand piano, saloon keys and trick shots; Triton's keytar plus a whole orchestra; Big Green's voices and beast calls; and Binko's DJ set. Click a tab, or a character's name, to see theirs." },
  { pre: (win) => win.setTab?.("ollie"), sel: '.st-ico[data-k="ollie"][data-l="flute"]', also: '.st-ch[data-k="ollie"] .st-hw', title: "Give someone a sound", text: "Drag a sound onto its character, or just click it. <b>Try it now:</b> click Ollie's <b>Flute tune</b>.", tryIt: (V) => !!V.cast.ollie.loop, done: "Nice! Ollie lights up and plays." },
  { sel: '.st-ch[data-k="ollie"] .st-hw', title: "Mute or stop them", text: "Click a playing head to mute it (it goes grey with a 🤫). Drag its little badge off the head to stop that sound completely." },
  { sel: '.st-ch[data-k="ollie"] .st-ctl', title: "Each character's buttons", text: "🔇 mutes them for everyone. 🎧 solos them for <i>you only</i>, so you can hear what they're doing. ⭐ gives them a two-bar spotlight solo. ✕ stops them. The slider sets their volume." },
  { sel: '.st-ch[data-k="triton"]', title: "Triton plays two things", text: "Captain Triton plays every instrument, and he can play <i>any two</i> at once: two keytar parts, strings and horns, a banjo and a tuba. Pick a third and it replaces the one he started first. Look for his second badge." },
  { sel: ".st-heads", title: "Build a song together", text: "Everyone in the studio shares this stage, and anyone can set anyone. Every sound fits every genre, so stack them however you like. The heads bounce in time, and so do their tokens on the map." },
  { sel: ".st-stage", title: "Combo bonuses ✨", text: "Some pairs unlock a bonus after two bars together: a banner, spinning rings and an extra layer. Try Quickare's <b>Saloon stride</b> + Ollie's <b>Harmonica</b>, Binko's <b>beat</b> + Triton's <b>keytar</b>, or Big Green's <b>Ooh</b> + Ollie's <b>Flute</b>. Get all five playing for the <b>Full band!</b> bonus." },
  { sel: ".st-song", title: "Style, speed and feel", text: "This row changes the <i>whole band</i> at once. <b>Style</b> is the kind of music (Rock, Swing Jazz, Lo-fi, Frontier, Epic Orchestral and more). <b>Speed</b> goes from 🐢 Slow to ⚡ Faster. <b>Feel</b> picks a song part or a mood. Everyone's sound follows. ⚙️ Fine-tune has happy (major) or sad (minor), the exact tempo and the key." },
  { sel: ".st-bar .feelw", title: "The feel", text: "Feel changes how the <i>whole band</i> sounds at once, for everyone, at the start of the next bar. Song parts: <b>Intro</b>, <b>Chorus</b> and the <b>💥 Drop</b> (Binko alone for a bar, then the cannon). Moods: Unplugged, Breakdown, Whisper, Campfire, Dreamy, Underwater, Cathedral, Echo canyon, Old radio, Haunted, Battle and Stadium." },
  { sel: ".st-top .songs", also: ".st-top .save", title: "Setlists", text: "Pick a ready-made mix like <b>Battle Anthem</b> or <b>Campfire</b> to start fast. 💾 saves your own mix so anyone can load it later." },
  { sel: ".st-bar .rec", title: "Record a take", text: "⏺ records up to 60 seconds. Name it, and it's released in the <b>Spopify Releases</b> playlist for the table to replay." },
  { gm: true, sel: ".st-top .guestsel", title: "Guest seat (GM)", text: "Seat a guest: Cat bleats on the beat, Hoodwink honks and rings his bell, Saguaro plays his hide drum." },
  { gm: true, sel: ".st-top .table", also: ".st-top .pin", title: "Table music (GM)", text: "🎙️ makes the stage the table's music for everyone online, even with this window closed (it stops the playlists). 📌 saves the current mix to this scene, so it plays whenever the party is here with table music on." },
  { sel: ".st-top .go", also: ".st-top .mv", title: "Listening", text: "▶/■ starts or stops the sound for you, and 🔈 is your own volume. While someone is on the stage, players elsewhere see a little bar at the top of the screen to join or mute." },
  { sel: ".st-top .help", title: "That's it! 🎶", text: "Click <b>❓</b> any time to see this guide again. Now go make some noise." }
];
const TOUR_CSS = `
.st-tour{position:absolute;inset:0;z-index:50;pointer-events:none}
.st-tour .hole{position:absolute;border-radius:10px;box-shadow:0 0 0 9999px #000b,0 0 0 3px #ffd76a,0 0 24px 6px #ffd76a88;transition:all .3s ease;pointer-events:none}
.st-tour .hole2{position:absolute;border-radius:10px;box-shadow:0 0 0 3px #ffd76a,0 0 24px 6px #ffd76a88;transition:all .3s ease;pointer-events:none}
.st-tour .card{position:absolute;width:330px;background:#1d1510;border:2px solid #d9b45a;border-radius:10px;padding:10px 12px;box-shadow:0 6px 24px #000c;pointer-events:auto;color:#f3e6c8;font-family:"Modesto Condensed",serif;transition:top .3s,left .3s}
.st-tour .card h3{margin:0 0 4px;font-size:21px;color:#ffd76a;border:none}
.st-tour .card p{margin:0 0 8px;font-size:15px;line-height:1.3}
.st-tour .card .ok{color:#7fe08a;font-size:15px;margin:-4px 0 8px}
.st-tour .row{display:flex;align-items:center;gap:6px}
.st-tour .row span{font-size:13px;opacity:.7;margin-right:auto}
.st-tour button{background:#3a2a1e;color:#f3e6c8;border:1px solid #d9b45a;border-radius:4px;font-family:inherit;font-size:15px;line-height:22px;padding:0 10px;width:auto;cursor:pointer}
.st-tour button.next{background:#d9b45a;color:#140f0b}
.st-tour .dots{display:flex;gap:3px;margin-bottom:6px}.st-tour .dots i{width:7px;height:7px;border-radius:50%;background:#5a4632}.st-tour .dots i.on{background:#ffd76a}`;
function stageTour(win, start = 0) {
  const root = win.element?.querySelector(".window-content"); if (!root) return;
  root.querySelector(".st-tour")?.remove(); clearInterval(win._tourT);
  const steps = STAGE_TOUR.filter(s => !s.gm || game.user.isGM);
  const box = document.createElement("div"); box.className = "st-tour";
  box.innerHTML = `<style>${TOUR_CSS}</style><div class="hole"></div><div class="hole2"></div><div class="card"><div class="dots">${steps.map(() => "<i></i>").join("")}</div><h3></h3><p></p><div class="ok"></div>
    <div class="row"><span></span><button type="button" class="skip">Skip</button><button type="button" class="back">◀ Back</button><button type="button" class="next">Next ▶</button></div></div>`;
  root.style.position = "relative"; root.appendChild(box);
  const hole = box.querySelector(".hole"), hole2 = box.querySelector(".hole2"), card = box.querySelector(".card");
  let i = Math.max(0, Math.min(start, steps.length - 1));
  const rectOf = (el) => { const r = el.getBoundingClientRect(), R = root.getBoundingClientRect(); return { x: r.left - R.left + root.scrollLeft, y: r.top - R.top + root.scrollTop, w: r.width, h: r.height }; };
  const unite = (els) => { const rs = els.map(rectOf); const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y)); return { x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y }; };
  const place = () => {
    const S = steps[i]; const els = S.all ? [...root.querySelectorAll(S.sel)] : [root.querySelector(S.sel)].filter(Boolean);
    const extra = S.also ? root.querySelector(S.also) : null;
    const pad = 6;
    if (els.length) {
      els[0].scrollIntoView({ block: "nearest", behavior: "smooth" });
      const r = unite(els); Object.assign(hole.style, { left: `${r.x - pad}px`, top: `${r.y - pad}px`, width: `${r.w + pad * 2}px`, height: `${r.h + pad * 2}px`, display: "block" });
      const r2 = extra ? rectOf(extra) : null;
      if (r2) Object.assign(hole2.style, { left: `${r2.x - pad}px`, top: `${r2.y - pad}px`, width: `${r2.w + pad * 2}px`, height: `${r2.h + pad * 2}px`, display: "block" }); else hole2.style.display = "none";
      // the card goes below the highlight if there's room, otherwise above, and never off the window
      const W = root.clientWidth, H = Math.max(root.scrollHeight, root.clientHeight), ch = card.offsetHeight || 170;
      let top = r.y + r.h + pad + 12; if (top + ch > root.scrollTop + root.clientHeight && r.y - ch - 18 > root.scrollTop) top = r.y - ch - pad - 12;
      top = Math.max(root.scrollTop + 8, Math.min(top, H - ch - 8));
      const left = Math.max(8, Math.min(r.x + r.w / 2 - 165, W - 338));
      Object.assign(card.style, { top: `${top}px`, left: `${left}px` });
    } else { hole.style.display = "none"; hole2.style.display = "none"; Object.assign(card.style, { top: "40%", left: "calc(50% - 165px)" }); }
  };
  const show = () => {
    const S = steps[i]; try { S.pre?.(win); } catch (e) {}
    card.querySelector("h3").innerHTML = S.title; card.querySelector("p").innerHTML = S.text; card.querySelector(".ok").textContent = "";
    card.querySelectorAll(".dots i").forEach((d, j) => d.classList.toggle("on", j <= i));
    card.querySelector(".row span").textContent = `${i + 1} of ${steps.length}`;
    card.querySelector(".back").style.visibility = i ? "visible" : "hidden";
    card.querySelector(".next").textContent = i === steps.length - 1 ? "Let's play! 🎶" : "Next ▶";
    // a hands-on step lets clicks through to the window
    box.style.pointerEvents = "none"; hole.style.boxShadow = S.tryIt ? "0 0 0 9999px #0007,0 0 0 3px #7fe08a,0 0 24px 6px #7fe08a88" : "";
    requestAnimationFrame(place); setTimeout(place, 350);
  };
  const end = () => { clearInterval(win._tourT); box.remove(); game.settings.set(MOD, "stageTourSeen", true).catch(() => {}); };
  card.querySelector(".next").onclick = () => { if (i >= steps.length - 1) return end(); i++; show(); };
  card.querySelector(".back").onclick = () => { if (i > 0) { i--; show(); } };
  card.querySelector(".skip").onclick = end;
  win._tourT = setInterval(() => {
    if (!win.rendered || !box.isConnected) return clearInterval(win._tourT);
    const S = steps[i]; place();
    if (S.tryIt && S.tryIt(bandView()) && !card.querySelector(".ok").textContent) { card.querySelector(".ok").textContent = `✓ ${S.done}`; card.querySelector(".next").animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 500, iterations: 2 }); }
  }, 400);
  show();
}
Hooks.once("init", () => game.settings.register(MOD, "stageTourSeen", { scope: "client", config: false, type: Boolean, default: false }));

// ---------------------------------------------------------------- the stage window
const STAGE_CSS = `
.rhine-band .window-content{background:#0e0a08;color:#e7d1b1;font-family:"Modesto Condensed",serif;padding:8px 10px;overflow:auto}
.st button{font-family:inherit;cursor:pointer}
.st-top{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:6px}
.st-top>button,.st-bar button{background:#3a2a1e;color:#e7d1b1;border:1px solid #d9b45a;font-size:15px;padding:1px 9px;border-radius:4px;line-height:23px;width:auto;flex:0 0 auto}
.st-top .go.on{background:#3f8f5a}.st-top .help{background:#2a3f5a;border-color:#8ab6ff}.st-top .table.on{background:#8a3a22}
.st-top select{background:#2a1e16;color:#f3e6c8;border:1px solid #d9b45a;font-family:inherit;font-size:15px;height:26px;width:auto}
.st-top label{display:flex;align-items:center;gap:4px;font-size:15px;white-space:nowrap}.st-top input[type=range]{width:76px;accent-color:#d9b45a}
.st-status{display:flex;align-items:center;gap:12px;font-size:14px;margin-bottom:4px;flex-wrap:wrap}
.st-chord{font-size:26px;color:#d9b45a;min-width:64px;text-align:center}.st-beat{display:flex;gap:3px}.st-beat i{width:10px;height:10px;border-radius:50%;background:#3a2a1e;border:1px solid #d9b45a55}.st-beat i:nth-child(4n+1){border-color:#d9b45a}.st-beat i.lit{background:#d9b45a}
.st-stage{--sec:#d9b45a;position:relative;padding:26px 8px 12px;border-radius:14px;overflow:hidden;border:1px solid #4a3828;min-height:290px;
  background:radial-gradient(ellipse at 50% 120%,#2a1a10 0%,#160e14 45%,#0b0708 100%)}
.st-stage::after{content:"";position:absolute;left:0;right:0;bottom:0;height:40px;background:linear-gradient(#2a1a10,#120b07);border-top:3px solid #6a4a2a;z-index:0}
.st-beams{position:absolute;inset:0;pointer-events:none;z-index:0}
.st-beams i{position:absolute;top:-40px;width:180px;height:420px;transform-origin:50% 0;background:linear-gradient(180deg,var(--sec) 0%,transparent 80%);opacity:.13;filter:blur(6px);clip-path:polygon(45% 0,55% 0,100% 100%,0 100%)}
.st-beams i:nth-child(1){left:12%;animation:stBeamL 6s ease-in-out infinite alternate}.st-beams i:nth-child(2){right:12%;animation:stBeamR 7s ease-in-out infinite alternate}.st-beams i:nth-child(3){left:44%;animation:stBeamL 5s ease-in-out infinite alternate-reverse;opacity:.08}
@keyframes stBeamL{from{transform:rotate(-28deg)}to{transform:rotate(22deg)}}@keyframes stBeamR{from{transform:rotate(26deg)}to{transform:rotate(-24deg)}}
.st-stage[data-sec=chorus] .st-beams i{opacity:.24}.st-stage[data-sec=intro] .st-beams i{opacity:.07}
.st-stage[data-sec=dropbuild]{animation:stStrobe .25s steps(2) infinite}@keyframes stStrobe{50%{background:radial-gradient(ellipse at 50% 120%,#5a1a10 0%,#2a0e10 60%,#0b0708 100%)}}
.st-stage.slam{animation:stSlam .6s}@keyframes stSlam{0%{transform:scale(1.03);filter:brightness(2)}100%{transform:none;filter:none}}
.st-stage.full{box-shadow:inset 0 0 70px #ffd76a66}
.st-heads{position:relative;z-index:1;display:flex;flex-wrap:wrap;justify-content:space-around;align-items:flex-end;gap:6px 4px}
.st-ch{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;width:150px}
.st-ch.guest{width:120px}
.st-hw{position:relative;width:112px;height:112px;margin-bottom:4px;will-change:transform}
.st-ch.guest .st-hw{width:88px;height:88px}
.st-head{width:100%;height:100%;border-radius:50%;object-fit:cover;border:4px solid #3a2a1e;background:#1a120c;filter:grayscale(1) brightness(.35);transition:filter .35s,border-color .35s}
.st-emo{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:52px;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;pointer-events:none}
.st-ring{position:absolute;inset:-6px;border-radius:50%;pointer-events:none}
.st-ch.on .st-head{filter:none;border-color:var(--c)}.st-ch.on.mute .st-head{filter:grayscale(.85) brightness(.55)}
.st-ch.combo .st-ring{border:3px dashed var(--cc,#ffd76a);animation:stSpin 3s linear infinite}@keyframes stSpin{to{transform:rotate(360deg)}}
.st-hw.drop .st-head{border-color:#fff;box-shadow:0 0 18px #fff8}.st-hw.no{animation:stNo .35s}@keyframes stNo{25%{translate:-8px 0}75%{translate:8px 0}}
.st-hw.popin{animation:stPop .55s cubic-bezier(.3,1.6,.5,1)}@keyframes stPop{0%{scale:.55;rotate:-25deg}100%{scale:1;rotate:0deg}}
.st-hw.popout{animation:stOut .45s}@keyframes stOut{0%{scale:1}40%{scale:.82}100%{scale:1}}
.st-badge{position:absolute;width:38px;height:38px;border-radius:50%;background:var(--c);border:3px solid #0e0a08;display:none;align-items:center;justify-content:center;font-size:20px;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;cursor:grab;z-index:2}
.st-b1{right:-12px;top:-8px}.st-b2{left:-12px;top:-8px}.st-badge.show{display:flex}
.st-shh{position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);font-size:24px;display:none}.st-ch.mute.on .st-shh{display:block}
.st-notes{position:absolute;inset:0;pointer-events:none;overflow:visible}
.st-note{position:absolute;bottom:60%;font-size:18px;color:var(--c);text-shadow:0 0 6px #000;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;animation:stNote 1.5s ease-out forwards}
@keyframes stNote{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-90px) scale(1.15) rotate(var(--rot))}}
.st-name{font-size:18px;color:var(--c)}.st-inst{font-size:12.5px;opacity:.85;text-align:center;min-height:30px;line-height:14px}
.st-ctl{display:flex;gap:2px;align-items:center;flex-wrap:wrap;justify-content:center}.st-ctl button{background:#2a1e16;border:1px solid #5a4632;color:#e7d1b1;border-radius:4px;font-size:12px;line-height:18px;padding:0 4px;width:auto}
.st-ctl button.act{background:#5a4028;border-color:#d9b45a}.st-ctl input{width:52px;accent-color:#d9b45a}
.st-by{font-size:11px;opacity:.55;min-height:13px}
.st-combo{position:absolute;z-index:3;left:50%;top:6px;transform:translateX(-50%);font-size:24px;color:var(--cc,#ffd76a);text-shadow:0 0 10px #000,0 0 18px var(--cc,#ffd76a);pointer-events:none;white-space:nowrap;opacity:0;transition:opacity .3s}
.st-combo.show{opacity:1;animation:stCombo .6s cubic-bezier(.3,1.6,.5,1)}@keyframes stCombo{from{transform:translateX(-50%) scale(.4)}to{transform:translateX(-50%) scale(1)}}
.st-confetti{position:absolute;inset:0;pointer-events:none;z-index:4;overflow:hidden}
.st-conf{position:absolute;top:-30px;font-size:20px;animation:stFall var(--d) linear forwards;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif}
@keyframes stFall{to{transform:translate(var(--dx),360px) rotate(var(--rot));opacity:.2}}
.st-bar{display:flex;align-items:center;gap:6px;margin:7px 0 4px;flex-wrap:wrap}
.st-song{background:#1b130e;border:1px solid #3a2a1e;border-radius:8px;padding:5px 8px;gap:10px}
.st-bar .stylew{display:flex;align-items:center;gap:6px;font-size:15px;white-space:nowrap}
.st-bar .gen{background:#2a1e16;color:#f3e6c8;border:2px solid #d9b45a;font-family:inherit;font-size:15px;height:28px;width:auto;border-radius:5px}
.st-bar .speed{display:flex;align-items:center;gap:3px;font-size:15px}.st-bar .speed>span{margin-right:3px}
.st-bar .speed button{background:#2a1e16;color:#e7d1b1;border:1px solid #5a4632;font-size:14px;line-height:24px;padding:0 8px;border-radius:5px}
.st-bar .speed button.act{background:#d9b45a;color:#140f0b;border-color:#fff}
.st-bar .finebtn{margin-left:auto;font-size:13px!important;opacity:.8}
.st-fine{display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:14px;margin:0 0 4px;padding:4px 8px;border:1px dashed #5a4632;border-radius:8px}
.st-fine[hidden]{display:none}.st-fine input[type=range]{width:120px;accent-color:#d9b45a;vertical-align:middle}.st-fine select{background:#2a1e16;color:#f3e6c8;border:1px solid #d9b45a;font-family:inherit;height:24px;width:auto}.st-fine span{opacity:.6;font-size:12.5px}
.st-bar .feelw{display:flex;align-items:center;gap:6px;font-size:15px;white-space:nowrap}
.st-bar .feel{background:#2a1e16;color:#f3e6c8;border:2px solid var(--fc,#d9b45a);font-family:inherit;font-size:15px;height:28px;width:auto;min-width:250px;border-radius:5px}
.st-bar .rec.on{background:#b02a2a;animation:stRec 1s infinite}@keyframes stRec{50%{opacity:.6}}
.st-tabs{display:flex;gap:4px;flex-wrap:wrap}
.st-tab{flex:1 1 150px;display:flex;align-items:center;justify-content:flex-start;gap:7px;height:auto;min-height:54px;margin:0;background:#1b130e;border:1px solid #3a2a1e;border-bottom:none;border-top:3px solid var(--c);border-radius:8px 8px 0 0;color:#e7d1b1;padding:4px 8px;opacity:.6;width:auto;font-size:16px;line-height:1.1;text-align:left;min-width:0}
.st-tab:hover{opacity:.85}.st-tab.act{opacity:1;background:#261a12}
.st-tab img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid var(--c);flex:0 0 auto;margin:0}
.st-tab>span{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:1px;min-width:0;flex:1 1 auto;margin:0;padding:0}
.st-tab b,.st-tab small,.st-tab .now{display:block;margin:0;padding:0;text-indent:0;text-align:left;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.st-tab b{color:var(--c);font-weight:normal}.st-tab small{font-size:11.5px;opacity:.75}
.st-tab .now{font-size:11.5px;font-style:normal;color:#ffd76a;height:13px;line-height:13px}
.st-group{display:none;background:#261a12;border:1px solid #3a2a1e;border-top:none;border-radius:0 0 8px 8px;padding:4px 8px;max-height:320px;overflow:auto}
.st-group.show{display:block}
.st-fam{display:flex;align-items:flex-start;gap:8px;padding:4px 0;border-bottom:1px dashed #3a2a1e}.st-fam:last-child{border-bottom:none}
.st-fam h6{flex:0 0 104px;margin:10px 0 0;font-size:13px;color:var(--c);font-weight:normal;border:none;text-align:right;line-height:1.1}
.st-icos{display:flex;flex-wrap:wrap;gap:4px}
.st-slot{font-size:12.5px;opacity:.75;text-align:center;margin:5px 0 1px;color:var(--c)}
.st-ico{width:60px;display:flex;flex-direction:column;align-items:center;cursor:grab;user-select:none}
.st-ico span{width:36px;height:36px;border-radius:50%;background:var(--c);display:flex;align-items:center;justify-content:center;font-size:19px;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;border:2px solid #0e0a08;box-shadow:0 2px 4px #000a;transition:transform .1s}
.st-ico:hover span{transform:scale(1.15) rotate(-6deg)}.st-ico small{font-size:10px;line-height:10.5px;text-align:center;margin-top:1px;opacity:.85}
.st-ico.used span{filter:grayscale(1) brightness(.45)}.st-ico.used small{opacity:.35}
.st-log{margin-top:5px;font-size:13px;opacity:.85;min-height:16px}.st-help{font-size:12px;opacity:.6;margin-top:2px}`;

const SPEEDS = [[0.75, "🐢 Slow"], [1, "🚶 Normal"], [1.2, "🏃 Fast"], [1.4, "⚡ Faster"]];
function famsOf(C) {
  const out = [], by = {};
  for (const L of C.loops) { const fam = L.fam ?? "Sounds"; if (!by[fam]) out.push(by[fam] = { fam, loops: [] }); by[fam].loops.push(L); }
  if (C.two && out[0]) out[0].slotNote = "Triton plays any two of these at once. Pick a third and it replaces the one he started first.";
  return out;
}
// ---- the stage lives in one scene: the Studio Room. Landing there opens it for everyone; leaving closes it.
const isStudio = (sc = canvas?.scene) => !!(sc?.flags?.[MOD]?.studio || sc?.flags?.rhine?.studio);
Hooks.on("canvasReady", () => {
  if (isStudio()) setTimeout(() => { if (!BandWin.win?.rendered) BandWin.open(); }, 600);
  else if (BandWin.win?.rendered) BandWin.win.close();
  bandChip();
});
class BandWin extends foundry.applications.api.ApplicationV2 {
  static win = null;
  static DEFAULT_OPTIONS = { id: "rhine-band", classes: ["rhine-band"], window: { title: "🍀 The Lucky Clovers' Stage", resizable: true }, position: { width: 1060, height: "auto" } };
  static open() {
    if (!isStudio()) return ui.notifications.info("The Lucky Clovers' stage is in the Studio Room. Head there to play.");
    this.win ??= new BandWin(); this.win.render(true);
  }
  prev = {};
  async _renderHTML() {
    const el = document.createElement("div"); el.className = "st";
    const head = (k, color, names, emo, guest = false) => { const src = headImg(names);
      return `<div class="st-ch${guest ? " guest" : ""}" data-k="${k}" style="--c:${color}"><div class="st-hw"><div class="st-ring"></div>
        ${src ? `<img class="st-head" src="${esc(src)}" draggable="false">` : `<div class="st-head"></div><span class="st-emo">${emo}</span>`}
        <div class="st-notes"></div><span class="st-badge st-b1" draggable="true" data-slot="loop" title="Drag off to stop"></span><span class="st-badge st-b2" draggable="true" data-slot="loop2" title="Drag off to stop"></span><span class="st-shh">🤫</span></div>
        <div class="st-name"></div><div class="st-inst"></div>${guest ? "" : `<div class="st-ctl"><button type="button" class="mute" title="Mute for everyone">🔇</button><button type="button" class="solo" title="Solo (only you hear it)">🎧</button><button type="button" class="spot" title="Spotlight solo: two bars, starting next bar">⭐</button><button type="button" class="stop" title="Stop this character">✕</button><input type="range" class="vol" min="0" max="1" step="0.05" title="Volume"></div>`}<div class="st-by"></div></div>`; };
    el.innerHTML = `<style>${STAGE_CSS}</style>
<div class="st-top">
  <button type="button" class="go">▶ Listen</button><button type="button" class="help" title="How to play: a quick click-through guide">❓ How to play</button>
  <select class="songs"></select>
  <button type="button" class="save">💾 Save mix</button><button type="button" class="clear">🧹 Clear</button>
  ${game.user.isGM ? `<select class="guestsel" title="Seat a guest (GM)"><option value="">🎟️ No guest</option>${GUESTS.map(g => `<option value="${g.id}">${g.icon} ${g.name}</option>`).join("")}</select>
  <button type="button" class="table" title="Everyone online hears the band as the table's music">🎙️ Table music</button><button type="button" class="pin" title="Save this mix and play it whenever the party is on this scene (with table music on)">📌 Use for this scene</button>` : ""}
  <label style="margin-left:auto">🔈 <input type="range" class="mv" min="0" max="1" step="0.05"></label>
</div>
<div class="st-status"><span class="st-chord">—</span><span class="st-beat">${"<i></i>".repeat(16)}</span><span class="st-blurb"></span><span class="st-who" style="margin-left:auto"></span></div>
<div class="st-stage" data-sec="verse"><div class="st-beams"><i></i><i></i><i></i></div><div class="st-combo"></div><div class="st-confetti"></div>
  <div class="st-heads">${CAST.map(C => head(C.k, C.color, C.find, "🙂")).join("")}${head("guest", "#d8c8a8", [], "🎟️", true)}</div>
</div>
<div class="st-bar st-song">
  <label class="stylew" title="The kind of music the whole band plays">Style <select class="gen">${GEN_ORDER.map(k => `<option value="${k}">${GEN[k].name}</option>`).join("")}</select></label>
  <span class="speed" title="How fast the band plays"><span>Speed</span>${SPEEDS.map(([m, lab]) => `<button type="button" data-sp="${m}">${lab}</button>`).join("")}</span>
  <label class="feelw" title="Changes how the whole band sounds, at the start of the next bar, for everyone">Feel <select class="feel"><optgroup label="Song parts">${Object.entries(SECTIONS).filter(([k, f]) => f.song).map(([k, f]) => `<option value="${k}">${f.label}</option>`).join("")}</optgroup><optgroup label="Moods">${Object.entries(SECTIONS).filter(([k, f]) => !f.song && !f.hidden).map(([k, f]) => `<option value="${k}">${f.label}</option>`).join("")}</optgroup></select></label>
  <button type="button" class="finebtn" title="Exact tempo and musical key, for musicians">⚙️ Fine-tune</button>
  <button type="button" class="rec" title="Record up to 60 seconds and save it to your computer">⏺ Record take</button>
</div>
<div class="st-fine" hidden><label>Exact tempo <input type="range" class="bpm" min="60" max="180" step="1"> <b class="bpmv"></b> beats a minute</label>
  <label>Happy or sad <select class="mode"><option value="">The style's own</option><option value="major">☀️ Happy (major)</option><option value="minor">🌙 Sad (minor)</option></select></label>
  <label>Key <select class="key">${[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(n => `<option value="${n}">${n}</option>`).join("")}</select></label>
  <span>Optional. Style and Speed already pick good settings. Happy or sad works with every style.</span></div>
<div class="st-tray"><div class="st-tabs">${CAST.map(C => { const src = headImg(C.find); return `<button type="button" class="st-tab" data-k="${C.k}" style="--c:${C.color}">${src ? `<img src="${esc(src)}" draggable="false">` : ""}<span><b>${esc(C.name.replace("Captain ", ""))}</b><small>${esc(C.inst)} · ${C.loops.length} sounds</small><i class="now"></i></span></button>`; }).join("")}</div>
${CAST.map(C => `<div class="st-group" data-k="${C.k}" style="--c:${C.color}">${famsOf(C).map(F => `${F.slotNote ? `<div class="st-slot">${F.slotNote}</div>` : ""}<div class="st-fam"><h6>${esc(F.fam)}</h6><div class="st-icos">${F.loops.map(L => `<div class="st-ico" draggable="true" data-k="${C.k}" data-l="${L.id}" title="${esc(L.label)}"><span>${L.icon}</span><small>${esc(L.label)}</small></div>`).join("")}</div></div>`).join("")}</div>`).join("")}</div>
<div class="st-log"></div>
<div class="st-help">Pick a character's tab (or click their name) to see their sounds, then drag one onto them or just click it. Click a playing head to mute it, drag its badge away to stop it. ⭐ gives a character a two-bar solo. Pair the right sounds for combo bonuses, and get all five going for the full-band bonus. Style, Speed and Feel change the whole band at the next bar. New here? Click ❓ How to play.</div>`;
    return el;
  }
  _replaceHTML(r, c) { c.replaceChildren(r); }
  _onRender() {
    const el = this.element, q = (s) => el.querySelector(s);
    game.user.update({ [`flags.${MOD}.bandJam`]: true });
    Band.userStopped = false; bandSync();
    q(".go").onclick = () => { Band.userStopped = Band.running; bandSync(); this.refresh(); };
    q(".gen").onchange = (e) => changeSong({ "song.genre": e.target.value, "song.bpm": GEN[e.target.value].bpm, "song.key": 0 });
    q(".bpm").oninput = (e) => { q(".bpmv").textContent = e.target.value; };
    q(".bpm").onchange = (e) => changeSong({ "song.bpm": +e.target.value });
    q(".key").onchange = (e) => bandSet({ "song.key": +e.target.value });
    q(".mode").onchange = (e) => bandSet({ "song.mode": e.target.value });
    for (const b of el.querySelectorAll(".speed button")) b.onclick = () => { const V = bandView(); changeSong({ "song.bpm": Math.max(60, Math.min(180, Math.round(GEN[V.song.genre].bpm * +b.dataset.sp))) }); };
    q(".help").onclick = () => stageTour(this);
    q(".finebtn").onclick = () => { const f = q(".st-fine"); f.hidden = !f.hidden; q(".finebtn").classList.toggle("act", !f.hidden); };
    q(".songs").onchange = (e) => { const s = allSongs()[+e.target.value]; e.target.value = ""; if (s) loadSong(s); };
    q(".save").onclick = async () => {
      const name = await foundry.applications.api.DialogV2.prompt({ window: { title: "Save this mix" }, content: `<p>Name it:</p><input name="n" type="text" value="${esc(GEN[bandView().song.genre].name)} jam" autofocus>`, ok: { label: "Save", callback: (ev, b) => b.form.elements.n.value } }).catch(() => null);
      if (!name) return; await relay("bandSong", { song: { name: String(name).slice(0, 60), by: nameOf(game.user.id), at: Date.now(), f: songSnapshot() } }); ui.notifications.info(`Saved "${name}".`); setTimeout(() => this.refresh(), 800);
    };
    q(".clear").onclick = () => { const f = { guest: bandView().guest }; for (const C of CAST) { f[`s.${C.k}.loop`] = ""; if (C.two) f[`s.${C.k}.loop2`] = ""; } bandSet(f); };
    q(".table")?.addEventListener("click", () => setTable(!tableOn()));
    q(".pin")?.addEventListener("click", async () => {
      const sc = canvas.scene; if (!sc) return; const name = `Scene · ${sc.name}`;
      await relay("bandSong", { song: { name, by: nameOf(game.user.id), at: Date.now(), f: songSnapshot() } }); await sc.update({ "flags.rhine.stageSong": name });
      ui.notifications.info(`This mix now plays on "${sc.name}" whenever table music is on.`);
    });
    q(".guestsel")?.addEventListener("change", (e) => bandSet({ guest: e.target.value }));
    q(".mv").oninput = (e) => Band.setVol(+e.target.value);
    q(".mv").onchange = (e) => game.settings.set(MOD, "bandVol", +e.target.value);
    q(".feel").onchange = (e) => { const V = bandView(); bandSet({ "song.secPrev": Band.secNow === "dropbuild" ? "chorus" : (Band.secNow || V.song.sec), "song.sec": e.target.value, "song.secSt": nextBarStep() }); e.target.blur(); };
    q(".rec").onclick = () => Rec.mr ? stopRec() : startRec();
    for (const b of el.querySelectorAll(".st-tab")) b.onclick = () => this.setTab(b.dataset.k);
    this.setTab(this.tab ?? "ollie");
    for (const ico of el.querySelectorAll(".st-ico")) {
      ico.onpointerenter = () => preloadLoop(CAST_K[ico.dataset.k]?.loops.find(l => l.id === ico.dataset.l));
      ico.onclick = () => { const k = ico.dataset.k, C = CAST_K[k], L = C.loops.find(l => l.id === ico.dataset.l), S = bandView().cast[k], fld = S.loop === L.id ? "loop" : S.loop2 === L.id ? "loop2" : null;
        if (fld) bandSet({ [`s.${k}.${fld}`]: "" }); else giveLoop(k, L.id); };
      ico.ondragstart = (e) => { e.dataTransfer.setData("text/plain", JSON.stringify({ rb: 1, k: ico.dataset.k, l: ico.dataset.l })); e.dataTransfer.effectAllowed = "copy"; };
    }
    for (const ch of el.querySelectorAll(".st-ch")) {
      const k = ch.dataset.k, hw = ch.querySelector(".st-hw");
      if (k === "guest") continue;
      hw.ondragover = (e) => { e.preventDefault(); hw.classList.add("drop"); };
      hw.ondragleave = () => hw.classList.remove("drop");
      hw.ondrop = (e) => {
        e.preventDefault(); hw.classList.remove("drop"); let d; try { d = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
        if (d?.from) { if (d.from === k) this._keepBadge = true; return; }
        if (!d?.rb) return;
        if (d.k !== k) { hw.classList.remove("no"); void hw.offsetWidth; hw.classList.add("no"); ui.notifications.info(`That's ${CAST_K[d.k].name}'s sound. ${CAST_K[k].name} plays ${CAST_K[k].inst.toLowerCase()}.`); return; }
        giveLoop(k, d.l);
      };
      hw.onclick = (e) => { if (e.target.closest(".st-badge")) return; const S = bandView().cast[k]; if (S.loop || S.loop2) bandSet({ [`s.${k}.mute`]: !S.mute }); else this.setTab(k); };
      const nm = ch.querySelector(".st-name"); nm.onclick = () => this.setTab(k); nm.style.cursor = "pointer";
      for (const badge of ch.querySelectorAll(".st-badge")) {
        badge.ondragstart = (e) => { this._keepBadge = false; e.dataTransfer.setData("text/plain", JSON.stringify({ rb: 1, from: k })); };
        badge.ondragend = () => { if (!this._keepBadge) bandSet({ [`s.${k}.${badge.dataset.slot}`]: "" }); this._keepBadge = false; };
      }
      ch.querySelector(".mute").onclick = () => { const S = bandView().cast[k]; bandSet({ [`s.${k}.mute`]: !S.mute }); };
      ch.querySelector(".solo").onclick = () => { Band.solo = Band.solo === k ? null : k; this.refresh(); };
      ch.querySelector(".spot").onclick = () => { const S = bandView().cast[k]; if (!S.loop && !S.loop2) return ui.notifications.info(`Give ${CAST_K[k].name} a sound first, then they can take a solo.`); SND.click(); bandSet({ [`spot.${k}`]: nextBarStep() }); };
      ch.querySelector(".stop").onclick = () => bandSet({ [`s.${k}.loop`]: "", ...(CAST_K[k].two ? { [`s.${k}.loop2`]: "" } : {}) });
      ch.querySelector(".vol").onchange = (e) => bandSet({ [`s.${k}.vol`]: +e.target.value });
    }
    this.refresh();
    this.animate();
    if (!game.settings.get(MOD, "stageTourSeen")) setTimeout(() => this.rendered && stageTour(this), 700);
  }
  setTab(k) {
    const el = this.element; if (!el || !CAST_K[k]) return; this.tab = k;
    el.querySelectorAll(".st-tab").forEach(b => b.classList.toggle("act", b.dataset.k === k));
    el.querySelectorAll(".st-group").forEach(g => g.classList.toggle("show", g.dataset.k === k));
  }
  // ---- everything that moves
  animate() {
    cancelAnimationFrame(this._raf);
    const el = this.element, q = (s) => el.querySelector(s);
    const lights = [...el.querySelectorAll(".st-beat i")], chord = q(".st-chord"), stage = q(".st-stage"), comboEl = q(".st-combo");
    const heads = [...CAST.map(C => C.k), "guest"].map(k => ({ k, ch: el.querySelector(`.st-ch[data-k="${k}"]`), hw: el.querySelector(`.st-ch[data-k="${k}"] .st-hw`), ring: el.querySelector(`.st-ch[data-k="${k}"] .st-ring`), notes: el.querySelector(`.st-ch[data-k="${k}"] .st-notes`), lastHit: 0, lastNote: 0 }));
    let lastStep = -2, lastDrop = 0, comboShown = null;
    const spawnNote = (h, icon) => { const n = document.createElement("span"); n.className = "st-note"; n.textContent = Math.random() < 0.55 ? icon : ["♪", "♫", "♩", "♬"][Math.floor(Math.random() * 4)];
      n.style.left = `${30 + Math.random() * 40}%`; n.style.setProperty("--dx", `${(Math.random() - 0.5) * 70}px`); n.style.setProperty("--rot", `${(Math.random() - 0.5) * 60}deg`);
      n.addEventListener("animationend", () => n.remove()); h.notes.appendChild(n); if (h.notes.children.length > 8) h.notes.firstChild.remove(); };
    const anim = () => {
      if (!this.rendered) return;
      const V = bandView(), G = GEN[V.song.gk], s = Band.running ? Band.step : -1, tn = performance.now(), beatMs = 60000 / V.song.bpm;
      if (s !== lastStep) {
        lastStep = s;
        lights.forEach((l, j) => l.classList.toggle("lit", s >= 0 && s % 16 === j));
        const ch = G.prog[Math.max(0, s >> 4) % G.prog.length]; chord.textContent = s >= 0 ? chordName([ch[0] + V.song.key, ch[1]]) : "—";
        stage.dataset.sec = Band.running ? Band.secNow : "verse";
        stage.style.setProperty("--sec", SECTIONS[Band.secNow === "dropbuild" ? "drop" : Band.secNow]?.color ?? "#d9b45a");
        const fe = q(".feel"), cur = Band.running ? (Band.secNow === "dropbuild" ? "drop" : Band.secNow) : V.song.sec;
        if (document.activeElement !== fe && SECTIONS[cur] && fe.value !== cur) fe.value = cur; fe.style.setProperty("--fc", SECTIONS[cur]?.color ?? "#d9b45a");
      }
      if (Band.dropHit > lastDrop) { lastDrop = Band.dropHit; stage.classList.remove("slam"); void stage.offsetWidth; stage.classList.add("slam"); }
      // combo banner and rings
      const msg = Band.comboMsg && Band.comboMsg.until > tn ? Band.comboMsg : null;
      if (msg?.id !== comboShown) { comboShown = msg?.id ?? null; comboEl.classList.remove("show"); if (msg) { comboEl.textContent = `✨ ${msg.name} ✨`; comboEl.style.setProperty("--cc", msg.color); void comboEl.offsetWidth; comboEl.classList.add("show"); } }
      const live = Band.running ? COMBOS.filter(K => (Band.combo[K.id] ?? 0) >= 2) : [];
      stage.classList.toggle("full", live.some(K => K.id === "full"));
      for (const h of heads) {
        const K = live.find(K => K.id !== "full" && K.who.includes(h.k)); h.ch.classList.toggle("combo", !!K); if (K) h.ch.style.setProperty("--cc", K.color);
        const C = CAST_K[h.k], S = C ? V.cast[h.k] : null, on = h.k === "guest" ? !!V.guest : !!(S.loop || S.loop2), muted = S?.mute;
        const hit = Band.hits[h.k] ?? 0, p = Band.running && on && !muted ? Math.exp(-(tn - hit) / 150) : 0;
        if (hit > h.lastHit) { h.lastHit = hit; if (Band.running && on && !muted && tn - h.lastNote > 170) { h.lastNote = tn; const L = C ? loopsOf(C, S)[0] : null; spawnNote(h, L?.icon ?? GUEST_K[V.guest]?.icon ?? "♪"); } }
        const beat = Math.max(0, Band.step) >> 2, sway = Math.sin((tn / beatMs) * Math.PI);
        let tf;
        if (!Band.running || !on) tf = `scale(${1 + 0.018 * Math.sin(tn / 650 + h.k.length)})`;
        else switch (C?.groove) {
          case "sway": tf = `rotate(${sway * 7}deg) translateY(${-6 * p}px)`; break;
          case "tilt": tf = `rotate(${(beat % 2 ? 6 : -6) * (0.4 + 0.6 * p)}deg) translateY(${-6 * p}px)`; break;
          case "headbang": tf = loopsOf(C, S).some(L => L.id === "shred" || L.id === "talk") ? `rotate(${16 * p}deg) translateY(${-5 * p}px)` : `rotate(${-5 * p}deg) translateY(${-8 * p}px)`; break;
          case "bounce": tf = `translateY(${-11 * p}px) scale(${1 + 0.09 * p}, ${1 - 0.07 * p})`; break;
          case "nod": tf = `translateY(${7 * p}px) rotate(${4 * p}deg)`; break;
          default: tf = `translateY(${-8 * p}px) rotate(${(beat % 2 ? 4 : -4) * p}deg)`;
        }
        if (Band.spotNow === h.k) tf += " scale(1.18)";
        h.hw.style.transform = tf;
        const c = C?.color ?? GUEST_K[V.guest]?.color ?? "#d8c8a8";
        h.ring.style.boxShadow = on && Band.running && !muted ? `0 0 ${8 + 26 * p}px ${2 + 7 * p}px ${c}${Band.spotNow === h.k ? ", 0 0 60px 20px #fff6" : ""}` : "none";
      }
      this._raf = requestAnimationFrame(anim);
    };
    anim();
  }
  refresh() {
    const el = this.element; if (!el) return; const V = bandView(), G = GEN[V.song.gk], q = (s) => el.querySelector(s);
    const go = q(".go"); go.classList.toggle("on", Band.running); go.textContent = Band.running ? "■ Stop" : "▶ Listen";
    const tb = q(".table"); if (tb) { tb.classList.toggle("on", tableOn()); tb.textContent = tableOn() ? "🎙️ Table music: ON" : "🎙️ Table music"; }
    if (q(".guestsel") && document.activeElement !== q(".guestsel")) q(".guestsel").value = V.guest;
    if (document.activeElement !== q(".gen")) q(".gen").value = V.song.genre;
    if (document.activeElement !== q(".bpm")) { q(".bpm").value = V.song.bpm; q(".bpmv").textContent = V.song.bpm; }
    if (document.activeElement !== q(".key")) q(".key").value = V.song.key;
    if (document.activeElement !== q(".mode")) { q(".mode").value = V.song.mode; q(".mode").options[0].textContent = `The style's own (${isMinorG(GEN[V.song.genre]) ? "sad" : "happy"})`; }
    [...q(".key").options].forEach(o => o.textContent = keyName({ ...V.song, key: +o.value }));
    { const r = V.song.bpm / GEN[V.song.genre].bpm; let best = null; for (const b of el.querySelectorAll(".speed button")) { const d = Math.abs(Math.log(+b.dataset.sp / r)); if (!best || d < best[0]) best = [d, b]; b.classList.remove("act"); } if (best && best[0] < 0.06) best[1].classList.add("act"); }
    q(".mv").value = game.settings.get(MOD, "bandVol");
    const rec = q(".rec"); rec.classList.toggle("on", !!Rec.mr); rec.textContent = Rec.mr ? "⏹ Stop & release" : "⏺ Record take";
    if (false) { rec.disabled = true; rec.title = "Recording needs permission to upload files. Ask the GM."; }
    const songs = allSongs();
    if (document.activeElement !== q(".songs")) q(".songs").innerHTML = `<option value="">🎼 Setlists…</option><optgroup label="Starters">${songs.map((s, j) => s.starter ? `<option value="${j}">${esc(s.name)}</option>` : "").join("")}</optgroup><optgroup label="Saved">${songs.map((s, j) => !s.starter ? `<option value="${j}">${esc(s.name)} · ${esc(s.by ?? "")}</option>` : "").join("")}</optgroup>`;
    q(".st-blurb").innerHTML = `<b>${esc(G.name)}</b> in ${esc(keyName(V.song))} · ${esc(G.blurb)}`;
    q(".st-who").innerHTML = "In the studio: " + (jammers().map(u => `<span style="color:${userColor(u)}">●</span> ${esc(nameOf(u.id))}`).join(" ") || "<i>just you</i>");
    for (const ch of el.querySelectorAll(".st-ch")) {
      const k = ch.dataset.k, hw = ch.querySelector(".st-hw");
      if (k === "guest") {
        const g = GUEST_K[V.guest]; ch.style.display = g ? "" : "none"; ch.classList.toggle("on", !!g);
        if (g) { ch.style.setProperty("--c", g.color); const src = headImg(g.find), img = ch.querySelector("img.st-head");
          if (src && img) img.src = src; else if (src && !img) { ch.querySelector(".st-head").outerHTML = `<img class="st-head" src="${esc(src)}" draggable="false">`; ch.querySelector(".st-emo")?.remove(); }
          else if (!src) { const e = ch.querySelector(".st-emo"); if (e) e.textContent = g.icon; }
          ch.querySelector(".st-name").textContent = g.name; ch.querySelector(".st-inst").textContent = `Guest · ${g.label}`; }
        continue;
      }
      const C = CAST_K[k], S = V.cast[k], Ls = loopsOf(C, S), on = Ls.length > 0;
      const was = this.prev[k] ?? ""; const now = [S.loop, S.loop2].join("|");
      if (now !== was) { hw.classList.remove("popin", "popout"); void hw.offsetWidth; hw.classList.add(on ? "popin" : "popout"); this.prev[k] = now; }
      ch.classList.toggle("on", on); ch.classList.toggle("mute", on && S.mute);
      const b1 = ch.querySelector(".st-b1"), b2 = ch.querySelector(".st-b2"), L1 = C.loops.find(l => l.id === S.loop), L2 = C.loops.find(l => l.id === S.loop2);
      b1.textContent = L1?.icon ?? ""; b1.classList.toggle("show", !!L1); b2.textContent = L2?.icon ?? ""; b2.classList.toggle("show", !!L2);
      ch.querySelector(".st-name").textContent = C.name;
      ch.querySelector(".st-inst").textContent = on ? Ls.map(L => L.label).join(" + ") : C.inst;
      ch.querySelector(".mute").classList.toggle("act", S.mute); ch.querySelector(".solo").classList.toggle("act", Band.solo === k);
      const vol = ch.querySelector(".vol"); if (document.activeElement !== vol) vol.value = S.vol;
      ch.querySelector(".st-by").textContent = S.by && on ? `set by ${nameOf(S.by)}` : "";
    }
    for (const C of CAST) { const Ls = loopsOf(C, V.cast[C.k]); Ls.forEach(preloadLoop); const nw = el.querySelector(`.st-tab[data-k="${C.k}"] .now`); if (nw) nw.textContent = Ls.length ? `▶ ${Ls.map(L => L.label).join(" + ")}${V.cast[C.k].mute ? " (muted)" : ""}` : ""; }
    for (const ico of el.querySelectorAll(".st-ico")) { const S = V.cast[ico.dataset.k]; ico.classList.toggle("used", S.loop === ico.dataset.l || S.loop2 === ico.dataset.l); }
    q(".st-log").innerHTML = BandLog.slice(0, 4).map(l => `<span style="color:${l.c}">●</span> ${esc(l.s)}`).join(" &nbsp; ");
  }
  async close(o) {
    cancelAnimationFrame(this._raf); Band.solo = null; if (Rec.mr) stopRec();
    const r = await super.close(o);
    await game.user.update({ [`flags.${MOD}.bandJam`]: false });
    viewCache = null; bandSync(); return r;
  }
}

