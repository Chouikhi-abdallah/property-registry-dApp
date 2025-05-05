import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';

const Dashboard = () => {
  const [properties, setProperties] = useState([]);
  const [balance, setBalance] = useState('0');
  const [account, setAccount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        // Check if wallet is connected
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            await loadUserData(accounts[0]);
          } else {
            setError('Please connect your wallet to view your properties');
            setIsLoading(false);
          }
        } else {
          setError('MetaMask is not installed. Please install it to use this dApp');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        setError('Failed to load dashboard. Please check your connection and try again.');
        setIsLoading(false);
      }
    };

    init();

    // Listen for account changes
    window.ethereum?.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        loadUserData(accounts[0]);
      } else {
        setAccount('');
        setProperties([]);
        setBalance('0');
        setError('Please connect your wallet to view your properties');
      }
    });

    return () => {
      window.ethereum?.removeAllListeners('accountsChanged');
    };
  }, []);

  const loadUserData = async (address) => {
    try {
      setIsLoading(true);
      
      // Get user's ETH balance
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(balance));
      
      try {
        // Get contract instance
        const contract = await getContract();
        
        // First, try to get all properties from the contract
        const allPropertyIds = await contract.getAllProperties();
        
        if (allPropertyIds && allPropertyIds.length > 0) {
          // Fetch details for each property
          const allPropertyDetails = await Promise.all(
            allPropertyIds.map(async (id) => {
              try {
                const property = await contract.getPropertyDetails(id);
                return {
                  id: property.id.toString(),
                  title: property.title,
                  description: property.description,
                  location: property.location,
                  price: ethers.utils.formatEther(property.price),
                  owner: property.owner,
                  isValidated: property.isValidated,
                  isSold: property.isSold
                };
              } catch (err) {
                console.error(`Error fetching property ${id}:`, err);
                return null;
              }
            })
          );
          
          // Filter out null values and properties owned by the current user
          const userProperties = allPropertyDetails
            .filter(property => property !== null && property.owner.toLowerCase() === address.toLowerCase());
          
          setProperties(userProperties);
        } else {
          setProperties([]);
        }
      } catch (contractErr) {
        console.error('Error with contract interactions:', contractErr);
        setError('Could not connect to the smart contract. Please make sure you are connected to the correct network in MetaMask.');
        setProperties([]);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load your properties. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setError('');
          await loadUserData(accounts[0]);
        }
      } else {
        setError('MetaMask is not installed. Please install it to use this dApp');
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading your properties...</div>;
  }

  if (!account) {
    return (
      <div className="dashboard-container">
        <div className="connect-wallet-prompt">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to view your properties</p>
          <button onClick={connectWallet} className="connect-button">Connect Wallet</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>My Properties</h1>
      
      <div className="user-stats">
        <div className="wallet-info">
          <p>Wallet Address: <span className="address">{`${account.substring(0, 8)}...${account.substring(account.length - 6)}`}</span></p>
          <p>Balance: <span className="balance">{balance} ETH</span></p>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="properties-section">
        <h2>Your Properties</h2>
        
        {properties.length === 0 ? (
          <div className="no-properties">
            <p>You don't own any properties yet.</p>
          </div>
        ) : (
          <div className="property-list">
            {properties.map((property) => (
              <div key={property.id} className="property-card">
                <div className="property-image">
                  {/* Placeholder for property image */}
                  <div className="image-placeholder">Property Image</div>
                </div>
                <div className="property-details">
                  <h3>{property.title}</h3>
                  <p className="property-location">{property.location}</p>
                  <p className="property-description">{property.description}</p>
                  <div className="property-price">{property.price} ETH</div>
                  <div className="property-status">
                    {!property.isValidated && (
                      <span className="status pending">Pending Validation</span>
                    )}
                    {property.isValidated && !property.isSold && (
                      <span className="status active">Active - For Sale</span>
                    )}
                    {property.isValidated && property.isSold && (
                      <span className="status sold">Sold</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
