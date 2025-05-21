import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { verifyDeviceOwnership } from '$lib/server/deviceAuth';

const prisma = new PrismaClient();

// GET /api/devices/:id/sensors - Get all sensor readings for a device
export const GET: RequestHandler = async ({ params, url, cookies }) => {
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
  
  // Parse query parameters for pagination
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');
  const limit = limitParam ? parseInt(limitParam) : 50;
  const offset = offsetParam ? parseInt(offsetParam) : 0;
  
  try {
    const moistureReadings = await prisma.moistureReading.findMany({
      where: {
        deviceId
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });
    
    const total = await prisma.moistureReading.count({
      where: {
        deviceId
      }
    });
    
    return json({
      readings: moistureReadings,
      pagination: {
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    return json({ error: 'Failed to fetch sensor readings' }, { status: 500 });
  }
};

// POST /api/devices/:id/sensors - Record new sensor reading
export const POST: RequestHandler = async ({ params, request, cookies }) => {
  const sessionId = cookies.get('session');
  
  if (!sessionId) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const deviceId = params.id;
  if (!deviceId) {
    return json({ error: 'Device ID is required' }, { status: 400 });
  }
  
  const { value } = await request.json();
  
  // Verify ownership
  const isOwner = await verifyDeviceOwnership(deviceId, sessionId);
  if (!isOwner) {
    return json({ error: 'Device not found' }, { status: 404 });
  }
  
  // Basic validation
  if (typeof value !== 'number' || value < 0 || value > 100) {
    return json({ error: 'Valid moisture value (0-100) is required' }, { status: 400 });
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
    
    // Create new moisture reading
    const reading = await prisma.moistureReading.create({
      data: {
        deviceId,
        value
      }
    });
    
    return json({ reading }, { status: 201 });
  } catch (error) {
    console.error('Error recording sensor reading:', error);
    return json({ error: 'Failed to record sensor reading' }, { status: 500 });
  }
};