import { Car, Crosshair, ShoppingCart, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ListingCardProps {
    listing: {
        id: number
        seller_name: string
        type: 'vehicle' | 'weapon'
        item_data: string
        price: number
    }
    onBuyClick: () => void
}

export const ListingCard = ({ listing, onBuyClick }: ListingCardProps) => {
    const [isLoading, setIsLoading] = useState(false)

    const handleBuy = () => {
        setIsLoading(true)
        onBuyClick()
        // Reset loading state after a delay if the parent component doesn't unmount this card immediately
        // In a real app, this should probably be controlled by the parent, but for simple feedback this works
        setTimeout(() => setIsLoading(false), 2000)
    }

    const parseItemData = (data: string) => {
        try {
            return JSON.parse(data)
        } catch {
            return {}
        }
    }

    const itemData = parseItemData(listing.item_data)
    const isVehicle = listing.type === 'vehicle'

    return (
        <div
            className="rounded-xl p-4 flex gap-4 border border-white/10 transition-all hover:bg-white/5"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
            <div
                className="w-24 h-24 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                    background: isVehicle
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(147,51,234,0.2))'
                        : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(251,146,60,0.2))'
                }}
            >
                {isVehicle ? (
                    <Car size={40} style={{ color: 'rgba(59, 130, 246, 0.5)' }} />
                ) : (
                    <Crosshair size={40} style={{ color: 'rgba(239, 68, 68, 0.5)' }} />
                )}
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h4 className="font-bold text-lg" style={{ textTransform: 'capitalize' }}>
                        {isVehicle ? itemData.model : itemData.label || 'Arma'}
                    </h4>
                    {isVehicle && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                            Patente: {itemData.plate}
                        </p>
                    )}
                    {!isVehicle && itemData.tint && (
                        <p style={{ fontSize: '12px', color: '#fbbf24', marginTop: '2px' }}>
                            ✨ Skin especial
                        </p>
                    )}
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>
                        Vendedor: {listing.seller_name}
                    </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-xl" style={{ color: '#fbbf24' }}>
                        {listing.price.toLocaleString()} 🪙
                    </span>
                    <button
                        onClick={handleBuy}
                        disabled={isLoading}
                        className="px-3 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: isVehicle ? 'rgba(59, 130, 246, 1)' : 'rgba(239, 68, 68, 1)' }}
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                        {isLoading ? 'Procesando...' : 'Comprar'}
                    </button>
                </div>
            </div>
        </div>
    )
}
