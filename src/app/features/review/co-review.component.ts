import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { inject } from "@angular/core";
import { APP_CONFIG } from "../../core/services/config/config.token";
import { NotificationService } from "../../core/services/notification/notification.service";
import { CardListComponent } from "../../shared/components/card-list/card-list.component";

@Component({
  selector: "app-co-review",
  standalone: true,
  imports: [CommonModule, CardListComponent],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">CO Review Queue</h5>
      </div>
      <app-card-list
        [data]="assignments()"
        [actions]="tableActions"
        [showSearch]="true"
        [showStatusFilter]="true"
        [showRefreshButton]="true"
        (onSearch)="handleSearch($event)"
        (onStatusChange)="handleStatusChange($event)"
        (onRefresh)="loadAssignments()">
      </app-card-list>
    </div>
  `
})
export class CoReviewComponent implements OnInit {
  rawAssignments = signal<any[]>([]);
  searchQuery = signal<string>('');
  selectedStatusFilter = signal<string | null>('REVIEW_PENDING'); // default filter is REVIEW_PENDING
  
  private config: any = inject(APP_CONFIG);

  assignments = computed(() => {
    let list = this.rawAssignments();
    
    // Filter by status selection
    const status = this.selectedStatusFilter();
    if (status) {
      list = list.filter((a: any) => a.status === status);
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

  tableActions = [
    { 
      label: "Review Evidence", 
      icon: "pi pi-search", 
      styleClass: "w-full",
      command: (row: any) => this.router.navigate(["/co-review", row.id]) 
    }
  ];

  constructor(private http: HttpClient, public router: Router, private notification: NotificationService) {}

  ngOnInit() { this.loadAssignments(); }

  loadAssignments() {
    this.http.get<any>(`${this.config.apiUrl}/assignments?limit=100`).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.rawAssignments.set(data);
      },
      error: (err) => this.notification.error("Failed to load assignments: " + (err.message || err.statusText))
    });
  }

  handleSearch(query: string) {
    this.searchQuery.set(query);
  }

  handleStatusChange(status: string | null) {
    this.selectedStatusFilter.set(status);
  }
}


