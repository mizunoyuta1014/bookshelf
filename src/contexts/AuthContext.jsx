import React, { createContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, provider } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false
      });
      return { success: true, message: 'パスワードリセットメールを送信しました' };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const sendEmailVerificationToUser = async () => {
    try {
      setError(null);
      if (!currentUser) {
        throw new Error('ユーザーがログインしていません');
      }
      await sendEmailVerification(currentUser, {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: false
      });
      return { success: true, message: '確認メールを送信しました' };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      if (!currentUser) {
        throw new Error('ユーザーがログインしていません');
      }

      // 再認証が必要
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // パスワード更新
      await updatePassword(currentUser, newPassword);
      return { success: true, message: 'パスワードを更新しました' };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      setError(null);
      if (!currentUser) {
        throw new Error('ユーザーがログインしていません');
      }
      
      await updateProfile(currentUser, profileData);
      return { success: true, message: 'プロフィールを更新しました' };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const checkEmailVerification = () => {
    return currentUser?.emailVerified || false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    signInWithGoogle,
    logout,
    sendPasswordReset,
    sendEmailVerificationToUser,
    updateUserPassword,
    updateUserProfile,
    checkEmailVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthContext };