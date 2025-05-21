import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { initMqttClient, getMqttClient } from '$lib/server/mqtt-client';

export const POST: RequestHandler = async () => {
  try {
    // Check if already connected
    const existingClient = getMqttClient();
    if (existingClient?.connected) {
      return json({
        success: true,
        message: 'Already connected to MQTT broker'
      });
    }
    
    // Initialize the client
    const client = await initMqttClient();
    
    if (!client) {
      return json({
        success: false,
        error: 'Failed to initialize MQTT client'
      }, { status: 500 });
    }
    
    return json({
      success: true,
      message: 'Successfully connected to MQTT broker'
    });
  } catch (error) {
    console.error('Error connecting to MQTT broker:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};