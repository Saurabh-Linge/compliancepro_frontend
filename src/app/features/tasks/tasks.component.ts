import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ComplianceApiService, ComplianceTask } from '../../core/services/api/compliance-api.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { PageComponent } from '../../shared/components/page/page.component';
import { TableComponent, TableColumn, TableAction } from '../../shared/components/table/table.component';
import { TextareaFieldComponent } from '../../shared/components/form/textarea-field/textarea-field.component';
import { SelectFieldComponent } from '../../shared/components/form/select-field/select-field.component';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DrawerModule, ButtonModule, TabsModule, PageComponent, TableComponent, TextareaFieldComponent, SelectFieldComponent, SelectModule],
  template: `
    <app-page title="Task Master" icon="pi pi-list">
      <div class="card h-full flex flex-column gap-3 p-3">
        <!-- Summary Stats -->
        <div class="flex gap-3">
          <div 
            class="surface-card shadow-1 p-3 border-round border-left-3 cursor-pointer flex-1 flex justify-content-between align-items-center transition-colors transition-duration-200"
            [ngClass]="{'border-primary bg-primary-50': activeFilter() === 'All', 'border-400 hover:surface-hover': activeFilter() !== 'All'}"
            (click)="setActiveFilter('All')">
            <div>
              <span class="block text-500 font-medium mb-1">Total Tasks</span>
              <div class="text-900 font-bold text-2xl">{{ totalCount() }}</div>
            </div>
            <div class="flex align-items-center justify-content-center bg-primary-100 border-round" style="width: 2.5rem; height: 2.5rem">
              <i class="pi pi-list text-primary text-xl"></i>
            </div>
          </div>
          
          <div 
            class="surface-card shadow-1 p-3 border-round border-left-3 cursor-pointer flex-1 flex justify-content-between align-items-center transition-colors transition-duration-200"
            [ngClass]="{'border-orange-500 bg-orange-50': activeFilter() === 'Pending', 'border-400 hover:surface-hover': activeFilter() !== 'Pending'}"
            (click)="setActiveFilter('Pending')">
            <div>
              <span class="block text-500 font-medium mb-1">Pending Approval</span>
              <div class="text-900 font-bold text-2xl">{{ pendingCount() }}</div>
            </div>
            <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
              <i class="pi pi-clock text-orange-500 text-xl"></i>
            </div>
          </div>

          <div 
            class="surface-card shadow-1 p-3 border-round border-left-3 cursor-pointer flex-1 flex justify-content-between align-items-center transition-colors transition-duration-200"
            [ngClass]="{'border-green-500 bg-green-50': activeFilter() === 'Approved', 'border-400 hover:surface-hover': activeFilter() !== 'Approved'}"
            (click)="setActiveFilter('Approved')">
            <div>
              <span class="block text-500 font-medium mb-1">Approved Tasks</span>
              <div class="text-900 font-bold text-2xl">{{ approvedCount() }}</div>
            </div>
            <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width: 2.5rem; height: 2.5rem">
              <i class="pi pi-check text-green-500 text-xl"></i>
            </div>
          </div>
        </div>

        <!-- Unified Table -->
        <div class="flex-1 overflow-hidden flex flex-column">
          <app-table
            class="h-full flex flex-column overflow-hidden"
            [data]="allTasks()"
            [loading]="loading()"
            [columns]="tableColumns"
            [actions]="tableActions"
            [showAddButton]="isCcoOrAdmin"
            (onAdd)="openCreateManualTaskModal()"
            [showRefreshButton]="true"
            [paginator]="true"
            [rows]="limit"
            [lazy]="true"
            [totalRecords]="totalRecords()"
            (onLazyLoad)="handleLazyLoad($event)"
            (onSearch)="handleSearch($event)"
            (onRefresh)="loadTasks()"
          >
            <ng-container toolbar-actions>
              <p-select 
                [options]="circulars()" 
                optionLabel="title" 
                optionValue="id" 
                [(ngModel)]="selectedCircularFilter" 
                (ngModelChange)="onFilterChange()"
                placeholder="Filter by Circular" 
                [showClear]="true"
                styleClass="w-20rem"
              ></p-select>
            </ng-container>
          </app-table>
        </div>
      </div>

      <!-- Edit Task Drawer -->
      <p-drawer
        [visible]="showEditModal()"
        (visibleChange)="showEditModal.set($event)"
        position="right"
        [style]="{ width: '760px', maxWidth: '96vw' }"
        [modal]="true"
        [dismissible]="true"
        [showCloseIcon]="false"
        styleClass="task-drawer"
      >
        <ng-template pTemplate="header">
          <div class="drawer-header-row">
            <div class="drawer-title-wrap">
              <span class="drawer-title-icon">
                <i class="pi pi-pencil"></i>
              </span>
              <div>
                <div class="text-900 font-semibold text-xl">Edit Task Description</div>
                <div class="text-600 text-sm mt-1">Modify task fields</div>
              </div>
            </div>
            <button pButton pRipple type="button" icon="pi pi-times" class="p-button-text p-button-rounded" (click)="showEditModal.set(false)"></button>
          </div>
        </ng-template>

        <ng-template pTemplate="content">
          @if (showEditModal()) {
            <div class="drawer-content-shell">
            <section class="drawer-section">
              <div class="section-heading">
                <span class="section-kicker">Task Details</span>
                <span class="section-line"></span>
              </div>

              <div class="grid formgrid p-fluid drawer-form-grid">
                <div class="field col-12">
                  <app-select-field
                    label="Task Header"
                    [virtualScroll]="false"
                    [field]="editTaskHeaderId"
                    [options]="taskHeaders()"
                    optionLabel="name"
                    optionValue="id"
                    [showAddButton]="true"
                    addTooltip="Add New Header"
                    (add)="activeHeaderTarget = 'EDIT'; showAddHeaderModal = true;"
                    placeholder="Select a Header (Optional)">
                  </app-select-field>
                </div>
                
                <div class="field col-12 md:col-6">
                  <app-select-field
                    label="Priority"
                    [virtualScroll]="false"
                    [field]="editTaskPriority"
                    [options]="priorityOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Priority">
                  </app-select-field>
                </div>

                <div class="field col-12 md:col-6">
                  <app-select-field
                    label="Risk Category"
                    [virtualScroll]="false"
                    [field]="editTaskRiskCategory"
                    [options]="riskCategoryOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Risk Category">
                  </app-select-field>
                </div>

                <div class="field col-12 md:col-6">
                  <app-select-field
                    label="Business Risk"
                    [virtualScroll]="false"
                    [field]="editTaskBusinessRisk"
                    [options]="businessRiskOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Business Risk">
                  </app-select-field>
                </div>

                <div class="field col-12 md:col-6">
                  <app-select-field
                    label="Control Risk"
                    [virtualScroll]="false"
                    [field]="editTaskControlRisk"
                    [options]="controlRiskOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Control Risk">
                  </app-select-field>
                </div>

                <div class="field col-12">
                  <app-select-field
                    label="Audit Area Mapping"
                    [field]="editTaskAuditAreaId"
                    [options]="auditAreas()"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Please select broader area of audit non-compliance">
                  </app-select-field>
                </div>

                <div class="field col-12">
                  <app-textarea-field
                    label="Description"
                    [field]="editTaskDescription"
                    [rows]="5"
                    [autoResize]="true"
                    [required]="true">
                  </app-textarea-field>
                </div>
              </div>
            </section>
          </div>
          }
        </ng-template>

        <ng-template pTemplate="footer">
          <div class="drawer-footer-row">
            <button pButton pRipple type="button" label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary" (click)="showEditModal.set(false)"></button>
            <button pButton pRipple type="button" label="Save Changes" icon="pi pi-check" [disabled]="!editTaskDescription().trim()" (click)="saveEditedTask()"></button>
          </div>
        </ng-template>
      </p-drawer>

      <!-- Create Manual Task Drawer -->
      <p-drawer
        [visible]="showManualTaskModal()"
        (visibleChange)="showManualTaskModal.set($event)"
        position="right"
        [style]="{ width: '760px', maxWidth: '96vw' }"
        [modal]="true"
        [dismissible]="true"
        [showCloseIcon]="false"
        styleClass="task-drawer"
      >
        <ng-template pTemplate="header">
          <div class="drawer-header-row">
            <div class="drawer-title-wrap">
              <span class="drawer-title-icon">
                <i class="pi pi-plus-circle"></i>
              </span>
              <div>
                <div class="text-900 font-semibold text-xl">Create Manual Task</div>
                <div class="text-600 text-sm mt-1">Create a new ad-hoc compliance task</div>
              </div>
            </div>
            <button pButton pRipple type="button" icon="pi pi-times" class="p-button-text p-button-rounded" (click)="showManualTaskModal.set(false)"></button>
          </div>
        </ng-template>

        <ng-template pTemplate="content">
          @if (showManualTaskModal()) {
            <div class="drawer-content-shell">
            <section class="drawer-section">
              <div class="section-heading">
                <span class="section-kicker">Task Details</span>
                <span class="section-line"></span>
              </div>

              <div class="grid formgrid p-fluid drawer-form-grid">
                @if (!selectedCircularId) {
                  <div class="field col-12">
                    <app-select-field
                      label="Select Circular"
                      [field]="manualTaskCircularId"
                      [options]="circulars()"
                      optionLabel="title"
                      optionValue="id"
                      [required]="true"
                      [virtualScroll]="true"
                      placeholder="Select a Circular">
                    </app-select-field>
                  </div>
                }

                <div class="field col-12">
                  <app-select-field
                    label="Task Header"
                    [virtualScroll]="false"
                    [field]="manualTaskHeaderId"
                    [options]="taskHeaders()"
                    optionLabel="name"
                    optionValue="id"
                    [showAddButton]="true"
                    addTooltip="Add New Header"
                    (add)="activeHeaderTarget = 'MANUAL'; showAddHeaderModal = true;"
                    placeholder="Select a Header (Optional)">
                  </app-select-field>
                </div>

                <div class="field col-12 md:col-6">
                  <app-select-field
                    label="Priority"
                    [field]="manualTaskPriority"
                    [options]="priorityOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Priority"
                    [virtualScroll]="false">
                  </app-select-field>
                </div>

                <div class="field col-12 md:col-6">
                  <app-select-field
                    label="Risk Category"
                    [field]="manualTaskRiskCategory"
                    [options]="riskCategoryOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Risk Category"
                    [virtualScroll]="false">
                  </app-select-field>
                </div>

                <div class="field col-12 md:col-6">
                  <app-select-field
                    label="Business Risk"
                    [field]="manualTaskBusinessRisk"
                    [options]="businessRiskOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Business Risk"
                    [virtualScroll]="false">
                  </app-select-field>
                </div>

                <div class="field col-12 md:col-6">
                  <app-select-field
                    label="Control Risk"
                    [field]="manualTaskControlRisk"
                    [options]="controlRiskOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Control Risk"
                    [virtualScroll]="false">
                  </app-select-field>
                </div>

                <div class="field col-12">
                  <app-select-field
                    label="Broader Area of Audit Non-Compliance"
                    [field]="manualTaskAuditAreaId"
                    [options]="auditAreas()"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Please select broader area of audit non-compliance">
                  </app-select-field>
                </div>

                <div class="field col-12">
                  <app-textarea-field
                    label="Description"
                    [field]="manualTaskDescription"
                    [rows]="5"
                    [autoResize]="true"
                    [required]="true"
                    placeholder="Enter task description">
                  </app-textarea-field>
                </div>
              </div>
            </section>
          </div>
          }
        </ng-template>

        <ng-template pTemplate="footer">
          <div class="drawer-footer-row">
            <button pButton pRipple type="button" label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary" (click)="showManualTaskModal.set(false)"></button>
            <button pButton pRipple type="button" label="Create Task" icon="pi pi-check" [disabled]="!manualTaskDescription().trim() || (!manualTaskCircularId() && !selectedCircularId)" (click)="createManualTask()"></button>
          </div>
        </ng-template>
      </p-drawer>

      <!-- Quick Add Header Modal -->
      <p-dialog header="Add New Task Header" [(visible)]="showAddHeaderModal" [modal]="true" [style]="{ width: '30rem' }">
        <div class="flex flex-column gap-3 mt-4">
          <div class="flex flex-column gap-2">
            <label class="font-medium">Header Name</label>
            <input type="text" [(ngModel)]="newHeaderName" class="modern-input w-full" placeholder="e.g. KYC Compliance">
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn-secondary px-4 py-2" (click)="showAddHeaderModal = false">Cancel</button>
          <button class="btn-dynamic px-4 py-2" [disabled]="!newHeaderName.trim()" (click)="quickAddHeader()">Save Header</button>
        </ng-template>
    </p-dialog>
  </app-page>
  `,
  styles: [`
    :host ::ng-deep .task-drawer .p-drawer-content {
      display: flex;
      flex-direction: column;
      padding: 0;
    }
    
    /* Ensure active tab panel fills space */
    :host ::ng-deep .p-tabpanel {
      height: 100%;
    }

    .drawer-content-shell {
      background: var(--surface-ground);
    }

    :host ::ng-deep .task-drawer .p-drawer-header {
      padding: 1.15rem 1.35rem;
      border-bottom: 1px solid var(--surface-200);
      background: var(--surface-card);
    }

    :host ::ng-deep .task-drawer .p-drawer-footer {
      padding: 0;
      border-top: 1px solid var(--surface-200);
      background: var(--surface-card);
      box-shadow: 0 -8px 22px rgba(15, 23, 42, 0.06);
    }

    .drawer-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      width: 100%;
    }

    .drawer-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 0;
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
  `]
})
export class TasksComponent implements OnInit {
  selectedCircularId: number | null = null;

  loading = signal<boolean>(false);
  activeFilter = signal<'All' | 'Pending' | 'Approved'>('All');

  allTasks = signal<ComplianceTask[]>([]);
  totalRecords = signal<number>(0);

  // Pagination state
  page = 1;
  limit = 10;
  searchQuery = '';
  selectedCircularFilter: number | null = null;

  // Filtering Logic
  // Since pagination is server-side, counts are updated from server response if available,
  // or we can fetch a separate stats endpoint. For now, we will leave counts as 0 unless returned.
  totalCount = signal(0);
  pendingCount = signal(0);
  approvedCount = signal(0);

  setActiveFilter(filter: 'All' | 'Pending' | 'Approved') {
    this.activeFilter.set(filter);
    this.page = 1;
    this.loadTasks();
  }

  onFilterChange() {
    this.page = 1;
    this.loadTasks();
  }

  handleSearch(query: string) {
    this.searchQuery = query;
    this.page = 1;
    this.loadTasks();
  }

  handleLazyLoad(event: any) {
    this.page = (event.first / event.rows) + 1;
    this.limit = event.rows;
    // We handle global filter (search) manually through onSearch event from table, 
    // but if table sends globalFilter in event, we can use it:
    if (event.globalFilter !== undefined) {
      this.searchQuery = event.globalFilter;
    }
    this.loadTasks();
  }

  selectedTasksList: ComplianceTask[] = [];

  tableColumns: TableColumn[] = [
    { field: 'circular_title', header: 'Circular Title', width: '20%', filterable: true },
    { field: 'authority_name', header: 'Authority', width: '15%', filterable: true },
    { field: 'header_name', header: 'Task Header', width: '15%' },
    { field: 'description', header: 'Task Description', width: '30%' },
    {
      field: 'status',
      header: 'Status',
      type: 'badge',
      width: '10%',
      filterable: true
    }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: (row) => this.openEditModal(row)
    },
    {
      label: 'Approve',
      icon: 'pi pi-check',
      styleClass: 'text-green-500',
      visible: (row) => row ? !row.is_approved : false,
      command: (row) => this.approveTask(row.id)
    }
  ];

  // Options
  priorityOptions = [
    { label: 'Critical', value: 'Critical' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  riskCategoryOptions = [
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  businessRiskOptions = [
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  controlRiskOptions = [
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  // Edit Modal State
  showEditModal = signal(false);
  editingTaskId: number | null = null;
  editTaskDescription = signal('');
  editTaskHeaderId = signal<number | null>(null);
  editTaskPriority = signal<string | null>(null);
  editTaskRiskCategory = signal<string | null>(null);
  editTaskBusinessRisk = signal<string | null>(null);
  editTaskControlRisk = signal<string | null>(null);
  editTaskAuditAreaId = signal<number | null>(null);

  taskHeaders = signal<any[]>([]);
  auditAreas = signal<any[]>([]);

  // Quick Add Header State
  showAddHeaderModal = false;
  newHeaderName = '';
  activeHeaderTarget: 'MANUAL' | 'EDIT' = 'MANUAL';


  // Manual Task Modal State
  showManualTaskModal = signal(false);
  manualTaskDescription = signal('');
  manualTaskHeaderId = signal<number | null>(null);
  manualTaskCircularId = signal<number | null>(null);
  manualTaskPriority = signal<string | null>(null);
  manualTaskRiskCategory = signal<string | null>(null);
  manualTaskBusinessRisk = signal<string | null>(null);
  manualTaskControlRisk = signal<string | null>(null);
  manualTaskAuditAreaId = signal<number | null>(null);
  circulars = signal<any[]>([]);

  get isCcoOrAdmin(): boolean {
    const role = this.auth.currentUser()?.role;
    return role === 'CCO' || role === 'CO' || role === 'ADMIN';
  }

  constructor(private api: ComplianceApiService, private route: ActivatedRoute, private auth: AuthService) { }

  ngOnInit() {
    this.api.getTaskHeaders().subscribe(data => this.taskHeaders.set(data));
    this.api.getCirculars({ limit: 1000, has_tasks: true }).subscribe(res => this.circulars.set(res.data));
    this.api.getAuditAreas().subscribe(data => this.auditAreas.set(data));

    this.route.queryParamMap.subscribe(params => {
      const circularId = params.get('circular_id');
      this.selectedCircularId = circularId ? Number(circularId) : null;
      this.loadTasks();
    });
  }

  loadTasks() {
    this.loading.set(true);

    const params: any = {
      page: this.page,
      limit: this.limit,
    };

    if (this.activeFilter() !== 'All') {
      params.status = this.activeFilter();
    }

    const circularId = this.selectedCircularFilter || this.selectedCircularId;
    if (circularId) {
      params.circular_id = circularId;
    }

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    // Fetch dynamic task counts for the summary cards
    this.api.getTaskStats().subscribe({
      next: (stats) => {
        this.totalCount.set(stats.total);
        this.pendingCount.set(stats.pending);
        this.approvedCount.set(stats.approved);
      },
      error: (err) => console.error('Error fetching task stats:', err)
    });

    this.api.getTasks(params).subscribe({
      next: (res) => {
        const mappedTasks = res.data.map((t: any) => ({
          ...t,
          status: t.is_approved ? 'Approved' : 'Pending'
        }));
        this.allTasks.set(mappedTasks);
        this.totalRecords.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  approveTask(id: number) {
    this.api.approveTask(id).subscribe(() => {
      this.loadTasks();
    });
  }

  openEditModal(task: any) {
    this.editingTaskId = task.id;
    this.editTaskDescription.set(task.description || '');
    this.editTaskHeaderId.set(task.header_id || null);
    this.editTaskPriority.set(task.priority || null);
    this.editTaskRiskCategory.set(task.risk_category || null);
    this.editTaskBusinessRisk.set(task.business_risk || null);
    this.editTaskControlRisk.set(task.control_risk || null);
    this.editTaskAuditAreaId.set(task.audit_area_id || null);
    this.showEditModal.set(true);
  }

  saveEditedTask() {
    if (this.editingTaskId && this.editTaskDescription().trim()) {
      const payload = {
        description: this.editTaskDescription(),
        header_id: this.editTaskHeaderId() || undefined,
        priority: this.editTaskPriority() || undefined,
        risk_category: this.editTaskRiskCategory() || undefined,
        business_risk: this.editTaskBusinessRisk() || undefined,
        control_risk: this.editTaskControlRisk() || undefined,
        audit_area_id: this.editTaskAuditAreaId() || undefined
      };
      this.api.updateTaskDescription(this.editingTaskId, payload).subscribe(() => {
        this.showEditModal.set(false);
        this.loadTasks();
      });
    }
  }





  openCreateManualTaskModal() {
    this.manualTaskDescription.set('');
    this.manualTaskHeaderId.set(null);
    this.manualTaskPriority.set(null);
    this.manualTaskRiskCategory.set(null);
    this.manualTaskBusinessRisk.set(null);
    this.manualTaskControlRisk.set(null);
    this.manualTaskAuditAreaId.set(null);
    this.manualTaskCircularId.set(this.selectedCircularId);
    this.showManualTaskModal.set(true);
  }

  createManualTask() {
    if (!this.manualTaskDescription().trim()) return;
    const circularId = this.manualTaskCircularId() || this.selectedCircularId;
    if (!circularId) return;

    const payload = {
      description: this.manualTaskDescription(),
      circular_id: circularId,
      header_id: this.manualTaskHeaderId() || undefined,
      priority: this.manualTaskPriority() || undefined,
      risk_category: this.manualTaskRiskCategory() || undefined,
      business_risk: this.manualTaskBusinessRisk() || undefined,
      control_risk: this.manualTaskControlRisk() || undefined,
      audit_area_id: this.manualTaskAuditAreaId() || undefined
    };

    this.api.createManualTask(payload).subscribe(() => {
      this.showManualTaskModal.set(false);
      this.loadTasks();
    });
  }

  quickAddHeader() {
    if (!this.newHeaderName.trim()) return;
    this.api.createTaskHeader(this.newHeaderName).subscribe(newHeader => {
      // Reload headers
      this.api.getTaskHeaders().subscribe(data => {
        this.taskHeaders.set(data);
        if (this.activeHeaderTarget === 'MANUAL') {
          this.manualTaskHeaderId.set(newHeader.id);
        } else {
          this.editTaskHeaderId.set(newHeader.id);
        }
        this.showAddHeaderModal = false;
        this.newHeaderName = '';
      });
    });
  }
}
