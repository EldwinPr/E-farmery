// src/routes/api/auth/login/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Verify password
function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, storedHash] = hashedPassword.split(':');
  const hash = crypto.createHash('sha256').update(salt + password).digest('hex');
  return hash === storedHash;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { email, password } = await request.json();
  
  // Basic validation
  if (!email || !password) {
    return json({ error: 'Email and password are required' }, { status: 400 });
  }
  
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    // Check if user exists and password is correct
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    // Set session cookie
    cookies.set('session', user.id, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Return user data (excluding password hash)
    const { passwordHash, ...userData } = user;
    
    return json({
      success: true,
      user: userData
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Failed to log in' }, { status: 500 });
  }
}