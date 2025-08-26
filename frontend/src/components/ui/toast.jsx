import React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useToast } from "../../hooks/useToast";

// Toast Container
export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Individual Toast Item
const ToastItem = ({ toast, onRemove }) => {
  const { type, message, title } = toast;

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          title: "text-green-800",
          message: "text-green-700",
        };
      case "error":
        return {
          bg: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200",
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          title: "text-red-800",
          message: "text-red-700",
        };
      case "warning":
        return {
          bg: "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200",
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          title: "text-yellow-800",
          message: "text-yellow-700",
        };
      case "info":
      default:
        return {
          bg: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
          icon: <Info className="h-5 w-5 text-blue-600" />,
          title: "text-blue-800",
          message: "text-blue-700",
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`${styles.bg} border rounded-lg shadow-lg p-4 min-w-80 animate-in slide-in-from-right duration-300`}
    >
      <div className="flex items-start space-x-3">
        {styles.icon}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-medium ${styles.title} mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${styles.message}`}>{message}</p>
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/50 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default ToastContainer;
