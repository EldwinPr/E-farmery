import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { verifyDeviceOwnership } from '$lib/server/deviceAuth';

const prisma = new PrismaClient();

// GET /api/devices/:id/sensors/latest - Get only the latest sensor reading
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
    const latestReading = await prisma.moistureReading.findFirst({
      where: {
        deviceId
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    if (!latestReading) {
      return json({ error: 'No sensor readings found' }, { status: 404 });
    }
    
    return json({ reading: latestReading });
  } catch (error) {
    console.error('Error fetching latest sensor reading:', error);
    return json({ error: 'Failed to fetch latest sensor reading' }, { status: 500 });
  }
};