// TODO: Definir UserRole en @altamedica/types
// Stub temporal para permitir el build
enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export { UserRole };

export interface RolePermissions {
  canAccessPatientPortal: boolean;
  canAccessDoctorPortal: boolean;
  canAccessCompanyPortal: boolean;
  canAccessAdminPanel: boolean;
  canManageAppointments: boolean;
  canViewMedicalRecords: boolean;
  canPrescribeMedication: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageBilling: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.PATIENT]: {
    canAccessPatientPortal: true,
    canAccessDoctorPortal: false,
    canAccessCompanyPortal: false,
    canAccessAdminPanel: false,
    canManageAppointments: true,
    canViewMedicalRecords: true,
    canPrescribeMedication: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageBilling: true,
  },
  [UserRole.DOCTOR]: {
    canAccessPatientPortal: false,
    canAccessDoctorPortal: true,
    canAccessCompanyPortal: false,
    canAccessAdminPanel: false,
    canManageAppointments: true,
    canViewMedicalRecords: true,
    canPrescribeMedication: true,
    canManageUsers: false,
    canViewAnalytics: true,
    canManageBilling: true,
  },
  [UserRole.COMPANY]: {
    canAccessPatientPortal: false,
    canAccessDoctorPortal: false,
    canAccessCompanyPortal: true,
    canAccessAdminPanel: false,
    canManageAppointments: true,
    canViewMedicalRecords: false,
    canPrescribeMedication: false,
    canManageUsers: true,
    canViewAnalytics: true,
    canManageBilling: true,
  },
  [UserRole.ADMIN]: {
    canAccessPatientPortal: true,
    canAccessDoctorPortal: true,
    canAccessCompanyPortal: true,
    canAccessAdminPanel: true,
    canManageAppointments: true,
    canViewMedicalRecords: true,
    canPrescribeMedication: false,
    canManageUsers: true,
    canViewAnalytics: true,
    canManageBilling: true,
  },
};

// Route definitions for each role
export const ROLE_ROUTES: Partial<Record<UserRole, string>> = {
  [UserRole.PATIENT]: '/patients/dashboard',
  [UserRole.DOCTOR]: '/doctors/dashboard',
  [UserRole.COMPANY]: '/companies/dashboard',
  [UserRole.ADMIN]: '/admin/dashboard',
};

// Application mapping for each role
export const ROLE_APPS: Partial<Record<UserRole, string>> = {
  [UserRole.PATIENT]: 'patients',
  [UserRole.DOCTOR]: 'doctors',
  [UserRole.COMPANY]: 'companies',
  [UserRole.ADMIN]: 'admin',
};
