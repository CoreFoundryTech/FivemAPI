import { useState } from 'react'
import { X, ShoppingCart, Loader2 } from 'lucide-react'

interface Vehicle {
    id: string
    label: string
    price: number
    model: string
    category: string
}

interface VehiclePurchaseModalProps {
    vehicle: Vehicle | null
    userCoins: number
    onClose: () => void
    onConfirm: (plate: string) => Promise<void>
}

export const VehiclePurchaseModal = ({ vehicle, userCoins, onClose, onConfirm }: VehiclePurchaseModalProps) => {
    const [customPlate, setCustomPlate] = useState('')
    const [plateError, setPlateError] = useState('')
    const [purchasing, setPurchasing] = useState(false)

    const validatePlate = (plate: string): boolean => {
        if (plate.length === 0) {
            setPlateError('Ingresa una patente')
            return false
        }
        if (plate.length > 8) {
            setPlateError('Máximo 8 caracteres')
            return false
        }
        if (!/^[A-Za-z0-9]+$/.test(plate)) {
            setPlateError('Solo letras y números')
            return false
        }
        setPlateError('')
        return true
    }

    const handleConfirm = async () => {
        if (!vehicle || !validatePlate(customPlate)) return

        if (userCoins < vehicle.price) {
            setPlateError('No tienes suficientes coins')
            return
        }

        setPurchasing(true)
        try {
            await onConfirm(customPlate.toUpperCase())
            setCustomPlate('')
        } catch {
            setPlateError('Error al comprar vehículo')
        }
        setPurchasing(false)
    }

    if (!vehicle) return null

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Comprar {vehicle.label}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                        <span className="text-gray-400">Precio:</span>
                        <span className="text-yellow-400 font-bold text-2xl">{vehicle.price.toLocaleString()} 🪙</span>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Patente personalizada:</label>
                        <input
                            type="text"
                            value={customPlate}
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase().slice(0, 8)
                                setCustomPlate(val)
                                if (val) validatePlate(val)
                            }}
                            placeholder="Ej: JERKZAEN"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xl font-mono tracking-wider text-center uppercase focus:outline-none focus:border-blue-500"
                            maxLength={8}
                        />
                        <p className="text-xs text-gray-500 mt-1 text-center">Máximo 8 caracteres, solo letras y números</p>
                        {plateError && (
                            <p className="text-red-400 text-sm mt-2 text-center">{plateError}</p>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={purchasing || !customPlate}
                            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {purchasing ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
                            Comprar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
