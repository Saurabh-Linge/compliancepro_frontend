// src/app/shared/components/audit-unit-dashboard/audit-unit-dashboard.component.ts

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-audit-unit-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TagModule,
    ],
    templateUrl: './audit-unit-dashboard.component.html',
    styleUrl: './audit-unit-dashboard.component.css',
})
export class AuditUnitDashboardComponent {
    @Input() eyebrow = 'Internal Audit';
    @Input() title = 'Select Audit Unit';
    @Input() subtitle = 'Select a branch/unit to continue the audit workflow';

    @Input() units: any[] = [];
    @Input() loading = false;

    @Input() search = '';
    @Input() selectedStatus: any = null;
    @Input() statusOptions: any[] = [];

    @Input() totalUnits = 0;
    @Input() totalAuditPending = 0;
    @Input() totalReviewPending = 0;
    @Input() totalCompliancePending = 0;
    @Input() totalCompleted = 0;

    @Input() summaryItems: Array<{
        label: string;
        value: number | string;
        className?: string;
    }> | null = null;

    @Input() cardMetrics: Array<{
        label: string;
        key: string;
        className?: string;
    }> | null = null;

    @Input() cardMetaItems: Array<{
        label: string;
        key: string;
    }> | null = null;

    @Input() panelTitle = 'Assigned Branches';
    @Input() emptyTitle = 'No audit units found';
    @Input() emptyMessage = 'Try changing the search or status filter.';
    @Input() refreshLabel = 'Refresh';
    @Input() detailsActionLabel: string | null = null;
    @Input() groupAssessments = false;

    @Output() searchChange = new EventEmitter<string>();
    @Output() selectedStatusChange = new EventEmitter<any>();
    @Output() refresh = new EventEmitter<void>();
    @Output() openUnit = new EventEmitter<any>();
    @Output() viewDetails = new EventEmitter<any>();

    expandedGroupKey: string | null = null;
    selectedGroupAssessmentIds: Record<string, any> = {};

    ngOnChanges(changes: SimpleChanges) {
        if (changes['units']) {
            const nextSelections: Record<string, any> = {};

            for (const item of this.units || []) {
                const assessments =
                    this.assessmentItems(item);
                const key =
                    this.groupKey(item);

                if (!key || !assessments.length) {
                    continue;
                }

                nextSelections[key] =
                    assessments[0]?.id;
            }

            this.selectedGroupAssessmentIds =
                nextSelections;

            if (
                this.expandedGroupKey
                && !nextSelections[this.expandedGroupKey]
            ) {
                this.expandedGroupKey = null;
            }
        }
    }

    defaultSummaryItems() {
        return [
            {
                label: 'Total Units',
                value: this.totalUnits,
            },
            {
                label: 'Audit Pending',
                value: this.totalAuditPending,
                className: 'text-warn',
            },
            {
                label: 'Review Pending',
                value: this.totalReviewPending,
                className: 'text-info',
            },
            {
                label: 'Compliance Pending',
                value: this.totalCompliancePending,
                className: 'text-danger',
            },
            {
                label: 'Completed',
                value: this.totalCompleted,
                className: 'text-success',
            },
        ];
    }

    summaryMetrics() {
        return this.summaryItems?.length
            ? this.summaryItems
            : this.defaultSummaryItems();
    }

    defaultCardMetrics() {
        return [
            {
                label: 'Audit',
                key: 'audit_pending',
                className: 'text-warn',
            },
            {
                label: 'Review',
                key: 'review_pending',
                className: 'text-info',
            },
            {
                label: 'Compliance',
                key: 'compliance_pending',
                className: 'text-danger',
            },
            {
                label: 'Done',
                key: 'audit_completed',
                className: 'text-success',
            },
        ];
    }

    unitCardMetrics() {
        return this.cardMetrics?.length
            ? this.cardMetrics
            : this.defaultCardMetrics();
    }

    getSeverity(status: string | null | undefined) {
        if (!status) {
            return 'secondary';
        }

        const value = status.toLowerCase();

        if (value.includes('not started')) {
            return 'info';
        }

        if (value.includes('audit')) {
            return 'warn';
        }

        if (value.includes('review')) {
            return 'contrast';
        }

        if (value.includes('compliance')) {
            return 'danger';
        }

        if (value.includes('completed')) {
            return 'success';
        }

        return 'secondary';
    }

    onSearchChange(value: string) {
        this.searchChange.emit(value);
    }

    onStatusChange(value: any) {
        this.selectedStatusChange.emit(value);
    }

    onRefresh() {
        this.refresh.emit();
    }

    onOpenUnit(item: any) {
        this.openUnit.emit(item);
    }

    onViewDetails(item: any) {
        this.viewDetails.emit(item);
    }

    assessmentItems(item: any): any[] {
        return Array.isArray(item?.assessments)
            ? item.assessments
            : [];
    }

    hasAssessmentGroup(item: any) {
        return this.groupAssessments
            && this.assessmentItems(item).length > 1;
    }

    groupKey(item: any) {
        return String(
            item?.audit_unit_id
            ?? item?.id
            ?? item?.audit_unit_code
            ?? '',
        );
    }

    toggleGroup(item: any) {
        if (!this.hasAssessmentGroup(item)) {
            this.openPrimaryItem(item);
            return;
        }

        const key =
            this.groupKey(item);

        if (this.expandedGroupKey === key) {
            this.expandedGroupKey = null;
            return;
        }

        this.expandedGroupKey = key;

        if (
            !this.selectedGroupAssessmentIds[key]
            && this.assessmentItems(item).length
        ) {
            this.selectedGroupAssessmentIds[key] =
                this.assessmentItems(item)[0]?.id;
        }
    }

    selectedGroupedAssessment(item: any) {
        const key =
            this.groupKey(item);
        const selectedId =
            this.selectedGroupAssessmentIds[key];

        return this.assessmentItems(item).find(
            (assessment: any) =>
                String(assessment?.id) === String(selectedId),
        ) || this.assessmentItems(item)[0] || null;
    }

    openGroupedAssessment(item: any) {
        const selected =
            this.selectedGroupedAssessment(item);

        if (!selected) {
            return;
        }

        this.onOpenUnit(selected);
    }

    openPrimaryItem(item: any) {
        if (this.hasAssessmentGroup(item)) {
            return;
        }

        const firstAssessment =
            this.assessmentItems(item)[0];

        this.onOpenUnit(firstAssessment || item);
    }

    get sortedUnits(): any[] {
        if (!this.units || this.units.length === 0) {
            return [];
        }
        const utturItems: any[] = [];
        const otherItems: any[] = [];
        for (const item of this.units) {
            const name = (item?.display_title || item?.audit_unit_name || '').toLowerCase();
            const code = (item?.display_code || item?.audit_unit_code || '').toLowerCase();
            if (name.includes('uttur') || code.includes('uttur')) {
                utturItems.push(item);
            } else {
                otherItems.push(item);
            }
        }
        return [...utturItems, ...otherItems];
    }
}
