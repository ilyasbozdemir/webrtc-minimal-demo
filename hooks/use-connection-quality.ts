'use client'

import { useState, useEffect, useRef } from 'react'
import { ConnectionQuality } from '@/lib/types/webrtc'
import { WebRTCPeerConnection } from '@/lib/webrtc/peer-connection'

interface UseConnectionQualityProps {
  peerConnection: WebRTCPeerConnection | null
  isConnected: boolean
}

export function useConnectionQuality({
  peerConnection,
  isConnected,
}: UseConnectionQualityProps) {
  const [quality, setQuality] = useState<ConnectionQuality | null>(null)
  const [history, setHistory] = useState<ConnectionQuality[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!peerConnection || !isConnected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Start monitoring
    peerConnection.startStatsMonitoring((stats) => {
      setQuality(stats)
      setHistory((prev) => {
        const updated = [...prev, stats]
        // Keep last 60 entries (1 minute at 1s intervals)
        return updated.slice(-60)
      })
    })

    return () => {
      if (peerConnection) {
        peerConnection.stopStatsMonitoring()
      }
    }
  }, [peerConnection, isConnected])

  // Calculate averages
  const getAverages = () => {
    if (history.length === 0) return null

    const sum = history.reduce(
      (acc, curr) => ({
        bitrate: acc.bitrate + curr.bitrate,
        packetLoss: acc.packetLoss + curr.packetLoss,
        roundTripTime: acc.roundTripTime + curr.roundTripTime,
        jitter: acc.jitter + curr.jitter,
      }),
      { bitrate: 0, packetLoss: 0, roundTripTime: 0, jitter: 0 }
    )

    return {
      bitrate: Math.round(sum.bitrate / history.length),
      packetLoss: Math.round(sum.packetLoss / history.length),
      roundTripTime: Math.round(sum.roundTripTime / history.length),
      jitter: Math.round(sum.jitter / history.length),
      timestamp: Date.now(),
    }
  }

  return {
    quality,
    history,
    averages: getAverages(),
  }
}
