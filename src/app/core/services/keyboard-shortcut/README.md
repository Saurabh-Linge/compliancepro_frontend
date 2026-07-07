# Keyboard Shortcut Service

A comprehensive keyboard shortcut management system for Angular applications with support for both global (app-wide) and local (component-scoped) shortcuts.

## Features

- ✅ **Global Shortcuts**: Register shortcuts that work throughout the entire application
- ✅ **Local Shortcuts**: Register component-specific shortcuts with automatic lifecycle management
- ✅ **Duplicate Detection**: Automatic detection and warning for conflicting shortcuts
- ✅ **Priority Handling**: Local shortcuts automatically override global shortcuts
- ✅ **Modifier Keys**: Full support for Ctrl, Alt, Shift, and Meta (Command/Windows) keys
- ✅ **Cross-Platform**: Normalized key handling for consistent behavior across platforms
- ✅ **Input Protection**: Shortcuts are automatically disabled in input fields and textareas
- ✅ **Automatic Cleanup**: Component shortcuts are automatically removed on destruction

## Installation

The service is already integrated into your application. No additional installation required.

## Usage

### Global Shortcuts

Register global shortcuts in your app component or any root-level service:

```typescript
import { KeyboardShortcutService } from './core/services/keyboard-shortcut';

export class App implements OnInit {
  constructor(private keyboardShortcutService: KeyboardShortcutService) {}

  ngOnInit(): void {
    // Register a global shortcut
    this.keyboardShortcutService.registerGlobal({
      key: 'ctrl+k',
      description: 'Open global search',
      handler: (event) => {
        console.log('Search opened!');
        // Your logic here
      }
    });
  }
}
```

### Local Shortcuts (Programmatic)

Register local shortcuts in component lifecycle methods:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { KeyboardShortcutService } from '../../../core/services/keyboard-shortcut';

export class MyComponent implements OnInit, OnDestroy {
  private shortcutIds: string[] = [];

  constructor(private keyboardShortcutService: KeyboardShortcutService) {}

  ngOnInit(): void {
    // Register local shortcuts
    const saveId = this.keyboardShortcutService.registerLocal({
      key: 'ctrl+s',
      description: 'Save',
      handler: (event) => {
        this.save();
      }
    });
    this.shortcutIds.push(saveId);
  }

  ngOnDestroy(): void {
    // Clean up shortcuts
    this.shortcutIds.forEach(id => {
      this.keyboardShortcutService.unregister(id);
    });
  }

  save(): void {
    console.log('Saving...');
  }
}
```

### Local Shortcuts (Declarative with Directive)

Use the directive for simpler declarative syntax:

```typescript
import { KeyboardShortcutDirective } from '../../../core/services/keyboard-shortcut';

@Component({
  imports: [KeyboardShortcutDirective],
  // ...
})
export class MyComponent {
  handleSave = (event: KeyboardEvent) => {
    console.log('Saving...');
  };
}
```

```html
<div appKeyboardShortcut
     [shortcutKey]="'ctrl+s'"
     [shortcutHandler]="handleSave"
     [shortcutDescription]="'Save'">
</div>
```

## Key Format

Keys are case-insensitive and use the `+` separator for combinations:

- Single keys: `'f11'`, `'esc'`, `'delete'`
- With modifiers: `'ctrl+s'`, `'alt+shift+f'`, `'meta+k'`
- Modifiers: `ctrl`, `alt`, `shift`, `meta` (Command on Mac, Windows key on PC)

### Common Key Names

- Letters: `'a'` to `'z'`
- Numbers: `'0'` to `'9'`
- Function keys: `'f1'` to `'f12'`
- Special keys: `'esc'`, `'space'`, `'enter'`, `'tab'`, `'delete'`, `'backspace'`
- Arrow keys: `'arrowup'`, `'arrowdown'`, `'arrowleft'`, `'arrowright'`

## API Reference

### KeyboardShortcutService

#### Methods

**`registerGlobal(shortcut: KeyboardShortcut): string`**
- Registers a global shortcut active throughout the app
- Returns: Registration ID for later removal

**`registerLocal(shortcut: KeyboardShortcut): string`**
- Registers a local shortcut for a specific component
- Returns: Registration ID for later removal

**`unregister(id: string): void`**
- Removes a specific shortcut by its registration ID

**`unregisterAllLocal(): void`**
- Removes all local shortcuts (useful for bulk cleanup)

**`unregisterAllGlobal(): void`**
- Removes all global shortcuts

**`getRegistrations(): ShortcutRegistration[]`**
- Returns all currently registered shortcuts

### KeyboardShortcut Interface

```typescript
interface KeyboardShortcut {
  key: string;                    // Key combination (e.g., 'ctrl+k')
  handler: (event: KeyboardEvent) => void;  // Handler function
  description?: string;           // Optional description
  preventDefault?: boolean;       // Prevent default (default: true)
  stopPropagation?: boolean;      // Stop propagation (default: true)
}
```

## Duplicate Handling

When multiple shortcuts with the same key combination are registered:

1. **Local shortcuts take precedence** over global shortcuts
2. **Most recently registered local shortcut** takes precedence among local shortcuts
3. Console warnings are logged when duplicates are detected
4. Previous handlers remain registered but won't execute if a higher-priority handler exists

Example:
```typescript
// Global shortcut
keyboardShortcutService.registerGlobal({
  key: 'ctrl+f',
  handler: () => console.log('Global search')
});

// Local shortcut (takes precedence when component is active)
keyboardShortcutService.registerLocal({
  key: 'ctrl+f',
  handler: () => console.log('Local search')
});
```

## Examples

### Example 1: Global App Shortcuts

```typescript
// In app.ts
private registerGlobalShortcuts(): void {
  // Global search
  this.keyboardShortcutService.registerGlobal({
    key: 'ctrl+k',
    description: 'Open global search',
    handler: () => this.openSearch()
  });

  // Toggle fullscreen
  this.keyboardShortcutService.registerGlobal({
    key: 'f11',
    description: 'Toggle fullscreen',
    handler: () => this.toggleFullscreen()
  });
}
```

### Example 2: Component-Specific Shortcuts

```typescript
// In product-master.ts
private registerLocalShortcuts(): void {
  // Save
  this.shortcutIds.push(
    this.keyboardShortcutService.registerLocal({
      key: 'ctrl+s',
      description: 'Save product',
      handler: () => this.save()
    })
  );

  // New
  this.shortcutIds.push(
    this.keyboardShortcutService.registerLocal({
      key: 'ctrl+n',
      description: 'New product',
      handler: () => this.createNew()
    })
  );

  // Cancel
  this.shortcutIds.push(
    this.keyboardShortcutService.registerLocal({
      key: 'esc',
      description: 'Cancel',
      handler: () => this.cancel()
    })
  );
}
```

## Best Practices

1. **Always clean up local shortcuts** in `ngOnDestroy` to prevent memory leaks
2. **Use descriptive descriptions** to help with debugging and documentation
3. **Avoid conflicting with browser shortcuts** (e.g., Ctrl+T, Ctrl+W)
4. **Test on multiple platforms** as some key combinations may behave differently
5. **Provide visual indicators** in your UI showing available shortcuts
6. **Use global shortcuts sparingly** - too many can be confusing
7. **Group related shortcuts** with similar modifier patterns

## Troubleshooting

**Shortcut not working:**
- Check if you're typing in an input field (shortcuts are disabled there)
- Verify the key format is correct (lowercase, use '+' separator)
- Check browser console for duplicate warnings
- Ensure the component hasn't been destroyed (for local shortcuts)

**Duplicate warnings:**
- This is expected when you intentionally override shortcuts
- Review your shortcuts to ensure the priority is correct
- Consider using different key combinations if unintentional

**Memory leaks:**
- Always unregister shortcuts in `ngOnDestroy`
- Use the returned registration ID to track and clean up shortcuts

## File Structure

```
src/app/core/services/keyboard-shortcut/
├── keyboard-shortcut.model.ts      # Type definitions
├── keyboard-shortcut.service.ts    # Main service
├── keyboard-shortcut.directive.ts  # Declarative directive
├── index.ts                        # Barrel export
└── README.md                       # This file
```

## License

Part of the POS Frontend Local application.
