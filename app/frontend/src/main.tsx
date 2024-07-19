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

const SplashScreen = () => {
  const { connected } = useWallet()

  if (!connected) {
    return <Splash />
  }

  return (
    <Router>
      <Routes>
        <Route path='/' element={<App />} />
      </Routes>
    </Router>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletAdapter>
      <AtomsInitializer>
        <BalanceListener />
        <ConfigListener />
        <SplashScreen />
      </AtomsInitializer>
    </WalletAdapter>
  </React.StrictMode>
)
