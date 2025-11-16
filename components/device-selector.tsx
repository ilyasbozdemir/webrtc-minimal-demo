'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Mic, Video, Speaker } from 'lucide-react'

interface DeviceSelectorProps {
  type: 'audioinput' | 'videoinput' | 'audiooutput'
  selectedDeviceId: string
  onDeviceChange: (deviceId: string) => void
  devices: MediaDeviceInfo[]
}

const icons = {
  audioinput: Mic,
  videoinput: Video,
  audiooutput: Speaker,
}

const labels = {
  audioinput: 'Mikrofon',
  videoinput: 'Kamera',
  audiooutput: 'Hoparlör',
}

export function DeviceSelector({
  type,
  selectedDeviceId,
  onDeviceChange,
  devices,
}: DeviceSelectorProps) {
  const Icon = icons[type]
  const label = labels[type]
  const filteredDevices = devices.filter((d) => d.kind === type)

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </Label>
      <Select value={selectedDeviceId} onValueChange={onDeviceChange}>
        <SelectTrigger>
          <SelectValue placeholder={`${label} seçin`} />
        </SelectTrigger>
        <SelectContent>
          {filteredDevices.length === 0 ? (
            <SelectItem value="no-device" disabled>
              {label} bulunamadı
            </SelectItem>
          ) : (
            filteredDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId || `device-${filteredDevices.indexOf(device)}`}>
                {device.label || `${label} ${filteredDevices.indexOf(device) + 1}`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
