import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import SupplyChain from './components/SupplyChain';
import ESGReports from './components/ESGReports';
import CarbonTracker from './components/CarbonTracker';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <div className="content-wrapper">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/supply-chain" element={<SupplyChain />} />
              <Route path="/esg-reports" element={<ESGReports />} />
              <Route path="/carbon-tracker" element={<CarbonTracker />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
