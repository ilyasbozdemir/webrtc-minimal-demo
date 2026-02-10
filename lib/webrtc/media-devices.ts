import { DEFAULT_MEDIA_CONSTRAINTS, VIDEO_QUALITY_PRESETS, VideoQuality } from './config'

export class MediaDeviceManager {
  // Get all available media devices
  static async getDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices
    } catch (error) {
      console.error('Error enumerating devices:', error)
      throw error
    }
  }

  // Get audio input devices
  static async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await this.getDevices()
    return devices.filter((device) => device.kind === 'audioinput')
  }

  // Get video input devices
  static async getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await this.getDevices()
    return devices.filter((device) => device.kind === 'videoinput')
  }

  // Get audio output devices
  static async getAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await this.getDevices()
    return devices.filter((device) => device.kind === 'audiooutput')
  }

  // Request user media with specific devices
  static async getUserMedia(
    audioDeviceId?: string,
    videoDeviceId?: string,
    videoQuality: VideoQuality = '720p'
  ): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: audioDeviceId
          ? {
              ...(typeof DEFAULT_MEDIA_CONSTRAINTS.audio === 'object' ? DEFAULT_MEDIA_CONSTRAINTS.audio : {}),
              deviceId: { exact: audioDeviceId },
            }
          : DEFAULT_MEDIA_CONSTRAINTS.audio,
        video: videoDeviceId
          ? {
              ...(typeof VIDEO_QUALITY_PRESETS[videoQuality] === 'object' ? VIDEO_QUALITY_PRESETS[videoQuality] : {}),
              deviceId: { exact: videoDeviceId },
            }
          : VIDEO_QUALITY_PRESETS[videoQuality],
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      return stream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }

  // Check if browser supports WebRTC
  static isWebRTCSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      navigator?.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      !!window.RTCPeerConnection
    )
  }

  // Request permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      // Stop all tracks immediately
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (error) {
      console.error('Error requesting permissions:', error)
      return false
    }
  }
}
