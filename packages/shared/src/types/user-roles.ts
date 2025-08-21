// TODO: Definir UserRole en @altamedica/types
// Stub temporal para permitir el build
enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export { UserRole };

/**
 * Mapeo de roles a nombres legibles
 */
export const UserRoleNames: Record<UserRole, string> = {
  [UserRole.PATIENT]: 'Paciente',
  [UserRole.DOCTOR]: 'Doctor',
  [UserRole.COMPANY]: 'Empresa',
  [UserRole.ADMIN]: 'Administrador',
};

/**
 * Verificar si un rol tiene permisos de administrador
 */
export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Verificar si un rol es médico
 */
export function isMedicalRole(role: UserRole): boolean {
  return role === UserRole.DOCTOR;
}

/**
 * Obtener la URL de redirección por defecto para cada rol
 */
export function getDefaultRedirectUrl(role: UserRole): string {
  if (role === UserRole.ADMIN) return '/admin';
  return '/dashboard';
}

/**
 * Obtener el puerto de la aplicación por rol (desarrollo)
 */
export function getAppPortByRole(role: UserRole): number {
  switch (role) {
    case UserRole.DOCTOR:
      return 3002;
    case UserRole.PATIENT:
      return 3003;
    case UserRole.COMPANY:
      return 3004;
    case UserRole.ADMIN:
      return 3005;
    default:
      return 3000;
  }
}
