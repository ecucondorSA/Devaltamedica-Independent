/**
 * 🗄️ FIRESTORE DATABASE UTILITIES - ALTAMEDICA
 * Utilidades especializadas para operaciones con Firestore
 */

import { adminDb } from '../../shared/lib/firebase-admin';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData,
  CollectionReference
} from 'firebase-admin/firestore';

export interface FirestoreQueryOptions {
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains';
    value: any;
  }>;
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
}

export interface FirestoreDocument {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export class FirestoreService {
  /**
   * Create a document in a collection
   */
  static async create<T extends DocumentData>(
    collectionName: string,
    data: T
  ): Promise<{ id: string } & T> {
    try {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(adminDb, collectionName), docData);

      return {
        id: docRef.id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error creating document in ${collectionName}:`, undefined, error);
      throw new Error(`Failed to create document in ${collectionName}`);
    }
  }

  /**
   * Get a document by ID
   */
  static async getById<T extends FirestoreDocument>(
    collectionName: string,
    docId: string
  ): Promise<T | null> {
    try {
      const docRef = doc(adminDb, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return this.convertTimestamps({
        id: docSnap.id,
        ...data
      }) as T;
    } catch (error) {
      logger.error(`Error getting document from ${collectionName}:`, undefined, error);
      throw new Error(`Failed to get document from ${collectionName}`);
    }
  }

  /**
   * Update a document
   */
  static async update<T extends DocumentData>(
    collectionName: string,
    docId: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(adminDb, collectionName, docId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      logger.error(`Error updating document in ${collectionName}:`, undefined, error);
      throw new Error(`Failed to update document in ${collectionName}`);
    }
  }

  /**
   * Delete a document
   */
  static async delete(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(adminDb, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      logger.error(`Error deleting document from ${collectionName}:`, undefined, error);
      throw new Error(`Failed to delete document from ${collectionName}`);
    }
  }

  /**
   * Soft delete - mark as inactive
   */
  static async softDelete(collectionName: string, docId: string, deletedBy?: string): Promise<void> {
    try {
      const docRef = doc(adminDb, collectionName, docId);
      await updateDoc(docRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        deletedBy,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logger.error(`Error soft deleting document from ${collectionName}:`, undefined, error);
      throw new Error(`Failed to soft delete document from ${collectionName}`);
    }
  }

  /**
   * Query documents with flexible options
   */
  static async query<T extends FirestoreDocument>(
    collectionName: string,
    options: FirestoreQueryOptions = {}
  ): Promise<T[]> {
    try {
      let q = collection(adminDb, collectionName);
      const constraints: QueryConstraint[] = [];

      // Add where constraints
      if (options.where) {
        for (const whereClause of options.where) {
          constraints.push(where(whereClause.field, whereClause.operator as any, whereClause.value));
        }
      }

      // Add orderBy constraints
      if (options.orderBy) {
        for (const orderClause of options.orderBy) {
          constraints.push(orderBy(orderClause.field, orderClause.direction));
        }
      }

      // Add limit
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      // Create query with all constraints
      const finalQuery = query(q, ...constraints);
      const querySnapshot = await getDocs(finalQuery);

      return querySnapshot.docs.map(docSnap => 
        this.convertTimestamps({
          id: docSnap.id,
          ...docSnap.data()
        }) as T
      );
    } catch (error) {
      logger.error(`Error querying ${collectionName}:`, undefined, error);
      throw new Error(`Failed to query ${collectionName}`);
    }
  }

  /**
   * Count documents matching criteria
   */
  static async count(
    collectionName: string,
    whereOptions: FirestoreQueryOptions['where'] = []
  ): Promise<number> {
    try {
      let q = collection(adminDb, collectionName);
      const constraints: QueryConstraint[] = [];

      // Add where constraints
      if (whereOptions) {
        for (const whereClause of whereOptions) {
          constraints.push(where(whereClause.field, whereClause.operator as any, whereClause.value));
        }
      }

      const finalQuery = query(q, ...constraints);
      const querySnapshot = await getDocs(finalQuery);

      return querySnapshot.size;
    } catch (error) {
      logger.error(`Error counting documents in ${collectionName}:`, undefined, error);
      throw new Error(`Failed to count documents in ${collectionName}`);
    }
  }

  /**
   * Check if document exists
   */
  static async exists(collectionName: string, docId: string): Promise<boolean> {
    try {
      const docRef = doc(adminDb, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      logger.error(`Error checking document existence in ${collectionName}:`, undefined, error);
      return false;
    }
  }

  /**
   * Batch operations
   */
  static async batchCreate<T extends DocumentData>(
    collectionName: string,
    documents: T[]
  ): Promise<string[]> {
    try {
      const batch = adminDb.batch();
      const docIds: string[] = [];

      for (const docData of documents) {
        const docRef = doc(collection(adminDb, collectionName));
        batch.set(docRef, {
          ...docData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        docIds.push(docRef.id);
      }

      await batch.commit();
      return docIds;
    } catch (error) {
      logger.error(`Error batch creating documents in ${collectionName}:`, undefined, error);
      throw new Error(`Failed to batch create documents in ${collectionName}`);
    }
  }

  /**
   * Get paginated results
   */
  static async paginate<T extends FirestoreDocument>(
    collectionName: string,
    page: number = 1,
    pageSize: number = 50,
    options: Omit<FirestoreQueryOptions, 'limit' | 'offset'> = {}
  ): Promise<{
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      // Get total count
      const total = await this.count(collectionName, options.where);
      
      // Get paginated items
      const items = await this.query<T>(collectionName, {
        ...options,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      const totalPages = Math.ceil(total / pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      logger.error(`Error paginating ${collectionName}:`, undefined, error);
      throw new Error(`Failed to paginate ${collectionName}`);
    }
  }

  /**
   * Convert Firestore timestamps to JavaScript dates
   */
  private static convertTimestamps(data: any): any {
    if (!data) return data;

    const converted = { ...data };

    // Common timestamp fields
    const timestampFields = ['createdAt', 'updatedAt', 'deletedAt', 'scheduledAt', 'startedAt', 'endedAt'];

    for (const field of timestampFields) {
      if (converted[field] && typeof converted[field].toDate === 'function') {
        converted[field] = converted[field].toDate();
      }
    }

    return converted;
  }

  /**
   * Convert JavaScript dates to Firestore timestamps for updates
   */
  static prepareForUpdate(data: any): any {
    if (!data) return data;

    const prepared = { ...data };

    // Convert Date objects to Timestamp objects
    for (const [key, value] of Object.entries(prepared)) {
      if (value instanceof Date) {
        prepared[key] = Timestamp.fromDate(value);
      }
    }

    return prepared;
  }
}