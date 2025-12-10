import { useState } from 'react'
import { X, Crosshair, Plus } from 'lucide-react'

interface Weapon {
    slot: number
    item: string
    label: string
    tint?: number
    attachments?: string[]
}

interface SellWeaponModalProps {
    weapons: Weapon[]
    activeListings: any[]
    onCreateListing: (weaponSlot: number, price: number) => void
    onCancelListing: (listingId: number) => void
    onClose: () => void
}

export const SellWeaponModal = ({ weapons, activeListings, onCreateListing, onCancelListing, onClose }: SellWeaponModalProps) => {
    const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null)
    const [price, setPrice] = useState('')

    const parseItemData = (data: string) => {
        try {
            return JSON.parse(data)
        } catch {
            return {}
        }
    }

    const handleCreate = () => {
        if (!selectedWeapon || !price) return
        onCreateListing(selectedWeapon.slot, parseInt(price))
        setSelectedWeapon(null)
        setPrice('')
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 50 }}>
            <div className="rounded-2xl p-6 w-full max-w-lg border" style={{ background: 'rgb(17, 24, 39)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Vender Arma</h3>
                    <button onClick={onClose} style={{ color: '#9ca3af' }}>
                        <X size={24} />
                    </button>
                </div>

                {activeListings.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-bold mb-2" style={{ color: '#9ca3af' }}>Tus publicaciones activas:</h4>
                        <div className="space-y-2">
                            {activeListings.map(listing => {
                                const data = parseItemData(listing.item_data)
                                return (
                                    <div key={listing.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <span className="font-bold">{data.label}</span>
                                            {data.tint && <span style={{ color: '#fbbf24', marginLeft: '8px', fontSize: '12px' }}>✨</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold" style={{ color: '#fbbf24' }}>{listing.price.toLocaleString()} 🪙</span>
                                            <button
                                                onClick={() => onCancelListing(listing.id)}
                                                className="px-2 py-1 rounded text-sm"
                                                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <h4 className="text-sm font-bold mb-2" style={{ color: '#9ca3af' }}>Tus armas:</h4>
                {weapons.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No tienes armas en tu inventario</p>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                        {weapons.map(weapon => {
                            const isSelected = selectedWeapon?.slot === weapon.slot

                            return (
                                <button
                                    key={weapon.slot}
                                    onClick={() => setSelectedWeapon(weapon)}
                                    className="w-full flex flex-col p-3 rounded-lg transition-all"
                                    style={{
                                        background: isSelected ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                                        border: isSelected ? '1px solid rgba(239,68,68,0.5)' : '1px solid transparent',
                                    }}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <Crosshair size={20} style={{ color: '#ef4444' }} />
                                            <span className="font-bold">{weapon.label}</span>
                                        </div>
                                        {weapon.tint && (
                                            <span style={{ fontSize: '12px', color: '#fbbf24' }}>✨ Skin</span>
                                        )}
                                    </div>
                                    {weapon.attachments && weapon.attachments.length > 0 && (
                                        <p style={{ fontSize: '11px', color: '#a78bfa', marginTop: '4px', textAlign: 'left' }}>
                                            +{weapon.attachments.length} modificaciones
                                        </p>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}

                {selectedWeapon && (
                    <div className="mt-4">
                        <label className="block text-sm mb-2" style={{ color: '#9ca3af' }}>Precio (coins):</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Ej: 5000"
                            className="w-full rounded-xl py-3 px-4 text-xl text-center focus:outline-none"
                            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textAlign: 'center' }}>
                            Comisión: 5% (Recibirás {Math.floor(parseInt(price || '0') * 0.95).toLocaleString()} coins)
                        </p>
                    </div>
                )}

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!selectedWeapon || !price}
                        className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                        style={{
                            background: selectedWeapon && price ? 'rgba(239, 68, 68, 1)' : 'rgba(239, 68, 68, 0.3)',
                            opacity: selectedWeapon && price ? 1 : 0.5,
                            cursor: selectedWeapon && price ? 'pointer' : 'not-allowed',
                        }}
                    >
                        <Plus size={20} />
                        Publicar
                    </button>
                </div>
            </div>
        </div>
    )
}
