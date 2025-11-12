# 🎥 WebRTC Minimal Demo

Minimal peer-to-peer WebRTC example — includes a simple Node.js signaling server and a browser client for direct video & data channel communication.

> 🇹🇷 WebRTC temellerini öğrenmek için minimal bir örnek.  
> İki tarayıcı arasında **doğrudan (P2P)** video ve veri aktarımı sağlar.  
> Sunucu sadece **signaling (eşleştirme)** işini yapar, medya trafiği doğrudan kullanıcılar arasında akar.

---

## ⚙️ Features

- 🔹 WebRTC peer-to-peer connection  
- 🔹 Node.js based signaling server (WebSocket)  
- 🔹 Direct video stream between two browsers  
- 🔹 Optional data channel for text messages  
- 🔹 Minimal and easy to extend

---

## 🧩 Project Structure

```
webrtc-minimal-demo/
├── server/
│   └── signaling-server.js
├── public/
│   └── index.html
├── package.json
├── README.md
└── LICENSE
```

---

## 🚀 Quick Start

### 1️⃣ Clone this repository
```bash
git clone https://github.com/ilyasbozdemir/webrtc-minimal-demo.git
cd webrtc-minimal-demo
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Run the signaling server
```bash
node server/signaling-server.js
```

### 4️⃣ Open the client
Visit:  
👉 `http://localhost:3000` (or wherever your static HTML is served)

Then open **two browser tabs** and allow camera/mic access — the peers will connect automatically.

---

## 🔧 Configuration

You can modify STUN/TURN servers in the client’s `index.html`:
```js
const peer = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});
```

For NAT environments, consider running a local TURN server (e.g., [`coturn`](https://github.com/coturn/coturn)).

---

## 🧠 Learn More

- [WebRTC Official Docs](https://webrtc.org/getting-started/)
- [MDN: WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Simple Peer (Node wrapper)](https://github.com/feross/simple-peer)

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

**Author:** [İlyas Bozdemir](https://github.com/ilyasbozdemir)  
💡 Made for learning and experimenting with WebRTC signaling and peer-to-peer connections.
