import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplianceApiService } from '../../../core/services/api/compliance-api.service';

@Component({
  selector: 'app-co-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './co-dashboard.component.html',
  styleUrls: ['./co-dashboard.component.scss']
})
export class CoDashboardComponent {
  @Input() stats: any = null;
  @Input() role: string = '';

  constructor(private api: ComplianceApiService) {}

  getFileUrl(url: string | null | undefined): string {
    return this.api.getFileUrl(url);
  }
}
