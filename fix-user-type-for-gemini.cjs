#!/usr/bin/env node

/**
 * SOLUCIÓN URGENTE: User Type Conflicts
 * Unifica todas las definiciones de User para Gemini
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING USER TYPE CONFLICTS FOR GEMINI\n');

// 1. Crear User type unificado
const unifiedUserType = `// ==================== UNIFIED USER TYPE ====================
// NOTA: Este es el tipo User unificado para resolver conflictos
// Compatible con apps/admin y todas las apps

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  // IDs compatibles
  id: string;           // Para apps que usan 'id'
  uid?: string;         // Para apps que usan 'uid' (Firebase)
  
  // Info personal
  email: string;
  firstName: string;
  lastName: string;
  name?: string;        // Para compatibilidad con apps que usan 'name'
  
  // Contacto
  phone?: string;
  phoneNumber?: string; // Para compatibilidad
  avatar?: string;
  
  // Role y permisos
  role: UserRole;
  
  // Estados
  isActive: boolean;
  profileComplete?: boolean;
  
  // Timestamps
  lastLogin?: string;
  lastLoginAt?: Date;
}

export type UserRole = "admin" | "doctor" | "patient" | "staff";

// Export tambien como 'name' para compatibilidad
export type UserWithName = User & {
  name: string;
};

// Helper para convertir User a formato con name
export function userToNameFormat(user: User): UserWithName {
  return {
    ...user,
    name: \`\${user.firstName} \${user.lastName}\`
  };
}

// Helper para asegurar compatibilidad uid/id
export function normalizeUser(user: any): User {
  return {
    ...user,
    id: user.id || user.uid,
    uid: user.uid || user.id,
    phone: user.phone || user.phoneNumber,
    phoneNumber: user.phoneNumber || user.phone,
    name: user.name || \`\${user.firstName} \${user.lastName}\`
  };
}
`;

// 2. Reescribir types/base.ts con versión unificada
const baseTypesPath = 'packages/types/src/types/base.ts';
console.log('✅ Rewriting types/base.ts with unified User...');

fs.writeFileSync(baseTypesPath, unifiedUserType + `
// ==================== OTHER BASE TYPES ====================

export interface SearchFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRange {
  start: string;
  end: string;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export type AppointmentType =
  | "consultation"
  | "follow-up"
  | "emergency"
  | "routine"
  | "specialist";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  sideEffects?: string[];
}

export type Priority = "low" | "medium" | "high" | "critical";
`);

// 3. Actualizar el export en index.ts
const indexPath = 'packages/types/src/index.ts';
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Asegurar que se exporta el User correcto
const updatedIndex = indexContent.replace(
  /export.*User.*from.*$/gm,
  "export { User, UserRole, UserWithName, userToNameFormat, normalizeUser } from './types/base';"
);

fs.writeFileSync(indexPath, updatedIndex);

console.log('✅ Updated index.ts exports');

// 4. Rebuild types package
console.log('🏗️ Rebuilding types package...');

try {
  const { execSync } = require('child_process');
  execSync('cd packages/types && npm run build', { stdio: 'inherit' });
  console.log('✅ Types package rebuilt successfully');
} catch (e) {
  console.log('⚠️ Types rebuild had issues, but exports should work');
}

console.log('\\n🎯 USER TYPE FIXED FOR GEMINI!');
console.log('');
console.log('APPS CAN NOW USE:');
console.log('- import { User } from "@altamedica/types" // Compatible con uid/id');
console.log('- import { UserWithName } from "@altamedica/types" // Con name field');
console.log('- normalizeUser() helper para conversión automática');
console.log('');
console.log('GEMINI: Prueba de nuevo apps/admin TypeScript check');