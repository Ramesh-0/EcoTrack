import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Header({ toggleSidebar }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if the user is logged in (via token or session)
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // Decode the token to get the username or other info (e.g., from JWT payload)
      const decoded = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      setUserName(decoded.sub); // Assuming 'sub' is the username
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token
    setIsLoggedIn(false);
    setUserName('');
  };

  return (
    <header className="header">
      <button className="menu-button" onClick={toggleSidebar}>
        <span className="menu-icon">☰</span>
      </button>
      <div className="app-title">AI Carbon Footprint Tracker</div>

      <div className="auth-section">
        {isLoggedIn ? (
          <>
            <span className="welcome-message">Welcome, {userName}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-link">Login</Link>
            <Link to="/signup" className="signup-link">Signup</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
