import { Component, input, output, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';

/**
 * Reusable checkbox field component with signal-based binding
 * 
 * @example
 * ```html
 * <app-checkbox-field
 *   label="Active"
 *   [field]="isActive">
 * </app-checkbox-field>
 * ```
 */
@Component({
  selector: 'app-checkbox-field',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule],
  template: `
    <div class="form-field checkbox-field">
      <p-checkbox
        [inputId]="id()"
        [ngModel]="field()()"
        (ngModelChange)="onValueChange($event)"
        [disabled]="disabled()"
        [binary]="true">
      </p-checkbox>
      <label [for]="id()" class="checkbox-label">
        {{ label() }}
        @if (required()) {
          <span class="text-red-500">*</span>
        }
      </label>
    </div>
  `,
  styles: [`
    .checkbox-field {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .checkbox-label {
      font-weight: 500;
      cursor: pointer;
      user-select: none;
    }

    :host ::ng-deep {
      .p-checkbox {
        width: 1.25rem;
        height: 1.25rem;
      }
    }
  `]
})
export class CheckboxFieldComponent {
  /** Signal field for two-way binding */
  field = input.required<WritableSignal<boolean>>();

  /** Emits when value changes */
  onChange = output<boolean>();

  /** Label text */
  label = input.required<string>();

  /** Unique ID for the input */
  id = input<string>(`checkbox-field-${Math.random().toString(36).substr(2, 9)}`);

  /** Whether field is required */
  required = input<boolean>(false);

  /** Whether field is disabled */
  disabled = input<boolean>(false);

  onValueChange(value: boolean): void {
    this.field().set(value);
    this.onChange.emit(value);
  }
}
