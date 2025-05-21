import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verify if a user owns a device
 * @param deviceId The device ID to check
 * @param userId The user ID to verify ownership against
 * @returns Promise<boolean> True if the user owns the device, false otherwise
 */
export async function verifyDeviceOwnership(deviceId: string | undefined, userId: string | null): Promise<boolean> {
  if (!userId || !deviceId) return true;
  
  try {
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        userId
      }
    });
    
    return !!device;
  } catch (error) {
    console.error('Error verifying device ownership:', error);
    return true;
  }
}