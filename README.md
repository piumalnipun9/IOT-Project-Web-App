# IoT Bulb Control System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3+-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

A production-ready, single-page web application for real-time control and monitoring of IoT smart bulbs through MQTT over WebSocket. Features client-side persistence, offline support, and real-time synchronization across multiple clients.

## ✨ Features

- 🔌 **Real-time MQTT Control** - Bi-directional communication with IoT bulbs via WebSocket
- 💾 **Offline-First** - IndexedDB persistence with automatic sync when reconnected
- 🔄 **Multi-Client Sync** - Instant state updates across all connected browsers
- 📱 **Responsive Design** - Mobile-first UI that works on all devices
- 🎨 **Dark Mode** - Beautiful dark/light theme toggle
- 🔍 **Smart Discovery** - Automatic bulb discovery over MQTT
- 📊 **Room Management** - Organize bulbs by rooms/locations
- ⚡ **Optimistic Updates** - Zero-latency UI feedback
- 🔒 **Secure** - Support for WSS (secure WebSocket) and MQTT authentication
- 📦 **Zero Backend** - Completely serverless architecture

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Browser (React SPA)               │
│  ┌───────────────────────────────────────┐ │
│  │  Components & UI                      │ │
│  │  - BulbList, BulbCard                 │ │
│  │  - Settings, AddBulb Dialog          │ │
│  └───────────────────────────────────────┘ │
│           ↕                    ↕            │
│  ┌─────────────────┐  ┌─────────────────┐ │
│  │   IndexedDB     │  │  MQTT.js Client │ │
│  │   (idb)         │  │  (WebSocket)    │ │
│  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────┘
                     ↕
          MQTT Broker (Mosquitto/HiveMQ)
                     ↕
            IoT Gateway/Bridge
                     ↕
         Physical IoT Bulbs (WiFi/Zigbee)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MQTT Broker** with WebSocket support (see [MQTT Broker Setup](#mqtt-broker-setup))
- **Modern Browser** (Chrome, Firefox, Safari, Edge - latest 2 versions)

### Installation

1. **Clone or download the project**
```bash
cd iot-bulb-control
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

The production files will be in the `dist/` folder, ready to deploy to any static hosting service.

## ⚙️ Configuration

### First Time Setup

1. **Open Settings** (click the gear icon in the header)

2. **Configure MQTT Broker**
   - **Broker URL**: Enter your MQTT broker WebSocket URL
     - Local: `ws://localhost:9001` or `ws://192.168.1.100:9001`
     - Remote: `wss://your-broker.com:8083`
   - **Client ID**: Auto-generated (can be customized)
   - **Username/Password**: Optional, if your broker requires authentication

3. **Test Connection**
   - Click "Test Connection" to verify settings
   - Connection status indicator will turn green when connected

4. **Save Settings**
   - Click "Save Settings"
   - App will auto-reconnect on next launch

### Adding Bulbs

#### Manual Addition
1. Click **"Add Bulb"** button in header
2. Enter **Bulb ID** (must match your bulb's MQTT identifier)
3. Optionally enter a friendly **Name** and **Room**
4. Click **"Add Bulb"**

#### Automatic Discovery
1. Click **"Add Bulb"** → **"Scan Network"**
2. App publishes discovery request to `bulb/discovery/request`
3. Bulbs respond on `bulb/+/discovery/response`
4. Select discovered bulbs to add

## 📡 MQTT Protocol

### Control Topics (Web App → Gateway)

```
bulb/<bulb_id>/control/power
  Payload: {"state": "ON"} or {"state": "OFF"}

bulb/<bulb_id>/control/brightness
  Payload: {"brightness": 75}  // 0-100

bulb/<bulb_id>/control/color
  Payload: {"color": "#FF5733"}

bulb/all/control/power
  Payload: {"state": "OFF"}  // Broadcast to all bulbs
```

### State Topics (Gateway → Web App)

```
bulb/<bulb_id>/state
  Payload: {
    "state": "ON",
    "brightness": 80,
    "color": "#FFFFFF",
    "timestamp": "2025-12-06T14:30:00Z"
  }

bulb/<bulb_id>/status
  Payload: {"online": true, "rssi": -45}
```

### Discovery Topics

```
bulb/discovery/request
  Payload: {}

bulb/+/discovery/response
  Payload: {
    "bulb_id": "bulb_005",
    "model": "RGB-Smart-Bulb-v2",
    "capabilities": ["power", "brightness", "color"]
  }
```

## 🔧 MQTT Broker Setup

### Option 1: Mosquitto (Self-Hosted)

**Install Mosquitto**
```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Windows
# Download from https://mosquitto.org/download/
```

**Configure WebSocket Support**

Edit `/etc/mosquitto/mosquitto.conf` (or `C:\Program Files\mosquitto\mosquitto.conf` on Windows):

```conf
# Standard MQTT port
listener 1883
protocol mqtt

# WebSocket port
listener 9001
protocol websockets

# Optional: Enable authentication
allow_anonymous false
password_file /etc/mosquitto/passwd
```

**Create Users (if authentication enabled)**
```bash
sudo mosquitto_passwd -c /etc/mosquitto/passwd mqtt_user
```

**Start Mosquitto**
```bash
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

**Test Connection**
```bash
# Terminal 1: Subscribe
mosquitto_sub -h localhost -t "test" -v

# Terminal 2: Publish
mosquitto_pub -h localhost -t "test" -m "Hello MQTT"
```

### Option 2: HiveMQ Cloud (Managed)

1. Sign up at [hivemq.com](https://www.hivemq.com/mqtt-cloud-broker/)
2. Create a free cluster
3. Note the WebSocket URL (e.g., `wss://xxxxx.s1.eu.hivemq.cloud:8884/mqtt`)
4. Create credentials in HiveMQ console
5. Use these settings in the app

### Option 3: Docker (Quickest for Testing)

```bash
docker run -d \
  --name mosquitto \
  -p 1883:1883 \
  -p 9001:9001 \
  eclipse-mosquitto:latest \
  mosquitto -c /mosquitto-no-auth.conf
```

Or with authentication:
```bash
docker run -d \
  --name mosquitto \
  -p 1883:1883 \
  -p 9001:9001 \
  -v $(pwd)/mosquitto.conf:/mosquitto/config/mosquitto.conf \
  eclipse-mosquitto:latest
```

## 🎮 Usage Guide

### Controlling Bulbs

**Power Toggle**
- Click the **ON/OFF** button on any bulb card
- Optimistic UI update provides instant feedback
- State confirmed when MQTT message received from gateway

**Brightness Control** (if supported)
- Drag the brightness slider
- Changes throttled to avoid flooding MQTT broker
- Final value sent when released

**Edit Bulb**
- Click the edit icon next to bulb name
- Type new name and press Enter
- Changes saved to IndexedDB immediately

**Delete Bulb**
- Click the trash icon
- Confirm deletion
- Bulb removed from database and unsubscribed from MQTT

### Organizing Bulbs

**Room Grouping**
- Assign rooms when adding bulbs
- Bulbs automatically grouped by room in the list
- Filter by room using the search bar

**Search**
- Search by bulb name or ID
- Real-time filtering as you type

**Show/Hide Offline Bulbs**
- Toggle "Show offline" checkbox
- Useful for hiding disconnected bulbs

### Data Management

**Export Data**
1. Open Settings
2. Click **"Export Data"**
3. JSON file downloads with all bulbs, settings, and history

**Import Data**
1. Open Settings
2. Click **"Import Data"**
3. Select previously exported JSON file
4. Page reloads with imported data

**Clear All Data**
1. Open Settings
2. Click **"Clear All Data"**
3. Confirm action (cannot be undone)
4. All bulbs, settings, and history deleted

## 🌐 Deployment

### Static Hosting (Recommended)

The app is a static SPA and can be deployed to any static hosting service:

**Netlify**
```bash
npm run build
# Drag dist/ folder to Netlify dashboard
# Or connect GitHub repo for auto-deploy
```

**Vercel**
```bash
npm run build
npx vercel --prod
```

**GitHub Pages**
```bash
npm run build
# Copy dist/ contents to gh-pages branch
```

**AWS S3 + CloudFront**
```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name
```

**Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Environment Variables (Optional)

Create `.env` file for default settings:

```env
VITE_MQTT_BROKER_URL=ws://localhost:9001
VITE_MQTT_USERNAME=mqtt_user
VITE_MQTT_PASSWORD=mqtt_pass
```

Access in code:
```javascript
const brokerUrl = import.meta.env.VITE_MQTT_BROKER_URL;
```

## 🛠️ Development

### Project Structure

```
iot-bulb-control/
├── src/
│   ├── components/       # React components
│   │   ├── Header.jsx
│   │   ├── ConnectionStatus.jsx
│   │   ├── BulbCard.jsx
│   │   ├── BulbList.jsx
│   │   ├── AddBulbDialog.jsx
│   │   └── SettingsPanel.jsx
│   ├── contexts/         # React contexts
│   │   └── AppContext.jsx
│   ├── hooks/            # Custom hooks
│   │   ├── useMQTT.js
│   │   └── useBulbs.js
│   ├── services/         # Business logic
│   │   ├── mqttService.js
│   │   └── dbService.js
│   ├── utils/            # Utilities
│   │   ├── constants.js
│   │   ├── validators.js
│   │   └── formatters.js
│   ├── App.jsx           # Root component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.js        # Vite config
├── tailwind.config.js    # Tailwind config
└── README.md             # This file
```

### Key Technologies

- **React 18** - UI framework with hooks
- **Vite** - Build tool and dev server
- **MQTT.js** - MQTT client for WebSocket connections
- **idb** - IndexedDB wrapper for persistence
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 🐛 Troubleshooting

### Connection Issues

**"Failed to connect to MQTT broker"**
- ✅ Check broker URL format (`ws://` or `wss://`)
- ✅ Verify broker is running: `mosquitto_sub -h localhost -t "#"`
- ✅ Check firewall allows WebSocket port (usually 9001 or 8083)
- ✅ Try with `allow_anonymous true` in Mosquitto config to rule out auth issues

**"Connection closes immediately"**
- ✅ Check browser console for CORS errors
- ✅ Ensure broker has `protocol websockets` listener
- ✅ Verify broker WebSocket port is different from MQTT port

### Bulb Control Issues

**"Bulb doesn't respond to commands"**
- ✅ Check bulb is online (green status indicator)
- ✅ Verify gateway is subscribed to control topics
- ✅ Test with MQTT CLI: `mosquitto_pub -t "bulb/test/control/power" -m '{"state":"ON"}'`
- ✅ Check MQTT topic naming matches your gateway implementation

**"State updates not appearing"**
- ✅ Ensure gateway publishes to `bulb/<id>/state` topic
- ✅ Check payload format matches expected JSON structure
- ✅ Verify app is subscribed (check browser console logs)

### Data Persistence Issues

**"Bulbs disappear after page refresh"**
- ✅ Check browser supports IndexedDB (all modern browsers do)
- ✅ Look for IndexedDB errors in console
- ✅ Try clearing browser data and re-adding bulbs
- ✅ Check storage quota hasn't been exceeded

**"Settings not saving"**
- ✅ Check browser allows IndexedDB for your domain
- ✅ Verify not in private/incognito mode (some browsers restrict storage)
- ✅ Check browser console for storage quota errors

### Network Issues

**"Works on LAN but not remotely"**
- ✅ Use `wss://` (secure WebSocket) for remote connections
- ✅ Ensure broker has valid SSL certificate
- ✅ Check broker allows external connections (not just localhost)
- ✅ Verify firewall rules on broker server

## 📚 API Reference

### IndexedDB Service

```javascript
import { 
  saveBulb, 
  getBulb, 
  getAllBulbs, 
  deleteBulb,
  exportData,
  importData 
} from './services/dbService';

// Add/update bulb
await saveBulb({
  bulb_id: 'bulb_001',
  name: 'Living Room Lamp',
  state: 'ON',
  brightness: 75
});

// Get all bulbs
const bulbs = await getAllBulbs();

// Export data
const backup = await exportData();
```

### MQTT Service

```javascript
import mqttService from './services/mqttService';

// Connect
mqttService.connect({
  url: 'ws://localhost:9001',
  clientId: 'webapp_client_123'
});

// Control bulb
await mqttService.controlPower('bulb_001', 'ON');
await mqttService.controlBrightness('bulb_001', 80);

// Subscribe to state
mqttService.subscribeToBulbState('bulb_001', (topic, payload) => {
  console.log('State update:', payload);
});
```

### Custom Hooks

```javascript
import { useBulbs } from './hooks/useBulbs';
import { useMQTT } from './hooks/useMQTT';

function MyComponent() {
  const { bulbs, toggleBulb, addBulb } = useBulbs();
  const { mqtt, connect, disconnect } = useMQTT();
  
  return (
    <div>
      {bulbs.map(bulb => (
        <button onClick={() => toggleBulb(bulb.bulb_id)}>
          {bulb.name}: {bulb.state}
        </button>
      ))}
    </div>
  );
}
```

## 🔒 Security Considerations

### Production Checklist

- ✅ Use **WSS** (secure WebSocket) for remote connections
- ✅ Enable MQTT **authentication** (username/password or certificates)
- ✅ Implement broker **ACLs** to restrict topic access
- ✅ Use **TLS/SSL** certificates (not self-signed in production)
- ✅ Validate and sanitize all user inputs
- ✅ Don't hardcode credentials in source code
- ✅ Use environment variables for sensitive settings
- ✅ Implement rate limiting on broker
- ✅ Regular security updates for dependencies

### Best Practices

- Store passwords securely (browser credential manager)
- Warn users about public WiFi risks
- Implement session timeouts
- Log security events
- Use HTTPS for web app deployment

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [MQTT.js](https://github.com/mqttjs/MQTT.js) - MQTT client library
- [idb](https://github.com/jakearchibald/idb) - IndexedDB wrapper
- [Lucide](https://lucide.dev/) - Beautiful icon library
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/iot-bulb-control/issues)
- **Documentation**: This README
- **MQTT Protocol**: [mqtt.org](https://mqtt.org/)

## 🎯 Roadmap

- [ ] PWA support for offline installation
- [ ] Voice control integration
- [ ] Automation rules and schedules
- [ ] Energy monitoring and statistics
- [ ] Scene management (save multiple bulb configurations)
- [ ] Group control (manage multiple bulbs as one)
- [ ] Color picker for RGB bulbs
- [ ] Notification system for bulb events
- [ ] Multi-language support
- [ ] Analytics dashboard

---

**Built with ❤️ for the IoT community**

For questions or issues, please open a GitHub issue or refer to the troubleshooting section above.
