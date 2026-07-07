import { Directive, Input, OnInit, OnDestroy } from '@angular/core';
import { KeyboardShortcutService } from './keyboard-shortcut.service';
import { KeyboardShortcut } from './keyboard-shortcut.model';

/**
 * Directive for declarative local keyboard shortcut registration
 * 
 * Usage:
 * ```html
 * <div appKeyboardShortcut
 *      [shortcutKey]="'ctrl+s'"
 *      [shortcutHandler]="handleSave"
 *      [shortcutDescription]="'Save changes'">
 * </div>
 * ```
 * 
 * Or bind the entire shortcut object:
 * ```html
 * <div appKeyboardShortcut [shortcut]="saveShortcut"></div>
 * ```
 */
@Directive({
  selector: '[appKeyboardShortcut]',
  standalone: true
})
export class KeyboardShortcutDirective implements OnInit, OnDestroy {
  @Input() shortcut?: KeyboardShortcut;
  @Input() shortcutKey?: string;
  @Input() shortcutHandler?: (event: KeyboardEvent) => void;
  @Input() shortcutDescription?: string;
  @Input() shortcutPreventDefault?: boolean;
  @Input() shortcutStopPropagation?: boolean;

  private registrationId?: string;

  constructor(private keyboardShortcutService: KeyboardShortcutService) { }

  ngOnInit(): void {
    const shortcutConfig = this.getShortcutConfig();

    if (shortcutConfig) {
      this.registrationId = this.keyboardShortcutService.registerLocal(shortcutConfig);
    } else {
      console.warn('[KeyboardShortcutDirective] No valid shortcut configuration provided');
    }
  }

  ngOnDestroy(): void {
    if (this.registrationId) {
      this.keyboardShortcutService.unregister(this.registrationId);
    }
  }

  private getShortcutConfig(): KeyboardShortcut | null {
    // If shortcut object is provided, use it
    if (this.shortcut) {
      return this.shortcut;
    }

    // Otherwise, build from individual inputs
    if (this.shortcutKey && this.shortcutHandler) {
      return {
        key: this.shortcutKey,
        handler: this.shortcutHandler,
        description: this.shortcutDescription,
        preventDefault: this.shortcutPreventDefault,
        stopPropagation: this.shortcutStopPropagation
      };
    }

    return null;
  }
}
