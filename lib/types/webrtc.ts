// WebRTC connection states
export type ConnectionStatus = 'connected' | 'connecting' | 'idle' | 'reconnecting' | 'failed' | 'disconnected'

// Signaling message types
export type SignalingMessageType = 
  | 'offer' 
  | 'answer' 
  | 'ice-candidate' 
  | 'join-room'
  | 'leave-room'
  | 'room-joined'
  | 'user-joined'
  | 'user-left'

export interface SignalingMessage {
  type: SignalingMessageType
  payload?: unknown
  roomId?: string
  userId?: string
}

// WebRTC configuration
export interface WebRTCConfig {
  iceServers: RTCIceServer[]
  signalingUrl?: string
}

// Media device info
export interface MediaDeviceInfo {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

// Connection quality metrics
export interface ConnectionQuality {
  bitrate: number
  packetLoss: number
  roundTripTime: number
  jitter: number
  timestamp: number
}

// Call state
export interface CallState {
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  connectionState: ConnectionStatus
  roomId: string | null
  remoteUserId: string | null
}

// ICE candidate info
export interface IceCandidateInfo {
  candidate: string
  type: string
  protocol: string
  address: string
  port: number
  priority: number
}

// Chat message
export interface ChatMessage {
  id: string
  text: string
  sender: 'local' | 'remote'
  timestamp: number
}
