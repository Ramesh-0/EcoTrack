import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import SupplyChain from './components/SupplyChain';
import ESGReports from './components/ESGReports';
import CarbonTracker from './components/CarbonTracker';
import SupplyChainEmissionsDetail from './components/SupplyChainEmissionsDetail';
import Emissions from './components/Emissions';
import EmissionsCalculator from './components/EmissionsCalculator';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                  <Dashboard />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                  <Dashboard />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                  <Analytics />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/supply-chain" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                  <SupplyChain />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/esg-reports" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                  <ESGReports />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/carbon-tracker" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                  <CarbonTracker />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/supply-chain-emissions" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                  <SupplyChainEmissionsDetail />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/emissions" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                  <Emissions />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/emissions-calculator" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                  <EmissionsCalculator />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
