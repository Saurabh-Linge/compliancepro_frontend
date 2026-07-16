import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplianceApiService } from '../../core/services/api/compliance-api.service';
import { TableComponent, TableColumn, TableAction } from '../../shared/components/table/table.component';
import { PageComponent } from '../../shared/components/page/page.component';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { PickListModule } from 'primeng/picklist';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FieldsetModule } from 'primeng/fieldset';
import { SelectModule } from 'primeng/select';

import { TextFieldComponent } from '../../shared/components/form/text-field/text-field.component';
import { SelectFieldComponent } from '../../shared/components/form/select-field/select-field.component';
import { DateFieldComponent } from '../../shared/components/form/date-field/date-field.component';

@Component({
  selector: 'app-task-sets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    PageComponent,
    DialogModule,
    DrawerModule,
    ButtonModule,
    MultiSelectModule,
    PickListModule,
    DateFieldComponent,
    TextFieldComponent,
    SelectFieldComponent,
    ToastModule,
    FieldsetModule,
    SelectModule
  ],
  providers: [MessageService],
  templateUrl: './task-sets.html',
  styles: [`
    ::ng-deep .circular-dropdown-panel {
      max-width: 560px !important;
      min-width: 400px !important;
    }
    ::ng-deep .circular-dropdown-panel .p-select-option,
    ::ng-deep .circular-dropdown-panel .p-dropdown-item {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 540px !important;
      line-height: 1.4 !important;
      font-size: 0.875rem !important;
      display: block !important;
    }
  `]
})
export class TaskSetsComponent implements OnInit {
  taskSets = signal<any[]>([]);

  tableColumns: TableColumn[] = [
    { field: 'circular_title', header: 'Circular Title', type: 'text', width: '25%' },
    { field: 'name', header: 'Task Set Name', type: 'text', width: '25%' },
    { field: 'default_due_date', header: 'Due Date', type: 'date' },
    { field: 'start_date', header: 'Start Date', type: 'date' },
    { field: 'frequency', header: 'Frequency', type: 'text' },
    { field: 'created_at', header: 'Created', type: 'date' }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: (row) => this.openFormDrawer(row)
    },
    {
      label: 'Auto-Generate Assignments',
      icon: 'pi pi-cog',
      command: (row) => this.triggerAssignmentGeneration(row),
      styleClass: 'p-button-success'
    },
    {
      label: 'Reopen For Recompliance',
      icon: 'pi pi-refresh',
      command: (row) => this.reopenTaskSet(row),
      styleClass: 'p-button-warning'
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: (row) => this.deleteTaskSet(row),
      styleClass: 'p-button-danger'
    }
  ];


  // Modals state
  showFormDrawer = signal(false);
  isEditMode = false;
  selectedTaskSet: any = null;
  showBranchAssignment = signal(false);

  // Form states as WritableSignals
  newTaskSetName = signal<string>('');
  newTaskSetCircularId = signal<number | null>(null);
  newTaskSetDueDate = signal<Date | null>(null);
  newTaskSetStartDate = signal<Date | null>(null);
  newTaskSetEndDate = signal<Date | null>(null);
  newTaskSetFrequency = signal<string>('');
  newTaskSetReportingDate = signal<Date | null>(null);

  frequencies = [
    { label: 'FORTNIGHT - Every 15 Days', value: '1' },
    { label: 'MONTHLY - Every Month', value: '2' },
    { label: 'QUARTERLY - Every Three Months', value: '3' },
    { label: 'SEMIANNUALLY - Every Six Months', value: '4' },
    { label: 'YEARLY - Every Year', value: '5' },
    { label: '1 Time Use', value: '6' }
  ];

  readonly frequencyMap: Record<string, string> = {
    '1': 'Fortnight (Every 15 Days)',
    '2': 'Monthly',
    '3': 'Quarterly',
    '4': 'Semi-Annually',
    '5': 'Yearly',
    '6': '1 Time Use'
  };

  // Mapping
  rawTasks = signal<any[]>([]);
  selectedCircularFilter = signal<number | null>(null);
  formCircularFilter = signal<number | null>(null);
  circulars = signal<any[]>([]);

  allTasks = computed(() => {
    const tasks = this.rawTasks();
    const filterId = this.formCircularFilter();
    if (!filterId) return tasks;
    return tasks.filter(t => t.circular_id === filterId);
  });

  filteredTaskSets = computed(() => {
    const sets = this.taskSets();
    const filterId = this.selectedCircularFilter();
    if (!filterId) return sets;
    // Filter by circular_id directly (now stored on task_set)
    return sets.filter(s => s.circular_id === filterId);
  });

  selectedCircularLabel = computed(() => {
    const filterId = this.selectedCircularFilter();
    if (!filterId) return null;
    const found = this.circulars().find(c => c.id === filterId);
    return found ? (found.reference_no ? `${found.reference_no} — ${found.title}` : found.title) : null;
  });

  circularFilterOptions = computed(() => {
    return this.circulars().map(c => ({
      label: c.reference_no ? `${c.reference_no} - ${c.title}` : c.title,
      value: c.id
    }));
  });

  targetTasks: any[] = [];
  taskColumns: TableColumn[] = [
    { field: 'description', header: 'Description', type: 'text' },
    { field: 'risk_category', header: 'Risk', type: 'badge' },
    { field: 'priority', header: 'Priority', type: 'badge' }
  ];

  // Assigning
  branches = signal<any[]>([]);
  selectedBranches: any[] = [];
  proposedDate = signal<Date | null>(null);
  parentPage: number | null = null;
  parentLimit: number | null = null;

  constructor(private api: ComplianceApiService, private messageService: MessageService, private route: ActivatedRoute, private router: Router) { }

  goBackToCirculars() {
    const queryParams: any = {};
    const circularId = this.selectedCircularFilter();
    if (circularId) {
      queryParams.highlight_id = circularId;
    }
    if (this.parentPage) {
      queryParams.page = this.parentPage;
    }
    if (this.parentLimit) {
      queryParams.limit = this.parentLimit;
    }
    this.router.navigate(['/circulars'], { queryParams });
  }

  ngOnInit() {
    this.loadData();
    this.api.getApprovedTasks({ limit: 1000 }).subscribe(res => {
      this.rawTasks.set(res.data);
    });
    this.api.getBranches().subscribe(data => this.branches.set(data));
    this.loadCirculars();

    // Auto-apply circular filter if navigated from Circular Master
    const circularId = this.route.snapshot.queryParamMap.get('circular_id');
    if (circularId) {
      this.selectedCircularFilter.set(+circularId);
    }
    const parentPage = this.route.snapshot.queryParamMap.get('parent_page');
    if (parentPage) {
      this.parentPage = +parentPage;
    }
    const parentLimit = this.route.snapshot.queryParamMap.get('parent_limit');
    if (parentLimit) {
      this.parentLimit = +parentLimit;
    }
  }

  loadData() {
    this.api.getTaskSets().subscribe(data => {
      const mapped = data.map((row: any) => ({
        ...row,
        frequency: this.frequencyMap[row.frequency] ?? row.frequency
      }));
      this.taskSets.set(mapped);
    });
  }

  loadCirculars() {
    this.api.getCirculars({ limit: 1000 }).subscribe(res => {
      this.circulars.set(res.data);
    });
  }

  openCreateModal() { // Kept method name since html uses it, but it opens the form drawer
    this.isEditMode = false;
    this.selectedTaskSet = null;
    this.newTaskSetName.set('');
    const prefillCircularId = this.selectedCircularFilter();
    this.newTaskSetCircularId.set(prefillCircularId); // pre-fill from filter if active
    this.formCircularFilter.set(prefillCircularId); // pre-fill form task filter
    this.newTaskSetDueDate.set(null);
    this.newTaskSetStartDate.set(null);
    this.newTaskSetEndDate.set(null);
    this.newTaskSetFrequency.set('');
    this.newTaskSetReportingDate.set(null);
    this.targetTasks = [];
    this.selectedBranches = [];
    this.proposedDate.set(null);
    this.showBranchAssignment.set(true);

    // Reset tasks
    this.api.getApprovedTasks({ limit: 1000 }).subscribe(res => {
      this.rawTasks.set(res.data);
      this.showFormDrawer.set(true);
    });

  }

  openFormDrawer(row: any) {
    this.isEditMode = true;
    this.selectedTaskSet = row;
    this.newTaskSetName.set(row.name || '');
    this.newTaskSetCircularId.set(row.circular_id || null);
    this.formCircularFilter.set(row.circular_id || null);
    this.newTaskSetDueDate.set(row.default_due_date ? new Date(row.default_due_date) : null);
    this.newTaskSetStartDate.set(row.start_date ? new Date(row.start_date) : null);
    this.newTaskSetEndDate.set(row.end_date ? new Date(row.end_date) : null);
    this.newTaskSetFrequency.set(row.frequency || '');
    this.newTaskSetReportingDate.set(row.reporting_date ? new Date(row.reporting_date) : null);
    this.selectedBranches = [];
    this.showBranchAssignment.set(true);
    if (row.default_due_date) {
      this.proposedDate.set(new Date(row.default_due_date));
    } else {
      this.proposedDate.set(null);
    }


    this.api.getTaskSet(row.id).subscribe(details => {
      const mappedIds = new Set((details.tasks || []).map((t: any) => t.id));
      const mappedBranchIds = new Set((details.branches || []).map((b: any) => b.id));

      this.api.getApprovedTasks({ limit: 1000 }).subscribe(res => {
        this.rawTasks.set(res.data);
        this.targetTasks = res.data.filter((t: any) => mappedIds.has(t.id));
        this.selectedBranches = this.branches().filter((b: any) => mappedBranchIds.has(b.id));
        this.showFormDrawer.set(true);
      });
    });
  }

  private formatDate(date: Date | null): string | undefined {
    if (!date) return undefined;
    return date.toISOString().split('T')[0];
  }

  saveTaskSet() {
    if (!this.newTaskSetName()) return;

    const payload = {
      name: this.newTaskSetName(),
      circular_id: this.newTaskSetCircularId() || undefined,
      default_due_date: this.formatDate(this.newTaskSetDueDate()),
      start_date: this.formatDate(this.newTaskSetStartDate()),
      end_date: this.formatDate(this.newTaskSetEndDate()),
      frequency: this.newTaskSetFrequency() || undefined,
      reporting_date: this.formatDate(this.newTaskSetReportingDate())
    };

    const finalizeAssignments = (setId: number) => {
      // Map tasks
      const taskIds = this.targetTasks.map(t => t.id);
      const branchIds = this.selectedBranches.map(b => b.id);

      this.api.updateTaskSetMapping(setId, taskIds).subscribe(() => {
        this.api.updateTaskSetBranches(setId, branchIds).subscribe(() => {
          this.showFormDrawer.set(false);
          this.loadData();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Task set and mappings updated. Assignments will generate based on schedule.'
          });
        });
      });
    };

    if (this.isEditMode && this.selectedTaskSet) {
      this.api.updateTaskSet(this.selectedTaskSet.id, payload).subscribe(() => {
        finalizeAssignments(this.selectedTaskSet.id);
      });
    } else {
      this.api.createTaskSet(payload).subscribe((newSet) => {
        finalizeAssignments(newSet.id);
      });
    }
  }


  reopenTaskSet(row: any) {
    if (confirm(`Are you sure you want to reopen "${row.name}" for recompliance? All associated branch assignments will be set back to Pending.`)) {
      this.api.reopenTaskSet(row.id).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Reopened ${row.name} for recompliance` });
      });
    }
  }

  deleteTaskSet(row: any) {
    if (confirm('Are you sure you want to delete this Task Set?')) {
      this.api.deleteTaskSet(row.id).subscribe(() => {
        this.loadData();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Task set deleted' });
      });
    }
  }

  triggerAssignmentGeneration(row: any) {
    this.messageService.add({ severity: 'info', summary: 'Processing', detail: `Auto-generating assignments for "${row.name}"...` });
    this.api.generateAssignments(row.id).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Generated ${res.generated} new assignments, skipped ${res.skipped} existing.`
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to auto-generate assignments: ' + (err.message || err.statusText)
        });
      }
    });
  }
}

