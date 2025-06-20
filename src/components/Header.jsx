import React, { useState } from "react";
import { useAuth } from "../contexts/SupabaseAuthContext.jsx";
import { useSimpleErrorHandler } from "./ErrorHandler.jsx";
import { getErrorMessage } from "../utils/errorMessages.js";
import "./Header.css";

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { showError, withErrorHandling } = useSimpleErrorHandler();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await withErrorHandling(async () => {
      console.log('ログアウト処理開始...');
      await logout();
      console.log('ログアウト処理完了');
    }, 'ログアウト');
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
                {(currentUser.user_metadata?.avatar_url || currentUser.photoURL) ? (
                  <img 
                    src={currentUser.user_metadata?.avatar_url || currentUser.photoURL} 
                    alt={currentUser.user_metadata?.full_name || currentUser.displayName || 'ユーザー'}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {(currentUser.user_metadata?.full_name || currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {currentUser.user_metadata?.full_name || currentUser.displayName || currentUser.email}
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
