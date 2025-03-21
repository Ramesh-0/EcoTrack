import React, { useState, useRef, useEffect } from 'react';

const ProfileMenu = ({ isOpen, onClose }) => {
  const menuRef = useRef(null);
  const [avatar, setAvatar] = useState('https://via.placeholder.com/100');

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
    // Add your logout logic here
    onClose();
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
          <h3>John Doe</h3>
          <p>john.doe@example.com</p>
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