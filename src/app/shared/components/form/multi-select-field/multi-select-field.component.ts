import { Component, input, WritableSignal, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Reusable multi-select field component with signal-based binding
 * 
 * **Key Feature**: Preserves selection sequence - items are stored in the order
 * they were selected, not in option order.
 * 
 * @example
 * ```html
 * <app-multi-select-field
 *   label="Categories"
 *   [field]="selectedCategories"
 *   [options]="categories"
 *   optionLabel="name"
 *   optionValue="id"
 *   [filter]="true">
 * </app-multi-select-field>
 * ```
 */
@Component({
  selector: 'app-multi-select-field',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectModule, FloatLabelModule, ButtonModule, TooltipModule],
  template: `
    <div class="form-field">
      <div class="field-wrapper">
        <p-floatlabel variant="on">
          <p-multiselect
            [inputId]="id()"
            [ngModel]="field()()"
            (ngModelChange)="onValueChange($event)"
            (onBlur)="onBlur()"
            (onFilter)="onFilter($event)"
            [options]="sortedOptions()"
            [optionLabel]="optionLabel()"
            [optionValue]="optionValue()"
            [disabled]="disabled()"
            [filter]="filter()"
            [filterBy]="filterBy()"
            [showClear]="showClear()"
            [maxSelectedLabels]="maxSelectedLabels()"
            [selectedItemsLabel]="selectedItemsLabel()"
            [display]="display()"
            [virtualScroll]="virtualScroll()"
            [virtualScrollItemSize]="virtualScrollItemSize()"
            [scrollHeight]="scrollHeight()"
            appendTo="body"
            styleClass="w-full"
            [class.ng-invalid]="showError()"
            [class.ng-dirty]="touched()">
          </p-multiselect>
          <label [for]="id()">
            {{ label() }}
            @if (required()) {
              <span class="text-red-500">*</span>
            }
          </label>
        </p-floatlabel>
        @if (showAddButton() && !disabled()) {
          <button 
            type="button" 
            pButton 
            icon="pi pi-plus" 
            class="p-button-text p-button-sm add-btn" 
            [pTooltip]="addTooltip()" 
            tooltipPosition="top"
            (click)="onAddClick($event)">
          </button>
        }
      </div>
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
      gap: 0.25rem;
    }

    .field-wrapper {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      width: 100%;
    }

    .field-wrapper > *:first-child {
      flex: 1;
    }

    .add-btn {
      flex: 0 0 auto;
      width: 2.25rem !important;
      height: 2.25rem !important;
      background: transparent !important;
      border: none !important;
      color: var(--primary-color) !important;
      padding: 0 !important;
      
      &:hover {
        background: var(--surface-100) !important;
      }
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

      .p-multiselect {
        width: 100%;
      }

      .p-multiselect .p-multiselect-label {
        font-size: 1rem;
        padding: 0.875rem 1rem;
      }

      .p-floatlabel label {
        font-weight: 500;
      }
    }
  `]
})
export class MultiSelectFieldComponent<T = any> {
  /** Signal field for two-way binding - stores values in selection order */
  field = input.required<WritableSignal<T[]>>();

  /** Label text */
  label = input.required<string>();

  /** Options array */
  options = input.required<any[]>();

  /** Unique ID for the input */
  id = input<string>(`multi-select-field-${Math.random().toString(36).substr(2, 9)}`);

  /** Property name to display as label */
  optionLabel = input<string>('label');

  /** Property name to use as value */
  optionValue = input<string | undefined>(undefined);

  /** Placeholder text */
  placeholder = input<string>('Select...');

  /** Whether field is required */
  required = input<boolean>(false);

  /** Error message to display */
  error = input<string>('');

  /** Whether field is disabled */
  disabled = input<boolean>(false);

  /** Enable filtering/search */
  filter = input<boolean>(true);

  /** Properties to filter by */
  filterBy = input<string>('label');

  /** Show clear button */
  showClear = input<boolean>(false);

  /** Max labels to show before summarizing (e.g., "3 items selected") */
  maxSelectedLabels = input<number>(3);

  /** Label template when max exceeded, use {0} for count */
  selectedItemsLabel = input<string>('{0} items selected');

  /** Display mode: 'comma' or 'chip' */
  display = input<'comma' | 'chip'>('comma');

  /** Enable virtual scrolling for large datasets */
  virtualScroll = input<boolean>(true);

  /** Height of each item in virtual scroll (default 38px) */
  virtualScrollItemSize = input<number>(38);

  /** Max height of dropdown panel */
  scrollHeight = input<string>('200px');

  /** Show add button */
  showAddButton = input<boolean>(false);

  /** Add button tooltip */
  addTooltip = input<string>('Add New');

  /** Add event emitter */
  add = output<void>();

  private _filterQuery = signal<string>('');

  /** Sorted options based on filter query priority */
  sortedOptions = computed(() => {
    const query = this._filterQuery().toLowerCase().trim();
    const options = this.options() || [];
    const labelKey = this.optionLabel();

    if (!query) return options;

    return [...options].sort((a, b) => {
      const labelA = String(a[labelKey] || '').toLowerCase();
      const labelB = String(b[labelKey] || '').toLowerCase();

      const scoreA = labelA === query ? 0 : (labelA.startsWith(query) ? 1 : 2);
      const scoreB = labelB === query ? 0 : (labelB.startsWith(query) ? 1 : 2);

      return scoreA - scoreB;
    });
  });

  private _touched = false;

  touched = computed(() => this._touched);

  showError = computed(() => {
    return this._touched && this.error().length > 0;
  });

  /**
   * Handles value changes while preserving selection sequence.
   * New selections are appended to the end, deselections remove from current position.
   */
  onValueChange(newValue: T[]): void {
    const currentValue = this.field()();

    // Create a Set of current values for O(1) lookup
    const currentSet = new Set(currentValue);
    const newSet = new Set(newValue);

    // Find newly added items (in newValue but not in current)
    const addedItems = newValue.filter(item => !currentSet.has(item));

    // Filter current items to keep only those still selected (preserves order)
    const retained = currentValue.filter(item => newSet.has(item));

    // Append new items to the end (in the order they appear in newValue)
    const orderedValue = [...retained, ...addedItems];

    this.field().set(orderedValue);
  }

  onBlur(): void {
    this._touched = true;
  }

  onAddClick(event: Event): void {
    event.stopPropagation();
    this.add.emit();
  }

  markTouched(): void {
    this._touched = true;
  }

  resetTouched(): void {
    this._touched = false;
  }

  onFilter(event: any): void {
    this._filterQuery.set(event.filter || '');
  }
}
