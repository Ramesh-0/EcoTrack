// components/EmissionsChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function EmissionsChart({ monthlyData }) {
  // If no data is provided, show empty state
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="card emissions-chart" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No emissions data available</p>
      </div>
    );
  }

  return (
    <div className="card emissions-chart">
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color scope1"></div>
          <div className="legend-label">Monthly Emissions</div>
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'tCO₂e', angle: -90, position: 'insideLeft', offset: 0 }} />
            <Tooltip />
            <Bar dataKey="emissions" fill="#3b82f6" name="Monthly Emissions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default EmissionsChart;
