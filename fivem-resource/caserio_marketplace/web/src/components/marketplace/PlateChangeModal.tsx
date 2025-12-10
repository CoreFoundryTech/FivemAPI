import { useState } from 'react'
import { X } from 'lucide-react'

interface PlateChangeModalProps {
    vehicleModel: string
    currentPlate: string
    onConfirm: (newPlate?: string) => void
    onCancel: () => void
}

export const PlateChangeModal = ({ vehicleModel, currentPlate, onConfirm, onCancel }: PlateChangeModalProps) => {
    const [customPlate, setCustomPlate] = useState('')
    const [error, setError] = useState('')

    const validatePlate = (plate: string): boolean => {
        if (plate === '') return true // Allow empty to keep original

        if (plate.length > 8) {
            setError('Máximo 8 caracteres')
            return false
        }
        if (!/^[A-Za-z0-9]+$/.test(plate)) {
            setError('Solo letras y números')
            return false
        }
        setError('')
        return true
    }

    const handleConfirm = () => {
        if (customPlate && !validatePlate(customPlate)) return
        onConfirm(customPlate || undefined)
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 60 }}>
            <div className="rounded-2xl p-6 w-full max-w-md border" style={{ background: 'rgb(17, 24, 39)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Cambiar Patente</h3>
                    <button onClick={onCancel} style={{ color: '#9ca3af' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-lg font-bold capitalize">{vehicleModel}</p>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Patente actual: <span style={{ fontFamily: 'monospace' }}>{currentPlate}</span></p>
                    </div>

                    <div>
                        <label className="block text-sm mb-2" style={{ color: '#9ca3af' }}>
                            Nueva patente (opcional):
                        </label>
                        <input
                            type="text"
                            value={customPlate}
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase().slice(0, 8)
                                setCustomPlate(val)
                                if (val) validatePlate(val)
                            }}
                            placeholder={currentPlate}
                            className="w-full rounded-xl py-3 px-4 text-xl text-center font-mono tracking-wider uppercase focus:outline-none"
                            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                            maxLength={8}
                        />
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textAlign: 'center' }}>
                            Deja vacío para mantener "{currentPlate}"
                        </p>
                        {error && (
                            <p style={{ fontSize: '14px', color: '#ef4444', marginTop: '8px', textAlign: 'center' }}>
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-3rounded-xl"
                            style={{ background: 'rgba(37, 99, 235, 1)' }}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
