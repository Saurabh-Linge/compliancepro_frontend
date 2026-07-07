import { Component, input, WritableSignal, computed, signal, output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';

/**
 * Reusable number input field component with signal-based binding
 * 
 * @example
 * ```html
 * <app-number-field
 *   label="Price"
 *   [field]="price"
 *   [min]="0"
 *   [max]="10000"
 *   prefix="₹">
 * </app-number-field>
 * ```
 */
@Component({
  selector: 'app-number-field',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule, FloatLabelModule],
  template: `
    <div class="form-field">
      @if (hideLabel()) {
        <p-inputnumber 
          [inputId]="id()"
          [ngModel]="field()()"
          (ngModelChange)="onValueChange($event)"
          (onBlur)="onBlur()"
          [disabled]="disabled()"
          [min]="min()"
          [max]="max()"
          [minFractionDigits]="minFractionDigits()"
          [maxFractionDigits]="maxFractionDigits()"
          [step]="step()"
          [prefix]="prefix()"
          [suffix]="suffix()"
          [showButtons]="showButtons()"
          [buttonLayout]="buttonLayout()"
          [mode]="mode()"
          [currency]="currency()"
          [useGrouping]="useGrouping()"
          [placeholder]="placeholder()"
          [maxlength]="maxlength()"
          styleClass="w-full"
          [class.ng-invalid]="showError()"
          [class.ng-dirty]="touched()">
        </p-inputnumber>
      } @else {
        <p-floatlabel variant="on" [class.has-value]="hasValue()">
          <p-inputnumber 
            [inputId]="id()"
            [ngModel]="field()()"
            (ngModelChange)="onValueChange($event)"
            (onBlur)="onBlur()"
            [disabled]="disabled()"
            [min]="min()"
            [max]="max()"
            [minFractionDigits]="minFractionDigits()"
            [maxFractionDigits]="maxFractionDigits()"
            [step]="step()"
            [prefix]="prefix()"
            [suffix]="suffix()"
            [showButtons]="showButtons()"
            [buttonLayout]="buttonLayout()"
            [mode]="mode()"
            [currency]="currency()"
            [useGrouping]="useGrouping()"
            [maxlength]="maxlength()"
            styleClass="w-full"
            [class.ng-invalid]="showError()"
            [class.ng-dirty]="touched()">
          </p-inputnumber>
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

      .p-inputnumber {
        width: 100%;
      }
      
      .p-inputnumber input {
        width: 100%;
        font-size: 1rem;
        padding: 0.875rem 1rem;
      }

      .p-floatlabel label {
        font-weight: 500;
      }
    }
  `]
})
export class NumberFieldComponent {
  /** Signal field for two-way binding */
  field = input.required<WritableSignal<number | null>>();

  /** Event emitted when value changes */
  onChange = output<number | null>();

  /** Label text (optional if hideLabel is true) */
  label = input<string>('');

  /** Whether to hide the label and p-floatlabel */
  hideLabel = input<boolean>(false);

  /** Placeholder text */
  placeholder = input<string>('');

  /** Unique ID for the input */
  id = input<string>(`number-field-${Math.random().toString(36).substr(2, 9)}`);

  /** Whether field is required */
  required = input<boolean>(false);

  /** Error message to display */
  error = input<string>('');

  /** Whether field is disabled */
  disabled = input<boolean>(false);

  /** Minimum value */
  min = input<number | null>(null);

  /** Maximum value */
  max = input<number | null>(null);

  /** Maximum character length */
  maxlength = input<number | null>(null);

  /** Minimum fraction digits */
  minFractionDigits = input<number>(0);

  /** Maximum fraction digits */
  maxFractionDigits = input<number>(2);

  /** Step increment */
  step = input<number>(1);

  /** Prefix text (e.g., currency symbol) */
  prefix = input<string>('');

  /** Suffix text (e.g., unit) */
  suffix = input<string>('');

  /** Show increment/decrement buttons */
  showButtons = input<boolean>(false);

  /** Button layout: 'stacked' | 'horizontal' | 'vertical' */
  buttonLayout = input<'stacked' | 'horizontal' | 'vertical'>('stacked');

  /** Mode: 'decimal' | 'currency' */
  mode = input<'decimal' | 'currency'>('decimal');

  /** Currency code for 'currency' mode */
  currency = input<string>('INR');

  /** Whether to use grouping separator */
  useGrouping = input<boolean>(true);

  private _touched = signal(false);

  touched = computed(() => this._touched());

  showError = computed(() => {
    return this._touched() && this.error().length > 0;
  });

  /** Check if field has a value */
  hasValue = computed(() => {
    const value = this.field()();
    return value !== null && value !== undefined;
  });

  onValueChange(value: number | null): void {
    this.field().set(value);
    this.onChange.emit(value);
  }

  onBlur(): void {
    this._touched.set(true);
  }

  markTouched(): void {
    this._touched.set(true);
  }

  resetTouched(): void {
    this._touched.set(false);
  }
}
