/**
 * Scope of a keyboard shortcut
 */
export enum ShortcutScope {
  /** Global shortcuts active throughout the entire application */
  GLOBAL = 'global',
  /** Local shortcuts active only within a specific component */
  LOCAL = 'local'
}

/**
 * Handler function for keyboard shortcuts
 */
export type ShortcutHandler = (event: KeyboardEvent) => void;

/**
 * Configuration for a keyboard shortcut
 */
export interface KeyboardShortcut {
  /** Key combination (e.g., 'ctrl+k', 'alt+shift+s', 'f11') */
  key: string;
  /** Handler function to execute when shortcut is triggered */
  handler: ShortcutHandler;
  /** Optional description of what the shortcut does */
  description?: string;
  /** Whether to prevent default browser behavior (default: true) */
  preventDefault?: boolean;
  /** Whether to stop event propagation (default: true) */
  stopPropagation?: boolean;
  /** Whether to trigger even if focused in an input/textarea (default: false) */
  allowInInput?: boolean;
}

/**
 * Internal registration tracking for shortcuts
 */
export interface ShortcutRegistration extends KeyboardShortcut {
  /** Unique identifier for this registration */
  id: string;
  /** Scope of the shortcut */
  scope: ShortcutScope;
  /** Normalized key combination for matching */
  normalizedKey: string;
  /** Timestamp when registered */
  registeredAt: number;
}

/**
 * Modifier keys that can be used in shortcuts
 */
export interface ModifierKeys {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}
