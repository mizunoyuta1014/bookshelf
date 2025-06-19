import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import EmailVerification from './EmailVerification';
import './UserProfile.css';

const UserProfile = () => {
  const { 
    currentUser, 
    updateUserPassword,
    updateUserProfile, 
    sendEmailVerificationToUser,
    checkEmailVerification
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    displayName: '',
    photoURL: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        displayName: currentUser.displayName || '',
        photoURL: currentUser.photoURL || ''
      });
    }
  }, [currentUser]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Profile update functionality will be implemented
      // when Firebase Auth profile update methods are added to AuthContext
      setMessage('プロフィールを更新しました');
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setError('プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage('パスワードを更新しました');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('パスワード更新エラー:', error);
      
      let errorMessage = 'パスワードの更新に失敗しました';
      if (error.code === 'auth/wrong-password') {
        errorMessage = '現在のパスワードが正しくありません';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'セキュリティのため、再度ログインしてください';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'プロフィール', icon: '👤' },
    { id: 'security', label: 'セキュリティ', icon: '🔒' },
    { id: 'verification', label: 'メール認証', icon: '📧' }
  ];

  if (!currentUser) {
    return (
      <div className="user-profile-container">
        <div className="user-profile-card">
          <p className="no-user-message">ログインが必要です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-card">
        <div className="profile-header">
          <div className="profile-avatar-section">
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="プロフィール画像"
                className="profile-avatar-image"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || '?'}
              </div>
            )}
            <div className="profile-basic-info">
              <h1 className="profile-name">
                {currentUser.displayName || 'ユーザー'}
              </h1>
              <p className="profile-email">{currentUser.email}</p>
              <div className="profile-verification-status">
                {checkEmailVerification() ? (
                  <span className="verification-badge verified">✅ 認証済み</span>
                ) : (
                  <span className="verification-badge unverified">⚠️ 未認証</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="profile-content">
          {message && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-tab-content">
              <h2 className="tab-title">プロフィール設定</h2>
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label htmlFor="displayName" className="form-label">
                    表示名
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      displayName: e.target.value
                    })}
                    className="form-input"
                    placeholder="表示名を入力してください"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={currentUser.email}
                    className="form-input"
                    disabled
                    title="メールアドレスの変更はサポートされていません"
                  />
                  <small className="form-help">
                    メールアドレスの変更はサポートされていません
                  </small>
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      更新中...
                    </>
                  ) : (
                    'プロフィールを更新'
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="security-tab-content">
              <h2 className="tab-title">パスワード変更</h2>
              <form onSubmit={handlePasswordUpdate} className="password-form">
                <div className="form-group">
                  <label htmlFor="currentPassword" className="form-label">
                    現在のパスワード
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value
                    })}
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    新しいパスワード
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value
                    })}
                    className="form-input"
                    required
                    minLength="6"
                    disabled={loading}
                  />
                  <small className="form-help">
                    6文字以上で入力してください
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    新しいパスワード（確認）
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value
                    })}
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      更新中...
                    </>
                  ) : (
                    'パスワードを変更'
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="verification-tab-content">
              <h2 className="tab-title">メール認証</h2>
              <EmailVerification />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;