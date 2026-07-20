import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cco-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cco-dashboard.component.html',
  styleUrls: ['./cco-dashboard.component.scss']
})
export class CcoDashboardComponent {
  @Input() stats: any = null;
  @Input() role: string = '';
}
