import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplianceApiService } from '../../core/services/api/compliance-api.service';
import { NotificationService } from '../../core/services/notification/notification.service';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-assignment-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, Textarea, TagModule, TooltipModule],
  styleUrls: ['../../shared/styles/checklist-shared.css'],
  template: `
    <!-- Scrollable Page Wrapper -->
    <div style="height: calc(100vh - 70px); overflow-y: auto; padding: 1rem; box-sizing: border-box;">
      
      <!-- Back navigation link -->
      <div class="mb-2">
        <p-button (click)="goBack()" label="Back to Assignments" icon="pi pi-arrow-left"
                  [text]="true" severity="secondary" size="small" />
      </div>
      
      <!-- Compact Premium Dashboard Header -->
      <div class="glass-panel mb-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-4" 
           style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem;">
        
        <!-- Left: Scope & Period -->
        <div class="flex-column gap-1" style="flex: 1.2; min-width: 250px;">
          <div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
              {{ branchName() }}
            </span>
            <span class="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
              Freq: {{ frequency() || 'ONCE' }}
            </span>
          </div>
          <h1 class="text-lg font-bold text-gray-900 m-0 mt-1" style="margin-top: 0.15rem;">{{ taskSetName() }}</h1>
          <span class="text-xs text-gray-500 font-medium" *ngIf="startDate() && endDate()">
            Period: {{ startDate() | date:'dd-MM-yyyy' }} to {{ endDate() | date:'dd-MM-yyyy' }}
          </span>
        </div>

        <!-- Middle: Circular Ref & Due Date -->
        <div class="flex-column gap-1" style="flex: 1.5; min-width: 280px; border-left: 1px solid #f3f4f6; padding-left: 1rem;">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block" style="font-size: 0.65rem;">Circular Details</span>
          <p class="text-xs font-bold text-gray-700 m-0 truncate max-w-md" [title]="circularTitle()">
            {{ circularTitle() }}
          </p>
          <div class="flex items-center gap-2 mt-1" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.15rem;">
            <span class="text-xs font-semibold text-gray-600 bg-gray-50 border px-2 py-0.5 rounded" style="font-size: 0.7rem;">
              Ref: {{ circularReferenceNo() || 'N/A' }}
            </span>
            <span class="text-xs font-semibold text-gray-600 bg-gray-50 border px-2 py-0.5 rounded" style="font-size: 0.7rem;">
              Auth: {{ authorityName() || 'N/A' }}
            </span>
            <span class="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1" style="font-size: 0.7rem;">
              <i class="pi pi-calendar-times"></i> Due: {{ proposedTimeline() | date:'dd-MM-yyyy' }}
            </span>
          </div>
        </div>

        <!-- Right: Progress & Status -->
        <div class="flex items-center gap-4" style="display: flex; align-items: center; gap: 1rem; min-width: 250px; border-left: 1px solid #f3f4f6; padding-left: 1rem;">
          <div class="flex-column items-end" style="display: flex; flex-direction: column; align-items: flex-end; flex: 1;">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5" style="font-size: 0.65rem;">Status & Progress</span>
            <div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-yellow-100 text-yellow-800': assignmentStatus() === 'Pending_Timeline' || assignmentStatus() === 'Timeline_Review',
                      'bg-indigo-100 text-indigo-800': assignmentStatus() === 'In_Progress',
                      'bg-orange-100 text-orange-800': assignmentStatus() === 'REVIEW_PENDING' || assignmentStatus() === 'ESCALATED_TO_CCO',
                      'bg-green-100 text-green-800': assignmentStatus() === 'COMPLETED',
                      'bg-red-100 text-red-800': assignmentStatus() === 'REJECTED'
                    }" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">
                {{ assignmentStatus() }}
              </span>
              <span class="text-xs font-bold text-indigo-600">{{ completedCount() }}/{{ tasks().length }} Done</span>
            </div>
            <div class="w-24 bg-gray-100 rounded-full h-1 overflow-hidden mt-1" style="width: 5rem; margin-top: 0.25rem;">
              <div class="bg-indigo-600 h-1 rounded-full transition-all duration-300" [style.width.%]="progressPercentage()"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- Rejection Alert Banner -->
      <div *ngIf="assignmentStatus() === 'REJECTED'" class="p-3 mb-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="pi pi-exclamation-triangle text-red-500 text-lg"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-xs font-bold text-red-800 m-0">Assignment Rejected by CCO/CO</h3>
            <div class="mt-1 text-xs text-red-700">
              <p class="font-semibold m-0">Reason: "{{ reviewRemark() || 'No feedback provided' }}"</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Task Headers Groups -->
      <ng-container *ngFor="let group of taskGroups()">
        <!-- Blue Header Banner matching PHP -->
        <div class="bg-indigo-600 text-white font-bold px-4 py-2 mt-4 rounded-t-xl" 
             style="background-color: #4f46e5; text-transform: uppercase; font-size: 0.825rem; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center;">
          <span>Compliance</span>
          <span class="text-xs opacity-90">{{ group.tasks.length }} Tasks</span>
        </div>

        <div class="glass-panel mb-4 bg-white rounded-b-xl rounded-t-none border border-gray-100 overflow-hidden shadow-sm"
             style="border-top: 0; padding: 0.5rem 1.25rem 0.75rem 1.25rem;">
          
          <!-- Header name block matching PHP -->
          <div class="border-b border-gray-100 pb-1.5 mb-2">
            <h2 class="text-xs font-bold text-gray-500 m-0 uppercase tracking-wider" style="font-size: 0.725rem; letter-spacing: 0.05em; color: #4b5563;">
              HEADER: {{ group.headerName === 'Uncategorized' ? 'GENERAL TASK' : group.headerName }}
            </h2>
          </div>
          
          <!-- Compact checklist continuous row layout -->
          <div class="flex flex-column" style="padding: 0;">
            <div *ngFor="let t of group.tasks; let i = index" 
                 class="question-card"
                 [ngClass]="{
                   'border-left-green': t.status === 'COMPLETED' && t.compliance_status === 'COMPLIED',
                   'border-left-red': t.status === 'COMPLETED' && t.compliance_status === 'NOT_COMPLIED',
                   'border-left-yellow': t.status === 'PENDING'
                 }">
              
              <!-- Left Column: Serial Number & Task Info -->
              <div class="question-main">
                <div class="question-number">
                  {{ i + 1 }}
                </div>
                <div>
                  <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5" style="font-size: 0.65rem; letter-spacing: 0.05em;">
                    {{ t.circular_title }}
                  </span>
                  <p class="font-semibold text-gray-800 m-0" style="line-height: 1.45; font-size: 0.95rem;">
                    {{ t.description }}
                  </p>
                </div>
              </div>

              <!-- Right Column: Answer Form Sub-grid -->
              <div class="answer-form">
                <div class="answer-form-grid">
                  
                  <!-- Left Sub-column: Dropdown & File Uploader & Save Button (Stacked) -->
                  <div class="answer-field" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div>
                      <label class="control-label">Compliance <span class="text-red-500">*</span></label>
                      <p-select
                        [(ngModel)]="t.temp_compliance_status"
                        [options]="complianceOptions"
                        optionLabel="label"
                        optionValue="value"
                        [disabled]="!canEditAssignment()"
                        styleClass="answer-control w-full"
                        [ngClass]="{
                          'border-green-500': t.temp_compliance_status === 'COMPLIED',
                          'border-red-500': t.temp_compliance_status === 'NOT_COMPLIED'
                        }"
                        placeholder="Select status..."
                      />
                    </div>

                    <!-- Upload PDF Button (Full Width) -->
                    <div *ngIf="canEditAssignment()">
                      <label class="upload-btn cursor-pointer"
                             [ngClass]="{'upload-btn-attached': getSelectedFileName(t.assignment_task_id)}">
                        <input type="file" 
                               (change)="onFileSelected($event, t.assignment_task_id)" 
                               accept="application/pdf" 
                               class="hidden">
                        <i class="pi pi-upload mr-1"></i> 
                        {{ getSelectedFileName(t.assignment_task_id) ? 'Change PDF' : 'Upload PDF' }}
                      </label>
                    </div>

                    <!-- View PDF link -->
                    <div style="display: flex; justify-content: space-between; align-items: center; min-height: 1.25rem; margin-top: -0.15rem; margin-bottom: -0.15rem;">
                      <div>
                        <a *ngIf="t.has_evidence && t.evidence_url"
                           [href]="t.evidence_url"
                           target="_blank"
                           class="evidence-link">
                          <i class="pi pi-file-pdf" style="color: #ef4444;"></i> View PDF
                        </a>
                      </div>
                      <small *ngIf="getSelectedFileName(t.assignment_task_id)"
                             class="text-indigo-600 font-medium"
                             style="font-size: 0.65rem;"
                             [pTooltip]="getSelectedFileName(t.assignment_task_id)">
                        Attached: {{ getSelectedFileName(t.assignment_task_id) | slice:0:18 }}…
                      </small>
                    </div>

                    <!-- Save Row button -->
                    <p-button *ngIf="canEditAssignment()"
                              label="Save Task"
                              [loading]="!!rowSavingMap()[t.assignment_task_id]"
                              loadingIcon="pi pi-spinner pi-spin"
                              icon="pi pi-save"
                              iconPos="left"
                              [disabled]="rowSavingMap()[t.assignment_task_id] || t.temp_compliance_status === 'PENDING' || !t.temp_remarks?.trim()"
                              (click)="saveSingleTask(t)"
                              styleClass="w-full save-row-btn"
                              size="small" />
                  </div>

                  <!-- Right Sub-column: Remarks textarea -->
                  <div class="answer-field" style="display: flex; flex-direction: column; height: 100%;">
                    <label class="control-label">Remarks / Explanation <span class="text-red-500">*</span></label>
                    <textarea pTextarea
                              [(ngModel)]="t.temp_remarks"
                              [disabled]="!canEditAssignment()"
                              class="answer-control"
                              style="flex: 1; resize: none; min-height: 6rem;"
                              placeholder="Add compliance remarks or explanation..."></textarea>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </ng-container>

      <!-- Bulk Submit Compliance Button -->
      <div class="mt-4 mb-5" *ngIf="canEditAssignment()">
        <p-button
          label="Submit Compliance"
          icon="pi pi-send"
          [loading]="submitting"
          loadingIcon="pi pi-spinner pi-spin"
          (click)="submitAllCompliance()"
          styleClass="w-full submit-compliance-btn"
          size="large" />
      </div>

      <div *ngIf="taskGroups().length === 0" class="glass-panel text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-100">
        No compliance tasks found for this assignment.
      </div>
      
      <div style="height: 4rem;"></div> <!-- bottom padding spacing -->
    </div>
  `,
})
export class AssignmentDetailsComponent implements OnInit {
  assignmentId: number | null = null;
  
  tasks = signal<any[]>([]);
  taskGroups = signal<{ headerName: string, tasks: any[] }[]>([]);
  
  assignmentStatus = signal<string>('');
  reviewRemark = signal<string>('');

  // Rich metadata properties
  branchName = signal<string>('');
  taskSetName = signal<string>('');
  proposedTimeline = signal<string>('');
  frequency = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');
  circularReferenceNo = signal<string>('');
  circularTitle = signal<string>('');
  authorityName = signal<string>('');

  submitting = false;

  // Options for the p-select compliance status dropdown
  complianceOptions = [
    { label: 'Pending Declaration', value: 'PENDING' },
    { label: 'Complied', value: 'COMPLIED' },
    { label: 'Not Complied', value: 'NOT_COMPLIED' }
  ];

  // Local reactive signals to track newly selected files and saving states
  selectedFilesMap = signal<Record<number, File>>({});
  rowSavingMap = signal<Record<number, boolean>>({});
  headerSavingMap = new Map<string, boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ComplianceApiService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.assignmentId = parseInt(id, 10);
        this.loadTasks();
      }
    });
  }

  completedCount = computed(() => this.tasks().filter(t => t.status === 'COMPLETED').length);
  progressPercentage = computed(() => this.tasks().length ? Math.round((this.completedCount() / this.tasks().length) * 100) : 0);

  canEditAssignment(): boolean {
    const status = this.assignmentStatus();
    return status !== 'REVIEW_PENDING' && status !== 'COMPLETED' && status !== 'ESCALATED_TO_CCO';
  }

  loadTasks() {
    if (this.assignmentId) {
      console.log('Fetching tasks for assignmentId:', this.assignmentId);
      this.api.getAssignmentTasks(this.assignmentId).subscribe({
        next: (data) => {
          console.log('API Response data received:', data);
          
          // Map backend tasks to hold temporary form values for clean binding
          const mappedTasks = data.map(t => ({
            ...t,
            temp_compliance_status: t.compliance_status || 'PENDING',
            temp_remarks: t.remarks || '',
            has_evidence: false,
            evidence_url: ''
          }));
          
          this.tasks.set(mappedTasks);
          
          if (mappedTasks.length > 0) {
            const first = mappedTasks[0];
            this.assignmentStatus.set(first.assignment_status);
            this.reviewRemark.set(first.assignment_review_remark || '');
            
            // Populate rich header metadata
            this.branchName.set(first.branch_name || '');
            this.taskSetName.set(first.task_set_name || '');
            this.proposedTimeline.set(first.proposed_timeline || '');
            this.frequency.set(first.frequency || '');
            this.startDate.set(first.start_date || '');
            this.endDate.set(first.end_date || '');
            this.circularReferenceNo.set(first.circular_reference_no || '');
            this.circularTitle.set(first.circular_title || '');
            this.authorityName.set(first.authority_name || '');
            
            console.log('Assignment status:', this.assignmentStatus(), 'Review remark:', this.reviewRemark());
          } else {
            this.assignmentStatus.set('');
            this.reviewRemark.set('');
            this.branchName.set('');
            this.taskSetName.set('');
            this.proposedTimeline.set('');
            this.frequency.set('');
            this.startDate.set('');
            this.endDate.set('');
            this.circularReferenceNo.set('');
            this.circularTitle.set('');
            this.authorityName.set('');
          }

          // Fetch evidence urls linked to this assignment
          this.loadEvidence();
        },
        error: (err) => {
          console.error('API Error fetching tasks:', err);
          this.notification.error('Failed to load assignment tasks: ' + (err.message || err.statusText));
        }
      });
    }
  }

  loadEvidence() {
    if (!this.assignmentId) return;

    this.api.getAssignmentEvidence(this.assignmentId).subscribe(evidenceList => {
      console.log('Evidence documents found:', evidenceList);
      
      const updatedTasks = this.tasks().map(task => {
        // Find evidence linked to this specific assignment task
        const evidence = evidenceList.find(e => e.task_id === task.task_id);
        if (evidence) {
          return {
            ...task,
            has_evidence: true,
            evidence_url: this.api.getFileUrl(evidence.file_url)
          };
        }
        return task;
      });

      this.tasks.set(updatedTasks);
      this.groupTasks();
    });
  }

  groupTasks() {
    const groupsMap = new Map<string, any[]>();
    
    this.tasks().forEach(task => {
      const headerName = task.header_name || 'Uncategorized';
      if (!groupsMap.has(headerName)) {
        groupsMap.set(headerName, []);
      }
      groupsMap.get(headerName)!.push(task);
    });

    const groups = Array.from(groupsMap.entries()).map(([headerName, tasks]) => ({
      headerName,
      tasks
    }));
    
    groups.sort((a, b) => {
      if (a.headerName === 'Uncategorized') return 1;
      if (b.headerName === 'Uncategorized') return -1;
      return a.headerName.localeCompare(b.headerName);
    });

    this.taskGroups.set(groups);
  }

  goBack() {
    this.router.navigate(['/assignments']);
  }

  onFileSelected(event: any, assignmentTaskId: number) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFilesMap.update(map => ({
        ...map,
        [assignmentTaskId]: files[0]
      }));
    }
  }

  getSelectedFileName(assignmentTaskId: number): string {
    const file = this.selectedFilesMap()[assignmentTaskId];
    return file ? file.name : '';
  }

  // Save a single task row declaration and/or upload evidence
  async saveSingleTask(task: any, showNotification: boolean = true): Promise<boolean> {
    if (!this.assignmentId) return false;
    if (task.temp_compliance_status === 'PENDING') {
      this.notification.warn('Please select a compliance declaration (Complied or Not Complied).');
      return false;
    }
    if (!task.temp_remarks?.trim()) {
      this.notification.warn('Remarks / Explanation is required.');
      return false;
    }

    const taskId = task.assignment_task_id;
    this.rowSavingMap.update(map => ({ ...map, [taskId]: true }));

    return new Promise((resolve) => {
      const file = this.selectedFilesMap()[taskId];

      if (file) {
        // 1. Submit with evidence file upload
        const formData = new FormData();
        formData.append('files', file);
        formData.append('remark', task.temp_remarks);

        this.api.uploadTaskEvidence(this.assignmentId!, taskId, formData)
          .subscribe({
            next: () => {
              // If status is NOT_COMPLIED, sync it to database
              if (task.temp_compliance_status === 'NOT_COMPLIED') {
                this.api.completeTaskDirectly(this.assignmentId!, taskId, 'NOT_COMPLIED', task.temp_remarks)
                  .subscribe({
                    next: () => {
                      setTimeout(() => {
                        this.selectedFilesMap.update(map => {
                          const copy = { ...map };
                          delete copy[taskId];
                          return copy;
                        });
                        this.rowSavingMap.update(map => ({ ...map, [taskId]: false }));
                        this.loadTasks();
                        if (showNotification) {
                          this.notification.success('Task compliance and evidence saved successfully!');
                        }
                        resolve(true);
                      });
                    },
                    error: (err) => {
                      setTimeout(() => {
                        this.rowSavingMap.update(map => ({ ...map, [taskId]: false }));
                        this.notification.error('Failed to complete task compliance: ' + (err.message || err.statusText));
                        resolve(false);
                      });
                    }
                  });
              } else {
                setTimeout(() => {
                  this.selectedFilesMap.update(map => {
                    const copy = { ...map };
                    delete copy[taskId];
                    return copy;
                  });
                  this.rowSavingMap.update(map => ({ ...map, [taskId]: false }));
                  this.loadTasks();
                  if (showNotification) {
                    this.notification.success('Task compliance and evidence saved successfully!');
                  }
                  resolve(true);
                });
              }
            },
            error: (err) => {
              console.error(err);
              setTimeout(() => {
                this.rowSavingMap.update(map => ({ ...map, [taskId]: false }));
                this.notification.error('Failed to upload evidence document: ' + (err.message || err.statusText));
                resolve(false);
              });
            }
          });
      } else {
        // 2. Submit text-only declaration directly
        this.api.completeTaskDirectly(this.assignmentId!, taskId, task.temp_compliance_status, task.temp_remarks)
          .subscribe({
            next: () => {
              setTimeout(() => {
                this.rowSavingMap.update(map => ({ ...map, [taskId]: false }));
                this.loadTasks();
                if (showNotification) {
                  this.notification.success('Task compliance saved successfully!');
                }
                resolve(true);
              });
            },
            error: (err) => {
              console.error(err);
              setTimeout(() => {
                this.rowSavingMap.update(map => ({ ...map, [taskId]: false }));
                this.notification.error('Failed to save task compliance: ' + (err.message || err.statusText));
                resolve(false);
              });
            }
          });
      }
    });
  }

  // Bulk submit all compliance tasks matching PHP monolith submission flow
  async submitAllCompliance() {
    if (!this.assignmentId) return;

    // 1. Validate all tasks are filled
    for (const t of this.tasks()) {
      if (t.temp_compliance_status === 'PENDING') {
        this.notification.warn('Please select a compliance declaration (Complied or Not Complied) for all checklist items before submitting.');
        return;
      }
      if (!t.temp_remarks?.trim()) {
        this.notification.warn('Remarks / Explanation are required for all checklist items before submitting.');
        return;
      }
    }

    this.submitting = true;
    console.log(`Bulk submitting compliance declarations for assignmentId: ${this.assignmentId}...`);

    // 2. Run all save operations in parallel without individual success popups
    const results = await Promise.all(this.tasks().map(t => this.saveSingleTask(t, false)));
    
    const allSuccessful = results.every(res => res === true);
    if (allSuccessful) {
      this.api.updateAssignmentStatus(this.assignmentId, 'REVIEW_PENDING').subscribe({
        next: () => {
          this.submitting = false;
          this.notification.success('Compliance checklist submitted successfully!');
          this.loadTasks(); // Reload to refresh status and lock controls
        },
        error: (err) => {
          this.submitting = false;
          console.error(err);
          this.notification.error('Checklist items saved, but failed to submit assignment to CCO: ' + (err.message || err.statusText));
        }
      });
    } else {
      this.submitting = false;
      this.notification.error('Some checklist items failed to save. Please review the responses and try again.');
    }
  }
}
