import { Component, input, output, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';

/**
 * Reusable date picker field component with signal-based binding
 * 
 * @example
 * ```html
 * <app-date-field
 *   label="Birth Date"
 *   [field]="birthDate"
 *   dateFormat="dd/mm/yy">
 * </app-date-field>
 * ```
 */
@Component({
  selector: 'app-date-field',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, FloatLabelModule],
  template: `
    <div class="form-field">
      @if (hideLabel()) {
        <p-datepicker
          [inputId]="id()"
          [ngModel]="field()()"
          (ngModelChange)="onValueChange($event)"
          (onBlur)="onBlur()"
          [disabled]="disabled()"
          [dateFormat]="dateFormat()"
          [view]="view()"
          [minDate]="minDate()"
          [maxDate]="maxDate()"
          [showIcon]="showIcon()"
          [showButtonBar]="showButtonBar()"
          [showTime]="showTime()"
          [hourFormat]="hourFormat()"
          [selectionMode]="selectionMode()"
          [readonlyInput]="readonlyInput()"
          [placeholder]="placeholder()"
          appendTo="body"
          styleClass="w-full"
          [inputStyleClass]="'w-full ' + (showError() ? 'ng-invalid ng-dirty' : '')">
        </p-datepicker>
      } @else {
        <p-floatlabel variant="on">
          <p-datepicker
            [inputId]="id()"
            [ngModel]="field()()"
            (ngModelChange)="onValueChange($event)"
            (onBlur)="onBlur()"
            [disabled]="disabled()"
            [dateFormat]="dateFormat()"
            [view]="view()"
            [minDate]="minDate()"
            [maxDate]="maxDate()"
            [showIcon]="showIcon()"
            [showButtonBar]="showButtonBar()"
            [showTime]="showTime()"
            [hourFormat]="hourFormat()"
            [selectionMode]="selectionMode()"
            [readonlyInput]="readonlyInput()"
            [placeholder]="placeholder()"
            appendTo="body"
            styleClass="w-full"
            [inputStyleClass]="'w-full ' + (showError() ? 'ng-invalid ng-dirty' : '')">
          </p-datepicker>
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

      .p-datepicker {
        width: 100%;
      }

      .p-datepicker input {
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
export class DateFieldComponent {
  /** Signal field for two-way binding */
  field = input.required<WritableSignal<Date | null>>();

  /** Emits when value changes */
  onChange = output<Date | null>();

  /** Label text (optional if hideLabel is true) */
  label = input<string>('');

  /** Whether to hide the label and p-floatlabel */
  hideLabel = input<boolean>(false);

  /** Unique ID for the input */
  id = input<string>(`date-field-${Math.random().toString(36).substr(2, 9)}`);

  /** Whether field is required */
  required = input<boolean>(false);

  /** Error message to display */
  error = input<string>('');

  /** Whether field is disabled */
  disabled = input<boolean>(false);

  /** Date format string */
  dateFormat = input<string>('dd-mm-yy');

  /** View mode: 'date' | 'month' | 'year' */
  view = input<'date' | 'month' | 'year'>('date');

  /** Minimum selectable date */
  minDate = input<Date | null>(null);

  /** Maximum selectable date */
  maxDate = input<Date | null>(null);

  /** Show calendar icon */
  showIcon = input<boolean>(true);

  /** Show Today and Clear buttons */
  showButtonBar = input<boolean>(false);

  /** Include time selection */
  showTime = input<boolean>(false);

  /** Hour format: '12' or '24' */
  hourFormat = input<'12' | '24'>('12');

  /** Selection mode: 'single' | 'multiple' | 'range' */
  selectionMode = input<'single' | 'multiple' | 'range'>('single');

  /** Make input readonly (calendar only) */
  readonlyInput = input<boolean>(false);

  /** Placeholder text */
  placeholder = input<string>('');

  private _touched = false;

  touched = computed(() => this._touched);

  showError = computed(() => {
    return this._touched && this.error().length > 0;
  });

  onValueChange(value: Date | null): void {
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
