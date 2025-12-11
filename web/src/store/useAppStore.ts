import { create } from 'zustand'
import { fetchNui } from '../utils/fetchNui'
import type { AppConfig, UserState, ShopItem } from '../types'

export type Tab = 'home' | 'coins' | 'shop' | 'exchange' | 'marketplace'

interface AppState {
    currentTab: Tab
    setTab: (tab: Tab) => void

    user: UserState
    setUser: (user: Partial<UserState>) => void

    config: AppConfig
    setConfig: (config: Partial<AppConfig>) => void

    addToCart: (item: ShopItem) => void
    buyItem: (item: ShopItem) => void
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

    config: {
        exchangeRate: 1000 // Default value, will be overridden by server
    },
    setConfig: (configData) => set((state) => ({ config: { ...state.config, ...configData } })),

    addToCart: (item) => {
        // Direct purchase in this MVP
        fetchNui('buyItem', {
            itemId: item.id,
            category: item.category,
            price: item.price,
            label: item.label
        })
    },

    buyItem: (item) => {
        // Same as addToCart for now
        fetchNui('buyItem', {
            id: item.id,
            price: item.price,
            label: item.label
        })
    },
}))
