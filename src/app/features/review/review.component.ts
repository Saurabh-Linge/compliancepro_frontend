import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from '../../core/services/config/config.token';
import { AuthService } from '../../core/services/auth/auth.service';
import { Router } from '@angular/router';

import { TableComponent, TableColumn, TableAction } from '../../shared/components/table/table.component';
import { PageComponent } from '../../shared/components/page/page.component';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, PageComponent],
  template: `
    <app-page [title]="isCco ? 'CCO Escalations Review' : 'Compliance Officer Review'" 
              icon="pi pi-check-circle" 
              [description]="isCco ? 'Review assignments escalated by COs.' : 'Review and approve branch-submitted evidence.'">
      <div class="card h-full mt-4">
        <app-table
            [data]="assignments()"
            [columns]="tableColumns"
            [actions]="tableActions"
            [showAddButton]="false"
            [showRefreshButton]="true"
            [paginator]="true"
            [rows]="10"
            (onRefresh)="loadAssignments()"
        ></app-table>
      </div>
    </app-page>
  `
})
export class ReviewComponent implements OnInit {
  assignments = signal<any[]>([]);
  
  private config: any = inject(APP_CONFIG);

  tableColumns: TableColumn[] = [
    { field: 'task_set_name', header: 'Task Set Name', width: '40%' },
    { field: 'branch_name', header: 'Branch', width: '30%' },
    { field: 'status', header: 'Status', type: 'status', width: '20%' }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Review Evidence',
      icon: 'pi pi-search',
      command: (row) => this.goToReview(row.id)
    }
  ];

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) {}

  get isCco(): boolean {
    return this.auth.currentUser()?.role === 'CCO';
  }

  ngOnInit() {
    this.loadAssignments();
  }

  loadAssignments() {
    this.http.get<any[]>(`${this.config.apiUrl}/assignments`).subscribe(data => {
      if (this.isCco) {
        this.assignments.set(data.filter(a => a.status === 'ESCALATED_TO_CCO'));
      } else {
        this.assignments.set(data.filter(a => a.status === 'REVIEW_PENDING'));
      }
    });
  }

  goToReview(id: number) {
    this.router.navigate(['/review', id]);
  }
}
