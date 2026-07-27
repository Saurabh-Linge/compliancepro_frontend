import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { ReportsService, ReportDefinition, ReportColumnDefinition } from '../services/reports.service';
import { ExportService } from '../../../core/services/export/export.service';
import { DateTimeService } from '../../../core/services/datetime/datetime.service';

@Component({
    selector: 'app-report-viewer',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TagModule, RippleModule, SelectModule],
    templateUrl: './report-viewer.component.html',
    styleUrls: ['./report-viewer.component.scss'],
})
export class ReportViewerComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private reportsService = inject(ReportsService);
    private exportService = inject(ExportService);
    private dateTimeService = inject(DateTimeService);

    reportSlug = signal<string>('');
    definition = signal<ReportDefinition | null>(null);
    filters = signal<Record<string, any>>({});
    rows = signal<any[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);
    reportRunDate = signal<string>('');
    initialDataLoaded = signal<boolean>(false);

    ngOnInit() {
        this.reportRunDate.set(this.dateTimeService.formatDateTimeDisplay(new Date()));
        this.route.paramMap.subscribe(params => {
            const slug = params.get('reportSlug') || '';
            this.reportSlug.set(slug);
            this.loadReportDefinition(slug);
        });
    }

    loadReportDefinition(slug: string) {
        this.loading.set(true);
        this.error.set(null);
        this.initialDataLoaded.set(false);
        this.reportsService.getReportDefinition(slug).subscribe({
            next: (def) => {
                this.definition.set(def);
                // Initialize default filters
                const initialFilters = { ...def.defaultFilters };
                this.filters.set(initialFilters);
                if (['compliance-status-report', 'compliance-report', 'cco-compliance-report', 'compliance-circulars-report'].includes(slug)) {
                    this.loading.set(false);
                } else {
                    this.loadReportData(false);
                }
            },
            error: (err) => {
                this.error.set('Failed to load report definition.');
                this.loading.set(false);
            }
        });
    }

    loadReportData(isApplyFilter = false) {
        const slug = this.reportSlug();
        
        // Reset sub-filters if finding data again
        if (['compliance-status-report', 'compliance-report', 'cco-compliance-report', 'compliance-circulars-report'].includes(slug) && !isApplyFilter) {
            const def = this.definition();
            if (def) {
                const currentFilters = this.filters();
                this.filters.set({
                    ...def.defaultFilters,
                    authority_id: currentFilters['authority_id'] || 'all',
                    circular_id: currentFilters['circular_id'] || 'all',
                    task_set_id: currentFilters['task_set_id'] || 'all',
                    startDate: currentFilters['startDate'],
                    endDate: currentFilters['endDate']
                });
            }
        }

        const activeFilters = this.filters();
        this.loading.set(true);
        this.error.set(null);

        this.reportsService.getReportData(slug, activeFilters).subscribe({
            next: (data) => {
                this.rows.set(data);
                this.loading.set(false);
                if (['compliance-status-report', 'compliance-report', 'cco-compliance-report', 'compliance-circulars-report'].includes(slug)) {
                    this.initialDataLoaded.set(true);
                }
            },
            error: (err) => {
                this.error.set('Failed to retrieve report data.');
                this.loading.set(false);
            }
        });
    }

    findReport() {
        this.loadReportData(false);
    }

    applyFilter() {
        this.loadReportData(true);
    }

    showFilter(filter: any): boolean {
        const slug = this.reportSlug();
        if (!['compliance-status-report', 'compliance-report', 'cco-compliance-report', 'compliance-circulars-report'].includes(slug)) {
            return true;
        }
        if (!this.initialDataLoaded()) {
            if (slug === 'compliance-circulars-report') {
                return filter.key === 'authority_id' || filter.key === 'circular_id';
            }
            if (slug === 'compliance-report' || slug === 'cco-compliance-report') {
                return filter.key === 'authority_id' || filter.key === 'circular_id' || filter.key === 'task_set_id';
            }
            return filter.key === 'startDate' || filter.key === 'endDate';
        }
        return true;
    }

    reset() {
        const def = this.definition();
        if (def) {
            this.filters.set({ ...def.defaultFilters });
            const slug = this.reportSlug();
            if (['compliance-status-report', 'compliance-report', 'cco-compliance-report', 'compliance-circulars-report'].includes(slug)) {
                this.initialDataLoaded.set(false);
                this.rows.set([]);
            } else {
                this.loadReportData(false);
            }
        }
    }

  print() {
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report');
    });
  }

    exportExcel() {
        const def = this.definition();
        const data = this.rows();
        if (!def || data.length === 0) return;

        if (this.reportSlug() === 'compliance-summary-report') {
            const flatRows: any[] = [];
            for (const group of data) {
                for (const dept of group.departments || []) {
                    for (const task of dept.tasks || []) {
                        flatRows.push({
                            circular_authority: group.circular_authority,
                            circular_name: group.circular_name,
                            task_set_name: group.task_set_name,
                            department_name: `${dept.department_name} (BR. ${dept.branch_code})`,
                            sr_no: task.sr_no,
                            header: task.header,
                            observations: task.observations,
                            compliance: task.compliance,
                            reviewer_comment: task.reviewer_comment
                        });
                    }
                }
            }

            this.exportService.exportToExcel(
                flatRows,
                [
                    { field: 'circular_authority', header: 'Authority' },
                    { field: 'circular_name', header: 'Circular Name' },
                    { field: 'task_set_name', header: 'Task Set' },
                    { field: 'department_name', header: 'Department' },
                    { field: 'sr_no', header: 'Sr. No.' },
                    { field: 'header', header: 'Header' },
                    { field: 'observations', header: 'Observations' },
                    { field: 'compliance', header: 'Compliance' },
                    { field: 'reviewer_comment', header: 'Reviewer Comment' }
                ],
                def.fileName || 'compliance-summary-report',
                [
                    def.title,
                    `Report Run Date: ${this.reportRunDate()}`
                ]
            );
            return;
        }

        const exportCols = def.columns
            .filter(col => col.key !== 'sr_no')
            .map(col => ({
                field: col.key,
                header: col.label
            }));

        const dataToExport = data.map((row, index) => {
            const item: Record<string, any> = { sr_no: index + 1 };
            def.columns.forEach(col => {
                item[col.key] = row[col.key];
            });
            return item;
        });

        this.exportService.exportToExcel(
            dataToExport,
            exportCols,
            def.fileName || 'report',
            [
                def.title,
                `Report Run Date: ${this.reportRunDate()}`
            ]
        );
    }

    goBack() {
        this.router.navigate(['/reports']);
    }

    statusSeverity(row: any, column: ReportColumnDefinition): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
        const val = String(row[column.key] || '').toLowerCase().trim();
        if (val === 'yes' || val === 'active' || val === 'complied' || val === 'approved') {
            return 'success';
        }
        if (val === 'no' || val === 'withdrawn' || val === 'rejected' || val === 'needs redo') {
            return 'danger';
        }
        if (val === 'pending' || val === 'review pending') {
            return 'warn';
        }
        return 'secondary';
    }

    formatDate(val: any): string {
        if (!val || val === 'N/A' || val === '-') return val || '-';
        try {
            return this.dateTimeService.formatDateDisplay(val);
        } catch {
            return String(val);
        }
    }
}
