import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { getAllBulbs, saveBulb, deleteBulb as dbDeleteBulb, updateBulbState } from '../services/dbService';
import mqttService from '../services/mqttService';
import { BULB_STATES, CONNECTION_STATES } from '../utils/constants';

// Create contexts
const AppStateContext = createContext();
const AppDispatchContext = createContext();

// Initial state
const initialState = {
  bulbs: {},
  mqtt: {
    isConnected: false,
    isConnecting: false,
    connectionState: CONNECTION_STATES.DISCONNECTED,
    error: null
  },
  ui: {
    selectedBulbId: null,
    filterRoom: null,
    sortBy: 'last_updated',
    showOfflineBulbs: true,
    isAddDialogOpen: false,
    isSettingsOpen: false
  },
  settings: {
    mqtt_broker_url: 'ws://localhost:9001',
    mqtt_client_id: `webapp_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`,
    mqtt_username: '',
    mqtt_password: '',
    auto_reconnect: true,
    theme: 'system',
    notifications_enabled: true
  },
  isLoading: true
};

// Action types
const ACTIONS = {
  SET_BULBS: 'SET_BULBS',
  ADD_BULB: 'ADD_BULB',
  UPDATE_BULB: 'UPDATE_BULB',
  DELETE_BULB: 'DELETE_BULB',
  SET_MQTT_STATE: 'SET_MQTT_STATE',
  SET_UI_STATE: 'SET_UI_STATE',
  SET_SETTINGS: 'SET_SETTINGS',
  SET_LOADING: 'SET_LOADING',
  TOGGLE_BULB_OPTIMISTIC: 'TOGGLE_BULB_OPTIMISTIC'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_BULBS:
      return {
        ...state,
        bulbs: action.payload.reduce((acc, bulb) => {
          acc[bulb.bulb_id] = bulb;
          return acc;
        }, {})
      };

    case ACTIONS.ADD_BULB:
      return {
        ...state,
        bulbs: {
          ...state.bulbs,
          [action.payload.bulb_id]: action.payload
        }
      };

    case ACTIONS.UPDATE_BULB:
      return {
        ...state,
        bulbs: {
          ...state.bulbs,
          [action.payload.bulb_id]: {
            ...state.bulbs[action.payload.bulb_id],
            ...action.payload
          }
        }
      };

    case ACTIONS.DELETE_BULB:
      const { [action.payload]: deleted, ...remainingBulbs } = state.bulbs;
      return {
        ...state,
        bulbs: remainingBulbs
      };

    case ACTIONS.TOGGLE_BULB_OPTIMISTIC:
      const bulb = state.bulbs[action.payload];
      if (!bulb) return state;
      
      return {
        ...state,
        bulbs: {
          ...state.bulbs,
          [action.payload]: {
            ...bulb,
            state: bulb.state === BULB_STATES.ON ? BULB_STATES.OFF : BULB_STATES.ON,
            last_updated: new Date().toISOString()
          }
        }
      };

    case ACTIONS.SET_MQTT_STATE:
      return {
        ...state,
        mqtt: {
          ...state.mqtt,
          ...action.payload
        }
      };

    case ACTIONS.SET_UI_STATE:
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      };

    case ACTIONS.SET_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    default:
      return state;
  }
}

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load bulbs from IndexedDB on mount
  useEffect(() => {
    async function loadBulbs() {
      try {
        const bulbs = await getAllBulbs();
        dispatch({ type: ACTIONS.SET_BULBS, payload: bulbs });
      } catch (error) {
        console.error('Failed to load bulbs:', error);
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }

    loadBulbs();
  }, []);

  // Setup MQTT event listeners
  useEffect(() => {
    const handleConnect = () => {
      dispatch({
        type: ACTIONS.SET_MQTT_STATE,
        payload: {
          isConnected: true,
          isConnecting: false,
          connectionState: CONNECTION_STATES.CONNECTED,
          error: null
        }
      });
    };

    const handleDisconnect = () => {
      dispatch({
        type: ACTIONS.SET_MQTT_STATE,
        payload: {
          isConnected: false,
          isConnecting: false,
          connectionState: CONNECTION_STATES.DISCONNECTED
        }
      });
    };

    const handleError = (error) => {
      dispatch({
        type: ACTIONS.SET_MQTT_STATE,
        payload: {
          isConnected: false,
          isConnecting: false,
          connectionState: CONNECTION_STATES.ERROR,
          error: error.message
        }
      });
    };

    const handleStateChange = (connectionState) => {
      dispatch({
        type: ACTIONS.SET_MQTT_STATE,
        payload: {
          connectionState,
          isConnecting: connectionState === CONNECTION_STATES.CONNECTING || 
                       connectionState === CONNECTION_STATES.RECONNECTING,
          isConnected: connectionState === CONNECTION_STATES.CONNECTED
        }
      });
    };

    const handleMessage = async ({ topic, payload }) => {
      // Handle state updates
      if (topic.includes('/state')) {
        const bulbId = topic.split('/')[1];
        
        // Update state
        dispatch({
          type: ACTIONS.UPDATE_BULB,
          payload: {
            bulb_id: bulbId,
            ...payload,
            last_seen: new Date().toISOString(),
            is_online: true
          }
        });

        // Persist to IndexedDB
        try {
          await updateBulbState(bulbId, {
            ...payload,
            last_seen: new Date().toISOString(),
            is_online: true
          });
        } catch (error) {
          console.error('Failed to persist bulb state:', error);
        }
      }

      // Handle status updates
      if (topic.includes('/status')) {
        const bulbId = topic.split('/')[1];
        dispatch({
          type: ACTIONS.UPDATE_BULB,
          payload: {
            bulb_id: bulbId,
            is_online: payload.online,
            last_seen: new Date().toISOString()
          }
        });
      }

      // Handle discovery responses
      if (topic.includes('/discovery/response')) {
        console.log('Discovered bulb:', payload);
        // Could automatically add discovered bulbs here
      }
    };

    mqttService.on('onConnect', handleConnect);
    mqttService.on('onDisconnect', handleDisconnect);
    mqttService.on('onError', handleError);
    mqttService.on('onStateChange', handleStateChange);
    mqttService.on('onMessage', handleMessage);

    return () => {
      mqttService.off('onConnect', handleConnect);
      mqttService.off('onDisconnect', handleDisconnect);
      mqttService.off('onError', handleError);
      mqttService.off('onStateChange', handleStateChange);
      mqttService.off('onMessage', handleMessage);
    };
  }, []);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// Custom hooks
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within AppProvider');
  }
  return context;
}

// Action creators
export const actions = {
  setBulbs: (bulbs) => ({ type: ACTIONS.SET_BULBS, payload: bulbs }),
  addBulb: (bulb) => ({ type: ACTIONS.ADD_BULB, payload: bulb }),
  updateBulb: (bulb) => ({ type: ACTIONS.UPDATE_BULB, payload: bulb }),
  deleteBulb: (bulbId) => ({ type: ACTIONS.DELETE_BULB, payload: bulbId }),
  toggleBulbOptimistic: (bulbId) => ({ type: ACTIONS.TOGGLE_BULB_OPTIMISTIC, payload: bulbId }),
  setMqttState: (state) => ({ type: ACTIONS.SET_MQTT_STATE, payload: state }),
  setUIState: (state) => ({ type: ACTIONS.SET_UI_STATE, payload: state }),
  setSettings: (settings) => ({ type: ACTIONS.SET_SETTINGS, payload: settings }),
  setLoading: (loading) => ({ type: ACTIONS.SET_LOADING, payload: loading })
};
