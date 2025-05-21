import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/devices - List all devices 
export const GET: RequestHandler = async () => {
  try {
    // Fetch all devices regardless of user
    const devices = await prisma.device.findMany({
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
export const POST: RequestHandler = async ({ request }) => {
  const { name, location } = await request.json();
  
  // Basic validation
  if (!name) {
    return json({ error: 'Device name is required' }, { status: 400 });
  }
  
  try {
    // Create the device without specifying a userId
    const device = await prisma.device.create({
      data: {
        name,
        location: location || ""
        // No userId needed anymore since it's optional
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