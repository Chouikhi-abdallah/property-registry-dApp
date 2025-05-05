import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Decentralized Property Registry</h1>
        <p>Register, validate, and trade properties on the blockchain</p>
        <div className="hero-buttons">
          <Link to="/marketplace" className="btn btn-primary">Browse Properties</Link>
          <Link to="/register" className="btn btn-secondary">Register a Property</Link>
        </div>
      </div>
      
      <div className="features-section">
        <h2>Features</h2>
        <div className="feature-cards">
          <div className="feature-card">
            <h3>Secure Registration</h3>
            <p>Register your properties on the Ethereum blockchain with immutable proof of ownership</p>
          </div>
          <div className="feature-card">
            <h3>Verified Properties</h3>
            <p>All properties are validated by an admin to ensure authenticity</p>
          </div>
          <div className="feature-card">
            <h3>Easy Trading</h3>
            <p>Buy and sell properties using ETH with automated ownership transfer</p>
          </div>
        </div>
      </div>
      
      <div className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Connect Wallet</h3>
            <p>Connect your MetaMask wallet to get started</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Register Property</h3>
            <p>Fill out the property details and submit for validation</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Validated</h3>
            <p>Wait for admin validation to make your property available</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Buy or Sell</h3>
            <p>Trade properties on the marketplace using ETH</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
