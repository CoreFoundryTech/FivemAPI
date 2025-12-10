import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface PaymentStatus {
    status: 'pending' | 'processing' | 'completed' | 'error'
    txnId?: string
    amount?: number
    message?: string
}

export const PaymentStatusToast = () => {
    const [status, setStatus] = useState<PaymentStatus | null>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data
            if (action === 'paymentStatus') {
                setStatus(data)
                setVisible(true)

                // Auto-hide after 5 seconds for completed/error
                if (data.status === 'completed' || data.status === 'error') {
                    setTimeout(() => setVisible(false), 5000)
                }
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    if (!visible || !status) return null

    const getIcon = () => {
        switch (status.status) {
            case 'pending':
            case 'processing':
                return <Loader2 className="animate-spin" size={20} />
            case 'completed':
                return <CheckCircle size={20} style={{ color: '#4ade80' }} />
            case 'error':
                return <AlertCircle size={20} style={{ color: '#f87171' }} />
            default:
                return null
        }
    }

    const getBgColor = () => {
        switch (status.status) {
            case 'completed':
                return 'rgba(34, 197, 94, 0.2)'
            case 'error':
                return 'rgba(239, 68, 68, 0.2)'
            default:
                return 'rgba(59, 130, 246, 0.2)'
        }
    }

    const getBorderColor = () => {
        switch (status.status) {
            case 'completed':
                return 'rgba(34, 197, 94, 0.5)'
            case 'error':
                return 'rgba(239, 68, 68, 0.5)'
            default:
                return 'rgba(59, 130, 246, 0.5)'
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                background: getBgColor(),
                border: `1px solid ${getBorderColor()}`,
                borderRadius: '12px',
                padding: '16px 20px',
                minWidth: '280px',
                transform: 'translateZ(0)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getIcon()}
                <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {status.message || 'Procesando...'}
                    </p>
                    {status.txnId && (
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                            TXN: {status.txnId.substring(0, 8)}...
                        </p>
                    )}
                    {status.amount && (
                        <p style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 'bold' }}>
                            {status.amount.toLocaleString()} 🪙
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setVisible(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        fontSize: '18px',
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    )
}
