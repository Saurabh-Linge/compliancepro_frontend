import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ComplianceApiService } from "../../core/services/api/compliance-api.service";
import { NotificationService } from "../../core/services/notification/notification.service";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { DialogModule } from "primeng/dialog";

@Component({
  selector: "app-co-review-details",
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, Textarea, TooltipModule, DialogModule],
  templateUrl: "./co-review-details.component.html",
  styleUrls: ["../../shared/styles/checklist-shared.css", "./co-review-details.component.css"]
})
export class CoReviewDetailsComponent implements OnInit {
  displayRemarkChainDialog = false;
  selectedTaskForChain: any = null;

  openRemarkChainDialog(task: any) {
    this.selectedTaskForChain = task;
    this.displayRemarkChainDialog = true;
  }

  closeRemarkChainDialog() {
    this.displayRemarkChainDialog = false;
    this.selectedTaskForChain = null;
  }

  assignmentId: number | null = null;
  tasks = signal<any[]>([]);
  taskGroups = signal<{ headerName: string; tasks: any[] }[]>([]);
  overallRemark = "";
  submitting = false;
  lastAction: string = "";
  savingTaskId = signal<number | null>(null);
  pendingStatus: string = ""; // tracks which button triggered the loading spinner
  activeFilter = signal<string>(""); // APPROVED | NEEDS_REDO | UNREVIEWED | ''

  assignmentMeta = computed(() => this.tasks()[0] ?? null);
  compliedCount = computed(() => this.tasks().filter(t => t.compliance_status === "COMPLIED").length);
  notCompliedCount = computed(() => this.tasks().filter(t => t.compliance_status === "NOT_COMPLIED").length);
  approvedCount = computed(() => this.tasks().filter(t => t.review_status === "APPROVED").length);
  needsRedoCount = computed(() => this.tasks().filter(t => t.review_status === "NEEDS_REDO").length);
  unreviewedCount = computed(() => this.tasks().filter(t => !t.review_status).length);

  isReviewActive(): boolean {
    const status = this.assignmentMeta()?.assignment_status?.toUpperCase();
    return status === 'REVIEW_PENDING' || status === 'TIMELINE_REVIEW';
  }

  getFormattedStatus(): string {
    const status = this.assignmentMeta()?.assignment_status;
    if (!status) return '—';
    return status.replace(/_/g, ' ').toUpperCase();
  }

  getStatusSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const status = this.assignmentMeta()?.assignment_status;
    switch (status) {
      case 'Pending_Timeline':
      case 'Timeline_Review':
        return 'info';
      case 'In_Progress':
      case 'PENDING_RECOMPLIANCE':
        return 'secondary';
      case 'REVIEW_PENDING':
      case 'ESCALATED_TO_CCO':
        return 'warn';
      case 'COMPLETED':
        return 'success';
      case 'REJECTED':
      case 'Overdue':
      case 'OVERDUE':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  // Filtered view for decision-summary and header chip clicks
  filteredTaskGroups = computed(() => {
    const filter = this.activeFilter();
    if (!filter) return this.taskGroups();
    return this.taskGroups().map(g => ({
      ...g,
      tasks: g.tasks.filter(t => {
        if (filter === 'COMPLIED')     return t.compliance_status === 'COMPLIED';
        if (filter === 'NOT_COMPLIED') return t.compliance_status === 'NOT_COMPLIED';
        if (filter === 'APPROVED')     return t.review_status === 'APPROVED';
        if (filter === 'NEEDS_REDO')   return t.review_status === 'NEEDS_REDO';
        if (filter === 'UNREVIEWED')   return !t.review_status;
        return true;
      })
    })).filter(g => g.tasks.length > 0);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: ComplianceApiService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get("id");
      if (id) {
        this.assignmentId = parseInt(id, 10);
        this.loadTasks();
      }
    });
  }

  loadTasks() {
    if (!this.assignmentId) return;
    this.api.getAssignmentTasks(this.assignmentId).subscribe({
      next: (data) => {
        const currentTasksMap = new Map<number, any>();
        (this.tasks() || []).forEach(ct => {
          if (ct && ct.assignment_task_id) {
            currentTasksMap.set(ct.assignment_task_id, ct);
          }
        });

        const enriched = data.map(t => {
          const existing = currentTasksMap.get(t.assignment_task_id);

          // Preserve unsaved draft review status if user changed it locally
          let preservedReviewStatus = t.review_status || null;
          if (existing && existing.review_status !== undefined && existing.review_status !== (existing.saved_review_status || null)) {
            preservedReviewStatus = existing.review_status;
          }

          // Preserve unsaved draft review remark if user typed it locally
          let preservedReviewRemark = t.review_remark || "";
          if (existing && existing.review_remark !== undefined) {
            const savedRemark = existing.saved_review_remark || t.review_remark || "";
            if (existing.review_remark !== savedRemark && existing.review_remark !== "") {
              preservedReviewRemark = existing.review_remark;
            }
          }

          return {
            ...t,
            review_status: preservedReviewStatus,
            saved_review_status: t.review_status || null,
            review_remark: preservedReviewRemark,
            saved_review_remark: t.review_remark || "",
            evidence_url: t.evidence_url ? this.api.getFileUrl(t.evidence_url) : null,
            remarks_history: [],
            evidence_history: []
          };
        });

        this.api.getAssignmentEvidence(this.assignmentId!).subscribe({
          next: (evidenceList) => {
            enriched.forEach(task => {
              const evidences = evidenceList.filter(e => e.assignment_task_id === task.assignment_task_id || e.task_id === task.task_id);
              task.evidence_history = evidences.map(e => ({
                ...e,
                file_url: this.api.getFileUrl(e.file_url)
              }));
              if (task.evidence_history.length > 0 && !task.evidence_url) {
                task.evidence_url = task.evidence_history[0].file_url;
                task.has_evidence = true;
              }
            });

            let completedCount = 0;
            if (enriched.length === 0) {
              this.tasks.set(enriched);
              this.groupTasks(enriched);
              return;
            }

            enriched.forEach(task => {
              this.api.getTaskRemarksHistory(this.assignmentId!, task.assignment_task_id).subscribe({
                next: (history) => {
                  const historyList = history || [];
                  const reviewRemarkText = task.assignment_review_remark || task.review_remark;
                  if (reviewRemarkText && reviewRemarkText.trim()) {
                    const exists = historyList.some((h: any) => h.remark.includes(reviewRemarkText) || reviewRemarkText.includes(h.remark));
                    if (!exists) {
                      historyList.push({
                        role: 'CO',
                        username: 'CO Reviewer',
                        remark: reviewRemarkText.toLowerCase().includes('re-compliance') ? reviewRemarkText : `[Re-compliance Requested] ${reviewRemarkText}`,
                        created_at: task.reviewed_at || new Date().toISOString()
                      });
                    }
                  }
                  task.remarks_history = historyList;
                  completedCount++;
                  if (completedCount === enriched.length) {
                    this.tasks.set(enriched);
                    this.groupTasks(enriched);
                  }
                },
                error: (err) => {
                  console.error("Failed to load remarks history for task:", task.assignment_task_id, err);
                  completedCount++;
                  if (completedCount === enriched.length) {
                    this.tasks.set(enriched);
                    this.groupTasks(enriched);
                  }
                }
              });
            });
          },
          error: (err) => {
            console.error("Failed to load evidence list:", err);
            this.tasks.set(enriched);
            this.groupTasks(enriched);
          }
        });
      },
      error: (err) => this.notification.error("Failed to load tasks: " + (err.message || err.statusText))
    });
  }

  groupTasks(tasks: any[]) {
    const filter = this.activeFilter();
    let filteredTasks = tasks;
    if (filter === 'APPROVED') {
      filteredTasks = tasks.filter(t => t.review_status === 'APPROVED');
    } else if (filter === 'NEEDS_REDO') {
      filteredTasks = tasks.filter(t => t.review_status === 'NEEDS_REDO');
    } else if (filter === 'UNREVIEWED') {
      filteredTasks = tasks.filter(t => !t.review_status);
    }

    const groupsMap = new Map<string, any[]>();
    for (const t of filteredTasks) {
      const key = t.header_name || "General Task";
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(t);
    }
    this.taskGroups.set(Array.from(groupsMap.entries()).map(([headerName, tasks]) => ({ headerName, tasks })));
  }

  trackByTaskId(index: number, item: any): number {
    return item?.assignment_task_id || index;
  }

  hasRemarksHistory(task: any): boolean {
    return !!(task.remarks_history && task.remarks_history.length > 0);
  }

  hasEvidenceHistory(task: any): boolean {
    return !!(task.evidence_history && task.evidence_history.length > 0);
  }

  hasReviewerRemarks(task: any): boolean {
    if (!task.remarks_history || task.remarks_history.length === 0) return false;
    return task.remarks_history.some((h: any) => h.role === 'REVIEWER');
  }

  isTaskSavedByDept(task: any): boolean {
    if (!task) return false;
    return task.compliance_status === 'COMPLIED' ||
           task.compliance_status === 'NOT_COMPLIED' ||
           (task.remarks && task.remarks.trim().length > 0) ||
           task.has_evidence ||
           task.status === 'COMPLETED';
  }

  setTaskReviewStatus(task: any, status: "APPROVED" | "NEEDS_REDO" | "ESCALATED") {
    const newStatus = task.review_status === status ? null : status;
    this.tasks.update(ts => ts.map(t => t.assignment_task_id === task.assignment_task_id ? { ...t, review_status: newStatus } : t));
    this.groupTasks(this.tasks());
  }

  saveTaskReview(task: any) {
    if (!this.assignmentId) return;
    if (!task.review_status) {
      this.notification.warn("Please select Accept or Reject before saving.");
      return;
    }
    this.savingTaskId.set(task.assignment_task_id);
    this.api.reviewTaskStatus(this.assignmentId, task.assignment_task_id, task.review_status, task.review_remark).subscribe({
      next: () => {
        this.savingTaskId.set(null);
        this.notification.success("Task review submitted successfully!");
        this.loadTasks();
      },
      error: (err) => {
        this.savingTaskId.set(null);
        this.notification.error("Failed to save task review: " + (err.message || err.statusText));
      }
    });
  }

  openEvidence(url: string) { window.open(url, "_blank"); }

  markAllApproved() {
    if (!this.assignmentId) return;
    this.tasks().forEach(t => { t.review_status = "APPROVED"; });
    this.groupTasks(this.tasks());
    this.submitting = true;
    const obs = this.tasks().map(t => this.api.reviewTaskStatus(this.assignmentId!, t.assignment_task_id, "APPROVED", t.review_remark));
    import('rxjs').then(rxjs => {
      rxjs.forkJoin(obs).subscribe({
        next: () => {
          this.submitting = false;
          this.notification.success("All tasks marked as Accepted!");
          this.loadTasks();
        },
        error: (err) => {
          this.submitting = false;
          this.notification.error("Failed to save tasks: " + (err.message || err.statusText));
        }
      });
    });
  }

  markAllNeedsRedo() {
    if (!this.assignmentId) return;
    this.tasks().forEach(t => { t.review_status = "NEEDS_REDO"; });
    this.groupTasks(this.tasks());
    this.submitting = true;
    const obs = this.tasks().map(t => this.api.reviewTaskStatus(this.assignmentId!, t.assignment_task_id, "NEEDS_REDO", t.review_remark));
    import('rxjs').then(rxjs => {
      rxjs.forkJoin(obs).subscribe({
        next: () => {
          this.submitting = false;
          this.notification.warn("All tasks marked as Rejected!");
          this.loadTasks();
        },
        error: (err) => {
          this.submitting = false;
          this.notification.error("Failed to save tasks: " + (err.message || err.statusText));
        }
      });
    });
  }

  submitReview(action: "ACCEPT" | "REJECT" | "ESCALATE") {
    if (!this.assignmentId) return;

    if (action !== "ESCALATE" && this.unreviewedCount() > 0) {
      this.notification.warn(`Cannot proceed: There are ${this.unreviewedCount()} unreviewed task(s) remaining. Please review all tasks (Accept or Reject) before submitting.`);
      return;
    }

    if (action === "ACCEPT" && this.needsRedoCount() > 0) {
      this.notification.warn("Cannot 'Accept & Complete' when tasks are marked as Rejected. Please click 'Reject & Request Re-compliance' instead.");
      return;
    }

    if (!this.overallRemark || !this.overallRemark.trim()) {
      this.notification.warn("Please provide Overall Review Remarks before submitting.");
      return;
    }
    this.submitting = true;
    this.lastAction = action;
    this.api.reviewAssignment(this.assignmentId, action, this.overallRemark).subscribe({
      next: () => {
        this.submitting = false;
        if (action === "ACCEPT") this.notification.success("Compliance review submitted successfully!");
        if (action === "REJECT") this.notification.warn("Assignment rejected. Department will be notified for re-compliance.");
        if (action === "ESCALATE") this.notification.info("Assignment escalated to CCO for final review.");
        this.goBack();
      },
      error: (err) => { this.submitting = false; this.notification.error("Failed to submit review: " + (err.message || err.statusText)); }
    });
  }

  toggleFilter(status: string) {
    this.activeFilter.set(this.activeFilter() === status ? "" : status);
    this.groupTasks(this.tasks());
  }

  clearFilter() {
    this.activeFilter.set("");
    this.groupTasks(this.tasks());
  }

  goBack() { 
    const type = this.route.snapshot.queryParamMap.get('type');
    this.router.navigate(["/co-review"], { queryParams: type ? { type } : {} }); 
  }

}

