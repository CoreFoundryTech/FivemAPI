import { Car, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

interface Vehicle {
    id: string
    label: string
    price: number
    model: string
    category: string
}

interface VehicleCardProps {
    vehicle: Vehicle
    onBuy: (vehicle: Vehicle) => void
}

export const VehicleCard = ({ vehicle, onBuy }: VehicleCardProps) => {
    const [imageError, setImageError] = useState(false)
    const imageUrl = `https://raw.githubusercontent.com/MericcaN41/gta5carimages/main/images/${vehicle.model.toLowerCase()}.png`

    return (
        <div className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] duration-300">
            <div className="aspect-video bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center overflow-hidden relative">
                {!imageError ? (
                    <img
                        src={imageUrl}
                        alt={vehicle.label}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <Car size={60} className="text-blue-400/30" />
                )}

                {/* Overlay gradient for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="p-4 relative">
                <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{vehicle.label}</h3>
                <p className="text-xs text-gray-500 uppercase">{vehicle.category}</p>
                <div className="flex items-center justify-between mt-4">
                    <span className="text-yellow-400 font-bold text-xl">{vehicle.price.toLocaleString()} 🪙</span>
                    <button
                        onClick={() => onBuy(vehicle)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2 transform group-hover:translate-x-1"
                    >
                        <ShoppingCart size={16} />
                        Comprar
                    </button>
                </div>
            </div>
        </div>
    )
}
