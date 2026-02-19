// ==========================================
// ⚡ YUVI X HENRY - OBITO AMV EDITION ⚡
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

// ---------------- UI (YouTube Background) ----------------
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YUVI X HENRY | OBITO AMV</title>
    <style>
        :root { --primary: #00ffe0; --secondary: #ff0055; }
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: 'Segoe UI', sans-serif; background: #000; }
        
        /* YouTube Video Container */
        .video-background {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: -2;
            pointer-events: none; /* User video click na kar sake */
            display: none;
        }
        iframe {
            width: 100vw; height: 56.25vw; /* 16:9 ratio */
            min-height: 100vh; min-width: 177.77vh;
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
        }

        /* Default Samurai Image Overlay */
        .bg-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: url('https://i.ibb.co/6Rwwwh3R/a317e75fe8c9c0f700504d0c3cdd3c90.jpg') no-repeat center center fixed;
            background-size: cover;
            z-index: -3;
        }

        body::after {
            content: "";
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: -1;
        }

        .container {
            position: relative; z-index: 10;
            width: 90%; max-width: 450px;
            background: rgba(0, 0, 0, 0.75);
            margin: 40px auto; padding: 25px;
            border-radius: 15px; border: 2px solid var(--primary);
            backdrop-filter: blur(10px);
            box-shadow: 0 0 20px var(--primary);
        }

        h1 { text-align: center; color: var(--primary); text-shadow: 0 0 10px var(--primary); margin: 0 0 15px 0; font-size: 2rem; }
        label { display: block; margin-top: 8px; font-size: 0.75rem; color: var(--primary); font-weight: bold; }
        input, textarea { width: 100%; padding: 10px; margin-top: 5px; background: rgba(0,0,0,0.6); border: 1px solid var(--primary); color: white; border-radius: 8px; box-sizing: border-box; outline: none; }
        .btns { display: flex; gap: 10px; margin-top: 20px; }
        button { flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; transition: 0.3s; }
        .btn-start { background: var(--primary); color: #000; box-shadow: 0 0 10px var(--primary); }
        .btn-stop { background: var(--secondary); color: #fff; }
        #logs { height: 90px; overflow-y: auto; font-family: monospace; font-size: 0.7rem; color: #00ff9c; margin-top: 15px; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="bg-overlay"></div>
    
    <div class="video-background" id="videoBox">
        <div id="player"></div>
    </div>

    <div class="container">
        <h1>YUVI X HENRY</h1>
        
        <label>FB COOKIES (JSON)</label>
        <textarea id="cookie" rows="3" placeholder="Paste AppState..."></textarea>
        
        <div style="display: flex; gap: 10px;">
            <div style="flex: 1;"><label>HATER NAME</label><input id="haterName" value="Yuvi"></div>
            <div style="flex: 1;"><label>DELAY (S)</label><input id="delay" type="number" value="10"></div>
        </div>

        <label>TARGET UID</label>
        <input id="targetId" placeholder="Group/User ID">

        <label>GALI FILE (.TXT)</label>
        <input type="file" id="msgFile" accept=".txt" style="border:none;">

        <div class="btns">
            <button class="btn-start" onclick="startBot()">START MISSION</button>
            <button class="btn-stop" onclick="stopBot()">STOP MISSION</button>
        </div>

        <div id="logs">>> READY FOR ACTION...</div>
    </div>

    <script src="https://www.youtube.com/iframe_api"></script>
    <script>
        let player;
        let currentSid = null;

        function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
                videoId: 'FPWO8dqY0v0', // Obito Video ID
                playerVars: {
                    'autoplay': 0,
                    'controls': 0,
                    'showinfo': 0,
                    'rel': 0,
                    'loop': 1,
                    'playlist': 'FPWO8dqY0v0'
                }
            });
        }

        async function startBot(){
            const file = document.getElementById("msgFile").files[0];
            if(!file) return alert("File choose karo bhai!");

            // Start Video
            document.getElementById('videoBox').style.display = 'block';
            player.playVideo();
            player.unMute();

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
                    document.getElementById('logs').innerHTML += "<div style='color:yellow'>🚀 Bot Started! Enjoy the AMV.</div>";
                }
            });
        }

        function stopBot(){
            fetch("/stop", {
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({ sid: currentSid })
            }).then(() => {
                player.pauseVideo();
                document.getElementById('videoBox').style.display = 'none';
                document.getElementById('logs').innerHTML += "<div style='color:red'>🛑 Bot Stopped.</div>";
                currentSid = null;
            });
        }
    </script>
</body>
</html>
`);
});

// [Backend logic remains same]
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
            if(!e) broadcast({ msg: `${finalMsg}` });
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

server.listen(PORT, () => console.log("⚡ YUVI X HENRY OBITO MODE ONLINE"));
