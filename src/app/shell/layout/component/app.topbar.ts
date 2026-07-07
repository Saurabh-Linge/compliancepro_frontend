import {
  Component,
  NgZone,
  signal,
  WritableSignal,
  inject,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '../service/layout.service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { SearchService } from '../../../core/services/search.service';
import { AutoCompleteModule, AutoCompleteSelectEvent, AutoComplete } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PopoverModule } from 'primeng/popover';
import { BadgeModule } from 'primeng/badge';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/services/keyboard-shortcut';
import { AuthService } from '../../../core/services/auth/auth.service';
import { APP_CONFIG } from '../../../core/services/config/config.token';

interface SearchItem {
  label: string;
  icon: string;
  route: string;
  keywords: string[];
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    StyleClassModule,
    ButtonModule,
    TooltipModule,
    ChipModule,
    AutoCompleteModule,
    SelectModule,
    InputGroupModule,
    InputGroupAddonModule,
    IconFieldModule,
    InputIconModule,
    PopoverModule,
    BadgeModule,
    FormsModule,
  ],
  template: `
    <div class="layout-topbar">
      <div class="layout-topbar-left">
        <button
          pTooltip="Menu"
          tooltipPosition="bottom"
          class="layout-menu-button layout-topbar-action"
          (click)="layoutService.onMenuToggle()"
        >
          <i class="pi pi-bars"></i>
        </button>
        <a class="layout-topbar-logo" routerLink="/">
          <!-- <img src="assets/images/logos/kredpool_logo.png" class="topbar-logo-img"> -->
          <span class="bank-name">{{ config.bank_name || 'The Kurla Nagrik Sahakari Bank Ltd' }}</span>
        </a>
      </div>

      <div class="layout-topbar-actions">
        <div class="topbar-search-wrapper">
          <p-iconField iconPosition="left">
            <p-inputIcon class="pi pi-search" />
            <p-autoComplete
              #searchInput
              [(ngModel)]="selectedItem"
              [suggestions]="suggestions"
              (completeMethod)="search($event)"
              (onSelect)="onSelect($event)"
              (onClear)="onClear()"
              placeholder="Search (Ctrl+K)"
              appendTo="body"
              [minLength]="0"
              [completeOnFocus]="true"
              [delay]="0"
              [style]="{ width: '100%' }"
              [inputStyle]="{ width: '100%' }"
              field="label"
              styleClass="topbar-search-autocomplete"
              [forceSelection]="false"
            >
              <ng-template let-item pTemplate="item">
                <div class="search-item">
                  <i [class]="item.icon" class="item-icon"></i>
                  <div class="item-details">
                    <span class="item-label">{{ item.label }}</span>
                    <span class="item-route">{{ item.route }}</span>
                  </div>
                </div>
              </ng-template>
            </p-autoComplete>
          </p-iconField>
        </div>

        <p-select
          [options]="languages"
          [(ngModel)]="selectedLanguage"
          optionLabel="label"
          optionValue="value"
          appendTo="body"
        >
          <ng-template pTemplate="selectedItem">
            <div class="flex align-items-center gap-2" *ngIf="selectedLanguage">
              <i class="pi pi-language"></i>
              <span>{{ selectedLanguage === 'en' ? 'English' : selectedLanguage }}</span>
            </div>
          </ng-template>
        </p-select>

        <p-button
          icon="pi pi-bell"
          pTooltip="Notification"
          tooltipPosition="bottom"
          styleClass="hide-on-small relative"
          severity="secondary"
          (click)="op.toggle($event)"
        >
          <p-badge *ngIf="unreadCount > 0" [value]="unreadCount.toString()" severity="danger" styleClass="absolute top-0 right-0 -mt-1 -mr-1"></p-badge>
        </p-button>

        <p-popover #op [style]="{ width: '400px' }">
          <div class="p-3">
            <h3 class="font-bold mb-3 border-b pb-2">Notifications</h3>
            <div *ngIf="notifications.length === 0" class="text-gray-500 text-sm">No new notifications.</div>
            <div class="max-h-64 overflow-y-auto">
              <div *ngFor="let n of notifications" 
                   class="mb-2 p-2 rounded cursor-pointer transition-colors"
                   [ngClass]="n.is_read ? 'bg-gray-50 opacity-75' : 'bg-blue-50 border-l-2 border-blue-500'"
                   (click)="markAsRead(n)">
                <div class="font-semibold text-sm">{{n.title}}</div>
                <div class="text-xs text-gray-700 mt-1">{{n.message}}</div>
                <div class="text-[0.65rem] text-gray-500 mt-1">{{n.created_at | date:'short'}}</div>
              </div>
            </div>
          </div>
        </p-popover>

        <div
          class="topbar-profile flex align-items-center gap-3 hide-on-small"
          (click)="logout()"
          tooltipPosition="bottom"
          style="padding: 0.35rem 0.75rem; margin-right: 0.5rem; border-radius: 8px; cursor: pointer; transition: all 0.2s ease-in-out; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);"
          onmouseover="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.borderColor='rgba(255, 255, 255, 0.16)';"
          onmouseout="this.style.background='rgba(255, 255, 255, 0.04)'; this.style.borderColor='rgba(255, 255, 255, 0.08)';"
        >
          <div
            class="profile-avatar flex align-items-center justify-content-center"
            style="width: 2.25rem; height: 2.25rem; border-radius: 50%; background: linear-gradient(135deg, #eaf1f8, #cbe0f2); color: #173a59; font-weight: 700; font-size: 0.95rem; border: 2px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08); transition: transform 0.2s;"
            onmouseover="this.style.transform='scale(1.05)';"
            onmouseout="this.style.transform='scale(1)';"
            (click)="$event.stopPropagation()"
          >
            {{ getAvatarInitial() }}
          </div>
          <div class="flex flex-column text-left" style="line-height: 1.25;">
            <span
              class="profile-name"
              style="font-weight: 600; font-size: 0.85rem; color: #ffffff; letter-spacing: 0.02em;"
              >{{ userName }}</span
            >
            <span
              class="profile-role"
              style="font-size: 0.68rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255, 255, 255, 0.65);"
              *ngIf="userDesignation"
              >{{ userDesignation }}</span
            >
          </div>
        </div>

        <div class="window-controls">
          <p-button
            icon="pi pi-power-off"
            pTooltip="Logout"
            tooltipPosition="bottom"
            styleClass="hide-on-small"
            severity="danger"
            (click)="logout()"
          ></p-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .topbar-search-wrapper {
        margin-right: 0.25rem;
        width: 240px;
        flex: none;
      }

      :host ::ng-deep {
        // .topbar-search-autocomplete {
        //     width: 100%;
        // }

        .topbar-search-autocomplete .p-autocomplete-input {
          // width: 100%;
          background-color: var(--surface-card) !important;
          color: var(--text-color) !important;
          border: 1px solid var(--surface-border);
          border-radius: 4px;
          padding-left: 2.5rem !important; /* Make room for icon */
          height: 2.25rem;
        }

        /* Remove the complex focus/border logic since IconField handles it */

        .topbar-search-autocomplete .p-autocomplete-panel {
          background: white;
          color: #333;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          margin-top: 0.5rem;
        }

        .topbar-search-autocomplete .p-autocomplete-item {
          padding: 0.75rem 1rem;
          color: #333;
        }

        .topbar-search-autocomplete .p-autocomplete-item:hover {
          background: #f0f0f0;
        }

        .layout-topbar-actions .p-button {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 4px;
          box-shadow: none;
        }

        .layout-topbar-actions .p-button.p-button-secondary {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .layout-topbar-actions .p-button.p-button-secondary .p-button-icon {
          color: #ffffff;
        }

        .layout-topbar-actions .p-button.p-button-secondary:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.28);
        }

        .layout-topbar-actions .p-select {
          height: 2.25rem;
          border-radius: 4px;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .layout-topbar-actions .p-select-label {
          display: flex;
          align-items: center;
          padding-top: 0;
          padding-bottom: 0;
          font-size: 0.875rem;
          color: #ffffff;
        }

        .layout-topbar-actions .p-select-dropdown {
          color: #ffffff;
        }
      }

      /* Search Item Styles */
      .search-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .item-icon {
        font-size: 1.1rem;
        color: var(--primary-color);
      }

      .item-details {
        display: flex;
        flex-direction: column;
      }

      .item-label {
        font-weight: 600;
        font-size: 0.9rem;
      }

      .item-route {
        font-size: 0.75rem;
        color: #777;
      }

      /* Windows-style Controls */
      .window-controls {
        display: flex;
        align-items: center;
        height: 100%;
        -webkit-app-region: no-drag;
      }
      /* ... rest of existing styles ... */
      .win-btn {
        background: transparent;
        border: none;
        color: white;
        width: 46px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
        outline: none;
      }

      .win-btn i {
        font-size: 14px;
      }

      .win-btn:hover {
        background-color: rgba(255, 255, 255, 0.12);
      }

      .win-btn.win-close:hover {
        background-color: #e81123;
      }

      .win-btn:active {
        background-color: rgba(255, 255, 255, 0.16);
      }

      /* Separator */
      .controls-separator {
        display: inline-block;
        width: 1px;
        height: 2.5rem;
        background: rgba(255, 255, 255, 0.18);
        margin: 0 8px;
        align-self: center;
      }
    `,
  ],
})
export class AppTopbar implements OnInit, OnDestroy {
  searchService = inject(SearchService);
  router = inject(Router);
  authService = inject(AuthService);
  config = inject(APP_CONFIG);

  @ViewChild('searchInput') searchInput!: AutoComplete;
  private searchSubscription?: Subscription;

  userName = 'User';
  userDesignation = '';
  branchId: number | null = null;

  // Notifications State
  notifications: any[] = [];
  unreadCount = 0;
  private notificationInterval: any;
  http = inject(HttpClient);

  // Role and Language Data
  languages = [{ label: 'English', value: 'en' }];

  selectedLanguage = 'en';

  suggestions: SearchItem[] = [];
  selectedItem: any;
  private items: SearchItem[] = [];

  constructor(
    public layoutService: LayoutService,
    private zone: NgZone,
  ) { }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user.full_name || user.fullName || user.name || 'User';
    this.userDesignation = user.role || user.designation || this.getUserRoleName(user.user_type_id);
    this.branchId = Number(user.branch_id || user.branchId || 0) || 1;

    this.loadNotifications();
    // Poll every 30 seconds
    this.notificationInterval = setInterval(() => this.loadNotifications(), 30000);

    // Subscribe to search focus requests
    this.searchSubscription = this.searchService.searchFocus$.subscribe(() => {
      if (this.searchInput) {
        const input = this.searchInput.el.nativeElement.querySelector('input');
        if (input) {
          input.focus();
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from search
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }

  loadNotifications() {
    // No branch_id param needed — backend reads identity from the JWT Bearer token
    this.http.get<any[]>(`${this.config.apiUrl}/notifications`).subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = data.filter(n => !n.is_read).length;
      },
      error: () => {} // silently ignore — topbar should not break on notification errors
    });
  }

  markAsRead(n: any) {
    if (n.is_read) return;
    this.http.put(`${this.config.apiUrl}/notifications/${n.id}/read`, {}).subscribe(() => {
      n.is_read = true;
      this.unreadCount = this.notifications.filter(x => !x.is_read).length;
    });
  }

  // Search Methods
  search(event: any) {
    const query = event.query.toLowerCase();

    // If query is empty, show all items
    if (!query || query.trim() === '') {
      this.suggestions = [...this.items];
      return;
    }

    // Helper to check if any word in text starts with query
    const matchesRequest = (text: string) => {
      if (!text) return false;
      return text
        .toLowerCase()
        .split(' ')
        .some((word) => word.startsWith(query));
    };

    const filtered = this.items.filter((item) => {
      return (
        matchesRequest(item.label) ||
        matchesRequest(item.route) ||
        item.keywords.some((k) => matchesRequest(k))
      );
    });

    this.suggestions = filtered.sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();

      // Priority 1: Exact match
      if (aLabel === query && bLabel !== query) return -1;
      if (bLabel === query && aLabel !== query) return 1;

      // Priority 2: Label Starts with
      const aStarts = aLabel.startsWith(query);
      const bStarts = bLabel.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      // Priority 3: Alphanumeric Sort
      return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  onSelect(event: AutoCompleteSelectEvent) {
    const item = event.value as SearchItem;
    this.router.navigate([item.route]);
    this.selectedItem = null; // Clear selection
  }

  onClear() {
    this.selectedItem = null;
    this.suggestions = [];
  }

  logout() {
    this.authService.logout();
  }

  getAvatarInitial(): string {
    return (this.userName || 'User').charAt(0).toUpperCase();
  }

  getUserRoleName(userTypeId: any): string {
    const typeId = Number(userTypeId);
    switch (typeId) {
      case 1:
        return 'Admin';
      case 2:
        return 'Auditor';
      case 3:
        return 'Employee';
      case 4:
        return 'Reviewer';
      case 5:
        return 'Top Level Management';
      default:
        return '';
    }
  }
}
