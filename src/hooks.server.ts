import type { Handle } from '@sveltejs/kit';
// Remove the MQTT client import for now - we'll handle it with our test page

// Extend the App.Locals interface to include userId
declare global {
  namespace App {
    interface Locals {
      userId: string | null;
    }
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  // Get the user ID from the session cookie
  const sessionId = event.cookies.get('session');
  event.locals.userId = sessionId ?? null;
  
  return await resolve(event);
};