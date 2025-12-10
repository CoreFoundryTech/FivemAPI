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

export const AdminItemModal = ({ mode, initialData, onClose, onSuccess }: AdminItemModalProps) => {
    // const { t } = useLocales() // Unused for now
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

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

        if (mode === 'add') {
            await fetchNui('addShopItem', payload)
        } else {
            await fetchNui('editShopItem', payload)
        }

        onSuccess()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative w-full max-w-md bg-[#1a1b26] border border-white/10 rounded-2xl shadow-2xl p-6 transform scale-100 transition-all"
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
                                placeholder="supercar, pistols..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 ml-1">Modelo (Spawn Code)</label>
                            <input
                                type="text"
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                placeholder="Ej: urus2022"
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
                        className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        <Save size={18} />
                        {mode === 'add' ? 'Crear Item' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </div>
    )
}
