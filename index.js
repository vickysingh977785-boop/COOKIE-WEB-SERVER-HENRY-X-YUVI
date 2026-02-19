// ==========================================
// ⚡ HENRY-X LUXURY MULTI-FUNCTION SERVER ⚡
// ==========================================

const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const multer = require("multer");
const login = require("fca-mafiya");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
const upload = multer({ dest: "uploads/" });

// File path for messages
const MSG_FILE = path.join(__dirname, "messages.txt");

// ---------------- UI DASHBOARD ----------------
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HENRY-X LUXURY CONTROL</title>
    <style>
        body { background: #050510; color: #00ffcc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: #111; padding: 25px; border: 2px solid #00ffcc; border-radius: 20px; box-shadow: 0 0 20px #00ffcc33; }
        h1 { text-align: center; text-shadow: 0 0 10px #00ffcc; margin-bottom: 30px; }
        .section { margin-bottom: 25px; padding: 15px; border: 1px solid #333; border-radius: 10px; }
        label { display: block; margin-bottom: 8px; font-weight: bold; }
        input, textarea { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #00ffcc; background: #000; color: #fff; box-sizing: border-box; }
        button { width: 100%; padding: 15px; border-radius: 8px; border: none; background: #00ffcc; color: #000; font-weight: bold; font-size: 16px; cursor: pointer; transition: 0.3s; }
        button:hover { background: #fff; box-shadow: 0 0 15px #fff; }
        #status { text-align: center; margin-top: 15px; font-weight: bold; color: yellow; }
        .footer { text-align: center; font-size: 12px; margin-top: 20px; opacity: 0.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ HENRY-X LUXURY ⚡</h1>
        
        <div class="section">
            <label>1. Upload Messages File (.txt)</label>
            <input type="file" id="fileInput" accept=".txt">
            <button onclick="uploadFile()">📤 UPLOAD MESSAGES</button>
        </div>

        <div class="section">
            <label>2. Bot Configuration</label>
            <textarea id="cookies" rows="5" placeholder="Paste your Facebook JSON Cookies here..."></textarea>
            <input type="text" id="group" placeholder="Enter Group/Thread ID">
            <input type="number" id="delay" placeholder="Delay in Seconds (e.g. 10)" value="10">
            <button onclick="startBot()">🚀 LAUNCH BOT</button>
        </div>

        <div id="status">Ready to Launch...</div>
        <div class="footer">Developed by HENRY-X | Powered by FCA-MAFIYA</div>
    </div>

    <script>
        const status = document.getElementById('status');

        async function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            if (!fileInput.files[0]) return alert("Pehle file select karein!");

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            status.innerText = "Uploading...";
            const res = await fetch('/upload-txt', { method: 'POST', body: formData });
            const data = await res.json();
            
            if(data.success) {
                status.innerText = "✅ File Uploaded: " + data.count + " messages found.";
            } else {
                status.innerText = "❌ Upload Failed!";
            }
        }

        async function startBot() {
            const cookies = document.getElementById('cookies').value;
            const group = document.getElementById('group').value;
            const delay = document.getElementById('delay').value;

            if (!cookies || !group) return alert("Cookies aur Group ID bharna zaroori hai!");

            status.innerText = "Logging in... please wait.";
            
            const res = await fetch('/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cookies, group, delay })
            });
            const data = await res.json();

            if (data.success) {
                status.innerText = "🚀 BOT STARTED SUCCESSFULLY!";
            } else {
                status.innerText = "❌ ERROR: " + data.error;
            }
        }
    </script>
</body>
</html>
    `);
});

// ---------------- API LOGIC ----------------

// 1. File Upload handler
app.post("/upload-txt", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });

    try {
        const content = fs.readFileSync(req.file.path, "utf-8");
        fs.writeFileSync(MSG_FILE, content); // Save as messages.txt
        fs.unlinkSync(req.file.path); // Delete temp file

        const count = content.split("\n").filter(line => line.trim() !== "").length;
        res.json({ success: true, count });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// 2. Start Bot handler
app.post("/start", (req, res) => {
    const { cookies, group, delay } = req.body;

    let messageList = [];
    if (fs.existsSync(MSG_FILE)) {
        messageList = fs.readFileSync(MSG_FILE, "utf-8").split("\n").filter(l => l.trim() !== "");
    }

    // Default messages if file is empty
    if (messageList.length === 0) {
        messageList = ["🔥 HENRY-X POWER 🔥", "🚀 AUTO BOT ACTIVE"];
    }

    try {
        const appState = JSON.parse(cookies);
        login({ appState }, (err, api) => {
            if (err) return res.json({ success: false, error: "Invalid Cookies or Login Failed" });

            let index = 0;
            console.log(`✅ Bot Started for Group: ${group}`);

            setInterval(() => {
                const msg = messageList[index % messageList.length];
                api.sendMessage(msg, group, (mErr) => {
                    if (mErr) console.log("⚠️ Error sending message:", mErr);
                    else console.log(`🚀 Sent [${index + 1}]: ${msg}`);
                });
                index++;
            }, (parseInt(delay) || 10) * 1000);

            res.json({ success: true });
        });
    } catch (e) {
        res.json({ success: false, error: "Cookie JSON format is wrong!" });
    }
});

// ---------------- SERVER START ----------------
server.listen(PORT, () => {
    console.log(`
    ====================================
    ⚡ HENRY-X SERVER IS LIVE ⚡
    Port: ${PORT}
    Status: Online
    ====================================
    `);
});
