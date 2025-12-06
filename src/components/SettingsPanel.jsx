import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Moon, Sun, Download, Upload, Trash2 } from 'lucide-react';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import { useMQTT } from '../hooks/useMQTT';
import { validateMqttUrl } from '../utils/validators';
import { exportData, importData, clearAllData, getStorageUsage } from '../services/dbService';

export default function SettingsPanel() {
  const { ui, settings } = useAppState();
  const dispatch = useAppDispatch();
  const { connect, disconnect, mqtt, updateSettings } = useMQTT();

  const [formData, setFormData] = useState(settings);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const info = await getStorageUsage();
    setStorageInfo(info);
  };

  const handleClose = () => {
    dispatch(actions.setUIState({ isSettingsOpen: false }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // Validate MQTT URL
    const validation = validateMqttUrl(formData.mqtt_broker_url);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsSaving(true);

    try {
      await updateSettings(formData);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    setError('');
    try {
      await connect(formData);
      setSuccess('Connected to MQTT broker');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to connect. Check your settings and try again.');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setSuccess('Disconnected from MQTT broker');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleTheme = () => {
    const newTheme = formData.theme === 'dark' ? 'light' : 'dark';
    setFormData({ ...formData, theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iot-bulbs-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Data exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await importData(data);
      setSuccess(`Imported ${result.bulbsImported} bulbs successfully`);
      setTimeout(() => setSuccess(''), 3000);
      window.location.reload();
    } catch (err) {
      setError('Failed to import data. Make sure the file is valid.');
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      return;
    }

    try {
      await clearAllData();
      setSuccess('All data cleared');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError('Failed to clear data');
    }
  };

  if (!ui.isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* MQTT Configuration */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              MQTT Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Broker URL
                </label>
                <input
                  type="text"
                  value={formData.mqtt_broker_url}
                  onChange={(e) => setFormData({ ...formData, mqtt_broker_url: e.target.value })}
                  className="input-field"
                  placeholder="ws://localhost:9001"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  WebSocket URL of your MQTT broker (ws:// or wss://)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={formData.mqtt_client_id}
                  onChange={(e) => setFormData({ ...formData, mqtt_client_id: e.target.value })}
                  className="input-field"
                  placeholder="webapp_client_123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.mqtt_username}
                    onChange={(e) => setFormData({ ...formData, mqtt_username: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    value={formData.mqtt_password}
                    onChange={(e) => setFormData({ ...formData, mqtt_password: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {mqtt.isConnected ? (
                  <button
                    onClick={handleDisconnect}
                    className="btn-secondary"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={mqtt.isConnecting}
                    className="btn-primary"
                  >
                    {mqtt.isConnecting ? 'Connecting...' : 'Test Connection'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Appearance
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark mode</p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {formData.theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-gray-900 dark:text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-900 dark:text-white" />
                )}
              </button>
            </div>
          </section>

          {/* Data Management */}
          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Data Management
            </h3>
            
            {storageInfo && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Storage used: {(storageInfo.usage / 1024 / 1024).toFixed(2)} MB of {(storageInfo.quota / 1024 / 1024 / 1024).toFixed(2)} GB
                  ({storageInfo.usagePercent}%)
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 btn-secondary"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 btn-secondary cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleClearData}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Data</span>
              </button>
            </div>
          </section>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
