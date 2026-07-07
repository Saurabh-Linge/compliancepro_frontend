/**
 * Form Components Barrel Export
 * 
 * Provides reusable form field components with Angular signal-based binding.
 * All components use PrimeNG under the hood with consistent styling.
 * 
 * @example
 * ```typescript
 * import { TextFieldComponent, NumberFieldComponent, FormActionsComponent } from '@shared/components/form';
 * ```
 */

import { TextFieldComponent } from './text-field/text-field.component';
import { NumberFieldComponent } from './number-field/number-field.component';
import { SelectFieldComponent } from './select-field/select-field.component';
import { MultiSelectFieldComponent } from './multi-select-field/multi-select-field.component';
import { TextareaFieldComponent } from './textarea-field/textarea-field.component';
import { CheckboxFieldComponent } from './checkbox-field/checkbox-field.component';
import { DateFieldComponent } from './date-field/date-field.component';
import { ChipsFieldComponent } from './chips-field/chips-field.component';
import { FormActionsComponent } from './form-actions/form-actions.component';
import { AutocompleteFieldComponent } from './autocomplete-field/autocomplete-field.component';
import { PasswordFieldComponent } from './password-field/password-field.component';

// Export components
export { TextFieldComponent } from './text-field/text-field.component';
export { NumberFieldComponent } from './number-field/number-field.component';
export { SelectFieldComponent } from './select-field/select-field.component';
export { MultiSelectFieldComponent } from './multi-select-field/multi-select-field.component';
export { TextareaFieldComponent } from './textarea-field/textarea-field.component';
export { CheckboxFieldComponent } from './checkbox-field/checkbox-field.component';
export { DateFieldComponent } from './date-field/date-field.component';
export { ChipsFieldComponent } from './chips-field/chips-field.component';
export { AutocompleteFieldComponent } from './autocomplete-field/autocomplete-field.component';
export { PasswordFieldComponent } from './password-field/password-field.component';
export { FormActionsComponent } from './form-actions/form-actions.component';

/**
 * All form field components for easy import
 */
export const FORM_COMPONENTS = [
  TextFieldComponent,
  NumberFieldComponent,
  SelectFieldComponent,
  MultiSelectFieldComponent,
  TextareaFieldComponent,
  CheckboxFieldComponent,
  DateFieldComponent,
  ChipsFieldComponent,
  AutocompleteFieldComponent,
  PasswordFieldComponent,
  FormActionsComponent
] as const;
