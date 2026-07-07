import { Component, input, WritableSignal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';

/**
 * Reusable textarea field component with signal-based binding
 * 
 * @example
 * ```html
 * <app-textarea-field
 *   label="Description"
 *   [field]="description"
 *   [rows]="4"
 *   [autoResize]="true">
 * </app-textarea-field>
 * ```
 */
@Component({
  selector: 'app-textarea-field',
  standalone: true,
  imports: [CommonModule, FormsModule, TextareaModule, FloatLabelModule],
  template: `
    <div class="form-field">
      @if (hideLabel()) {
        <textarea 
          pTextarea
          [id]="id()"
          [ngModel]="field()()"
          (ngModelChange)="onValueChange($event)"
          (blur)="onBlur()"
          [disabled]="disabled()"
          [rows]="rows()"
          [cols]="cols()"
          [maxlength]="maxlength()"
          [autoResize]="autoResize()"
          [placeholder]="placeholder()"
          class="w-full"
          [class.ng-invalid]="showError()"
          [class.ng-dirty]="touched()">
        </textarea>
      } @else {
        <p-floatlabel variant="on">
          <textarea 
            pTextarea
            [id]="id()"
            [ngModel]="field()()"
            (ngModelChange)="onValueChange($event)"
            (blur)="onBlur()"
            [disabled]="disabled()"
            [rows]="rows()"
            [cols]="cols()"
            [maxlength]="maxlength()"
            [autoResize]="autoResize()"
            class="w-full"
            [class.ng-invalid]="showError()"
            [class.ng-dirty]="touched()">
          </textarea>
          <label [for]="id()">
            {{ label() }}
            @if (required()) {
              <span class="text-red-500">*</span>
            }
          </label>
        </p-floatlabel>
      }
      <div class="field-footer">
        @if (showError()) {
          <small class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            {{ error() }}
          </small>
        }
        @if (showCharCount() && maxlength()) {
          <small class="char-count">
            {{ field()().length }} / {{ maxlength() }}
          </small>
        }
      </div>
    </div>
  `,
  styles: [`
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field textarea {
      font-size: 1rem;
      padding: 0.875rem 1rem;
      resize: vertical;
    }

    .field-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--red-500);
      font-size: 0.875rem;
      
      i {
        font-size: 0.875rem;
      }
    }

    .char-count {
      color: var(--text-color-secondary);
      font-size: 0.75rem;
      margin-left: auto;
    }

    :host ::ng-deep {
      .p-floatlabel {
        width: 100%;
      }
      
      .p-floatlabel textarea {
        width: 100%;
      }

      .p-floatlabel label {
        font-weight: 500;
      }
    }
  `]
})
export class TextareaFieldComponent {
  /** Signal field for two-way binding */
  field = input.required<WritableSignal<string>>();

  /** Emits when value changes */
  onChange = output<string>();

  /** Label text (optional if hideLabel is true) */
  label = input<string>('');

  /** Whether to hide the label and p-floatlabel */
  hideLabel = input<boolean>(false);

  /** Placeholder text (only visible if hideLabel is true) */
  placeholder = input<string>('');

  /** Unique ID for the input */
  id = input<string>(`textarea-field-${Math.random().toString(36).substr(2, 9)}`);

  /** Whether field is required */
  required = input<boolean>(false);

  /** Error message to display */
  error = input<string>('');

  /** Whether field is disabled */
  disabled = input<boolean>(false);

  /** Number of visible rows */
  rows = input<number>(3);

  /** Number of visible columns */
  cols = input<number>(30);

  /** Maximum character length */
  maxlength = input<number | null>(null);

  /** Enable auto-resize */
  autoResize = input<boolean>(false);

  /** Show character count */
  showCharCount = input<boolean>(true);

  private _touched = false;

  touched = computed(() => this._touched);

  showError = computed(() => {
    return this._touched && this.error().length > 0;
  });

  onValueChange(value: string): void {
    this.field().set(value);
    this.onChange.emit(value);
  }

  onBlur(): void {
    this._touched = true;
  }

  markTouched(): void {
    this._touched = true;
  }

  resetTouched(): void {
    this._touched = false;
  }
}
