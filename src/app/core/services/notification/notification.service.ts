import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export interface NotificationOptions {
  summary?: string;
  detail: string;
  life?: number;
  sticky?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private messageService: MessageService) { }

  success(detail: string, summary: string = 'Success'): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 3000
    });
  }

  error(detail: string, summary: string = 'Error'): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  }

  warn(detail: string, summary: string = 'Warning'): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life: 4000
    });
  }

  info(detail: string, summary: string = 'Info'): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: 3000
    });
  }

  /**
   * Custom notification with full options
   */
  show(severity: 'success' | 'error' | 'warn' | 'info', options: NotificationOptions): void {
    this.messageService.add({
      severity,
      summary: options.summary || severity.charAt(0).toUpperCase() + severity.slice(1),
      detail: options.detail,
      life: options.life || 3000,
      sticky: options.sticky
    });
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.messageService.clear();
  }
}
