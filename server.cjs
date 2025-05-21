// server.cjs
const mqtt = require('mqtt');

console.log('Starting minimal MQTT client...');

// Connect to local MQTT broker
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', function() {
  console.log('MQTT client connected successfully');
});

client.on('error', function(error) {
  console.log('MQTT connection error:', error);
});

// Keep the process running
console.log('MQTT client is running...');