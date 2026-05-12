export type ElectricityBillType = {
  id: number
  roomId: number
  room?: {
    roomNumber: string
    title: string
    roomType: string
  }
  month: string
  units: number
  amount: number
  dueDate: string
  isPaid: boolean
  paidDate?: string
  bookingId?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CreateElectricityBillData = {
  roomId: number
  month: string
  units: number
  amount: number
  dueDate: string
  bookingId?: number
  notes?: string
}

export type PendingBillsSummary = {
  count: number
  totalAmount: number
  bills: ElectricityBillType[]
}
