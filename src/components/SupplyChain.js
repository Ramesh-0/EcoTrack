import React, { useState } from 'react';

const SupplyChain = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNodeType, setNewNodeType] = useState('supplier');
  const [newNodeData, setNewNodeData] = useState({
    name: '',
    location: '',
    emissions: '',
    status: 'active',
    score: ''
  });

  const supplyChainData = {
    suppliers: [
      {
        id: 1,
        name: 'Raw Materials Co.',
        type: 'supplier',
        emissions: 1200,
        status: 'active',
        location: 'China',
        score: 85
      },
      {
        id: 2,
        name: 'Components Inc.',
        type: 'supplier',
        emissions: 800,
        status: 'active',
        location: 'Vietnam',
        score: 92
      }
    ],
    manufacturers: [
      {
        id: 3,
        name: 'Assembly Plant A',
        type: 'manufacturer',
        emissions: 2500,
        status: 'active',
        location: 'Malaysia',
        score: 78
      },
      {
        id: 4,
        name: 'Assembly Plant B',
        type: 'manufacturer',
        emissions: 1800,
        status: 'active',
        location: 'Thailand',
        score: 88
      }
    ],
    distributors: [
      {
        id: 5,
        name: 'Global Logistics',
        type: 'distributor',
        emissions: 1500,
        status: 'active',
        location: 'Singapore',
        score: 95
      },
      {
        id: 6,
        name: 'Regional Distribution',
        type: 'distributor',
        emissions: 900,
        status: 'active',
        location: 'Japan',
        score: 82
      }
    ]
  };

  // Mock recommendations data
  const mockRecommendations = {
    topSuppliers: [
      {
        id: 101,
        name: 'GreenMaterials Ltd',
        location: 'Sweden',
        score: 96,
        emissions: 650,
        carbonReduction: 45,
        costImpact: -2,
        category: 'Raw Materials'
      },
      {
        id: 102,
        name: 'EcoComponents Co',
        location: 'Germany',
        score: 94,
        emissions: 720,
        carbonReduction: 38,
        costImpact: 0,
        category: 'Components'
      },
      {
        id: 103,
        name: 'SustainTech Industries',
        location: 'Denmark',
        score: 92,
        emissions: 780,
        carbonReduction: 32,
        costImpact: 5,
        category: 'Electronics'
      }
    ],
    insights: [
      "Switching to GreenMaterials Ltd could reduce your Scope 3 emissions by 45%",
      "European suppliers offer 37% lower carbon footprint on average than current suppliers",
      "Consider hybrid shipping options to reduce emissions during transport"
    ]
  };

  const generateRecommendations = () => {
    setIsGeneratingRecommendations(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      setRecommendations(mockRecommendations);
      setIsGeneratingRecommendations(false);
    }, 2500);
  };

  const renderScoreBar = (score) => {
    return (
      <div className="score-bar-container">
        <div 
          className="score-bar" 
          style={{ width: `${score}%` }}
        ></div>
      </div>
    );
  };

  const renderNodeDetails = (node) => {
    if (!node) return null;

    return (
      <div className="node-details">
        <h3>{node.name}</h3>
        <div className="detail-item">
          <span className="label">Type:</span>
          <span className="value">{node.type}</span>
        </div>
        <div className="detail-item">
          <span className="label">Location:</span>
          <span className="value">{node.location}</span>
        </div>
        <div className="detail-item">
          <span className="label">Emissions:</span>
          <span className="value">{node.emissions} tCO2e</span>
        </div>
        <div className="detail-item">
          <span className="label">Status:</span>
          <span className={`value status-${node.status}`}>{node.status}</span>
        </div>
        <div className="detail-item">
          <span className="label">Sustainability Score:</span>
          <div className="score-container">
            {renderScoreBar(node.score)}
            <span className="score-value">{node.score}%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAIRecommendations = () => {
    if (isGeneratingRecommendations) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>AI analyzing your supply chain and finding optimal suppliers...</p>
        </div>
      );
    }

    if (!recommendations) {
      return (
        <div className="ai-recommendations-empty">
          <i className="fas fa-robot"></i>
          <h3>AI Supplier Recommendations</h3>
          <p>Get AI-powered recommendations for more sustainable suppliers based on your current supply chain data.</p>
          <button 
            className="generate-btn" 
            onClick={generateRecommendations}
          >
            <i className="fas fa-magic"></i> Generate Recommendations
          </button>
        </div>
      );
    }

    return (
      <div className="ai-recommendations-results">
        <div className="recommendations-header">
          <h3>AI Recommended Suppliers</h3>
          <p>Based on your supply chain data, we've identified these more sustainable alternatives:</p>
        </div>
        
        <div className="recommended-suppliers">
          {recommendations.topSuppliers.map(supplier => (
            <div key={supplier.id} className="recommended-supplier-card">
              <div className="supplier-header">
                <h4>{supplier.name}</h4>
                <div className="supplier-category">{supplier.category}</div>
              </div>
              
              <div className="supplier-location">
                <i className="fas fa-map-marker-alt"></i> {supplier.location}
              </div>
              
              <div className="supplier-metrics">
                <div className="metric">
                  <div className="metric-label">Sustainability Score</div>
                  <div className="metric-value-container">
                    {renderScoreBar(supplier.score)}
                    <span className="metric-value">{supplier.score}%</span>
                  </div>
                </div>
                
                <div className="metric">
                  <div className="metric-label">Carbon Reduction</div>
                  <div className="metric-value reduction">-{supplier.carbonReduction}%</div>
                </div>
                
                <div className="metric">
                  <div className="metric-label">Cost Impact</div>
                  <div className={`metric-value ${supplier.costImpact <= 0 ? 'positive' : 'negative'}`}>
                    {supplier.costImpact <= 0 ? '' : '+'}
                    {supplier.costImpact}%
                  </div>
                </div>
              </div>
              
              <div className="supplier-actions">
                <button className="action-btn contact-btn">
                  <i className="fas fa-envelope"></i> Contact
                </button>
                <button className="action-btn details-btn">
                  <i className="fas fa-info-circle"></i> Details
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="ai-insights">
          <h4><i className="fas fa-lightbulb"></i> AI Insights</h4>
          <ul>
            {recommendations.insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
        
        <div className="recommendations-actions">
          <button 
            className="refresh-btn"
            onClick={generateRecommendations}
          >
            <i className="fas fa-sync-alt"></i> Refresh Recommendations
          </button>
        </div>
      </div>
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNodeData({
      ...newNodeData,
      [name]: name === 'emissions' || name === 'score' ? Number(value) : value
    });
  };

  const handleCreateNode = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to save the new node
    // For now, we'll just close the modal
    setShowCreateModal(false);
    // Reset form
    setNewNodeData({
      name: '',
      location: '',
      emissions: '',
      status: 'active',
      score: ''
    });
    // Show success message (in a real app)
    alert('Supply chain node created successfully!');
  };

  const renderCreateSupplyChainModal = () => {
    if (!showCreateModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Add New Supply Chain Node</h3>
            <button 
              className="close-btn" 
              onClick={() => setShowCreateModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <form onSubmit={handleCreateNode}>
            <div className="form-group">
              <label>Node Type</label>
              <select 
                value={newNodeType} 
                onChange={(e) => setNewNodeType(e.target.value)}
                className="form-control"
              >
                <option value="supplier">Supplier</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                name="name"
                value={newNodeData.name}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter company name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                name="location"
                value={newNodeData.location}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Country or region"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Emissions (tCO2e)</label>
              <input 
                type="number" 
                name="emissions"
                value={newNodeData.emissions}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Annual emissions"
                required
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select 
                name="status"
                value={newNodeData.status}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Sustainability Score (0-100)</label>
              <input 
                type="number" 
                name="score"
                value={newNodeData.score}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Sustainability score"
                required
                min="0"
                max="100"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
              >
                <i className="fas fa-plus"></i> Create Node
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="supply-chain-container">
      <div className="page-header">
        <h2 className="page-title">Supply Chain Management</h2>
        <button 
          className="create-chain-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus"></i> Add Supply Chain Node
        </button>
      </div>
      
      <div className="supply-chain-grid">
        <div className="supply-chain-column">
          <h3>Suppliers</h3>
          <div className="node-list">
            {supplyChainData.suppliers.map(supplier => (
              <div 
                key={supplier.id}
                className={`node-card ${selectedNode?.id === supplier.id ? 'selected' : ''}`}
                onClick={() => setSelectedNode(supplier)}
              >
                <div className="node-header">
                  <i className="fas fa-industry"></i>
                  <h4>{supplier.name}</h4>
                </div>
                <div className="node-info">
                  <span className="location">{supplier.location}</span>
                  <div className="score-container">
                    {renderScoreBar(supplier.score)}
                    <span className="score-value">{supplier.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="supply-chain-column">
          <h3>Manufacturers</h3>
          <div className="node-list">
            {supplyChainData.manufacturers.map(manufacturer => (
              <div 
                key={manufacturer.id}
                className={`node-card ${selectedNode?.id === manufacturer.id ? 'selected' : ''}`}
                onClick={() => setSelectedNode(manufacturer)}
              >
                <div className="node-header">
                  <i className="fas fa-cogs"></i>
                  <h4>{manufacturer.name}</h4>
                </div>
                <div className="node-info">
                  <span className="location">{manufacturer.location}</span>
                  <div className="score-container">
                    {renderScoreBar(manufacturer.score)}
                    <span className="score-value">{manufacturer.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="supply-chain-column">
          <h3>Distributors</h3>
          <div className="node-list">
            {supplyChainData.distributors.map(distributor => (
              <div 
                key={distributor.id}
                className={`node-card ${selectedNode?.id === distributor.id ? 'selected' : ''}`}
                onClick={() => setSelectedNode(distributor)}
              >
                <div className="node-header">
                  <i className="fas fa-truck"></i>
                  <h4>{distributor.name}</h4>
                </div>
                <div className="node-info">
                  <span className="location">{distributor.location}</span>
                  <div className="score-container">
                    {renderScoreBar(distributor.score)}
                    <span className="score-value">{distributor.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="node-details-panel">
        {renderNodeDetails(selectedNode)}
      </div>

      <div className="ai-recommendations-section">
        <div className="card">
          {renderAIRecommendations()}
        </div>
      </div>
      
      {renderCreateSupplyChainModal()}
    </div>
  );
};

export default SupplyChain; 