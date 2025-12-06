# Quick Start Guide - IoT Bulb Control

## 🚀 Get Started in 3 Minutes

### Step 1: Start the Application

```bash
cd iot-bulb-control
npm run dev
```

Open your browser to: **http://localhost:5173**

### Step 2: Set Up MQTT Broker (Testing)

**Option A: Use Public Test Broker** (Easiest - No Setup Required)
- In Settings, use: `ws://test.mosquitto.org:8080`
- No authentication needed
- ⚠️ Not for production use

**Option B: Local Mosquitto** (Recommended for Testing)

1. **Install Mosquitto:**
   - Windows: Download from https://mosquitto.org/download/
   - Mac: `brew install mosquitto`
   - Linux: `sudo apt-get install mosquitto`

2. **Start with WebSocket support:**
   ```bash
   mosquitto -c mosquitto.conf
   ```

3. **Test it's working:**
   ```bash
   # Terminal 1
   mosquitto_sub -h localhost -t "test"
   
   # Terminal 2
   mosquitto_pub -h localhost -t "test" -m "Hello"
   ```

### Step 3: Configure the App

1. Click **Settings** (⚙️ icon)
2. Enter MQTT Broker URL: `ws://localhost:9001`
3. Click **Test Connection**
4. Click **Save Settings**

### Step 4: Add Your First Bulb

1. Click **"Add Bulb"** button
2. Enter:
   - **Bulb ID**: `bulb_001`
   - **Name**: `Test Lamp`
   - **Room**: `Living Room`
3. Click **"Add Bulb"**

### Step 5: Test with Simulator (Optional)

If you want to simulate bulbs for testing:

1. **Install Python MQTT library:**
   ```bash
   pip install paho-mqtt
   ```

2. **Run the gateway simulator:**
   ```bash
   python gateway_simulator.py
   ```

3. **The simulator will:**
   - Create 3 test bulbs (bulb_001, bulb_002, bulb_003)
   - Respond to control commands
   - Publish state updates

4. **Try it:**
   - Add one of the simulated bulbs in the web app
   - Toggle it ON/OFF
   - See the simulator respond in the terminal

## 📱 What You Can Do Now

✅ **Add multiple bulbs** with unique IDs  
✅ **Control power** - Toggle ON/OFF  
✅ **Adjust brightness** - Use the slider  
✅ **Organize by rooms** - Group your bulbs  
✅ **Search bulbs** - Find them quickly  
✅ **Export/Import data** - Backup your configuration  
✅ **Dark mode** - Toggle in settings  

## 🔧 Troubleshooting

### "Cannot connect to MQTT broker"
- ✅ Make sure Mosquitto is running: `ps aux | grep mosquitto`
- ✅ Check the WebSocket port is correct (usually 9001)
- ✅ Try the test broker: `ws://test.mosquitto.org:8080`

### "Bulb doesn't respond"
- ✅ Make sure you're using the simulator or real gateway
- ✅ Check the bulb ID matches exactly
- ✅ Look at browser console (F12) for errors

### "Settings not saving"
- ✅ Check browser allows IndexedDB (not in private mode)
- ✅ Clear browser cache and try again

## 🌐 Deploy to Production

### Build for deployment:
```bash
npm run build
```

### Deploy the `dist/` folder to:
- **Netlify**: Drag and drop `dist/` folder
- **Vercel**: `npx vercel --prod`
- **GitHub Pages**: Copy to gh-pages branch
- **Any static host**: Upload `dist/` contents

### For production MQTT:
- Use **WSS** (secure WebSocket): `wss://your-broker.com:8083`
- Enable **authentication** on your broker
- Use **SSL/TLS certificates**
- Never use test brokers for production!

## 📚 Next Steps

1. **Read the full README.md** for detailed documentation
2. **Connect real IoT bulbs** via your gateway
3. **Customize the UI** - Edit components in `src/components/`
4. **Add features** - Extend with your own functionality

## 🎯 Example MQTT Messages

### Turn bulb ON:
```bash
mosquitto_pub -t "bulb/bulb_001/control/power" -m '{"state":"ON"}'
```

### Set brightness to 75%:
```bash
mosquitto_pub -t "bulb/bulb_001/control/brightness" -m '{"brightness":75}'
```

### Publish state (from gateway):
```bash
mosquitto_pub -t "bulb/bulb_001/state" -m '{"state":"ON","brightness":75,"timestamp":"2025-12-06T14:30:00Z"}' -r
```

## 💡 Pro Tips

- Use **retained messages** for state topics (add `-r` flag)
- Set **QoS 1** for reliable delivery
- Use **clean=false** for persistent sessions
- Test with **MQTT Explorer** GUI tool for debugging

---

**Need help?** Check the full README.md or open an issue on GitHub!
