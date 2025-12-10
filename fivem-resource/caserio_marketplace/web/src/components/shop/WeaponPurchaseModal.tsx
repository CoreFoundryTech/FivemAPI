import { useState } from 'react'
import { X, ShoppingCart, Loader2 } from 'lucide-react'

interface Weapon {
    id: string
    label: string
    price: number
    item: string
    tint?: number
    attachments?: string[]
}

interface WeaponPurchaseModalProps {
    weapon: Weapon | null
    userCoins: number
    onClose: () => void
    onConfirm: () => Promise<void>
}

export const WeaponPurchaseModal = ({ weapon, userCoins, onClose, onConfirm }: WeaponPurchaseModalProps) => {
    const [purchasing, setPurchasing] = useState(false)

    const handleConfirm = async () => {
        if (!weapon) return

        setPurchasing(true)
        try {
            await onConfirm()
        } catch {
            // Error handled by parent
        }
        setPurchasing(false)
    }

    if (!weapon) return null

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Comprar {weapon.label}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                        <span className="text-gray-400">Precio:</span>
                        <span className="text-yellow-400 font-bold text-2xl">{weapon.price.toLocaleString()} 🪙</span>
                    </div>

                    {weapon.tint && (
                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-yellow-400 text-sm">✨ Incluye skin especial</p>
                        </div>
                    )}

                    {weapon.attachments && weapon.attachments.length > 0 && (
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <p className="text-purple-400 text-sm font-bold mb-1">Modificaciones:</p>
                            <ul className="text-purple-300 text-sm">
                                {weapon.attachments.map((att, i) => (
                                    <li key={i}>• {att}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {userCoins < weapon.price && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-sm">No tienes suficientes coins</p>
                        </div>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={purchasing || userCoins < weapon.price}
                            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
