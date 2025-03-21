import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileMenu.css';

const ProfileMenu = ({ isOpen, onClose, user }) => {
  const menuRef = useRef(null);
  const [avatar, setAvatar] = useState('https://via.placeholder.com/100');
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        // Here you would typically upload the image to your server
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    // Remove user data and token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Close the menu
    onClose();
    // Redirect to login page
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="profile-menu-overlay">
      <div className="profile-menu" ref={menuRef}>
        <div className="profile-header">
          <div className="avatar-container">
            <img src={avatar} alt="Profile" className="avatar" />
            <label className="avatar-upload">
              <i className="fas fa-camera"></i>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <h3>{user.username || 'User'}</h3>
          <p>{user.email || 'No email provided'}</p>
          {user.company_name && <p className="company-name">{user.company_name}</p>}
        </div>
        
        <div className="profile-menu-items">
          <div className="menu-item">
            <i className="fas fa-user"></i>
            <span>Personal Details</span>
          </div>
          <div className="menu-item">
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </div>
          <div className="menu-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileMenu; 