import { useState } from 'react'
import { X, Car, Plus } from 'lucide-react'

interface Vehicle {
    id: number
    vehicle: string
    plate: string
    state: number
}

interface SellVehicleModalProps {
    vehicles: Vehicle[]
    activeListings: any[]
    onCreateListing: (vehicleId: number, price: number) => void
    onCancelListing: (listingId: number) => void
    onClose: () => void
}

export const SellVehicleModal = ({ vehicles, activeListings, onCreateListing, onCancelListing, onClose }: SellVehicleModalProps) => {
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
    const [price, setPrice] = useState('')

    const parseItemData = (data: string) => {
        try {
            return JSON.parse(data)
        } catch {
            return {}
        }
    }

    const handleCreate = () => {
        if (!selectedVehicle || !price) return
        onCreateListing(selectedVehicle.id, parseInt(price))
        setSelectedVehicle(null)
        setPrice('')
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 50 }}>
            <div className="rounded-2xl p-6 w-full max-w-lg border" style={{ background: 'rgb(17, 24, 39)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Vender Vehículo</h3>
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
                                            <span className="font-bold capitalize">{data.model}</span>
                                            <span style={{ color: '#6b7280', marginLeft: '8px' }}>{data.plate}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold" style={{ color: '#fbb f24' }}>{listing.price.toLocaleString()} 🪙</span>
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

                <h4 className="text-sm font-bold mb-2" style={{ color: '#9ca3af' }}>Tus vehículos:</h4>
                {vehicles.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No tienes vehículos</p>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                        {vehicles.map(vehicle => {
                            const isAvailable = vehicle.state === 1
                            const isSelected = selectedVehicle?.id === vehicle.id

                            return (
                                <button
                                    key={vehicle.id}
                                    onClick={() => isAvailable && setSelectedVehicle(vehicle)}
                                    disabled={!isAvailable}
                                    className="w-full flex flex-col p-3 rounded-lg transition-all"
                                    style={{
                                        background: isSelected ? 'rgba(59,130,246,0.2)' : isAvailable ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                                        border: isSelected ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                                        opacity: isAvailable ? 1 : 0.5,
                                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <Car size={20} style={{ color: isAvailable ? '#60a5fa' : '#6b7280' }} />
                                            <span className="font-bold capitalize" style={{ color: isAvailable ? 'white' : '#9ca3af' }}>
                                                {vehicle.vehicle}
                                            </span>
                                        </div>
                                        <span style={{ color: '#9ca3af', fontFamily: 'monospace' }}>{vehicle.plate}</span>
                                    </div>
                                    {!isAvailable && (
                                        <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', textAlign: 'left' }}>
                                            ⚠️ El vehículo debe estar guardado en el garage
                                        </p>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}

                {selectedVehicle && (
                    <div className="mt-4">
                        <label className="block text-sm mb-2" style={{ color: '#9ca3af' }}>Precio (coins):</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Ej: 50000"
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
                        disabled={!selectedVehicle || !price}
                        className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                        style={{
                            background: selectedVehicle && price ? 'rgba(37, 99, 235, 1)' : 'rgba(37, 99, 235, 0.3)',
                            opacity: selectedVehicle && price ? 1 : 0.5,
                            cursor: selectedVehicle && price ? 'pointer' : 'not-allowed',
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
