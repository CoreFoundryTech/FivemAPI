import { Car, ShoppingCart } from 'lucide-react'

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
    return (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
            <div className="aspect-video bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center">
                <Car size={60} className="text-blue-400/30" />
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg">{vehicle.label}</h3>
                <p className="text-xs text-gray-500 uppercase">{vehicle.category}</p>
                <div className="flex items-center justify-between mt-4">
                    <span className="text-yellow-400 font-bold text-xl">{vehicle.price.toLocaleString()} 🪙</span>
                    <button
                        onClick={() => onBuy(vehicle)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2"
                    >
                        <ShoppingCart size={16} />
                        Comprar
                    </button>
                </div>
            </div>
        </div>
    )
}
