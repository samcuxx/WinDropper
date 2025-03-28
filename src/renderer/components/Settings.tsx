import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";
import { useThemeStore } from "../store/themeStore";

// TitleBar component
const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { theme } = useThemeStore();

  // Check initial maximize state
  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const maximized = await window.electron.isWindowMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error("Error checking window state:", error);
      }
    };

    checkMaximized();

    // Set up interval to check maximize state
    const interval = setInterval(checkMaximized, 500);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => {
    window.electron.minimizeWindow();
  };

  const handleMaximizeRestore = async () => {
    const newState = await window.electron.maximizeWindow();
    setIsMaximized(newState);
  };

  const handleClose = () => {
    window.electron.closeWindow();
  };

  // Styles based on theme
  const titleBarClass =
    theme === "dark"
      ? "bg-gray-900 text-white"
      : "bg-windropper-600 text-white";

  const buttonHoverClass =
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-windropper-700";

  const closeButtonClass =
    theme === "dark" ? "hover:bg-red-600" : "hover:bg-red-600";

  return (
    <div
      className={`flex sticky top-0 z-50 justify-between items-center w-full h-10 ${titleBarClass}`}
      style={{ WebkitAppRegion: "drag" as any }}
    >
      <div className="flex items-center pl-4">
        <div className="flex justify-center items-center mr-2 w-6 h-6">
          <svg
            className="w-5 h-5 text-windropper-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-lg font-semibold">WinDropper Settings</h1>
      </div>

      <div
        className="flex h-full"
        style={{ WebkitAppRegion: "no-drag" as any }}
      >
        <button
          onClick={handleMinimize}
          className={`flex justify-center items-center px-4 h-full transition-colors ${buttonHoverClass} focus:outline-none`}
          aria-label="Minimize"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 14H4v-2h16v2z" />
          </svg>
        </button>

        <button
          onClick={handleMaximizeRestore}
          className={`flex justify-center items-center px-4 h-full transition-colors ${buttonHoverClass} focus:outline-none`}
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 6h-5v5h5V6zm0 7h-5v5h5v-5zM6 6h5v5H6V6zm0 7h5v5H6v-5z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h16v16H4V4z" />
            </svg>
          )}
        </button>

        <button
          onClick={handleClose}
          className={`flex justify-center items-center px-4 h-full transition-colors ${closeButtonClass} focus:outline-none`}
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const Settings: React.FC = () => {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<
    "appearance" | "behavior" | "files"
  >("appearance");

  // Setting form values
  const [formValues, setFormValues] = useState({
    theme: "system",
    opacity: 0.9,
    alwaysOnTop: true,
    defaultDestination: "",
    categorizeByType: true,
    startOnBoot: true,
  });

  // State for tracking the current start on boot value from settings
  const [isStartOnBoot, setIsStartOnBoot] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        await loadSettings();

        // Get and set the current startOnBoot value
        const allSettings = await window.electron.getSettings();
        setIsStartOnBoot(allSettings.startOnBoot !== false);

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading settings:", error);
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [loadSettings]);

  // Update form when settings change
  useEffect(() => {
    if (settings) {
      setFormValues({
        theme: settings.notch.theme,
        opacity: settings.notch.opacity,
        alwaysOnTop: settings.notch.alwaysOnTop,
        defaultDestination: settings.files.defaultDestination,
        categorizeByType: settings.files.categorizeByType,
        startOnBoot: settings.startOnBoot,
      });
    }
  }, [settings]);

  // Auto-hide success message after a delay
  useEffect(() => {
    if (saveSuccess !== null) {
      const timer = setTimeout(() => {
        setSaveSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Handle form changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setFormValues((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle saving settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(null);

      const newSettings = {
        notch: {
          theme: formValues.theme as "light" | "dark" | "system",
          opacity: Number(formValues.opacity),
          alwaysOnTop: formValues.alwaysOnTop,
        },
        files: {
          defaultDestination: formValues.defaultDestination,
          categorizeByType: formValues.categorizeByType,
        },
        startOnBoot: formValues.startOnBoot,
      };

      await updateSettings(newSettings);

      // Update theme if changed
      if (formValues.theme !== "system") {
        setTheme(formValues.theme as "light" | "dark");
      }

      // Refresh the notch window to apply settings
      try {
        await window.electron.refreshNotchWindow();
        console.log("Notch window refreshed successfully");
      } catch (error) {
        console.error("Error refreshing notch window:", error);
      }

      setSaveSuccess(true);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle selecting default destination folder
  const handleSelectDestination = async () => {
    try {
      const result = await window.electron.selectDestinationFolder();
      if (result) {
        setFormValues((prev) => ({
          ...prev,
          defaultDestination: result,
        }));
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  };

  // Handle resetting settings
  const handleResetSettings = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(null);

      await updateSettings({
        notch: {
          theme: "system",
          opacity: 0.9,
          alwaysOnTop: true,
        },
        files: {
          categorizeByType: true,
        },
        startOnBoot: true,
      });

      // Refresh the notch window to apply reset settings
      try {
        await window.electron.refreshNotchWindow();
      } catch (error) {
        console.error("Error refreshing notch window:", error);
      }

      setSaveSuccess(true);
    } catch (error) {
      console.error("Error resetting settings:", error);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
          <svg
            className="mb-3 w-8 h-8 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <div>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex overflow-hidden flex-col w-full h-full text-gray-900 bg-white dark:bg-gray-800 dark:text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Custom Title Bar */}
      <TitleBar />

      {/* Content Area with Scroll */}
      <div className="overflow-auto flex-1">
        <div className="p-6 mx-auto max-w-4xl">
          <header className="mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-windropper-600 dark:text-windropper-400">
                Configuration
              </h2>

              {/* Version info */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Version 0.1.0
              </div>
            </div>

            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Customize your WinDropper experience with these settings.
            </p>

            {/* Tabs */}
            <div className="flex mt-6 space-x-1 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("appearance")}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                  activeTab === "appearance"
                    ? "bg-windropper-100 dark:bg-windropper-900/30 text-windropper-600 dark:text-windropper-400 border-b-2 border-windropper-500"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Appearance
              </button>
              <button
                onClick={() => setActiveTab("behavior")}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                  activeTab === "behavior"
                    ? "bg-windropper-100 dark:bg-windropper-900/30 text-windropper-600 dark:text-windropper-400 border-b-2 border-windropper-500"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Behavior
              </button>
              <button
                onClick={() => setActiveTab("files")}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                  activeTab === "files"
                    ? "bg-windropper-100 dark:bg-windropper-900/30 text-windropper-600 dark:text-windropper-400 border-b-2 border-windropper-500"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                File Management
              </button>
            </div>
          </header>

          <div className="space-y-8">
            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
                  <h2 className="mb-5 text-xl font-semibold">
                    Appearance Settings
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="theme"
                        className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Theme
                      </label>
                      <select
                        id="theme"
                        name="theme"
                        value={formValues.theme}
                        onChange={handleInputChange}
                        className="px-3 py-2 w-full text-sm bg-white rounded-md border border-gray-300 dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-windropper-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System Default</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Choose how WinDropper appears on your desktop
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label
                          htmlFor="opacity"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Window Opacity
                        </label>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {Math.round(formValues.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        id="opacity"
                        type="range"
                        name="opacity"
                        min="0.5"
                        max="1"
                        step="0.05"
                        value={formValues.opacity}
                        onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Adjust how transparent the WinDropper window appears
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Behavior Settings */}
            {activeTab === "behavior" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
                  <h2 className="mb-5 text-xl font-semibold">
                    Behavior Settings
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="alwaysOnTop"
                          name="alwaysOnTop"
                          checked={formValues.alwaysOnTop}
                          onChange={handleInputChange}
                          className="w-4 h-4 rounded border-gray-300 text-windropper-500 focus:ring-windropper-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="alwaysOnTop"
                          className="font-medium text-gray-700 dark:text-gray-300"
                        >
                          Always on top
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                          Keep the WinDropper window above all other windows
                        </p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="flex items-center">
                        <svg
                          className="mr-2 w-6 h-6 text-yellow-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Tip: You can toggle always-on-top at any time using
                          the arrow button in the WinDropper window.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="mr-2 w-6 h-6 text-windropper-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Press{" "}
                          <kbd className="px-2 py-1 font-mono text-xs bg-gray-100 rounded dark:bg-gray-800">
                            Ctrl+Shift+D
                          </kbd>{" "}
                          to show or hide the WinDropper window.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start mt-4">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="startOnBoot"
                          name="startOnBoot"
                          checked={isStartOnBoot}
                          onChange={async () => {
                            try {
                              const newValue =
                                await window.electron.toggleStartOnBoot();
                              setIsStartOnBoot(newValue);
                              // Update form value too
                              setFormValues((prev) => ({
                                ...prev,
                                startOnBoot: newValue,
                              }));
                            } catch (error) {
                              console.error(
                                "Error toggling start on boot:",
                                error
                              );
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-windropper-500 focus:ring-windropper-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="startOnBoot"
                          className="font-medium text-gray-700 dark:text-gray-300"
                        >
                          Start on boot
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                          Automatically start WinDropper when you log in to
                          Windows
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* File Management Settings */}
            {activeTab === "files" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
                  <h2 className="mb-5 text-xl font-semibold">
                    File Management
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="defaultDestination"
                        className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Default Destination Folder
                      </label>
                      <div className="flex">
                        <input
                          id="defaultDestination"
                          type="text"
                          name="defaultDestination"
                          value={formValues.defaultDestination}
                          className="flex-1 px-3 py-2 text-sm bg-white rounded-l-md border border-gray-300 dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-windropper-500"
                          readOnly
                        />
                        <button
                          onClick={handleSelectDestination}
                          className="px-3 py-2 text-sm text-white rounded-r-md transition-colors bg-windropper-500 hover:bg-windropper-600"
                        >
                          Browse
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Where files will be moved to by default
                      </p>
                    </div>

                    <div className="flex items-start pt-3">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="categorizeByType"
                          name="categorizeByType"
                          checked={formValues.categorizeByType}
                          onChange={handleInputChange}
                          className="w-4 h-4 rounded border-gray-300 text-windropper-500 focus:ring-windropper-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="categorizeByType"
                          className="font-medium text-gray-700 dark:text-gray-300"
                        >
                          Organize files by type
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                          Sort files into folders by file type (images,
                          documents, etc.) when moving them
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recent Destinations
                      </h3>
                      <div className="overflow-y-auto p-3 max-h-32 bg-gray-50 rounded-md dark:bg-gray-800">
                        {settings?.files?.recentDestinations &&
                        settings.files.recentDestinations.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {settings.files.recentDestinations.map(
                              (dest, index) => (
                                <li
                                  key={index}
                                  className="text-gray-600 truncate dark:text-gray-400"
                                >
                                  {dest}
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p className="text-sm italic text-gray-500 dark:text-gray-400">
                            No recent destinations
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <div className="flex-1">
                {/* Feedback message */}
                <AnimatePresence>
                  {saveSuccess !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`text-sm ${
                        saveSuccess
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {saveSuccess
                        ? "Settings saved successfully!"
                        : "Failed to save settings. Please try again."}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleResetSettings}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm text-gray-800 bg-gray-300 rounded-md transition-colors hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className={`px-4 py-2 bg-windropper-500 hover:bg-windropper-600 text-white rounded-md text-sm transition-colors flex items-center ${
                    isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="mr-2 -ml-1 w-4 h-4 text-white animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
