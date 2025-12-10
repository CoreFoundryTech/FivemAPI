import { useState, useEffect } from 'react'
import { Plus, Search, Users, Loader2 } from 'lucide-react'
import { useLocales } from '../hooks/useLocales'
import { useAppStore } from '../store/useAppStore'
import { fetchNui } from '../utils/fetchNui'
import {
    ListingCard,
    SellVehicleModal,
    SellWeaponModal,
    ConfirmPurchaseModal,
    PlateChangeModal
} from '../components/marketplace'

interface Listing {
    id: number
    seller_citizenid: string
    seller_name: string
    type: 'vehicle' | 'weapon'
    item_data: string
    price: number
    status: string
    created_at: string
}

interface Vehicle {
    id: number
    vehicle: string
    plate: string
    mods?: string
    state: number
}

interface Weapon {
    slot: number
    item: string
    label: string
    tint?: number
    attachments?: string[]
}

export const MarketplaceView = () => {
    const { t } = useLocales()
    const { user } = useAppStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [listings, setListings] = useState<Listing[]>([])
    const [myVehicles, setMyVehicles] = useState<Vehicle[]>([])
    const [myWeapons, setMyWeapons] = useState<Weapon[]>([])
    const [myListings, setMyListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'browse' | 'sell'>('browse')

    // Modals
    const [showSellVehicleModal, setShowSellVehicleModal] = useState(false)
    const [showSellWeaponModal, setShowSellWeaponModal] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState<Listing | null>(null)
    const [showPlateChangeModal, setShowPlateChangeModal] = useState<{ listing: Listing, model: string, plate: string } | null>(null)

    useEffect(() => {
        fetchNui('getActiveListings', {})

        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data
            if (action === 'receiveListings') {
                setListings(data || [])
                setLoading(false)
            } else if (action === 'receiveMyVehicles') {
                setMyVehicles(data || [])
            } else if (action === 'receiveMyWeapons') {
                setMyWeapons(data || [])
            } else if (action === 'receiveMyListings') {
                setMyListings(data || [])
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    const handleCreateVehicleListing = (vehicleId: number, price: number) => {
        fetchNui('createVehicleListing', { vehicleId, price })
        setShowSellVehicleModal(false)
        setTimeout(() => {
            fetchNui('getActiveListings', {})
            fetchNui('getMyListings', {})
        }, 500)
    }

    const handleCreateWeaponListing = (weaponSlot: number, price: number) => {
        fetchNui('createWeaponListing', { weaponSlot, price })
        setShowSellWeaponModal(false)
        setTimeout(() => {
            fetchNui('getActiveListings', {})
            fetchNui('getMyListings', {})
        }, 500)
    }

    const handleCancelListing = (listingId: number) => {
        fetchNui('cancelListing', { listingId })
        setMyListings(prev => prev.filter(l => l.id !== listingId))
        setTimeout(() => {
            fetchNui('getMyListings', {})
            fetchNui('getActiveListings', {})
        }, 300)
    }

    const handleBuyClick = (listing: Listing) => setShowConfirmModal(listing)

    const handleConfirmPurchase = () => {
        if (!showConfirmModal) return

        if (showConfirmModal.type === 'vehicle') {
            const itemData = JSON.parse(showConfirmModal.item_data)
            setShowPlateChangeModal({
                listing: showConfirmModal,
                model: itemData.model,
                plate: itemData.plate
            })
            setShowConfirmModal(null)
        } else {
            fetchNui('buyListing', { listingId: showConfirmModal.id })
            setShowConfirmModal(null)
            setTimeout(() => fetchNui('getActiveListings', {}), 500)
        }
    }

    const handlePlateConfirm = (customPlate?: string) => {
        if (!showPlateChangeModal) return

        fetchNui('buyListing', {
            listingId: showPlateChangeModal.listing.id,
            customPlate: customPlate || ''
        })

        setShowPlateChangeModal(null)
        setTimeout(() => fetchNui('getActiveListings', {}), 500)
    }

    const parseItemData = (data: string) => {
        try {
            return JSON.parse(data)
        } catch {
            return {}
        }
    }

    const filteredListings = listings.filter(item => {
        const itemData = parseItemData(item.item_data)
        const searchLower = searchTerm.toLowerCase()
        return (
            (itemData.model?.toLowerCase().includes(searchLower) || false) ||
            (itemData.label?.toLowerCase().includes(searchLower) || false) ||
            (itemData.plate?.toLowerCase().includes(searchLower) || false) ||
            (item.seller_name?.toLowerCase().includes(searchLower) || false)
        )
    })

    const vehicleListings = myListings.filter(l => l.type === 'vehicle' && l.status === 'ACTIVE')
    const weaponListings = myListings.filter(l => l.type === 'weapon' && l.status === 'ACTIVE')

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">{t.marketplace.title}</h2>
                    <p className="text-gray-400">{t.marketplace.subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setActiveTab('browse')
                            fetchNui('getActiveListings', {})
                        }}
                        className="px-4 py-2 rounded-xl transition-all"
                        style={{
                            background: activeTab === 'browse' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === 'browse' ? '#000' : '#9ca3af',
                            fontWeight: activeTab === 'browse' ? 'bold' : 'normal',
                        }}
                    >
                        Explorar
                    </button>
                    <button
                        onClick={() => setActiveTab('sell')}
                        className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                        style={{
                            background: activeTab === 'sell' ? 'rgba(37, 99, 235, 1)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === 'sell' ? '#fff' : '#9ca3af',
                        }}
                    >
                        <Plus size={18} />
                        Vender
                    </button>
                </div>
            </div>

            {/* Sell Tabs */}
            {activeTab === 'sell' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setShowSellVehicleModal(true)
                            fetchNui('getMyVehicles', {})
                            fetchNui('getMyListings', {})
                        }}
                        className="px-4 py-2 rounded-xl transition-all"
                        style={{ background: 'rgba(59,130,246,1)', color: '#fff' }}
                    >
                        Vehículos
                    </button>
                    <button
                        onClick={() => {
                            setShowSellWeaponModal(true)
                            fetchNui('getMyWeapons', {})
                            fetchNui('getMyListings', {})
                        }}
                        className="px-4 py-2 rounded-xl transition-all"
                        style={{ background: 'rgba(239,68,68,1)', color: '#fff' }}
                    >
                        Armas
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2" style={{ transform: 'translateY(-50%)', color: '#6b7280' }} size={20} />
                <input
                    type="text"
                    placeholder={t.marketplace.search_placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                />
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20 custom-scrollbar">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-400" size={32} />
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                        <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p style={{ fontSize: '18px' }}>No hay ofertas disponibles</p>
                        <p style={{ fontSize: '14px' }}>Las ofertas de otros jugadores aparecerán aquí</p>
                    </div>
                ) : (
                    filteredListings.map((listing) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            onBuyClick={() => handleBuyClick(listing)}
                        />
                    ))
                )}
            </div>

            {/* Modals */}
            {showSellVehicleModal && (
                <SellVehicleModal
                    vehicles={myVehicles}
                    activeListings={vehicleListings}
                    onCreateListing={handleCreateVehicleListing}
                    onCancelListing={handleCancelListing}
                    onClose={() => setShowSellVehicleModal(false)}
                />
            )}

            {showSellWeaponModal && (
                <SellWeaponModal
                    weapons={myWeapons}
                    activeListings={weaponListings}
                    onCreateListing={handleCreateWeaponListing}
                    onCancelListing={handleCancelListing}
                    onClose={() => setShowSellWeaponModal(false)}
                />
            )}

            {showConfirmModal && (
                <ConfirmPurchaseModal
                    listing={showConfirmModal}
                    userCoins={user.coins}
                    onConfirm={handleConfirmPurchase}
                    onCancel={() => setShowConfirmModal(null)}
                />
            )}

            {showPlateChangeModal && (
                <PlateChangeModal
                    vehicleModel={showPlateChangeModal.model}
                    currentPlate={showPlateChangeModal.plate}
                    onConfirm={handlePlateConfirm}
                    onCancel={() => setShowPlateChangeModal(null)}
                />
            )}
        </div>
    )
}
