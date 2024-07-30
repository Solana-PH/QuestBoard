import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import { WalletAdapter } from './components/WalletAdapter.tsx'
import { useWallet } from '@solana/wallet-adapter-react'
import { Splash } from './components/Splash.tsx'
import './index.css'
import { AtomsInitializer } from './atoms/AtomsInitializer.tsx'
import { BalanceListener } from './components/BalanceListener.tsx'
import { ConfigListener } from './components/ConfigListener.tsx'
import { CounterListener } from './components/CounterListener.tsx'
import { QuestPage } from './components/QuestPage.tsx'
import { Presence } from './components/Presence.tsx'
import { NotificationPage } from './components/NotificationPage.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ChatPage } from './components/ChatPage.tsx'
import { PageScroller } from './components/PageScroller.tsx'

const SplashScreen = () => {
  const { connected } = useWallet()

  if (!connected) {
    return <Splash />
  }

  return (
    <Router>
      <Presence />
      <BalanceListener />
      <ConfigListener />
      <CounterListener />
      <Routes>
        <Route path='/' element={<App />}>
          <Route
            path='quest/:questId'
            element={
              <PageScroller>
                <QuestPage />
              </PageScroller>
            }
          >
            <Route path='chat' element={<ChatPage />} />
          </Route>
          <Route
            path='notifications'
            element={
              <PageScroller>
                <NotificationPage />
              </PageScroller>
            }
          />
        </Route>
      </Routes>
    </Router>
  )
}

const Reload = () => {
  return (
    <div className='flex items-center justify-center flex-col absolute inset-0 gap-2'>
      <span>An error occurred. Please refresh the page.</span>
      <button
        className='px-3 py-2 bg-amber-300/10'
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<Reload />}>
      <WalletAdapter>
        <AtomsInitializer>
          <SplashScreen />
        </AtomsInitializer>
      </WalletAdapter>
    </ErrorBoundary>
  </React.StrictMode>
)
