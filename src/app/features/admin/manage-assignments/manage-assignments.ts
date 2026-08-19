import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ComplianceApiService } from '../../../core/services/api/compliance-api.service';
import { TableComponent, TableColumn, TableAction } from '../../../shared/components/table/table.component';
import { DateFieldComponent } from '../../../shared/components/form/date-field/date-field.component';
import { PageComponent } from '../../../shared/components/page/page.component';

@Component({
  selector: 'app-manage-assignments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    ToastModule,
    TableComponent,
    DateFieldComponent
  ],
  templateUrl: './manage-assignments.html',
  styleUrls: ['./manage-assignments.scss']
})
export class ManageAssignmentsComponent implements OnInit {
  private apiService = inject(ComplianceApiService);
  private messageService = inject(MessageService);

  assignments = signal<any[]>([]);
  loading = signal<boolean>(true);
  totalRecords = signal<number>(0);

  // Pagination & Search
  page = 1;
  limit = 10;
  searchQuery = '';

  // Extend timeline modal state
  showExtendDialog = signal<boolean>(false);
  selectedAssignment = signal<any | null>(null);
  extendedDate = signal<Date | null>(null);
  submitting = signal<boolean>(false);
  minDate = signal<Date>(new Date());

  tableColumns: TableColumn[] = [
    { field: 'id', header: 'Assignment ID', width: '15%' },
    { field: 'task_set_name', header: 'Task Set Name', width: '30%' },
    { field: 'branch_name', header: 'Branch / Department', width: '25%' },
    { field: 'proposed_timeline', header: 'Expired Due Date', type: 'date', pipeFormat: 'mediumDate', width: '15%' },
    { field: 'status', header: 'Status', type: 'status', width: '15%' }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Extend Deadline',
      icon: 'pi pi-calendar-plus',
      command: (row) => this.openExtendDialog(row)
    }
  ];

  ngOnInit() {
    this.loadExpiredAssignments();
  }

  loadExpiredAssignments(isRefresh = false) {
    this.loading.set(true);
    this.apiService.getAssignments({
      page: this.page,
      limit: this.limit,
      search: this.searchQuery || undefined,
      only_expired: true
    }).subscribe({
      next: (res) => {
        this.assignments.set(res.data || []);
        this.totalRecords.set(res.total || 0);
        this.loading.set(false);
        if (isRefresh) {
          this.messageService.add({
            severity: 'info',
            summary: 'Refreshed',
            detail: 'Expired assignments list refreshed',
            life: 2500
          });
        }
      },
      error: (err) => {
        console.error('Failed to load expired assignments', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load expired assignments'
        });
      }
    });
  }

  handleSearch(query: string) {
    this.searchQuery = query;
    this.page = 1;
    this.loadExpiredAssignments();
  }

  handleLazyLoad(event: any) {
    this.page = (event.first / event.rows) + 1;
    this.limit = event.rows;
    if (event.globalFilter !== undefined) {
      this.searchQuery = event.globalFilter;
    }
    this.loadExpiredAssignments();
  }

  openExtendDialog(assignment: any) {
    this.selectedAssignment.set(assignment);
    
    // Set minDate to tomorrow or the current proposed_timeline + 1 day
    const timelineDate = assignment.proposed_timeline ? new Date(assignment.proposed_timeline) : new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Whichever is later
    const min = timelineDate > tomorrow ? timelineDate : tomorrow;
    this.minDate.set(min);

    // Default extended date is tomorrow or minDate
    this.extendedDate.set(min);
    this.showExtendDialog.set(true);
  }

  extendTimeline() {
    const assignment = this.selectedAssignment();
    const dateVal = this.extendedDate();
    if (!assignment || !dateVal) return;

    this.submitting.set(true);
    
    // Format date as YYYY-MM-DD
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    this.apiService.extendAssignmentTimeline(assignment.id, formattedDate).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showExtendDialog.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Assignment due date extended successfully'
        });
        this.loadExpiredAssignments();
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Failed to extend timeline', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to extend assignment due date'
        });
      }
    });
  }
}
