import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';

const Admin = () => {
  const [properties, setProperties] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');
  const [validationStatus, setValidationStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionPropertyId, setRejectionPropertyId] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    const checkAdminAndLoadProperties = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            
            try {
              const contract = await getContract();
              
              // Try to use new contract version (V3)
              try {
                // Check if super admin
                const superAdmin = await contract.superAdmin();
                const isSuperAdminAccount = superAdmin.toLowerCase() === accounts[0].toLowerCase();
                setIsSuperAdmin(isSuperAdminAccount);
                
                // Check if admin
                const isAdminAccount = await contract.isAdmin(accounts[0]);
                setIsAdmin(isAdminAccount || isSuperAdminAccount); // Super admin can also do admin functions
                
                if (isAdminAccount || isSuperAdminAccount) {
                  await loadPendingProperties();
                } else {
                  setError('You do not have admin access');
                }
              } catch (err) {
                // Fallback to older contract version (V1/V2)
                const admin = await contract.admin();
                const isUserAdmin = admin.toLowerCase() === accounts[0].toLowerCase();
                setIsAdmin(isUserAdmin);
                setIsSuperAdmin(isUserAdmin); // In old version, admin is also super admin
                
                if (isUserAdmin) {
                  await loadPendingProperties();
                } else {
                  setError('You do not have admin access');
                }
              }
            } catch (err) {
              console.error('Error checking admin role:', err);
              setError('Failed to verify admin role');
              setIsLoading(false);
            }
          } else {
            setError('Please connect your wallet');
          }
        } else {
          setError('MetaMask is not installed');
        }
      } catch (err) {
        console.error('Error in admin panel:', err);
        setError('An error occurred while loading the admin panel');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminAndLoadProperties();
    
    // Listen for account changes
    window.ethereum?.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        checkAdminAndLoadProperties();
      } else {
        setAccount('');
        setIsAdmin(false);
        setProperties([]);
      }
    });
    
    return () => {
      window.ethereum?.removeAllListeners('accountsChanged');
    };
  }, []);

  const checkIfAdmin = async (address) => {
    try {
      const contract = await getContract();
      const admin = await contract.admin();
      
      const isUserAdmin = admin.toLowerCase() === address.toLowerCase();
      setIsAdmin(isUserAdmin);
      
      return isUserAdmin;
    } catch (err) {
      console.error('Error checking admin status:', err);
      return false;
    }
  };

  const loadPendingProperties = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const propertyCount = await contract.propertyCount();
      const propertiesArray = [];

      for (let i = 1; i <= propertyCount; i++) {
        try {
          let property;
          let status = "Pending";

          // Try to get property with status (V3 contract)
          try {
            property = await contract.properties(i);
            const propertyStatus = await contract.getPropertyStatus(i);
            
            // Convert status from number to string
            if (propertyStatus === 0) status = "Pending";
            else if (propertyStatus === 1) status = "Approved";
            else if (propertyStatus === 2) status = "Rejected";
            else if (propertyStatus === 3) status = "Sold";
          } catch (err) {
            // Fallback to V1/V2 contract
            property = await contract.properties(i);
            status = property.isVerified ? "Approved" : property.isSold ? "Sold" : "Pending";
          }

          // Only display pending properties for validation
          if (status === "Pending") {
            propertiesArray.push({
              id: i,
              owner: property.owner,
              location: property.location,
              description: property.description,
              price: ethers.utils.formatEther(property.price),
              images: property.images,
              status: status
            });
          }
        } catch (err) {
          console.error(`Error loading property ${i}:`, err);
          // Skip this property if there's an error
        }
      }

      setProperties(propertiesArray);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Error loading properties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateProperty = async (propertyId) => {
    try {
      setValidationStatus('');
      
      if (!isAdmin) {
        setError('You do not have admin permissions');
        return;
      }
      
      const contract = await getContract();
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      
      // Try new contract method first
      try {
        const tx = await contractWithSigner.approveProperty(propertyId);
        await tx.wait();
      } catch (err) {
        // Fallback to old contract method
        const tx = await contractWithSigner.validateProperty(propertyId);
        await tx.wait();
      }

      setValidationStatus(`Property ID: ${propertyId} has been approved successfully.`);
      await loadPendingProperties();
      // Reset status after 3 seconds
      setTimeout(() => setValidationStatus(''), 3000);
    } catch (err) {
      console.error('Error approving property:', err);
      setError(`Error approving property: ${err.message}`);
      // Reset error after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const openRejectModal = (propertyId) => {
    setRejectionPropertyId(propertyId);
    setShowRejectionModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectionModal(false);
    setRejectionPropertyId(null);
    setRejectionReason('');
  };

  const rejectProperty = async () => {
    if (!rejectionPropertyId || !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    try {
      setIsLoading(true);
      const contract = await getContract();
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      
      // For now, we'll just use the contract's rejection function without storing the reason
      // In a full implementation, we'd extend the contract to store the rejection reason
      const tx = await contractWithSigner.rejectProperty(rejectionPropertyId);
      await tx.wait();

      setValidationStatus(`Property ID: ${rejectionPropertyId} has been rejected.`);
      closeRejectModal();
      await loadPendingProperties();
      // Reset status after 3 seconds
      setTimeout(() => setValidationStatus(''), 3000);
    } catch (err) {
      console.error('Error rejecting property:', err);
      setError(`Error rejecting property: ${err.message}`);
      // Reset error after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading admin panel...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have admin privileges to access this page.</p>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>{isSuperAdmin ? 'Super Admin' : 'Admin'} Dashboard</h1>
      <p className="section-description">Review and manage pending property registrations</p>
      
      {error && <div className="error-message">{error}</div>}
      {validationStatus && <div className="success-message">{validationStatus}</div>}
      
      {!isAdmin && !isSuperAdmin ? (
        <div className="admin-only-message">
          <p>This page is only accessible to admins and super admins.</p>
        </div>
      ) : isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="no-properties-message">
          <p>No pending properties to review.</p>
        </div>
      ) : (
        <div className="properties-container">
          <h2>Pending Properties</h2>
          <div className="property-cards">
            {properties.map((property, index) => (
              <div className="property-card" key={index}>
                <div className="property-details">
                  <h3>Property #{property.id}</h3>
                  <p>
                    <strong>Owner:</strong> {`${property.owner.substring(0, 6)}...${property.owner.substring(property.owner.length - 4)}`}
                  </p>
                  <p>
                    <strong>Location:</strong> {property.location}
                  </p>
                  <p>
                    <strong>Description:</strong> {property.description}
                  </p>
                  <p>
                    <strong>Price:</strong> {property.price} ETH
                  </p>
                  {property.images && (
                    <div className="property-images">
                      <p>
                        <strong>Images URL:</strong>{' '}
                        <a href={property.images} target="_blank" rel="noopener noreferrer">
                          View Images
                        </a>
                      </p>
                    </div>
                  )}
                </div>
                <div className="property-actions">
                  <button
                    className="approve-button"
                    onClick={() => approveProperty(property.id)}
                    disabled={isLoading}
                  >
                    Approve Property
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => openRejectModal(property.id)}
                    disabled={isLoading}
                  >
                    Reject Property
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Reject Property #{rejectionPropertyId}</h3>
            <p>Please provide a reason for rejection:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason"
              rows={4}
            />
            <div className="modal-actions">
              <button className="cancel-button" onClick={closeRejectModal}>Cancel</button>
              <button 
                className="confirm-button" 
                onClick={rejectProperty}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
