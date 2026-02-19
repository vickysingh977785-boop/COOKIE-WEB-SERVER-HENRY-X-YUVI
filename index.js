// ========================================
// ⚡ HENRY-X LUXURY SERVER ⚡
// Simplified Version (No Schedule)
// Render FREE Compatible
// ========================================

const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fca = require("fca-mafiya");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ---------------- MIDDLEWARE ----------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------- WEBSOCKET ----------------
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify(data));
    }
  });
}

// ---------------- SESSION STORE ----------------
const activeSessions = new Map();

// ---------------- SESSION SAVE / LOAD ----------------
function saveSession(id, api) {
  try {
    const file = path.join(__dirname, `session_${id}.json`);
    fs.writeFileSync(file, JSON.stringify(api.getAppState(), null, 2));
  } catch (e) {
    console.log("❌ Save error:", e.message);
  }
}

// ---------------- LOGIN WITH COOKIES ----------------
function loginWithCookie(cookieString, cb) {
  const methods = [
    next => {
      try {
        const appState = JSON.parse(cookieString);
        fca({ appState }, (e, api) => next(api));
      } catch { next(null); }
    },
    next => fca({ appState: cookieString }, (e, api) => next(api)),
    next => fca(cookieString, {}, (e, api) => next(api)),
  ];

  let i = 0;
  (function run() {
    if (i >= methods.length) return cb(null);
    methods[i++](api => api ? cb(api) : setTimeout(run, 2000));
  })();
}

// ---------------- KEEP ALIVE ----------------
function keepAlive(id, api) {
  return setInterval(() => {
    api.getCurrentUserID((e, uid) => {
      if (!e) saveSession(id, api);
    });
  }, 300000);
}

// ---------------- UI (FRONTEND) ----------------
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>HENRY-X LUXURY SERVER</title>
<style>
body{margin:0;background:#050510;color:#fff;font-family:Arial;display:flex;justify-content:center}
.box{width:90%;max-width:650px;margin:30px auto;padding:20px;
background:rgba(255,255,255,.05);border-radius:20px;
border:1px solid #00ffe0;box-shadow: 0 0 15px #00ffe055}
h1{text-align:center;color:#00ffe0;text-shadow: 0 0 10px #00ffe0}
label{display:block;margin-top:10px;font-size:12px;color:#00ffe0;text-transform:uppercase}
textarea,input{width:100%;margin:5px 0 12px 0;padding:10px;
background:#000;color:#0f0;border:1px solid #00ffe0;border-radius:8px;box-sizing:border-box}
.grid{display:grid;grid-template-columns: 1fr 1fr;gap:10px}
button{width:100%;padding:14px;border:none;border-radius:10px;font-weight:bold;cursor:pointer;margin-top:10px}
.btn-start{background:#00ffe0;color:#000}
.btn-stop{background:#ff3e3e;color:#fff}
.logs{background:#000;height:250px;overflow:auto;
color:#00ff9c;padding:10px;font-family:monospace;margin-top:20px;border-radius:10px;border:1px solid #111}
</style>
</head>
<body>
<div class="box">
<h1>⚡ HENRY-X LUXURY ⚡</h1>

<label>1. Cookies (AppState JSON)</label>
<textarea id="cookies" placeholder="Paste Facebook Cookies Here"></textarea>

<div class="grid">
  <div>
    <label>2. Hater Name</label>
    <input id="haterName" placeholder="Example: Rahul">
  </div>
  <div>
    <label>3. Target ID</label>
    <input id="group" placeholder="Group/UID">
  </div>
</div>

<label>4. Delay (Seconds)</label>
<input id="delay" type="number" value="10">

<label>5. Select Gali File (.txt)</label>
<input type="file" id="fileInput" accept=".txt">

<button class="btn-start" onclick="start()">🚀 START BOT</button>
<button class="btn-stop" onclick="stop()">🛑 STOP BOT</button>

<div class="logs" id="logs"></div>
</div>

<script>
const logs = document.getElementById("logs");
const ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host);

ws.onmessage = e => {
  const d = JSON.parse(e.data);
  logs.innerHTML += "<div>> " + (d.message || d) + "</div>";
  logs.scrollTop = logs.scrollHeight;
};

async function start(){
  const file = document.getElementById("fileInput").files[0];
  if(!file) return alert("Bhai, Gali wali file select karo!");
  
  const text = await file.text();
  const messages = text.split('\\n').filter(l => l.trim() !== "");

  fetch("/start", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      cookies: document.getElementById("cookies").value,
      haterName: document.getElementById("haterName").value,
      group: document.getElementById("group").value,
      delay: document.getElementById("delay").value,
      messages: messages
    })
  });
}

function stop(){
  fetch("/stop", { method: "POST" });
}
</script>
</body>
</html>
`);
});

// ---------------- START BOT ROUTE ----------------
app.post("/start", (req, res) => {
  const { cookies, haterName, group, delay, messages } = req.body;
  const sessionId = "HX_" + Date.now();

  loginWithCookie(cookies, api => {
    if (!api) return broadcast({ message: "❌ Login Failed! Check Cookies." });

    const session = {
      api,
      group,
      haterName,
      delay: (delay || 10) * 1000,
      messages,
      index: 0
    };

    session.interval = setInterval(() => {
      const prefix = session.haterName ? session.haterName + " " : "";
      const msg = prefix + (session.messages[session.index] || "No message found");
      
      api.sendMessage(msg, session.group, (err) => {
        if(!err) broadcast({ message: "✉️ Sent: " + msg });
      });
      
      session.index = (session.index + 1) % session.messages.length;
    }, session.delay);

    session.keep = keepAlive(sessionId, api);
    activeSessions.set(sessionId, session);
    broadcast({ message: "✅ Bot Started on ID: " + group });
  });

  res.json({ success: true, sessionId });
});

// ---------------- STOP BOT ROUTE ----------------
app.post("/stop", (req, res) => {
  activeSessions.forEach((s, id) => {
    clearInterval(s.interval);
    clearInterval(s.keep);
    activeSessions.delete(id);
  });
  broadcast({ message: "🛑 ALL BOTS DISCONNECTED." });
  res.json({ success: true });
});

// ---------------- START SERVER ----------------
server.listen(PORT, "0.0.0.0", () => {
  console.log("⚡ HENRY-X running on port", PORT);
});
