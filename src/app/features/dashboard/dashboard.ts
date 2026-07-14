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
      [title]="role === 'ADMIN' ? 'Admin Dashboard' : (role === 'CCO' ? 'Compliance Dashboard' : (role === 'CO' ? 'CO Dashboard' : 'Branch Dashboard'))" 
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
        
        <!-- 1. CCO DASHBOARD VIEW -->
        <ng-container *ngIf="role === 'CCO'">
          
          <!-- CCO Stats Cards Row -->
          <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <!-- Total Branches -->
            <div class="stat-card-custom cursor-pointer" routerLink="/admin/branches">
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
            <div class="stat-card-custom cursor-pointer" routerLink="/admin/branches">
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
            <div class="stat-card-custom cursor-pointer" routerLink="/cco-review">
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
            <div class="stat-card-custom cursor-pointer" routerLink="/reports">
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
          <div class="mb-4">
            <h2 class="text-xl font-bold text-gray-900 m-0">Authority Wise Short Report</h2>
            <p class="text-gray-500 text-sm m-0 mt-1">Overview of Total Circulars, Pending Actions, Overdue Tasks, and Penalties.</p>
          </div>

          <!-- Authority Cards Grid -->
          <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
            <div class="authority-card overflow-hidden cursor-pointer" *ngFor="let auth of stats?.ccoMetrics?.authorityReports" routerLink="/admin/authorities">
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
                    <span class="text-sm font-semibold">Circulars</span>
                  </div>
                  <span class="text-sm font-bold text-indigo-700">{{ auth.applicable_circulars }}</span>
                </div>
                
                <div class="auth-stat-row">
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="pi pi-check-circle text-green-500"></i>
                    <span class="text-sm font-semibold">Completed Tasks</span>
                  </div>
                  <span class="text-sm font-bold text-green-700">{{ auth.completed_tasks }} / {{ auth.total_tasks }}</span>
                </div>
                
                <div class="auth-stat-row">
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="pi pi-exclamation-circle text-orange-500"></i>
                    <span class="text-sm font-semibold">Pending / Overdue</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="table-count-badge bg-orange-50 text-orange-700">{{ auth.pending_tasks }}</span>
                    <span class="table-count-badge bg-red-50 text-red-700">{{ auth.overdue_tasks }}</span>
                  </div>
                </div>

                <div class="auth-stat-row border-t pt-2" style="border-top: 1px solid #f1f5f9; margin-top: 0.25rem;">
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="pi pi-dollar text-red-500"></i>
                    <span class="text-sm font-semibold">Penalties</span>
                  </div>
                  <span class="text-sm font-extrabold text-red-600">₹{{ auth.total_penalty | number }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Authority Performance Table Header -->
          <div class="mb-3">
            <div class="flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center;">
              <h3 class="text-lg font-bold text-gray-900 m-0">Authority Performance Table</h3>
              <span class="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                {{ stats?.ccoMetrics?.authorityReports?.length || 0 }} Authorities Registered
              </span>
            </div>
          </div>
          
          <div class="card p-4 mb-6">
            
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

        <!-- 2. ADMIN DASHBOARD VIEW -->
        <ng-container *ngIf="role === 'ADMIN'">
          <!-- Admin Stats Cards Row -->
          <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <!-- Circulars -->
            <div class="stat-card-custom cursor-pointer" routerLink="/circulars">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Circulars Master</span>
                  <span class="card-value">{{ stats?.circulars || 0 }}</span>
                  <span class="text-xs text-gray-500 font-medium mt-1">Ingested circular pdfs</span>
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
                  <span class="text-xs text-gray-500 font-medium mt-1">Total operational tasks</span>
                </div>
                <div class="icon-circle pending-icon">
                  <i class="pi pi-check-square text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-orange-500"></div>
            </div>

            <!-- Task Sets -->
            <div class="stat-card-custom cursor-pointer" routerLink="/task-sets">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Task Sets</span>
                  <span class="card-value">{{ stats?.taskSets || 0 }}</span>
                  <span class="text-xs text-gray-500 font-medium mt-1">Grouped checklist templates</span>
                </div>
                <div class="icon-circle ho-icon">
                  <i class="pi pi-server text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-purple-500"></div>
            </div>

            <!-- Registered Units -->
            <div class="stat-card-custom cursor-pointer" routerLink="/admin/branches">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Registered Units</span>
                  <span class="card-value">{{ stats?.branches || 0 }}</span>
                  <span class="text-xs text-gray-500 font-medium mt-1">Branches: {{ stats?.ccoMetrics?.totalBranches ?? 0 }} | HO: {{ stats?.ccoMetrics?.totalHeadOffice ?? 0 }}</span>
                </div>
                <div class="icon-circle overdue-icon" style="background: #ecfdf5; color: #10b981;">
                  <i class="pi pi-sitemap text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-emerald-500"></div>
            </div>
          </div>

          <!-- Bottom: Admin Panels Headers -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem; margin-bottom: 0.75rem;">
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-bold text-gray-900 m-0">Master Configuration</h2>
            </div>
            <div class="flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center;">
              <h2 class="text-lg font-bold text-gray-900 m-0">Recent Ingestions</h2>
              <a routerLink="/circulars" class="text-primary hover:underline text-sm font-medium">View All →</a>
            </div>
          </div>

          <!-- Bottom: Admin Panels Content -->
          <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
            <!-- Master Directory Links -->
            <div class="card p-4">
              <div class="flex flex-column gap-3">
                <!-- User Accounts -->
                <div class="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200" 
                     routerLink="/admin/users"
                     style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 0.75rem; background: #ffffff; cursor: pointer;">
                  <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 2.25rem; height: 2.25rem; border-radius: 8px; background-color: #eff6ff; display: flex; align-items: center; justify-content: center;">
                      <i class="pi pi-users" style="color: #3b82f6; font-size: 1.1rem;"></i>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900 m-0" style="margin: 0;">User Accounts</p>
                      <p class="text-xs text-gray-500 m-0" style="margin: 0; margin-top: 0.15rem;">Manage platform users, roles and credentials</p>
                    </div>
                  </div>
                  <i class="pi pi-chevron-right text-gray-400"></i>
                </div>

                <!-- Authorities -->
                <div class="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200" 
                     routerLink="/admin/authorities"
                     style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 0.75rem; background: #ffffff; cursor: pointer;">
                  <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 2.25rem; height: 2.25rem; border-radius: 8px; background-color: #ecfdf5; display: flex; align-items: center; justify-content: center;">
                      <i class="pi pi-shield" style="color: #10b981; font-size: 1.1rem;"></i>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900 m-0" style="margin: 0;">Compliance Authorities</p>
                      <p class="text-xs text-gray-500 m-0" style="margin: 0; margin-top: 0.15rem;">Manage regulatory bodies and penalties</p>
                    </div>
                  </div>
                  <i class="pi pi-chevron-right text-gray-400"></i>
                </div>

                <!-- Task Headers -->
                <div class="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200" 
                     routerLink="/admin/task-headers"
                     style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 0.75rem; background: #ffffff; cursor: pointer;">
                  <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 2.25rem; height: 2.25rem; border-radius: 8px; background-color: #fdf2f8; display: flex; align-items: center; justify-content: center;">
                      <i class="pi pi-tags" style="color: #ec4899; font-size: 1.1rem;"></i>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900 m-0" style="margin: 0;">Task Tag Headers</p>
                      <p class="text-xs text-gray-500 m-0" style="margin: 0; margin-top: 0.15rem;">Manage tagging categories and headers</p>
                    </div>
                  </div>
                  <i class="pi pi-chevron-right text-gray-400"></i>
                </div>

                <!-- Branch Mapping & COs -->
                <div class="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200" 
                     routerLink="/admin/branches"
                     style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; cursor: pointer;">
                  <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 2.25rem; height: 2.25rem; border-radius: 8px; background-color: #fff7ed; display: flex; align-items: center; justify-content: center;">
                      <i class="pi pi-sitemap" style="color: #f97316; font-size: 1.1rem;"></i>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900 m-0" style="margin: 0;">Branch / Department Master</p>
                      <p class="text-xs text-gray-500 m-0" style="margin: 0; margin-top: 0.15rem;">Configure branches, departments and mapped COs</p>
                    </div>
                  </div>
                  <i class="pi pi-chevron-right text-gray-400"></i>
                </div>
              </div>
            </div>

            <!-- Recent Ingestions -->
            <div class="card p-4">
              <div *ngIf="stats?.recentCirculars?.length > 0; else noRecentIngestions">
                <div *ngFor="let c of stats.recentCirculars" class="flex items-start gap-3 py-3 border-b last:border-b-0" style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;">
                  <div class="flex-shrink-0" style="width: 2.5rem; height: 2.5rem; border-radius: 8px; background-color: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="pi pi-file-pdf" style="color: #ef4444; font-size: 1.25rem;"></i>
                  </div>
                  <div class="flex-1 min-w-0" style="flex: 1; min-width: 0;">
                    <p class="text-sm font-semibold text-gray-900 m-0" style="margin: 0; font-size: 0.9rem; font-weight: 600; color: #1e293b; white-space: normal; line-height: 1.4;">{{ c.title }}</p>
                    <p class="text-xs text-gray-500 m-0 mt-1" style="margin: 0; margin-top: 0.25rem; font-size: 0.75rem; color: #64748b;">{{ c.authority_name }} · {{ c.published_date | date:'mediumDate' }}</p>
                  </div>
                </div>
              </div>
              <ng-template #noRecentIngestions>
                <p class="text-gray-400 text-center py-6 m-0">No recent circulars ingested.</p>
              </ng-template>
            </div>
          </div>
        </ng-container>

        <!-- 2. CO DASHBOARD VIEW -->
        <ng-container *ngIf="role === 'CO'">
          
          <!-- CO Stats Cards Row -->
          <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <!-- Mapped Branches -->
            <div class="stat-card-custom cursor-pointer" [routerLink]="['/home']" fragment="branch-performance">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Mapped Units</span>
                  <span class="card-value">{{ (stats?.coMetrics?.totalBranches ?? 0) + (stats?.coMetrics?.totalHeadOffice ?? 0) }}</span>
                  <span class="text-xs text-gray-500 font-medium mt-1">Branches: {{ stats?.coMetrics?.totalBranches ?? 0 }} | HO: {{ stats?.coMetrics?.totalHeadOffice ?? 0 }}</span>
                </div>
                <div class="icon-circle branch-icon">
                  <i class="pi pi-sitemap text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-indigo-500"></div>
            </div>

            <!-- Timeline Reviews -->
            <div class="stat-card-custom cursor-pointer" routerLink="/assignments">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Timeline Reviews</span>
                  <span class="card-value" [class.text-orange-600]="(stats?.assignments?.timelineReview ?? 0) > 0">
                    {{ stats?.assignments?.timelineReview ?? 0 }}
                  </span>
                  <span class="text-xs text-gray-500 font-medium mt-1">Awaiting timeline approval</span>
                </div>
                <div class="icon-circle pending-icon" [ngStyle]="{'background': (stats?.assignments?.timelineReview ?? 0) > 0 ? '#fff7ed' : '#f1f5f9', 'color': (stats?.assignments?.timelineReview ?? 0) > 0 ? '#ea580c' : '#94a3b8'}">
                  <i class="pi pi-calendar-times text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-amber-500"></div>
            </div>

            <!-- Compliance Reviews -->
            <div class="stat-card-custom cursor-pointer" routerLink="/co-review">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Checklist Reviews</span>
                  <span class="card-value" [class.text-purple-600]="(stats?.assignments?.reviewPending ?? 0) > 0">
                    {{ stats?.assignments?.reviewPending ?? 0 }}
                  </span>
                  <span class="text-xs text-gray-500 font-medium mt-1">Awaiting CCO/CO audit review</span>
                </div>
                <div class="icon-circle ho-icon" [ngStyle]="{'background': (stats?.assignments?.reviewPending ?? 0) > 0 ? '#faf5ff' : '#f1f5f9', 'color': (stats?.assignments?.reviewPending ?? 0) > 0 ? '#9333ea' : '#94a3b8'}">
                  <i class="pi pi-search text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-purple-500"></div>
            </div>

            <!-- Overdue Compliance -->
            <div class="stat-card-custom cursor-pointer" routerLink="/co-review">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-column">
                  <span class="card-label">Overdue Tasks</span>
                  <span class="card-value" [class.text-red-600]="(stats?.coMetrics?.totalOverdue ?? 0) > 0">
                    {{ stats?.coMetrics?.totalOverdue ?? 0 }}
                  </span>
                  <span class="text-xs text-gray-500 font-medium mt-1">Pending past target due dates</span>
                </div>
                <div class="icon-circle overdue-icon" [ngStyle]="{'background': (stats?.coMetrics?.totalOverdue ?? 0) > 0 ? '#fef2f2' : '#f1f5f9', 'color': (stats?.coMetrics?.totalOverdue ?? 0) > 0 ? '#dc2626' : '#94a3b8'}">
                  <i class="pi pi-clock text-2xl"></i>
                </div>
              </div>
              <div class="card-progress bg-red-500"></div>
            </div>
          </div>

          <!-- Awaiting Action Queue -->
          <div class="mb-3" *ngIf="stats?.coMetrics?.awaitingActionQueue?.length > 0">
            <div class="flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 class="text-lg font-bold text-gray-900 m-0">Awaiting Action Queue</h3>
                <p class="text-xs text-gray-500 m-0 mt-0.5">Timelines and compliance submissions waiting for your response.</p>
              </div>
              <span class="text-xs text-orange-600 font-bold bg-orange-50 border border-orange-200 px-3 py-1 rounded-full flex items-center gap-1">
                <i class="pi pi-exclamation-circle"></i> {{ stats?.coMetrics?.awaitingActionQueue?.length }} Items Pending
              </span>
            </div>
          </div>
          
          <div class="card p-4 mb-4" *ngIf="stats?.coMetrics?.awaitingActionQueue?.length > 0">
            <div class="overflow-x-auto w-full">
              <table class="premium-table w-full">
                <thead>
                  <tr>
                    <th>Branch / Dept</th>
                    <th>Task Set Name</th>
                    <th>Timeline Due Date</th>
                    <th>Action Required</th>
                    <th style="width: 120px;" class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of stats?.coMetrics?.awaitingActionQueue">
                    <td class="font-bold text-gray-900">{{ item.branch_name }}</td>
                    <td>{{ item.task_set_name }}</td>
                    <td class="font-semibold text-gray-600">{{ item.proposed_timeline | date:'mediumDate' }}</td>
                    <td>
                      <span class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                            [ngClass]="{
                              'bg-yellow-100 text-yellow-800': item.status === 'Timeline_Review',
                              'bg-purple-100 text-purple-800': item.status === 'REVIEW_PENDING'
                            }">
                        {{ item.status === 'Timeline_Review' ? 'Timeline Review' : 'Compliance Review' }}
                      </span>
                    </td>
                    <td class="text-center">
                      <a [routerLink]="item.status === 'REVIEW_PENDING' ? ['/co-review', item.assignment_id] : ['/assignments']" 
                         class="text-indigo-600 hover:text-indigo-900 font-bold text-sm flex items-center justify-center gap-1 cursor-pointer">
                        <i class="pi pi-chevron-right"></i> Review
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Mapped Branches Performance Summary Table -->
          <div class="mb-3">
            <div class="flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 class="text-lg font-bold text-gray-900 m-0">Branch Performance Overview</h3>
                <p class="text-xs text-gray-500 m-0 mt-0.5">Real-time status of compliance checklists assigned to your mapped branch units.</p>
              </div>
              <span class="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                {{ stats?.coMetrics?.branchReports?.length || 0 }} Mapped Units
              </span>
            </div>
          </div>
          
          <div class="card p-4 mb-4" id="branch-performance">
            <div class="overflow-x-auto w-full">
              <table class="premium-table w-full">
                <thead>
                  <tr>
                    <th style="width: 80px;">Sr. No.</th>
                    <th>Branch / Department</th>
                    <th class="text-center">Total [Assigned]</th>
                    <th class="text-center">Active [In Progress]</th>
                    <th class="text-center">Awaiting Review</th>
                    <th class="text-center">Completed</th>
                    <th class="text-center">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let br of stats?.coMetrics?.branchReports; let i = index">
                    <td class="text-semibold text-gray-500">{{ i + 1 }}</td>
                    <td>
                      <span class="font-bold text-primary block text-base">{{ br.name }}</span>
                      <span class="text-xs text-gray-400 font-medium uppercase">{{ br.type }}</span>
                    </td>
                    <td class="text-center font-semibold text-gray-800">{{ br.total_assignments }}</td>
                    <td class="text-center">
                      <span class="table-count-badge bg-blue-50 text-blue-700">{{ br.active_assignments }}</span>
                    </td>
                    <td class="text-center">
                      <span class="table-count-badge bg-purple-50 text-purple-700">{{ br.review_pending_assignments }}</span>
                    </td>
                    <td class="text-center">
                      <span class="table-count-badge bg-green-50 text-green-700">{{ br.completed_assignments }}</span>
                    </td>
                    <td class="text-center">
                      <span class="table-count-badge bg-red-50 text-red-700" [class.font-bold]="br.overdue_assignments > 0">{{ br.overdue_assignments }}</span>
                    </td>
                  </tr>
                  <tr *ngIf="stats?.coMetrics?.branchReports?.length === 0">
                    <td colspan="7" class="text-center py-6 text-gray-400 font-medium">No mapped branches/departments assigned to you yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Bottom: Recent Circulars -->
          <div class="mb-3">
            <div class="flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center;">
              <h2 class="text-lg font-bold text-gray-900 m-0">Recent Regulatory Circulars</h2>
              <a routerLink="/circulars" class="text-primary hover:underline text-sm font-medium">View All →</a>
            </div>
          </div>
          
          <div class="card p-4 mb-4">
            <div *ngIf="stats?.recentCirculars?.length > 0; else noCircularsCO">
              <div *ngFor="let c of stats.recentCirculars" class="flex items-start gap-3 py-3 border-b last:border-b-0" style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;">
                <div class="flex-shrink-0" style="width: 2.5rem; height: 2.5rem; border-radius: 8px; background-color: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <i class="pi pi-file-pdf" style="color: #ef4444; font-size: 1.25rem;"></i>
                </div>
                <div class="flex-1 min-w-0" style="flex: 1; min-width: 0;">
                  <p class="text-sm font-semibold text-gray-900 m-0" style="margin: 0; font-size: 0.9rem; font-weight: 600; color: #1e293b; white-space: normal; line-height: 1.4;">{{ c.title }}</p>
                  <p class="text-xs text-gray-500 m-0 mt-1" style="margin: 0; margin-top: 0.25rem; font-size: 0.75rem; color: #64748b;">{{ c.authority_name }} · {{ c.published_date | date:'mediumDate' }}</p>
                </div>
              </div>
            </div>
            <ng-template #noCircularsCO>
              <p class="text-gray-400 text-center py-6 m-0">No circulars ingested yet.</p>
            </ng-template>
          </div>
        </ng-container>

        <!-- 3. BRANCH DASHBOARD VIEW -->
        <ng-container *ngIf="role !== 'CCO' && role !== 'ADMIN' && role !== 'CO'">
          <!-- Stats Cards Row -->
          <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 360px)); gap: 1.5rem; margin-bottom: 2rem;">
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
          </div>

          <!-- Assignment Status Breakdown -->
          <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="card text-center p-3 cursor-pointer card-status-hover" *ngFor="let s of statusCards" 
                 routerLink="/assignments"
                 style="margin: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); cursor: pointer;"
                 [ngStyle]="{'border-top': '4px solid ' + s.color}">
              <p class="text-sm text-gray-500 mb-2 font-semibold" style="margin: 0; margin-bottom: 0.5rem; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">{{ s.label }}</p>
              <p class="text-2xl font-bold m-0" [ngStyle]="{'color': s.color}" style="margin: 0; font-size: 1.5rem; line-height: 1;">{{ s.value }}</p>
            </div>
          </div>

          <!-- Recent Assignments -->
          <div class="mb-3">
            <div class="flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center;">
              <h2 class="text-lg font-bold text-gray-900 m-0">Recent Assignments</h2>
              <a routerLink="/assignments" class="text-primary hover:underline text-sm font-medium">View All →</a>
            </div>
          </div>
          
          <div class="card p-4">
            <div *ngIf="stats?.recentAssignments?.length > 0; else noAssignments">
              <div *ngFor="let a of stats.recentAssignments" class="flex items-center gap-3 py-3 border-b last:border-b-0" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;">
                <div class="flex-shrink-0" style="width: 2.5rem; height: 2.5rem; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
                     [ngStyle]="{
                       'background-color': a.status === 'COMPLETED' ? '#dcfce7' : 
                                          (a.status === 'In_Progress' ? '#dbeafe' : 
                                          (a.status === 'Pending_Timeline' ? '#fef9c3' : 
                                          (a.status === 'REJECTED' ? '#fee2e2' : '#f3e8ff')))
                     }">
                  <i class="pi pi-briefcase"
                     [ngStyle]="{
                       'color': a.status === 'COMPLETED' ? '#15803d' : 
                               (a.status === 'In_Progress' ? '#1d4ed8' : 
                               (a.status === 'Pending_Timeline' ? '#a16207' : 
                               (a.status === 'REJECTED' ? '#b91c1c' : '#6b21a8')))
                     }"></i>
                </div>
                <div class="flex-1 min-w-0" style="flex: 1; min-width: 0;">
                  <p class="text-sm font-semibold text-gray-900 m-0" style="margin: 0; font-size: 0.9rem; font-weight: 600; color: #1e293b; white-space: normal; line-height: 1.4;">{{ a.task_set_name }}</p>
                  <p class="text-xs text-gray-500 m-0 mt-1" style="margin: 0; margin-top: 0.25rem; font-size: 0.75rem; color: #64748b;">{{ a.branch_name }}</p>
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
    .card-status-hover {
      transition: all 0.22s ease-in-out;
    }
    .card-status-hover:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 16px -3px rgba(0, 0, 0, 0.08) !important;
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
      transform: translateY(-3px);
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
