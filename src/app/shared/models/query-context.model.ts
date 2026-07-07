/**
 * Query context for server-side pagination, sorting, and filtering
 */
export interface QueryContext {
  page: number;           // Current page (1-based)
  pageSize: number;       // Records per page
  search?: string;        // Global search query
  sortField?: string;     // Field to sort by
  sortOrder?: 'asc' | 'desc'; // Sort direction
  filters?: Record<string, any>; // Column-specific filters
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  totalRecords: number;
  page: number;
  pageSize: number;
  error?: string;
}
