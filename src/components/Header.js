import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';

const Header = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [user, setUser] = useState({ username: 'Guest' });

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  return (
    <header className="header">
      <Link to="/" className="app-title">
        ECO TRACK
      </Link>
      <div className="header-right">
        <div 
          className="user-info"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        >
          <i className="fas fa-user-circle"></i>
          <span>{user.username || user.email || 'Guest'}</span>
        </div>
      </div>
      <ProfileMenu 
        isOpen={isProfileMenuOpen} 
        onClose={() => setIsProfileMenuOpen(false)}
        user={user}
      />
    </header>
  );
};

export default Header;
