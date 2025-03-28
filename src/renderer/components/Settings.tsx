import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";
import { useThemeStore } from "../store/themeStore";

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
  });

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        await loadSettings();
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
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
          <svg
            className="animate-spin h-8 w-8 mb-3"
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
      className="h-full w-full overflow-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-4xl mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-windropper-600 dark:text-windropper-400">
              WinDropper Settings
            </h1>

            {/* Version info */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Version 0.1.0
            </div>
          </div>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Customize your WinDropper experience with these settings.
          </p>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 border-b border-gray-200 dark:border-gray-700">
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
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-600">
                <h2 className="text-xl font-semibold mb-5">
                  Appearance Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="theme"
                      className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={formValues.theme}
                      onChange={handleInputChange}
                      className="w-full rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-windropper-500"
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
                    <div className="flex items-center justify-between mb-2">
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
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
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
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-600">
                <h2 className="text-xl font-semibold mb-5">
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
                        className="h-4 w-4 text-windropper-500 rounded focus:ring-windropper-500 border-gray-300"
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
                        className="h-6 w-6 text-yellow-500 mr-2"
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
                        Tip: You can toggle always-on-top at any time using the
                        arrow button in the WinDropper window.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center">
                      <svg
                        className="h-6 w-6 text-windropper-500 mr-2"
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
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                          Ctrl+Shift+D
                        </kbd>{" "}
                        to show or hide the WinDropper window.
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
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-600">
                <h2 className="text-xl font-semibold mb-5">File Management</h2>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="defaultDestination"
                      className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >
                      Default Destination Folder
                    </label>
                    <div className="flex">
                      <input
                        id="defaultDestination"
                        type="text"
                        name="defaultDestination"
                        value={formValues.defaultDestination}
                        className="flex-1 rounded-l-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-windropper-500"
                        readOnly
                      />
                      <button
                        onClick={handleSelectDestination}
                        className="bg-windropper-500 hover:bg-windropper-600 text-white px-3 py-2 rounded-r-md text-sm transition-colors"
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
                        className="h-4 w-4 text-windropper-500 rounded focus:ring-windropper-500 border-gray-300"
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
                        Sort files into folders by file type (images, documents,
                        etc.) when moving them
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recent Destinations
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 max-h-32 overflow-y-auto">
                      {settings?.files?.recentDestinations &&
                      settings.files.recentDestinations.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {settings.files.recentDestinations.map(
                            (dest, index) => (
                              <li
                                key={index}
                                className="truncate text-gray-600 dark:text-gray-400"
                              >
                                {dest}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
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
          <div className="flex items-center justify-between pt-4">
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
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-md text-sm transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className={`px-4 py-2 bg-windropper-500 hover:bg-windropper-600 text-white rounded-md text-sm transition-colors flex items-center ${
                  isSaving ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
    </motion.div>
  );
};
