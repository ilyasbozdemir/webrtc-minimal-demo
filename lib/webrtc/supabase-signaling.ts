import { supabase } from '../supabase'
import { SignalingMessage } from './local-signaling'

export class SupabaseSignaling {
  private roomId: string
  private userId: string
  private channel: any
  private onMessageCallback: ((message: SignalingMessage) => void) | null = null

  private isSubscribed = false
  private pendingMessages: any[] = []

  constructor(roomId: string, userId: string) {
    this.roomId = roomId
    this.userId = userId
    
    this.channel = supabase.channel(`room_${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
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
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState()
        console.log('SupabaseSignaling: Presence state synced:', state)
      })
      .subscribe(async (status: string) => {
        console.log('SupabaseSignaling: Channel status:', status)
        if (status === 'SUBSCRIBED') {
          this.isSubscribed = true
          
          // Katılımcıyı DB'ye kaydet
          await this.registerParticipant()
          
          // Track presence
          await this.channel.track({
            online_at: new Date().toISOString(),
            user_id: this.userId,
          })

          // Bekleyen mesajları gönder
          while (this.pendingMessages.length > 0) {
            const msg = this.pendingMessages.shift()
            this.send(msg.type, msg.data)
          }
        }
      })
  }

  private async registerParticipant() {
    try {
      await supabase
        .from('participants')
        .upsert({ 
          room_id: this.roomId, 
          user_id: this.userId,
          last_seen: new Date().toISOString()
        }, { onConflict: 'room_id,user_id' })
    } catch (err) {
      console.error('Failed to register participant:', err)
    }
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

  sendJoin(): void {
    this.send('peer-joined', {})
  }

  private async send(type: 'offer' | 'answer' | 'ice-candidate' | 'peer-joined', data: any): Promise<void> {
    if (!this.isSubscribed) {
      console.log('SupabaseSignaling: Not subscribed yet, queuing message:', type)
      this.pendingMessages.push({ type, data })
      return
    }

    const message: SignalingMessage = {
      type,
      roomId: this.roomId,
      from: this.userId,
      ...data,
      timestamp: Date.now(),
      id: `${this.userId}_${Date.now()}_${Math.random()}`,
    }

    console.log('SupabaseSignaling: Sending signal:', type, 'from:', this.userId)
    
    this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: message,
    })
  }

  close(): void {
    console.log('SupabaseSignaling: Closing channel')
    if (this.channel) {
      this.channel.unsubscribe()
      supabase.removeChannel(this.channel)
    }
  }
}
