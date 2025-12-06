// Database configuration
export const DB_NAME = 'iot-bulb-control';
export const DB_VERSION = 1;

// Store names
export const STORES = {
  BULBS: 'bulbs',
  SETTINGS: 'settings',
  HISTORY: 'history'
};

// MQTT Topics
export const MQTT_TOPICS = {
  CONTROL_POWER: (bulbId) => `bulb/${bulbId}/control/power`,
  CONTROL_BRIGHTNESS: (bulbId) => `bulb/${bulbId}/control/brightness`,
  CONTROL_COLOR: (bulbId) => `bulb/${bulbId}/control/color`,
  CONTROL_ALL: 'bulb/all/control/power',
  STATE: (bulbId) => `bulb/${bulbId}/state`,
  STATUS: (bulbId) => `bulb/${bulbId}/status`,
  GATEWAY_STATUS: 'gateway/status',
  DISCOVERY_REQUEST: 'bulb/discovery/request',
  DISCOVERY_RESPONSE: 'bulb/+/discovery/response'
};

// Default MQTT configuration
export const DEFAULT_MQTT_CONFIG = {
  url: 'ws://localhost:9001',
  clientId: `webapp_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`,
  username: '',
  password: '',
  keepalive: 60,
  reconnectPeriod: 5000,
  connectTimeout: 30000,
  clean: false,
  qos: 1
};

// Default settings
export const DEFAULT_SETTINGS = {
  mqtt_broker_url: 'ws://localhost:9001',
  mqtt_client_id: DEFAULT_MQTT_CONFIG.clientId,
  mqtt_username: '',
  mqtt_password: '',
  auto_reconnect: true,
  theme: 'system',
  notifications_enabled: true,
  show_offline_bulbs: true,
  auto_refresh_interval: 5000
};

// Connection states
export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

// Bulb states
export const BULB_STATES = {
  ON: 'ON',
  OFF: 'OFF'
};

// Validation patterns
export const VALIDATION = {
  BULB_ID_PATTERN: /^[a-zA-Z0-9_-]{1,32}$/,
  BULB_ID_ERROR: 'Bulb ID must be 1-32 characters (letters, numbers, - and _ only)'
};

// Timeouts
export const TIMEOUTS = {
  MQTT_PUBLISH: 5000,
  STATE_CONFIRMATION: 5000,
  DEBOUNCE_TOGGLE: 300,
  THROTTLE_BRIGHTNESS: 200
};
