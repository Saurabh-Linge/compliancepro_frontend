import { Component, input, WritableSignal, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';

/**
 * Reusable chips input field component with signal-based binding
 * Allows adding multiple values using Enter key
 * Custom implementation for PrimeNG 21 (which doesn't have Chips module)
 * 
 * @example
 * ```html
 * <app-chips-field
 *   label="Tags"
 *   [field]="tags"
 *   [required]="true"
 *   [error]="tagsError()"
 *   placeholder="Add tags...">
 * </app-chips-field>
 * ```
 */
@Component({
  selector: 'app-chips-field',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, FloatLabelModule, ButtonModule],
  template: `
    <div class="form-field">
      @if (hideLabel()) {
        <div class="chips-input-wrapper" (click)="focusInput()">
          @for (chip of chipsValue; track $index) {
            <span class="chip-item">
              {{ chip }}
              @if (!disabled()) {
                <i class="pi pi-times chip-remove" (click)="removeChip($index)"></i>
              }
            </span>
          }
          <input 
            #inputEl
            pInputText
            [id]="id()"
            [(ngModel)]="inputValue"
            (keydown)="onKeyDown($event)"
            (blur)="onBlur()"
            [disabled]="disabled()"
            [placeholder]="chipsValue.length === 0 ? placeholder() : ''"
            class="chips-input" />
        </div>
      } @else {
        <p-floatlabel variant="on">
          <div class="chips-input-wrapper" (click)="focusInput()">
            @for (chip of chipsValue; track $index) {
              <span class="chip-item">
                {{ chip }}
                @if (!disabled()) {
                  <i class="pi pi-times chip-remove" (click)="removeChip($index)"></i>
                }
              </span>
            }
            <input 
              #inputEl
              pInputText
              [id]="id()"
              [(ngModel)]="inputValue"
              (keydown)="onKeyDown($event)"
              (blur)="onBlur()"
              [disabled]="disabled()"
              [placeholder]="chipsValue.length > 0 ? ' ' : ''"
              class="chips-input" />
          </div>
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

    .chips-input-wrapper {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      background: var(--p-inputtext-background, var(--surface-0));
      cursor: text;
      min-height: 3.5rem;
      transition: border-color 0.2s, box-shadow 0.2s;
      width: 100%;
      position: relative;
    }

    .chips-input-wrapper:hover:not(:has(input:disabled)) {
      border-color: var(--primary-color);
    }

    .chips-input-wrapper:focus-within {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 0.2rem var(--primary-color-alpha-20);
      outline: 0 none;
      outline-offset: 0;
    }

    .chips-input::placeholder {
      color: var(--text-color-secondary);
    }

    .chips-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

      .p-floatlabel label {
        font-weight: 500;
      }

      .p-floatlabel .chips-input-wrapper {
        width: 100%;
      }

      .chips-input {
        flex: 1;
        min-width: 120px;
        border: none !important;
        outline: none !important;
        padding: 0.875rem 0 !important;
        font-size: 1rem;
        background: transparent !important;
        color: var(--text-color);
        font-family: inherit;
        box-shadow: none !important;
        height: auto;
      }

      .chips-input:focus {
        border: none !important;
        box-shadow: none !important;
      }

      .chip-item {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        background: var(--highlight-bg);
        color: var(--highlight-text-color);
        border: 1px solid var(--primary-color);
        border-radius: 16px;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .chip-remove {
        cursor: pointer;
        font-size: 0.75rem;
        opacity: 0.8;
        transition: opacity 0.2s;
        margin-left: 0.25rem;
      }

      .chip-remove:hover {
        opacity: 1;
      }
    }
  `]
})
export class ChipsFieldComponent {
  /** Signal field for two-way binding - array of strings */
  field = input.required<WritableSignal<string[]>>();

  /** Label text (optional if hideLabel is true) */
  label = input<string>('');

  /** Whether to hide the label */
  hideLabel = input<boolean>(false);

  /** Placeholder text */
  placeholder = input<string>('');

  /** Unique ID for the input */
  id = input<string>(`chips-field-${Math.random().toString(36).substr(2, 9)}`);

  /** Whether field is required */
  required = input<boolean>(false);

  /** Error message to display */
  error = input<string>('');

  /** Whether field is disabled */
  disabled = input<boolean>(false);

  /** Maximum number of chips allowed */
  max = input<number | null>(null);

  /** Allow duplicate chips */
  allowDuplicate = input<boolean>(false);

  /** Separator character to split input (e.g., ',' or ';') */
  separator = input<string | null>(null);

  /** Internal chips value */
  chipsValue: string[] = [];

  /** Current input value */
  inputValue: string = '';

  /** Track if field has been touched */
  private _touched = signal(false);

  touched = computed(() => this._touched());

  showError = computed(() => {
    const errorMsg = this.error();
    const isTouched = this._touched();
    return isTouched && errorMsg.length > 0;
  });

  /** Check if field has a value */
  hasValue = computed(() => {
    return this.chipsValue.length > 0;
  });

  constructor() {
    // Watch for signal changes and update chipsValue
    effect(() => {
      const signalValue = this.field()();
      if (Array.isArray(signalValue)) {
        this.chipsValue = [...signalValue];
      }
    });
  }

  ngOnInit(): void {
    // Initialize chips value from signal
    this.chipsValue = [...this.field()()];
  }

  onKeyDown(event: KeyboardEvent): void {
    const separator = this.separator();

    // Handle Tab key to add chip (only if there's input)
    if (event.key === 'Tab' && this.inputValue.trim()) {
      event.preventDefault();
      this.addChip();
    }
    // Handle separator key
    else if (separator && event.key === separator) {
      event.preventDefault();
      this.addChip();
    }
    // Handle Backspace when input is empty
    else if (event.key === 'Backspace' && this.inputValue === '' && this.chipsValue.length > 0) {
      this.removeChip(this.chipsValue.length - 1);
    }
  }

  addChip(): void {
    const value = this.inputValue.trim();

    if (!value) return;

    // Check max limit
    const maxLimit = this.max();
    if (maxLimit !== null && this.chipsValue.length >= maxLimit) {
      return;
    }

    // Check duplicates
    if (!this.allowDuplicate() && this.chipsValue.includes(value)) {
      this.inputValue = '';
      return;
    }

    // Add chip
    this.chipsValue = [...this.chipsValue, value];
    this.field().set([...this.chipsValue]);
    this.inputValue = '';
  }

  removeChip(index: number): void {
    this.chipsValue = this.chipsValue.filter((_, i) => i !== index);
    this.field().set([...this.chipsValue]);
  }

  onBlur(): void {
    // Add chip on blur if there's input
    if (this.inputValue.trim()) {
      this.addChip();
    }
    this._touched.set(true);
  }

  focusInput(): void {
    // Focus the input when clicking on the container
    const input = document.getElementById(this.id()) as HTMLInputElement;
    if (input && !this.disabled()) {
      input.focus();
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
