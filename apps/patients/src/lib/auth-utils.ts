import { UserRole } from '@altamedica/types';
import { headers } from 'next/headers';

import { logger } from '@altamedica/shared';
export interface UserInfo {
  uid: string;
  email: string;
  userType: UserRole;
  roles: string[];
}

/**
 * Gets user info from middleware headers
 * This should be called in Server Components only
 */
export async function getUserFromHeaders(): Promise<UserInfo | null> {
  try {
    const headersList = await headers();
    
    const uid = headersList.get('x-user-uid');
    const email = headersList.get('x-user-email');
    const userType = headersList.get('x-user-type') as UserRole;
    const rolesStr = headersList.get('x-user-roles');
    
    if (!uid || !email || !userType) {
      return null;
    }
    
    const roles = rolesStr ? JSON.parse(rolesStr) : [];
    
    return {
      uid,
      email,
      userType,
      roles,
    };
  } catch (error) {
    logger.error('Error getting user from headers:', error);
    return null;
  }
}

/**
 * Checks if user is authenticated based on headers
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUserFromHeaders();
  return user !== null;
}