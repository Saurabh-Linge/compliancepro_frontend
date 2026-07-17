import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { inject } from "@angular/core";
import { APP_CONFIG } from "../../core/services/config/config.token";
import { NotificationService } from "../../core/services/notification/notification.service";
import { TableComponent, TableColumn } from "../../shared/components/table/table.component";
import { PageComponent } from "../../shared/components/page/page.component";

@Component({
  selector: "app-cco-review",
  standalone: true,
  imports: [CommonModule, TableComponent, PageComponent],
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
        (onRefresh)="loadAssignments()">
      </app-table>
    </div>
  `
})
export class CcoReviewComponent implements OnInit {
  assignments = signal<any[]>([]);
  private config: any = inject(APP_CONFIG);

  tableColumns: TableColumn[] = [
    { field: "branch_name", header: "Branch", width: "30%" },
    { field: "task_set_name", header: "Task Set", width: "40%" },
    { field: "status", header: "Status", type: "status", width: "20%" }
  ];

  tableActions = [
    { label: "Review", icon: "pi pi-eye", command: (row: any) => this.router.navigate(["/cco-review", row.id]) }
  ];

  constructor(private http: HttpClient, private router: Router, private notification: NotificationService) {}

  ngOnInit() { this.loadAssignments(); }

  loadAssignments() {
    this.http.get<any>(`${this.config.apiUrl}/assignments?limit=100`).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.assignments.set(data.filter((a: any) => a.status === "ESCALATED_TO_CCO"));
      },
      error: (err) => this.notification.error("Failed to load escalated assignments: " + (err.message || err.statusText))
    });
  }
}

