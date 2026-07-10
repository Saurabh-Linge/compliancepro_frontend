import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplianceApiService } from '../../core/services/api/compliance-api.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { PageComponent } from '../../shared/components/page/page.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageComponent],
  template: `
    <app-page 
      [title]="role === 'CCO' || role === 'ADMIN' ? 'Compliance Dashboard' : (role === 'CO' ? 'CO Dashboard' : 'Branch Dashboard')" 
      subtitle="Real-time overview of your compliance operations."
    >
      
      <!-- Loading State Spinner -->
      <div *ngIf="loading()" class="card flex justify-content-center align-items-center p-8 min-h-20rem">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
          <p class="text-gray-500 font-semibold m-0">Loading compliance statistics...</p>
        </div>
      </div>

      <!-- Main Dashboard view once loaded -->
      <ng-container *ngIf="!loading()">
        
        <!-- 1. CCO / ADMIN DASHBOARD VIEW -->
        <ng-container *ngIf="role === 'CCO' || role === 'ADMIN'">
          
          <!-- CCO Stats Cards Row -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <!-- Total Branches -->
            <div class="stat-card-custom">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Total Branches</span>
                  <span class="card-value">{{ stats?.ccoMetrics?.totalBranches ?? 0 }}</span>
                </div>
                <div class="icon-circle branch-icon">
                  <i class="pi pi-sitemap text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-indigo-500"></div>
            </div>

            <!-- Total Head Office -->
            <div class="stat-card-custom">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Total Head Office</span>
                  <span class="card-value">{{ stats?.ccoMetrics?.totalHeadOffice ?? 0 }}</span>
                </div>
                <div class="icon-circle ho-icon">
                  <i class="pi pi-home text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-purple-500"></div>
            </div>

            <!-- Pending Compliance -->
            <div class="stat-card-custom">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Pending Compliance</span>
                  <span class="card-value text-orange-600">{{ stats?.ccoMetrics?.pendingCompliance ?? 0 }}</span>
                </div>
                <div class="icon-circle pending-icon">
                  <i class="pi pi-list text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-orange-500"></div>
            </div>

            <!-- Total Overdue -->
            <div class="stat-card-custom">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Total Overdue</span>
                  <span class="card-value text-red-600">{{ stats?.ccoMetrics?.totalOverdue ?? 0 }}</span>
                </div>
                <div class="icon-circle overdue-icon">
                  <i class="pi pi-clock text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-red-500"></div>
            </div>
          </div>

          <!-- Authority Wise Short Report Heading -->
          <div class="mb-4 ml-1">
            <h2 class="text-xl font-bold text-gray-900 m-0">Authority Wise Short Report</h2>
            <p class="text-gray-500 text-sm m-0 mt-1">Overview of Total Circulars, Pending Actions, Overdue Tasks, and Penalties.</p>
          </div>

          <!-- Authority Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="authority-card overflow-hidden" *ngFor="let auth of stats?.ccoMetrics?.authorityReports">
              <!-- Card Header -->
              <div class="auth-card-header flex justify-between items-center">
                <span class="auth-name">{{ auth.name }}</span>
                <span class="auth-id-badge">ID: {{ auth.id }}</span>
              </div>
              
              <!-- Card Content -->
              <div class="p-4 flex flex-column gap-3">
                <div class="auth-stat-row">
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="pi pi-file text-indigo-500"></i>
                    <span>Total Applicable Circulars</span>
                  </div>
                  <span class="badge badge-indigo font-bold">{{ auth.applicable_circulars }}</span>
                </div>

                <div class="auth-stat-row">
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="pi pi-exclamation-circle text-orange-500"></i>
                    <span>Total Pending Tasks</span>
                  </div>
                  <span class="badge badge-orange font-bold">{{ auth.pending_tasks }}</span>
                </div>

                <div class="auth-stat-row">
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="pi pi-clock text-red-500"></i>
                    <span>Total Overdue Tasks</span>
                  </div>
                  <span class="badge badge-red font-bold">{{ auth.overdue_tasks }}</span>
                </div>

                <div class="auth-stat-row border-t pt-3 mt-1">
                  <div class="flex items-center gap-2 text-gray-700 font-bold">
                    <i class="pi pi-money-bill text-red-600"></i>
                    <span>Total Penalty</span>
                  </div>
                  <span class="penalty-amount text-red-600 font-bold">Rs. {{ auth.total_penalty | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Card Footer / Status -->
              <div class="auth-card-footer flex justify-between items-center p-3 border-t">
                <span class="text-xs text-gray-400 font-semibold uppercase">Status</span>
                <span *ngIf="auth.pending_tasks === 0 && auth.overdue_tasks === 0" class="status-pill completed-pill">
                  <i class="pi pi-check-circle mr-1"></i> Compliance Completed
                </span>
                <span *ngIf="auth.pending_tasks > 0 || auth.overdue_tasks > 0" class="status-pill pending-pill">
                  <i class="pi pi-exclamation-triangle mr-1"></i> Compliance Pending
                </span>
              </div>
            </div>
          </div>

          <!-- Summary Table Card -->
          <div class="card p-4 mb-6">
            <div class="flex justify-between items-center mb-4 ml-1">
              <h3 class="text-lg font-bold text-gray-900 m-0">Authority Performance Table</h3>
              <span class="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                {{ stats?.ccoMetrics?.authorityReports?.length || 0 }} Authorities Registered
              </span>
            </div>
            
            <div class="overflow-x-auto w-full">
              <table class="premium-table w-full">
                <thead>
                  <tr>
                    <th style="width: 80px;">Sr. No.</th>
                    <th>Authority</th>
                    <th class="text-center">Total [Tasks]</th>
                    <th class="text-center">Completed [Tasks]</th>
                    <th class="text-center">Pending [Tasks]</th>
                    <th class="text-center">Overdue [Tasks]</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let auth of stats?.ccoMetrics?.authorityReports; let i = index">
                    <td class="text-semibold text-gray-500">{{ i + 1 }}</td>
                    <td>
                      <span class="font-bold text-primary block text-base">{{ auth.name }}</span>
                      <span class="text-xs text-gray-400 font-medium">Total Applicable Circulars: {{ auth.applicable_circulars }}</span>
                    </td>
                    <td class="text-center font-semibold text-gray-800">{{ auth.total_tasks }}</td>
                    <td class="text-center">
                      <span class="table-count-badge bg-green-50 text-green-700">{{ auth.completed_tasks }}</span>
                    </td>
                    <td class="text-center">
                      <span class="table-count-badge bg-orange-50 text-orange-700">{{ auth.pending_tasks }}</span>
                    </td>
                    <td class="text-center">
                      <span class="table-count-badge bg-red-50 text-red-700">{{ auth.overdue_tasks }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ng-container>

        <!-- 2. BRANCH / CO DASHBOARD VIEW -->
        <ng-container *ngIf="role !== 'CCO' && role !== 'ADMIN'">
          <!-- Stats Cards Row -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <!-- Circulars -->
            <div class="stat-card-custom cursor-pointer" routerLink="/circulars">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Circulars</span>
                  <span class="card-value">{{ stats?.circulars || 0 }}</span>
                </div>
                <div class="icon-circle branch-icon">
                  <i class="pi pi-file-pdf text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-indigo-500"></div>
            </div>

            <!-- Tasks -->
            <div class="stat-card-custom cursor-pointer" routerLink="/tasks">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Compliance Tasks</span>
                  <span class="card-value">{{ stats?.tasks || 0 }}</span>
                  <div class="flex gap-2 mt-1">
                    <span class="text-xs text-orange-600 font-semibold">{{ stats?.pendingTasks || 0 }} pending</span>
                    <span class="text-xs text-green-600 font-semibold">{{ stats?.approvedTasks || 0 }} approved</span>
                  </div>
                </div>
                <div class="icon-circle pending-icon">
                  <i class="pi pi-list text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-orange-500"></div>
            </div>

            <!-- Assignments -->
            <div class="stat-card-custom cursor-pointer" routerLink="/assignments">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Assignments</span>
                  <span class="card-value">{{ stats?.assignments?.total || 0 }}</span>
                  <div class="flex gap-2 mt-1">
                    <span class="text-xs text-blue-600 font-semibold">{{ stats?.assignments?.inProgress || 0 }} active</span>
                    <span class="text-xs text-green-600 font-semibold">{{ stats?.assignments?.completed || 0 }} done</span>
                  </div>
                </div>
                <div class="icon-circle ho-icon">
                  <i class="pi pi-briefcase text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-purple-500"></div>
            </div>

            <!-- Review Pending -->
            <div class="stat-card-custom cursor-pointer" routerLink="/review" *ngIf="role === 'CO'">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Awaiting Review</span>
                  <span class="card-value" [class.text-orange-600]="(stats?.assignments?.reviewPending || 0) > 0">
                    {{ stats?.assignments?.reviewPending || 0 }}
                  </span>
                </div>
                <div class="icon-circle ho-icon" [ngStyle]="{'background': (stats?.assignments?.reviewPending || 0) > 0 ? '#fff7ed' : '#f1f5f9', 'color': (stats?.assignments?.reviewPending || 0) > 0 ? '#ea580c' : '#94a3b8'}">
                  <i class="pi pi-search text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-orange-400"></div>
            </div>
          </div>

          <!-- Assignment Status Breakdown -->
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            <div class="card text-center p-3" *ngFor="let s of statusCards">
              <p class="text-sm text-gray-500 mb-1 font-semibold">{{ s.label }}</p>
              <p class="text-2xl font-bold m-0" [ngStyle]="{'color': s.color}">{{ s.value }}</p>
            </div>
          </div>

          <!-- Recent Circulars + Recent Assignments -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Recent Circulars -->
            <div class="card p-4">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold m-0">Recent Circulars</h2>
                <a routerLink="/circulars" class="text-primary hover:underline text-sm font-medium">View All →</a>
              </div>
              <div *ngIf="stats?.recentCirculars?.length > 0; else noCirculars">
                <div *ngFor="let c of stats.recentCirculars" class="flex items-start gap-3 py-3 border-b last:border-b-0">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <i class="pi pi-file-pdf text-red-500"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate m-0">{{ c.title }}</p>
                    <p class="text-xs text-gray-500 m-0 mt-1">{{ c.authority_name }} · {{ c.published_date | date:'mediumDate' }}</p>
                  </div>
                </div>
              </div>
              <ng-template #noCirculars>
                <p class="text-gray-400 text-center py-6 m-0">No circulars ingested yet.</p>
              </ng-template>
            </div>

            <!-- Recent Assignments -->
            <div class="card p-4">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold m-0">Recent Assignments</h2>
                <a routerLink="/assignments" class="text-primary hover:underline text-sm font-medium">View All →</a>
              </div>
              <div *ngIf="stats?.recentAssignments?.length > 0; else noAssignments">
                <div *ngFor="let a of stats.recentAssignments" class="flex items-center gap-3 py-3 border-b last:border-b-0">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                       [ngClass]="{
                         'bg-green-50': a.status === 'COMPLETED',
                         'bg-blue-50': a.status === 'In_Progress',
                         'bg-yellow-50': a.status === 'Pending_Timeline',
                         'bg-orange-50': a.status === 'REVIEW_PENDING' || a.status === 'Timeline_Review',
                         'bg-red-50': a.status === 'REJECTED'
                       }">
                    <i class="pi pi-briefcase"
                       [ngClass]="{
                         'text-green-500': a.status === 'COMPLETED',
                         'text-blue-500': a.status === 'In_Progress',
                         'text-yellow-500': a.status === 'Pending_Timeline',
                         'text-orange-500': a.status === 'REVIEW_PENDING' || a.status === 'Timeline_Review',
                         'text-red-500': a.status === 'REJECTED'
                       }"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate m-0">{{ a.task_set_name }}</p>
                    <p class="text-xs text-gray-500 m-0 mt-1">{{ a.branch_name }}</p>
                  </div>
                  <span class="text-xs px-2 py-1 rounded-full font-bold flex-shrink-0"
                        [ngClass]="{
                          'bg-green-100 text-green-800': a.status === 'COMPLETED',
                          'bg-blue-100 text-blue-800': a.status === 'In_Progress',
                          'bg-yellow-100 text-yellow-800': a.status === 'Pending_Timeline',
                          'bg-orange-100 text-orange-800': a.status === 'Timeline_Review',
                          'bg-purple-100 text-purple-800': a.status === 'REVIEW_PENDING',
                          'bg-red-100 text-red-800': a.status === 'REJECTED'
                        }">
                    {{ a.status }}
                  </span>
                </div>
              </div>
              <ng-template #noAssignments>
                <p class="text-gray-400 text-center py-6 m-0">No assignments created yet.</p>
              </ng-template>
            </div>
          </div>
        </ng-container>

      </ng-container>
    </app-page>
  `,
  styles: [`
    .stat-card-custom {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s ease;
      min-height: 7.5rem;
    }
    .stat-card-custom:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    }
    .card-label {
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-value {
      color: #0f172a;
      font-size: 2.25rem;
      font-weight: 700;
      line-height: 1;
      margin-top: 0.5rem;
    }
    .icon-circle {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s ease;
    }
    .card-progress {
      width: 100%;
      height: 4px;
      position: absolute;
      bottom: 0;
      left: 0;
    }
    
    /* Themes */
    .branch-icon { background: #eef2ff; color: #4f46e5; }
    .ho-icon { background: #faf5ff; color: #9333ea; }
    .pending-icon { background: #fff7ed; color: #ea580c; }
    .overdue-icon { background: #fef2f2; color: #dc2626; }
    
    /* Authority Cards */
    .authority-card {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transition: all 0.25s ease;
      background: #ffffff;
    }
    .authority-card:hover {
      box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.08);
      border-color: #cbd5e1;
    }
    .auth-card-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 1.25rem;
    }
    .auth-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
    }
    .auth-id-badge {
      font-size: 0.75rem;
      font-weight: 700;
      background: #e2e8f0;
      color: #475569;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }
    .auth-stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
    }
    .badge {
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
    }
    .badge-indigo { background: #e0e7ff; color: #4338ca; }
    .badge-orange { background: #ffedd5; color: #c2410c; }
    .badge-red { background: #fee2e2; color: #b91c1c; }
    .penalty-amount {
      font-size: 1.05rem;
    }
    .status-pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
    }
    .completed-pill { background: #dcfce7; color: #15803d; }
    .pending-pill { background: #fee2e2; color: #b91c1c; }
    
    /* Table styling */
    .premium-table {
      border-collapse: collapse;
      margin: 0.5rem 0;
    }
    .premium-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 1rem 1.25rem;
      border-bottom: 2px solid #e2e8f0;
    }
    .premium-table td {
      padding: 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .premium-table tbody tr:hover {
      background-color: #faf5ff;
    }
    .table-count-badge {
      display: inline-block;
      min-width: 2.25rem;
      padding: 0.35rem 0.5rem;
      border-radius: 8px;
      font-weight: 700;
      text-align: center;
      font-size: 0.9rem;
    }
    .block {
      display: block;
    }
    .text-base {
      font-size: 1rem;
    }
    .border-left-3 {
      border-left-width: 4px !important;
      border-left-style: solid !important;
    }
    .border-b {
      border-bottom: 1px solid #e5e7eb;
    }
    .border-t {
      border-top: 1px solid #e5e7eb;
    }
    .w-full {
      width: 100%;
    }
    .text-center {
      text-align: center;
    }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .ml-1 { margin-left: 0.25rem; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .text-primary { color: var(--primary-color, #3F51B5); }
    .text-gray-900 { color: #111827; }
    .text-gray-700 { color: #374151; }
    .text-gray-500 { color: #6b7280; }
    .flex-column {
      display: flex;
      flex-direction: column;
    }
    .w-20rem {
      width: 20rem;
    }
    .min-h-20rem {
      min-height: 20rem;
    }
  `]
})
export class Dashboard implements OnInit {
  stats: any = null;
  statusCards: { label: string; value: number; color: string }[] = [];
  loading = signal<boolean>(true);

  constructor(
    private api: ComplianceApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get role(): string {
    return this.auth.currentUser()?.role || '';
  }

  ngOnInit() {
    this.loading.set(true);
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.statusCards = [
          { label: 'Pending Timeline', value: data.assignments.pendingTimeline, color: '#eab308' },
          { label: 'Timeline Review', value: data.assignments.timelineReview, color: '#f97316' },
          { label: 'In Progress', value: data.assignments.inProgress, color: '#3b82f6' },
          { label: 'Review Pending', value: data.assignments.reviewPending, color: '#a855f7' },
          { label: 'Completed', value: data.assignments.completed, color: '#22c55e' },
        ];
        if (this.role === 'CCO' || this.role === 'ADMIN') {
          this.statusCards.push({ label: 'Escalated', value: data.assignments.escalated, color: '#ef4444' });
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching dashboard stats:', err);
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
