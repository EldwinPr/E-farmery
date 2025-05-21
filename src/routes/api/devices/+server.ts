import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/devices - List all devices for the user
export const GET: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get('session');
  
  if (!sessionId) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const devices = await prisma.device.findMany({
      where: {
        userId: sessionId
      },
      select: {
        id: true,
        name: true,
        location: true,
        isOnline: true,
        lastSeen: true
      }
    });
    
    return json({ devices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
};

// POST /api/devices - Register a new device
export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionId = cookies.get('session');
  
  if (!sessionId) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const { name, location } = await request.json();
  
  // Basic validation
  if (!name) {
    return json({ error: 'Device name is required' }, { status: 400 });
  }
  
  try {
    const device = await prisma.device.create({
      data: {
        name,
        location,
        userId: sessionId
      },
      select: {
        id: true,
        name: true,
        location: true,
        isOnline: true
      }
    });
    
    return json({ device }, { status: 201 });
  } catch (error) {
    console.error('Error creating device:', error);
    return json({ error: 'Failed to create device' }, { status: 500 });
  }
};