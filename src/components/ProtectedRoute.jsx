import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  return currentUser ? children : <Login />;
};

export default ProtectedRoute;