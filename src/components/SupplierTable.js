// components/SupplierTable.js
import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const SupplierTable = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierData, setSupplierData] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/suppliers');
        
        // Ensure we have an array of suppliers
        const suppliers = Array.isArray(response.data) ? response.data : [];
        
        // Transform the data to include keys and handle missing values
        const formattedData = suppliers.map((supplier, index) => ({
          key: supplier.id || String(index),
          name: supplier.name || 'Unknown',
          location: supplier.location || 'Unknown',
          emission_ratings: supplier.emission_ratings || 0,
          created_at: supplier.created_at
        }));
        
        setSupplierData(formattedData);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to fetch suppliers');
        setSupplierData([]); // Ensure empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  if (loading) {
    return <div className="loading-text">Loading suppliers...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="supplier-table-container">
      <table className="supplier-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Sustainability Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {supplierData.map((supplier) => (
            <tr key={supplier.key}>
              <td>{supplier.name}</td>
              <td>{supplier.location}</td>
              <td>
                <div className="score-container">
                  <div className="score-bar-container">
                    <div 
                      className="score-bar" 
                      style={{ 
                        width: `${supplier.emission_ratings}%`,
                        backgroundColor: supplier.emission_ratings < 50 ? 'var(--error-color)' : 
                                       supplier.emission_ratings < 80 ? 'var(--warning-color)' : 
                                       'var(--success-color)'
                      }}
                    />
                  </div>
                  <span className="score-value">{supplier.emission_ratings}%</span>
                </div>
              </td>
              <td>
                <button className="view-btn">View Details</button>
              </td>
            </tr>
          ))}
          {supplierData.length === 0 && (
            <tr>
              <td colSpan="4" className="empty-state">
                No suppliers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierTable;
