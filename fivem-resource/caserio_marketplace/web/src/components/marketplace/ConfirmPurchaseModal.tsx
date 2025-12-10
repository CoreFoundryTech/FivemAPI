import { X, ShoppingCart } from 'lucide-react'

interface ConfirmPurchaseModalProps {
    listing: {
        id: number
        seller_name: string
        type: 'vehicle' | 'weapon'
        item_data: string
        price: number
    }
    userCoins: number
    onConfirm: () => void
    onCancel: () => void
}

export const ConfirmPurchaseModal = ({ listing, userCoins, onConfirm, onCancel }: ConfirmPurchaseModalProps) => {
    const parseItemData = (data: string) => {
        try {
            return JSON.parse(data)
        } catch {
            return {}
        }
    }

    const itemData = parseItemData(listing.item_data)
    const isVehicle = listing.type === 'vehicle'
    const canAfford = userCoins >= listing.price

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 50 }}>
            <div className="rounded-2xl p-6 w-full max-w-md border" style={{ background: 'rgb(17, 24, 39)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Confirmar Compra</h3>
                    <button onClick={onCancel} style={{ color: '#9ca3af' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-lg font-bold capitalize">
                            {isVehicle ? itemData.model : itemData.label}
                        </p>
                        {isVehicle && (
                            <p style={{ color: '#9ca3af' }}>Patente: {itemData.plate}</p>
                        )}
                        {!isVehicle && itemData.tint && (
                            <p style={{ color: '#fbbf24', fontSize: '12px' }}>✨ Incluye skin especial</p>
                        )}
                        {!isVehicle && itemData.attachments && itemData.attachments.length > 0 && (
                            <p style={{ color: '#a78bfa', fontSize: '12px' }}>
                                +{itemData.attachments.length} modificaciones
                            </p>
                        )}
                        <p style={{ color: '#6b7280', fontSize: '12px' }}>Vendedor: {listing.seller_name}</p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span style={{ color: '#9ca3af' }}>Precio:</span>
                        <span className="text-2xl font-bold" style={{ color: '#fbbf24' }}>
                            {listing.price.toLocaleString()} 🪙
                        </span>
                    </div>

                    {!canAfford && (
                        <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <p style={{ color: '#f87171', fontSize: '14px' }}>No tienes suficientes coins</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!canAfford}
                            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                            style={{
                                background: canAfford ? 'rgba(37, 99, 235, 1)' : 'rgba(37, 99, 235, 0.3)',
                                opacity: canAfford ? 1 : 0.5,
                                cursor: canAfford ? 'pointer' : 'not-allowed',
                            }}
                        >
                            <ShoppingCart size={20} />
                            Comprar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
