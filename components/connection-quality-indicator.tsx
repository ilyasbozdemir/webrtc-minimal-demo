'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { ConnectionQuality } from '@/lib/types/webrtc'

interface ConnectionQualityIndicatorProps {
  quality: ConnectionQuality | null
  className?: string
}

export function ConnectionQualityIndicator({
  quality,
  className,
}: ConnectionQualityIndicatorProps) {
  if (!quality) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Bağlantı metrikleri bekleniyor...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate quality rating
  const getQualityRating = () => {
    if (quality.roundTripTime > 300 || quality.packetLoss > 5) {
      return { label: 'Zayıf', variant: 'destructive' as const, icon: WifiOff }
    }
    if (quality.roundTripTime > 150 || quality.packetLoss > 2) {
      return { label: 'Orta', variant: 'warning' as const, icon: AlertTriangle }
    }
    return { label: 'İyi', variant: 'success' as const, icon: Wifi }
  }

  const rating = getQualityRating()
  const Icon = rating.icon

  // Format bitrate
  const formatBitrate = (bytes: number) => {
    const kbps = (bytes * 8) / 1000
    if (kbps > 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`
    }
    return `${kbps.toFixed(0)} Kbps`
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Overall Quality */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">Bağlantı Kalitesi</span>
            </div>
            <Badge variant={rating.variant}>{rating.label}</Badge>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Bitrate</p>
              <p className="font-mono font-medium">{formatBitrate(quality.bitrate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ping (RTT)</p>
              <p className="font-mono font-medium">{quality.roundTripTime}ms</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Packet Loss</p>
              <p className="font-mono font-medium">{quality.packetLoss}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Jitter</p>
              <p className="font-mono font-medium">{quality.jitter}ms</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
