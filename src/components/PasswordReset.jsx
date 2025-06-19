import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './PasswordReset.css';

const PasswordReset = ({ onBack }) => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await sendPasswordReset(email);
      setMessage(result.message);
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      
      // Firebase エラーメッセージの日本語化
      let errorMessage = 'パスワードリセットメールの送信に失敗しました';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'このメールアドレスのユーザーが見つかりません';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '有効なメールアドレスを入力してください';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'リクエスト数が上限に達しました。しばらくお待ちください';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-reset-container">
      <div className="password-reset-card">
        <div className="password-reset-header">
          <button 
            onClick={onBack}
            className="back-button"
            aria-label="戻る"
          >
            ← 戻る
          </button>
          <h1 className="password-reset-title">パスワードリセット</h1>
          <p className="password-reset-subtitle">
            登録済みのメールアドレスにパスワードリセット用のリンクを送信します
          </p>
        </div>

        <form onSubmit={handleSubmit} className="password-reset-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {message}
              <div className="success-details">
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                送信中...
              </>
            ) : (
              'リセットメールを送信'
            )}
          </button>
        </form>

        <div className="password-reset-footer">
          <p className="help-text">
            アカウントをお持ちでない場合は、<br/>
            新規登録からアカウントを作成してください。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;