import { useState } from 'react'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useLocales } from '../hooks/useLocales'
import { fetchNui } from '../utils/fetchNui'

// Exchange rate from config - should match server config
const EXCHANGE_RATE = 1000

export const ExchangeView = () => {
    const { user } = useAppStore()
    const { t } = useLocales()
    const [amount, setAmount] = useState(0)

    const coinsToReceive = Math.floor(amount / EXCHANGE_RATE)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold">{t.exchange.title}</h2>
                <p className="text-gray-400">{t.exchange.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Area */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-gray-400 font-medium">{t.exchange.rate}</span>
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
                            {t.exchange.rate_info}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">{t.exchange.you_pay}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                    type="number"
                                    value={amount || ''}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-8 pr-4 text-xl font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                    placeholder="0"
                                />
                            </div>
                            <div className="mt-2 text-right">
                                <span className="text-xs text-gray-500">Max: ${user.money.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex justify-center py-2">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <ArrowRight className="text-gray-400 rotate-90 md:rotate-0" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">{t.exchange.you_receive}</label>
                            <div className="w-full bg-blue-900/10 border border-blue-500/20 rounded-xl py-4 px-4 text-xl font-bold text-blue-400 flex items-center gap-2">
                                <span>{coinsToReceive.toLocaleString()}</span>
                                <span className="text-xs font-normal opacity-70">COINS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info & Confirm */}
                <div className="flex flex-col justify-center">
                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 mb-6">
                        <p className="text-yellow-200/80 text-sm leading-relaxed">
                            {t.exchange.subtitle}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            if (amount > 0) {
                                fetchNui('exchangeMoney', { amount })
                            }
                        }}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2"
                        disabled={amount === 0 || amount > user.money}
                        style={{
                            opacity: amount === 0 || amount > user.money ? 0.5 : 1,
                            cursor: amount === 0 || amount > user.money ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <RefreshCw size={20} />
                        {t.exchange.confirm_btn}
                    </button>
                    <p className="mt-4 text-xs text-gray-500">
                        {t.exchange.warning}
                    </p>
                </div>
            </div>
        </div>
    )
}
