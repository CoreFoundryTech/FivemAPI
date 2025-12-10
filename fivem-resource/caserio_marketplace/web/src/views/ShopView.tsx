import { useState, useEffect } from 'react'
import { Car, Crosshair, Plus, Settings, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useLocales } from '../hooks/useLocales'
import { fetchNui } from '../utils/fetchNui'
import { VehicleCard, WeaponCard, VehiclePurchaseModal, WeaponPurchaseModal, AdminItemModal } from '../components/shop'

export const ShopView = () => {
    const [activeCategory, setActiveCategory] = useState<'vehicles' | 'weapons'>('vehicles')
    const [shopItems, setShopItems] = useState<any[]>([])
    const [selectedItem, setSelectedItem] = useState<any | null>(null)
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
    const [adminModalMode, setAdminModalMode] = useState<'add' | 'edit'>('add')
    const [itemToEdit, setItemToEdit] = useState<any>(null)

    const { user } = useAppStore()
    const { t } = useLocales()

    const loadItems = async () => {
        try {
            const items = await fetchNui<any[]>('getShopItems')
            setShopItems(items || [])
        } catch (e) {
            console.error('Failed to load shop items', e)
        }
    }

    useEffect(() => {
        loadItems()

        const handleRefresh = (event: MessageEvent) => {
            if (event.data.action === 'shopItemsUpdated') {
                loadItems()
            }
        }
        window.addEventListener('message', handleRefresh)
        return () => window.removeEventListener('message', handleRefresh)
    }, [])

    const vehicles = shopItems.filter(i => i.type === 'vehicle')
    const weapons = shopItems.filter(i => i.type === 'weapon')

    const categories = [
        { id: 'vehicles' as const, label: 'Vehículos', icon: Car },
        { id: 'weapons' as const, label: 'Armas', icon: Crosshair },
    ]

    const handleBuyVehicle = async (plate: string) => {
        if (!selectedItem) return
        await fetchNui('buyVehicle', { vehicleId: selectedItem.item_id, plate: plate })
        setSelectedItem(null)
    }

    const handleBuyWeapon = async () => {
        if (!selectedItem) return
        await fetchNui('buyWeapon', { weaponId: selectedItem.item_id })
        setSelectedItem(null)
    }

    const handleEditItem = (item: any) => {
        setItemToEdit(item)
        setAdminModalMode('edit')
        setIsAdminModalOpen(true)
    }

    const handleDeleteItem = async (itemId: string) => {
        await fetchNui('deleteShopItem', { itemId })
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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20 custom-scrollbar">
                {activeCategory === 'vehicles' ? (
                    vehicles.map(v => (
                        <div key={v.id} className="relative group">
                            <VehicleCard
                                vehicle={{ ...v, id: v.item_id }}
                                onBuy={() => setSelectedItem(v)}
                            />
                            {user.isAdmin && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditItem(v)} className="p-1.5 bg-blue-500 rounded-md hover:bg-blue-600 shadow-md text-white mr-1"><Settings size={14} /></button>
                                    <button onClick={() => handleDeleteItem(v.item_id)} className="p-1.5 bg-red-500 rounded-md hover:bg-red-600 shadow-md text-white"><Trash2 size={14} /></button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    weapons.map(w => (
                        <div key={w.id} className="relative group">
                            <WeaponCard
                                weapon={{
                                    ...w,
                                    id: w.item_id,
                                    item: w.model,
                                    attachments: w.item_data ? JSON.parse(w.item_data).attachments : []
                                }}
                                onBuy={() => setSelectedItem(w)}
                            />
                            {user.isAdmin && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditItem(w)} className="p-1.5 bg-blue-500 rounded-md hover:bg-blue-600 shadow-md text-white mr-1"><Settings size={14} /></button>
                                    <button onClick={() => handleDeleteItem(w.item_id)} className="p-1.5 bg-red-500 rounded-md hover:bg-red-600 shadow-md text-white"><Trash2 size={14} /></button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Purchase Modals */}
            {activeCategory === 'vehicles' && (
                <VehiclePurchaseModal
                    vehicle={selectedItem}
                    userCoins={user.coins}
                    onClose={() => setSelectedItem(null)}
                    onConfirm={handleBuyVehicle}
                />
            )}

            {activeCategory === 'weapons' && (
                <WeaponPurchaseModal
                    weapon={selectedItem}
                    userCoins={user.coins}
                    onClose={() => setSelectedItem(null)}
                    onConfirm={handleBuyWeapon}
                />
            )}

            {/* Admin Add Button */}
            {user.isAdmin && (
                <button
                    onClick={() => {
                        setAdminModalMode('add')
                        setItemToEdit(null)
                        setIsAdminModalOpen(true)
                    }}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-400 hover:scale-110 transition-all z-40 text-white"
                    style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
                >
                    <Plus size={28} />
                </button>
            )}

            {/* Admin Modal */}
            {isAdminModalOpen && (
                <AdminItemModal
                    mode={adminModalMode}
                    initialData={itemToEdit}
                    onClose={() => setIsAdminModalOpen(false)}
                    onSuccess={loadItems}
                />
            )}

        </div>
    )
}
