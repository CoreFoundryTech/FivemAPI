import { useState } from 'react'
import { useLocales } from '../hooks/useLocales'
import { useNuiEvent } from '../hooks/useNuiEvent'
import { fetchNui } from '../utils/fetchNui'
import { CoinPackageCard } from '../components/coins/CoinPackageCard'
import { PurchaseModal } from '../components/coins/PurchaseModal'

type PurchaseState = 'idle' | 'showUrl' | 'waiting' | 'success' | 'error'

export const CoinsView = () => {
    const { t } = useLocales()
    const [modalOpen, setModalOpen] = useState(false)
    const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle')
    const [purchaseUrl, setPurchaseUrl] = useState('')
    const [packageName, setPackageName] = useState('')

    // Listen for purchase confirmation from server
    useNuiEvent('purchaseConfirmed', () => {
        setPurchaseState('success')
    })

    useNuiEvent('purchaseError', () => {
        setPurchaseState('error')
    })

    const handleBuy = async (amount: number, price: number) => {
        // Get URL from server
        const response = await fetchNui<{ url: string }>('getStoreUrl', {
            packageId: `coins_${amount}`
        }, {
            url: `https://caserio-rp.tebex.io/package/7158766` // Mock for browser
        })

        setPurchaseUrl(response.url || 'https://caserio-rp.tebex.io')
        setPackageName(`${amount.toLocaleString()} Coins ($${price})`)
        setPurchaseState('showUrl')
        setModalOpen(true)

        // Notify server that user initiated purchase
        fetchNui('purchaseInitiated', { packageId: `coins_${amount}`, amount, price })
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setPurchaseState('idle')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold">{t.coins.title}</h2>
                <p className="text-gray-400">{t.coins.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CoinPackageCard amount={5000} price={5} onBuy={handleBuy} />
                <CoinPackageCard amount={12000} price={10} bonus={2000} popular onBuy={handleBuy} />
                <CoinPackageCard amount={25000} price={20} bonus={5000} onBuy={handleBuy} />
                <CoinPackageCard amount={65000} price={50} bonus={15000} onBuy={handleBuy} />
            </div>

            <PurchaseModal
                isOpen={modalOpen}
                state={purchaseState}
                url={purchaseUrl}
                packageName={packageName}
                onClose={handleCloseModal}
            />
        </div>
    )
}
