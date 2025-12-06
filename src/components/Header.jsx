import React from 'react';
import { Menu, Settings, Plus } from 'lucide-react';
import { useAppDispatch, actions } from '../contexts/AppContext';
import ConnectionStatus from './ConnectionStatus';

export default function Header() {
  const dispatch = useAppDispatch();

  const openSettings = () => {
    dispatch(actions.setUIState({ isSettingsOpen: true }));
  };

  const openAddDialog = () => {
    dispatch(actions.setUIState({ isAddDialogOpen: true }));
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">💡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                IoT Bulb Control
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Smart lighting management
              </p>
            </div>
          </div>

          {/* Right side - Connection Status and Actions */}
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            
            <button
              onClick={openAddDialog}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
              title="Add new bulb"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Bulb</span>
            </button>

            <button
              onClick={openSettings}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
