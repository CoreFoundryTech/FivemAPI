import { useState } from 'react'
import { Copy, Check, Loader2, X } from 'lucide-react'
import CaserioCoin from '../../assets/Caserio_Coin.svg'

type PurchaseState = 'idle' | 'showUrl' | 'waiting' | 'success' | 'error'

interface PurchaseModalProps {
    isOpen: boolean
    state: PurchaseState
    url: string
    packageName: string
    onClose: () => void
}

export const PurchaseModal = ({ isOpen, state, url, packageName, onClose }: PurchaseModalProps) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for CEF
            const input = document.createElement('input')
            input.value = url
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center gpu-layer"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        >
            <div
                className="relative w-full max-w-lg p-8 rounded-3xl border border-white/10 gpu-layer"
                style={{
                    background: 'rgba(15, 15, 20, 0.98)',
                    opacity: 1,
                    transform: 'scale(1)',
                    WebkitTransition: 'all 0.3s ease-out',
                    transition: 'all 0.3s ease-out',
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full cef-transition"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                >
                    <X size={20} className="text-gray-400" />
                </button>

                {state === 'showUrl' && (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <img src={CaserioCoin} alt="Coin" className="w-full h-full object-contain" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Comprar {packageName}</h3>
                        <p className="text-gray-400 mb-6">
                            Copia el enlace y pégalo en tu navegador para completar la compra.
                        </p>

                        <div
                            className="relative p-4 rounded-xl mb-4 text-left"
                            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                        >
                            <p className="text-sm text-blue-400 break-all pr-10">{url}</p>
                            <button
                                onClick={handleCopy}
                                className="absolute right-3 top-1/2 cef-transition p-2 rounded-lg"
                                style={{
                                    transform: 'translateY(-50%)',
                                    background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                                }}
                            >
                                {copied ? (
                                    <Check size={18} className="text-green-400" />
                                ) : (
                                    <Copy size={18} className="text-blue-400" />
                                )}
                            </button>
                        </div>

                        <button
                            onClick={handleCopy}
                            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 cef-transition mb-4"
                            style={{
                                background: copied ? 'rgba(34, 197, 94, 1)' : 'rgba(59, 130, 246,  1)',
                                color: '#fff'
                            }}
                        >
                            {copied ? (
                                <>
                                    <Check size={20} />
                                    ¡Copiado! Pégalo en tu navegador
                                </>
                            ) : (
                                <>
                                    <Copy size={20} />
                                    Copiar enlace
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-3 py-4 rounded-xl mb-4" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                            <Loader2 size={20} className="animate-spin text-blue-400" />
                            <span className="text-sm text-blue-400">Esperando confirmación de pago...</span>
                        </div>

                        <p className="text-xs text-gray-500">
                            Tus coins se acreditarán automáticamente después de pagar.
                        </p>
                    </div>
                )}

                {state === 'waiting' && (
                    <div className="text-center py-8">
                        <Loader2 size={48} className="animate-spin text-blue-400 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-2">Esperando confirmación...</h3>
                        <p className="text-gray-400">
                            Completa el pago en tu navegador.<br />
                            Esta pantalla se actualizará automáticamente.
                        </p>
                    </div>
                )}

                {state === 'success' && (
                    <div className="text-center py-8">
                        <div
                            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(34, 197, 94, 0.2)' }}
                        >
                            <Check size={40} className="text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">¡Compra Exitosa!</h3>
                        <p className="text-gray-400 mb-6">
                            Tus coins han sido acreditados a tu cuenta.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-xl font-bold cef-transition"
                            style={{ background: 'rgba(34, 197, 94, 1)', color: '#fff' }}
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {state === 'error' && (
                    <div className="text-center py-8">
                        <div
                            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                        >
                            <X size={40} className="text-red-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Error en la compra</h3>
                        <p className="text-gray-400 mb-6">
                            Hubo un problema procesando tu pago. Intenta de nuevo.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-xl font-bold cef-transition"
                            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
