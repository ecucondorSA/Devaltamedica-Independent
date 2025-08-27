/**
 * API interfaces
 * Core interfaces for API communication and responses
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  message?: string;
  timestamp: Date | string;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  httpStatus?: number;
  timestamp: Date | string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  sorting?: Sorting;
  filters?: Filter[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Sorting {
  field: string;
  order: 'asc' | 'desc';
}

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'not_in'
  | 'between';

export interface APIRequest {
  endpoint: string;
  method: HTTPMethod;
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, any>;
  timeout?: number;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface ResponseMetadata {
  requestId?: string;
  version?: string;
  responseTime?: number;
  serverTime?: Date | string;
  rateLimit?: RateLimit;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date | string;
}

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: Date | string;
  id?: string;
  userId?: string;
  roomId?: string;
}

export type WebSocketMessageType =
  | 'connection'
  | 'disconnection'
  | 'message'
  | 'notification'
  | 'update'
  | 'error'
  | 'ping'
  | 'pong'
  | 'offer'
  | 'answer'
  | 'ice_candidate';

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: 'high' | 'medium' | 'low';
  data?: any;
  userId: string;
  read: boolean;
  createdAt: Date | string;
}

export type NotificationType =
  | 'appointment'
  | 'message'
  | 'reminder'
  | 'alert'
  | 'system'
  | 'promotion';

export interface FileUpload {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: Date | string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
  isEncrypted?: boolean;
  checksum?: string;
}

export interface SearchQuery {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
  boost?: Record<string, number>;
  filters?: Filter[];
  pagination?: Pagination;
  sorting?: Sorting;
}

export interface BulkOperation<T = any> {
  operation: 'create' | 'update' | 'delete';
  data: T[];
  options?: BulkOperationOptions;
}

export interface BulkOperationOptions {
  skipValidation?: boolean;
  continueOnError?: boolean;
  returnResults?: boolean;
}

export interface BatchResponse {
  successful: number;
  failed: number;
  errors?: BatchError[];
  results?: any[];
}

export interface BatchError {
  index: number;
  error: APIError;
  data?: any;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date | string;
  version: string;
  services: ServiceHealth[];
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  lastCheck: Date | string;
}
