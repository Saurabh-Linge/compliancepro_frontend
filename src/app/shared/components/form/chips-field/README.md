# Chips Field Component

A reusable chips input field component using PrimeNG 21 Chips module with signal-based binding.

## Features

- ✅ Add multiple chips using **Enter** key
- ✅ Signal-based two-way binding
- ✅ Optional separator support (comma, semicolon, etc.)
- ✅ Add chips on blur/tab
- ✅ Duplicate prevention option
- ✅ Maximum chips limit
- ✅ Validation and error display
- ✅ Consistent styling with other form components

## Installation

The component is already created at:
`src/app/shared/components/form/chips-field/chips-field.component.ts`

## Basic Usage

### 1. Import the Component

```typescript
import { ChipsFieldComponent } from '@shared/components/form/chips-field/chips-field.component';

@Component({
  // ...
  imports: [ChipsFieldComponent]
})
```

### 2. Create a Signal

```typescript
export class YourComponent {
  tags = signal<string[]>([]);
  tagsError = computed(() => {
    return this.tags().length === 0 ? 'At least one tag is required' : '';
  });
}
```

### 3. Use in Template

```html
<app-chips-field
  label="Tags"
  [field]="tags"
  [required]="true"
  [error]="tagsError()"
  placeholder="Add tags and press Enter">
</app-chips-field>
```

## Advanced Usage

### With Separator

```html
<app-chips-field
  label="Email Addresses"
  [field]="emails"
  separator=","
  placeholder="Enter emails separated by comma">
</app-chips-field>
```

### With Max Limit

```html
<app-chips-field
  label="Keywords"
  [field]="keywords"
  [max]="5"
  placeholder="Add up to 5 keywords">
</app-chips-field>
```

### Allow Duplicates

```html
<app-chips-field
  label="Items"
  [field]="items"
  [allowDuplicate]="true">
</app-chips-field>
```

### Without Label (Inline)

```html
<app-chips-field
  [field]="tags"
  [hideLabel]="true"
  placeholder="Add tags...">
</app-chips-field>
```

## Component Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `field` | `WritableSignal<string[]>` | **required** | Signal for two-way binding |
| `label` | `string` | `''` | Label text |
| `hideLabel` | `boolean` | `false` | Hide the floating label |
| `placeholder` | `string` | `''` | Placeholder text |
| `id` | `string` | auto-generated | Unique input ID |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `string` | `''` | Error message to display |
| `disabled` | `boolean` | `false` | Disable the input |
| `max` | `number \| null` | `null` | Maximum number of chips |
| `allowDuplicate` | `boolean` | `false` | Allow duplicate chips |
| `addOnBlur` | `boolean` | `true` | Add chip on blur |
| `addOnTab` | `boolean` | `true` | Add chip on Tab key |
| `separator` | `string \| null` | `null` | Separator character (e.g., ',') |

## Complete Example

```typescript
import { Component, signal, computed } from '@angular/core';
import { ChipsFieldComponent } from '@shared/components/form/chips-field/chips-field.component';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [ChipsFieldComponent],
  template: `
    <div class="form-container">
      <app-chips-field
        label="Product Tags"
        [field]="tags"
        [required]="true"
        [error]="tagsError()"
        [max]="10"
        placeholder="Add tags and press Enter">
      </app-chips-field>

      <app-chips-field
        label="Email Recipients"
        [field]="emails"
        separator=","
        placeholder="Enter emails separated by comma">
      </app-chips-field>

      <button (click)="submit()">Submit</button>
    </div>
  `
})
export class ExampleComponent {
  tags = signal<string[]>([]);
  emails = signal<string[]>([]);

  tagsError = computed(() => {
    const value = this.tags();
    if (value.length === 0) return 'At least one tag is required';
    if (value.length > 10) return 'Maximum 10 tags allowed';
    return '';
  });

  submit(): void {
    console.log('Tags:', this.tags());
    console.log('Emails:', this.emails());
  }
}
```

## Keyboard Shortcuts

- **Enter**: Add current input as a chip
- **Tab**: Add current input as a chip (if `addOnTab` is true)
- **Backspace**: Remove last chip when input is empty
- **Separator key**: Add chip when separator is configured

## Styling

The component uses PrimeNG theming and includes custom styles for:
- Chip appearance (rounded, colored)
- Input container padding
- Error message display
- Responsive width

You can customize colors by overriding CSS variables in your global styles.
