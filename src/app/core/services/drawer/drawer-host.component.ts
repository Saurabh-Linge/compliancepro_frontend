import {
  Component, Input, OnInit, OnDestroy,
  ViewChild, ViewContainerRef, EnvironmentInjector,
  Type, signal, ViewEncapsulation, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { Subject } from 'rxjs';
import { FormDrawerRef } from './form-drawer.ref';
import { FormDrawerConfig } from './form-drawer.types';

/**
 * @internal
 * Dynamically-created host that wraps p-drawer and renders any
 * content component inside it. Managed exclusively by FormDrawerService.
 */
@Component({
  selector: 'app-drawer-host',
  standalone: true,
  imports: [CommonModule, DrawerModule, ButtonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <p-drawer
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [position]="config.position || 'right'"
      [style]="{ width: config.width || '540px' }"
      [modal]="config.modal !== false"
      [dismissible]="config.dismissible !== false"
      [showCloseIcon]="false"
      appendTo="body"
      styleClass="form-drawer-host"
      (onHide)="onDrawerFullyHidden()"
    >
      <!-- Header -->
      <ng-template pTemplate="header">
        <div class="drawer-header">
          <span class="drawer-title">
            @if (config.icon) {
              <i [class]="config.icon + ' drawer-title-icon'"></i>
            }
            {{ config.header }}
          </span>
          <button
            pButton
            type="button"
            icon="pi pi-times"
            class="p-button-text p-button-secondary p-button-sm drawer-close-btn"
            (click)="closeByX()"
          ></button>
        </div>
      </ng-template>

      <!-- Dynamic content slot -->
      <ng-container #contentSlot />

    </p-drawer>
  `,
  styles: [`
    /* ── Drawer chrome ──────────────────────────────────────── */
    .form-drawer-host {
      display: flex;
      flex-direction: column;

      .p-drawer-header {
        padding: 1rem 1.25rem 0.75rem;
        border-bottom: 1px solid var(--surface-200);
        flex-shrink: 0;
      }

      .p-drawer-content {
        flex: 1;
        overflow-y: auto;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
    }

    /* ── Header layout ──────────────────────────────────────── */
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 0.5rem;
    }

    .drawer-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .drawer-title-icon {
      color: var(--primary-color);
      font-size: 1rem;
    }

    .drawer-close-btn {
      width: 2rem !important;
      height: 2rem !important;
      flex-shrink: 0;
    }
  `]
})
export class DrawerHostComponent implements OnInit, OnDestroy {
  @Input({ required: true }) config!: FormDrawerConfig;
  @Input({ required: true }) contentType!: Type<any>;
  @Input({ required: true }) drawerRef!: FormDrawerRef;
  @Input({ required: true }) injector!: EnvironmentInjector;

  @ViewChild('contentSlot', { read: ViewContainerRef, static: true })
  private contentSlot!: ViewContainerRef;

  visible = signal(false);

  /**
   * @internal Emits once after p-drawer's (onHide) fires,
   * signalling the service that the animation + backdrop cleanup is done.
   */
  readonly afterHidden$ = new Subject<void>();

  ngOnInit() {
    // Render content component with the child injector (provides FormDrawerRef)
    this.contentSlot.clear();
    this.contentSlot.createComponent(this.contentType, {
      environmentInjector: this.injector,
    });

    // Trigger open animation on next tick
    setTimeout(() => this.visible.set(true), 0);
  }

  ngOnDestroy() {
    this.contentSlot.clear();
    this.afterHidden$.complete();

    // 1. Remove the global scroll-lock class PrimeNG uses
    document.body.classList.remove('p-overflow-hidden');
    document.body.style.overflow = '';
    
    // 2. Forcefully remove any stranded PrimeNG masks from the DOM
    const strandedMasks = document.querySelectorAll('.p-drawer-mask, .p-component-overlay');
    strandedMasks.forEach(mask => mask.remove());
  }

  /** p-drawer overlay click / dismissible close */
  onVisibleChange(v: boolean) {
    if (!v) {
      // Let drawerRef handle it; avoid double-trigger on manual hide()
      if (!this._hiding) {
        this.drawerRef.close();
      }
    }
  }

  /** X button click */
  closeByX() {
    this.drawerRef.close();
  }

  /**
   * Called by service — sets visible to false to trigger p-drawer close animation.
   * The actual cleanup happens in onDrawerFullyHidden().
   */
  private _hiding = false;
  hide() {
    this._hiding = true;
    this.visible.set(false);

    // Fallback: If PrimeNG's onHide event drops, force cleanup after 350ms
    setTimeout(() => this._finalizeClose(), 350);
  }

  /** Fires naturally the exact millisecond PrimeNG's CSS slide animation finishes */
  onDrawerFullyHidden() {
    this._finalizeClose();
  }

  private _finalizeClose() {
    if (!this.afterHidden$.closed) {
      this.afterHidden$.next();
      this.afterHidden$.complete();
    }
  }
}
