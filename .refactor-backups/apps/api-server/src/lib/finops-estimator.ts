import { z } from 'zod';

// Firebase pricing tiers (as of 2024)
export const FIREBASE_PRICING = {
  firestore: {
    reads: 0.06 / 100000, // $0.06 per 100K reads
    writes: 0.18 / 100000, // $0.18 per 100K writes
    deletes: 0.02 / 100000, // $0.02 per 100K deletes
    storage: 0.18 / (1024 * 1024 * 1024), // $0.18 per GiB/month
  },
  auth: {
    monthlyCost: 0.0055, // $0.0055 per monthly active user (MAU)
    phoneAuth: 0.006, // $0.006 per phone auth verification
  },
  functions: {
    invocations: 0.4 / 1000000, // $0.40 per 1M invocations
    gbSeconds: 0.0000025, // $0.0000025 per GB-second
  },
  hosting: {
    storage: 0.026 / (1024 * 1024 * 1024), // $0.026 per GiB/month
    transfer: 0.15 / (1024 * 1024 * 1024), // $0.15 per GiB transfer
  },
  cloudStorage: {
    storage: 0.026 / (1024 * 1024 * 1024), // $0.026 per GiB/month
    operations: {
      class_a: 0.05 / 10000, // $0.05 per 10K operations (uploads)
      class_b: 0.004 / 10000, // $0.004 per 10K operations (downloads)
    },
  },
} as const;

// Schemas for cost estimation
export const FirebaseOperationSchema = z.object({
  type: z.enum(['read', 'write', 'delete', 'auth', 'storage', 'function_call']),
  count: z.number().min(0),
  metadata: z.record(z.any()).optional(),
});

export const CostEstimationRequestSchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'year']),
  operations: z.array(FirebaseOperationSchema),
  userCount: z.number().min(0).optional(),
  storageUsageGB: z.number().min(0).optional(),
  functionInvocations: z.number().min(0).optional(),
  bandwidthGB: z.number().min(0).optional(),
});

export interface CostBreakdown {
  firestore: {
    reads: number;
    writes: number;
    deletes: number;
    storage: number;
    total: number;
  };
  auth: {
    monthlyActiveUsers: number;
    phoneVerifications: number;
    total: number;
  };
  functions: {
    invocations: number;
    compute: number;
    total: number;
  };
  storage: {
    fileStorage: number;
    bandwidth: number;
    total: number;
  };
  totalCost: number;
  currency: string;
  timeframe: string;
}

export interface MedicalAPIUsageMetrics {
  patientOperations: {
    creates: number;
    reads: number;
    updates: number;
    deletes: number;
  };
  medicalRecordOperations: {
    creates: number;
    reads: number;
    updates: number;
    deletes: number;
  };
  authOperations: {
    logins: number;
    registrations: number;
    tokenRefreshes: number;
  };
  storageMetrics: {
    documentsGB: number;
    imagesGB: number;
    backupsGB: number;
  };
}

export class FinOpsEstimator {
  private static instance: FinOpsEstimator;

  public static getInstance(): FinOpsEstimator {
    if (!FinOpsEstimator.instance) {
      FinOpsEstimator.instance = new FinOpsEstimator();
    }
    return FinOpsEstimator.instance;
  }

  /**
   * Estimates Firebase costs based on medical API usage patterns
   */
  public estimateMedicalAPICosts(
    metrics: MedicalAPIUsageMetrics,
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month',
    userCount: number = 100
  ): CostBreakdown {
    const multiplier = this.getTimeframeMultiplier(timeframe);

    // Calculate Firestore costs
    const totalReads = (
      metrics.patientOperations.reads +
      metrics.medicalRecordOperations.reads
    ) * multiplier;

    const totalWrites = (
      metrics.patientOperations.creates +
      metrics.patientOperations.updates +
      metrics.medicalRecordOperations.creates +
      metrics.medicalRecordOperations.updates
    ) * multiplier;

    const totalDeletes = (
      metrics.patientOperations.deletes +
      metrics.medicalRecordOperations.deletes
    ) * multiplier;

    const totalStorageGB = Object.values(metrics.storageMetrics).reduce((sum, gb) => sum + gb, 0);

    const firestoreCosts = {
      reads: totalReads * FIREBASE_PRICING.firestore.reads,
      writes: totalWrites * FIREBASE_PRICING.firestore.writes,
      deletes: totalDeletes * FIREBASE_PRICING.firestore.deletes,
      storage: totalStorageGB * FIREBASE_PRICING.firestore.storage * multiplier,
      total: 0,
    };
    firestoreCosts.total = firestoreCosts.reads + firestoreCosts.writes + firestoreCosts.deletes + firestoreCosts.storage;

    // Calculate Auth costs
    const totalAuthOperations = (
      metrics.authOperations.logins +
      metrics.authOperations.registrations +
      metrics.authOperations.tokenRefreshes
    ) * multiplier;

    const authCosts = {
      monthlyActiveUsers: userCount * FIREBASE_PRICING.auth.monthlyCost * multiplier,
      phoneVerifications: totalAuthOperations * FIREBASE_PRICING.auth.phoneAuth,
      total: 0,
    };
    authCosts.total = authCosts.monthlyActiveUsers + authCosts.phoneVerifications;

    // Estimate function costs (for medical data processing)
    const estimatedFunctionInvocations = totalWrites * 2; // Assume 2 function calls per write
    const estimatedComputeTime = estimatedFunctionInvocations * 0.5; // 500ms average per function

    const functionCosts = {
      invocations: estimatedFunctionInvocations * FIREBASE_PRICING.functions.invocations,
      compute: estimatedComputeTime * FIREBASE_PRICING.functions.gbSeconds,
      total: 0,
    };
    functionCosts.total = functionCosts.invocations + functionCosts.compute;

    // Estimate storage costs (for medical documents/images)
    const estimatedBandwidth = totalStorageGB * 0.1; // 10% of storage is transferred

    const storageCosts = {
      fileStorage: totalStorageGB * FIREBASE_PRICING.cloudStorage.storage * multiplier,
      bandwidth: estimatedBandwidth * FIREBASE_PRICING.hosting.transfer,
      total: 0,
    };
    storageCosts.total = storageCosts.fileStorage + storageCosts.bandwidth;

    const totalCost = firestoreCosts.total + authCosts.total + functionCosts.total + storageCosts.total;

    return {
      firestore: firestoreCosts,
      auth: authCosts,
      functions: functionCosts,
      storage: storageCosts,
      totalCost,
      currency: 'USD',
      timeframe,
    };
  }

  /**
   * Estimates costs for specific medical API operations
   */
  public estimateOperationCosts(operations: Array<{ type: string; count: number }>): number {
    let totalCost = 0;

    for (const operation of operations) {
      switch (operation.type) {
        case 'patient_read':
          totalCost += operation.count * FIREBASE_PRICING.firestore.reads;
          break;
        case 'patient_write':
          totalCost += operation.count * FIREBASE_PRICING.firestore.writes;
          break;
        case 'medical_record_read':
          totalCost += operation.count * FIREBASE_PRICING.firestore.reads * 2; // Assume complex queries
          break;
        case 'medical_record_write':
          totalCost += operation.count * FIREBASE_PRICING.firestore.writes * 2; // With metadata
          break;
        case 'auth_login':
          totalCost += operation.count * FIREBASE_PRICING.auth.phoneAuth;
          break;
        case 'file_upload':
          totalCost += operation.count * FIREBASE_PRICING.cloudStorage.operations.class_a;
          break;
        case 'file_download':
          totalCost += operation.count * FIREBASE_PRICING.cloudStorage.operations.class_b;
          break;
        default:
          // Default to read operation cost
          totalCost += operation.count * FIREBASE_PRICING.firestore.reads;
      }
    }

    return totalCost;
  }

  /**
   * Predicts monthly costs based on current usage patterns
   */
  public predictMonthlyCosts(
    dailyMetrics: MedicalAPIUsageMetrics,
    userGrowthRate: number = 0.1 // 10% monthly growth
  ): CostBreakdown {
    // Project daily metrics to monthly
    const monthlyMetrics: MedicalAPIUsageMetrics = {
      patientOperations: {
        creates: dailyMetrics.patientOperations.creates * 30,
        reads: dailyMetrics.patientOperations.reads * 30,
        updates: dailyMetrics.patientOperations.updates * 30,
        deletes: dailyMetrics.patientOperations.deletes * 30,
      },
      medicalRecordOperations: {
        creates: dailyMetrics.medicalRecordOperations.creates * 30,
        reads: dailyMetrics.medicalRecordOperations.reads * 30,
        updates: dailyMetrics.medicalRecordOperations.updates * 30,
        deletes: dailyMetrics.medicalRecordOperations.deletes * 30,
      },
      authOperations: {
        logins: dailyMetrics.authOperations.logins * 30,
        registrations: dailyMetrics.authOperations.registrations * 30,
        tokenRefreshes: dailyMetrics.authOperations.tokenRefreshes * 30,
      },
      storageMetrics: {
        documentsGB: dailyMetrics.storageMetrics.documentsGB * (1 + userGrowthRate),
        imagesGB: dailyMetrics.storageMetrics.imagesGB * (1 + userGrowthRate),
        backupsGB: dailyMetrics.storageMetrics.backupsGB * (1 + userGrowthRate),
      },
    };

    return this.estimateMedicalAPICosts(monthlyMetrics, 'month');
  }

  /**
   * Generates cost optimization recommendations
   */
  public generateOptimizationRecommendations(costBreakdown: CostBreakdown): Array<{
    category: string;
    recommendation: string;
    potentialSavings: number;
    impact: 'low' | 'medium' | 'high';
  }> {
    const recommendations = [];

    // Firestore optimization
    if (costBreakdown.firestore.reads > costBreakdown.firestore.writes * 10) {
      recommendations.push({
        category: 'Firestore',
        recommendation: 'Implement caching for frequently read patient data to reduce read operations',
        potentialSavings: costBreakdown.firestore.reads * 0.3,
        impact: 'high' as const,
      });
    }

    if (costBreakdown.firestore.writes > 10) {
      recommendations.push({
        category: 'Firestore',
        recommendation: 'Batch medical record writes to reduce write operations',
        potentialSavings: costBreakdown.firestore.writes * 0.2,
        impact: 'medium' as const,
      });
    }

    // Storage optimization
    if (costBreakdown.storage.total > costBreakdown.totalCost * 0.3) {
      recommendations.push({
        category: 'Storage',
        recommendation: 'Implement image compression and archival policies for old medical records',
        potentialSavings: costBreakdown.storage.total * 0.4,
        impact: 'high' as const,
      });
    }

    // Auth optimization
    if (costBreakdown.auth.phoneVerifications > costBreakdown.auth.monthlyActiveUsers) {
      recommendations.push({
        category: 'Authentication',
        recommendation: 'Implement longer-lived tokens to reduce phone verification frequency',
        potentialSavings: costBreakdown.auth.phoneVerifications * 0.5,
        impact: 'medium' as const,
      });
    }

    return recommendations;
  }

  private getTimeframeMultiplier(timeframe: string): number {
    switch (timeframe) {
      case 'day':
        return 1;
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'year':
        return 365;
      default:
        return 30;
    }
  }
}

// Convenience function for quick cost estimation
export function estimateAPICallCost(endpoint: string, method: string): number {
  const estimator = FinOpsEstimator.getInstance();
  
  const operationMap: Record<string, Array<{ type: string; count: number }>> = {
    'POST /patients': [{ type: 'patient_write', count: 1 }, { type: 'auth_login', count: 1 }],
    'GET /patients': [{ type: 'patient_read', count: 20 }], // Assume 20 records per page
    'GET /patients/:id/records': [{ type: 'medical_record_read', count: 10 }], // Assume 10 records
    'POST /medical-records': [{ type: 'medical_record_write', count: 1 }],
    'GET /auth/login': [{ type: 'auth_login', count: 1 }],
  };

  const key = `${method} ${endpoint}`;
  const operations = operationMap[key] || [{ type: 'patient_read', count: 1 }];
  
  return estimator.estimateOperationCosts(operations);
}

export type { CostBreakdown, MedicalAPIUsageMetrics };
