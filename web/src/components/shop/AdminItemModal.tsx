import { useState, useEffect } from 'react'
import { X, Save, Car, Crosshair } from 'lucide-react'
import { fetchNui } from '../../utils/fetchNui'
// import { useLocales } from '../../hooks/useLocales'

interface AdminItemModalProps {
    mode: 'add' | 'edit'
    initialData?: any
    onClose: () => void
    onSuccess: () => void
}

interface VehicleData {
    model: string
    label: string
    brand?: string
    price: number
    category: string
}

interface WeaponData {
    model: string
    label: string
    description: string
    type: string
    ammotype: string
}

export const AdminItemModal = ({ mode, initialData, onClose, onSuccess }: AdminItemModalProps) => {
    // const { t } = useLocales() // Unused for now
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Vehicle State
    const [availableVehicles, setAvailableVehicles] = useState<VehicleData[]>([])
    const [filteredVehicles, setFilteredVehicles] = useState<VehicleData[]>([])
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)

    // Weapon State
    const [availableWeapons, setAvailableWeapons] = useState<WeaponData[]>([])
    const [filteredWeapons, setFilteredWeapons] = useState<WeaponData[]>([])
    const [isLoadingWeapons, setIsLoadingWeapons] = useState(false)

    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')

    const [formData, setFormData] = useState({
        label: '',
        model: '',
        price: 0,
        type: 'vehicle' as 'vehicle' | 'weapon',
        category: '',
        tint: 0,
        attachments: ''
    })

    useEffect(() => {
        if (initialData && mode === 'edit') {
            const itemData = initialData.item_data ? JSON.parse(initialData.item_data) : {}
            setFormData({
                label: initialData.label,
                model: initialData.model,
                price: initialData.price,
                type: initialData.type,
                category: initialData.category,
                tint: itemData.tint || 0,
                attachments: itemData.attachments ? itemData.attachments.join(',') : ''
            })
        }
    }, [initialData, mode])

    // Load Items based on type
    useEffect(() => {
        const loadVehicles = async () => {
            setIsLoadingVehicles(true)
            try {
                const vehicles = await fetchNui<Record<string, VehicleData>>('getShopVehicles', {})
                if (vehicles) {
                    const vehicleList = Object.values(vehicles).sort((a, b) => a.label.localeCompare(b.label))
                    setAvailableVehicles(vehicleList)
                    setFilteredVehicles(vehicleList)
                }
            } catch (e) {
                console.error("Failed to load vehicles", e)
            } finally {
                setIsLoadingVehicles(false)
            }
        }

        const loadWeapons = async () => {
            setIsLoadingWeapons(true)
            try {
                const weapons = await fetchNui<Record<string, WeaponData>>('getShopWeapons', {})
                if (weapons) {
                    const weaponList = Object.values(weapons).sort((a, b) => a.label.localeCompare(b.label))
                    setAvailableWeapons(weaponList)
                    setFilteredWeapons(weaponList)
                }
            } catch (e) {
                console.error("Failed to load weapons", e)
            } finally {
                setIsLoadingWeapons(false)
            }
        }

        if (mode === 'add') {
            if (formData.type === 'vehicle') loadVehicles()
            if (formData.type === 'weapon') loadWeapons()
        }
    }, [mode, formData.type])

    // Initial Filter reset when switching types
    useEffect(() => {
        setSelectedCategoryFilter('')
    }, [formData.type])

    // Filter Logic
    useEffect(() => {
        if (formData.type === 'vehicle') {
            if (selectedCategoryFilter) {
                setFilteredVehicles(availableVehicles.filter(v => v.category === selectedCategoryFilter))
            } else {
                setFilteredVehicles(availableVehicles)
            }
        } else if (formData.type === 'weapon') {
            if (selectedCategoryFilter) {
                setFilteredWeapons(availableWeapons.filter(w => (w.ammotype || w.type) === selectedCategoryFilter))
            } else {
                setFilteredWeapons(availableWeapons)
            }
        }
    }, [selectedCategoryFilter, availableVehicles, availableWeapons, formData.type])

    const handleVehicleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedModel = e.target.value
        const vehicle = availableVehicles.find(v => v.model === selectedModel)

        if (vehicle) {
            setFormData(prev => ({
                ...prev,
                model: vehicle.model,
                label: vehicle.brand ? `${vehicle.brand} ${vehicle.label}` : vehicle.label,
                price: vehicle.price,
                category: vehicle.category
            }))
        } else {
            setFormData(prev => ({ ...prev, model: selectedModel }))
        }
    }

    const handleWeaponSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedModel = e.target.value
        const weapon = availableWeapons.find(w => w.model === selectedModel)

        if (weapon) {
            setFormData(prev => ({
                ...prev,
                model: weapon.model,
                label: weapon.label,
                category: weapon.type || weapon.ammotype || 'weapon',
                // Weapons don't usually have price in shared, so we keep previous or 0
            }))
        } else {
            setFormData(prev => ({ ...prev, model: selectedModel }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Prevent double submission
        if (isSubmitting) return
        setIsSubmitting(true)

        const itemData: any = {}
        if (formData.type === 'weapon') {
            if (formData.tint > 0) itemData.tint = formData.tint
            if (formData.attachments) itemData.attachments = formData.attachments.split(',').map(s => s.trim())
        }

        const payload = {
            item_id: initialData?.item_id,
            label: formData.label,
            model: formData.model,
            price: Number(formData.price),
            type: formData.type,
            category: formData.category,
            item_data: itemData
        }

        try {
            if (mode === 'add') {
                await fetchNui('addShopItem', payload)
            } else {
                await fetchNui('updateShopItem', payload)
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error submitting item:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const imageUrl = formData.model && formData.type === 'vehicle'
        ? `https://raw.githubusercontent.com/MericcaN41/gta5carimages/main/images/${formData.model.toLowerCase()}.png`
        : null

    // Get unique categories based on type
    const categories = formData.type === 'vehicle'
        ? Array.from(new Set(availableVehicles.map(v => v.category))).sort()
        : Array.from(new Set(availableWeapons.map(w => w.ammotype || w.type))).sort()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative w-full max-w-md bg-[#1a1b26] border border-white/10 rounded-2xl shadow-2xl p-6 transform scale-100 transition-all max-h-[90vh] overflow-y-auto custom-scrollbar"
                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {mode === 'add' ? 'Nuevo Item' : 'Editar Item'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 ml-1">Tipo</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'vehicle' })}
                                    className={`flex-1 py-2 rounded-lg flex justify-center items-center gap-2 text-sm border ${formData.type === 'vehicle' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-transparent text-gray-400'}`}
                                >
                                    <Car size={16} /> Vehículo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'weapon' })}
                                    className={`flex-1 py-2 rounded-lg flex justify-center items-center gap-2 text-sm border ${formData.type === 'weapon' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-transparent text-gray-400'}`}
                                >
                                    <Crosshair size={16} /> Arma
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 ml-1">Categoría</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder={formData.type === 'vehicle' ? "supercar, pistols..." : "pistol, smg..."}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Dynamic Selection Logic (Vehicle OR Weapon) */}
                    {mode === 'add' && (formData.type === 'vehicle' || formData.type === 'weapon') && (
                        <div className="p-3 bg-white/5 rounded-lg space-y-3 border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase">
                                    Selección de {formData.type === 'vehicle' ? 'Vehículo' : 'Arma'}
                                </span>
                                {(isLoadingVehicles || isLoadingWeapons) && <span className="text-xs text-blue-400">Cargando...</span>}
                            </div>

                            {/* Category Filter */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 ml-1">Filtrar por Categoría</label>
                                <select
                                    value={selectedCategoryFilter}
                                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-gray-900 text-white">Todas las categorías</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat} className="bg-gray-900 text-white capitalize">{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Model Selector */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 ml-1">
                                    {formData.type === 'vehicle' ? 'Vehículo' : 'Arma'}
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.model}
                                        onChange={formData.type === 'vehicle' ? handleVehicleSelect : handleWeaponSelect}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white appearance-none cursor-pointer"
                                        disabled={isLoadingVehicles || isLoadingWeapons}
                                    >
                                        <option value="" className="bg-gray-900 text-white">
                                            Selecciona {formData.type === 'vehicle' ? 'un vehículo' : 'un arma'}...
                                        </option>

                                        {formData.type === 'vehicle' ? (
                                            filteredVehicles.map((v) => (
                                                <option key={v.model} value={v.model} className="bg-gray-900 text-white">
                                                    {v.brand ? `[${v.brand}] ` : ''}{v.label} ({v.model})
                                                </option>
                                            ))
                                        ) : (
                                            filteredWeapons.map((w) => (
                                                <option key={w.model} value={w.model} className="bg-gray-900 text-white">
                                                    {w.label} ({w.model})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 ml-1">Modelo (Spawn Code)</label>
                        <input
                            type="text"
                            value={formData.model}
                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                            placeholder={formData.type === 'vehicle' ? "Ej: urus2022" : "Ej: weapon_pistol"}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>

                    {imageUrl && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center group shrink-0">
                            <img
                                src={imageUrl}
                                alt={formData.model}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement
                                    if (parent) {
                                        // Show placeholder
                                        const icon = document.createElement('div')
                                        icon.innerHTML = '<svg class="text-gray-500 opacity-50" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'
                                        parent.appendChild(icon)
                                    }
                                }}
                            />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded px-2 py-1 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                Preview
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 ml-1">Nombre Visible (Label)</label>
                        <input
                            type="text"
                            value={formData.label}
                            onChange={e => setFormData({ ...formData, label: e.target.value })}
                            placeholder="Ej: Lamborghini Urus"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 ml-1">Precio (Coins)</label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                            required
                            min="0"
                        />
                    </div>

                    {formData.type === 'weapon' && (
                        <div className="p-3 bg-white/5 rounded-lg space-y-3 border border-dashed border-white/10">
                            <p className="text-xs font-bold text-gray-400 uppercase">Opciones de Arma</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 ml-1">Tint ID</label>
                                    <input
                                        type="number"
                                        value={formData.tint}
                                        onChange={e => setFormData({ ...formData, tint: Number(e.target.value) })}
                                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 ml-1">Attachments (CSV)</label>
                                    <input
                                        type="text"
                                        value={formData.attachments}
                                        onChange={e => setFormData({ ...formData, attachments: e.target.value })}
                                        placeholder="Silenciador,Mira..."
                                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full mt-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${isSubmitting
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20'
                            }`}
                    >
                        <Save size={18} />
                        {isSubmitting
                            ? 'Guardando...'
                            : (mode === 'add' ? 'Crear Item' : 'Guardar Cambios')
                        }
                    </button>
                </form>
            </div>
        </div>
    )
}
