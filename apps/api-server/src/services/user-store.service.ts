/**
 * In-memory user store MFA (placeholder hasta persistencia real)
 * GAP-002 soporte T3-T5
 */

interface MfaData {
  mfaSecretHash?: string;
  mfaSecretEnc?: string;
  mfaSecretVersion?: number;
  mfaEnabled?: boolean;
  mfaPendingVerification?: boolean;
  mfaFailedAttempts?: number;
  mfaLockUntil?: number; // epoch ms
  mfaLastVerifiedAt?: number;
}

const users = new Map<string, MfaData>();

export function getUserStore() {
  return {
    updateUserMfa: async (userId: string, data: {
      mfaSecretHash?: string;
      mfaSecretEnc?: string;
      mfaSecretVersionIncrement?: boolean;
      mfaPendingVerification?: boolean;
      mfaEnabled?: boolean;
      resetFailures?: boolean;
    }) => {
      const existing = users.get(userId) || {};
      const next: MfaData = { ...existing };
      if (data.mfaSecretHash !== undefined) next.mfaSecretHash = data.mfaSecretHash;
      if (data.mfaSecretEnc !== undefined) next.mfaSecretEnc = data.mfaSecretEnc;
      if (data.mfaSecretVersionIncrement) next.mfaSecretVersion = (existing.mfaSecretVersion || 0) + 1;
      if (data.mfaPendingVerification !== undefined) next.mfaPendingVerification = data.mfaPendingVerification;
      if (data.mfaEnabled !== undefined) next.mfaEnabled = data.mfaEnabled;
      if (data.resetFailures) { next.mfaFailedAttempts = 0; next.mfaLockUntil = undefined; }
      users.set(userId, next);
    },
    clearUserMfa: async (userId: string) => {
      const existing = users.get(userId) || {};
      users.set(userId, { mfaSecretVersion: existing.mfaSecretVersion || 0, mfaEnabled: false, mfaPendingVerification: false });
    },
    getUserMfa: async (userId: string) => users.get(userId),
    recordFailedAttempt: async (userId: string, maxAttempts = 5, lockMinutes = 5) => {
      const existing = users.get(userId) || {};
      existing.mfaFailedAttempts = (existing.mfaFailedAttempts || 0) + 1;
      if (existing.mfaFailedAttempts >= maxAttempts) {
        existing.mfaLockUntil = Date.now() + lockMinutes * 60 * 1000;
      }
      users.set(userId, existing);
      return existing;
    },
    markVerified: async (userId: string) => {
      const existing = users.get(userId) || {};
      existing.mfaEnabled = true;
      existing.mfaPendingVerification = false;
      existing.mfaFailedAttempts = 0;
      existing.mfaLockUntil = undefined;
      existing.mfaLastVerifiedAt = Date.now();
      users.set(userId, existing);
    }
  };
}
