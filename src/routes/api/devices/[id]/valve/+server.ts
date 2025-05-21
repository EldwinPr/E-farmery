import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { verifyDeviceOwnership } from '$lib/server/deviceAuth';

const prisma = new PrismaClient();

// POST /api/devices/:id/valve - Control the valve (on/off)
export const POST: RequestHandler = async ({ params, request, cookies }) => {
  const sessionId = cookies.get('session');
  
  if (!sessionId) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const deviceId = params.id;
  const { state, duration } = await request.json();
  
  // Verify ownership
  const isOwner = await verifyDeviceOwnership(deviceId, sessionId);
  if (!isOwner) {
    return json({ error: 'Device not found' }, { status: 404 });
  }
  
  // Basic validation
  if (typeof state !== 'boolean') {
    return json({ error: 'Valve state (true/false) is required' }, { status: 400 });
  }
  
  // Validate duration if provided
  let irrigationDuration = 0;
  if (state === true) {
    irrigationDuration = typeof duration === 'number' && duration > 0 ? duration : 60; // Default to 60 seconds
  }
  
  try {
    // Update device's lastSeen timestamp
    await prisma.device.update({
      where: {
        id: deviceId
      },
      data: {
        lastSeen: new Date()
      }
    });
    
    // Create irrigation event if turning on
    let irrigationEvent = null;
    if (state === true && deviceId) {
      irrigationEvent = await prisma.irrigationEvent.create({
        data: {
          deviceId: deviceId,
          duration: irrigationDuration,
          waterUsage: 0, // This will be updated when the valve is turned off
          automated: false // Manual control
        }
      });
    }
    
    // In a real implementation, this would send a command to the actual device
    // through MQTT or some other communication protocol
    
    return json({ 
      success: true, 
      valve: { state, deviceId },
      irrigationEvent
    });
    
  } catch (error) {
    console.error('Error controlling valve:', error);
    return json({ error: 'Failed to control valve' }, { status: 500 });
  }
};