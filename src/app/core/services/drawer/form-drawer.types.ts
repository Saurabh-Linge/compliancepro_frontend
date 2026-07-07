/**
 * Configuration for a drawer opened via FormDrawerService
 */
export interface FormDrawerConfig<TInput = any> {
  /** Drawer header / title */
  header: string;
  /** Optional icon class displayed before the title (e.g. 'pi pi-file') */
  icon?: string;
  /** Drawer width (default: '540px') */
  width?: string;
  /** Position: 'right' | 'left' | 'top' | 'bottom' (default: 'right') */
  position?: 'right' | 'left' | 'top' | 'bottom';
  /** Whether the drawer is modal (default: true) */
  modal?: boolean;
  /** Whether clicking the overlay closes the drawer (default: true) */
  dismissible?: boolean;
  /** Optional data passed to the content component via injection */
  data?: TInput;
}

/**
 * Result returned to the caller when the drawer closes
 */
export interface FormDrawerResult<TResult = any> {
  /** true if user submitted data, false if they cancelled */
  saved: boolean;
  /** The payload returned via FormDrawerRef.close(data) */
  data?: TResult;
}
