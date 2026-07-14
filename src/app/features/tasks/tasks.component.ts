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
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DrawerModule, ButtonModule, TabsModule, PageComponent, TableComponent, TextareaFieldComponent, SelectFieldComponent, SelectModule, TableModule, ToastModule],
  providers: [MessageService],
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
              <div class="flex gap-2 align-items-center">
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
                <button
                  *ngIf="isCcoOrAdmin"
                  pButton
                  type="button"
                  icon="pi pi-upload"
                  label="Bulk Upload"
                  class="p-button-outlined p-button-secondary"
                  (click)="openBulkUploadModal()"
                ></button>
              </div>
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

      <!-- Bulk Upload Tasks Drawer -->
      <p-drawer
        [visible]="showBulkUploadModal()"
        (visibleChange)="showBulkUploadModal.set($event)"
        position="right"
        [style]="{ width: '920px', maxWidth: '96vw' }"
        [modal]="true"
        [dismissible]="true"
        [showCloseIcon]="false"
        styleClass="task-drawer"
      >
        <ng-template pTemplate="header">
          <div class="drawer-header-row">
            <div class="drawer-title-wrap">
              <span class="drawer-title-icon">
                <i class="pi pi-upload"></i>
              </span>
              <div>
                <div class="text-900 font-semibold text-xl">Bulk Upload Tasks</div>
                <div class="text-600 text-sm mt-1">Upload tasks in bulk via a CSV file</div>
              </div>
            </div>
            <button pButton pRipple type="button" icon="pi pi-times" class="p-button-text p-button-rounded" (click)="showBulkUploadModal.set(false)"></button>
          </div>
        </ng-template>

        <ng-template pTemplate="content">
          @if (showBulkUploadModal()) {
            <div class="drawer-content-shell">
              <section class="drawer-section">
                <div class="section-heading">
                  <span class="section-kicker">Upload Configuration</span>
                  <span class="section-line"></span>
                </div>

                <div class="grid formgrid p-fluid drawer-form-grid">
                  <div class="field col-12">
                    <app-select-field
                      label="Select Target Circular"
                      [field]="bulkUploadCircularId"
                      [options]="circulars()"
                      optionLabel="title"
                      optionValue="id"
                      [required]="true"
                      [virtualScroll]="true"
                      placeholder="Select Circular to associate tasks with">
                    </app-select-field>
                  </div>
                </div>

                <div class="surface-100 border-round p-3 mb-4 text-sm line-height-3 text-700 mt-2">
                  <div>• Upload only CSV files (.csv)</div>
                  <div>• Required columns: <strong>Task</strong> (description)</div>
                  <div>• Optional columns: <strong>Header</strong>, <strong>Priority</strong>, <strong>Risk Category</strong>, <strong>Business Risk</strong>, <strong>Control Risk</strong>, <strong>Broader area</strong></div>
                  <div>• Priority can be: <em>Critical, High, Medium, Low</em></div>
                  <div>• Risk Category can be: <em>CREDIT RISK, MARKET RISK, OPERATIONAL RISK, etc.</em></div>
                </div>

                <div class="border-2 border-dashed border-300 border-round p-4 text-center mt-3 cursor-pointer" (click)="fileInput.click()">
                  <input
                    #fileInput
                    type="file"
                    accept=".csv"
                    hidden
                    (change)="onFileSelect($event)"
                  />
                  <i class="pi pi-file-excel text-500 text-3xl block mb-2"></i>
                  <button
                    pButton
                    type="button"
                    icon="pi pi-upload"
                    label="Choose CSV File"
                    class="p-button-outlined p-button-sm mb-2"
                  ></button>
                  @if (selectedFileName().length > 0) {
                    <div class="mt-2 text-sm font-semibold text-primary">
                      {{ selectedFileName() }}
                    </div>
                  } @else {
                    <div class="text-500 text-sm">Or drag and drop CSV file here</div>
                  }
                </div>

                <div class="flex justify-content-between align-items-center mt-4 gap-3 flex-wrap">
                  <button
                    pButton
                    type="button"
                    icon="pi pi-download"
                    label="Download Sample CSV"
                    class="p-button-outlined p-button-secondary"
                    (click)="downloadSample()"
                  ></button>

                  <button
                    pButton
                    type="button"
                    icon="pi pi-shield"
                    label="Validate CSV"
                    [disabled]="!selectedFile() || !bulkUploadCircularId()"
                    [loading]="validating()"
                    (click)="validateCsv()"
                  ></button>
                </div>
              </section>

              @if (previewRows().length > 0) {
                <section class="drawer-section mt-3">
                  <div class="section-heading">
                    <span class="section-kicker">Validation Results</span>
                    <span class="section-line"></span>
                  </div>

                  @if (hasErrors()) {
                    <div class="surface-100 border-left-3 border-red-500 p-3 mb-3 text-sm border-round-right">
                      <div class="font-semibold text-red-600 mb-2">Validation Errors Found ({{ errorCount() }} errors)</div>
                      <div class="text-700">Please fix the issues highlighted in red before uploading.</div>
                    </div>
                  } @else {
                    <div class="surface-100 border-left-3 border-green-500 p-3 mb-3 text-sm border-round-right">
                      <div class="font-semibold text-green-700 mb-1">CSV validated successfully!</div>
                      <div class="text-700">
                        {{ validRows().length }} tasks are ready to upload.
                      </div>
                    </div>
                  }

                  <p-table
                    [value]="previewRows()"
                    styleClass="p-datatable-sm"
                    [scrollable]="true"
                    scrollHeight="350px"
                  >
                    <ng-template pTemplate="header">
                      <tr>
                        <th style="width: 60px">Row</th>
                        <th>Header</th>
                        <th>Task Description</th>
                        <th>Priority</th>
                        <th>Risk Category</th>
                        <th style="width: 100px">Status</th>
                        <th>Message</th>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-row>
                      <tr>
                        <td>{{ row.rowNumber }}</td>
                        <td>{{ row.headerName || '-' }}</td>
                        <td>{{ row.description || '-' }}</td>
                        <td>{{ row.priority || '-' }}</td>
                        <td>{{ row.riskCategory || '-' }}</td>
                        <td>
                          <span
                            [class]="
                              row.status === 'VALID'
                                ? 'text-green-600 font-semibold'
                                : 'text-red-500 font-semibold'
                            "
                          >
                            {{ row.status }}
                          </span>
                        </td>
                        <td [class.text-red-500]="row.status === 'ERROR'">{{ row.message }}</td>
                      </tr>
                    </ng-template>
                  </p-table>

                  <div class="flex justify-content-end mt-4">
                    <button
                      pButton
                      type="button"
                      label="Upload Tasks"
                      icon="pi pi-check"
                      class="p-button-success"
                      [disabled]="hasErrors() || !validRows().length || uploading()"
                      [loading]="uploading()"
                      (click)="uploadRows()"
                    ></button>
                  </div>
                </section>
              }
            </div>
          }
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
    { label: 'CREDIT RISK', value: 'CREDIT RISK' },
    { label: 'MARKET RISK', value: 'MARKET RISK' },
    { label: 'FINANCIAL RISK', value: 'FINANCIAL RISK' },
    { label: 'LIQUIDITY RISK', value: 'LIQUIDITY RISK' },
    { label: 'OPERATIONAL RISK', value: 'OPERATIONAL RISK' },
    { label: 'REGULATORY AND LEGAL RISK', value: 'REGULATORY AND LEGAL RISK' },
    { label: 'REPUTATIONAL RISK', value: 'REPUTATIONAL RISK' },
    { label: 'INFORMATION TECHNOLOGY RISK', value: 'INFORMATION TECHNOLOGY RISK' },
    { label: 'OTHER RESIDUAL RISK', value: 'OTHER RESIDUAL RISK' },
    { label: 'NOT APPLICABLE', value: 'NOT APPLICABLE' }
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

  // Bulk Upload State
  showBulkUploadModal = signal(false);
  bulkUploadCircularId = signal<number | null>(null);
  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');
  previewRows = signal<any[]>([]);
  validRows = signal<any[]>([]);
  validating = signal(false);
  uploading = signal(false);

  hasErrors = computed(() => this.previewRows().some((row) => row.status === 'ERROR'));
  errorCount = computed(() => this.previewRows().filter((row) => row.status === 'ERROR').length);

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

  constructor(private api: ComplianceApiService, private route: ActivatedRoute, private auth: AuthService, private messageService: MessageService) { }

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

  openBulkUploadModal() {
    this.showBulkUploadModal.set(true);
    this.bulkUploadCircularId.set(this.selectedCircularFilter || this.selectedCircularId);
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.previewRows.set([]);
    this.validRows.set([]);
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail: 'Please select a CSV file only',
      });
      return;
    }

    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
    this.previewRows.set([]);
    this.validRows.set([]);
  }

  downloadSample() {
    window.open('./assets/csv/compliance-pro-task-upload-sample.csv', '_blank');
  }

  validateCsv() {
    const file = this.selectedFile();
    const circularId = this.bulkUploadCircularId();
    if (!file || !circularId) return;

    this.validating.set(true);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = this.parseCsv(text);
        
        // Match headers
        const requiredHeaders = ['task'];
        const actualHeaders = parsed.headers.map(h => h.trim().toLowerCase());
        const missing = requiredHeaders.filter(h => !actualHeaders.includes(h));
        
        if (missing.length > 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Validation Failed',
            detail: `Missing required column: ${missing.join(', ')}`
          });
          this.validating.set(false);
          return;
        }

        const preview: any[] = [];
        const valid: any[] = [];

        parsed.rows.forEach((row, idx) => {
          const rowNumber = idx + 2;
          const description = (row['task'] || '').trim();
          const headerName = (row['header'] || '').trim();
          const priority = (row['priority'] || '').trim();
          const riskCategory = (row['risk_category'] || '').trim();
          const businessRisk = (row['business_risk'] || '').trim();
          const controlRisk = (row['control_risk'] || '').trim();
          const auditAreaName = (row['broader_area'] || '').trim();

          const errors: string[] = [];

          if (!description) {
            errors.push('Task description is required');
          }

          let headerId: number | null = null;
          if (headerName) {
            const h = this.taskHeaders().find(
              x => x.name.trim().toLowerCase() === headerName.toLowerCase()
            );
            if (h) {
              headerId = h.id;
            } else {
              errors.push(`Header "${headerName}" does not exist in task headers`);
            }
          }

          let auditAreaId: number | null = null;
          if (auditAreaName) {
            const a = this.auditAreas().find(
              x => x.name.trim().toLowerCase() === auditAreaName.toLowerCase()
            );
            if (a) {
              auditAreaId = a.id;
            } else {
              errors.push(`Broader area "${auditAreaName}" does not exist`);
            }
          }

          // Validate priority value
          let normalizedPriority: string | null = null;
          if (priority) {
            const pOpt = this.priorityOptions.find(
              opt => opt.label.toLowerCase() === priority.toLowerCase()
            );
            if (pOpt) {
              normalizedPriority = pOpt.value;
            } else {
              errors.push(`Priority must be one of: Critical, High, Medium, Low`);
            }
          }

          // Validate risk category value
          let normalizedRiskCategory: string | null = null;
          if (riskCategory) {
            const rcOpt = this.riskCategoryOptions.find(
              opt => opt.label.toLowerCase() === riskCategory.toLowerCase()
            );
            if (rcOpt) {
              normalizedRiskCategory = rcOpt.value;
            } else {
              errors.push(`Risk category is invalid`);
            }
          }

          // Validate business risk value
          let normalizedBusinessRisk: string | null = null;
          if (businessRisk) {
            const brOpt = this.businessRiskOptions.find(
              opt => opt.label.toLowerCase() === businessRisk.toLowerCase()
            );
            if (brOpt) {
              normalizedBusinessRisk = brOpt.value;
            } else {
              errors.push(`Business risk must be one of: High, Medium, Low`);
            }
          }

          // Validate control risk value
          let normalizedControlRisk: string | null = null;
          if (controlRisk) {
            const crOpt = this.controlRiskOptions.find(
              opt => opt.label.toLowerCase() === controlRisk.toLowerCase()
            );
            if (crOpt) {
              normalizedControlRisk = crOpt.value;
            } else {
              errors.push(`Control risk must be one of: High, Medium, Low`);
            }
          }

          const previewRow = {
            rowNumber,
            description,
            headerName,
            priority,
            riskCategory,
            status: errors.length > 0 ? 'ERROR' : 'VALID',
            message: errors.join('; ') || 'Ready'
          };

          preview.push(previewRow);

          if (errors.length === 0) {
            valid.push({
              description,
              circular_id: circularId,
              header_id: headerId,
              priority: normalizedPriority,
              risk_category: normalizedRiskCategory,
              business_risk: normalizedBusinessRisk,
              control_risk: normalizedControlRisk,
              audit_area_id: auditAreaId
            });
          }
        });

        this.previewRows.set(preview);
        this.validRows.set(valid);
        this.validating.set(false);

        this.messageService.add({
          severity: this.hasErrors() ? 'warn' : 'success',
          summary: this.hasErrors() ? 'Validation Complete with Errors' : 'Validation Successful',
          detail: this.hasErrors() ? 'Please correct invalid rows' : `${valid.length} rows ready`
        });

      } catch (err: any) {
        this.validating.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Parser Error',
          detail: err.message || 'Error parsing CSV file'
        });
      }
    };
    reader.onerror = () => {
      this.validating.set(false);
      this.messageService.add({
        severity: 'error',
        summary: 'Reader Error',
        detail: 'Error reading file content'
      });
    };
    reader.readAsText(file);
  }

  uploadRows() {
    if (!this.validRows().length || this.hasErrors()) return;

    this.uploading.set(true);
    this.api.bulkUploadTasks({ rows: this.validRows() }).subscribe({
      next: () => {
        this.uploading.set(false);
        this.showBulkUploadModal.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Bulk Upload Successful',
          detail: `${this.validRows().length} tasks uploaded successfully`
        });
        this.loadTasks();
      },
      error: (err) => {
        this.uploading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: err?.error?.message || 'Error occurred during bulk upload'
        });
      }
    });
  }

  private parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines: string[][] = [];
    let current = '';
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < content.length; i += 1) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i += 1;
        }
        row.push(current.trim());
        current = '';
        if (row.some((item) => item.length > 0)) {
          lines.push(row);
        }
        row = [];
        continue;
      }

      current += char;
    }

    if (current.length || row.length) {
      row.push(current.trim());
      if (row.some((item) => item.length > 0)) {
        lines.push(row);
      }
    }

    const [headerRow = [], ...dataRows] = lines;
    const headers = headerRow.map((header) => header.trim());
    const mappedRows = dataRows.map((cells) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        const key = header.trim().toLowerCase().replace(/\s+/g, '_');
        record[key] = (cells[index] || '').trim();
      });
      return record;
    });

    return { headers, rows: mappedRows };
  }
}
