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

const SplashScreen = () => {
  const { connected } = useWallet()

  if (!connected) {
    return <Splash />
  }

  return (
    <Router>
      <Routes>
        <Route path='/' element={<App />}>
          <Route path='quest/:questId' element={<QuestPage />} />
          <Route path='notification' element={<NotificationPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletAdapter>
      <AtomsInitializer>
        <Presence />
        <BalanceListener />
        <ConfigListener />
        <CounterListener />
        <SplashScreen />
      </AtomsInitializer>
    </WalletAdapter>
  </React.StrictMode>
)
