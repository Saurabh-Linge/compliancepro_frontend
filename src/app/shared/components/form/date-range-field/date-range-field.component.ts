import { Component, input, WritableSignal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Reusable date range picker field component with signal-based binding
 * Designed for toolbar/filter placement with compact styling
 * 
 * @example
 * ```html
 * <app-date-range-field
 *   label="Filter by Date"
 *   [field]="dateRange"
 *   (onClear)="resetFilter()">
 * </app-date-range-field>
 * ```
 */
@Component({
  selector: 'app-date-range-field',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, ButtonModule, TooltipModule],
  template: `
    <div class="date-range-field">
      <p-datepicker
        [inputId]="id()"
        [ngModel]="field()()"
        (ngModelChange)="onValueChange($event)"
        [disabled]="disabled()"
        [dateFormat]="dateFormat()"
        [maxDate]="maxDate()"
        [showIcon]="true"
        [showButtonBar]="showButtonBar()"
        selectionMode="range"
        [readonlyInput]="true"
        [placeholder]="placeholder()"
        styleClass="date-range-picker"
        inputStyleClass="date-range-input">
      </p-datepicker>
      @if (showClearButton() && hasValue()) {
        <button pButton 
          type="button" 
          icon="pi pi-times" 
          class="p-button-text p-button-secondary p-button-sm clear-btn"
          (click)="onClear()"
          pTooltip="Clear date range">
        </button>
      }
    </div>
  `,
  styles: [`
    .date-range-field {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    :host ::ng-deep {
      .date-range-picker {
        width: auto;
      }

      .date-range-input {
        width: 200px;
        height: 2.5rem;
        font-size: 0.875rem;
        padding: 0.5rem 0.75rem;
      }

      .p-datepicker-trigger {
        height: 2.5rem;
      }
    }

    .clear-btn {
      height: 2.5rem;
      width: 2.5rem;
    }
  `]
})
export class DateRangeFieldComponent implements OnInit {
  /** Signal field for two-way binding - expects [startDate, endDate] array */
  field = input.required<WritableSignal<Date[] | null>>();

  /** Placeholder text */
  placeholder = input<string>('Select date range');

  /** Unique ID for the input */
  id = input<string>(`date-range-${Math.random().toString(36).substr(2, 9)}`);

  /** Whether field is disabled */
  disabled = input<boolean>(false);

  /** Date format string */
  dateFormat = input<string>('dd/mm/yy');

  /** Maximum selectable date (default: today) */
  maxDate = input<Date>(new Date());

  /** Show Today and Clear buttons in calendar */
  showButtonBar = input<boolean>(true);

  /** Show clear button next to the date picker */
  showClearButton = input<boolean>(true);

  /** Whether to set today's date as default on init */
  defaultToToday = input<boolean>(true);

  hasValue = computed(() => {
    const value = this.field()();
    return value && value.length > 0 && value[0] !== null;
  });

  ngOnInit(): void {
    // Set today's date as default if enabled and no value is set
    if (this.defaultToToday() && !this.hasValue()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      this.field().set([today, today]);
    }
  }

  onValueChange(value: Date[] | null): void {
    this.field().set(value);
  }

  onClear(): void {
    // Reset to today's date instead of null if defaultToToday is enabled
    if (this.defaultToToday()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      this.field().set([today, today]);
    } else {
      this.field().set(null);
    }
  }
}
