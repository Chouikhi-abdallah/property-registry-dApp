import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { createRoutesFromElements } from 'react-router'
import './App.css'

// Components
import Navbar from './components/Navbar'

// Pages
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import AllProperties from './pages/AllProperties'
import AdminEarnings from './pages/AdminEarnings'
import SuperAdmin from './pages/SuperAdmin'

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if MetaMask is installed and connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Check if we're already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setIsConnected(accounts.length > 0);
          
          // We'll add admin check later when we integrate with the contract
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setIsConnected(accounts.length > 0);
        if (accounts.length === 0) {
          setIsAdmin(false);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/all-properties" element={<AllProperties />} />
            <Route path="/admin-earnings" element={<AdminEarnings />} />
            <Route path="/super-admin" element={<SuperAdmin />} />
          </Routes>
        </main>
        <footer className="footer">
          <p> {new Date().getFullYear()} Property Registry DApp - Built with Ethereum</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
