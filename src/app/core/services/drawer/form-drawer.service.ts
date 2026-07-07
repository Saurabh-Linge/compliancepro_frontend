import {
  Injectable, Type, ApplicationRef,
  createComponent, EnvironmentInjector, Injector
} from '@angular/core';
import { FormDrawerRef } from './form-drawer.ref';
import { DrawerHostComponent } from './drawer-host.component';
import { FormDrawerConfig, FormDrawerResult } from './form-drawer.types';

// Re-export for consumers
export type { FormDrawerConfig, FormDrawerResult } from './form-drawer.types';

/**
 * Programmatic Drawer Service — mirrors FormDialogService but uses p-drawer.
 *
 * Content component injects FormDrawerRef to close:
 * ```ts
 * private ref = inject(FormDrawerRef);
 * onSave()   { this.ref.close(payload); }
 * onCancel() { this.ref.close(); }
 * ```
 *
 * Caller awaits the result:
 * ```ts
 * const result = await this.formDrawer.open(MyFormComponent, {
 *   header: 'New Record',
 *   icon: 'pi pi-plus',
 *   width: '600px',
 * });
 * if (result.saved) doSomethingWith(result.data);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class FormDrawerService {

  constructor(
    private appRef: ApplicationRef,
    private envInjector: EnvironmentInjector,
  ) {}

  /**
   * Open a side-drawer with the given content component.
   * @param component Standalone Angular component to render as drawer content.
   * @param config    Drawer configuration (header, width, position, …).
   * @returns Promise resolving to FormDrawerResult when drawer closes.
   */
  open<TComponent, TInput = any, TResult = any>(
    component: Type<TComponent>,
    config: FormDrawerConfig<TInput> = { header: '' }
  ): Promise<FormDrawerResult<TResult>> {
    return new Promise((resolve) => {

      // ── 1. Create a DrawerRef the content component can inject ──
      const drawerRef = new FormDrawerRef<TResult, TInput>();
      drawerRef.data = config.data;

      // ── 2. Build child injector providing FormDrawerRef ─────────
      const childInjector = Injector.create({
        providers: [{ provide: FormDrawerRef, useValue: drawerRef }],
        parent: this.envInjector,
      });

      // ── 3. Dynamically create the host component ─────────────────
      const hostRef = createComponent(DrawerHostComponent, {
        environmentInjector: this.envInjector,
        elementInjector: childInjector,
      });

      // ── 4. Pass inputs to the host ───────────────────────────────
      hostRef.setInput('config',       config);
      hostRef.setInput('contentType',  component);
      hostRef.setInput('drawerRef',    drawerRef);
      // Give the host the child injector so it creates the content
      // component with FormDrawerRef available
      hostRef.setInput('injector', childInjector as any);

      // ── 5. Attach to document and start change detection ─────────
      this.appRef.attachView(hostRef.hostView);
      document.body.appendChild(hostRef.location.nativeElement);

      // ── 6. Handle close → hide drawer → destroy after animation ──
      drawerRef._close$.subscribe({
        next: (result: TResult | undefined) => {
          
          // Wait for p-drawer to finish its animation and cleanup
          hostRef.instance.afterHidden$.subscribe(() => {
            this.appRef.detachView(hostRef.hostView);
            hostRef.destroy();
            hostRef.location.nativeElement.remove();

            resolve(
              result === undefined
                ? { saved: false }
                : { saved: true, data: result }
            );
          });

          // Trigger the close animation
          hostRef.instance.hide();
        },
      });
    });
  }
}
