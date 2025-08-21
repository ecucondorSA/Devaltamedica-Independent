import { TokenData } from '../types';

import { logger } from '@altamedica/shared/services/logger.service';
const TOKEN_STORAGE_KEY = 'altamedica_auth_tokens';
const USER_STORAGE_KEY = 'altamedica_user_data';

export class AuthStorage {
  static saveTokens(tokens: TokenData): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      logger.error('Error saving tokens to localStorage:', error);
    }
  }

  static getTokens(): TokenData | null {
    try {
      const tokens = localStorage.getItem(TOKEN_STORAGE_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      logger.error('Error reading tokens from localStorage:', error);
      return null;
    }
  }

  static clearTokens(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      logger.error('Error clearing tokens from localStorage:', error);
    }
  }

  static isTokenExpired(tokens: TokenData): boolean {
    return Date.now() >= tokens.expiresAt;
  }

  static saveUserData(userData: any): void {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      logger.error('Error saving user data to localStorage:', error);
    }
  }

  static getUserData(): any | null {
    try {
      const userData = localStorage.getItem(USER_STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      logger.error('Error reading user data from localStorage:', error);
      return null;
    }
  }
}

export const formatUserRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    patient: 'Paciente',
    doctor: 'Doctor',
    admin: 'Administrador',
    company: 'Empresa'
  };
  return roleMap[role] || role;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
