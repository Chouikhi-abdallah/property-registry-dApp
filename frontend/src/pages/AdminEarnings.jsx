import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';

const AdminEarnings = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState('');
  const [adminBalance, setAdminBalance] = useState('0');
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkUserRolesAndLoadData = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            
            const contract = await getContract();
            let isAdminOrSuperAdmin = false;
            
            // Try to use new contract methods (V3)
            try {
              // Check if super admin or admin
              const superAdmin = await contract.superAdmin();
              const isSuperAdminAccount = superAdmin.toLowerCase() === accounts[0].toLowerCase();
              const isAdminAccount = await contract.isAdmin(accounts[0]);
              
              isAdminOrSuperAdmin = isAdminAccount || isSuperAdminAccount;
              setIsAdmin(isAdminOrSuperAdmin);
            } catch (err) {
              // Fallback to older contract version
              try {
                const admin = await contract.admin();
                const isUserAdmin = admin.toLowerCase() === accounts[0].toLowerCase();
                setIsAdmin(isUserAdmin);
                isAdminOrSuperAdmin = isUserAdmin;
              } catch (oldContractErr) {
                console.error('Error checking admin with old contract:', oldContractErr);
                setIsAdmin(false);
              }
            }
            
            if (isAdminOrSuperAdmin) {
              await loadAdminData(accounts[0]);
            }
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error checking user roles:', err);
        setError('Failed to check admin status. Please try again.');
        setIsLoading(false);
      }
    };
    
    checkUserRolesAndLoadData();
    
    // Listen for account changes
    window.ethereum?.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        checkUserRolesAndLoadData();
      } else {
        setAccount('');
        setIsAdmin(false);
      }
    });
    
    return () => {
      window.ethereum?.removeAllListeners('accountsChanged');
    };
  }, []);

  const loadAdminData = async (address) => {
    try {
      const contract = await getContract();
      
      // Get admin balance from contract - try V3 contract first
      let adminBalanceWei;
      let soldCount = 0;

      try {
        // Try V3 contract with adminBalances mapping
        adminBalanceWei = await contract.adminBalances(address);
        
        // For total transactions in V3, we need to count properties with status = Sold (3)
        const propertyCount = await contract.propertyCount();
        
        for (let i = 1; i <= propertyCount; i++) {
          try {
            const status = await contract.getPropertyStatus(i);
            if (status === 3) { // PropertyStatus.Sold = 3
              soldCount++;
            }
          } catch (err) {
            console.error(`Error checking property ${i} status:`, err);
          }
        }
      } catch (v3Err) {
        // Fallback to V1/V2 contract
        try {
          // In V1/V2, there's just one adminBalance for the single admin
          adminBalanceWei = await contract.adminBalance();
          
          // For total transactions in V1/V2, we count properties with isSold = true
          const propertyIds = await contract.getAllProperties();
          
          for (const id of propertyIds) {
            try {
              const property = await contract.getPropertyDetails(id);
              if (property.isSold) {
                soldCount++;
              }
            } catch (err) {
              console.error(`Error checking property ${id}:`, err);
            }
          }
        } catch (oldContractErr) {
          console.error('Error with old contract methods:', oldContractErr);
          adminBalanceWei = ethers.BigNumber.from(0);
        }
      }
      
      setAdminBalance(ethers.utils.formatEther(adminBalanceWei));
      setTotalTransactions(soldCount);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Failed to load admin earnings data.');
    }
  };

  const withdrawEarnings = async () => {
    try {
      setWithdrawing(true);
      setError('');
      setSuccess('');
      
      if (!isAdmin) {
        setError('Only admin or super admin can withdraw earnings');
        return;
      }
      
      const contract = await getContract();
      
      // Withdraw admin earnings - try V3 contract first
      try {
        // Try V3 contract's withdrawAdminBalance which doesn't require parameters
        // as it knows the sender's address
        const tx = await contract.withdrawAdminBalance();
        
        setSuccess('Withdrawal transaction submitted. Waiting for confirmation...');
        
        // Wait for transaction to be mined
        await tx.wait();
      } catch (v3Err) {
        // Fallback to V1/V2 contract
        try {
          // V1/V2 might have a different method signature
          const tx = await contract.withdrawAdminBalance();
          
          setSuccess('Withdrawal transaction submitted. Waiting for confirmation...');
          
          // Wait for transaction to be mined
          await tx.wait();
        } catch (oldContractErr) {
          console.error('Error with old contract withdraw method:', oldContractErr);
          throw new Error('Failed to withdraw earnings with this contract version');
        }
      }
      
      // Update admin balance to 0 after successful withdrawal
      setSuccess('Earnings successfully withdrawn!');
      setAdminBalance('0');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error withdrawing earnings:', err);
      setError(`Failed to withdraw earnings: ${err.message || 'Unknown error'}`);
    } finally {
      setWithdrawing(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading admin earnings data...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="admin-earnings-container">
        <h1>Admin Earnings</h1>
        <div className="access-denied">
          <p>Only the admin can access this page.</p>
          <p>Current address: {account || 'Not connected'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-earnings-container">
      <h1>Admin Earnings Dashboard</h1>
      <p>View and manage your earnings as the admin</p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-title">Current Balance</div>
          <div className="stat-value">{adminBalance} ETH</div>
          <div className="stat-description">Accumulated from 10% transaction fees</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Total Transactions</div>
          <div className="stat-value">{totalTransactions}</div>
          <div className="stat-description">Number of property sales</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Admin Address</div>
          <div className="stat-value address-value">{`${account.substring(0, 8)}...${account.substring(account.length - 6)}`}</div>
          <div className="stat-description">Your admin address</div>
        </div>
      </div>
      
      <div className="admin-actions">
        <button 
          className="withdraw-button"
          onClick={withdrawEarnings}
          disabled={withdrawing || adminBalance === '0'}
        >
          {withdrawing ? 'Withdrawing...' : 'Withdraw All Earnings'}
        </button>
        
        <p className="help-text">
          Clicking "Withdraw All Earnings" will transfer your accumulated fees to your wallet.
        </p>
      </div>
    </div>
  );
};

export default AdminEarnings;
