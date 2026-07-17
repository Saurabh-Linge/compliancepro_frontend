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
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
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
