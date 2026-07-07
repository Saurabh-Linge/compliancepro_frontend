import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

/**
 * Reusable form action buttons component (Save/Cancel pattern)
 * 
 * @example
 * ```html
 * <app-form-actions
 *   [saveDisabled]="!isFormValid()"
 *   [loading]="isSaving()"
 *   [viewMode]="isViewMode"
 *   (save)="onSave()"
 *   (cancel)="onCancel()">
 * </app-form-actions>
 * ```
 */
@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="form-actions" [class.is-sticky]="sticky()">
      @if (showCancel()) {
        <button 
          pButton 
          type="button"
          [label]="displayCancelLabel()" 
          [icon]="cancelIcon()" 
          [class]="cancelStyleClass()"
          [disabled]="cancelDisabled() || loading()"
          (click)="cancel.emit()">
        </button>
      }
      @if (!viewMode()) {
        <button 
          pButton 
          type="button"
          [label]="saveLabel()" 
          [icon]="loading() ? 'pi pi-spin pi-spinner' : saveIcon()" 
          [class]="saveStyleClass()"
          [disabled]="saveDisabled() || loading()"
          (click)="save.emit()">
        </button>
      }
    </div>
  `,
  styles: [`
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
    }

    .form-actions.is-sticky {
      position: sticky;
      bottom: 0;
      z-index: 100;
      background: var(--surface-0);
      border-top: 1px solid var(--surface-200);
      padding: 1.25rem 2rem;
      margin-top: auto;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
      width: 100%;
      box-sizing: border-box;
      gap: 1rem;
    }



    .form-actions button {
      min-width: 100px;
    }
  `]
})
export class FormActionsComponent {
  /** Whether actions are sticky at the bottom */
  sticky = input<boolean>(false);

  /** View mode - hides save button */
  viewMode = input<boolean>(false);

  /** Save button label */
  saveLabel = input<string>('Save');

  /** Save button icon */
  saveIcon = input<string>('pi pi-check');

  /** Save button style class */
  saveStyleClass = input<string>('p-button-primary');

  /** Whether save is disabled */
  saveDisabled = input<boolean>(false);

  /** Cancel button label */
  cancelLabel = input<string>('Cancel');

  /** Cancel button icon */
  cancelIcon = input<string>('pi pi-times');

  /** Cancel button style class */
  cancelStyleClass = input<string>('p-button-outlined p-button-secondary');

  /** Whether cancel is disabled */
  cancelDisabled = input<boolean>(false);

  /** Loading state (shows spinner on save button) */
  loading = input<boolean>(false);

  /** Whether to show the cancel button */
  showCancel = input<boolean>(true);

  /** Computed cancel label - shows 'Close' in view mode */
  displayCancelLabel = computed(() => this.viewMode() ? 'Close' : this.cancelLabel());

  /** Emitted when save button is clicked */
  save = output<void>();

  /** Emitted when cancel button is clicked */
  cancel = output<void>();
}

