// Shared TypeScript interfaces for the Caserio Marketplace

export interface AppConfig {
    exchangeRate: number
}

export interface UserState {
    coins: number
    money: number
    name: string
    isAdmin?: boolean
}

export interface ShopItem {
    id: string
    label: string
    price: number
    category?: string
}

export interface VehicleItem extends ShopItem {
    model: string
    type: 'vehicle'
}

export interface WeaponItem extends ShopItem {
    item: string
    type: 'weapon'
    tint?: number
    attachments?: string[]
}

export interface Vehicle {
    id: number
    vehicle: string
    plate: string
    mods?: string
    state: number
}

export interface Weapon {
    slot: number
    item: string
    label: string
    tint?: number
    attachments?: string[]
    amount: number
}

export interface ListingItemData {
    vehicle_id?: number
    model?: string
    plate?: string
    mods?: string
    item?: string
    label?: string
    tint?: number
    attachments?: string[]
}

export interface Listing {
    id: number
    seller_citizenid: string
    seller_name: string
    type: 'vehicle' | 'weapon'
    item_data: string // JSON string, parse with ListingItemData
    price: number
    status: 'ACTIVE' | 'SOLD' | 'CANCELLED'
    created_at: string
    sold_at?: string
    buyer_citizenid?: string
}
