import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "danger",
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          bg: "bg-gradient-to-br from-red-50 to-rose-50",
          border: "border-red-200",
          icon: "text-red-600",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          title: "text-red-800",
        };
      case "warning":
        return {
          bg: "bg-gradient-to-br from-yellow-50 to-amber-50",
          border: "border-yellow-200",
          icon: "text-yellow-600",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
          title: "text-yellow-800",
        };
      default:
        return {
          bg: "bg-gradient-to-br from-gray-50 to-slate-50",
          border: "border-gray-200",
          icon: "text-gray-600",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
          title: "text-gray-800",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative ${styles.bg} ${styles.border} border rounded-xl shadow-xl p-6 mx-4 max-w-md w-full animate-in fade-in zoom-in duration-200`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/50 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 p-2 rounded-full bg-white/50`}>
            <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
          </div>

          <div className="flex-1 pt-1">
            <h3 className={`text-lg font-medium ${styles.title} mb-2`}>
              {title || "Confirm Action"}
            </h3>
            <p className="text-gray-700 mb-6">{message}</p>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                className={`w-full sm:w-auto ${styles.confirmButton}`}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
