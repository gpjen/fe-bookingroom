export type ID = string

export type Building = {
  id: ID
  name: string
  code?: string
  address?: string
  timezone?: string
}

export type Floor = {
  id: ID
  buildingId: ID
  name: string
  level: number
}

export type RoomStatus = 'available' | 'unavailable' | 'maintenance'

export type Room = {
  id: ID
  floorId: ID
  name: string
  type?: string
  capacity?: number
  amenities?: string[]
  status?: RoomStatus
}

export type AssetStatus = 'active' | 'inactive' | 'maintenance'

export type Asset = {
  id: ID
  type: string
  name: string
  serial?: string
  roomId?: ID
  status?: AssetStatus
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export type Booking = {
  id: ID
  roomId: ID
  userId: ID
  start: string
  end: string
  status: BookingStatus
  purpose?: string
  notes?: string
}

export type BookingRule = {
  id: ID
  roomType?: string
  maxDurationMinutes?: number
  allowOverlap?: boolean
  bufferMinutes?: number
}

export type AuditLog = {
  id: ID
  actorId: ID
  action: string
  entity: string
  timestamp: string
  diff?: Record<string, unknown>
}

