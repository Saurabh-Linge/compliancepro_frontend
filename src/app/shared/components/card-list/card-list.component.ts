import { Component, Input, Output, EventEmitter, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    PaginatorModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TagModule,
    RippleModule,
    TooltipModule
  ],
  templateUrl: './card-list.component.html'
})
export class CardListComponent {
  data = input<any[]>([]);
  actions = input<any[]>([]);
  showSearch = input<boolean>(false);
  showStatusFilter = input<boolean>(false);
  showRefreshButton = input<boolean>(true);
  paginator = input<boolean>(false);
  rows = input<number>(10);
  totalRecords = input<number>(0);
  first = input<number>(0);
  loading = input<boolean>(false);

  onSearch = output<string>();
  onStatusChange = output<string | null>();
  onPageChange = output<any>();
  onRefresh = output<void>();

  searchQuery = signal<string>('');
  selectedStatusFilter = signal<string | null>(null);

  statusFilterOptions = [
    { label: 'Pending Timeline',  value: 'Pending_Timeline' },
    { label: 'Timeline Review',   value: 'Timeline_Review' },
    { label: 'In Progress',       value: 'In_Progress' },
    { label: 'Review Pending',    value: 'REVIEW_PENDING' },
    { label: 'Completed',         value: 'COMPLETED' },
    { label: 'Escalated to CCO',  value: 'ESCALATED_TO_CCO' },
    { label: 'Rejected',          value: 'REJECTED' },
  ];

  trackById(index: number, item: any): any {
    return item.id || index;
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.onSearch.emit(value);
  }

  onStatusFilterChange(value: string | null) {
    this.selectedStatusFilter.set(value);
    this.onStatusChange.emit(value);
  }

  onPageChangeClick(event: any) {
    this.onPageChange.emit(event);
  }

  onRefreshClick() {
    this.onRefresh.emit();
  }

  hasVisibleActions(item: any): boolean {
    const actList = this.actions();
    if (!actList || actList.length === 0) return false;
    return actList.some(action => action.visible === undefined || action.visible(item));
  }

  getStatusLabel(status: string): string {
    if (!status) return '';
    const map: Record<string, string> = {
      'Pending_Timeline': 'Pending Timeline',
      'Timeline_Review': 'Timeline Review',
      'In_Progress': 'In Progress',
      'REVIEW_PENDING': 'Review Pending',
      'COMPLETED': 'Completed',
      'ESCALATED_TO_CCO': 'Escalated to CCO',
      'REJECTED': 'Rejected'
    };
    return map[status] || status;
  }

  getBadgeClass(value: any): string {
    if (value === null || value === undefined) return 'bg-gray-100 text-gray-700 border-round px-2.5 py-1 font-semibold text-xs';
    
    if (typeof value === 'boolean') {
      return value 
        ? 'bg-green-100 text-green-700 border-round px-2.5 py-1 font-semibold text-xs' 
        : 'bg-orange-100 text-orange-700 border-round px-2.5 py-1 font-semibold text-xs';
    }

    const val = String(value).toUpperCase();
    const base = 'border-round px-2.5 py-1 font-semibold text-xs inline-block ';
    
    if (val === 'ORIGINAL') return base + 'bg-gray-100 text-gray-600 border-1 border-gray-300';
    if (val === 'AMENDMENT') return base + 'bg-blue-100 text-blue-700';
    if (val.includes('NOT_FOUND') || val.includes('ERROR') || val.includes('FAILED') || val.includes('REJECTED') || val.includes('INACTIVE') || val.includes('ESCALATED')) {
      return base + 'bg-red-100 text-red-700';
    }
    if (val === 'COMPLETED' || val === 'SUCCESS' || val === 'APPROVED' || val === 'ACTIVE') {
      return base + 'bg-green-100 text-green-700';
    }
    if (val.includes('PENDING') || val === 'PROCESSING' || val === 'QUEUED' || val.includes('REVIEW')) {
      return base + 'bg-orange-100 text-orange-700';
    }
    if (val.includes('PROGRESS')) {
      return base + 'bg-blue-100 text-blue-700';
    }
    return base + 'bg-indigo-100 text-indigo-700';
  }
}
