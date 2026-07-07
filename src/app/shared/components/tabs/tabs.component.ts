import { Component, input, output, signal, computed, ContentChildren, QueryList, AfterContentInit, OnChanges, OnInit, SimpleChanges, TemplateRef, Directive, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Defines a single tab item configuration.
 */
export interface TabItem {
  /** Unique key for the tab */
  key: string;
  /** Display label for the tab header */
  label: string;
  /** Optional PrimeNG icon class (e.g. 'pi pi-home') */
  icon?: string;
  /** Optional badge count displayed on the tab */
  badge?: number;
  /** Optional badge severity */
  badgeSeverity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
  /** Whether this tab is disabled */
  disabled?: boolean;
  /** Optional tooltip for the tab header */
  tooltip?: string;
  /** Visual status of the tab content */
  status?: 'saved' | 'pending' | 'none';
  /** Whether the tab is completely filled */
  isFilled?: boolean;
}

/**
 * Reusable dynamic PrimeNG Tabs component using Angular 21 signal-based inputs.
 *
 * @example
 * ```html
 * <app-tabs [tabs]="myTabs" [(activeKey)]="activeTabKey">
 *   <ng-template tabContent="info">
 *     <p>Info content here</p>
 *   </ng-template>
 *   <ng-template tabContent="settings">
 *     <p>Settings content here</p>
 *   </ng-template>
 * </app-tabs>
 * ```
 */
@Directive({ selector: '[tabContent]', standalone: true })
export class TabContentDirective {
  key = input.required<string>({ alias: 'tabContent' });
  constructor(public templateRef: TemplateRef<any>) {}
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, TabsModule, BadgeModule, TooltipModule],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TabsComponent implements OnInit, OnChanges, AfterContentInit {
  /** The tabs configuration array */
  tabs = input.required<TabItem[]>();

  /** The currently active tab key */
  activeKey = input<string>('');

  /** Emits when the active tab changes */
  activeKeyChange = output<string>();

  /** Whether to show status indicators (dots) in tab headers */
  showStatusIndicators = input<boolean>(true);

  /** Whether to show a scrollable tab bar for many tabs */
  scrollable = input<boolean>(false);

  /** Internal active index derived from activeKey */
  protected activeIndex = signal<number>(0);

  /** Map from tab key -> TemplateRef for projected content */
  protected contentMap = signal<Map<string, TemplateRef<any>>>(new Map());

  @ContentChildren(TabContentDirective) private tabContents!: QueryList<TabContentDirective>;

  /** Initialize the active index from the activeKey input */
  ngOnInit() {
    this.syncActiveIndex();
  }

  /** React to activeKey changes from parent two-way binding */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeKey']) {
      this.syncActiveIndex();
    }
  }

  ngAfterContentInit() {
    this.buildContentMap();
    // Re-build if the query list changes (e.g. *ngIf projections)
    this.tabContents.changes.subscribe(() => this.buildContentMap());
  }

  /** Syncs the internal activeIndex signal from activeKey input */
  private syncActiveIndex() {
    const key = this.activeKey();
    const idx = this.tabs().findIndex(t => t.key === key);
    this.activeIndex.set(idx >= 0 ? idx : 0);
  }

  /** Builds the key -> TemplateRef map from projected TabContentDirective */
  private buildContentMap() {
    const map = new Map<string, TemplateRef<any>>();
    this.tabContents.forEach(dir => {
      map.set(dir.key(), dir.templateRef);
    });
    this.contentMap.set(map);
  }

  /** Returns the TemplateRef for the given tab key */
  protected getTemplate(key: string): TemplateRef<any> | null {
    return this.contentMap()?.get(key) ?? null;
  }

  /** Called when PrimeNG tab changes */
  protected onTabChange(index: number | string | undefined) {
    if (index === undefined) return;
    const idx = Number(index);
    const tab = this.tabs()[idx];
    if (!tab || tab.disabled) return;
    this.activeIndex.set(idx);
    this.activeKeyChange.emit(tab.key);
  }

  /** Computed: active tab key */
  protected activeTabKey = computed(() => {
    const tab = this.tabs()[this.activeIndex()];
    return tab?.key ?? '';
  });
}
