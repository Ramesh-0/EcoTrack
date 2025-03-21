import React, { useState, useEffect } from 'react';

const CarbonTracker = () => {
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({
    type: 'electricity',
    description: '',
    amount: '',
    unit: 'kWh',
    date: new Date().toISOString().split('T')[0],
    category: 'scope2'
  });
  const [stats, setStats] = useState({
    totalEmissions: 0,
    scope1: 0,
    scope2: 0,
    scope3: 0,
    lastMonth: 0,
    thisMonth: 0,
    trend: 0
  });
  const [filter, setFilter] = useState('all');
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Mock emission factors (in kg CO2e per unit)
  const emissionFactors = {
    electricity: { factor: 0.42, units: ['kWh'] },
    naturalGas: { factor: 0.2, units: ['therm', 'm³'] },
    fuel: { factor: 2.32, units: ['liter', 'gallon'] },
    waste: { factor: 0.56, units: ['kg'] },
    water: { factor: 0.001, units: ['liter', 'gallon'] },
    transportation: { factor: 0.16, units: ['km', 'mile'] },
    materials: { factor: 3.2, units: ['kg'] },
    refrigerants: { factor: 1800, units: ['kg'] },
    flights: { factor: 0.25, units: ['km', 'mile'] },
    shipping: { factor: 0.08, units: ['kg'] }
  };

  // Sample data for initial state
  const sampleActivities = [
    {
      id: 1,
      type: 'electricity',
      description: 'Office Electricity',
      amount: 1200,
      unit: 'kWh',
      date: '2023-10-05',
      category: 'scope2',
      emissions: 504 // 1200 * 0.42
    },
    {
      id: 2,
      type: 'fuel',
      description: 'Company Vehicles',
      amount: 250,
      unit: 'liter',
      date: '2023-10-10',
      category: 'scope1',
      emissions: 580 // 250 * 2.32
    },
    {
      id: 3,
      type: 'flights',
      description: 'Business Travel',
      amount: 3200,
      unit: 'km',
      date: '2023-10-15',
      category: 'scope3',
      emissions: 800 // 3200 * 0.25
    },
    {
      id: 4,
      type: 'waste',
      description: 'Office Waste',
      amount: 120,
      unit: 'kg',
      date: '2023-10-20',
      category: 'scope3',
      emissions: 67.2 // 120 * 0.56
    }
  ];

  useEffect(() => {
    // Load sample activities
    setActivities(sampleActivities);
  }, []);

  useEffect(() => {
    // Calculate statistics when activities change
    calculateStats();
  }, [activities]);

  const calculateStats = () => {
    const totalEmissions = activities.reduce((sum, activity) => sum + activity.emissions, 0);
    
    const scope1 = activities
      .filter(activity => activity.category === 'scope1')
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    const scope2 = activities
      .filter(activity => activity.category === 'scope2')
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    const scope3 = activities
      .filter(activity => activity.category === 'scope3')
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    // Calculate this month's emissions
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    const thisMonthEmissions = activities
      .filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate.getMonth() === thisMonth && activityDate.getFullYear() === thisYear;
      })
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    // Calculate last month's emissions
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();
    
    const lastMonthEmissions = activities
      .filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate.getMonth() === lastMonth && activityDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    // Calculate trend (% change)
    const trend = lastMonthEmissions > 0 
      ? ((thisMonthEmissions - lastMonthEmissions) / lastMonthEmissions) * 100 
      : 0;
    
    setStats({
      totalEmissions,
      scope1,
      scope2,
      scope3,
      lastMonth: lastMonthEmissions,
      thisMonth: thisMonthEmissions,
      trend
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewActivity({
      ...newActivity,
      [name]: value
    });

    // Update unit options when type changes
    if (name === 'type') {
      setNewActivity({
        ...newActivity,
        type: value,
        unit: emissionFactors[value].units[0]
      });
    }
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    
    // Calculate emissions
    const factor = emissionFactors[newActivity.type].factor;
    const emissions = parseFloat(newActivity.amount) * factor;
    
    const activity = {
      id: activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1,
      ...newActivity,
      amount: parseFloat(newActivity.amount),
      emissions: emissions
    };
    
    setActivities([...activities, activity]);
    
    // Reset form
    setNewActivity({
      type: 'electricity',
      description: '',
      amount: '',
      unit: 'kWh',
      date: new Date().toISOString().split('T')[0],
      category: 'scope2'
    });
    
    setIsAddingActivity(false);
  };

  const handleDeleteActivity = (id) => {
    setActivities(activities.filter(activity => activity.id !== id));
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(activity => activity.category === filter);

  return (
    <div className="carbon-tracker-container">
      <div className="page-header">
        <h2 className="page-title">Carbon Emissions Tracker</h2>
        <button 
          className="add-activity-btn"
          onClick={() => setIsAddingActivity(true)}
        >
          <i className="fas fa-plus"></i> Add Activity
        </button>
      </div>

      <div className="tracker-metrics-row">
        <div className="metric-card">
          <h3>Total Carbon Footprint</h3>
          <div className="metric-value">{stats.totalEmissions.toFixed(2)} kg CO2e</div>
          <div className={`metric-trend ${stats.trend >= 0 ? 'negative' : 'positive'}`}>
            <i className={`fas fa-arrow-${stats.trend >= 0 ? 'up' : 'down'}`}></i>
            <span>{Math.abs(stats.trend).toFixed(1)}% from last month</span>
          </div>
        </div>

        <div className="metric-card">
          <h3>Scope 1 Emissions</h3>
          <div className="metric-value">{stats.scope1.toFixed(2)} kg CO2e</div>
          <div className="metric-info">Direct emissions from owned sources</div>
        </div>

        <div className="metric-card">
          <h3>Scope 2 Emissions</h3>
          <div className="metric-value">{stats.scope2.toFixed(2)} kg CO2e</div>
          <div className="metric-info">Indirect emissions from purchased energy</div>
        </div>

        <div className="metric-card">
          <h3>Scope 3 Emissions</h3>
          <div className="metric-value">{stats.scope3.toFixed(2)} kg CO2e</div>
          <div className="metric-info">All other indirect emissions in value chain</div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="activities-header">
          <h2>Carbon Activities</h2>
          <div className="filter-controls">
            <span>Filter by: </span>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${filter === 'scope1' ? 'active' : ''}`}
                onClick={() => setFilter('scope1')}
              >
                Scope 1
              </button>
              <button 
                className={`filter-btn ${filter === 'scope2' ? 'active' : ''}`}
                onClick={() => setFilter('scope2')}
              >
                Scope 2
              </button>
              <button 
                className={`filter-btn ${filter === 'scope3' ? 'active' : ''}`}
                onClick={() => setFilter('scope3')}
              >
                Scope 3
              </button>
            </div>
          </div>
        </div>

        <div className="activities-list">
          {filteredActivities.length === 0 ? (
            <div className="no-activities">
              <i className="fas fa-leaf"></i>
              <p>No carbon activities found. Add your first activity to start tracking.</p>
            </div>
          ) : (
            filteredActivities.map(activity => (
              <div key={activity.id} className="activity-card">
                <div className="activity-icon">
                  <i className={getActivityIcon(activity.type)}></i>
                </div>
                <div className="activity-details">
                  <h3>{activity.description}</h3>
                  <div className="activity-info">
                    <span className="activity-type">{formatActivityType(activity.type)}</span>
                    <span className="activity-date">{formatDate(activity.date)}</span>
                    <span className={`activity-category ${activity.category}`}>
                      {activity.category.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="activity-amount">
                  <div className="amount-value">{activity.amount} {activity.unit}</div>
                  <div className="emissions-value">{activity.emissions.toFixed(2)} kg CO2e</div>
                </div>
                <button 
                  className="delete-activity-btn"
                  onClick={() => handleDeleteActivity(activity.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {isAddingActivity && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Carbon Activity</h3>
              <button 
                className="close-btn" 
                onClick={() => setIsAddingActivity(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddActivity}>
              <div className="form-group">
                <label>Activity Type</label>
                <select 
                  name="type"
                  value={newActivity.type}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="electricity">Electricity</option>
                  <option value="naturalGas">Natural Gas</option>
                  <option value="fuel">Fuel</option>
                  <option value="waste">Waste</option>
                  <option value="water">Water</option>
                  <option value="transportation">Transportation</option>
                  <option value="materials">Materials</option>
                  <option value="refrigerants">Refrigerants</option>
                  <option value="flights">Flights</option>
                  <option value="shipping">Shipping</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  name="description"
                  value={newActivity.description}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="E.g., Office Electricity, Business Travel"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input 
                    type="number" 
                    name="amount"
                    value={newActivity.amount}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Amount consumed"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Unit</label>
                  <select 
                    name="unit"
                    value={newActivity.unit}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    {emissionFactors[newActivity.type].units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  name="date"
                  value={newActivity.date}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Emissions Category</label>
                <select 
                  name="category"
                  value={newActivity.category}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="scope1">Scope 1 (Direct emissions)</option>
                  <option value="scope2">Scope 2 (Indirect energy emissions)</option>
                  <option value="scope3">Scope 3 (Value chain emissions)</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsAddingActivity(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                >
                  <i className="fas fa-plus"></i> Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getActivityIcon = (type) => {
  const iconMap = {
    electricity: 'fas fa-bolt',
    naturalGas: 'fas fa-fire',
    fuel: 'fas fa-gas-pump',
    waste: 'fas fa-trash',
    water: 'fas fa-tint',
    transportation: 'fas fa-car',
    materials: 'fas fa-box',
    refrigerants: 'fas fa-snowflake',
    flights: 'fas fa-plane',
    shipping: 'fas fa-shipping-fast'
  };
  
  return iconMap[type] || 'fas fa-leaf';
};

const formatActivityType = (type) => {
  const formatMap = {
    electricity: 'Electricity',
    naturalGas: 'Natural Gas',
    fuel: 'Fuel',
    waste: 'Waste',
    water: 'Water',
    transportation: 'Transportation',
    materials: 'Materials',
    refrigerants: 'Refrigerants',
    flights: 'Flights',
    shipping: 'Shipping'
  };
  
  return formatMap[type] || type;
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default CarbonTracker; 