// Generate a random room ID
export function generateRoomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Validate room ID format
export function isValidRoomId(roomId: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(roomId)
}

// Format room ID for display (adds hyphens)
export function formatRoomId(roomId: string): string {
  return roomId.match(/.{1,4}/g)?.join('-') || roomId
}

// Parse formatted room ID (removes hyphens)
export function parseRoomId(formattedRoomId: string): string {
  return formattedRoomId.replace(/-/g, '').toUpperCase()
}
