import { WebRTCConfig } from '@/lib/types/webrtc'

// Default STUN servers (Google's public STUN servers)
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: 'stun:stun.l.google.com:19302',
  },
  {
    urls: 'stun:stun1.l.google.com:19302',
  },
]

// Example TURN server configuration (users need to add their own)
export const EXAMPLE_TURN_SERVERS: RTCIceServer[] = [
  {
    urls: 'turn:turn.example.com:3478',
    username: 'user',
    credential: 'pass',
  },
]

// Default WebRTC configuration
export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: DEFAULT_ICE_SERVERS,
}

// Media constraints
export const DEFAULT_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
}

// Video quality presets
export const VIDEO_QUALITY_PRESETS = {
  '480p': {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24 },
  },
  '720p': {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  '1080p': {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
} as const

export type VideoQuality = keyof typeof VIDEO_QUALITY_PRESETS
