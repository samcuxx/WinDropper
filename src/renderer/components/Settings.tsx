import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";
import { useThemeStore } from "../store/themeStore";

export const Settings: React.FC = () => {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();

  const [isLoading, setIsLoading] = useState(true);
  const [formValues, setFormValues] = useState({
    theme: "system",
    opacity: 0.9,
    alwaysOnTop: true,
    autoHide: false,
    defaultDestination: "",
    autoClearTimeout: 0,
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
        autoHide: settings.notch.autoHide,
        defaultDestination: settings.files.defaultDestination,
        autoClearTimeout: settings.files.autoClearTimeout || 0,
        categorizeByType: settings.files.categorizeByType,
      });
    }
  }, [settings]);

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
      const newSettings = {
        notch: {
          theme: formValues.theme as "light" | "dark" | "system",
          opacity: Number(formValues.opacity),
          alwaysOnTop: formValues.alwaysOnTop,
          autoHide: formValues.autoHide,
        },
        files: {
          defaultDestination: formValues.defaultDestination,
          autoClearTimeout:
            formValues.autoClearTimeout > 0
              ? Number(formValues.autoClearTimeout)
              : null,
          categorizeByType: formValues.categorizeByType,
        },
      };

      await updateSettings(newSettings);

      // Update theme if changed
      if (formValues.theme !== "system") {
        setTheme(formValues.theme as "light" | "dark");
      }

      // Show success notification
      // (This would use the notification system in a real implementation)
    } catch (error) {
      console.error("Error saving settings:", error);
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
      await updateSettings({
        notch: {
          theme: "system",
          opacity: 0.9,
          alwaysOnTop: true,
          autoHide: false,
        },
        files: {
          autoClearTimeout: null,
          categorizeByType: true,
        },
      });
    } catch (error) {
      console.error("Error resetting settings:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          Loading settings...
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
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="space-y-8">
          {/* Appearance Settings */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-windropper-600 dark:text-windropper-400">
              Appearance
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div>
                <label
                  htmlFor="theme"
                  className="block text-sm font-medium mb-1"
                >
                  Theme
                </label>
                <select
                  id="theme"
                  name="theme"
                  value={formValues.theme}
                  onChange={handleInputChange}
                  className="w-full rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-windropper-500"
                  aria-label="Select theme"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="opacity"
                  className="block text-sm font-medium mb-1"
                >
                  Opacity: {formValues.opacity}
                </label>
                <input
                  id="opacity"
                  type="range"
                  name="opacity"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={formValues.opacity}
                  onChange={handleInputChange}
                  className="w-full"
                  aria-label="Adjust opacity"
                />
              </div>
            </div>
          </div>

          {/* Behavior Settings */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-windropper-600 dark:text-windropper-400">
              Behavior
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="alwaysOnTop"
                  name="alwaysOnTop"
                  checked={formValues.alwaysOnTop}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-windropper-500 rounded focus:ring-windropper-500"
                  aria-label="Always on top"
                />
                <label htmlFor="alwaysOnTop" className="ml-2 text-sm">
                  Always on top
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoHide"
                  name="autoHide"
                  checked={formValues.autoHide}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-windropper-500 rounded focus:ring-windropper-500"
                  aria-label="Auto-hide when not in use"
                />
                <label htmlFor="autoHide" className="ml-2 text-sm">
                  Auto-hide when not in use
                </label>
              </div>
            </div>
          </div>

          {/* File Settings */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-windropper-600 dark:text-windropper-400">
              File Management
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div>
                <label
                  htmlFor="defaultDestination"
                  className="block text-sm font-medium mb-1"
                >
                  Default Destination
                </label>
                <div className="flex">
                  <input
                    id="defaultDestination"
                    type="text"
                    name="defaultDestination"
                    value={formValues.defaultDestination}
                    onChange={handleInputChange}
                    className="flex-1 rounded-l-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-windropper-500"
                    readOnly
                    aria-label="Default destination folder path"
                  />
                  <button
                    onClick={handleSelectDestination}
                    className="bg-windropper-500 hover:bg-windropper-600 text-white px-3 py-2 rounded-r-md text-sm"
                    aria-label="Browse for default destination folder"
                  >
                    Browse
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="autoClearTimeout"
                  className="block text-sm font-medium mb-1"
                >
                  Auto-clear files after (minutes, 0 = never)
                </label>
                <input
                  id="autoClearTimeout"
                  type="number"
                  name="autoClearTimeout"
                  value={formValues.autoClearTimeout}
                  onChange={handleInputChange}
                  min="0"
                  max="1440"
                  className="w-full rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-windropper-500"
                  aria-label="Auto-clear timeout in minutes"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="categorizeByType"
                  name="categorizeByType"
                  checked={formValues.categorizeByType}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-windropper-500 rounded focus:ring-windropper-500"
                  aria-label="Organize files by type when moving"
                />
                <label htmlFor="categorizeByType" className="ml-2 text-sm">
                  Organize files by type when moving
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleResetSettings}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-md text-sm"
              aria-label="Reset settings to defaults"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-windropper-500 hover:bg-windropper-600 text-white rounded-md text-sm"
              aria-label="Save settings"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
