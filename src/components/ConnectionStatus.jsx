import React from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { useAppState } from '../contexts/AppContext';
import { CONNECTION_STATES } from '../utils/constants';

export default function ConnectionStatus() {
  const { mqtt } = useAppState();

  const getStatusConfig = () => {
    switch (mqtt.connectionState) {
      case CONNECTION_STATES.CONNECTED:
        return {
          icon: Wifi,
          text: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          dotColor: 'bg-green-500'
        };
      case CONNECTION_STATES.CONNECTING:
      case CONNECTION_STATES.RECONNECTING:
        return {
          icon: Loader2,
          text: mqtt.connectionState === CONNECTION_STATES.CONNECTING ? 'Connecting...' : 'Reconnecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          dotColor: 'bg-yellow-500',
          animate: true
        };
      case CONNECTION_STATES.ERROR:
        return {
          icon: AlertCircle,
          text: 'Error',
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          dotColor: 'bg-red-500'
        };
      case CONNECTION_STATES.DISCONNECTED:
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-800',
          dotColor: 'bg-gray-500'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
      <div className="relative">
        <Icon 
          className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`}
        />
        <div className={`absolute -top-1 -right-1 w-2 h-2 ${config.dotColor} rounded-full ${config.animate ? 'animate-pulse' : ''}`} />
      </div>
      <span className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
}
