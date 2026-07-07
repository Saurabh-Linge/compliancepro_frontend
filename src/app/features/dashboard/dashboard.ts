import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplianceApiService } from '../../core/services/api/compliance-api.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="animate-fade-in p-4">
      <!-- Header -->
      <div class="glass-panel mb-6">
        <h1 class="text-3xl gradient-text mb-1">{{ role === 'CCO' ? 'CCO Dashboard' : (role === 'CO' ? 'CO Dashboard' : 'Branch Dashboard') }}</h1>
        <p class="text-gray-500">Real-time overview of your compliance operations.</p>
      </div>

      <!-- Stats Cards Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Circulars -->
        <div class="stat-card" routerLink="/circulars" style="cursor:pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 uppercase tracking-wider mb-1">Circulars</p>
              <p class="text-3xl font-bold gradient-text">{{ stats?.circulars || 0 }}</p>
            </div>
            <div class="stat-icon bg-indigo-100 text-indigo-600">
              <i class="pi pi-file-pdf text-2xl"></i>
            </div>
          </div>
        </div>

        <!-- Tasks -->
        <div class="stat-card" routerLink="/tasks" style="cursor:pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 uppercase tracking-wider mb-1">Compliance Tasks</p>
              <p class="text-3xl font-bold gradient-text">{{ stats?.tasks || 0 }}</p>
              <div class="flex gap-2 mt-1">
                <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{{ stats?.pendingTasks || 0 }} pending</span>
                <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{{ stats?.approvedTasks || 0 }} approved</span>
                <span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{{ stats?.rejectedTasks || 0 }} rejected</span>
              </div>
            </div>
            <div class="stat-icon bg-emerald-100 text-emerald-600">
              <i class="pi pi-list text-2xl"></i>
            </div>
          </div>
        </div>

        <!-- Assignments -->
        <div class="stat-card" routerLink="/assignments" style="cursor:pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 uppercase tracking-wider mb-1">Assignments</p>
              <p class="text-3xl font-bold gradient-text">{{ stats?.assignments?.total || 0 }}</p>
              <div class="flex gap-2 mt-1">
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{{ stats?.assignments?.inProgress || 0 }} active</span>
                <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{{ stats?.assignments?.completed || 0 }} done</span>
              </div>
            </div>
            <div class="stat-icon bg-blue-100 text-blue-600">
              <i class="pi pi-briefcase text-2xl"></i>
            </div>
          </div>
        </div>

        <!-- Review Pending / Escalations -->
        <div class="stat-card" routerLink="/review" style="cursor:pointer" *ngIf="role === 'CO' || role === 'CCO'">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 uppercase tracking-wider mb-1">{{ role === 'CCO' ? 'Escalations' : 'Awaiting Review' }}</p>
              <p class="text-3xl font-bold" [ngClass]="((role === 'CCO' ? stats?.assignments?.escalated : stats?.assignments?.reviewPending) || 0) > 0 ? 'text-orange-500' : 'gradient-text'">
                {{ role === 'CCO' ? stats?.assignments?.escalated : stats?.assignments?.reviewPending || 0 }}
              </p>
            </div>
            <div class="stat-icon" [ngClass]="((role === 'CCO' ? stats?.assignments?.escalated : stats?.assignments?.reviewPending) || 0) > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'">
              <i class="pi pi-search text-2xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Assignment Status Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div class="glass-panel text-center" *ngFor="let s of statusCards">
          <p class="text-sm text-gray-500 mb-1">{{ s.label }}</p>
          <p class="text-2xl font-bold" [ngStyle]="{'color': s.color}">{{ s.value }}</p>
        </div>
      </div>

      <!-- Two-column layout: Recent Circulars + Recent Assignments -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Circulars -->
        <div class="glass-panel">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Recent Circulars</h2>
            <a routerLink="/circulars" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View All →</a>
          </div>
          <div *ngIf="stats?.recentCirculars?.length > 0; else noCirculars">
            <div *ngFor="let c of stats.recentCirculars" class="flex items-start gap-3 py-3 border-b last:border-b-0">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <i class="pi pi-file-pdf text-red-500"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ c.title }}</p>
                <p class="text-xs text-gray-500">{{ c.authority_name }} · {{ c.published_date | date:'mediumDate' }}</p>
              </div>
            </div>
          </div>
          <ng-template #noCirculars>
            <p class="text-gray-400 text-center py-6">No circulars ingested yet.</p>
          </ng-template>
        </div>
        
        <!-- Authority Stats for CCO -->
        <div class="glass-panel" *ngIf="role === 'CCO' || role === 'ADMIN'">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Authority-wise Circulars</h2>
          </div>
          <div *ngIf="stats?.authorityStats?.length > 0; else noAuthorityStats">
            <div *ngFor="let a of stats.authorityStats" class="flex items-center gap-3 py-3 border-b last:border-b-0">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ a.name }}</p>
              </div>
              <span class="text-sm font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">{{ a.count }}</span>
            </div>
          </div>
          <ng-template #noAuthorityStats>
            <p class="text-gray-400 text-center py-6">No authority stats available.</p>
          </ng-template>
        </div>

        <!-- Recent Assignments -->
        <div class="glass-panel">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Recent Assignments</h2>
            <a routerLink="/assignments" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View All →</a>
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
                <p class="text-sm font-medium text-gray-900 truncate">{{ a.task_set_name }}</p>
                <p class="text-xs text-gray-500">{{ a.branch_name }}</p>
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
            <p class="text-gray-400 text-center py-6">No assignments created yet.</p>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.06);
      transition: all 0.2s ease;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class Dashboard implements OnInit {
  stats: any = null;
  statusCards: { label: string; value: number; color: string }[] = [];

  constructor(
    private api: ComplianceApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get role(): string {
    return this.auth.currentUser()?.role || '';
  }

  ngOnInit() {
    this.api.getDashboardStats().subscribe(data => {
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
      this.cdr.detectChanges();
    });
  }
}
