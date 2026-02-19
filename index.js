const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const fca = require("fca-mafiya");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---------------- CONFIGURATION ----------------
// Aapki di hui photo
const BG_IMAGE_URL = "https://i.ibb.co/6Rwwwh3R/a317e75fe8c9c0f700504d0c3cdd3c90.jpg"; 
// Aapka diya hua YouTube song (Pal Pal x Obito)
const YT_VIDEO_ID = "FPWO8dqY0v0"; 

let activeSessions = [];

// Current Time Function
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
}

// ---------------- UI DASHBOARD ----------------
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 YUVI X HENRY LUXURY 🔥</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0; padding: 0;
            background: url('${BG_IMAGE_URL}') no-repeat center center fixed;
            background-size: cover;
            font-family: 'Orbitron', sans-serif;
            color: white;
        }
        .overlay {
            width: 100%; min-height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .main-box {
            width: 90%; max-width: 500px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(15px);
            padding: 30px; border-radius: 20px;
            border: 2px solid #ff0055;
            box-shadow: 0 0 30px #ff0055;
            text-align: center;
        }
        h1 { color: #ff0055; text-shadow: 0 0 10px #ff0055; margin-bottom: 20px; font-size: 24px; }
        textarea, input {
            width: 100%; margin-bottom: 12px; padding: 12px;
            background: rgba(0,0,0,0.7); border: 1px solid #ff0055;
            color: #0f0; border-radius: 8px; box-sizing: border-box; outline: none;
        }
        .btn-group { display: flex; gap: 10px; }
        button {
            flex: 1; padding: 15px; border: none; border-radius: 8px;
            font-weight: bold; cursor: pointer; transition: 0.3s; text-transform: uppercase;
        }
        .start-btn { background: #ff0055; color: #fff; }
        .stop-btn { background: #333; color: #fff; border: 1px solid #ff0055; }
        button:hover { transform: scale(1.03); opacity: 0.9; }
        #logs {
            margin-top: 15px; background: rgba(0,0,0,0.9); height: 100px;
            padding: 10px; border-radius: 8px; font-family: monospace;
            font-size: 11px; overflow-y: auto; color: #00ffcc; border: 1px solid #444;
            text-align: left;
        }
        #ytPlayer { width: 100%; height: 200px; border-radius: 10px; margin-bottom: 15px; display: none; border: 2px solid #ff0055; }
    </style>
</head>
<body>
    <div class="overlay">
        <div class="main-box">
            <h1>💎 YUVI X HENRY 💎</h1>
            
            <div id="videoContainer"></div>

            <textarea id="cookies" rows="3" placeholder="Paste Cookies (One per line for Multi-ID)"></textarea>
            <input type="text" id="haterName" placeholder="🎯 Hater Name (e.g. Chomu)">
            <input type="text" id="groupId" placeholder="🆔 Group / Thread ID">
            <input type="number" id="delay" placeholder="⏱ Delay in Seconds" value="5">
            
            <div class="btn-group">
                <button class="start-btn" onclick="startBot()">🚀 START POWER</button>
                <button class="stop-btn" onclick="stopBot()">🛑 STOP BOT</button>
            </div>

            <div id="logs">>> System Ready for YUVI X HENRY...</div>
        </div>
    </div>

    <script>
        const logBox = document.getElementById('logs');
        function addLog(msg) {
            logBox.innerHTML += "<div>" + msg + "</div>";
            logBox.scrollTop = logBox.scrollHeight;
        }

        async function startBot() {
            // YouTube Video Play
            const container = document.getElementById('videoContainer');
            container.innerHTML = \`<iframe id="ytPlayer" src="https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1" allow="autoplay" style="display:block;"></iframe>\`;

            const payload = {
                cookies: document.getElementById('cookies').value,
                haterName: document.getElementById('haterName').value,
                groupId: document.getElementById('groupId').value,
                delay: document.getElementById('delay').value
            };

            const res = await fetch('/start', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            addLog(">> " + data.message);
        }

        async function stopBot() {
            const res = await fetch('/stop', { method: 'POST' });
            const data = await res.json();
            document.getElementById('videoContainer').innerHTML = '';
            addLog(">> 🛑 " + data.message);
        }
    </script>
</body>
</html>
    `);
});

// ---------------- BOT LOGIC ----------------

app.post("/start", (req, res) => {
    const { cookies, haterName, groupId, delay } = req.body;
    const cookieList = cookies.split("\n").filter(c => c.trim() !== "");

    // Load Messages
    let messages = ["🔥 YUVI X HENRY POWER 🔥"];
    try {
        if (fs.existsSync("messages.txt")) {
            messages = fs.readFileSync("messages.txt", "utf-8").split("\n").filter(m => m.trim() !== "");
        }
    } catch (e) { console.log("Error loading messages.txt"); }

    cookieList.forEach((cookie, idx) => {
        let state;
        try {
            state = (cookie.startsWith("[") || cookie.startsWith("{")) ? JSON.parse(cookie) : cookie;
        } catch (e) { state = cookie; }

        fca.login({ appState: state }, (err, api) => {
            if (err) return console.log(`Login Error for ID ${idx + 1}`);

            let msgIndex = 0;
            const interval = setInterval(() => {
                const finalMsg = `😎 ${haterName} ➛ ${messages[msgIndex]} 🕒 [${getCurrentTime()}]`;
                api.sendMessage(finalMsg, groupId, (e) => {
                    if (e) console.log("Send failed");
                });
                msgIndex = (msgIndex + 1) % messages.length;
            }, delay * 1000);

            activeSessions.push({ interval, api });
        });
    });

    res.json({ success: true, message: `YUVI X HENRY Activated! Accounts: ${cookieList.length}` });
});

app.post("/stop", (req, res) => {
    activeSessions.forEach(s => clearInterval(s.interval));
    activeSessions = [];
    res.json({ success: true, message: "All Attack Stopped by YUVI X HENRY!" });
});

server.listen(PORT, () => {
    console.log(`⚡ YUVI X HENRY Server Started on Port ${PORT}`);
});
