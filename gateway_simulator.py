# Sample Gateway/Simulator Script for Testing
# This simulates an IoT gateway that responds to bulb control commands

import paho.mqtt.client as mqtt
import json
import time
from datetime import datetime

# Configuration
BROKER = "localhost"
PORT = 1883
BULBS = ["bulb_001", "bulb_002", "bulb_003"]

# Bulb states
bulb_states = {
    bulb_id: {
        "state": "OFF",
        "brightness": 100,
        "color": "#FFFFFF",
        "online": True
    }
    for bulb_id in BULBS
}

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    # Subscribe to all control topics
    client.subscribe("bulb/+/control/#")
    client.subscribe("bulb/discovery/request")
    
    # Publish initial states
    for bulb_id in BULBS:
        publish_state(client, bulb_id)
        publish_status(client, bulb_id)

def on_message(client, userdata, msg):
    topic = msg.topic
    payload = json.loads(msg.payload.decode())
    
    print(f"Received: {topic} -> {payload}")
    
    # Handle discovery
    if topic == "bulb/discovery/request":
        for bulb_id in BULBS:
            response = {
                "bulb_id": bulb_id,
                "model": "Smart-Bulb-v1",
                "capabilities": ["power", "brightness", "color"]
            }
            client.publish(f"bulb/{bulb_id}/discovery/response", json.dumps(response))
        return
    
    # Parse topic
    parts = topic.split('/')
    if len(parts) < 4:
        return
    
    bulb_id = parts[1]
    command = parts[3]
    
    if bulb_id not in bulb_states:
        return
    
    # Handle commands
    if command == "power":
        bulb_states[bulb_id]["state"] = payload.get("state", "OFF")
    elif command == "brightness":
        bulb_states[bulb_id]["brightness"] = payload.get("brightness", 100)
    elif command == "color":
        bulb_states[bulb_id]["color"] = payload.get("color", "#FFFFFF")
    
    # Publish updated state
    time.sleep(0.1)  # Simulate processing delay
    publish_state(client, bulb_id)

def publish_state(client, bulb_id):
    state = bulb_states[bulb_id]
    payload = {
        "state": state["state"],
        "brightness": state["brightness"],
        "color": state["color"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    client.publish(f"bulb/{bulb_id}/state", json.dumps(payload), qos=1, retain=True)

def publish_status(client, bulb_id):
    state = bulb_states[bulb_id]
    payload = {
        "online": state["online"],
        "rssi": -45,
        "uptime": int(time.time())
    }
    client.publish(f"bulb/{bulb_id}/status", json.dumps(payload), qos=1)

# Create MQTT client
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

# Connect and loop
print(f"Connecting to {BROKER}:{PORT}...")
client.connect(BROKER, PORT, 60)
print("Gateway simulator running. Press Ctrl+C to stop.")

try:
    client.loop_forever()
except KeyboardInterrupt:
    print("\nStopping gateway simulator...")
    client.disconnect()
