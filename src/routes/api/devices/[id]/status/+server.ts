import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { verifyDeviceOwnership } from '$lib/server/deviceAuth';

const prisma = new PrismaClient();

// PUT /api/devices/:id/status - Update device status
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
  const sessionId = cookies.get('session');
  
  if (!sessionId) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const deviceId = params.id;
  const { isOnline } = await request.json();
  
  // Verify ownership
  const isOwner = await verifyDeviceOwnership(deviceId, sessionId);
  if (!isOwner) {
    return json({ error: 'Device not found' }, { status: 404 });
  }
  
  // Basic validation
  if (typeof isOnline !== 'boolean') {
    return json({ error: 'Device status (isOnline) must be a boolean' }, { status: 400 });
  }
  
  try {
    const device = await prisma.device.update({
      where: {
        id: deviceId
      },
      data: {
        isOnline: isOnline,
        lastSeen: isOnline ? new Date() : undefined
      },
      select: {
        id: true,
        name: true,
        isOnline: true,
        lastSeen: true
      }
    });
    
    return json({ device });
  } catch (error) {
    console.error('Error updating device status:', error);
    return json({ error: 'Failed to update device status' }, { status: 500 });
  }
};