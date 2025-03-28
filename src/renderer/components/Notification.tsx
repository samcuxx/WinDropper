import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationProps {
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  onClose,
  duration = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration]);

  const handleAnimationComplete = () => {
    if (!isVisible) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onAnimationComplete={handleAnimationComplete}
          className="windropper-notch p-4 w-72 max-w-xs shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {message}
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
              aria-label="Close notification"
              title="Close notification"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
