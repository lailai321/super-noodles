export interface MenuItem {
  uuid: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  hasAddons: boolean
  noExtraMeat?: boolean
  noExtraVeg?: boolean
}

export interface MenuCategory {
  name: string
  slug: string
  hasAddons: boolean
  items: MenuItem[]
}

export interface CartItem {
  uuid: string
  name: string
  price: number
  quantity: number
  extraMeat: boolean
  extraVegetable: boolean
  notes: string
  flavourSelections?: Record<string, number>
  optionSelections?: Record<string, string[]>
  optionExtrasCents?: number
}

export interface Order {
  id: string
  order_number: number
  customer_name: string
  customer_phone: string
  total_cents: number
  pickup_time: string
  stripe_session_id: string
  status: 'pending' | 'confirmed' | 'ready' | 'collected'
  acknowledged_at?: string | null
  ready_at?: string | null
  collected_at?: string | null
  sms_status?: 'not_sent' | 'sending' | 'sent' | 'failed'
  sms_sent_at?: string | null
  sms_error?: string | null
  created_at: string
  order_items: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  item_uuid: string
  item_name: string
  quantity: number
  unit_price_cents: number
  extra_meat: boolean
  extra_vegetable: boolean
  notes: string
}
