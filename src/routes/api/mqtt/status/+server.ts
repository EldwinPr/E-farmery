import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMqttClient } from '$lib/server/mqtt-client';

export const GET: RequestHandler = async () => {
  try {
    const client = getMqttClient();
    const connected = client?.connected || false;
    
    return json({
      connected,
      message: connected 
        ? 'MQTT client is connected to the broker' 
        : 'MQTT client is not connected'
    });
  } catch (error) {
    console.error('Error checking MQTT status:', error);
    return json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
