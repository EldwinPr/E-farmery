import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { verifyDeviceOwnership } from '$lib/server/deviceAuth';

const prisma = new PrismaClient();

// GET /api/devices/:id - Get device details
export const GET: RequestHandler = async ({ params, cookies }) => {
  const sessionId = cookies.get('session');
  
  if (!sessionId) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const deviceId = params.id;
  
  // Verify ownership
  const isOwner = await verifyDeviceOwnership(deviceId, sessionId);
  if (!isOwner) {
    return json({ error: 'Device not found' }, { status: 404 });
  }
  
  try {
    const device = await prisma.device.findUnique({
      where: {
        id: deviceId
      },
      select: {
        id: true,
        name: true,
        location: true,
        isOnline: true,
        lastSeen: true
      }
    });
    
    if (!device) {
      return json({ error: 'Device not found' }, { status: 404 });
    }
    
    return json({ device });
  } catch (error) {
    console.error('Error fetching device:', error);
    return json({ error: 'Failed to fetch device details' }, { status: 500 });
  }
};

// DELETE /api/devices/:id - Remove a device
export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const sessionId = cookies.get('session');
  
  if (!sessionId) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const deviceId = params.id;
  
  // Verify ownership
  const isOwner = await verifyDeviceOwnership(deviceId, sessionId);
  if (!isOwner) {
    return json({ error: 'Device not found' }, { status: 404 });
  }
  
  try {
    await prisma.device.delete({
      where: {
        id: deviceId
      }
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    return json({ error: 'Failed to delete device' }, { status: 500 });
  }
};