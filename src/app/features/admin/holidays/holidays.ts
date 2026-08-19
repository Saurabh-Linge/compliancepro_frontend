import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ComplianceApiService } from '../../../core/services/api/compliance-api.service';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TextFieldComponent } from '../../../shared/components/form/text-field/text-field.component';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, ButtonModule, DrawerModule, ToastModule, TextFieldComponent],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="card" style="height: 100%; display: flex; flex-direction: column; min-height: 0;">
      <div class="flex align-items-center justify-content-between mb-3" style="flex-shrink: 0; gap: 1rem; flex-wrap: wrap;">
        <h5 class="m-0 text-xl font-semibold">Holiday Master</h5>

        <!-- Legend chips — inline in header -->
        <div class="flex align-items-center gap-3 flex-wrap">
          <div class="flex align-items-center gap-2">
            <span style="width:13px;height:13px;border-radius:3px;background:var(--pink-100);border:1px solid var(--pink-300);display:inline-block;flex-shrink:0"></span>
            <span class="text-sm text-600" style="white-space:nowrap">Weekend</span>
          </div>
          <div class="flex align-items-center gap-2">
            <span style="width:13px;height:13px;border-radius:3px;background:var(--blue-100);border:1px solid var(--blue-300);display:inline-block;flex-shrink:0"></span>
            <span class="text-sm text-600" style="white-space:nowrap">Bank Holiday</span>
          </div>
          <div class="flex align-items-center gap-2">
            <span style="width:13px;height:13px;border-radius:3px;background:var(--indigo-100);border:1px solid var(--indigo-300);display:inline-block;flex-shrink:0"></span>
            <span class="text-sm text-600" style="white-space:nowrap">Custom Holiday</span>
          </div>
        </div>

        <button pButton icon="pi pi-plus" label="Add Custom Holiday" (click)="showDrawer.set(true)"></button>
      </div>

      <!-- Full-page inline calendar -->
      <p-datepicker
        [inline]="true"
        [(ngModel)]="selectedDate"
        (onMonthChange)="onMonthChange($event)"
        styleClass="holiday-calendar"
        style="flex: 1; min-height: 0; display: flex; flex-direction: column;">
        <ng-template pTemplate="date" let-date>
          <div class="flex align-items-center justify-content-center w-full h-full"
               [ngClass]="getHolidayClass(date)"
               [title]="getHolidayName(date) || ''"
               style="border-radius: 4px; cursor: pointer;"
               (click)="onDateClick(date)">
            <span>{{date.day}}</span>
          </div>
        </ng-template>
      </p-datepicker>
    </div>

    <!-- Drawer — same pattern as Users/Branches -->
    <p-drawer
      [visible]="showDrawer()"
      (visibleChange)="showDrawer.set($event)"
      position="right"
      [style]="{ width: '420px', maxWidth: '96vw' }"
      [modal]="true"
      [dismissible]="true"
      [showCloseIcon]="false"
      styleClass="drawer-layout"
      appendTo="body">

      <ng-template pTemplate="header">
        <div class="drawer-header-row">
          <div class="drawer-title-wrap">
            <span class="drawer-title-icon"><i class="pi pi-calendar-plus"></i></span>
            <div>
              <div class="text-900 font-semibold text-xl">Add Holiday</div>
              <div class="text-600 text-sm mt-1">Compliances will be skipped or shifted on this date</div>
            </div>
          </div>
          <button pButton pRipple type="button" icon="pi pi-times" class="p-button-text p-button-rounded" (click)="showDrawer.set(false)"></button>
        </div>
      </ng-template>

      <ng-template pTemplate="content">
        <div class="drawer-content-shell">
          <section class="drawer-section">
            <div class="section-heading">
              <span class="section-kicker">Holiday Details</span>
              <span class="section-line"></span>
            </div>
            <div class="grid formgrid p-fluid drawer-form-grid">
              <div class="field col-12">
                <label class="block mb-2 font-medium">Date</label>
                <p-datepicker [(ngModel)]="newHolidayDate" dateFormat="yy-mm-dd" appendTo="body" styleClass="w-full" placeholder="Select date"></p-datepicker>
              </div>
              <div class="field col-12">
                <app-text-field label="Holiday Name" [field]="newHolidayName" placeholder="e.g. Diwali, Company Offsite"></app-text-field>
              </div>
            </div>
          </section>
        </div>
      </ng-template>

      <ng-template pTemplate="footer">
        <div class="drawer-footer-row">
          <button pButton label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary" (click)="showDrawer.set(false)"></button>
          <button pButton label="Save Holiday" icon="pi pi-check" [disabled]="!newHolidayDate || !newHolidayName()" (click)="saveHoliday()"></button>
        </div>
      </ng-template>
    </p-drawer>
  `,
  styles: [`
    /* ── Host card fills viewport minus shell chrome ── */
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
    }

    /* ── Datepicker wrapper stretches inside the flex column ── */
    :host ::ng-deep .holiday-calendar {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    /* PrimeNG v17+ top-level component element */
    :host ::ng-deep .holiday-calendar > p-datepicker,
    :host ::ng-deep .holiday-calendar p-datepicker {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    :host ::ng-deep .holiday-calendar .p-datepicker {
      width: 100% !important;
      flex: 1;
      min-height: 0;
      border: none;
      padding: 0;
      display: flex;
      flex-direction: column;
    }
    :host ::ng-deep .holiday-calendar .p-datepicker-panel,
    :host ::ng-deep .holiday-calendar .p-datepicker > div {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    /* Table must fill remaining vertical space */
    :host ::ng-deep .holiday-calendar .p-datepicker table {
      width: 100%;
      table-layout: fixed;
      flex: 1;
      height: 100%;
    }
    :host ::ng-deep .holiday-calendar .p-datepicker tbody {
      height: 100%;
    }
    :host ::ng-deep .holiday-calendar .p-datepicker tbody tr {
      height: calc(100% / 6);
    }
    :host ::ng-deep .holiday-calendar .p-datepicker table td {
      padding: 2px;
      vertical-align: top;
    }
    :host ::ng-deep .holiday-calendar .p-datepicker table td > span,
    :host ::ng-deep .holiday-calendar .p-datepicker table td > div {
      width: 100%;
      height: 100%;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 4px 2px;
    }

    /* Drawer shared styles */
    :host ::ng-deep .drawer-layout .p-drawer-content {
      display: flex;
      flex-direction: column;
      padding: 0;
      background: var(--surface-ground);
    }
    :host ::ng-deep .drawer-layout .p-drawer-header {
      padding: 1.15rem 1.35rem;
      border-bottom: 1px solid var(--surface-200);
      background: var(--surface-card);
    }
    :host ::ng-deep .drawer-layout .p-drawer-footer {
      padding: 0;
      border-top: 1px solid var(--surface-200);
      background: var(--surface-card);
      box-shadow: 0 -8px 22px rgba(15,23,42,0.06);
    }

    .drawer-header-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; width:100%; }
    .drawer-title-wrap { display:flex; align-items:center; gap:0.85rem; min-width:0; }
    .drawer-title-icon { display:inline-flex; align-items:center; justify-content:center; width:2.65rem; height:2.65rem; border-radius:8px; color:var(--primary-color); background:var(--primary-50, var(--surface-100)); border:1px solid var(--primary-100, var(--surface-border)); flex:0 0 auto; }
    .drawer-footer-row { display:flex; align-items:center; justify-content:flex-end; gap:0.75rem; width:100%; padding:1rem 1.35rem; }
    .drawer-footer-row button { min-width: 9.5rem; }
    .drawer-content-shell { display:flex; flex-direction:column; gap:0.9rem; padding:1rem 1.35rem 1.25rem; }
    .drawer-section { background:var(--surface-card); border:1px solid var(--surface-border); border-radius:8px; padding:1rem 1rem 0.35rem; }
    .section-heading { display:flex; align-items:center; gap:0.75rem; margin-bottom:1.1rem; }
    .section-kicker { color:var(--text-color); font-size:0.78rem; font-weight:700; letter-spacing:0; text-transform:uppercase; white-space:nowrap; }
    .section-line { flex:1; height:1px; background:var(--surface-border); }
    .drawer-form-grid { row-gap:0.65rem; }
    .drawer-form-grid .field { margin-bottom:0.85rem; }
  `]
})
export class HolidaysComponent implements OnInit {
  private api = inject(ComplianceApiService);
  private messageService = inject(MessageService);

  selectedDate: Date = new Date();

  customHolidays = signal<any[]>([]);
  showDrawer = signal(false);
  newHolidayDate: Date | null = null;
  newHolidayName = signal<string>('');

  bankHolidays: { [key: string]: string } = {
    '2026-01-26': 'Republic Day',
    '2026-03-25': 'Holi',
    '2026-04-10': 'Good Friday',
    '2026-04-14': 'Ambedkar Jayanti',
    '2026-05-01': 'May Day',
    '2026-08-15': 'Independence Day',
    '2026-10-02': 'Gandhi Jayanti',
    '2026-10-21': 'Dussehra',
    '2026-11-09': 'Diwali',
    '2026-11-15': 'Guru Nanak Jayanti',
    '2026-12-25': 'Christmas',
  };

  ngOnInit() { this.loadHolidays(); }

  onMonthChange(event: any) { this.loadHolidays(); }

  loadHolidays() {
    this.api.getHolidays().subscribe((data: any) => this.customHolidays.set(data));
  }

  private getDateStr(dateObj: any): string {
    const y = dateObj.year;
    const m = String(dateObj.month + 1).padStart(2, '0');
    const d = String(dateObj.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getNativeDate(dateObj: any): Date {
    return new Date(dateObj.year, dateObj.month, dateObj.day);
  }

  getHolidayName(dateObj: any): string | null {
    const dStr = this.getDateStr(dateObj);
    const custom = this.customHolidays().find(h => h.date === dStr);
    if (custom) return custom.name;
    if (this.bankHolidays[dStr]) return this.bankHolidays[dStr];
    const d = this.getNativeDate(dateObj);
    const day = d.getDay();
    const date = d.getDate();
    if (day === 0) return 'Sunday';
    if (day === 6 && ((date > 7 && date <= 14) || (date > 21 && date <= 28))) {
      return date > 7 && date <= 14 ? '2nd Saturday' : '4th Saturday';
    }
    return null;
  }

  getHolidayClass(dateObj: any): string {
    const dStr = this.getDateStr(dateObj);
    if (this.customHolidays().find(h => h.date === dStr)) return 'bg-indigo-50 text-indigo-700';
    if (this.bankHolidays[dStr]) return 'bg-blue-50 text-blue-700';
    const d = this.getNativeDate(dateObj);
    const day = d.getDay();
    const date = d.getDate();
    if (day === 0) return 'bg-pink-50 text-pink-700';
    if (day === 6 && ((date > 7 && date <= 14) || (date > 21 && date <= 28))) return 'bg-pink-50 text-pink-700';
    return '';
  }

  onDateClick(dateObj: any) {
    const dStr = this.getDateStr(dateObj);
    const custom = this.customHolidays().find(h => h.date === dStr);
    if (custom) {
      if (confirm(`Delete custom holiday: "${custom.name}"?`)) {
        this.api.deleteHoliday(custom.id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Holiday removed' });
          this.loadHolidays();
        });
      }
    }
  }

  saveHoliday() {
    if (!this.newHolidayDate || !this.newHolidayName()) return;
    const y = this.newHolidayDate.getFullYear();
    const m = String(this.newHolidayDate.getMonth() + 1).padStart(2, '0');
    const d = String(this.newHolidayDate.getDate()).padStart(2, '0');
    this.api.addHoliday(`${y}-${m}-${d}`, this.newHolidayName()).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Holiday added' });
        this.showDrawer.set(false);
        this.newHolidayDate = null;
        this.newHolidayName.set('');
        this.loadHolidays();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add holiday' })
    });
  }
}
