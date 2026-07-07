import { Injectable, OnDestroy } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import {
  KeyboardShortcut,
  ShortcutScope,
  ShortcutRegistration,
  ModifierKeys
} from './keyboard-shortcut.model';

/**
 * Service for managing global and local keyboard shortcuts
 * 
 * Features:
 * - Global shortcuts: Active throughout the entire application lifecycle
 * - Local shortcuts: Active only within specific component lifecycles
 * - Duplicate detection: Warns when shortcuts conflict
 * - Priority handling: Local shortcuts override global shortcuts
 * - Automatic cleanup: Removes shortcuts when components are destroyed
 */
@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService implements OnDestroy {
  private registrations = new Map<string, ShortcutRegistration>();
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the keyboard event listener
   */
  private initialize(): void {
    if (this.isInitialized) return;

    this.keydownListener = (event: KeyboardEvent) => {
      this.handleKeydown(event);
    };

    window.addEventListener('keydown', this.keydownListener);
    this.isInitialized = true;
  }

  /**
   * Register a global keyboard shortcut
   * Global shortcuts remain active for the entire application lifecycle
   * 
   * @param shortcut Shortcut configuration
   * @returns Registration ID for later removal
   */
  registerGlobal(shortcut: KeyboardShortcut): string {
    return this.register(shortcut, ShortcutScope.GLOBAL);
  }

  /**
   * Register a local keyboard shortcut
   * Local shortcuts should be registered in component ngOnInit and
   * unregistered in ngOnDestroy
   * 
   * @param shortcut Shortcut configuration
   * @returns Registration ID for later removal
   */
  registerLocal(shortcut: KeyboardShortcut): string {
    return this.register(shortcut, ShortcutScope.LOCAL);
  }

  /**
   * Internal registration method
   */
  private register(shortcut: KeyboardShortcut, scope: ShortcutScope): string {
    const id = uuidv4();
    const normalizedKey = this.normalizeKey(shortcut.key);

    const registration: ShortcutRegistration = {
      ...shortcut,
      id,
      scope,
      normalizedKey,
      registeredAt: Date.now(),
      preventDefault: shortcut.preventDefault !== false,
      stopPropagation: shortcut.stopPropagation !== false
    };

    // Check for duplicates
    this.checkForDuplicates(registration);

    this.registrations.set(id, registration);

    console.debug(
      `[KeyboardShortcut] Registered ${scope} shortcut: ${shortcut.key}`,
      shortcut.description ? `(${shortcut.description})` : ''
    );

    return id;
  }

  /**
   * Unregister a keyboard shortcut by its ID
   * 
   * @param id Registration ID returned from register methods
   */
  unregister(id: string): void {
    const registration = this.registrations.get(id);
    if (registration) {
      this.registrations.delete(id);
      console.debug(
        `[KeyboardShortcut] Unregistered ${registration.scope} shortcut: ${registration.key}`
      );
    }
  }

  /**
   * Unregister all local shortcuts
   * Useful for component cleanup
   */
  unregisterAllLocal(): void {
    const localIds = Array.from(this.registrations.values())
      .filter(reg => reg.scope === ShortcutScope.LOCAL)
      .map(reg => reg.id);

    localIds.forEach(id => this.unregister(id));
  }

  /**
   * Unregister all global shortcuts
   */
  unregisterAllGlobal(): void {
    const globalIds = Array.from(this.registrations.values())
      .filter(reg => reg.scope === ShortcutScope.GLOBAL)
      .map(reg => reg.id);

    globalIds.forEach(id => this.unregister(id));
  }

  /**
   * Get all registered shortcuts
   */
  getRegistrations(): ShortcutRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * Handle keydown events
   */
  private handleKeydown(event: KeyboardEvent): void {
    const normalizedKey = this.normalizeKeyFromEvent(event);
    let matchingRegistrations = this.findMatchingRegistrations(normalizedKey);

    // Filter out shortcuts not allowed in inputs if focused on an input
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    if (isInput) {
      matchingRegistrations = matchingRegistrations.filter(reg => reg.allowInInput);
    }

    if (matchingRegistrations.length > 0) {
      // Get the highest priority registration (local > global, most recent first)
      const registration = this.getHighestPriority(matchingRegistrations);

      if (registration.preventDefault) {
        event.preventDefault();
      }
      if (registration.stopPropagation) {
        event.stopPropagation();
      }

      try {
        registration.handler(event);
      } catch (error) {
        console.error('[KeyboardShortcut] Error executing handler:', error);
      }
    }
  }

  /**
   * Find all registrations matching a normalized key
   */
  private findMatchingRegistrations(normalizedKey: string): ShortcutRegistration[] {
    return Array.from(this.registrations.values())
      .filter(reg => reg.normalizedKey === normalizedKey);
  }

  /**
   * Get the highest priority registration from a list
   * Priority: Local > Global, Most Recent > Oldest
   */
  private getHighestPriority(registrations: ShortcutRegistration[]): ShortcutRegistration {
    return registrations.sort((a, b) => {
      // Local shortcuts have priority over global
      if (a.scope !== b.scope) {
        return a.scope === ShortcutScope.LOCAL ? -1 : 1;
      }
      // Most recently registered has priority
      return b.registeredAt - a.registeredAt;
    })[0];
  }

  /**
   * Check for duplicate shortcuts and log warnings
   */
  private checkForDuplicates(newRegistration: ShortcutRegistration): void {
    const duplicates = this.findMatchingRegistrations(newRegistration.normalizedKey);

    if (duplicates.length > 0) {
      const existingScopes = duplicates.map(d => d.scope).join(', ');
      console.warn(
        `[KeyboardShortcut] Duplicate shortcut detected: ${newRegistration.key}`,
        `\nNew: ${newRegistration.scope}`,
        `\nExisting: ${existingScopes}`,
        `\nThe ${newRegistration.scope} shortcut will take precedence when active.`
      );
    }
  }

  /**
   * Normalize a key string to a consistent format
   * Example: 'Ctrl+K' -> 'ctrl+k', 'alt+SHIFT+s' -> 'alt+shift+s'
   */
  private normalizeKey(key: string): string {
    const parts = key.toLowerCase().split('+').map(p => p.trim());
    const modifiers = ['ctrl', 'alt', 'shift', 'meta'].filter(m => parts.includes(m));
    const mainKey = parts.find(p => !['ctrl', 'alt', 'shift', 'meta'].includes(p)) || '';

    // Sort modifiers alphabetically for consistency
    modifiers.sort();

    return [...modifiers, mainKey].join('+');
  }

  /**
   * Normalize a key from a keyboard event
   */
  private normalizeKeyFromEvent(event: KeyboardEvent): string {
    const modifiers: string[] = [];

    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');

    // Get the main key
    let mainKey = event.key.toLowerCase();

    // Handle special cases
    if (mainKey === ' ') mainKey = 'space';
    if (mainKey === 'escape') mainKey = 'esc';

    // Sort modifiers alphabetically
    modifiers.sort();

    return [...modifiers, mainKey].join('+');
  }

  /**
   * Cleanup when service is destroyed
   */
  ngOnDestroy(): void {
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
    this.registrations.clear();
    this.isInitialized = false;
  }
}
