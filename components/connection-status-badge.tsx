import { Badge } from '@/components/ui/badge'
import type { ConnectionState } from '@/lib/types/webrtc'

interface ConnectionStatusBadgeProps {
  state: ConnectionState
  className?: string
}

export function ConnectionStatusBadge({ state, className }: ConnectionStatusBadgeProps) {
  const config = {
    idle: { variant: 'outline' as const, label: 'İdle' },
    connecting: { variant: 'warning' as const, label: 'Bağlanıyor...' },
    connected: { variant: 'success' as const, label: 'Bağlandı' },
    reconnecting: { variant: 'warning' as const, label: 'Yeniden bağlanıyor...' },
    failed: { variant: 'destructive' as const, label: 'Başarısız' },
    disconnected: { variant: 'outline' as const, label: 'Bağlantı kesildi' },
  }

  const { variant, label } = config[state]

  return (
    <Badge variant={variant} className={className}>
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  )
}
