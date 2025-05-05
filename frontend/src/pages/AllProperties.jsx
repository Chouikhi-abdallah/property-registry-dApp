import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';

const AllProperties = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [account, setAccount] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        console.error('Error initializing all properties view:', err);
        setError('Failed to load properties. Please check your connection and try again.');
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
      
      // Filter out null values (failed fetches)
      const validProperties = propertyDetails.filter(property => property !== null);
      
      setProperties(validProperties);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    // Filter by search term
    const matchesSearch = 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by option
    if (filterOption === 'all') {
      return matchesSearch;
    } else if (filterOption === 'validated') {
      return property.isValidated && !property.isSold && matchesSearch;
    } else if (filterOption === 'pending') {
      return !property.isValidated && !property.isSold && matchesSearch;
    } else if (filterOption === 'sold') {
      return property.isSold && matchesSearch;
    } else if (filterOption === 'mine') {
      return property.owner.toLowerCase() === account.toLowerCase() && matchesSearch;
    } else if (filterOption === 'others') {
      return property.owner.toLowerCase() !== account.toLowerCase() && matchesSearch;
    }
    return matchesSearch;
  });

  if (isLoading) {
    return <div className="loading">Loading properties...</div>;
  }

  return (
    <div className="all-properties-container">
      <h1>All Properties</h1>
      <p>View all properties registered on the platform</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters-container">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search by title, location, or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-options">
          <button 
            className={`filter-btn ${filterOption === 'all' ? 'active' : ''}`}
            onClick={() => setFilterOption('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filterOption === 'validated' ? 'active' : ''}`}
            onClick={() => setFilterOption('validated')}
          >
            For Sale
          </button>
          <button 
            className={`filter-btn ${filterOption === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterOption('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filterOption === 'sold' ? 'active' : ''}`}
            onClick={() => setFilterOption('sold')}
          >
            Sold
          </button>
          <button 
            className={`filter-btn ${filterOption === 'mine' ? 'active' : ''}`}
            onClick={() => setFilterOption('mine')}
          >
            My Properties
          </button>
          <button 
            className={`filter-btn ${filterOption === 'others' ? 'active' : ''}`}
            onClick={() => setFilterOption('others')}
          >
            Other Users
          </button>
        </div>
      </div>
      
      {filteredProperties.length === 0 ? (
        <div className="no-properties">
          <p>No properties found matching your criteria.</p>
        </div>
      ) : (
        <div className="property-grid">
          {filteredProperties.map((property) => (
            <div key={property.id} className="property-card">
              <div className="property-details">
                <h3>{property.title}</h3>
                <div className="property-meta">
                  <span className="property-id">ID: {property.id}</span>
                  <span className={`property-status ${property.isValidated ? (property.isSold ? 'sold' : 'active') : 'pending'}`}>
                    {property.isValidated ? (property.isSold ? 'Sold' : 'For Sale') : 'Pending Validation'}
                  </span>
                </div>
                <p className="property-location">{property.location}</p>
                <p className="property-description">{property.description}</p>
                <div className="property-price">{property.price} ETH</div>
                <div className="property-owner">
                  Owner: 
                  <span className={property.owner.toLowerCase() === account.toLowerCase() ? 'current-user' : ''}>
                    {property.owner.toLowerCase() === account.toLowerCase() ? 
                      'You' : 
                      `${property.owner.substring(0, 8)}...${property.owner.substring(property.owner.length - 6)}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllProperties;
