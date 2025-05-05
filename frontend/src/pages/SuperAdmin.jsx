import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';

const SuperAdmin = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [newSuperAdminAddress, setNewSuperAdminAddress] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingAction, setProcessingAction] = useState('');

  useEffect(() => {
    const checkIfSuperAdmin = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            
            const contract = await getContract();
            const superAdmin = await contract.superAdmin();
            const isSuperAdminAccount = superAdmin.toLowerCase() === accounts[0].toLowerCase();
            
            setIsSuperAdmin(isSuperAdminAccount);
            
            if (isSuperAdminAccount) {
              await loadData();
            }
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error checking super admin status:', err);
        setError('Failed to check super admin status. Please try again.');
        setIsLoading(false);
      }
    };
    
    checkIfSuperAdmin();
    
    // Listen for account changes
    window.ethereum?.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        checkIfSuperAdmin();
      } else {
        setAccount('');
        setIsSuperAdmin(false);
      }
    });
    
    return () => {
      window.ethereum?.removeAllListeners('accountsChanged');
    };
  }, []);

  const loadData = async () => {
    try {
      // In a real implementation, you would fetch all registered users and admins
      // For now, we'll just update the UI to show functionality
      setRegisteredUsers([]);
      setAdminList([]);
      
      // In a real implementation with an event listener or indexing service, 
      // you would populate these lists from blockchain events
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load user and admin data.');
    }
  };

  const registerUser = async (e) => {
    e.preventDefault();
    if (!ethers.utils.isAddress(newUserAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    try {
      setProcessingAction('registering');
      setError('');
      setSuccess('');
      
      const contract = await getContract();
      
      // Register the user
      const tx = await contract.registerUser(newUserAddress);
      
      setSuccess(`Registering user ${newUserAddress}. Waiting for confirmation...`);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setSuccess(`User ${newUserAddress} registered successfully!`);
      setNewUserAddress('');
      await loadData();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error registering user:', err);
      setError(`Failed to register user: ${err.message || 'Unknown error'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    if (!ethers.utils.isAddress(newAdminAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    try {
      setProcessingAction('addingAdmin');
      setError('');
      setSuccess('');
      
      const contract = await getContract();
      
      // Add the admin
      const tx = await contract.addAdmin(newAdminAddress);
      
      setSuccess(`Adding admin ${newAdminAddress}. Waiting for confirmation...`);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setSuccess(`Admin ${newAdminAddress} added successfully!`);
      setNewAdminAddress('');
      await loadData();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error adding admin:', err);
      setError(`Failed to add admin: ${err.message || 'Unknown error'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const removeAdmin = async (adminAddress) => {
    try {
      setProcessingAction(`removing-${adminAddress}`);
      setError('');
      setSuccess('');
      
      const contract = await getContract();
      
      // Remove the admin
      const tx = await contract.removeAdmin(adminAddress);
      
      setSuccess(`Removing admin ${adminAddress}. Waiting for confirmation...`);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setSuccess(`Admin ${adminAddress} removed successfully!`);
      await loadData();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error removing admin:', err);
      setError(`Failed to remove admin: ${err.message || 'Unknown error'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const transferSuperAdmin = async (e) => {
    e.preventDefault();
    if (!ethers.utils.isAddress(newSuperAdminAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    try {
      setProcessingAction('transferring');
      setError('');
      setSuccess('');
      
      const contract = await getContract();
      
      // Transfer super admin role
      const tx = await contract.changeSuperAdmin(newSuperAdminAddress);
      
      setSuccess(`Transferring super admin rights to ${newSuperAdminAddress}. Waiting for confirmation...`);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setSuccess(`Super admin role transferred to ${newSuperAdminAddress} successfully!`);
      setNewSuperAdminAddress('');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
        // Redirect or update UI as the current user is no longer super admin
        setIsSuperAdmin(false);
      }, 5000);
    } catch (err) {
      console.error('Error transferring super admin role:', err);
      setError(`Failed to transfer super admin role: ${err.message || 'Unknown error'}`);
    } finally {
      setProcessingAction('');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading super admin dashboard...</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="super-admin-container">
        <h1>Super Admin Dashboard</h1>
        <div className="access-denied">
          <p>Only the super admin can access this page.</p>
          <p>Current address: {account || 'Not connected'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-container">
      <h1>Super Admin Dashboard</h1>
      <p>Manage platform users and administrators</p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="super-admin-sections">
        <div className="admin-section">
          <h2>Register New User</h2>
          <form onSubmit={registerUser} className="admin-form">
            <div className="form-group">
              <label htmlFor="newUserAddress">User Ethereum Address</label>
              <input
                type="text"
                id="newUserAddress"
                value={newUserAddress}
                onChange={(e) => setNewUserAddress(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={processingAction === 'registering'}
              className="admin-button"
            >
              {processingAction === 'registering' ? 'Registering...' : 'Register User'}
            </button>
          </form>
        </div>
        
        <div className="admin-section">
          <h2>Manage Admins</h2>
          <form onSubmit={addAdmin} className="admin-form">
            <div className="form-group">
              <label htmlFor="newAdminAddress">Admin Ethereum Address</label>
              <input
                type="text"
                id="newAdminAddress"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={processingAction === 'addingAdmin'}
              className="admin-button"
            >
              {processingAction === 'addingAdmin' ? 'Adding Admin...' : 'Add Admin'}
            </button>
          </form>
          
          <div className="admin-list">
            <h3>Current Admins</h3>
            {adminList.length === 0 ? (
              <p>No admins found.</p>
            ) : (
              <ul>
                {adminList.map((admin) => (
                  <li key={admin} className="admin-item">
                    <span className="admin-address">{admin}</span>
                    <button
                      onClick={() => removeAdmin(admin)}
                      disabled={processingAction === `removing-${admin}`}
                      className="remove-button"
                    >
                      {processingAction === `removing-${admin}` ? 'Removing...' : 'Remove'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="admin-section danger-zone">
          <h2>Danger Zone</h2>
          <form onSubmit={transferSuperAdmin} className="admin-form">
            <div className="form-group">
              <label htmlFor="newSuperAdminAddress">New Super Admin Address</label>
              <input
                type="text"
                id="newSuperAdminAddress"
                value={newSuperAdminAddress}
                onChange={(e) => setNewSuperAdminAddress(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={processingAction === 'transferring'}
              className="danger-button"
            >
              {processingAction === 'transferring' ? 'Transferring...' : 'Transfer Super Admin Role'}
            </button>
            <p className="warning-text">
              Warning: This will permanently transfer Super Admin rights to another address. 
              You will lose all Super Admin privileges immediately.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
