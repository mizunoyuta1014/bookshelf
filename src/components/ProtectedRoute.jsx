import React, { useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext.jsx';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, session } = useAuth();

  useEffect(() => {
    console.log('ProtectedRoute 認証状態確認:', {
      currentUser: currentUser ? 'ログイン中' : '未ログイン',
      userId: currentUser?.id,
      email: currentUser?.email,
      loading,
      session: session ? 'セッション有り' : 'セッション無し'
    });
  }, [currentUser, loading, session]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  console.log('ProtectedRoute 最終判定:', currentUser ? 'アプリ表示' : 'ログイン画面表示');
  return currentUser ? children : <Login />;
};

export default ProtectedRoute;