import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplianceApiService } from '../../core/services/api/compliance-api.service';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-assignment-details',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule],
  template: `
    <div class="animate-fade-in p-4">
      <div class="mb-4">
        <button class="text-indigo-600 hover:text-indigo-800 font-medium" (click)="goBack()">
          <i class="pi pi-arrow-left mr-1"></i> Back to Assignments
        </button>
      </div>
      
      <div class="glass-panel mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl gradient-text mb-2">Assignment Tasks</h1>
          <p class="text-gray-600">Execute tasks and upload evidence.</p>
        </div>
      </div>

      <ng-container *ngFor="let group of taskGroups">
        <div class="glass-panel mb-6 border-t-4 border-indigo-500">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 px-2">
            <i class="pi pi-tag mr-2 text-indigo-500"></i>
            {{ group.headerName }}
            <span class="ml-2 text-sm text-gray-500 font-normal bg-gray-100 px-2 py-1 rounded-full">{{ group.tasks.length }} Tasks</span>
          </h2>
          <table class="modern-table">
            <thead>
              <tr>
                <th>Task Details</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of group.tasks">
                <td>
                  <div class="font-medium text-gray-900">{{ t.circular_title }}</div>
                  <div class="text-sm text-gray-700 mt-1 max-w-xl">{{ t.description }}</div>
                </td>
                <td>
                  <span class="px-2 py-1 rounded-full text-xs font-bold"
                        [ngClass]="{'bg-yellow-100 text-yellow-800': t.status === 'PENDING', 'bg-green-100 text-green-800': t.status === 'COMPLETED'}">
                    {{ t.status }}
                  </span>
                </td>
                <td>
                  <button *ngIf="t.status !== 'COMPLETED'" class="btn-dynamic text-sm px-3 py-1" (click)="openEvidenceModal(t)">
                    <i class="pi pi-upload mr-1"></i> Upload Evidence
                  </button>
                  <button *ngIf="t.status === 'COMPLETED'" class="btn-secondary text-sm px-3 py-1 opacity-50 cursor-not-allowed" disabled>
                    <i class="pi pi-check mr-1"></i> Completed
                  </button>
                </td>
              </tr>
              <tr *ngIf="group.tasks.length === 0">
                <td colspan="3" class="text-center py-6 text-gray-500">No tasks found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
      
      <div *ngIf="taskGroups.length === 0" class="glass-panel text-center py-8 text-gray-500">
        No tasks found for this assignment.
      </div>

      <!-- Evidence Upload Modal -->
      <p-dialog header="Submit Task Evidence" [(visible)]="showModal" [modal]="true" [style]="{ width: '35rem' }">
        <div class="flex flex-column gap-3 mt-4" *ngIf="selectedTask">
          <p class="mb-4 text-gray-700 italic border-l-4 border-indigo-500 pl-3 py-1 bg-gray-50">{{ selectedTask.description }}</p>
          
          <div class="flex flex-column gap-2">
            <label class="block text-gray-700 font-medium mb-1">Answer / Remarks</label>
            <textarea [(ngModel)]="remark" class="modern-input h-24" placeholder="Enter your answer and any notes about this completion..." required></textarea>
          </div>

          <div class="flex flex-column gap-2 mt-2">
            <label class="block text-gray-700 font-medium mb-1">Evidence Documents (PDFs)</label>
            <input type="file" (change)="onFileSelected($event)" accept="application/pdf" multiple class="w-full text-gray-700 border p-2 rounded" required>
            <small class="text-gray-500">You can select multiple files if required.</small>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn-secondary px-4 py-2" (click)="closeModal()">Cancel</button>
          <button class="btn-dynamic px-4 py-2" (click)="onUpload()" [disabled]="uploading || selectedFiles.length === 0">
            {{ uploading ? 'Uploading...' : 'Submit Evidence' }}
          </button>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class AssignmentDetailsComponent implements OnInit {
  assignmentId: number | null = null;
  tasks: any[] = [];
  taskGroups: { headerName: string, tasks: any[] }[] = [];
  
  showModal = false;
  uploading = false;
  selectedTask: any = null;
  selectedFiles: File[] = [];
  remark = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ComplianceApiService
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

  loadTasks() {
    if (this.assignmentId) {
      this.api.getAssignmentTasks(this.assignmentId).subscribe(data => {
        this.tasks = data;
        this.groupTasks();
      });
    }
  }

  groupTasks() {
    const groupsMap = new Map<string, any[]>();
    
    this.tasks.forEach(task => {
      const headerName = task.header_name || 'Uncategorized';
      if (!groupsMap.has(headerName)) {
        groupsMap.set(headerName, []);
      }
      groupsMap.get(headerName)!.push(task);
    });

    this.taskGroups = Array.from(groupsMap.entries()).map(([headerName, tasks]) => ({
      headerName,
      tasks
    }));
    
    // Sort groups so "Uncategorized" is at the bottom, and the rest alphabetically
    this.taskGroups.sort((a, b) => {
      if (a.headerName === 'Uncategorized') return 1;
      if (b.headerName === 'Uncategorized') return -1;
      return a.headerName.localeCompare(b.headerName);
    });
  }

  goBack() {
    this.router.navigate(['/assignments']);
  }

  openEvidenceModal(task: any) {
    this.selectedTask = task;
    this.showModal = true;
    this.selectedFiles = [];
    this.remark = '';
  }

  closeModal() {
    this.showModal = false;
    this.selectedTask = null;
  }

  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  onUpload() {
    if (this.selectedFiles.length === 0 || !this.selectedTask || !this.assignmentId) {
      alert('Please select at least one file to upload.');
      return;
    }

    this.uploading = true;
    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('files', file); // Use 'files' to append multiple
    });
    formData.append('remark', this.remark);

    this.api.uploadTaskEvidence(this.assignmentId, this.selectedTask.assignment_task_id, formData)
      .subscribe({
        next: (res) => {
          this.uploading = false;
          this.closeModal();
          this.loadTasks();
          alert('Task evidence successfully submitted!');
        },
        error: (err) => {
          this.uploading = false;
          alert('Upload failed.');
          console.error(err);
        }
      });
  }
}
