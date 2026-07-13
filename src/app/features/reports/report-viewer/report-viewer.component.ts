import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { ReportsService, ReportDefinition, ReportColumnDefinition } from '../services/reports.service';
import { ExportService } from '../../../core/services/export/export.service';
import { PageComponent } from '../../../shared/components/page/page.component';

@Component({
    selector: 'app-report-viewer',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TagModule, RippleModule, PageComponent],
    templateUrl: './report-viewer.component.html',
    styleUrls: ['./report-viewer.component.scss'],
})
export class ReportViewerComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private reportsService = inject(ReportsService);
    private exportService = inject(ExportService);

    reportSlug = signal<string>('');
    definition = signal<ReportDefinition | null>(null);
    filters = signal<Record<string, any>>({});
    rows = signal<any[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);
    reportRunDate = signal<string>('');
    initialDataLoaded = signal<boolean>(false);

    ngOnInit() {
        this.reportRunDate.set(new Date().toISOString().split('T')[0]);
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
                if (slug === 'compliance-status-report') {
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
        
        // Reset sub-filters if finding data again with new dates
        if (slug === 'compliance-status-report' && !isApplyFilter) {
            const def = this.definition();
            if (def) {
                const currentFilters = this.filters();
                this.filters.set({
                    ...def.defaultFilters,
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
                if (slug === 'compliance-status-report') {
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
        if (this.reportSlug() !== 'compliance-status-report') {
            return true;
        }
        if (!this.initialDataLoaded()) {
            return filter.key === 'startDate' || filter.key === 'endDate';
        }
        return true;
    }

    reset() {
        const def = this.definition();
        if (def) {
            this.filters.set({ ...def.defaultFilters });
            if (this.reportSlug() === 'compliance-status-report') {
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
}
