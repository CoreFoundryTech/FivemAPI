import { CreditCard } from 'lucide-react'
import { useLocales } from '../../hooks/useLocales'
import CaserioCoin from '../../assets/Caserio_Coin.svg'

interface CoinPackageCardProps {
    amount: number
    price: number
    bonus?: number
    popular?: boolean
    onBuy: (amount: number, price: number) => void
}

export const CoinPackageCard = ({ amount, price, bonus, popular, onBuy }: CoinPackageCardProps) => {
    const { t } = useLocales()

    return (
        <div
            className="relative p-6 rounded-2xl border flex flex-col items-center text-center overflow-hidden gpu-layer cef-transition"
            style={{
                background: popular
                    ? 'linear-gradient(to bottom, rgba(30, 58, 138, 0.4), rgba(30, 58, 138, 0.1))'
                    : 'rgba(255, 255, 255, 0.05)',
                borderColor: popular ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.05)',
            }}
        >
            {popular && (
                <div
                    className="absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-xl text-white"
                    style={{ background: 'rgba(59, 130, 246, 1)' }}
                >
                    {t.coins.popular}
                </div>
            )}

            <div className="w-24 h-24 mb-4 flex items-center justify-center cef-transition">
                <img src={CaserioCoin} alt="Caserio Coin" className="w-full h-full object-contain" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">{amount.toLocaleString()}</h3>
            <p className="text-sm text-gray-400 font-medium mb-4">Caserio Coins</p>

            {bonus && (
                <div
                    className="mb-4 px-3 py-1 rounded-full text-xs font-bold border"
                    style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#4ade80',
                        borderColor: 'rgba(34, 197, 94, 0.2)',
                    }}
                >
                    +{bonus.toLocaleString()} {t.coins.bonus}
                </div>
            )}

            <div className="mt-auto w-full">
                <p className="text-3xl font-bold text-white mb-4">
                    ${price}<span className="text-sm text-gray-400 font-normal"> {t.coins.usd}</span>
                </p>
                <button
                    onClick={() => onBuy(amount, price)}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 cef-transition"
                    style={{
                        background: 'rgba(255, 255, 255, 1)',
                        color: '#000',
                    }}
                >
                    <CreditCard size={18} />
                    {t.coins.buy_btn}
                </button>
            </div>
        </div>
    )
}
