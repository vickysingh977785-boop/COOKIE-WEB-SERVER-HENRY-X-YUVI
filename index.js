// ==========================================
// ⚡ YUVI X HENRY - ULTIMATE DASHBOARD ⚡
// Features: Stylish UI, Hater Name, Time, File, Stop
// ==========================================

const fs = require("fs");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fca = require("fca-mafiya");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
const wss = new WebSocket.Server({ server });
const activeSessions = new Map();

function broadcast(data) {
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(data)); });
}

// ---------------- UI (YUVI X HENRY EDITION) ----------------
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YUVI X HENRY</title>
    <style>
        :root {
            --primary: #00ffe0;
            --secondary: #bd00ff;
            --bg: #03030a;
            --card: rgba(15, 15, 30, 0.9);
        }
        body {
            margin: 0;
            background: var(--bg);
            color: white;
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: radial-gradient(circle at center, #0a0a25 0%, #03030a 100%);
        }
        .container {
            width: 95%;
            max-width: 500px;
            background: var(--card);
            padding: 25px;
            border-radius: 15px;
            border: 2px solid var(--primary);
            box-shadow: 0 0 30px rgba(0, 255, 224, 0.2);
            backdrop-filter: blur(15px);
        }
        h1 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 20px;
            color: var(--primary);
            text-shadow: 0 0 20px var(--primary), 0 0 40px var(--secondary);
            letter-spacing: 3px;
            font-weight: 800;
        }
        .input-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-size: 0.85rem; color: var(--primary); text-transform: uppercase; }
        input, textarea {
            width: 100%;
            padding: 12px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #444;
            border-radius: 8px;
            color: #fff;
            outline: none;
            box-sizing: border-box;
        }
        input:focus { border-color: var(--secondary); }
        .btns { display: flex; gap: 10px; margin-top: 20px; }
        button {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            text-transform: uppercase;
            transition: 0.3s;
        }
        .btn-start { background: var(--primary); color: #000; box-shadow: 0 0 15px var(--primary); }
        .btn-stop { background: var(--secondary); color: #fff; box-shadow: 0 0 15px var(--secondary); }
        button:hover { transform: scale(1.05); opacity: 0.9; }
        .logs-container {
            margin-top: 20px;
            background: #000;
            border-radius: 8px;
            padding: 10px;
            border: 1px solid #333;
        }
        #logs {
            height: 140px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.8rem;
            color: #00ff9c;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>YUVI X HENRY</h1>
        
        <div class="input-group">
            <label>FB AppState (Cookies)</label>
            <textarea id="cookie" rows="3" placeholder="Paste JSON cookies here..."></textarea>
        </div>

        <div style="display: flex; gap: 10px;">
            <div class="input-group" style="flex: 1;">
                <label>Hater Name</label>
                <input id="haterName" placeholder="Yuvi">
            </div>
            <div class="input-group" style="flex: 1;">
                <label>Delay (Sec)</label>
                <input id="delay" type="number" value="10">
            </div>
        </div>

        <div class="input-group">
            <label>Target UID</label>
            <input id="targetId" placeholder="Enter Group/User ID">
        </div>

        <div class="input-group">
            <label>Gali File (.txt)</label>
            <input type="file" id="msgFile" accept=".txt">
        </div>

        <div class="btns">
            <button class="btn-start" onclick="startBot()">START MISSION</button>
            <button class="btn-stop" onclick="stopBot()">STOP MISSION</button>
        </div>

        <div class="logs-container">
            <div id="logs">>> YUVI X HENRY SYSTEM READY...</div>
        </div>
    </div>

<script>
    let currentSid = null;
    const logs = document.getElementById("logs");
    const ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host);

    ws.onmessage = e => {
        const data = JSON.parse(e.data);
        logs.innerHTML += "<div>[LOG] " + data.msg + "</div>";
        logs.scrollTop = logs.scrollHeight;
    };

    async function startBot(){
        const file = document.getElementById("msgFile").files[0];
        if(!file) return alert("Bhai, File select karo!");
        const text = await file.text();
        const msgs = text.split('\\n').filter(l => l.trim() !== "");

        fetch("/start", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                cookie: document.getElementById("cookie").value,
                haterName: document.getElementById("haterName").value,
                targetId: document.getElementById("targetId").value,
                delay: document.getElementById("delay").value,
                messages: msgs
            })
        }).then(r => r.json()).then(d => {
            if(d.success) { 
                currentSid = d.sid; 
                logs.innerHTML += "<div style='color:yellow'>🚀 MISSION STARTED BY YUVI!</div>"; 
            } else alert("Error: " + d.error);
        });
    }

    function stopBot(){
        if(!currentSid) return;
        fetch("/stop", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({ sid: currentSid })
        }).then(() => { 
            logs.innerHTML += "<div style='color:red'>❌ MISSION STOPPED.</div>"; 
            currentSid = null; 
        });
    }
</script>
</body>
</html>
`);
});

// ---------------- BACKEND ----------------
app.post("/start", (req, res) => {
  const { cookie, haterName, targetId, delay, messages } = req.body;
  const sid = "SID_" + Date.now();
  try {
    const appState = JSON.parse(cookie);
    fca.login({ appState }, (err, api) => {
      if (err) return res.json({ success: false, error: err.message });
      const session = {
        timer: setInterval(() => {
          const time = new Date().toLocaleTimeString();
          const rawMsg = messages[session.idx % messages.length];
          const finalMsg = `${haterName} ${rawMsg} [Time: ${time}]`;
          api.sendMessage(finalMsg, targetId, (e) => {
            if(!e) broadcast({ msg: `Sent: ${finalMsg}` });
          });
          session.idx++;
        }, (delay || 10) * 1000),
        idx: 0
      };
      activeSessions.set(sid, session);
      res.json({ success: true, sid });
    });
  } catch (e) { res.json({ success: false, error: "Invalid Cookie JSON" }); }
});

app.post("/stop", (req, res) => {
  const session = activeSessions.get(req.body.sid);
  if(session) { clearInterval(session.timer); activeSessions.delete(req.body.sid); }
  res.json({ success: true });
});

server.listen(PORT, () => console.log("⚡ YUVI X HENRY ONLINE"));
