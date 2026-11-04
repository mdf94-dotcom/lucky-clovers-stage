// A tiny stand-in for the bits of Foundry VTT the stage uses, so it runs as a plain web page.
// Everything you change is remembered in this browser (localStorage).
"use strict";
const MOD = "rhine-aim";
const store = {
  get(k, d) { try { const v = localStorage.getItem(`lcs.${k}`); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(`lcs.${k}`, JSON.stringify(v)); } catch {} }
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---- hooks
const Hooks = {
  _h: {},
  on(n, f) { (this._h[n] ??= []).push({ f }); },
  once(n, f) { (this._h[n] ??= []).push({ f, once: true }); },
  callAll(n, ...a) { const l = this._h[n] ?? []; this._h[n] = l.filter(x => !x.once); for (const x of l) { try { x.f(...a); } catch (e) { console.error(`hook ${n}`, e); } } }
};

// ---- settings
const SETTINGS = {};
const settings = {
  register(mod, key, cfg) { SETTINGS[key] = cfg; },
  get(mod, key) { return store.get(`setting.${key}`, SETTINGS[key]?.default); },
  async set(mod, key, v) { store.set(`setting.${key}`, v); try { SETTINGS[key]?.onChange?.(v); } catch (e) { console.error(e); } return v; }
};

// ---- the one user (you), plus the cast as "actors" so the stage can show their heads
const me = {
  id: "local-user", name: store.get("name", "You"), isGM: true, active: true, color: { css: "#d9b45a" },
  flags: { [MOD]: { band: store.get("band", null), bandJam: false } },
  can: () => true,
  async update(changes) {
    for (const [k, v] of Object.entries(changes)) {
      const m = k.match(/^flags\.rhine-aim\.(\w+)$/); if (!m) continue;
      this.flags[MOD][m[1]] = v; if (m[1] === "band") store.set("band", v);
    }
    Hooks.callAll("updateUser", this, { flags: { [MOD]: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k.split(".").pop(), v])) } });
    return this;
  }
};
const users = [me]; users.get = (id) => users.find(u => u.id === id); users.filter = Array.prototype.filter.bind(users);
const HEAD = (file) => file ? file : "";
const actors = [
  { name: "Oleander \"Ollie\"", type: "character", file: "ollie.png" },
  { name: "Quickare", type: "character", file: "quickare.png" },
  { name: "Captain Triton", type: "character", file: "triton.png" },
  { name: "Big Green", type: "character", file: "big-green.png" },
  { name: "Binko-SR157", type: "character", file: "binko.png" },
  { name: "Cat", type: "npc", file: "cat.png" },
  { name: "Hoodwink", type: "npc", file: "hoodwink.png" },
  { name: "Saguaro", type: "npc", file: "saguaro.png" }
].map(a => ({ ...a, id: a.name, img: "", prototypeToken: { texture: { src: (window.HEADS ?? {})[a.file] ? HEAD(a.file) : "" } } }));

const game = {
  ready: true, user: me, users, actors, settings,
  time: { get serverTime() { return Date.now(); } },
  playlists: { playing: [], getName: () => null },
  scenes: { active: null },
  messages: []
};
const canvas = { ready: false, scene: { name: "Studio Room", flags: { [MOD]: { studio: true } }, update: async () => {} }, tokens: { placeables: [] }, app: null };

// ---- notifications
const ui = { notifications: {
  _show(msg, kind) {
    const d = document.createElement("div"); d.className = `lcs-toast ${kind}`; d.textContent = msg; document.body.appendChild(d);
    setTimeout(() => d.classList.add("out"), 3200); setTimeout(() => d.remove(), 3800);
  },
  info(m) { this._show(m, "info"); }, warn(m) { this._show(m, "warn"); }, error(m) { this._show(m, "error"); }
} };

// ---- a small dialog that behaves like Foundry's DialogV2.prompt
function promptDialog({ window: w, content, ok }) {
  return new Promise((resolve, reject) => {
    const bg = document.createElement("div"); bg.className = "lcs-modal";
    bg.innerHTML = `<form class="box"><h3>${esc(w?.title ?? "")}</h3><div class="body">${content}</div><div class="row"><button type="button" class="cancel">Cancel</button><button type="submit" class="ok">${esc(ok?.label ?? "OK")}</button></div></form>`;
    document.body.appendChild(bg);
    const form = bg.querySelector("form"); form.querySelector("input")?.focus(); form.querySelector("input")?.select?.();
    const done = (v, err) => { bg.remove(); err ? reject(err) : resolve(v); };
    form.onsubmit = (e) => { e.preventDefault(); try { done(ok?.callback ? ok.callback(e, { form }) : true); } catch (err) { done(null, err); } };
    bg.querySelector(".cancel").onclick = () => done(null, new Error("cancelled"));
  });
}

// ---- a minimal ApplicationV2: one full-page window
class ApplicationV2 {
  static DEFAULT_OPTIONS = {};
  rendered = false; element = null;
  async render() {
    if (!this.element) {
      const o = this.constructor.DEFAULT_OPTIONS;
      this.element = document.createElement("section"); this.element.id = o.id ?? "app"; this.element.className = `app ${(o.classes ?? []).join(" ")}`;
      this.element.innerHTML = `<header class="window-header"><h1>${esc(o.window?.title ?? "")}</h1></header><div class="window-content"></div>`;
      document.getElementById("root").appendChild(this.element);
    }
    const html = await this._renderHTML(); this._replaceHTML(html, this.element.querySelector(".window-content"));
    this.rendered = true; this._onRender?.(); return this;
  }
  _replaceHTML(r, c) { c.replaceChildren(r); }
  async close() { this.rendered = false; this.element?.remove(); this.element = null; return this; }
}
const foundry = {
  utils: { escapeHTML: esc, deepClone: (o) => structuredClone(o) },
  applications: { api: { ApplicationV2, DialogV2: { prompt: promptDialog } }, apps: { FilePicker: { implementation: {} } } }
};

// ---- sounds and helpers the games section normally provides
const AC = { ctx: null };
function actx() { if (!AC.ctx) AC.ctx = new (window.AudioContext || window.webkitAudioContext)(); return AC.ctx; }
const SND = { click() { try { const c = actx(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = 1200; g.gain.setValueAtTime(0.05, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.06); } catch {} } };
const nameOf = (uid) => users.get(uid)?.name ?? "You";
const HANDLERS = {};
const relay = async (type, data) => HANDLERS[type]?.(data);
const primaryGM = () => me;
const ChatMessage = { create: async () => {} };
const Playlist = { create: async () => null };
