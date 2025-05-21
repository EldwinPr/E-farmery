// src/lib/server/mqtt-client.ts
import mqtt from 'mqtt';
import type { MqttClient, IClientOptions } from 'mqtt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let mqttClient: MqttClient | null = null;
const BROKER_URL = 'mqtt://localhost:1883';

// Get the current MQTT client instance (or null if not initialized)
export function getMqttClient(): MqttClient | null {
  return mqttClient;
}

// Initialize the MQTT client
export async function initMqttClient(): Promise<MqttClient | null> {
  // If already connected, return existing client
  if (mqttClient?.connected) {
    console.log('MQTT client already connected');
    return mqttClient;
  }
  
  // If client exists but is not connected, end it
  if (mqttClient) {
    console.log('Ending existing MQTT client');
    mqttClient.end();
    mqttClient = null;
  }
  
  console.log(`Connecting to MQTT broker at ${BROKER_URL}...`);
  
  try {
    // Create a new client
    mqttClient = mqtt.connect(BROKER_URL, {
      clientId: 'e-farmery-' + Math.random().toString(16).substring(2, 10),
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 1000
    });
    
    // Wait for connection to establish
    await new Promise<void>((resolve, reject) => {
      // Set timeout to avoid hanging
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      mqttClient?.once('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Connected to MQTT broker');
        resolve();
      });
      
      mqttClient?.once('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ MQTT connection error:', err);
        reject(err);
      });
    });
    
    // Set up event handlers
    mqttClient.on('message', async (topic, message) => {
      console.log(`📩 Received MQTT message: ${topic} -> ${message.toString()}`);
      
      // Handle moisture sensor messages
      if (topic.match(/^e-farmery\/device\/(.+)\/moisture$/)) {
        const deviceId = topic.split('/')[2];
        const value = parseFloat(message.toString());
        
        if (!isNaN(value)) {
          console.log(`💾 Saving moisture reading: ${value}% for device ${deviceId}`);
          
          try {
            // Save to database
            await prisma.moistureReading.create({
              data: {
                deviceId,
                value
              }
            });
            
            // Update device's last seen timestamp
            await prisma.device.update({
              where: { id: deviceId },
              data: { 
                lastSeen: new Date(),
                isOnline: true
              }
            });
          } catch (error) {
            console.error('Error saving moisture reading:', error);
          }
        }
      }
    });
    
    mqttClient.on('error', (error) => {
      console.error('❌ MQTT error:', error);
    });
    
    mqttClient.on('close', () => {
      console.log('❗ MQTT connection closed');
    });
    
    // Subscribe to moisture sensor topics
    mqttClient.subscribe('e-farmery/device/+/moisture', (err) => {
      if (err) {
        console.error('❌ Failed to subscribe to moisture topics:', err);
      } else {
        console.log('✅ Subscribed to moisture sensor topics');
      }
    });
    
    return mqttClient;
  } catch (error) {
    console.error('❌ Failed to initialize MQTT client:', error);
    
    // Clean up if there was an error
    if (mqttClient) {
      mqttClient.end();
      mqttClient = null;
    }
    
    return null;
  }
}

// Function to control valve
export function controlValve(deviceId: string, state: boolean): boolean {
  if (!mqttClient?.connected) {
    console.error('❌ MQTT client not connected, cannot control valve');
    return false;
  }
  
  const topic = `e-farmery/device/${deviceId}/valve`;
  const message = state ? 'on' : 'off';
  
  console.log(`📤 Sending valve command: ${topic} -> ${message}`);
  
  mqttClient.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to publish valve command:', err);
    } else {
      console.log('✅ Successfully published valve command');
    }
  });
  
  return true;
}