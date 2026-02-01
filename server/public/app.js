const xray = document.getElementById("xray");

const wsUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;
const ws = new WebSocket(wsUrl);

ws.addEventListener("message", (ev) => {
  try {
    const msg = JSON.parse(ev.data);
    if (msg.type === "image" && msg.filename) {
      xray.src = `./images/${msg.filename}`;
    }
  } catch {}
});

// Keyboard testing (optional): 1..9 triggers, 0 = idle
document.addEventListener("keydown", (e) => {
  if (!ws || ws.readyState !== 1) return;

  if (e.key === "0") ws.send(JSON.stringify({ type: "idle" }));
  if (e.key === "1") ws.send(JSON.stringify({ type: "trigger", triggerId: "P1" }));
  if (e.key === "2") ws.send(JSON.stringify({ type: "trigger", triggerId: "P2" }));
  if (e.key === "3") ws.send(JSON.stringify({ type: "trigger", triggerId: "P3" }));
  if (e.key === "4") ws.send(JSON.stringify({ type: "trigger", triggerId: "P4" }));
});


const diag = document.createElement("div");
diag.style.position = "fixed";
diag.style.bottom = "10px";
diag.style.right = "10px";
diag.style.padding = "10px";
diag.style.background = "rgba(0,0,0,0.6)";
diag.style.color = "white";
diag.style.fontFamily = "monospace";
diag.style.fontSize = "14px";
diag.style.maxWidth = "40vw";
diag.style.pointerEvents = "none";
diag.textContent = "GPIO: waiting...";
document.body.appendChild(diag);

ws.addEventListener("message", (ev) => {
  try {
    const msg = JSON.parse(ev.data);
    if (msg.type === "gpio") {
      diag.textContent = `GPIO${msg.pin} ${msg.state ? "ACTIVE" : "INACTIVE"} (${msg.triggerId})`;
    }
    if (msg.type === "image" && msg.filename) {
      xray.src = `./images/${msg.filename}`;
    }
  } catch {}
});


// const keyMap = {
//   "1":"P1","2":"P2","3":"P3","4":"P4","5":"P5","6":"P6","7":"P7","8":"P8","9":"P9",
//   "q":"P10","w":"P11","e":"P12",
//   "0":"IDLE"
// };

// document.addEventListener("keydown", (e) => {
//   if (!ws || ws.readyState !== 1) return;
//   const tid = keyMap[e.key.toLowerCase()];
//   if (!tid) return;
//   if (tid === "IDLE") ws.send(JSON.stringify({ type: "idle" }));
//   else ws.send(JSON.stringify({ type: "trigger", triggerId: tid }));
// });
