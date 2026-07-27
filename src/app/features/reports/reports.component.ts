import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { PageComponent } from '../../shared/components/page/page.component';

interface ReportItem {
  srNo: number;
  name: string;
  route: string;
  category: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, TableComponent, ButtonModule, RippleModule, PageComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  private router = inject(Router);

  columns: TableColumn[] = [
    {
      field: 'srNo',
      header: 'SR. NO.',
      width: '4.5rem',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
    },
    { field: 'name', header: 'REPORTS', align: 'left', headerAlign: 'left', sortable: false },
    {
      field: 'action',
      header: 'ACTION',
      width: '6rem',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
    },
  ];

  reports: ReportItem[] = [
    {
      srNo: 1,
      name: 'Compliance Authority Report',
      route: '/reports/compliance-authority-report',
      category: '1_master',
    },
    {
      srNo: 2,
      name: 'Compliance Circulars Report',
      route: '/reports/compliance-circulars-report',
      category: '1_master',
    },
    {
      srNo: 3,
      name: 'Compliance Implementation Report',
      route: '/reports/compliance-implementation-report',
      category: '1_master',
    },
    {
      srNo: 4,
      name: 'Compliance Initiation Report',
      route: '/reports/compliance-initiation-report',
      category: '1_master',
    },
    {
      srNo: 5,
      name: 'Authority Wise Pending Tasks Report',
      route: '/reports/authority-pending-tasks-report',
      category: '1_master',
    },
    {
      srNo: 6,
      name: 'Compliance Status Report',
      route: '/reports/compliance-status-report',
      category: '3_advanced',
    },
    {
      srNo: 7,
      name: 'Compliance Summary Report',
      route: '/reports/compliance-summary-report',
      category: '3_advanced',
    },
    {
      srNo: 8,
      name: 'Compliance Report',
      route: '/reports/compliance-report',
      category: '3_advanced',
    },
  ];

  filteredReports: ReportItem[] = [];

  ngOnInit() {
    this.filteredReports = [...this.reports];
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  runReport(report: ReportItem) {
    this.router.navigate([report.route], { queryParams: { name: report.name } });
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case '1_master':
        return 'Master Reports »';
      case '3_advanced':
        return 'Advanced Reports »';
      default:
        return category;
    }
  }
}
