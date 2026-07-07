import { Component, signal, computed } from '@angular/core';
import { ChipsFieldComponent } from './chips-field.component';
import { CommonModule } from '@angular/common';

/**
 * Example component demonstrating ChipsFieldComponent usage
 */
@Component({
  selector: 'app-chips-example',
  standalone: true,
  imports: [CommonModule, ChipsFieldComponent],
  template: `
    <div class="example-container">
      <h2>Chips Field Examples</h2>

      <!-- Basic Example -->
      <div class="example-section">
        <h3>Basic Tags</h3>
        <app-chips-field
          label="Product Tags"
          [field]="tags"
          [required]="true"
          [error]="tagsError()"
          placeholder="Add tags and press Enter">
        </app-chips-field>
        <p>Current tags: {{ tags().join(', ') || 'None' }}</p>
      </div>

      <!-- With Separator -->
      <div class="example-section">
        <h3>Email Addresses (Comma Separated)</h3>
        <app-chips-field
          label="Recipients"
          [field]="emails"
          separator=","
          placeholder="Enter emails separated by comma">
        </app-chips-field>
        <p>Emails: {{ emails().join(', ') || 'None' }}</p>
      </div>

      <!-- With Max Limit -->
      <div class="example-section">
        <h3>Keywords (Max 5)</h3>
        <app-chips-field
          label="Keywords"
          [field]="keywords"
          [max]="5"
          [error]="keywordsError()"
          placeholder="Add up to 5 keywords">
        </app-chips-field>
        <p>Keywords: {{ keywords().join(', ') || 'None' }}</p>
      </div>

      <!-- Without Label -->
      <div class="example-section">
        <h3>Inline Chips (No Label)</h3>
        <app-chips-field
          [field]="inlineChips"
          [hideLabel]="true"
          placeholder="Add items...">
        </app-chips-field>
        <p>Items: {{ inlineChips().join(', ') || 'None' }}</p>
      </div>

      <!-- Submit Button -->
      <button (click)="submit()" class="submit-btn">
        Submit All
      </button>
    </div>
  `,
  styles: [`
    .example-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
    }

    h2 {
      margin-bottom: 2rem;
      color: var(--text-color);
    }

    .example-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      background: var(--surface-card);
    }

    .example-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: var(--text-color);
      font-size: 1.1rem;
    }

    .example-section p {
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--surface-ground);
      border-radius: 4px;
      font-size: 0.9rem;
      color: var(--text-color-secondary);
    }

    .submit-btn {
      padding: 0.75rem 1.5rem;
      background: var(--primary-color);
      color: var(--primary-color-text);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: background 0.2s;
    }

    .submit-btn:hover {
      background: var(--primary-600);
    }
  `]
})
export class ChipsExampleComponent {
  // Basic tags
  tags = signal<string[]>(['angular', 'primeng']);

  tagsError = computed(() => {
    const value = this.tags();
    if (value.length === 0) return 'At least one tag is required';
    return '';
  });

  // Email addresses
  emails = signal<string[]>([]);

  // Keywords with max limit
  keywords = signal<string[]>([]);

  keywordsError = computed(() => {
    const value = this.keywords();
    if (value.length > 5) return 'Maximum 5 keywords allowed';
    return '';
  });

  // Inline chips
  inlineChips = signal<string[]>([]);

  submit(): void {
    console.log('=== Form Submitted ===');
    console.log('Tags:', this.tags());
    console.log('Emails:', this.emails());
    console.log('Keywords:', this.keywords());
    console.log('Inline Chips:', this.inlineChips());

    alert('Check console for submitted values!');
  }
}
