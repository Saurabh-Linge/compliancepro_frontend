import { Injectable, Type } from '@angular/core';
import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

/**
 * Configuration for form dialogs
 * @param TInput Type of data passed TO the dialog
 */
export interface FormDialogConfig<TInput = any> {
  /** Dialog header/title */
  header: string;
  /** Width of the dialog (default: '450px') */
  width?: string;
  /** Height of the dialog */
  height?: string;
  /** Data to pass to the dialog component */
  data?: TInput;
  /** Input values to pass directly to component inputs */
  inputValues?: Record<string, any>;
  /** Whether to show close button (default: true) */
  closable?: boolean;
  /** Whether dialog is modal (default: true) */
  modal?: boolean;
  /** Whether dialog is draggable (default: false) */
  draggable?: boolean;
  /** Whether dialog is resizable (default: false) */
  resizable?: boolean;
  /** Whether dialog is maximizable (default: false) */
  maximizable?: boolean;
  /** Whether dialog is minimizable (default: false) */
  minimizable?: boolean;
  /** CSS class for the dialog */
  styleClass?: string;
  /** Custom content style */
  contentStyle?: Record<string, string>;
}

/**
 * Result from a form dialog
 */
export interface FormDialogResult<T = any> {
  /** Whether the form was saved (true) or cancelled (false) */
  saved: boolean;
  /** The data returned from the dialog */
  data?: T;
}

/**
 * Service for opening form dialogs programmatically
 * Provides a simplified API on top of PrimeNG's DialogService
 */
@Injectable({
  providedIn: 'root'
})
export class FormDialogService {

  constructor(private dialogService: DialogService) { }

  /**
   * Open a form dialog with the given component
   * @param component The component to render inside the dialog
   * @param config Configuration for the dialog
   * @returns Promise that resolves when dialog closes with the result
   * @template TComponent The dialog component type
   * @template TInput Type of data passed TO the dialog
   * @template TResult Type of data returned FROM the dialog
   */
  open<TComponent, TInput = any, TResult = any>(
    component: Type<TComponent>,
    config: FormDialogConfig<TInput>
  ): Promise<FormDialogResult<TResult>> {
    return new Promise((resolve) => {
      const dialogConfig: DynamicDialogConfig = {
        header: config.header,
        width: config.width || '450px',
        height: config.height,
        modal: config.modal !== false,
        closable: config.closable !== false,
        draggable: config.draggable || false,
        resizable: config.resizable || false,
        maximizable: config.maximizable || false,
        styleClass: config.styleClass,
        contentStyle: config.contentStyle || { overflow: 'auto' },
        data: config.data,
        inputValues: config.inputValues
      };

      const ref = this.dialogService.open(component, dialogConfig);

      // Handle case where dialog service fails to open
      if (!ref) {
        resolve({ saved: false });
        return;
      }

      ref.onClose.subscribe((result: TResult | null | undefined) => {
        if (result === undefined || result === null) {
          // Dialog was closed without returning data (cancel/close button)
          resolve({ saved: false });
        } else {
          // Dialog returned data (save was clicked)
          resolve({ saved: true, data: result });
        }
      });
    });
  }

  /**
   * Close all open dialogs
   */
  closeAll(): void {
    // DialogService doesn't have closeAll, but individual refs can be closed
    // This would need to track open refs if needed
  }
}
