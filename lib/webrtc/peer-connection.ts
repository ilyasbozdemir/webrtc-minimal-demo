import { DEFAULT_WEBRTC_CONFIG } from './config'
import type { WebRTCConfig, ConnectionQuality } from '@/lib/types/webrtc'

export class WebRTCPeerConnection {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private statsInterval: NodeJS.Timeout | null = null

  constructor(private config: WebRTCConfig = DEFAULT_WEBRTC_CONFIG) {}

  // Initialize peer connection
  initializePeerConnection(): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    })

    // Create data channel for chat
    this.dataChannel = this.peerConnection.createDataChannel('chat', {
      ordered: true,
    })

    return this.peerConnection
  }

  // Set local stream
  setLocalStream(stream: MediaStream): void {
    this.localStream = stream

    if (this.peerConnection) {
      stream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, stream)
      })
    }
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  // Get remote stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  // Set remote stream
  setRemoteStream(stream: MediaStream): void {
    this.remoteStream = stream
  }

  // Get data channel
  getDataChannel(): RTCDataChannel | null {
    return this.dataChannel
  }

  // Set data channel (for answerer)
  setDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel
  }

  // Create offer
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  // Create answer
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  // Set remote description
  async setRemoteDescription(
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    )
  }

  // Add ICE candidate
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  }

  // Get connection state
  getConnectionState(): RTCPeerConnectionState {
    return this.peerConnection?.connectionState || 'closed'
  }

  // Get ICE connection state
  getIceConnectionState(): RTCIceConnectionState {
    return this.peerConnection?.iceConnectionState || 'closed'
  }

  // Get stats
  async getConnectionStats(): Promise<ConnectionQuality | null> {
    if (!this.peerConnection) return null

    const stats = await this.peerConnection.getStats()
    let bitrate = 0
    let packetLoss = 0
    let roundTripTime = 0
    let jitter = 0

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        bitrate = report.bytesReceived || 0
        packetLoss = report.packetsLost || 0
        jitter = report.jitter || 0
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        roundTripTime = report.currentRoundTripTime || 0
      }
    })

    return {
      bitrate,
      packetLoss,
      roundTripTime: Math.round(roundTripTime * 1000), // Convert to ms
      jitter: Math.round(jitter * 1000), // Convert to ms
      timestamp: Date.now(),
    }
  }

  // Start monitoring stats
  startStatsMonitoring(callback: (stats: ConnectionQuality) => void): void {
    this.statsInterval = setInterval(async () => {
      const stats = await this.getConnectionStats()
      if (stats) {
        callback(stats)
      }
    }, 1000) // Update every second
  }

  // Stop monitoring stats
  stopStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }
  }

  // Toggle audio
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled
      })
    }
  }

  // Toggle video
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled
      })
    }
  }

  // Send data through data channel
  sendData(data: string): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(data)
    }
  }

  // Close connection
  close(): void {
    this.stopStatsMonitoring()

    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
  }

  // Get peer connection instance
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection
  }
}
