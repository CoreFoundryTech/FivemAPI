import { useState } from 'react'
import { Car, Crosshair } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useLocales } from '../hooks/useLocales'
import { fetchNui } from '../utils/fetchNui'
import { VehicleCard, WeaponCard, VehiclePurchaseModal, WeaponPurchaseModal } from '../components/shop'

// Vehicle and Weapon types
interface Vehicle {
    id: string
    label: string
    price: number
    model: string
    category: string
}

interface Weapon {
    id: string
    label: string
    price: number
    item: string
    tint?: number
    attachments?: string[]
}

// Sample data - in production this would come from config via NUI
const VEHICLES: Vehicle[] = [
    { id: 'adder', label: 'Adder', price: 50000, model: 'adder', category: 'supercar' },
    { id: 'zentorno', label: 'Zentorno', price: 45000, model: 'zentorno', category: 'supercar' },
    { id: 'insurgent', label: 'Insurgent', price: 80000, model: 'insurgent', category: 'military' },
    { id: 'sultanrs', label: 'Sultan RS', price: 25000, model: 'sultanrs', category: 'sports' },
]

const WEAPONS: Weapon[] = [
    { id: 'pistol', label: 'Pistola', price: 500, item: 'weapon_pistol' },
    { id: 'smg', label: 'SMG', price: 2000, item: 'weapon_smg' },
    { id: 'carbine', label: 'Carabina', price: 5000, item: 'weapon_carbinerifle' },
    { id: 'pistol_gold', label: 'Pistola Dorada', price: 3000, item: 'weapon_pistol', tint: 5 },
    { id: 'pistol_pink', label: 'Pistola Rosa', price: 2500, item: 'weapon_pistol', tint: 6 },
    { id: 'smg_silenced', label: 'SMG Silenciada', price: 4000, item: 'weapon_smg', attachments: ['Silenciador'] },
    { id: 'carbine_tactical', label: 'Carabina Táctica', price: 10000, item: 'weapon_carbinerifle', attachments: ['Silenciador', 'Linterna', 'Mira'], tint: 1 },
]

export const ShopView = () => {
    const [activeCategory, setActiveCategory] = useState<'vehicles' | 'weapons'>('vehicles')
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
    const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null)
    const { user } = useAppStore()
    const { t } = useLocales()

    const categories = [
        { id: 'vehicles' as const, label: 'Vehículos', icon: Car },
        { id: 'weapons' as const, label: 'Armas', icon: Crosshair },
    ]

    const handleBuyVehicle = async (plate: string) => {
        if (!selectedVehicle) return

        await fetchNui('buyVehicle', {
            vehicleId: selectedVehicle.id,
            plate: plate
        })
        setSelectedVehicle(null)
    }

    const handleBuyWeapon = async () => {
        if (!selectedWeapon) return

        await fetchNui('buyWeapon', {
            weaponId: selectedWeapon.id
        })
        setSelectedWeapon(null)
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">{t.shop.title}</h2>
                    <p className="text-gray-400">{t.shop.subtitle}</p>
                </div>
                <div className="text-right">
                    <span className="text-sm text-gray-400">Tu saldo:</span>
                    <p className="text-2xl font-bold text-yellow-400">{user.coins.toLocaleString()} 🪙</p>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 pb-2">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className="px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
                        style={{
                            background: activeCategory === cat.id ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.05)',
                            color: activeCategory === cat.id ? '#000' : '#9ca3af',
                            fontWeight: activeCategory === cat.id ? 'bold' : 'normal',
                        }}
                    >
                        <cat.icon size={20} />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Vehicles Grid */}
            {activeCategory === 'vehicles' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20 custom-scrollbar">
                    {VEHICLES.map(vehicle => (
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            onBuy={setSelectedVehicle}
                        />
                    ))}
                </div>
            )}

            {/* Weapons Grid */}
            {activeCategory === 'weapons' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20 custom-scrollbar">
                    {WEAPONS.map(weapon => (
                        <WeaponCard
                            key={weapon.id}
                            weapon={weapon}
                            onBuy={setSelectedWeapon}
                        />
                    ))}
                </div>
            )}

            {/* Purchase Modals */}
            <VehiclePurchaseModal
                vehicle={selectedVehicle}
                userCoins={user.coins}
                onClose={() => setSelectedVehicle(null)}
                onConfirm={handleBuyVehicle}
            />

            <WeaponPurchaseModal
                weapon={selectedWeapon}
                userCoins={user.coins}
                onClose={() => setSelectedWeapon(null)}
                onConfirm={handleBuyWeapon}
            />
        </div>
    )
}
