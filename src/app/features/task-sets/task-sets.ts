import { Component, OnInit, signal, computed, effect } from '@angular/core';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FieldsetModule } from 'primeng/fieldset';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { TextFieldComponent } from '../../shared/components/form/text-field/text-field.component';
import { TextareaFieldComponent } from '../../shared/components/form/textarea-field/textarea-field.component';
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
    TextareaFieldComponent,
    SelectFieldComponent,
    ToastModule,
    ConfirmDialogModule,
    FieldsetModule,
    SelectModule,
    TagModule
  ],
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

    /* ── Drawer Layout (mirrors Circular Master) ── */
    .drawer-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .drawer-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .drawer-title-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.65rem;
      height: 2.65rem;
      border-radius: 8px;
      color: var(--primary-color);
      background: var(--primary-50, var(--surface-100));
      border: 1px solid var(--primary-100, var(--surface-border));
      flex: 0 0 auto;
    }
    .drawer-content-shell {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      padding: 1rem 1.35rem 1.25rem;
    }
    .drawer-section {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 1rem 1rem 0.35rem;
    }
    .section-heading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.1rem;
    }
    .section-kicker {
      color: var(--text-color);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .section-line {
      flex: 1;
      height: 1px;
      background: var(--surface-border);
    }
    .drawer-form-grid {
      row-gap: 0.65rem;
    }
    .drawer-form-grid .field {
      margin-bottom: 0.85rem;
    }
    .drawer-footer-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      width: 100%;
      padding: 1rem 1.35rem;
    }
    .drawer-footer-row button {
      min-width: 9.5rem;
    }
  `]
})
export class TaskSetsComponent implements OnInit {
  currentCircular = signal<any | null>(null);

  getFileUrl(url: string | null | undefined): string {
    return this.api.getFileUrl(url);
  }

  prioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warn';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  }

  taskSets = signal<any[]>([]);
  loadingRowIds = signal<Set<string>>(new Set());
  generatedTaskSetIds = new Set<number>();
  saving = signal<boolean>(false);

  tableColumns: TableColumn[] = [
    { field: 'type', header: 'Type', type: 'badge', width: '100px' },
    { field: 'circular_title', header: 'Circular / Authority', type: 'text', width: '22%' },
    { field: 'name', header: 'Task Set Name', type: 'text', width: '20%' },
    { field: 'branch_names', header: 'Dept/Branch', type: 'text', width: '18%' },
    { field: 'default_due_date', header: 'Due Date', type: 'date', width: '110px' },
    { field: 'start_date', header: 'Start Date', type: 'date', width: '110px' },
    { field: 'frequency', header: 'Frequency', type: 'text', width: '120px' },
    { field: 'created_at', header: 'Created', type: 'date', width: '110px' }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: (row) => this.openFormDrawer(row)
    },
    // {
    //   name: 'generate',
    //   label: 'Auto-Generate Assignments',
    //   icon: 'pi pi-cog',
    //   command: (row) => this.triggerAssignmentGeneration(row),
    //   styleClass: 'p-button-success'
    // },
    // {
    //   label: 'Reopen For Recompliance',
    //   icon: 'pi pi-refresh',
    //   command: (row) => this.reopenTaskSet(row),
    //   styleClass: 'p-button-warning'
    // },
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

  taskSetTypeOptions = [
    { label: 'Regular (Circular Based)', value: 'REGULAR' },
    { label: 'Internal (Daily / Operational Checklist)', value: 'INTERNAL' }
  ];

  // Form states as WritableSignals
  newTaskSetType = signal<string>('REGULAR');
  newTaskSetName = signal<string>('');
  newTaskSetCircularId = signal<number | null>(null);
  newTaskSetAuthorityId = signal<number | null>(null);
  newTaskSetDueDate = signal<Date | null>(null);
  newTaskSetStartDate = signal<Date | null>(null);
  newTaskSetEndDate = signal<Date | null>(null);
  newTaskSetFrequency = signal<string>('');
  newTaskSetReportingDate = signal<Date | null>(null);

  frequencies = [
    { label: 'DAILY - Every Day', value: '0' },
    { label: 'FORTNIGHT - Every 15 Days', value: '1' },
    { label: 'MONTHLY - Every Month', value: '2' },
    { label: 'QUARTERLY - Every Three Months', value: '3' },
    { label: 'SEMIANNUALLY - Every Six Months', value: '4' },
    { label: 'YEARLY - Every Year', value: '5' },
    { label: '1 Time Use', value: '6' }
  ];

  readonly frequencyMap: Record<string, string> = {
    '0': 'Daily',
    '1': 'Fortnight (Every 15 Days)',
    '2': 'Monthly',
    '3': 'Quarterly',
    '4': 'Semi-Annually',
    '5': 'Yearly',
    '6': '1 Time Use'
  };

  // Form & details loading states
  loadingFormDetails = signal<boolean>(false);

  // Inline Task Creation Signals
  showInlineTaskDrawer = signal<boolean>(false);
  showInlineTaskDialog = this.showInlineTaskDrawer; // alias for template compatibility
  inlineTaskDescription = signal<string>('');
  inlineTaskPriority = signal<string>('');
  inlineTaskAuthorityId = signal<number | null>(null);
  savingInlineTask = signal<boolean>(false);

  priorityOptions = [
    { label: 'Critical', value: 'Critical' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' }
  ];

  // Inline task form validation signal
  isInlineTaskValid = computed(() => {
    const desc = this.inlineTaskDescription()?.trim();
    const priority = this.inlineTaskPriority();
    const authorityId = this.inlineTaskAuthorityId();

    return !!(desc && priority && authorityId);
  });

  // Form validation signal
  isFormValid = computed(() => {
    const type = this.newTaskSetType();
    const name = this.newTaskSetName()?.trim();
    const circularId = this.newTaskSetCircularId();
    const frequency = this.newTaskSetFrequency();
    const startDate = this.newTaskSetStartDate();
    const endDate = this.newTaskSetEndDate();
    const reportingDate = this.newTaskSetReportingDate();
    const dueDate = this.newTaskSetDueDate();

    if (!type || !name || !frequency || !startDate) {
      return false;
    }

    if (type === 'REGULAR') {
      if (!circularId || !endDate || !reportingDate || !dueDate) {
        return false;
      }
      if (startDate > endDate) {
        return false;
      }
    }

    return true;
  });

  // Mapping
  rawTasks = signal<any[]>([]);
  authorities = signal<any[]>([]);
  selectedCircularFilter = signal<number | null>(null);
  formCircularFilter = signal<number | null>(null);
  circulars = signal<any[]>([]);

  openInlineTaskDialog() {
    this.ensureAuthoritiesLoaded();
    this.inlineTaskDescription.set('');
    this.inlineTaskPriority.set('');
    this.inlineTaskAuthorityId.set(this.newTaskSetAuthorityId() || null);
    this.showInlineTaskDrawer.set(true);
  }

  saveInlineTask() {
    const desc = this.inlineTaskDescription()?.trim();
    const priority = this.inlineTaskPriority();
    const authorityId = this.inlineTaskAuthorityId();

    if (!desc || !priority || !authorityId) {
      const missing: string[] = [];
      if (!desc) missing.push('Task Description');
      if (!priority) missing.push('Priority');
      if (!authorityId) missing.push('Authority');

      this.messageService.add({
        severity: 'error',
        summary: 'Required Fields Missing',
        detail: `Please fill in all required fields for Add Task: ${missing.join(', ')}.`,
        life: 4000
      });
      return;
    }

    this.savingInlineTask.set(true);
    const circularId = this.newTaskSetType() === 'REGULAR' ? (this.newTaskSetCircularId() || undefined) : undefined;

    const payload: any = {
      description: desc,
      circular_id: circularId,
      priority: priority,
      authority_id: authorityId
    };

    this.api.createManualTask(payload).subscribe({
      next: (createdTask: any) => {
        this.savingInlineTask.set(false);
        this.showInlineTaskDrawer.set(false);

        const defaultDueObj = this.newTaskSetDueDate();
        createdTask.due_date = defaultDueObj || null;

        const currentRaw = this.rawTasks();
        this.rawTasks.set([createdTask, ...currentRaw]);
        this.targetTasks = [createdTask, ...this.targetTasks];

        this.messageService.add({
          severity: 'success',
          summary: 'Task Created',
          detail: 'New task created and automatically added to this task set.',
          life: 3000
        });
      },
      error: () => {
        this.savingInlineTask.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create task' });
      }
    });
  }

  allTasks = computed(() => {
    const tasks = this.rawTasks();
    const type = this.newTaskSetType();
    const circularId = this.formCircularFilter() || this.newTaskSetCircularId();
    const authorities = this.authorities();
    const authMap = new Map<number, string>(authorities.map(a => [a.id, a.name]));

    if (type === 'REGULAR') {
      if (!circularId) return [];
      return tasks.filter(t => t.circular_id === circularId);
    }

    if (type === 'INTERNAL') {
      const internalTasks = tasks.filter(t => !t.circular_id);
      return internalTasks.map(t => ({
        ...t,
        authority_name: t.authority_name || (t.authority_id ? (authMap.get(t.authority_id) || `Authority #${t.authority_id}`) : 'Bank Internal')
      }));
    }

    return tasks;
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

  circularFilterOptions = signal<{ label: string; value: any }[]>([]);

  targetTasks: any[] = [];
  taskColumns = computed<TableColumn[]>(() => {
    if (this.newTaskSetType() === 'INTERNAL') {
      return [
        { field: 'description', header: 'Description', type: 'text' },
        { field: 'priority', header: 'Priority', type: 'badge', width: '120px' },
        { field: 'authority_name', header: 'Authority', type: 'text', width: '180px' }
      ];
    }
    return [
      { field: 'description', header: 'Description', type: 'text' },
      { field: 'priority', header: 'Priority', type: 'badge', width: '120px' },
      { field: 'due_date', header: 'Proposed Due Date', type: 'date_input', width: '160px' }
    ];
  });

  // Assigning
  branches = signal<any[]>([]);
  selectedBranches: any[] = [];
  proposedDate = signal<Date | null>(null);
  parentPage: number | null = null;
  parentLimit: number | null = null;
  cameFromCirculars = signal<boolean>(false);
  cameFromTasks = signal<boolean>(false);

  constructor(private api: ComplianceApiService, private messageService: MessageService, private confirmationService: ConfirmationService, private route: ActivatedRoute, private router: Router) {
    effect(() => {
      const reportingDate = this.newTaskSetReportingDate();
      this.validateTaskDueDates(reportingDate);
    });
  }

  private parseToDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === 'string') {
      const parts = val.split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  onDueDateChange(dateVal: any) {
    const dateObj = this.parseToDate(dateVal) || this.newTaskSetDueDate();
    if (dateObj) {
      const currentTasks = this.rawTasks();
      if (currentTasks && currentTasks.length) {
        currentTasks.forEach(t => {
          if (!t.due_date) {
            t.due_date = dateObj;
          }
        });
        this.rawTasks.set([...currentTasks]);
      }
      this.targetTasks.forEach(t => {
        if (!t.due_date) {
          t.due_date = dateObj;
        }
      });
    }
  }

  validateTaskDueDates(reportingDate: Date | null): boolean {
    if (!reportingDate) return true;
    const repTime = new Date(reportingDate.getFullYear(), reportingDate.getMonth(), reportingDate.getDate()).getTime();
    let hasViolation = false;
    for (const t of this.targetTasks) {
      if (t.due_date) {
        const dObj = this.parseToDate(t.due_date);
        if (dObj) {
          const dueTime = new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate()).getTime();
          if (dueTime > repTime) {
            hasViolation = true;
            t.due_date = null;
            this.messageService.add({
              severity: 'error',
              summary: 'Validation Error',
              detail: `Task "${t.description.substring(0, 30)}..." Proposed Due Date cannot be greater than Reporting Date (${this.formatDate(reportingDate)}). It has been cleared.`
            });
          }
        }
      }
    }
    return !hasViolation;
  }

  onTaskTableAction(event: any) {
    if (event.name === 'due_date_change') {
      const row = event.row;
      const reportingDate = this.newTaskSetReportingDate();
      if (reportingDate && row.due_date) {
        const dObj = this.parseToDate(row.due_date);
        if (dObj) {
          const repTime = new Date(reportingDate.getFullYear(), reportingDate.getMonth(), reportingDate.getDate()).getTime();
          const dueTime = new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate()).getTime();
          if (dueTime > repTime) {
            row.due_date = null;
            this.messageService.add({
              severity: 'error',
              summary: 'Validation Error',
              detail: `Task Proposed Due Date cannot be greater than Reporting Date (${this.formatDate(reportingDate)}). It has been cleared.`
            });
          }
        }
      }
    }
  }

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

  goBackToTasks() {
    const queryParams: any = {};
    const circularId = this.selectedCircularFilter();
    if (circularId) {
      queryParams.circular_id = circularId;
    }
    if (this.parentPage) {
      queryParams.parent_page = this.parentPage;
    }
    if (this.parentLimit) {
      queryParams.parent_limit = this.parentLimit;
    }
    this.router.navigate(['/tasks'], { queryParams });
  }

  ngOnInit() {
    this.loadData();
    this.api.getApprovedTasks({ limit: 1000 }).subscribe(res => {
      this.rawTasks.set(res.data);
    });
    this.api.getBranches().subscribe(data => this.branches.set(data));
    this.loadAuthorities();

    // Auto-apply circular filter if navigated from Circular Master / Tasks
    this.route.queryParamMap.subscribe(params => {
      const circularId = params.get('circular_id');
      const cameFromTasks = params.get('came_from_tasks');
      const parentPage = params.get('parent_page');
      const parentLimit = params.get('parent_limit');

      this.parentPage = parentPage ? +parentPage : null;
      this.parentLimit = parentLimit ? +parentLimit : null;

      if (circularId) {
        this.selectedCircularFilter.set(+circularId);
        this.cameFromCirculars.set(true);
        this.cameFromTasks.set(cameFromTasks === 'true' || cameFromTasks === '1');
        this.loadCirculars();
        this.api.getCircularById(+circularId).subscribe({
          next: (data) => this.currentCircular.set(data),
          error: (err) => console.error('Failed to load circular details in task sets:', err)
        });
      } else {
        this.selectedCircularFilter.set(null);
        this.cameFromCirculars.set(false);
        this.cameFromTasks.set(false);
        this.currentCircular.set(null);
      }
    });
  }

  loadData(isRefresh = false) {
    this.api.getTaskSets().subscribe({
      next: (data) => {
        const mapped = data.map((row: any) => ({
          ...row,
          type: row.type || 'REGULAR',
          circular_title: (row.type || 'REGULAR') === 'INTERNAL'
            ? (row.authority_name ? `Authority: ${row.authority_name}` : 'Internal / Operational')
            : (row.circular_title || '-'),
          branch_names: row.branch_names || '—',
          frequency: this.frequencyMap[row.frequency] ?? row.frequency
        }));
        this.taskSets.set(mapped);
        if (isRefresh) {
          this.messageService.add({ severity: 'info', summary: 'Refreshed', detail: 'Task sets list refreshed', life: 2500 });
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load task sets' });
      }
    });
  }

  ensureCircularsLoaded() {
    if (!this.circulars() || this.circulars().length === 0) {
      this.loadCirculars();
    }
  }

  loadCirculars() {
    this.api.getCirculars({ limit: 1000 }).subscribe(res => {
      this.circulars.set(res.data);
      this.circularFilterOptions.set(
        res.data.map((c: any) => ({
          label: c.reference_no ? `${c.reference_no} - ${c.title}` : c.title,
          value: c.id
        }))
      );
    });
  }

  ensureAuthoritiesLoaded() {
    if (!this.authorities() || this.authorities().length === 0) {
      this.loadAuthorities();
    }
  }

  loadAuthorities() {
    this.api.getAuthorities().subscribe({
      next: (data) => {
        this.authorities.set(data || []);
      },
      error: (err) => {
        console.error('Failed to load authorities in task sets:', err);
      }
    });
  }

  onTypeChange(type: any) {
    this.targetTasks = [];
    if (type === 'INTERNAL') {
      this.ensureAuthoritiesLoaded();
      this.newTaskSetCircularId.set(null);
      this.formCircularFilter.set(null);
    } else if (type === 'REGULAR') {
      this.ensureCircularsLoaded();
      this.newTaskSetAuthorityId.set(null);
    }
  }

  openCreateModal() { // Kept method name since html uses it, but it opens the form drawer
    this.isEditMode = false;
    this.selectedTaskSet = null;
    this.newTaskSetType.set('REGULAR');
    this.newTaskSetName.set('');
    this.newTaskSetAuthorityId.set(null);
    this.newTaskSetCircularId.set(null);
    this.formCircularFilter.set(null);
    this.newTaskSetDueDate.set(null);
    this.newTaskSetStartDate.set(null);
    this.newTaskSetEndDate.set(null);
    this.newTaskSetFrequency.set('');
    this.newTaskSetReportingDate.set(null);
    this.targetTasks = [];
    this.selectedBranches = [];
    this.proposedDate.set(null);
    this.showBranchAssignment.set(true);

    // Clean any previous task due dates
    const cleanTasks = (this.rawTasks() || []).map((t: any) => ({
      ...t,
      due_date: null
    }));
    this.rawTasks.set(cleanTasks);

    // Open drawer immediately for instant response
    this.showFormDrawer.set(true);

    if (!this.rawTasks() || this.rawTasks().length === 0) {
      this.api.getApprovedTasks({ limit: 1000 }).subscribe(res => {
        this.rawTasks.set(res.data);
      });
    }
  }

  getFrequencyKeyByLabel(label: string): string {
    const entry = Object.entries(this.frequencyMap).find(([_, val]) => val === label);
    return entry ? entry[0] : label;
  }

  openFormDrawer(row: any) {
    this.isEditMode = true;
    this.selectedTaskSet = row;
    this.newTaskSetType.set(row.type || 'REGULAR');
    if ((row.type || 'REGULAR') === 'INTERNAL') {
      this.ensureAuthoritiesLoaded();
    }
    this.newTaskSetName.set(row.name || '');
    this.newTaskSetCircularId.set(row.circular_id || null);
    this.newTaskSetAuthorityId.set(row.authority_id || null);
    this.formCircularFilter.set(row.circular_id || null);
    this.newTaskSetDueDate.set(row.default_due_date ? new Date(row.default_due_date) : null);
    this.newTaskSetStartDate.set(row.start_date ? new Date(row.start_date) : null);
    this.newTaskSetEndDate.set(row.end_date ? new Date(row.end_date) : null);
    this.newTaskSetFrequency.set(this.getFrequencyKeyByLabel(row.frequency || ''));
    this.newTaskSetReportingDate.set(row.reporting_date ? new Date(row.reporting_date) : null);
    this.selectedBranches = [];
    this.targetTasks = [];
    this.showBranchAssignment.set(true);
    if (row.default_due_date) {
      this.proposedDate.set(new Date(row.default_due_date));
    } else {
      this.proposedDate.set(null);
    }

    // Open drawer immediately for instant response
    this.loadingFormDetails.set(true);
    this.showFormDrawer.set(true);

    this.api.getTaskSet(row.id).subscribe({
      next: (details) => {
        const dateMap = new Map<number, string | null>();
        (details.tasks || []).forEach((t: any) => {
          const d = t.due_date ? t.due_date.split('T')[0] : null;
          dateMap.set(t.id, d);
        });

        const mappedIds = new Set((details.tasks || []).map((t: any) => t.id));
        const mappedBranchIds = new Set((details.branches || []).map((b: any) => b.id));

        const defaultDueObj = this.newTaskSetDueDate();
        const applyMappedTasks = (tasksToMap: any[]) => {
          const mappedRawTasks = tasksToMap.map((t: any) => {
            const rawVal = dateMap.get(t.id);
            return {
              ...t,
              due_date: this.parseToDate(rawVal) || defaultDueObj || null
            };
          });
          this.rawTasks.set(mappedRawTasks);
          this.targetTasks = mappedRawTasks.filter((t: any) => mappedIds.has(t.id));
          this.selectedBranches = this.branches().filter((b: any) => mappedBranchIds.has(b.id));
          this.loadingFormDetails.set(false);
        };

        const currentTasks = this.rawTasks();
        if (currentTasks && currentTasks.length > 0) {
          applyMappedTasks(currentTasks);
        } else {
          this.api.getApprovedTasks({ limit: 1000 }).subscribe({
            next: (res) => {
              applyMappedTasks(res.data);
            },
            error: () => this.loadingFormDetails.set(false)
          });
        }
      },
      error: () => {
        this.loadingFormDetails.set(false);
      }
    });
  }

  private formatDate(date: any): string | undefined {
    if (!date) return undefined;
    if (typeof date === 'string') {
      if (date.includes('T')) return date.split('T')[0];
      return date;
    }
    if (date instanceof Date && !isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return undefined;
  }

  saveTaskSet() {
    if (this.saving()) return;

    const missingFields: string[] = [];
    const isRegular = this.newTaskSetType() === 'REGULAR';

    if (!this.newTaskSetType()) {
      missingFields.push('Task Set Type');
    }
    if (isRegular && !this.newTaskSetCircularId()) {
      missingFields.push('Circular');
    }
    if (!this.newTaskSetName() || !this.newTaskSetName().trim()) {
      missingFields.push('Task Set Name');
    }
    if (!this.newTaskSetFrequency()) {
      missingFields.push('Task Set Frequency');
    }
    if (!this.newTaskSetStartDate()) {
      missingFields.push('Start Date');
    }
    if (isRegular && !this.newTaskSetEndDate()) {
      missingFields.push('End Date');
    }
    if (isRegular && !this.newTaskSetReportingDate()) {
      missingFields.push('Reporting Date');
    }
    if (isRegular && !this.newTaskSetDueDate()) {
      missingFields.push('Due Date [For Branch]');
    }

    if (missingFields.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Required Fields Missing',
        detail: `Please fill in all required fields: ${missingFields.join(', ')}.`,
        life: 5000
      });
      return;
    }

    const startDate = this.newTaskSetStartDate();
    const endDate = this.newTaskSetEndDate();
    if (isRegular && startDate && endDate && startDate > endDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Date Range',
        detail: 'Start Date cannot be greater than End Date.',
        life: 4000
      });
      return;
    }

    const reportingDate = this.newTaskSetReportingDate();
    if (isRegular && reportingDate && !this.validateTaskDueDates(reportingDate)) {
      return;
    }

    this.saving.set(true);
    const payload = {
      name: this.newTaskSetName().trim(),
      type: this.newTaskSetType(),
      circular_id: isRegular ? (this.newTaskSetCircularId() || undefined) : undefined,
      authority_id: undefined,
      default_due_date: isRegular ? this.formatDate(this.newTaskSetDueDate()) : undefined,
      start_date: this.formatDate(this.newTaskSetStartDate()),
      end_date: isRegular ? this.formatDate(this.newTaskSetEndDate()) : undefined,
      frequency: this.newTaskSetFrequency() || undefined,
      reporting_date: isRegular ? this.formatDate(this.newTaskSetReportingDate()) : undefined
    };

    const finalizeAssignments = (setId: number) => {
      // Map tasks
      const taskIds = this.targetTasks.map(t => t.id);
      const branchIds = this.selectedBranches.map(b => b.id);
      const taskTimelines = this.targetTasks.map(t => ({
        task_id: t.id,
        due_date: (t.due_date ? this.formatDate(t.due_date) : null) ?? null
      }));

      this.api.updateTaskSetMapping(setId, taskIds, taskTimelines).subscribe({
        next: () => {
          this.api.updateTaskSetBranches(setId, branchIds).subscribe({
            next: () => {
              if (branchIds && branchIds.length > 0) {
                this.api.generateAssignments(setId).subscribe({
                  next: () => {
                    this.saving.set(false);
                    this.showFormDrawer.set(false);
                    this.loadData();
                    this.messageService.add({
                      severity: 'success',
                      summary: 'Successful',
                      detail: this.isEditMode ? 'Task set updated and assignments generated.' : 'Task set created and assignments generated for selected units.',
                      life: 3000
                    });
                  },
                  error: () => {
                    this.saving.set(false);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate assignments' });
                  }
                });
              } else {
                this.saving.set(false);
                this.showFormDrawer.set(false);
                this.loadData();
                this.messageService.add({
                  severity: 'success',
                  summary: 'Successful',
                  detail: this.isEditMode ? 'Task set updated successfully.' : 'Task set created successfully.',
                  life: 3000
                });
              }
            },
            error: () => {
              this.saving.set(false);
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update branch mappings' });
            }
          });
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update task set mappings' });
        }
      });
    };

    if (this.isEditMode && this.selectedTaskSet) {
      this.api.updateTaskSet(this.selectedTaskSet.id, payload).subscribe({
        next: () => {
          finalizeAssignments(this.selectedTaskSet.id);
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update task set' });
        }
      });
    } else {
      this.api.createTaskSet(payload).subscribe({
        next: (newSet) => {
          finalizeAssignments(newSet.id);
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create task set' });
        }
      });
    }
  }


  reopenTaskSet(row: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to reopen "${row.name}" for recompliance? All associated branch assignments will be set back to Pending.`,
      header: 'Confirm Reopen',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'warning', label: 'Reopen' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancel' },
      accept: () => {
        this.api.reopenTaskSet(row.id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `Reopened ${row.name} for recompliance` });
        });
      }
    });
  }

  deleteTaskSet(row: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${row.name}" Task Set?`,
      header: 'Confirm Delete',
      icon: 'pi pi-trash',
      acceptButtonProps: { severity: 'danger', label: 'Delete' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancel' },
      accept: () => {
        this.api.deleteTaskSet(row.id).subscribe(() => {
          this.loadData();
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Task set deleted' });
        });
      }
    });
  }

  triggerAssignmentGeneration(row: any) {
    if (this.generatedTaskSetIds.has(row.id)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Already Generated',
        detail: `Assignments for "${row.name}" have already been generated.`,
        life: 4000
      });
      return;
    }

    const loadingKey = `${row.id}:generate`;
    this.loadingRowIds.update(set => {
      const newSet = new Set(set);
      newSet.add(loadingKey);
      return newSet;
    });

    this.api.generateAssignments(row.id).subscribe({
      next: (res) => {
        this.loadingRowIds.update(set => {
          const newSet = new Set(set);
          newSet.delete(loadingKey);
          return newSet;
        });

        this.messageService.clear();
        if (res.generated === 0) {
          if (res.skipped === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'No Branches Assigned',
              detail: `You haven't assigned any departments/branches to "${row.name}". Please edit the task set and assign them before generating assignments.`,
              life: 6000
            });
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Already Created',
              detail: `Assignments for "${row.name}" have already been created for this period. No new assignments generated.`,
              life: 5000
            });
          }
        } else {
          this.generatedTaskSetIds.add(row.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Generated ${res.generated} new assignments, skipped ${res.skipped} existing.`
          });
        }
      },
      error: (err) => {
        this.loadingRowIds.update(set => {
          const newSet = new Set(set);
          newSet.delete(loadingKey);
          return newSet;
        });
        this.messageService.clear();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to auto-generate assignments: ' + (err.error?.message || err.message || err.statusText)
        });
      }
    });
  }
}

