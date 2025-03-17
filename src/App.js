import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import SupplyChain from './components/SupplyChain';
import Suppliers from './components/Suppliers';
import Emissions from './components/Emissions';
import Sidebar from './components/Sidebar';
import './App.css';

const { Content } = Layout;

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout style={{ minHeight: '100vh' }}>
                  <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
                  <Layout className={`site-layout ${collapsed ? 'collapsed' : ''}`}>
                    <Content>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/supply-chain" element={<SupplyChain />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/emissions" element={<Emissions />} />
                      </Routes>
                    </Content>
                  </Layout>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
