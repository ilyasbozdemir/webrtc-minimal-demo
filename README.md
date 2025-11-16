# WebRTC Video Call Application

Modern ve minimal tasarıma sahip, WebRTC tabanlı 1'e 1 video görüşme uygulaması.

## 🎯 Özellikler

### Ana Özellikler
- ✅ **WebRTC Bağlantısı**: RTCPeerConnection + MediaStream ile gerçek zamanlı iletişim
- 📹 **Cihaz Seçimi**: Mikrofon, kamera ve kalite ayarları
- 🔧 **STUN/TURN Yapılandırması**: Esnek ICE server yapılandırması
- 💬 **Text Chat**: WebRTC DataChannel ile anlık mesajlaşma
- 🎥 **1'e 1 Video Görüşme**: HD kalitede video konferans
- 📊 **Bağlantı Kalitesi**: Bitrate, ping, packet loss göstergeleri
- 📱 **Mobil Uyumlu**: Responsive tasarım

### Kontroller
- 🔇 Mute/Unmute (Ses aç/kapa)
- 📷 Camera Toggle (Kamera aç/kapa)
- 🔄 Reconnect (Yeniden bağlan)
- ❌ End Call (Aramayı sonlandır)

### Ekranlar
1. **Landing**: Oda oluştur veya odaya katıl
2. **Device Setup**: Mikrofon, kamera ve kalite seçimi
3. **Call Screen**: İki taraflı video + chat paneli
4. **Connection Diagnostics**: ICE candidates, STUN/TURN durumu
5. **Settings**: Signaling URL, TURN server, video kalitesi ayarları

## 🏗️ Proje Yapısı

\`\`\`
app/
├── layout.tsx              # Ana layout ve metadata
├── globals.css             # Global stiller ve tema
├── page.tsx                # Landing sayfası
├── setup/
│   └── page.tsx           # Cihaz kurulum sayfası
├── call/
│   └── [roomId]/
│       └── page.tsx       # Video görüşme sayfası
├── diagnostics/
│   └── page.tsx           # Bağlantı tanılama
└── settings/
    └── page.tsx           # Ayarlar sayfası

components/
├── ui/                    # shadcn/ui bileşenleri
├── connection-status-badge.tsx
├── video-player.tsx
├── device-selector.tsx
├── chat-panel.tsx
└── call-controls.tsx

lib/
├── types/
│   └── webrtc.ts         # TypeScript tipleri
├── webrtc/
│   ├── config.ts         # WebRTC yapılandırması
│   ├── peer-connection.ts # RTCPeerConnection wrapper
│   └── media-devices.ts  # Medya cihaz yönetimi
└── utils/
    └── room.ts           # Oda ID yönetimi
\`\`\`

## 🚀 Kurulum

### Önkoşullar
- Node.js 18.x veya üzeri
- npm veya yarn

### Adımlar

1. Projeyi klonlayın:
\`\`\`bash
git clone <repo-url>
cd webrtc-call-app
\`\`\`

2. Bağımlılıkları yükleyin:
\`\`\`bash
npm install
# veya
yarn install
\`\`\`

3. Geliştirme sunucusunu başlatın:
\`\`\`bash
npm run dev
# veya
yarn dev
\`\`\`

4. Tarayıcınızda açın: [http://localhost:3000](http://localhost:3000)

## 🔧 Yapılandırma

### STUN/TURN Sunucuları

Varsayılan olarak Google'ın genel STUN sunucuları kullanılır. Kendi TURN sunucunuzu eklemek için:

\`\`\`typescript
// lib/webrtc/config.ts
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: 'stun:stun.l.google.com:19302',
  },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'your-username',
    credential: 'your-password',
  },
]
\`\`\`

### Video Kalitesi

Üç kalite seviyesi desteklenir:
- **480p**: 640x480, 24fps (düşük bant genişliği)
- **720p**: 1280x720, 30fps (önerilen)
- **1080p**: 1920x1080, 30fps (yüksek kalite)

## 🌐 Signaling Sunucusu

Bu proje, signaling için bir WebSocket sunucusu gerektirir. Örnek implementasyon:

\`\`\`typescript
// Basit WebSocket signaling server örneği
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Mesajı oda içindeki diğer kullanıcılara ilet
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  })
})
\`\`\`

## 📊 Akış Diyagramı

\`\`\`
[Landing Page]
      |
      v
[Device Setup] --> Mikrofon/Kamera İzinleri
      |
      v
[Signaling] --> WebSocket Bağlantısı
      |
      v
[Offer/Answer] --> SDP Exchange
      |
      v
[ICE Gathering] --> STUN/TURN
      |
      v
[Connected] --> Video + Audio + DataChannel
      |
      |-- [Call Controls] --> Mute/Camera/End
      |-- [Chat Panel] --> Text Messages
      |-- [Quality Monitor] --> Stats Display
\`\`\`

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Primary (Mavi)**: oklch(0.55 0.18 250) - Bağlantı durumları
- **Success (Yeşil)**: oklch(0.55 0.15 145) - Başarılı bağlantı
- **Warning (Amber)**: oklch(0.65 0.17 70) - Bağlanıyor durumu
- **Destructive (Kırmızı)**: oklch(0.55 0.22 25) - Hata durumları
- **Neutral (Gri tonları)**: Arka plan ve kenarlıklar

### Tipografi
- **Font Family**: Geist Sans (UI), Geist Mono (Kod)
- **Scales**: text-sm, text-base, text-lg, text-xl

## 🧪 Test Etme

### Yerel Test
1. İki tarayıcı penceresi açın
2. Birinde "Oda Oluştur" yapın
3. Oda ID'sini diğer pencereye girin
4. Her iki pencerede de kamera/mikrofon izinlerini verin
5. Bağlantının kurulmasını bekleyin

### Farklı Ağlarda Test
- TURN sunucusu gerekebilir
- NAT traversal için TURN yapılandırması önemlidir

## 📝 Lisans

MIT

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (\`git checkout -b feature/amazing\`)
3. Değişikliklerinizi commit edin (\`git commit -m 'feat: Add amazing feature'\`)
4. Branch'inizi push edin (\`git push origin feature/amazing\`)
5. Pull Request oluşturun

## 📞 Destek

Sorularınız için issue açabilirsiniz.
