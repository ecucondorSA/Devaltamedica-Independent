/**
 * CRITICAL HIPAA COMPLIANCE VALIDATOR
 *
 * ⚠️ WARNING: This is a STUB implementation.
 * Real implementation requires legal and compliance expertise.
 * DO NOT USE IN PRODUCTION without proper legal review and HIPAA compliance validation.
 */
export interface PHIData {
    patientId: string;
    medicalRecordNumber: string;
    socialSecurityNumber?: string;
    dateOfBirth: string;
    fullName: string;
    medicalData: any;
}
export interface HIPAAValidation {
    isCompliant: boolean;
    violations: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
}
export interface EncryptionStatus {
    isEncrypted: boolean;
    encryptionAlgorithm?: string;
    keyManagement: 'secure' | 'insecure';
}
export interface AccessControlCheck {
    userId: string;
    accessLevel: string;
    isAuthorized: boolean;
    lastAccess?: Date;
}
export interface AuditLogEntry {
    timestamp: Date;
    userId: string;
    action: string;
    resourceId: string;
    ipAddress: string;
    userAgent: string;
}
export interface ConsentRecord {
    patientId: string;
    consentType: string;
    grantedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
}
export declare class HIPAAComplianceError extends Error {
    constructor(message: string);
}
export declare function validateHIPAACompliance(data: PHIData): HIPAAValidation;
export declare function scanForPHI(data: any): string[];
export declare function validateDataEncryption(data: any): EncryptionStatus;
export declare function checkAccessControls(userId: string, resourceId: string): AccessControlCheck;
export declare function validateAuditTrail(entries: AuditLogEntry[]): boolean;
export declare function checkConsentManagement(patientId: string): ConsentRecord[];
export declare function validateDataMinimization(requestedData: string[], requiredData: string[]): boolean;
export declare function validateBreachNotification(incident: any): boolean;
//# sourceMappingURL=hipaa-compliance-validation.d.ts.map