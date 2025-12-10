import { create } from 'zustand'
import { fetchNui } from '../utils/fetchNui'

export type Tab = 'home' | 'coins' | 'shop' | 'exchange' | 'marketplace'

interface UserState {
    coins: number
    money: number
    name: string
    isAdmin?: boolean
}

interface AppState {
    currentTab: Tab
    setTab: (tab: Tab) => void

    user: UserState
    setUser: (user: Partial<UserState>) => void

    addToCart: (item: any) => void
    buyItem: (item: any) => void
}

export const useAppStore = create<AppState>((set) => ({
    currentTab: 'home',
    setTab: (tab) => set({ currentTab: tab }),

    user: {
        coins: 0, // Loaded from server
        money: 0, // Loaded from server
        name: 'Jugador',
        isAdmin: false
    },
    setUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),

    addToCart: (item) => {
        // Direct purchase in this MVP
        fetchNui('buyItem', {
            itemId: item.id,
            category: item.category,
            price: item.price,
            label: item.name
        })
    },

    buyItem: (item) => {
        // Same as addToCart for now
        fetchNui('buyItem', {
            id: item.id,
            price: item.price,
            label: item.label || item.name
        })
    },
}))
