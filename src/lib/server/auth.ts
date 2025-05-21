import type { RequestEvent } from '@sveltejs/kit';
import { prisma } from './prisma';

/**
 * Get the current authenticated user ID from the request.
 * In a production app, this would verify JWT tokens or session cookies.
 */
export async function getUserId(event: RequestEvent): Promise<string | null> {
  const sessionToken = event.cookies.get('session');
  
  if (!sessionToken) {
    return null;
  }
  
  try {
    // In a real app, you would verify the session token
    // and retrieve the associated user ID
    
    // For now, we'll just return a placeholder for testing
    return 'test-user-id';
    
    // Production implementation might look like:
    // const session = await prisma.session.findUnique({
    //   where: { token: sessionToken },
    //   include: { user: true }
    // });
    //
    // if (!session || session.expires < new Date()) {
    //   return null;
    // }
    //
    // return session.userId;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Middleware to check if user is authenticated.
 * Returns an error response if not authenticated, or null if authenticated.
 */
export async function requireAuth(event: RequestEvent) {
  const userId = await getUserId(event);
  
  if (!userId) {
    return new Response(JSON.stringify({ 
      error: 'Authentication required' 
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  return null; // No error, continue processing
}

/**
 * Verify if a user owns a particular device.
 */
export async function verifyDeviceOwnership(deviceId: string, userId: string) {
  const device = await prisma.device.findFirst({
    where: {
      id: deviceId,
      userId
    }
  });
  
  return !!device;
}

/**
 * Verify if a user owns a particular schedule.
 */
export async function verifyScheduleOwnership(scheduleId: string, userId: string) {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      userId
    }
  });
  
  return !!schedule;
}