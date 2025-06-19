import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import './EmailVerification.css';

const EmailVerification = () => {
  const { currentUser, sendEmailVerificationToUser, checkEmailVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // 初回チェック
    if (currentUser) {
      setIsVerified(checkEmailVerification());
    }
  }, [currentUser, checkEmailVerification]);

  const handleSendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await sendEmailVerificationToUser();
      setMessage(result.message);
    } catch (error) {
      console.error('メール認証送信エラー:', error);
      
      let errorMessage = 'メール認証の送信に失敗しました';
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'リクエスト数が上限に達しました。しばらくお待ちください';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'ユーザーが見つかりません';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = () => {
    // ユーザーを再読み込みして認証状態をチェック
    if (currentUser) {
      currentUser.reload().then(() => {
        setIsVerified(checkEmailVerification());
      });
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="email-verification-container">
      <div className="email-verification-card">
        {isVerified ? (
          // 認証済みの場合
          <div className="verification-success">
            <div className="success-icon">✅</div>
            <h2 className="verification-title">メール認証完了</h2>
            <p className="verification-message">
              メールアドレス「{currentUser.email}」の認証が完了しています。
            </p>
            <button 
              onClick={handleRefreshStatus}
              className="refresh-button"
            >
              状態を更新
            </button>
          </div>
        ) : (
          // 未認証の場合
          <div className="verification-pending">
            <div className="warning-icon">📧</div>
            <h2 className="verification-title">メール認証が必要です</h2>
            <p className="verification-message">
              アカウントの安全性を確保するため、メールアドレス「{currentUser.email}」の認証を行ってください。
            </p>

            <div className="verification-steps">
              <h3>認証手順</h3>
              <ol>
                <li>下のボタンをクリックして認証メールを送信</li>
                <li>送信されたメール内のリンクをクリック</li>
                <li>このページに戻って「状態を更新」をクリック</li>
              </ol>
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
                <div className="message-details">
                  メールが届かない場合は、迷惑メールフォルダをご確認ください。
                </div>
              </div>
            )}

            <div className="verification-actions">
              <button 
                onClick={handleSendVerification}
                className="send-verification-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    送信中...
                  </>
                ) : (
                  '認証メールを送信'
                )}
              </button>

              <button 
                onClick={handleRefreshStatus}
                className="refresh-button"
              >
                状態を更新
              </button>
            </div>
          </div>
        )}

        <div className="verification-footer">
          <p className="help-text">
            メールアドレスを変更したい場合は、プロフィール設定から変更できます。
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;