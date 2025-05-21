// src/routes/api/auth/user/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get('session');
  
  if (!sessionId) {
    return json({ 
      authenticated: false 
    }, { status: 401 });
  }
  
  try {
    // Get user by ID (session cookie stores the user ID)
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    if (!user) {
      // Session exists but user doesn't - clear invalid session
      cookies.delete('session', { path: '/' });
      return json({ authenticated: false }, { status: 401 });
    }
    
    return json({
      authenticated: true,
      user
    });
    
  } catch (error) {
    console.error('Session validation error:', error);
    return json({ 
      authenticated: false,
      error: 'Failed to validate session' 
    }, { status: 500 });
  }
}