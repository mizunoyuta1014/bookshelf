import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 現在のセッション取得
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setCurrentUser(session?.user || null);
      } catch (error) {
        console.error('セッション取得エラー:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // セッション変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth状態変更:', event, session?.user?.email);
        
        setSession(session);
        setCurrentUser(session?.user || null);
        setLoading(false);

        // ユーザー登録時にusersテーブルにも登録
        if (event === 'SIGNED_IN' && session?.user) {
          await ensureUserExists(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ユーザーの存在確認・作成（最適化版）
  const ensureUserExists = async (user) => {
    try {
      console.log('ユーザー確認開始:', user.id, user.email);
      
      // 短時間での重複リクエストを防ぐ
      const cacheKey = `user_creation_${user.id}`;
      if (window[cacheKey]) {
        console.log('ユーザー作成処理中 - スキップ');
        return;
      }
      window[cacheKey] = true;
      
      try {
        // RPC関数を使用してユーザー作成（RLS制限を回避）
        const { data, error } = await supabase.rpc('ensure_user_exists', {
          user_id: user.id,
          user_email: user.email,
          user_display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          user_avatar_url: user.user_metadata?.avatar_url
        });

        if (error) {
          console.error('ユーザー確認RPC エラー:', error);
          throw error;
        }
        
        // RPC関数の結果を確認
        if (data?.success) {
          console.log('ユーザー確認完了:', data.message || 'ユーザー確認成功', user.email);
          if (data.created) {
            console.log('新規ユーザーを作成しました:', user.email);
          }
        } else {
          const errorMessage = data?.message || 'RPC関数からの応答が不正です';
          console.error('ユーザー確認失敗:', errorMessage);
          throw new Error(errorMessage);
        }
        
      } catch (rpcError) {
        console.warn('RPC関数でエラー発生、従来の方法にフォールバック:', rpcError);
        
        // RPC関数が利用できない場合の従来の方法
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('ユーザー存在確認エラー:', fetchError);
          throw fetchError;
        }

        if (!existingUser) {
          // ユーザーが存在しない場合は作成
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url
            }])
            .select();

          if (insertError) {
            // 重複エラーの場合は無視（競合状態での同時作成）
            if (insertError.code === '23505') {
              console.log('ユーザーは既に存在します（競合状態）:', user.email);
            } else {
              console.error('ユーザー作成エラー:', insertError);
              throw insertError;
            }
          } else {
            console.log('新規ユーザーを作成しました:', user.email);
          }
        } else {
          console.log('ユーザーは既に存在します:', user.email);
        }
      }
      
    } catch (error) {
      console.error('ユーザー確認エラー:', error);
      // エラーが発生してもアプリケーションの動作は継続
    } finally {
      // キャッシュをクリア
      setTimeout(() => {
        delete window[`user_creation_${user.id}`];
      }, 5000);
    }
  };

  // Google認証でログイン
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Google認証エラー:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);

      console.log('ログアウト開始: セッションクリア中...');
      
      // まずローカル状態を即座にクリア（UI応答性向上）
      setCurrentUser(null);
      setSession(null);

      // ローカルストレージを完全にクリア
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // IndexedDBも可能な限りクリア
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            databases.forEach(db => {
              if (db.name && db.name.includes('supabase')) {
                indexedDB.deleteDatabase(db.name);
              }
            });
          } catch (idbError) {
            console.warn('IndexedDBクリア警告:', idbError);
          }
        }
      } catch (storageError) {
        console.warn('ストレージクリア警告:', storageError);
      }

      // Supabaseからサインアウト（バックグラウンドで実行）
      try {
        const { error } = await Promise.race([
          supabase.auth.signOut({ scope: 'global' }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
        ]);
        
        if (error) {
          console.warn('Supabaseサインアウト警告:', error);
        } else {
          console.log('Supabaseサインアウト成功');
        }
      } catch (signOutError) {
        console.warn('Supabaseサインアウトタイムアウトまたはエラー:', signOutError);
        // エラーが発生してもログアウトは継続
      }

      console.log('ログアウト完了: 認証状態をクリアしました');
      
      // ページリロードして確実に状態をリセット
      window.location.reload();

    } catch (error) {
      console.error('ログアウトエラー:', error);
      
      // エラーが発生しても強制的にローカル状態をクリア
      setCurrentUser(null);
      setSession(null);
      localStorage.clear();
      sessionStorage.clear();
      
      // エラーが発生してもページリロード
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセット
  const sendPasswordReset = async (email) => {
    try {
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      setError(error.message);
      throw error;
    }
  };

  // メール認証送信
  const sendEmailVerification = async () => {
    try {
      setError(null);

      if (!currentUser) {
        throw new Error('ログインしていません');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('メール認証送信エラー:', error);
      setError(error.message);
      throw error;
    }
  };

  // パスワード更新
  const updateUserPassword = async (newPassword) => {
    try {
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('パスワード更新エラー:', error);
      setError(error.message);
      throw error;
    }
  };

  // プロフィール更新
  const updateUserProfile = async (updates) => {
    try {
      setError(null);

      if (!currentUser) {
        throw new Error('ログインしていません');
      }

      // Supabase Authのプロフィール更新
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.displayName,
          avatar_url: updates.avatarUrl
        }
      });

      if (authError) throw authError;

      // usersテーブルの更新
      const { error: dbError } = await supabase
        .from('users')
        .update({
          display_name: updates.displayName,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (dbError) throw dbError;

      return { success: true };
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setError(error.message);
      throw error;
    }
  };

  // 再認証（パスワード変更前など）
  const reauthenticate = async (email, password) => {
    try {
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('再認証エラー:', error);
      setError(error.message);
      throw error;
    }
  };

  // アカウント削除
  const deleteAccount = async () => {
    try {
      setError(null);

      if (!currentUser) {
        throw new Error('ログインしていません');
      }

      // まずusersテーブルから削除（カスケードで関連データも削除される）
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', currentUser.id);

      if (dbError) throw dbError;

      // Supabase Authからも削除
      const { error: authError } = await supabase.auth.admin.deleteUser(currentUser.id);
      
      if (authError) {
        console.warn('Auth削除警告:', authError);
        // Auth削除に失敗してもDBは削除されているので、ログアウトする
      }

      // ログアウト
      await logout();
      
      return { success: true };
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      setError(error.message);
      throw error;
    }
  };

  // エラークリア
  const clearError = () => {
    setError(null);
  };

  const value = {
    currentUser,
    session,
    loading,
    error,
    signInWithGoogle,
    logout,
    sendPasswordReset,
    sendEmailVerification,
    updateUserPassword,
    updateUserProfile,
    reauthenticate,
    deleteAccount,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};