'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChatMessage } from '@/lib/types/webrtc'

interface UseChatProps {
  dataChannel: RTCDataChannel | null
}

export function useChat({ dataChannel }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!dataChannel) {
      setIsReady(false)
      return
    }

    const checkReadyState = () => {
      setIsReady(dataChannel.readyState === 'open')
    }

    checkReadyState()
    
    dataChannel.addEventListener('open', checkReadyState)
    dataChannel.addEventListener('close', checkReadyState)
    dataChannel.addEventListener('error', checkReadyState)

    return () => {
      dataChannel.removeEventListener('open', checkReadyState)
      dataChannel.removeEventListener('close', checkReadyState)
      dataChannel.removeEventListener('error', checkReadyState)
    }
  }, [dataChannel])

  // Handle incoming messages
  useEffect(() => {
    if (!dataChannel) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'chat') {
          const newMessage: ChatMessage = {
            id: data.id || `${Date.now()}-remote`,
            text: data.text,
            sender: 'remote',
            timestamp: data.timestamp || Date.now(),
          }
          
          setMessages((prev) => [...prev, newMessage])
        }
      } catch (error) {
        console.error(' Error parsing message:', error)
      }
    }

    dataChannel.addEventListener('message', handleMessage)

    return () => {
      dataChannel.removeEventListener('message', handleMessage)
    }
  }, [dataChannel])

  // Send message
  const sendMessage = useCallback(
    (text: string) => {
      if (!dataChannel || dataChannel.readyState !== 'open') {
        return
      }

      const message: ChatMessage = {
        id: `${Date.now()}-local`,
        text,
        sender: 'local',
        timestamp: Date.now(),
      }

      // Add to local messages
      setMessages((prev) => [...prev, message])

      // Send through data channel
      try {
        dataChannel.send(
          JSON.stringify({
            type: 'chat',
            id: message.id,
            text: message.text,
            timestamp: message.timestamp,
          })
        )
      } catch (error) {
        console.error(' Error sending message:', error)
      }
    },
    [dataChannel]
  )

  return {
    messages,
    sendMessage,
    isReady,
  }
}
