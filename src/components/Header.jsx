import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./Header.css";

const Header = () => {
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <header className="modern-header">
      <div className="header-container">
        <div className="header-brand">
          <h1 className="brand-title">📚 Bookshelf</h1>
        </div>
        
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="メニューを開く"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}></span>
        </button>

        <nav className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {currentUser && (
            <div className="user-profile">
              <div className="user-avatar">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'ユーザー'}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button className="logout-btn" onClick={handleLogout}>
                  <span className="logout-icon">🚪</span>
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
