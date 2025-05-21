// src/routes/api/auth/register/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Simple password hashing
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(8).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { name, email, password } = await request.json();
  
  // Basic validation
  if (!name || !email || !password) {
    return json({ error: 'Name, email, and password are required' }, { status: 400 });
  }
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return json({ error: 'User with this email already exists' }, { status: 400 });
    }
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password)
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    // Set a simple session cookie
    cookies.set('session', newUser.id, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    return json({ 
      success: true,
      user: newUser
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return json({ error: 'Failed to register user' }, { status: 500 });
  }
}