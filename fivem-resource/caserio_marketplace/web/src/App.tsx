


import { VisibilityProvider } from './providers/VisibilityProvider'
import { Layout } from './components/layout/Layout'
import { useAppStore } from './store/useAppStore'

// Views
import { HomeView } from './views/HomeView'
import { CoinsView } from './views/CoinsView'
import { ShopView } from './views/ShopView'
import { ExchangeView } from './views/ExchangeView'
import { MarketplaceView } from './views/MarketplaceView'

// Components
import { PaymentStatusToast } from './components/PaymentStatusToast'

import { useNuiEvent } from './hooks/useNuiEvent'

import './index.css'

import { useState, useEffect } from 'react'

function App() {
  const { currentTab, setUser } = useAppStore()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayedTab, setDisplayedTab] = useState(currentTab)

  useNuiEvent('updatePlayerData', (data: any) => {
    setUser(data)
  })

  // Handle openUrl from Lua client - Use FiveM native
  useNuiEvent<{ url: string }>('openExternalUrl', (data) => {
    if (data.url) {
      // FiveM CEF: Use invokeNative to open URL in Steam overlay
      if ('invokeNative' in window) {
        (window as any).invokeNative('openUrl', data.url)
      } else {
        // Browser fallback
        window.open(data.url, '_blank')
      }
    }
  })

  // Elegant page transition
  useEffect(() => {
    if (currentTab !== displayedTab) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayedTab(currentTab)
        setIsTransitioning(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [currentTab, displayedTab])

  const renderContent = () => {
    switch (displayedTab) {
      case 'home': return <HomeView />
      case 'coins': return <CoinsView />
      case 'shop': return <ShopView />
      case 'exchange': return <ExchangeView />
      case 'marketplace': return <MarketplaceView />
      default: return <HomeView />
    }
  }

  return (
    <VisibilityProvider>
      <PaymentStatusToast />
      <div className="flex h-screen w-screen items-center justify-center font-sans">
        <Layout>
          <div
            className="gpu-layer"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
              WebkitTransition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
              transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
            }}
          >
            {renderContent()}
          </div>
        </Layout>
      </div>
    </VisibilityProvider>
  )
}

export default App
