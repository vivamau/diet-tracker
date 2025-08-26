import React, { createContext, useState, useCallback } from "react";

// Toast Context
export const ToastContext = createContext();

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove toast after specified duration or default 5 seconds
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: useCallback(
      (message, options = {}) =>
        addToast({ type: "success", message, ...options }),
      [addToast]
    ),
    error: useCallback(
      (message, options = {}) =>
        addToast({ type: "error", message, ...options }),
      [addToast]
    ),
    warning: useCallback(
      (message, options = {}) =>
        addToast({ type: "warning", message, ...options }),
      [addToast]
    ),
    info: useCallback(
      (message, options = {}) =>
        addToast({ type: "info", message, ...options }),
      [addToast]
    ),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};
