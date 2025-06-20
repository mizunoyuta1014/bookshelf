import React, { createContext, useContext, useState, useCallback } from 'react';
import './ErrorHandler.css';

// エラータイプの定義
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation', 
  AUTH: 'auth',
  SERVER: 'server',
  UNKNOWN: 'unknown'
};

// エラーコンテキスト
const ErrorContext = createContext();

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within ErrorProvider');
  }
  return context;
};

// エラープロバイダー
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  const addError = useCallback((error, options = {}) => {
    const errorId = Date.now() + Math.random();
    const errorInfo = {
      id: errorId,
      message: getErrorMessage(error),
      type: getErrorType(error),
      timestamp: new Date(),
      context: options.context || '',
      retry: options.retry || null,
      ...options
    };

    setErrors(prev => [...prev, errorInfo]);

    // 自動削除（デフォルト5秒）
    const timeout = options.timeout !== undefined ? options.timeout : 5000;
    if (timeout > 0) {
      setTimeout(() => {
        removeError(errorId);
      }, timeout);
    }

    return errorId;
  }, []);

  const removeError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleAsync = useCallback(async (asyncFn, options = {}) => {
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      console.error(options.context || 'エラー:', error);
      addError(error, {
        context: options.context,
        retry: options.retry,
        timeout: options.timeout
      });
      if (!options.silent) {
        throw error;
      }
    }
  }, [addError]);

  return (
    <ErrorContext.Provider value={{
      errors,
      addError,
      removeError,
      clearAllErrors,
      handleAsync
    }}>
      {children}
      <ErrorDisplay />
    </ErrorContext.Provider>
  );
};

// エラーメッセージ取得
const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  return 'エラーが発生しました';
};

// エラータイプ判定
const getErrorType = (error) => {
  if (typeof error === 'string') return ERROR_TYPES.UNKNOWN;
  
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || '';
  
  if (message.includes('network') || message.includes('fetch') || code === 'NETWORK_ERROR') {
    return ERROR_TYPES.NETWORK;
  }
  if (message.includes('auth') || code.startsWith('auth/')) {
    return ERROR_TYPES.AUTH;
  }
  if (message.includes('validation') || code === 'VALIDATION_ERROR') {
    return ERROR_TYPES.VALIDATION;
  }
  if (error?.status >= 500 || code === 'SERVER_ERROR') {
    return ERROR_TYPES.SERVER;
  }
  
  return ERROR_TYPES.UNKNOWN;
};

// エラー表示コンポーネント
const ErrorDisplay = () => {
  const { errors, removeError } = useErrorHandler();

  if (errors.length === 0) return null;

  return (
    <div className="error-container">
      {errors.map(error => (
        <ErrorToast key={error.id} error={error} onClose={removeError} />
      ))}
    </div>
  );
};

// エラートーストコンポーネント
const ErrorToast = ({ error, onClose }) => {
  const handleClose = () => {
    onClose(error.id);
  };

  const handleRetry = () => {
    if (error.retry) {
      error.retry();
      handleClose();
    }
  };

  return (
    <div className={`error-toast error-toast--${error.type}`}>
      <div className="error-toast__content">
        <div className="error-toast__icon">
          {getErrorIcon(error.type)}
        </div>
        <div className="error-toast__message">
          <div className="error-toast__text">{error.message}</div>
          {error.context && (
            <div className="error-toast__context">{error.context}</div>
          )}
        </div>
        <div className="error-toast__actions">
          {error.retry && (
            <button 
              className="error-toast__retry"
              onClick={handleRetry}
              title="再試行"
            >
              ↻
            </button>
          )}
          <button 
            className="error-toast__close"
            onClick={handleClose}
            title="閉じる"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

// エラーアイコン取得
const getErrorIcon = (type) => {
  switch (type) {
    case ERROR_TYPES.NETWORK:
      return '🌐';
    case ERROR_TYPES.AUTH:
      return '🔒';
    case ERROR_TYPES.VALIDATION:
      return '⚠️';
    case ERROR_TYPES.SERVER:
      return '🖥️';
    default:
      return '❌';
  }
};

// カスタムフック：簡単なエラーハンドリング
export const useSimpleErrorHandler = () => {
  const { addError, handleAsync } = useErrorHandler();
  
  const showError = useCallback((message, options = {}) => {
    addError(message, options);
  }, [addError]);

  const withErrorHandling = useCallback((asyncFn, context) => {
    return handleAsync(asyncFn, { context });
  }, [handleAsync]);

  return { showError, withErrorHandling };
};