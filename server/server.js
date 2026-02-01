import fs from "fs";
import path from "path";
import express from "express";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MAPPING_PATH = path.join(__dirname, "mapping.json");

function loadMapping() {
  const raw = fs.readFileSync(MAPPING_PATH, "utf-8");
  return JSON.parse(raw);
}

let mapping = loadMapping();
let currentImage = mapping.idle;

// Hot-reload mapping.json if you edit it
fs.watchFile(MAPPING_PATH, { interval: 500 }, () => {
  try {
    mapping = loadMapping();
    if (!mapping?.idle) throw new Error("mapping.json missing idle");
    console.log("[mapping] reloaded");
  } catch (e) {
    console.warn("[mapping] reload failed:", e.message);
  }
});

const app = express();
app.use(express.json({ limit: "100kb" }));

// Static site + assets
app.use(express.static(path.join(__dirname, "public")));

// Health
app.get("/health", (_req, res) => res.json({ ok: true, image: currentImage }));

// Trigger endpoint (used by gpio_bridge)
app.post("/api/trigger", (req, res) => {
  const { triggerId } = req.body || {};
  if (!triggerId) return res.status(400).json({ ok: false, error: "Missing triggerId" });

  const img = mapping.triggers?.[triggerId];
  if (!img) return res.status(404).json({ ok: false, error: `Unknown triggerId: ${triggerId}` });

  setImage(img, `trigger:${triggerId}`);
  res.json({ ok: true, image: currentImage });
});

// Optional: return to idle (e.g., after timeout)
app.post("/api/idle", (_req, res) => {
  setImage(mapping.idle, "idle");
  res.json({ ok: true, image: currentImage });
});

const server = app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

function setImage(filename, source) {
  currentImage = filename;
  console.log(`[image] ${filename} (${source})`);
  broadcast({ type: "image", filename, source, ts: Date.now() });
}

wss.on("connection", (ws) => {
  // Send current state immediately
  ws.send(JSON.stringify({ type: "image", filename: currentImage, source: "sync", ts: Date.now() }));

  ws.on("message", (buf) => {
    // Allow keyboard/manual simulation from UI: {type:"trigger", triggerId:"P1"} or {type:"idle"}
    try {
      const msg = JSON.parse(buf.toString("utf-8"));
      if (msg?.type === "trigger" && msg.triggerId) {
        const img = mapping.triggers?.[msg.triggerId];
        if (img) setImage(img, `ui:${msg.triggerId}`);
      } else if (msg?.type === "idle") {
        setImage(mapping.idle, "ui:idle");
      }
    } catch {
      // ignore
    }
  });
});

// Store last N events for quick debugging
const MAX_EVENTS = 200;
const recentEvents = [];

function addEvent(ev) {
  recentEvents.push(ev);
  while (recentEvents.length > MAX_EVENTS) recentEvents.shift();
}

app.post("/api/gpio", (req, res) => {
  const { triggerId, pin, state, ts } = req.body || {};
  if (!triggerId || typeof pin !== "number" || (state !== 0 && state !== 1)) {
    return res.status(400).json({ ok: false, error: "Expected triggerId, pin(number), state(0|1)" });
  }

  const ev = {
    triggerId,
    pin,
    state,
    ts: ts ?? Date.now()
  };

  // Console diagnostics
  console.log(`[gpio] pin=GPIO${pin} state=${state ? "ACTIVE" : "INACTIVE"} trigger=${triggerId}`);

  addEvent(ev);

  // Optionally: only swap image on ACTIVE
  if (state === 1) {
    const img = mapping.triggers?.[triggerId];
    if (img) setImage(img, `gpio:${triggerId}:GPIO${pin}`);
  }

  // Broadcast to UI (optional)
  broadcast({ type: "gpio", ...ev });

  res.json({ ok: true });
});


app.get("/api/diag/events", (_req, res) => {
  res.json({ ok: true, events: recentEvents });
});