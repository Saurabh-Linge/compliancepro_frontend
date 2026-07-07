import { Component, input, WritableSignal, computed, signal, output, contentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';

/**
 * Reusable autocomplete field component with signal-based binding
 * 
 * @example
 * ```html
 * <app-autocomplete-field
 *   label="Customer"
 *   [field]="selectedCustomer"
 *   [suggestions]="filteredCustomers()"
 *   (completeMethod)="search($event)"
 *   field="customer_name">
 *   <ng-template let-item pTemplate="item">
 *     <div>{{ item.customer_name }}</div>
 *   </ng-template>
 * </app-autocomplete-field>
 * ```
 */
@Component({
  selector: 'app-autocomplete-field',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule, FloatLabelModule, ButtonModule],
  template: `
    <div class="form-field">
      @if (hideLabel()) {
        <p-autoComplete
          [inputId]="id()"
          [ngModel]="field()()"
          (ngModelChange)="onValueChange($event)"
          [suggestions]="suggestions()"
          (completeMethod)="onCompleteMethod($event)"
          (onSelect)="onSelect.emit($event)"
          (onClear)="onClear.emit()"
          (onBlur)="onBlur()"
          [optionLabel]="optionLabel()"
          [minLength]="minLength()"
          [delay]="delay()"
          [forceSelection]="forceSelection()"
          [showClear]="showClear()"
          [placeholder]="placeholder()"
          [dropdown]="dropdown()"
          [multiple]="multiple()"
          [disabled]="disabled()"
          styleClass="w-full"
          [inputStyleClass]="'w-full'"
          appendTo="body"
          [class.ng-invalid]="showError()"
          [class.ng-dirty]="touched()">
            @if (itemTemplate()) {
              <ng-template let-item pTemplate="item">
                <ng-container *ngTemplateOutlet="itemTemplate()!; context: { $implicit: item }"></ng-container>
              </ng-template>
            }
        </p-autoComplete>
      } @else {
        <p-floatlabel variant="on">
          <p-autoComplete
            [inputId]="id()"
            [ngModel]="field()()"
            (ngModelChange)="onValueChange($event)"
            [suggestions]="suggestions()"
            (completeMethod)="onCompleteMethod($event)"
            (onSelect)="onSelect.emit($event)"
            (onClear)="onClear.emit()"
            (onBlur)="onBlur()"
            [optionLabel]="optionLabel()"
            [minLength]="minLength()"
            [delay]="delay()"
            [forceSelection]="forceSelection()"
            [showClear]="showClear()"
            [placeholder]="placeholder()"
            [dropdown]="dropdown()"
            [multiple]="multiple()"
            [disabled]="disabled()"
            styleClass="w-full"
            [inputStyleClass]="'w-full'"
            appendTo="body"
            [class.ng-invalid]="showError()"
            [class.ng-dirty]="touched()">
              @if (itemTemplate()) {
                <ng-template let-item pTemplate="item">
                  <ng-container *ngTemplateOutlet="itemTemplate()!; context: { $implicit: item }"></ng-container>
                </ng-template>
              }
          </p-autoComplete>
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

      .p-autocomplete {
        width: 100%;
      }
      
      .p-autocomplete-input {
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
export class AutocompleteFieldComponent<T = any> {
  /** Signal field for two-way binding */
  field = input.required<WritableSignal<any>>(); // Can be string or object

  /** Label text */
  label = input<string>('');

  /** Whether to hide label */
  hideLabel = input<boolean>(false);

  /** Suggestions array */
  suggestions = input.required<any[]>();

  /** Field to display (property name) */
  optionLabel = input<string | undefined>(undefined); // 'field' in primeNG

  /** Unique ID */
  id = input<string>(`autocomplete-field-${Math.random().toString(36).substr(2, 9)}`);

  /** Required field */
  required = input<boolean>(false);

  /** Error message */
  error = input<string>('');

  /** Disabled state */
  disabled = input<boolean>(false);

  /** Placeholder */
  placeholder = input<string>('');

  /** Min length to trigger search */
  minLength = input<number>(1);

  /** Delay in ms */
  delay = input<number>(300);

  /** Force selection from list */
  forceSelection = input<boolean>(false);

  /** Show clear button */
  showClear = input<boolean>(false);

  /** Show dropdown button */
  dropdown = input<boolean>(false);

  /** Multiple selection */
  multiple = input<boolean>(false);

  /** Template for items */
  itemTemplate = contentChild<TemplateRef<any>>('itemTemplate');

  /** Event: Search/Complete */
  completeMethod = output<any>();

  /** Event: Select */
  onSelect = output<AutoCompleteSelectEvent>();

  /** Event: Clear */
  onClear = output<void>();

  private _touched = signal(false);
  touched = computed(() => this._touched());

  showError = computed(() => {
    return this._touched() && this.error().length > 0;
  });

  onValueChange(value: any) {
    this.field().set(value);
  }

  onCompleteMethod(event: any) {
    this.completeMethod.emit(event);
  }

  onBlur() {
    this._touched.set(true);
  }
}
