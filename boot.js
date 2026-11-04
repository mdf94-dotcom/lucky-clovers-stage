// Start the stage once the page is ready.
"use strict";
// the GM-only "table music" step doesn't apply outside Foundry
{ const i = STAGE_TOUR.findIndex(s => s.sel === ".st-top .table"); if (i >= 0) STAGE_TOUR.splice(i, 1); }
Hooks.callAll("init");
Hooks.callAll("ready");
BandWin.open();
setTimeout(collabBoot, 300);
// browsers only allow sound after a click, so the first click anywhere starts the band
const gate = document.getElementById("gate");
gate.onclick = () => { gate.remove(); try { actx().resume(); } catch {} Band.userStopped = false; bandSync(); BandWin.win?.refresh(); };
