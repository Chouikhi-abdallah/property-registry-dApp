# Property Registry DApp

A decentralized application for property registration, validation, and trading built on Ethereum blockchain.

## Overview

This DApp allows users to:
- Register properties with details (title, description, location, price)
- Get properties validated by an admin
- Buy and sell properties using ETH
- View owned properties and wallet balance

## Technology Stack

- **Smart Contract**: Solidity (via Truffle)
- **Frontend**: React.js with Vite
- **Blockchain Integration**: Ethers.js
- **Wallet Connection**: MetaMask
- **Local Development**: Ganache

## Project Structure

```
/property-registry-dApp
├── contracts/
│   └── PropertyRegistry.sol     # Main smart contract
├── migrations/
│   └── 1_deploy_contracts.js    # Deployment script
├── property-frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Admin.jsx        # Admin panel for validation
│   │   │   ├── Dashboard.jsx    # User dashboard
│   │   │   ├── Home.jsx         # Landing page
│   │   │   ├── Marketplace.jsx  # Property marketplace
│   │   │   ├── Navbar.jsx       # Navigation component
│   │   │   └── Register.jsx     # Property registration form
│   │   ├── contracts/           # Contract ABIs
│   │   ├── utils/               # Utility functions
│   │   ├── App.jsx              # Main app component
│   │   ├── App.css              # App styles
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite configuration
└── truffle-config.js            # Truffle configuration
```

## Getting Started

### Prerequisites

- Node.js and npm
- Ganache - local Ethereum blockchain
- MetaMask browser extension
- Truffle CLI

### Setup Instructions

1. **Start Ganache**
   ```
   # Start Ganache GUI or CLI
   ganache-cli
   ```

2. **Deploy Smart Contracts**
   ```
   cd property-registry-dApp
   truffle compile
   truffle migrate --network development
   ```

3. **Update Contract Address**
   - After deployment, copy the contract address from the Truffle output
   - Update the contract address in `property-frontend/src/utils/constants.js`

4. **Install Frontend Dependencies**
   ```
   cd property-frontend
   npm install
   ```

5. **Start Frontend Application**
   ```
   npm run dev
   ```

6. **Configure MetaMask**
   - Connect MetaMask to Ganache (usually http://localhost:7545)
   - Import an account from Ganache using the private key

## Smart Contract Functions

- `registerProperty`: Register a new property
- `validateProperty`: Validate a property (admin only)
- `buyProperty`: Purchase a property
- `getUserProperties`: Get properties owned by a user
- `getPropertyDetails`: Get details of a specific property
- `getAllProperties`: Get IDs of all properties

## Frontend Features

- **Role-based UI**: Different views for regular users and admin
- **Property Registration**: Form to submit new properties
- **Property Marketplace**: Browse and purchase validated properties
- **User Dashboard**: View owned properties and wallet balance
- **Admin Panel**: Validate pending properties

## Testing

To run tests for the smart contract:
```
truffle test
```

## Deployment to Testnet

To deploy to Ethereum testnets like Goerli or Sepolia, update the `truffle-config.js` file with the appropriate network settings and use the following command:

```
truffle migrate --network goerli
```

## License

This project is licensed under the MIT License.
