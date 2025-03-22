// components/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: 'fas fa-chart-line', label: 'Dashboard' },
    { path: '/analytics', icon: 'fas fa-chart-bar', label: 'Analytics' },
    { path: '/emissions', icon: 'fas fa-cloud', label: 'Emission Calculator' },
    { path: '/emissions-calculator', icon: 'fas fa-calculator', label: 'Advanced Calculator' },
    { path: '/carbon-tracker', icon: 'fas fa-leaf', label: 'Carbon Tracker' },
    { path: '/supply-chain', icon: 'fas fa-truck', label: 'Supply Chain' },
    { path: '/esg-reports', icon: 'fas fa-file-alt', label: 'Emission Reports' }
  ];

  return (
    <nav className="sidebar">
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;