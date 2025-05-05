import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';

const Marketplace = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [account, setAccount] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        // Get current account
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        }
        
        await loadProperties();
      } catch (err) {
        console.error('Error initializing marketplace:', err);
        setError('Failed to load marketplace. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Listen for account changes
    window.ethereum?.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount('');
      }
    });

    return () => {
      window.ethereum?.removeAllListeners('accountsChanged');
    };
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      
      // Get all property IDs
      const propertyIds = await contract.getAllProperties();
      
      // Fetch details for each property
      const propertyDetails = await Promise.all(
        propertyIds.map(async (id) => {
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
        })
      );
      
      // Filter only validated and not sold properties
      const availableProperties = propertyDetails.filter(
        property => property.isValidated && !property.isSold
      );
      
      setProperties(availableProperties);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyProperty = async (propertyId, price) => {
    try {
      if (!account) {
        alert('Please connect your wallet first');
        return;
      }

      const contract = await getContract();
      const priceInWei = ethers.utils.parseEther(price.toString());
      
      // Buy the property
      const tx = await contract.buyProperty(propertyId, {
        value: priceInWei
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Reload properties
      await loadProperties();
      
      alert('Property purchased successfully!');
    } catch (err) {
      console.error('Error buying property:', err);
      alert(`Failed to buy property: ${err.message || 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading properties...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="marketplace-container">
      <h1>Property Marketplace</h1>
      <p>Browse and purchase validated properties</p>
      
      {properties.length === 0 ? (
        <div className="no-properties">
          <p>No properties available for purchase at the moment.</p>
        </div>
      ) : (
        <div className="property-grid">
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
                <button 
                  className="buy-button"
                  onClick={() => handleBuyProperty(property.id, property.price)}
                  disabled={property.owner.toLowerCase() === account.toLowerCase()}
                >
                  {property.owner.toLowerCase() === account.toLowerCase() 
                    ? 'You own this property' 
                    : 'Buy Property'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
