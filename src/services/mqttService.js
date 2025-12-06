import mqtt from 'mqtt';
import { CONNECTION_STATES, MQTT_TOPICS } from '../utils/constants';

class MQTTService {
  constructor() {
    this.client = null;
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.subscriptions = new Map();
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.listeners = {
      onConnect: [],
      onDisconnect: [],
      onMessage: [],
      onError: [],
      onStateChange: []
    };
  }

  /**
   * Connect to MQTT broker
   */
  connect(config) {
    if (this.client) {
      console.warn('MQTT client already exists. Disconnecting first.');
      this.disconnect();
    }

    this.setConnectionState(CONNECTION_STATES.CONNECTING);

    try {
      const options = {
        clientId: config.clientId,
        username: config.username || undefined,
        password: config.password || undefined,
        clean: config.clean !== undefined ? config.clean : false,
        keepalive: config.keepalive || 60,
        reconnectPeriod: config.reconnectPeriod || 5000,
        connectTimeout: config.connectTimeout || 30000,
        will: config.will || {
          topic: 'webapp/status',
          payload: JSON.stringify({ status: 'offline', timestamp: new Date().toISOString() }),
          qos: 1,
          retain: true
        }
      };

      this.client = mqtt.connect(config.url, options);
      this.setupEventHandlers();
      
      return this.client;
    } catch (error) {
      console.error('Failed to create MQTT client:', error);
      this.setConnectionState(CONNECTION_STATES.ERROR);
      this.notifyListeners('onError', error);
      throw error;
    }
  }

  /**
   * Setup MQTT event handlers
   */
  setupEventHandlers() {
    if (!this.client) return;

    this.client.on('connect', () => {
      console.log('MQTT connected');
      this.reconnectAttempts = 0;
      this.setConnectionState(CONNECTION_STATES.CONNECTED);
      this.notifyListeners('onConnect');
      
      // Resubscribe to all topics
      this.resubscribeAll();
      
      // Flush message queue
      this.flushMessageQueue();
    });

    this.client.on('reconnect', () => {
      console.log('MQTT reconnecting...');
      this.reconnectAttempts++;
      this.setConnectionState(CONNECTION_STATES.RECONNECTING);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.client.on('close', () => {
      console.log('MQTT connection closed');
      this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
      this.notifyListeners('onDisconnect');
    });

    this.client.on('error', (error) => {
      console.error('MQTT error:', error);
      this.setConnectionState(CONNECTION_STATES.ERROR);
      this.notifyListeners('onError', error);
    });

    this.client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log('MQTT message received:', topic, payload);
        this.notifyListeners('onMessage', { topic, payload });
      } catch (error) {
        console.error('Failed to parse MQTT message:', error);
      }
    });

    this.client.on('offline', () => {
      console.log('MQTT client offline');
      this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
      this.subscriptions.clear();
    }
  }

  /**
   * Publish message to topic
   */
  async publish(topic, message, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.client || this.connectionState !== CONNECTION_STATES.CONNECTED) {
        // Queue message if not connected
        this.messageQueue.push({ topic, message, options, resolve, reject });
        reject(new Error('MQTT client not connected. Message queued.'));
        return;
      }

      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      const publishOptions = {
        qos: options.qos || 1,
        retain: options.retain || false
      };

      this.client.publish(topic, payload, publishOptions, (error) => {
        if (error) {
          console.error('Failed to publish message:', error);
          reject(error);
        } else {
          console.log('Message published:', topic, message);
          resolve();
        }
      });
    });
  }

  /**
   * Subscribe to topic
   */
  subscribe(topic, callback, options = {}) {
    if (!this.client) {
      console.error('Cannot subscribe: MQTT client not initialized');
      return;
    }

    const subscribeOptions = {
      qos: options.qos || 1
    };

    this.client.subscribe(topic, subscribeOptions, (error) => {
      if (error) {
        console.error('Failed to subscribe to topic:', topic, error);
      } else {
        console.log('Subscribed to topic:', topic);
        this.subscriptions.set(topic, { callback, options: subscribeOptions });
      }
    });

    // Add callback to listeners
    if (callback) {
      this.on('onMessage', ({ topic: receivedTopic, payload }) => {
        if (this.topicMatches(topic, receivedTopic)) {
          callback(receivedTopic, payload);
        }
      });
    }
  }

  /**
   * Unsubscribe from topic
   */
  unsubscribe(topic) {
    if (!this.client) return;

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        console.error('Failed to unsubscribe from topic:', topic, error);
      } else {
        console.log('Unsubscribed from topic:', topic);
        this.subscriptions.delete(topic);
      }
    });
  }

  /**
   * Resubscribe to all topics (used after reconnection)
   */
  resubscribeAll() {
    console.log('Resubscribing to all topics...');
    for (const [topic, { options }] of this.subscriptions.entries()) {
      this.client.subscribe(topic, options, (error) => {
        if (error) {
          console.error('Failed to resubscribe to topic:', topic, error);
        } else {
          console.log('Resubscribed to topic:', topic);
        }
      });
    }
  }

  /**
   * Flush queued messages
   */
  async flushMessageQueue() {
    console.log(`Flushing ${this.messageQueue.length} queued messages...`);
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const { topic, message, options, resolve, reject } of queue) {
      try {
        await this.publish(topic, message, options);
        resolve();
      } catch (error) {
        reject(error);
      }
    }
  }

  /**
   * Check if topic pattern matches received topic
   */
  topicMatches(pattern, topic) {
    // Convert MQTT wildcards to regex
    const regexPattern = pattern
      .replace(/\+/g, '[^/]+')
      .replace(/#/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(topic);
  }

  /**
   * Set connection state and notify listeners
   */
  setConnectionState(state) {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.notifyListeners('onStateChange', state);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connectionState === CONNECTION_STATES.CONNECTED;
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Control bulb power
   */
  async controlPower(bulbId, state) {
    const topic = MQTT_TOPICS.CONTROL_POWER(bulbId);
    return this.publish(topic, { state });
  }

  /**
   * Control bulb brightness
   */
  async controlBrightness(bulbId, brightness) {
    const topic = MQTT_TOPICS.CONTROL_BRIGHTNESS(bulbId);
    return this.publish(topic, { brightness });
  }

  /**
   * Control bulb color
   */
  async controlColor(bulbId, color) {
    const topic = MQTT_TOPICS.CONTROL_COLOR(bulbId);
    return this.publish(topic, { color });
  }

  /**
   * Control all bulbs
   */
  async controlAllBulbs(state) {
    return this.publish(MQTT_TOPICS.CONTROL_ALL, { state });
  }

  /**
   * Request bulb discovery
   */
  async requestDiscovery() {
    return this.publish(MQTT_TOPICS.DISCOVERY_REQUEST, {});
  }

  /**
   * Subscribe to bulb state updates
   */
  subscribeToBulbState(bulbId, callback) {
    const topic = MQTT_TOPICS.STATE(bulbId);
    this.subscribe(topic, callback);
  }

  /**
   * Subscribe to bulb status updates
   */
  subscribeToBulbStatus(bulbId, callback) {
    const topic = MQTT_TOPICS.STATUS(bulbId);
    this.subscribe(topic, callback);
  }

  /**
   * Subscribe to gateway status
   */
  subscribeToGatewayStatus(callback) {
    this.subscribe(MQTT_TOPICS.GATEWAY_STATUS, callback);
  }

  /**
   * Subscribe to discovery responses
   */
  subscribeToDiscovery(callback) {
    this.subscribe(MQTT_TOPICS.DISCOVERY_RESPONSE, callback);
  }

  /**
   * Unsubscribe from bulb topics
   */
  unsubscribeFromBulb(bulbId) {
    this.unsubscribe(MQTT_TOPICS.STATE(bulbId));
    this.unsubscribe(MQTT_TOPICS.STATUS(bulbId));
  }
}

// Create singleton instance
const mqttService = new MQTTService();

export default mqttService;
