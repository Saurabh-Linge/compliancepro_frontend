import { Injectable } from '@angular/core';

/**
 * DateTime service for Indian Standard Time (IST - UTC+5:30)
 * Provides consistent date/time handling across the Angular application
 */
@Injectable({ providedIn: 'root' })
export class DateTimeService {
  readonly IST_OFFSET_HOURS = 5;
  readonly IST_OFFSET_MINUTES = 30;
  private readonly IST_OFFSET_MS = (this.IST_OFFSET_HOURS * 60 + this.IST_OFFSET_MINUTES) * 60 * 1000;

  /**
   * Get current date/time in IST
   */
  nowIST(): Date {
    return this.toIST(new Date());
  }

  /**
   * Convert a UTC date to IST
   */
  toIST(date: Date): Date {
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
    return new Date(utcMs + this.IST_OFFSET_MS);
  }

  /**
   * Get current ISO timestamp in IST for database storage
   * Format: YYYY-MM-DDTHH:mm:ss.sss+05:30
   */
  nowISOString(): string {
    return this.toISOStringIST(new Date());
  }

  /**
   * Convert a date to ISO string with IST offset
   * Format: YYYY-MM-DDTHH:mm:ss.sss+05:30
   */
  toISOStringIST(date: Date): string {
    const istDate = this.toIST(date);
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    const seconds = String(istDate.getSeconds()).padStart(2, '0');
    const ms = String(istDate.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}+05:30`;
  }

  /**
   * Get current date string in IST (YYYY-MM-DD)
   */
  todayDateString(): string {
    return this.toDateString(new Date());
  }

  /**
   * Convert a date to date-only string in IST (YYYY-MM-DD)
   */
  toDateString(date: Date): string {
    const istDate = this.toIST(date);
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert a date to local date string using browser's locale (for display)
   * This uses the user's local time, not IST conversion
   */
  toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get current time string in IST (HH:mm:ss)
   */
  nowTimeString(): string {
    return this.toTimeString(new Date());
  }

  /**
   * Convert a date to time-only string in IST (HH:mm:ss)
   */
  toTimeString(date: Date): string {
    const istDate = this.toIST(date);
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    const seconds = String(istDate.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Format date for display (dd/mm/yyyy)
   */
  formatDateDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const istDate = this.toIST(d);
    const day = String(istDate.getDate()).padStart(2, '0');
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const year = istDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format date and time for display (dd/mm/yyyy HH:mm)
   */
  formatDateTimeDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const istDate = this.toIST(d);
    const day = String(istDate.getDate()).padStart(2, '0');
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const year = istDate.getFullYear();
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Parse a date string and return IST date
   */
  parseToIST(dateString: string): Date {
    const parsed = new Date(dateString);
    return this.toIST(parsed);
  }

  /**
   * Get start of day in IST (00:00:00.000)
   */
  startOfDayIST(date?: Date): Date {
    const d = date ? this.toIST(date) : this.nowIST();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of day in IST (23:59:59.999)
   */
  endOfDayIST(date?: Date): Date {
    const d = date ? this.toIST(date) : this.nowIST();
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Compare two dates (date portion only, ignoring time)
   * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
   */
  compareDates(date1: Date | string, date2: Date | string): number {
    const d1 = this.toDateString(typeof date1 === 'string' ? new Date(date1) : date1);
    const d2 = this.toDateString(typeof date2 === 'string' ? new Date(date2) : date2);
    return d1 < d2 ? -1 : d1 > d2 ? 1 : 0;
  }

  /**
   * Check if a date is today in IST
   */
  isToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.toDateString(d) === this.todayDateString();
  }

  /**
   * Get today's date as Date object with time at start of day
   * Uses local timezone (for date picker defaults)
   */
  getTodayLocal(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Create a date range for today (for filters)
   */
  getTodayRange(): Date[] {
    const today = this.getTodayLocal();
    return [today, today];
  }
}
