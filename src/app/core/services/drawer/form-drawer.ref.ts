import { Subject } from 'rxjs';

/**
 * Reference to an open drawer, injected into the content component.
 * Use this to close the drawer and optionally return data to the caller.
 *
 * @example
 * // In your drawer content component:
 * private ref = inject(FormDrawerRef);
 *
 * onSave() { this.ref.close(payload); }
 * onCancel() { this.ref.close(); }
 */
export class FormDrawerRef<TResult = any, TInput = any> {
  /** Input data passed to the drawer */
  data?: TInput;

  /** @internal Emits when close() is called. Consumed by host. */
  readonly _close$ = new Subject<TResult | undefined>();
  config: any;

  /**
   * Close the drawer.
   * @param data Optional result data. When provided the caller resolves
   *             `{ saved: true, data }`. When omitted it resolves `{ saved: false }`.
   */
  close(data?: TResult): void {
    this._close$.next(data);
    this._close$.complete();
  }
}
