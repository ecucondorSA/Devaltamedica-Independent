/**
 * Transaction Service
 * Manages database transactions with Prisma
 */

import { PrismaClient } from '@prisma/client';

type TransactionCallback<T> = (prisma: PrismaClient) => Promise<T>;

export class TransactionService {
  private static prisma: PrismaClient;

  /**
   * Initialize the transaction service with a Prisma client
   */
  static initialize(prismaClient: PrismaClient): void {
    this.prisma = prismaClient;
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  static async executeTransaction<T>(
    callback: TransactionCallback<T>,
    options?: TransactionOptions
  ): Promise<TransactionResult<T>> {
    const startTime = Date.now();
    let retryCount = 0;
    const maxRetries = options?.maxRetries || 3;
    const retryDelay = options?.retryDelay || 1000;

    while (retryCount < maxRetries) {
      try {
        // Execute the transaction
        const result = await this.prisma.$transaction(
          async (prisma) => {
            return await callback(prisma as PrismaClient);
          },
          {
            maxWait: options?.maxWait || 5000,
            timeout: options?.timeout || 10000,
            isolationLevel: options?.isolationLevel
          }
        );

        // Log successful transaction if needed
        if (options?.logSuccess) {
          console.log(`Transaction completed successfully in ${Date.now() - startTime}ms`);
        }

        return {
          success: true,
          data: result,
          duration: Date.now() - startTime,
          retries: retryCount
        };
      } catch (error: any) {
        retryCount++;

        // Check if we should retry
        if (retryCount < maxRetries && this.isRetryableError(error)) {
          if (options?.logRetry) {
            console.log(`Transaction failed, retrying (${retryCount}/${maxRetries})...`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
          continue;
        }

        // Log failure if needed
        if (options?.logError) {
          console.error('Transaction failed:', error);
        }

        return {
          success: false,
          error: this.formatError(error),
          duration: Date.now() - startTime,
          retries: retryCount
        };
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      duration: Date.now() - startTime,
      retries: maxRetries
    };
  }

  /**
   * Execute multiple independent transactions in parallel
   */
  static async executeParallelTransactions<T extends any[]>(
    callbacks: { [K in keyof T]: TransactionCallback<T[K]> },
    options?: ParallelTransactionOptions
  ): Promise<ParallelTransactionResult<T>> {
    const startTime = Date.now();
    const results: any[] = [];
    const errors: any[] = [];

    try {
      const promises = callbacks.map(async (callback, index) => {
        try {
          const result = await this.executeTransaction(callback, options?.transactionOptions);
          return { index, result };
        } catch (error) {
          return { index, error };
        }
      });

      const outcomes = await Promise.allSettled(promises);

      outcomes.forEach((outcome, index) => {
        if (outcome.status === 'fulfilled') {
          const { result, error } = outcome.value;
          if (result) {
            results[index] = result;
          } else {
            errors[index] = error;
          }
        } else {
          errors[index] = outcome.reason;
        }
      });

      const allSucceeded = errors.filter(e => e !== undefined).length === 0;

      return {
        success: allSucceeded,
        results: results as T,
        errors: errors.filter(e => e !== undefined),
        duration: Date.now() - startTime,
        totalTransactions: callbacks.length,
        successfulTransactions: results.filter(r => r !== undefined).length
      };
    } catch (error: any) {
      return {
        success: false,
        results: [] as any,
        errors: [this.formatError(error)],
        duration: Date.now() - startTime,
        totalTransactions: callbacks.length,
        successfulTransactions: 0
      };
    }
  }

  /**
   * Execute a transaction with savepoints for nested transactions
   */
  static async executeNestedTransaction<T>(
    callback: TransactionCallback<T>,
    parentTransaction?: PrismaClient,
    options?: TransactionOptions
  ): Promise<TransactionResult<T>> {
    if (parentTransaction) {
      // If we're already in a transaction, just execute the callback
      try {
        const result = await callback(parentTransaction);
        return {
          success: true,
          data: result,
          duration: 0,
          retries: 0
        };
      } catch (error: any) {
        return {
          success: false,
          error: this.formatError(error),
          duration: 0,
          retries: 0
        };
      }
    } else {
      // Start a new transaction
      return await this.executeTransaction(callback, options);
    }
  }

  /**
   * Execute a batch operation within a transaction
   */
  static async executeBatchOperation<T, R>(
    items: T[],
    operation: (item: T, prisma: PrismaClient) => Promise<R>,
    options?: BatchOperationOptions
  ): Promise<BatchOperationResult<R>> {
    const batchSize = options?.batchSize || 100;
    const results: R[] = [];
    const errors: any[] = [];
    let processedCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchResult = await this.executeTransaction(async (prisma) => {
        const batchResults: R[] = [];
        
        for (const item of batch) {
          try {
            const result = await operation(item, prisma);
            batchResults.push(result);
            processedCount++;
            
            // Call progress callback if provided
            if (options?.onProgress) {
              options.onProgress(processedCount, items.length);
            }
          } catch (error) {
            if (options?.stopOnError) {
              throw error;
            }
            errors.push({ item, error: this.formatError(error) });
          }
        }
        
        return batchResults;
      }, options?.transactionOptions);

      if (batchResult.success && batchResult.data) {
        results.push(...batchResult.data);
      } else if (options?.stopOnError) {
        break;
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalItems: items.length,
      processedItems: processedCount,
      failedItems: errors.length
    };
  }

  /**
   * Check if an error is retryable
   */
  private static isRetryableError(error: any): boolean {
    // Prisma specific error codes that are retryable
    const retryableErrorCodes = [
      'P2034', // Transaction failed due to concurrent update
      'P2024', // Timed out fetching a new connection
      'P1001', // Can't reach database server
      'P1002', // Database server was reached but timed out
    ];

    if (error.code && retryableErrorCodes.includes(error.code)) {
      return true;
    }

    // Check for common retryable error messages
    const message = error.message?.toLowerCase() || '';
    return message.includes('deadlock') || 
           message.includes('timeout') || 
           message.includes('connection');
  }

  /**
   * Format error for consistent error handling
   */
  private static formatError(error: any): string {
    if (error.code && error.message) {
      return `[${error.code}] ${error.message}`;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown transaction error';
  }

  /**
   * Create a new transaction context
   */
  static createContext(): TransactionContext {
    return {
      startTime: Date.now(),
      operations: [],
      metadata: {}
    };
  }

  /**
   * Log transaction operation for audit
   */
  static logOperation(
    context: TransactionContext,
    operation: string,
    details?: any
  ): void {
    context.operations.push({
      operation,
      timestamp: Date.now(),
      details
    });
  }
}

/**
 * Transaction utility functions
 */
export class TransactionUtils {
  /**
   * Wrap an async function to automatically use transactions
   */
  static withTransaction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options?: TransactionOptions
  ): T {
    return (async (...args: Parameters<T>) => {
      return await TransactionService.executeTransaction(async (prisma) => {
        // Inject prisma as first argument
        return await fn(prisma, ...args);
      }, options);
    }) as T;
  }

  /**
   * Create a transaction-aware repository
   */
  static createTransactionalRepository<T>(
    repository: T,
    prisma: PrismaClient
  ): T {
    const proxy = new Proxy(repository as any, {
      get(target, prop) {
        const original = target[prop];
        
        if (typeof original === 'function') {
          return async (...args: any[]) => {
            return await TransactionService.executeTransaction(async (tx) => {
              // Replace prisma instance with transaction instance
              target._prisma = tx;
              const result = await original.apply(target, args);
              target._prisma = prisma; // Restore original
              return result;
            });
          };
        }
        
        return original;
      }
    });

    return proxy as T;
  }
}

/**
 * Types
 */
export interface TransactionOptions {
  maxRetries?: number;
  retryDelay?: number;
  maxWait?: number;
  timeout?: number;
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  logSuccess?: boolean;
  logError?: boolean;
  logRetry?: boolean;
}

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  retries: number;
}

export interface ParallelTransactionOptions {
  transactionOptions?: TransactionOptions;
}

export interface ParallelTransactionResult<T> {
  success: boolean;
  results: T;
  errors: any[];
  duration: number;
  totalTransactions: number;
  successfulTransactions: number;
}

export interface BatchOperationOptions {
  batchSize?: number;
  stopOnError?: boolean;
  onProgress?: (processed: number, total: number) => void;
  transactionOptions?: TransactionOptions;
}

export interface BatchOperationResult<T> {
  success: boolean;
  results: T[];
  errors: any[];
  totalItems: number;
  processedItems: number;
  failedItems: number;
}

export interface TransactionContext {
  startTime: number;
  operations: TransactionOperation[];
  metadata: Record<string, any>;
}

export interface TransactionOperation {
  operation: string;
  timestamp: number;
  details?: any;
}