import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { inject } from "@angular/core";
import { APP_CONFIG } from "../../core/services/config/config.token";
import { NotificationService } from "../../core/services/notification/notification.service";
import { TableComponent, TableColumn, TableAction } from "../../shared/components/table/table.component";
import { SelectModule } from "primeng/select";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-cco-review",
  standalone: true,
  imports: [CommonModule, TableComponent, SelectModule, FormsModule],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">CCO Review Queue</h5>
      </div>
      <app-table
        [data]="assignments()"
        [columns]="tableColumns"
        [actions]="tableActions"
        [showAddButton]="false"
        [showRefreshButton]="true"
        [paginator]="true"
        [rows]="10"
        (onSearch)="handleSearch($event)"
        (onRefresh)="loadAssignments()"
      >
        <div toolbar-actions class="flex align-items-center gap-2">
          <p-select
            [options]="statusFilterOptions"
            [ngModel]="selectedStatusFilter()"
            (ngModelChange)="handleStatusChange($event)"
            placeholder="Filter by Status"
            [showClear]="true"
            optionLabel="label"
            optionValue="value"
            class="w-full sm:w-16rem"
            styleClass="h-2.5rem flex align-items-center"
          ></p-select>
        </div>
      </app-table>
    </div>
  `
})
export class CcoReviewComponent implements OnInit {
  rawAssignments = signal<any[]>([]);
  searchQuery = signal<string>('');
  selectedStatusFilter = signal<string | null>(null);

  private config: any = inject(APP_CONFIG);

  tableColumns: TableColumn[] = [
    { field: 'task_set_name', header: 'Task Set Name', width: '40%' },
    { field: 'branch_name', header: 'Dept/Branch', width: '30%' },
    { field: 'status', header: 'Status', type: 'status', width: '20%' }
  ];

  statusFilterOptions = [
    { label: 'Escalated to CCO', value: 'ESCALATED_TO_CCO' },
    { label: 'Timeline Review', value: 'Timeline_Review' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Rejected', value: 'Rejected' }
  ];

  assignments = computed(() => {
    let list = this.rawAssignments();

    // Filter by status selection
    const status = this.selectedStatusFilter();
    if (status) {
      list = list.filter((a: any) => a.status?.toUpperCase() === status?.toUpperCase());
    }

    // Filter by search query
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter((a: any) =>
        (a.branch_name && a.branch_name.toLowerCase().includes(query)) ||
        (a.task_set_name && a.task_set_name.toLowerCase().includes(query))
      );
    }

    return list;
  });

  tableActions: TableAction[] = [
    {
      label: "Review Timeline",
      icon: "pi pi-calendar-plus",
      visible: (row: any) => row.status?.toUpperCase() === 'TIMELINE_REVIEW',
      command: (row: any) => this.router.navigate(["/cco-review", row.id])
    },
    {
      label: "Review Compliance",
      icon: "pi pi-shield",
      visible: (row: any) => ['REVIEW_PENDING', 'ESCALATED_TO_CCO'].includes(row.status?.toUpperCase()),
      command: (row: any) => this.router.navigate(["/cco-review", row.id])
    },
    {
      label: "View Compliance",
      icon: "pi pi-eye",
      visible: (row: any) => ['IN_PROGRESS', 'COMPLETED', 'REJECTED', 'PENDING_RECOMPLIANCE'].includes(row.status?.toUpperCase()),
      command: (row: any) => this.router.navigate(["/cco-review", row.id])
    }
  ];

  constructor(private http: HttpClient, public router: Router, private notification: NotificationService) { }

  ngOnInit() { this.loadAssignments(); }

  loadAssignments() {
    this.http.get<any>(`${this.config.apiUrl}/assignments?limit=100`).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.rawAssignments.set(data);
      },
      error: (err) => this.notification.error("Failed to load escalated assignments: " + (err.message || err.statusText))
    });
  }

  handleSearch(query: string) {
    this.searchQuery.set(query);
  }

  handleStatusChange(status: string | null) {
    this.selectedStatusFilter.set(status);
  }
}



