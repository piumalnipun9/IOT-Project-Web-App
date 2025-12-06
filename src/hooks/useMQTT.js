import { useCallback } from 'react';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import mqttService from '../services/mqttService';
import { getAllSettings, saveSettings } from '../services/dbService';
import { DEFAULT_MQTT_CONFIG } from '../utils/constants';

export function useMQTT() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  // Connect to MQTT broker
  const connect = useCallback(async (config) => {
    try {
      dispatch(actions.setMqttState({
        isConnecting: true,
        error: null
      }));

      const mqttConfig = {
        url: config?.url || state.settings.mqtt_broker_url,
        clientId: config?.clientId || state.settings.mqtt_client_id,
        username: config?.username || state.settings.mqtt_username,
        password: config?.password || state.settings.mqtt_password,
        ...DEFAULT_MQTT_CONFIG
      };

      mqttService.connect(mqttConfig);

      // Subscribe to all bulb topics
      Object.keys(state.bulbs).forEach(bulbId => {
        mqttService.subscribeToBulbState(bulbId);
        mqttService.subscribeToBulbStatus(bulbId);
      });

      // Subscribe to gateway status
      mqttService.subscribeToGatewayStatus();

    } catch (error) {
      console.error('Failed to connect to MQTT broker:', error);
      dispatch(actions.setMqttState({
        isConnecting: false,
        error: error.message
      }));
      throw error;
    }
  }, [state.settings, state.bulbs, dispatch]);

  // Disconnect from MQTT broker
  const disconnect = useCallback(() => {
    mqttService.disconnect();
  }, []);

  // Reconnect to MQTT broker
  const reconnect = useCallback(async () => {
    disconnect();
    await connect();
  }, [connect, disconnect]);

  // Request bulb discovery
  const discoverBulbs = useCallback(async () => {
    try {
      await mqttService.requestDiscovery();
    } catch (error) {
      console.error('Failed to request discovery:', error);
      throw error;
    }
  }, []);

  // Update MQTT settings
  const updateSettings = useCallback(async (newSettings) => {
    // Update state
    dispatch(actions.setSettings(newSettings));

    // Save to IndexedDB
    await saveSettings(newSettings);

    // Reconnect if broker URL changed
    if (newSettings.mqtt_broker_url && 
        newSettings.mqtt_broker_url !== state.settings.mqtt_broker_url &&
        state.mqtt.isConnected) {
      await reconnect();
    }
  }, [state.settings, state.mqtt.isConnected, dispatch, reconnect]);

  // Load settings from IndexedDB
  const loadSettings = useCallback(async () => {
    try {
      const settings = await getAllSettings();
      if (Object.keys(settings).length > 0) {
        dispatch(actions.setSettings(settings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [dispatch]);

  return {
    mqtt: state.mqtt,
    settings: state.settings,
    connect,
    disconnect,
    reconnect,
    discoverBulbs,
    updateSettings,
    loadSettings
  };
}
