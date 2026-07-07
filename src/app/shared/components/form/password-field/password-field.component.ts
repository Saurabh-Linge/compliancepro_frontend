import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';

/**
 * Reusable password field component with signal-based binding.
 *
 * @example
 * ```html
 * <app-password-field
 *   label="Password"
 *   [field]="password"
 *   [required]="true"
 *   [error]="passwordError()"
 *   [helperText]="passwordPolicyText()">
 * </app-password-field>
 * ```
 */
@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordModule, FloatLabelModule],
  template: `
    <div class="form-field">
      @if (hideLabel()) {
        <p-password
          [inputId]="id()"
          [ngModel]="field()()"
          (ngModelChange)="onValueChange($event)"
          (onBlur)="onBlur()"
          [toggleMask]="toggleMask()"
          [feedback]="feedback()"
          [disabled]="disabled()"
          [placeholder]="placeholder()"
          [style]="{ width: '100%' }"
          styleClass="w-full"
          inputStyleClass="w-full"
          [class.ng-invalid]="showError()"
          [class.ng-dirty]="touched()"
        ></p-password>
      } @else {
        <p-floatlabel variant="on" [class.has-value]="hasValue()">
          <p-password
            [inputId]="id()"
            [ngModel]="field()()"
            (ngModelChange)="onValueChange($event)"
            (onBlur)="onBlur()"
            [toggleMask]="toggleMask()"
            [feedback]="feedback()"
            [disabled]="disabled()"
            [style]="{ width: '100%' }"
            styleClass="w-full"
            inputStyleClass="w-full"
            [class.ng-invalid]="showError()"
            [class.ng-dirty]="touched()"
          ></p-password>

          <label [for]="id()">
            {{ label() }}
            @if (required()) {
              <span class="text-red-500">*</span>
            }
          </label>
        </p-floatlabel>
      }

      @if (showError()) {
        <small class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          {{ error() }}
        </small>
      } @else if (helperText()) {
        <small class="helper-text">
          {{ helperText() }}
        </small>
      }
    </div>
  `,
  styles: [`
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-height: 5.25rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--red-500);
      font-size: 0.875rem;
    }

    .helper-text {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      line-height: 1.4;
      margin-top: 0.25rem;
    }

    :host ::ng-deep {
      .p-floatlabel {
        width: 100%;
      }

      .p-password,
      .p-password-input {
        width: 100%;
      }

      .p-password-input {
        font-size: 1rem;
        padding: 0.875rem 1rem;
      }

      .p-floatlabel label {
        font-weight: 500;
      }
    }
  `]
})
export class PasswordFieldComponent {
  /** Signal field for two-way binding */
  field = input.required<WritableSignal<string>>();

  /** Emits when value changes */
  onChange = output<string>();

  /** Label text (optional if hideLabel is true) */
  label = input<string>('Password');

  /** Whether to hide the label and p-floatlabel */
  hideLabel = input<boolean>(false);

  /** Unique ID for the input */
  id = input<string>(`password-field-${Math.random().toString(36).slice(2, 11)}`);

  /** Whether field is required */
  required = input<boolean>(false);

  /** Whether field is disabled */
  disabled = input<boolean>(false);

  /** Show PrimeNG password strength feedback */
  feedback = input<boolean>(true);

  /** Show mask toggle icon */
  toggleMask = input<boolean>(true);

  /** Placeholder text */
  placeholder = input<string>('Enter password');

  /** Error message to display */
  error = input<string>('');

  /** Helper text shown when there is no error */
  helperText = input<string>('');

  private _touched = signal(false);

  /** Track if field has been touched */
  touched = computed(() => this._touched());

  showError = computed(() => {
    const errorMsg = this.error();
    const isTouched = this._touched();
    return isTouched && errorMsg.length > 0;
  });

  /** Check if field has a value */
  hasValue = computed(() => {
    const value = this.field()();
    return value !== null && value !== undefined && value !== '';
  });

  onValueChange(value: string): void {
    this.field().set(value || '');
    this.onChange.emit(value || '');
  }

  onBlur(): void {
    this._touched.set(true);
  }

  /** Mark field as touched programmatically */
  markTouched(): void {
    this._touched.set(true);
  }

  /** Reset touched state */
  resetTouched(): void {
    this._touched.set(false);
  }
}
