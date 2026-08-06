import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceApiService } from '../../core/services/api/compliance-api.service';
import { TableComponent, TableColumn, TableAction } from '../../shared/components/table/table.component';
import { TextFieldComponent } from '../../shared/components/form/text-field/text-field.component';
import { PageComponent } from '../../shared/components/page/page.component';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-task-headers',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, TextFieldComponent, PageComponent, DialogModule, DrawerModule, ButtonModule, ToastModule, ConfirmDialogModule],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Task Headers Master</h5>
      </div>
        <app-table
          [data]="headers()"
          [columns]="columns"
          [actions]="actions"
          (onAdd)="openModal()"
          (onRefresh)="loadHeaders(true)"
        ></app-table>
      </div>

    <p-drawer
        [visible]="showModal()"
        (visibleChange)="showModal.set($event)"
        position="right"
        [style]="{ width: '450px', maxWidth: '96vw' }"
        [modal]="true"
        [dismissible]="true"
        [showCloseIcon]="false"
        styleClass="drawer-layout"
        appendTo="body"
      >
        <ng-template pTemplate="header">
          <div class="drawer-header-row">
            <div class="drawer-title-wrap">
              <span class="drawer-title-icon">
                <i class="pi pi-tags"></i>
              </span>
              <div>
                <div class="text-900 font-semibold text-xl">Task Header Details</div>
                <div class="text-600 text-sm mt-1">Manage header category</div>
              </div>
            </div>
            <button pButton pRipple type="button" icon="pi pi-times" class="p-button-text p-button-rounded" (click)="showModal.set(false)"></button>
          </div>
        </ng-template>

        <ng-template pTemplate="content">
          <div class="drawer-content-shell">
            <section class="drawer-section">
              <div class="section-heading">
                <span class="section-kicker">Header Info</span>
                <span class="section-line"></span>
              </div>
              <div class="grid formgrid p-fluid drawer-form-grid">
                <div class="field col-12">
                  <app-text-field
                    label="Name"
                    [field]="headerName"
                    [required]="true"
                    [error]="submitted() && !headerName() ? 'Name is required' : ''">
                  </app-text-field>
                </div>
              </div>
            </section>
          </div>
        </ng-template>

        <ng-template pTemplate="footer">
          <div class="drawer-footer-row">
            <button pButton pRipple label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary" (click)="showModal.set(false)"></button>
            <button pButton pRipple label="Save" icon="pi pi-check" class="p-button-primary" [loading]="saving()" [disabled]="saving()" (click)="save()"></button>
          </div>
        </ng-template>
      </p-drawer>
  `,
  styles: [`
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
      box-shadow: 0 -8px 22px rgba(15, 23, 42, 0.06);
    }

    .drawer-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      width: 100%;
    }

    .drawer-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 0;
    }

    .drawer-title-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.65rem;
      height: 2.65rem;
      border-radius: 8px;
      color: var(--primary-color);
      background: var(--primary-50, var(--surface-100));
      border: 1px solid var(--primary-100, var(--surface-border));
      flex: 0 0 auto;
    }

    .drawer-footer-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      width: 100%;
      padding: 1rem 1.35rem;
    }

    .drawer-footer-row button {
      min-width: 9.5rem;
    }

    .drawer-content-shell {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      padding: 1rem 1.35rem 1.25rem;
    }

    .drawer-section {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 1rem 1rem 0.35rem;
    }

    .section-heading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.1rem;
    }

    .section-kicker {
      color: var(--text-color);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .section-line {
      flex: 1;
      height: 1px;
      background: var(--surface-border);
    }

    .drawer-form-grid {
      row-gap: 0.65rem;
    }

    .drawer-form-grid .field {
      margin-bottom: 0.85rem;
    }
  `]
})
export class TaskHeadersComponent implements OnInit {
  private api = inject(ComplianceApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  headers = signal<any[]>([]);
  showModal = signal(false);
  saving = signal(false);
  
  headerName = signal('');
  submitted = signal(false);
  editingId: number | null = null;

  columns: TableColumn[] = [
    { field: 'id', header: 'ID', width: '10%' },
    { field: 'name', header: 'Name', width: '60%' },
    { field: 'created_at', header: 'Created', type: 'date', pipeFormat: 'mediumDate', width: '30%' }
  ];

  actions: TableAction[] = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: (row: any) => this.editHeader(row)
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      styleClass: 'text-red-500',
      command: (row: any) => this.deleteHeader(row)
    }
  ];

  ngOnInit() {
    this.loadHeaders();
  }

  loadHeaders(isRefresh = false) {
    this.api.getTaskHeaders().subscribe({
      next: (data: any) => {
        this.headers.set(data);
        if (isRefresh) {
          this.messageService.add({ severity: 'info', summary: 'Refreshed', detail: 'Task headers list refreshed', life: 2500 });
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load task headers' });
      }
    });
  }

  openModal() {
    this.editingId = null;
    this.headerName.set('');
    this.submitted.set(false);
    this.showModal.set(true);
  }

  editHeader(row: any) {
    this.editingId = row.id;
    this.headerName.set(row.name);
    this.submitted.set(false);
    this.showModal.set(true);
  }

  deleteHeader(row: any) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete ' + (row.name || 'this task header') + '?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteTaskHeader(row.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Task Header Deleted', life: 3000 });
            this.loadHeaders();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete task header' });
          }
        });
      }
    });
  }

  save() {
    this.submitted.set(true);
    if (!this.headerName().trim()) {
      return;
    }

    this.saving.set(true);
    if (this.editingId) {
      this.api.updateTaskHeader(this.editingId, this.headerName()).subscribe({
        next: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Task Header Updated', life: 3000 });
          this.showModal.set(false);
          this.loadHeaders();
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update task header' });
        }
      });
    } else {
      this.api.createTaskHeader(this.headerName()).subscribe({
        next: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Task Header Created', life: 3000 });
          this.showModal.set(false);
          this.loadHeaders();
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create task header' });
        }
      });
    }
  }
}
