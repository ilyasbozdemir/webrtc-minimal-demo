'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, X } from 'lucide-react'
import { ChatMessage } from '@/lib/types/webrtc'
import { cn } from '@/lib/utils'

interface ChatPanelProps {
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  onClose?: () => void
  isChatReady: boolean
  hideCloseButton?: boolean
}

export function ChatPanel({
  messages,
  onSendMessage,
  onClose,
  isChatReady,
  hideCloseButton = false,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (inputValue.trim() && isChatReady) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="flex h-full flex-col border-0 shadow-none">
      {!hideCloseButton && (
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b pb-4">
          <CardTitle className="text-lg">Sohbet</CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
      )}

      <CardContent className="flex flex-1 flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 px-3 sm:px-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-8">
              <p className="text-center text-sm text-muted-foreground">
                Henüz mesaj yok.
                <br />
                İlk mesajı gönderin!
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-4 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-1',
                    message.sender === 'local' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 sm:max-w-[80%]',
                      message.sender === 'local'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    <p className="break-words text-sm">{message.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3 sm:p-4">
          {!isChatReady && (
            <div className="mb-3 rounded-md bg-warning/10 px-3 py-2">
              <p className="text-xs text-warning-foreground">
                Chat bağlantısı kuruluyor...
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Mesaj yazın..."
              disabled={!isChatReady}
              className="flex-1 text-base sm:text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || !isChatReady}
              className="h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Gönder</span>
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
