import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from '../../../core/services/config/config.token';


export interface ReportFilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'checkbox';
  required?: boolean;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export interface ReportColumnDefinition {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'date' | 'status';
}

export interface ReportDefinition {
  slug: string;
  title: string;
  category: string;
  page: 'A4' | 'A4L';
  fileName: string;
  brand?: {
    logoUrl?: string;
    bankName?: string;
  };
  defaultFilters: Record<string, any>;
  filters: ReportFilterDefinition[];
  columns: ReportColumnDefinition[];
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/reports`;

  getReportDefinition(reportSlug: string) {
    const params = new HttpParams().set('_t', String(Date.now()));
    return this.http.get<ReportDefinition>(
      `${this.apiUrl}/${reportSlug}/definition`,
      { params }
    );
  }

  getReportData(reportSlug: string, filters: Record<string, any>) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      params = params.set(
        key,
        Array.isArray(value)
          ? value.join(',')
          : String(value ?? ''),
      );
    });

    params = params.set('_t', String(Date.now()));

    return this.http.get<any[]>(
      `${this.apiUrl}/${reportSlug}/data`,
      { params },
    );
  }
}
