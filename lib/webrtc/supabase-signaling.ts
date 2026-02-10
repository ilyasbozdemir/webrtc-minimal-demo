import { supabase } from '../supabase'
import { SignalingMessage } from './local-signaling'

export class SupabaseSignaling {
  private roomId: string
  private userId: string
  private channel: any
  private onMessageCallback: ((message: SignalingMessage) => void) | null = null

  constructor(roomId: string, userId: string) {
    this.roomId = roomId
    this.userId = userId
    
    // Create a channel for this room
    this.channel = supabase.channel(`room_${roomId}`, {
      config: {
        broadcast: { self: false },
      },
    })

    console.log('SupabaseSignaling initialized for room:', roomId, 'user:', userId)
  }

  onMessage(callback: (message: SignalingMessage) => void): void {
    this.onMessageCallback = callback

    this.channel
      .on('broadcast', { event: 'signal' }, ({ payload }: { payload: SignalingMessage }) => {
        console.log('SupabaseSignaling: Received broadcast signal:', payload.type, 'from:', payload.from)
        if (payload.from !== this.userId) {
          this.onMessageCallback?.(payload)
        }
      })
      .subscribe((status: string) => {
        console.log('SupabaseSignaling: Channel status:', status)
      })
  }

  sendOffer(offer: RTCSessionDescriptionInit): void {
    this.send('offer', { offer })
  }

  sendAnswer(answer: RTCSessionDescriptionInit): void {
    this.send('answer', { answer })
  }

  sendIceCandidate(candidate: RTCIceCandidateInit): void {
    this.send('ice-candidate', { candidate })
  }

  private async send(type: 'offer' | 'answer' | 'ice-candidate', data: any): Promise<void> {
    const message: SignalingMessage = {
      type,
      roomId: this.roomId,
      from: this.userId,
      ...data,
      timestamp: Date.now(),
      id: `${this.userId}_${Date.now()}_${Math.random()}`,
    }

    console.log('SupabaseSignaling: Sending signal:', type, 'from:', this.userId)
    
    const response = await this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: message,
    })

    if (response !== 'ok') {
      console.error('SupabaseSignaling: Failed to send signal:', response)
    }
  }

  close(): void {
    console.log('SupabaseSignaling: Closing channel')
    if (this.channel) {
      this.channel.unsubscribe()
      supabase.removeChannel(this.channel)
    }
  }
}
