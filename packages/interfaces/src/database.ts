/**
 * Database interfaces
 * Core interfaces for database operations and models
 */

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  version?: number;
}

export interface QueryOptions {
  where?: Record<string, any>;
  select?: string[] | Record<string, boolean>;
  include?: Record<string, boolean | QueryOptions>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;
  distinct?: string[];
}

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  executeQuery<T>(query: string, params?: any[]): Promise<T>;
}

export interface Repository<T extends BaseEntity> {
  findById(id: string, options?: QueryOptions): Promise<T | null>;
  findOne(options: QueryOptions): Promise<T | null>;
  findMany(options?: QueryOptions): Promise<T[]>;
  count(options?: QueryOptions): Promise<number>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  exists(options: QueryOptions): Promise<boolean>;
  transaction<R>(callback: (tx: Transaction) => Promise<R>): Promise<R>;
}

export interface CacheOptions {
  key: string;
  ttl?: number; // Time to live in seconds
  tags?: string[];
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  flush(): Promise<void>;
  invalidateTags(tags: string[]): Promise<void>;
}

export interface Migration {
  id: string;
  name: string;
  timestamp: number;
  up(): Promise<void>;
  down(): Promise<void>;
}

export interface Seed {
  name: string;
  order: number;
  run(): Promise<void>;
}

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  executeQuery<T>(query: string, params?: any[]): Promise<T>;
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
}

export interface SchemaValidator {
  validate(data: any, schema: any): ValidationResult;
  validatePartial(data: any, schema: any): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
  warnings?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  connectionString?: string;
  ssl?: boolean | DatabaseSSLConfig;
  poolSize?: number;
  timeout?: number;
  debug?: boolean;
}

export interface DatabaseSSLConfig {
  rejectUnauthorized?: boolean;
  ca?: string;
  cert?: string;
  key?: string;
}

export interface BackupOptions {
  includeData?: boolean;
  includeSchema?: boolean;
  compression?: boolean;
  encryption?: boolean;
  destination: string;
}

export interface RestoreOptions {
  source: string;
  overwrite?: boolean;
  skipErrors?: boolean;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
  where?: string;
}

export interface ConstraintDefinition {
  name: string;
  type: 'primary' | 'unique' | 'foreign' | 'check';
  columns: string[];
  references?: ForeignKeyReference;
  checkExpression?: string;
}

export interface ForeignKeyReference {
  table: string;
  columns: string[];
  onDelete?: 'cascade' | 'restrict' | 'set null' | 'no action';
  onUpdate?: 'cascade' | 'restrict' | 'set null' | 'no action';
}
