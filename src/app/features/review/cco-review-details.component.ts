import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ComplianceApiService } from "../../core/services/api/compliance-api.service";
import { NotificationService } from "../../core/services/notification/notification.service";

@Component({
  selector: "app-cco-review-details",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./cco-review-details.component.html",
  styleUrls: ["./cco-review-details.component.css"]
})
export class CcoReviewDetailsComponent implements OnInit {
  assignmentId: number | null = null;
  tasks = signal<any[]>([]);
  taskGroups = signal<{ headerName: string; tasks: any[] }[]>([]);
  overallRemark = "";
  submitting = false;
  lastAction: string = "";
  savingTaskId = signal<number | null>(null);

  assignmentMeta = computed(() => this.tasks()[0] ?? null);
  compliedCount = computed(() => this.tasks().filter(t => t.compliance_status === "COMPLIED").length);
  notCompliedCount = computed(() => this.tasks().filter(t => t.compliance_status === "NOT_COMPLIED").length);
  approvedCount = computed(() => this.tasks().filter(t => t.review_status === "APPROVED").length);
  needsRedoCount = computed(() => this.tasks().filter(t => t.review_status === "NEEDS_REDO").length);
  unreviewedCount = computed(() => this.tasks().filter(t => !t.review_status).length);

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
        const enriched = data.map(t => ({
          ...t,
          review_status: t.review_status || null,
          review_remark: t.review_remark || "",
          evidence_url: t.evidence_url ? this.api.getFileUrl(t.evidence_url) : null
        }));
        this.tasks.set(enriched);
        this.groupTasks(enriched);
      },
      error: (err) => this.notification.error("Failed to load tasks: " + (err.message || err.statusText))
    });
  }

  groupTasks(tasks: any[]) {
    const groupsMap = new Map<string, any[]>();
    for (const t of tasks) {
      const key = t.header_name || "General Task";
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(t);
    }
    this.taskGroups.set(Array.from(groupsMap.entries()).map(([headerName, tasks]) => ({ headerName, tasks })));
  }

  setTaskReviewStatus(task: any, status: "APPROVED" | "NEEDS_REDO") {
    if (!this.assignmentId) return;
    const newStatus = task.review_status === status ? null : status;
    this.savingTaskId.set(task.assignment_task_id);
    if (newStatus === null) {
      this.tasks.update(ts => ts.map(t => t.assignment_task_id === task.assignment_task_id ? { ...t, review_status: null, review_remark: "" } : t));
      this.groupTasks(this.tasks());
      setTimeout(() => this.savingTaskId.set(null));
      return;
    }
    this.api.reviewTaskStatus(this.assignmentId, task.assignment_task_id, newStatus, task.review_remark).subscribe({
      next: () => {
        this.tasks.update(ts => ts.map(t => t.assignment_task_id === task.assignment_task_id ? { ...t, review_status: newStatus } : t));
        this.groupTasks(this.tasks());
        this.savingTaskId.set(null);
      },
      error: () => { this.savingTaskId.set(null); this.notification.error("Failed to update task review status."); }
    });
  }

  saveCoRemark(task: any) {
    if (!this.assignmentId || task.review_status !== "NEEDS_REDO") return;
    this.api.reviewTaskStatus(this.assignmentId, task.assignment_task_id, "NEEDS_REDO", task.review_remark).subscribe({ error: () => this.notification.error("Failed to save CO remark.") });
  }

  markAllApproved() { this.tasks().forEach(t => { if (t.review_status !== "APPROVED") this.setTaskReviewStatus(t, "APPROVED"); }); }
  markAllNeedsRedo() { this.tasks().forEach(t => { if (t.review_status !== "NEEDS_REDO") this.setTaskReviewStatus(t, "NEEDS_REDO"); }); }

  submitReview(action: "ACCEPT" | "REJECT" | "ESCALATE") {
    if (!this.assignmentId) return;
    if ((action === "REJECT" || action === "ESCALATE") && !this.overallRemark.trim()) {
      this.notification.warn("Please provide an overall remark explaining the " + (action === "REJECT" ? "rejection." : "escalation."));
      return;
    }
    this.submitting = true;
    this.lastAction = action;
    this.api.reviewAssignment(this.assignmentId, action, this.overallRemark).subscribe({
      next: () => {
        this.submitting = false;
        if (action === "ACCEPT") this.notification.success("Assignment accepted and marked as Completed!");
        if (action === "REJECT") this.notification.warn("Assignment rejected. Branch will be notified for re-compliance.");
        if (action === "ESCALATE") this.notification.info("Assignment escalated to CCO for final review.");
        this.goBack();
      },
      error: (err) => { this.submitting = false; this.notification.error("Failed to submit review: " + (err.message || err.statusText)); }
    });
  }

  goBack() { this.router.navigate(["/cco-review"]); }
}

