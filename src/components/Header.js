import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';

const Header = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
          <span>John Doe</span>
        </div>
      </div>
      <ProfileMenu 
        isOpen={isProfileMenuOpen} 
        onClose={() => setIsProfileMenuOpen(false)} 
      />
    </header>
  );
};

export default Header;
