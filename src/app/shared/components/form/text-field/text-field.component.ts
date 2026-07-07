import { Component, input, output, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

/**
 * Reusable text input field component with signal-based binding
 * 
 * @example
 * ```html
 * <app-text-field
 *   label="Content Name"
 *   [field]="contentName"
 *   [required]="true"
 *   [error]="contentNameError()">
 * </app-text-field>
 * ```
 */
@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, FloatLabelModule],
  template: `
    <div class="form-field">
      @if (hideLabel()) {
        <input 
          pInputText 
          [type]="type()"
          [id]="id()"
          [value]="field()()"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (keypress)="onKeypress($event)"
          [disabled]="disabled()"
          [attr.maxlength]="maxlength()"
          [placeholder]="placeholder()"
          class="w-full"
          [class.ng-invalid]="showError()"
          [class.ng-dirty]="touched()" />
      } @else {
        <p-floatlabel variant="on">
          <input 
            pInputText 
            [type]="type()"
            [id]="id()"
            [value]="field()()"
            (input)="onInput($event)"
            (blur)="onBlur()"
            (keypress)="onKeypress($event)"
            [disabled]="disabled()"
            [attr.maxlength]="maxlength()"
            class="w-full"
            [class.ng-invalid]="showError()"
            [class.ng-dirty]="touched()"
            [class.p-filled]="type() === 'date' || !!field()()" />
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
      }
    </div>
  `,
  styles: [`
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field input {
      font-size: 1rem;
      padding: 0.875rem 1rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--red-500);
      font-size: 0.875rem;
      margin-top: 0.25rem;
      
      i {
        font-size: 0.875rem;
      }
    }

    :host ::ng-deep {
      .p-floatlabel {
        width: 100%;
      }
      
      .p-floatlabel input {
        width: 100%;
      }

      .p-floatlabel label {
        font-weight: 500;
      }
    }
  `]
})
export class TextFieldComponent {
  /** Signal field for two-way binding */
  field = input.required<WritableSignal<string>>();

  /** Emits when value changes */
  onChange = output<string>();

  /** Label text (optional if hideLabel is true) */
  label = input<string>('');

  /** Whether to hide the label and p-floatlabel */
  hideLabel = input<boolean>(false);

  /** Placeholder text (only visible if hideLabel is true or if not using p-floatlabel effectively) */
  placeholder = input<string>('');

  /** Unique ID for the input */
  id = input<string>(`text-field-${Math.random().toString(36).substr(2, 9)}`);

  /** Whether field is required */
  required = input<boolean>(false);

  /** Error message to display */
  error = input<string>('');

  /** Whether field is disabled */
  disabled = input<boolean>(false);

  /** Maximum character length */
  maxlength = input<number | null>(null);

  /** Input type (text, date, password, email, number) */
  type = input<string>('text');

  /** Key filter pattern: 'int' for integers only, 'num' for numbers, 'alpha' for letters, or custom regex */
  keyfilter = input<'int' | 'num' | 'alpha' | 'alphanum' | RegExp | null>(null);

  /** Track if field has been touched - using signal for reactivity */
  private _touched = signal(false);

  touched = computed(() => this._touched());

  showError = computed(() => {
    const errorMsg = this.error();
    const isTouched = this._touched();
    return isTouched && errorMsg.length > 0;
  });

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.field().set(value);
    this.onChange.emit(value);
  }

  onBlur(): void {
    this._touched.set(true);
  }

  onKeypress(event: KeyboardEvent): void {
    const filter = this.keyfilter();
    if (!filter) return;

    const char = event.key;

    // Allow control keys
    if (event.ctrlKey || event.altKey || event.metaKey ||
      char === 'Backspace' || char === 'Delete' || char === 'Tab' ||
      char === 'ArrowLeft' || char === 'ArrowRight' || char === 'Enter') {
      return;
    }

    let pattern: RegExp;
    if (filter === 'int') {
      pattern = /^[0-9]$/;
    } else if (filter === 'num') {
      pattern = /^[0-9.]$/;
    } else if (filter === 'alpha') {
      pattern = /^[a-zA-Z]$/;
    } else if (filter === 'alphanum') {
      pattern = /^[a-zA-Z0-9]$/;
    } else if (filter instanceof RegExp) {
      pattern = filter;
    } else {
      return;
    }

    if (!pattern.test(char)) {
      event.preventDefault();
    }
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
