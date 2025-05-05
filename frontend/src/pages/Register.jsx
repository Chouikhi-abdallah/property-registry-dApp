import { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { getContract } from '../utils/contract';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.title || !formData.description || !formData.location || !formData.price) {
        throw new Error('All fields are required');
      }

      if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
        throw new Error('Price must be a positive number');
      }

      // Convert price to wei
      const priceInWei = ethers.utils.parseEther(formData.price);

      // Get contract instance
      const contract = await getContract();
      
      // Register property
      const tx = await contract.registerProperty(
        formData.title,
        formData.description,
        formData.location,
        priceInWei
      );

      // Wait for transaction to be mined
      await tx.wait();
      
      // Navigate to dashboard after successful registration
      navigate('/dashboard');
    } catch (err) {
      console.error('Error registering property:', err);
      setError(err.message || 'An error occurred while registering the property');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1>Register a New Property</h1>
      <p>Fill out the details below to register your property on the blockchain</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="property-form">
        <div className="form-group">
          <label htmlFor="title">Property Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter property title"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your property"
            rows={4}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter property location"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="price">Price (ETH)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Enter property price in ETH"
            step="0.001"
            min="0"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register Property'}
        </button>
      </form>
    </div>
  );
};

export default Register;
