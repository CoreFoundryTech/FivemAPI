import { Crosshair, ShoppingCart } from 'lucide-react'

interface Weapon {
    id: string
    label: string
    price: number
    item: string
    tint?: number
    attachments?: string[]
}

interface WeaponCardProps {
    weapon: Weapon
    onBuy: (weapon: Weapon) => void
}

export const WeaponCard = ({ weapon, onBuy }: WeaponCardProps) => {
    return (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
            <div className="aspect-video bg-gradient-to-br from-red-900/50 to-orange-900/50 flex items-center justify-center relative">
                <Crosshair size={60} className="text-red-400/30" />
                {weapon.tint && (
                    <span className="absolute top-2 right-2 px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                        SKIN
                    </span>
                )}
                {weapon.attachments && weapon.attachments.length > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-bold">
                        +{weapon.attachments.length} MODS
                    </span>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg">{weapon.label}</h3>
                {weapon.attachments && (
                    <p className="text-xs text-gray-500">{weapon.attachments.join(', ')}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                    <span className="text-yellow-400 font-bold text-xl">{weapon.price.toLocaleString()} 🪙</span>
                    <button
                        onClick={() => onBuy(weapon)}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors flex items-center gap-2"
                    >
                        <ShoppingCart size={16} />
                        Comprar
                    </button>
                </div>
            </div>
        </div>
    )
}
