import React, { useEffect, useState } from "react";
import { Notch } from "./components/Notch";
import { Settings } from "./components/Settings";
import { Notification } from "./components/Notification";
import { useThemeStore } from "./store/themeStore";

// Define window.electron interface
declare global {
  interface Window {
    electron: {
      getSettings: () => Promise<any>;
      updateSettings: (settings: any) => Promise<any>;
      toggleAlwaysOnTop: () => Promise<boolean>;
      startDrag: () => void;
      startNativeDrag: (filePaths: string[]) => Promise<boolean>;
      dropFiles: (filePaths: string[]) => Promise<any[]>;
      clearStack: () => Promise<any[]>;
      moveFilesToDestination: (
        destinationPath: string
      ) => Promise<{ successes: number; failures: number }>;
      copyFilePaths: (selectedPaths?: string[]) => Promise<boolean>;
      openContainingFolder: (filePath: string) => Promise<boolean>;
      removeFileFromStack: (filePath: string) => Promise<any[]>;
      selectDestinationFolder: () => Promise<string | null>;
      onFilesUpdated: (callback: (files: any[]) => void) => () => void;
      onNotification: (
        callback: (message: { title: string; body: string }) => void
      ) => () => void;
      refreshNotchWindow: () => Promise<boolean>;
    };
  }
}

interface NotificationMessage {
  title: string;
  body: string;
  id: string;
}

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<"notch" | "settings">("notch");
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // Load settings and determine theme
    const loadSettings = async () => {
      try {
        const settings = await window.electron.getSettings();
        const preferredTheme = settings.notch.theme;

        if (preferredTheme === "system") {
          const isDarkMode = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          setTheme(isDarkMode ? "dark" : "light");
        } else {
          setTheme(preferredTheme);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();

    // Determine current view based on hash
    const hash = window.location.hash.slice(1);
    if (hash === "notch") {
      setActiveView("notch");
    } else {
      setActiveView("settings");
    }

    // Listen for notifications
    const unsubscribeNotification = window.electron.onNotification(
      (message) => {
        const newNotification = {
          ...message,
          id: `notification-${Date.now()}-${Math.random()}`,
        };

        setNotifications((prev) => [...prev, newNotification]);

        // Auto-remove notification after 3 seconds
        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== newNotification.id)
          );
        }, 3000);
      }
    );

    return () => {
      unsubscribeNotification();
    };
  }, [setTheme]);

  // Apply theme class to body
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      {activeView === "notch" ? <Notch /> : <Settings />}

      {/* Notification area */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            title={notification.title}
            message={notification.body}
            onClose={() => {
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
              );
            }}
          />
        ))}
      </div>
    </div>
  );
};
