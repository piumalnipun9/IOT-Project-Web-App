import React, { useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { useMQTT } from './hooks/useMQTT';
import Header from './components/Header';
import BulbList from './components/BulbList';
import AddBulbDialog from './components/AddBulbDialog';
import SettingsPanel from './components/SettingsPanel';

function AppContent() {
  const { connect, loadSettings, settings } = useMQTT();

  useEffect(() => {
    // Load settings on startup
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    // Auto-connect to MQTT if settings exist
    if (settings.mqtt_broker_url && settings.auto_reconnect) {
      connect();
    }
  }, [settings.mqtt_broker_url, settings.auto_reconnect]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BulbList />
      </main>

      {/* Dialogs */}
      <AddBulbDialog />
      <SettingsPanel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
