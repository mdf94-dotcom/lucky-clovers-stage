// 👥 Play together: everyone with the same room link shares one stage.
// Each person's edits travel through a free public MQTT relay (no accounts, nothing stored). The stage already merges
// everyone's edits field by field (newest wins), exactly like it does in Foundry, so all this does is pass them around
// and keep everyone's clocks on the same beat.
"use strict";
const COLLAB = {
  broker: new URLSearchParams(location.search).get("broker") || "wss://broker.emqx.io:8084/mqtt",
  room: null, client: null, joinedAt: Date.now(), offset: 0, leader: null, peers: new Map(), status: "solo",
  colors: ["#e874a6", "#e8a64a", "#4fb6e8", "#6fcf5a", "#b07af0", "#ff6a5a", "#5ad8c8", "#f0e05a"]
};
const roomFromHash = () => (location.hash.match(/room=([a-z0-9-]{4,40})/i) || [])[1]?.toLowerCase() ?? null;
const newRoomCode = () => { const w = ["clover", "lantern", "dune", "cactus", "comet", "saloon", "keytar", "banjo", "ember", "tide"], r = () => w[Math.floor(Math.random() * w.length)]; return `${r()}-${r()}-${Math.floor(100 + Math.random() * 900)}`; };
const topic = (kind) => `lucky-clovers-stage/v1/${COLLAB.room}/${kind}`;
me.color = { css: store.get("color", COLLAB.colors[Math.floor(Math.random() * COLLAB.colors.length)]) }; store.set("color", me.color.css);
me.id = store.get("uid", `u${Math.random().toString(36).slice(2, 10)}`); store.set("uid", me.id);

// everyone shares one clock: the person who has been in the room longest keeps time, the rest measure their offset to them
Object.defineProperty(game.time, "serverTime", { get() { return Date.now() + COLLAB.offset; } });

function send(kind, data, qos = 0) { if (COLLAB.client?.connected) COLLAB.client.publish(topic(kind), JSON.stringify({ ...data, from: me.id }), { qos }); }
function sendState() { send("state", { name: me.name, color: me.color.css, band: me.flags[MOD].band, jam: !!me.flags[MOD].bandJam, joinedAt: COLLAB.joinedAt }); }
function pickLeader() {
  let best = { id: me.id, joinedAt: COLLAB.joinedAt };
  for (const [id, p] of COLLAB.peers) if (p.active && (p.joinedAt < best.joinedAt || (p.joinedAt === best.joinedAt && id < best.id))) best = { id, joinedAt: p.joinedAt };
  if (best.id !== COLLAB.leader) { COLLAB.leader = best.id; if (best.id === me.id) COLLAB.offset = 0; else syncClock(); }
}
const pings = {};
function syncClock() { for (let k = 0; k < 4; k++) setTimeout(() => { const n = Math.random().toString(36).slice(2); pings[n] = Date.now(); send("ping", { to: COLLAB.leader, n }); }, k * 250); }
const offsets = [];
function onMessage(t, buf) {
  let m; try { m = JSON.parse(buf.toString()); } catch { return; } if (!m || m.from === me.id) return;
  const kind = t.split("/").pop();
  if (kind === "hello") { sendState(); return; }
  if (kind === "ping") { if (m.to === me.id) send("pong", { to: m.from, n: m.n, now: game.time.serverTime }); return; }
  if (kind === "pong") {
    if (m.to !== me.id || !pings[m.n]) return; const t1 = Date.now(), rtt = t1 - pings[m.n]; delete pings[m.n];
    offsets.push([rtt, m.now + rtt / 2 - t1]); offsets.sort((a, b) => a[0] - b[0]); offsets.length = Math.min(offsets.length, 5);
    COLLAB.offset = offsets[0][1]; return;   // trust the quickest round trip
  }
  if (kind === "bye") { const u = users.get(m.from); if (u) { u.active = false; u.flags[MOD].bandJam = false; COLLAB.peers.delete(m.from); pickLeader(); Hooks.callAll("updateUser", u, { flags: { [MOD]: { bandJam: false } } }); collabUI(); } return; }
  if (kind !== "state") return;
  let u = users.get(m.from), isNew = !u;
  if (!u) { u = { id: m.from, isGM: false, active: true, flags: { [MOD]: {} }, can: () => true, update: async () => u }; users.push(u); }
  const prevBand = u.flags[MOD].band, prevJam = u.flags[MOD].bandJam;
  Object.assign(u, { name: String(m.name || "Friend").slice(0, 24), color: { css: m.color || "#d9b45a" }, active: true, seen: Date.now() });
  u.flags[MOD].band = m.band ?? null; u.flags[MOD].bandJam = !!m.jam;
  COLLAB.peers.set(m.from, { joinedAt: m.joinedAt ?? Date.now(), active: true });
  pickLeader();
  if (isNew) { Hooks.callAll("userConnected", u, true); ui.notifications.info(`${u.name} joined the stage.`); }
  const ch = {}; if (prevBand !== u.flags[MOD].band) ch.band = u.flags[MOD].band; if (prevJam !== u.flags[MOD].bandJam) ch.bandJam = u.flags[MOD].bandJam;
  if (Object.keys(ch).length) Hooks.callAll("updateUser", u, { flags: { [MOD]: ch } });
  collabUI();
}
// people who close the page without saying bye drop off after a short while
setInterval(() => {
  if (COLLAB.room) sendState();
  for (const u of users) if (u !== me && u.active && Date.now() - (u.seen ?? 0) > 25000) { u.active = false; u.flags[MOD].bandJam = false; COLLAB.peers.delete(u.id); pickLeader(); Hooks.callAll("updateUser", u, { flags: { [MOD]: { bandJam: false } } }); collabUI(); }
}, 8000);

function joinRoom(code) {
  if (typeof mqtt === "undefined") return ui.notifications.error("Couldn't load the play-together relay.");
  COLLAB.room = code; COLLAB.status = "connecting"; collabUI();
  if (location.hash !== `#room=${code}`) history.replaceState(null, "", `#room=${code}`);
  COLLAB.client = mqtt.connect(COLLAB.broker, { clientId: `lcs-${me.id}-${Math.random().toString(36).slice(2, 6)}`, clean: true, reconnectPeriod: 3000, connectTimeout: 10000,
    will: { topic: topic("bye"), payload: JSON.stringify({ from: me.id }), qos: 0, retain: false } });
  COLLAB.client.on("connect", () => {
    COLLAB.client.subscribe(`lucky-clovers-stage/v1/${COLLAB.room}/+`, () => { COLLAB.status = "live"; send("hello", {}); sendState(); collabUI(); });
  });
  COLLAB.client.on("message", onMessage);
  COLLAB.client.on("reconnect", () => { COLLAB.status = "connecting"; collabUI(); });
  COLLAB.client.on("offline", () => { COLLAB.status = "offline"; collabUI(); });
  COLLAB.client.on("error", (e) => console.warn("Play together |", e?.message ?? e));
}
function leaveRoom() {
  const c = COLLAB.client; send("bye", {}); setTimeout(() => c?.end(true), 150); COLLAB.client = null; COLLAB.room = null; COLLAB.status = "solo"; COLLAB.offset = 0;
  for (const u of [...users]) if (u !== me) users.splice(users.indexOf(u), 1);
  COLLAB.peers.clear(); history.replaceState(null, "", location.pathname + location.search); Hooks.callAll("updateUser", me, { flags: { [MOD]: { band: me.flags[MOD].band } } }); collabUI();
}
window.addEventListener("beforeunload", () => send("bye", {}));

// your edits go out as soon as the stage saves them
const _meUpdate = me.update.bind(me);
me.update = async (changes) => { const r = await _meUpdate(changes); if (COLLAB.room && Object.keys(changes).some(k => /band|bandJam/.test(k))) sendState(); return r; };

// ---- the button, the panel and the "who's here" row
async function askName() {
  const n = await foundry.applications.api.DialogV2.prompt({ window: { title: "Your name on the stage" }, content: `<p>What should everyone see?</p><input name="n" type="text" maxlength="24" value="${esc(me.name === "You" ? "" : me.name)}">`, ok: { label: "OK", callback: (ev, b) => b.form.elements.n.value } }).catch(() => null);
  if (n && n.trim()) { me.name = n.trim().slice(0, 24); store.set("name", me.name); if (COLLAB.room) sendState(); BandWin.win?.refresh(); }
  return !!(n && n.trim());
}
function inviteLink() { return `${location.origin}${location.pathname}#room=${COLLAB.room}`; }
function collabUI() {
  const top = document.querySelector(".st-top"); if (!top) return;
  let b = top.querySelector(".together");
  if (!b) { b = document.createElement("button"); b.type = "button"; b.className = "together"; top.querySelector(".help")?.after(b); b.onclick = openCollabPanel; }
  const n = users.filter(u => u !== me && u.active).length;
  b.textContent = COLLAB.room ? `👥 ${COLLAB.status === "live" ? `Together (${n + 1})` : COLLAB.status === "offline" ? "Reconnecting…" : "Connecting…"}` : "👥 Play together";
  b.classList.toggle("on", !!COLLAB.room);
  const p = document.getElementById("lcs-collab"); if (p) fillPanel(p);
  BandWin.win?.refresh();
}
function fillPanel(p) {
  const peers = users.filter(u => u !== me && u.active);
  p.querySelector(".body").innerHTML = COLLAB.room
    ? `<p>Anyone with this link joins your stage. You'll all hear the same song, in time, and anyone can change anything.</p>
       <div class="link"><input readonly value="${esc(inviteLink())}"><button type="button" class="copy">📋 Copy link</button></div>
       <p class="who"><b>On the stage:</b> <span style="color:${esc(me.color.css)}">●</span> ${esc(me.name)} (you)${peers.map(u => ` · <span style="color:${esc(u.color.css)}">●</span> ${esc(u.name)}`).join("")}</p>
       <p class="small">${COLLAB.status === "live" ? "Connected." : "Connecting to the relay…"} Your mix and name pass through a free public relay; anyone with the room code could listen in, so don't put anything private in names.</p>
       <div class="row"><button type="button" class="rename">✏️ Change my name</button><button type="button" class="leave">🚪 Leave the room</button></div>`
    : `<p>Start a room and send the link to your friends. Everyone on the link shares one stage: the same song, in time, and anyone can give anyone a sound.</p>
       <div class="row"><button type="button" class="start">🍀 Start a room</button></div>
       <p class="small">Got a link from someone? Just open it, and you'll join their room.</p>`;
  p.querySelector(".copy")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(inviteLink()); ui.notifications.info("Link copied."); } catch { p.querySelector(".link input").select(); } });
  p.querySelector(".start")?.addEventListener("click", async () => { if (me.name === "You" && !(await askName())) return; joinRoom(newRoomCode()); });
  p.querySelector(".rename")?.addEventListener("click", askName);
  p.querySelector(".leave")?.addEventListener("click", () => { leaveRoom(); p.remove(); });
}
function openCollabPanel() {
  document.getElementById("lcs-collab")?.remove();
  const p = document.createElement("div"); p.id = "lcs-collab"; p.className = "lcs-modal";
  p.innerHTML = `<div class="box"><h3>👥 Play together</h3><div class="body"></div><div class="row"><button type="button" class="close">Close</button></div></div>`;
  p.querySelector(".close").onclick = () => p.remove(); p.onclick = (e) => { if (e.target === p) p.remove(); };
  document.body.appendChild(p); fillPanel(p);
}
// joining from a link: ask for a name first (once), then hop in
async function collabBoot() {
  collabUI();
  const code = roomFromHash(); if (!code) return;
  if (me.name === "You") await askName();
  joinRoom(code);
}
window.addEventListener("hashchange", () => { const c = roomFromHash(); if (c && c !== COLLAB.room) { if (COLLAB.room) leaveRoom(); joinRoom(c); } });
