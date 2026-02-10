// LocalStorage-based signaling for testing in same browser
// In production, replace with a WebSocket signaling server

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'peer-joined'
  roomId: string
  from: string
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  timestamp: number
  id: string
}

export class LocalSignaling {
  private roomId: string
  private userId: string
  private onMessageCallback: ((message: SignalingMessage) => void) | null = null
  private storageListener: ((e: StorageEvent) => void) | null = null
  private processedMessageIds: Set<string> = new Set()
  private pollingInterval: NodeJS.Timeout | null = null

  constructor(roomId: string, userId: string) {
    this.roomId = roomId
    this.userId = userId
    console.log('LocalSignaling created. roomId:', roomId, 'userId:', userId)
    
    this.cleanupOldMessages()
  }

  sendOffer(offer: RTCSessionDescriptionInit): void {
    console.log('Sending offer from:', this.userId)
    this.send('offer', { offer })
  }

  sendAnswer(answer: RTCSessionDescriptionInit): void {
    console.log('Sending answer from:', this.userId)
    this.send('answer', { answer })
  }

  sendIceCandidate(candidate: RTCIceCandidateInit): void {
    console.log('Sending ICE candidate from:', this.userId)
    this.send('ice-candidate', { candidate })
  }

  private send(type: 'offer' | 'answer' | 'ice-candidate', data: any): void {
    const message: SignalingMessage = {
      type,
      roomId: this.roomId,
      from: this.userId,
      ...data,
      timestamp: Date.now(),
      id: `${this.userId}_${Date.now()}_${Math.random()}`,
    }

    const key = `webrtc_signal_${this.roomId}`
    const existingMessages = this.getMessages()
    existingMessages.push(message)
    
    localStorage.setItem(key, JSON.stringify(existingMessages))
    
    console.log('Message stored:', type, 'from:', this.userId, 'total messages:', existingMessages.length, 'messageId:', message.id)
  }

  onMessage(callback: (message: SignalingMessage) => void): void {
    this.onMessageCallback = callback

    console.log('Setting up message listener for userId:', this.userId)
    const existingMessages = this.getMessages()
    console.log('Found', existingMessages.length, 'existing messages in room')
    
    existingMessages.forEach((message) => {
      if (message.from !== this.userId && !this.processedMessageIds.has(message.id)) {
        console.log('Processing existing message:', message.type, 'from:', message.from, 'to:', this.userId)
        this.processedMessageIds.add(message.id)
        callback(message)
      }
    })

    this.storageListener = (e: StorageEvent) => {
      if (e.key === `webrtc_signal_${this.roomId}` && e.newValue) {
        console.log('Storage event received by:', this.userId)
        const messages: SignalingMessage[] = JSON.parse(e.newValue)
        
        messages.forEach((message) => {
          if (message.from !== this.userId && !this.processedMessageIds.has(message.id)) {
            console.log('Processing new storage message:', message.type, 'from:', message.from, 'to:', this.userId)
            this.processedMessageIds.add(message.id)
            if (this.onMessageCallback) {
              this.onMessageCallback(message)
            }
          }
        })
      }
    }

    window.addEventListener('storage', this.storageListener)
    console.log('Storage listener attached for userId:', this.userId)

    this.pollingInterval = setInterval(() => {
      const messages = this.getMessages()
      messages.forEach((message) => {
        if (message.from !== this.userId && !this.processedMessageIds.has(message.id)) {
          console.log('Polling found unprocessed message:', message.type, 'from:', message.from, 'to:', this.userId)
          this.processedMessageIds.add(message.id)
          if (this.onMessageCallback) {
            this.onMessageCallback(message)
          }
        }
      })
    }, 500)
    
    console.log('Polling started for userId:', this.userId)
  }

  private getMessages(): SignalingMessage[] {
    const key = `webrtc_signal_${this.roomId}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  cleanupOldMessages(): void {
    const messages = this.getMessages()
    const now = Date.now()
    const twoMinutes = 2 * 60 * 1000

    const filtered = messages.filter((msg) => now - msg.timestamp < twoMinutes)
    
    const key = `webrtc_signal_${this.roomId}`
    if (filtered.length > 0) {
      localStorage.setItem(key, JSON.stringify(filtered))
    } else {
      localStorage.removeItem(key)
    }
    
    console.log('Cleaned up old messages. Before:', messages.length, 'After:', filtered.length)
  }

  close(): void {
    console.log('LocalSignaling closed for userId:', this.userId)
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener)
    }
    this.onMessageCallback = null
  }

  clearRoom(): void {
    const key = `webrtc_signal_${this.roomId}`
    localStorage.removeItem(key)
    console.log('Room cleared:', this.roomId)
  }
}
