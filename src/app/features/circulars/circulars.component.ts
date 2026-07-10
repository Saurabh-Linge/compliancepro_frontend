import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceApiService, Circular, Authority } from '../../core/services/api/compliance-api.service';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from '../../core/services/config/config.token';
import { Router } from '@angular/router';
import { TableComponent, TableColumn, TableAction } from '../../shared/components/table/table.component';
import { TextFieldComponent } from '../../shared/components/form/text-field/text-field.component';
import { TextareaFieldComponent } from '../../shared/components/form/textarea-field/textarea-field.component';
import { SelectFieldComponent } from '../../shared/components/form/select-field/select-field.component';
import { PageComponent } from '../../shared/components/page/page.component';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DrawerModule } from 'primeng/drawer';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-circulars',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    TextFieldComponent,
    TextareaFieldComponent,
    SelectFieldComponent,
    PageComponent,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    CheckboxModule,
    DrawerModule,
    FileUploadModule,
    ProgressBarModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <app-page title="Circular Master" icon="pi pi-file">
      <div class="card h-full">
        <app-table
            [data]="circulars()"
            [columns]="tableColumns"
            [actions]="tableActions"
            (onAdd)="openUploadModal()"
            [showRefreshButton]="true"
            [paginator]="true"
            [rows]="limit"
            [lazy]="true"
            [totalRecords]="totalRecords()"
            (onLazyLoad)="handleLazyLoad($event)"
            (onSearch)="handleSearch($event)"
            (onRefresh)="loadData()"
        ></app-table>
      </div>
    </app-page>

    <p-confirmDialog></p-confirmDialog>
    <p-toast position="top-right"></p-toast>

    <!-- Circular Master Drawer -->
    <p-drawer
      [visible]="showCircularDrawer()"
      (visibleChange)="showCircularDrawer.set($event)"
      position="right"
      [style]="{ width: '760px', maxWidth: '96vw' }"
      [modal]="true"
      [dismissible]="true"
      [showCloseIcon]="false"
      styleClass="circular-drawer"
    >
      <ng-template pTemplate="header">
        <div class="drawer-header-row">
          <div class="drawer-title-wrap">
            <span class="drawer-title-icon">
              <i class="pi pi-file"></i>
            </span>
            <div>
              <div class="text-900 font-semibold text-xl">Circular Master</div>
              <div class="text-600 text-sm mt-1">Create a circular record</div>
            </div>
          </div>
          <button pButton pRipple type="button" icon="pi pi-times" class="p-button-text p-button-rounded" (click)="closeCircularDrawer()"></button>
        </div>
      </ng-template>

      <ng-template pTemplate="content">
        <div class="drawer-content-shell">
          <section class="drawer-section">
            <div class="section-heading">
              <span class="section-kicker">Details</span>
              <span class="section-line"></span>
            </div>

            <div class="grid formgrid p-fluid drawer-form-grid">
              <div class="field col-12 md:col-6">
                <app-select-field
                  label="Authority"
                  placeholder="Please select authority"
                  [field]="newAuthorityId"
                  [options]="authorities()"
                  optionLabel="name"
                  optionValue="id"
                  [required]="true"
                  [virtualScroll]="false">
                </app-select-field>
              </div>

              <div class="field col-12 md:col-6">
                <app-text-field
                  label="Reference No."
                  [field]="referenceNoField"
                  placeholder="Enter reference number">
                </app-text-field>
              </div>

              <div class="field col-12">
                <app-text-field
                  label="Circular Title"
                  [field]="circularTitleField"
                  placeholder="Enter circular title"
                  [required]="true">
                </app-text-field>
              </div>

              <div class="field col-12 md:col-6">
                <app-text-field
                  label="Circular Date"
                  [field]="circularDate"
                  type="date"
                  [required]="true">
                </app-text-field>
              </div>

              <div class="field col-12 md:col-6">
                <app-select-field
                  label="Priority"
                  [field]="priority"
                  [options]="priorityOptions"
                  optionLabel="label"
                  optionValue="value"
                  [required]="true"
                  [virtualScroll]="false">
                </app-select-field>
              </div>
            </div>
          </section>

          <section class="drawer-section">
            <div class="section-heading">
              <span class="section-kicker">Classification</span>
              <span class="section-line"></span>
            </div>

            <div class="grid formgrid p-fluid drawer-form-grid">
              <div class="field col-12 md:col-6">
                <app-select-field
                  label="Circular Type"
                  [field]="circularType"
                  [options]="circularTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  [required]="true">
                </app-select-field>
              </div>

              <div class="field col-12 md:col-6">
                <app-text-field
                  label="Circular Portal / Website"
                  [field]="portalWebsiteField"
                  placeholder="Enter portal or website">
                </app-text-field>
              </div>

              <div class="field col-12">
                <app-textarea-field
                  label="Circular Description"
                  [field]="descriptionField"
                  [rows]="4"
                  [autoResize]="true">
                </app-textarea-field>
              </div>
            </div>
          </section>

          <section class="drawer-section">
            <div class="section-heading">
              <span class="section-kicker">Documents</span>
              <span class="section-line"></span>
            </div>

            <p-fileupload
              name="files"
              accept="application/pdf"
              [multiple]="true"
              [customUpload]="true"
              [showUploadButton]="false"
              [showCancelButton]="false"
              chooseLabel="Choose PDFs"
              chooseIcon="pi pi-upload"
              styleClass="circular-file-upload"
              (onSelect)="onCircularFilesSelected($event)"
              (onRemove)="onCircularFileRemoved($event)"
              (onClear)="clearCircularFiles()">
              <ng-template pTemplate="file" let-file let-index="index" let-removeFileCallback="removeFileCallback">
                <div class="flex align-items-center justify-content-between p-3 border-round border-1 border-300 mb-2 bg-surface-card w-full gap-2">
                  <div class="flex align-items-center gap-3 min-width-0 flex-1">
                    <span class="inline-flex align-items-center justify-content-center bg-red-100 text-red-500 border-round animate-fadein" style="width: 2.5rem; height: 2.5rem; flex: 0 0 auto;">
                      <i class="pi pi-file-pdf text-xl"></i>
                    </span>
                    <div class="min-width-0 flex-1">
                      <div class="font-semibold text-900 text-sm" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 280px;" [title]="file.name">{{ file.name }}</div>
                      <div class="text-xs text-600 mt-1">{{ (file.size / 1024 / 1024).toFixed(3) }} MB</div>
                    </div>
                  </div>
                  <div class="flex align-items-center gap-3 flex-shrink-0">
                    <span class="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 border-round">Pending Upload</span>
                    <button pButton pRipple type="button" icon="pi pi-times" class="p-button-text p-button-rounded p-button-danger p-button-sm" (click)="removeFileCallback($event, index)"></button>
                  </div>
                </div>
              </ng-template>
            </p-fileupload>

            <div *ngIf="processingState() !== 'idle'" class="processing-panel" [ngClass]="processingState()">
              <div class="flex align-items-center justify-content-between gap-3">
                <div>
                  <div class="font-semibold text-900">{{ processingTitle() }}</div>
                  <div class="text-sm text-600 mt-1">{{ processingMessage() }}</div>
                </div>
                <i [class]="processingIcon()"></i>
              </div>
              <p-progressBar
                *ngIf="processingState() === 'uploading' || processingState() === 'processing'"
                mode="indeterminate"
                [style]="{ height: '6px' }"
                styleClass="mt-3">
              </p-progressBar>
            </div>
          </section>

          <section class="drawer-section">
            <div class="section-heading">
              <span class="section-kicker">Penalty</span>
              <span class="section-line"></span>
            </div>

            <div class="penalty-toggle">
              <p-checkbox [(ngModel)]="isPenaltyApplicable" [binary]="true" inputId="penaltyApplicable"></p-checkbox>
              <label for="penaltyApplicable" class="font-medium text-700 mb-0">Is Penalty Applicable</label>
            </div>

            <div *ngIf="isPenaltyApplicable" class="penalty-fields">
              <div class="grid formgrid p-fluid drawer-form-grid">
                <div class="field col-12 md:col-4">
                  <p-floatlabel variant="on">
                    <input pInputText type="number" [(ngModel)]="penaltyAmount" id="penaltyAmount" class="w-full">
                    <label for="penaltyAmount">Penalty Amount</label>
                  </p-floatlabel>
                </div>
                <div class="field col-12 md:col-8">
                  <app-text-field
                    label="Penalty Description"
                    [field]="penaltyDescriptionField"
                    placeholder="Enter penalty description">
                  </app-text-field>
                </div>
              </div>
            </div>
          </section>
        </div>
      </ng-template>

      <ng-template pTemplate="footer">
        <div class="drawer-footer-row">
          <button pButton pRipple type="button" label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary" [disabled]="uploading()" (click)="closeCircularDrawer()"></button>
          <button pButton pRipple type="button" label="Save Circular" icon="pi pi-check" [loading]="uploading()" [disabled]="uploading()" (click)="onUpload($event)"></button>
        </div>
      </ng-template>
    </p-drawer>

    <!-- AI Chat Drawer -->
    <p-drawer
      [visible]="showChatDrawer()"
      (visibleChange)="showChatDrawer.set($event)"
      position="right"
      [style]="{ width: '600px', maxWidth: '96vw' }"
      [modal]="true"
      [dismissible]="true"
      [showCloseIcon]="false"
      styleClass="chat-drawer"
    >
      <ng-template pTemplate="header">
        <div class="drawer-header-row">
          <div>
            <div class="text-900 font-semibold text-xl">Qwen AI Compliance Chat</div>
            <div class="text-600 text-sm mt-1">Asking questions about {{ chatCircular()?.title }}</div>
          </div>
          <button pButton pRipple type="button" icon="pi pi-times" class="p-button-text" (click)="closeChatDrawer()"></button>
        </div>
      </ng-template>

      <ng-template pTemplate="content">
        <div class="drawer-content-shell chat-shell">
          <div class="chat-scroll flex-1 surface-50 border-1 surface-border border-round-lg p-3">
            <div *ngFor="let msg of chatMessages()" class="chat-row flex mb-3" [ngClass]="{'justify-content-end': msg.role === 'user'}">
              <div class="chat-bubble" [ngClass]="msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'">
                 <div class="text-xs font-semibold mb-1">{{ msg.role === 'user' ? 'You' : 'Qwen Assistant' }}</div>
                 <div class="chat-content">{{ msg.content }}</div>
              </div>
            </div>
            <div *ngIf="isTyping()" class="text-600 text-sm italic">Qwen is thinking...</div>
          </div>

          <form (submit)="sendMessage($event)" class="flex gap-2 align-items-end">
            <app-text-field
              [field]="chatInput"
              [hideLabel]="true"
              placeholder="Ask anything about this circular..."
              class="flex-1">
            </app-text-field>
            <button pButton type="submit" icon="pi pi-send" [disabled]="isTyping() || !chatInput().trim()" label="Send"></button>
          </form>
        </div>
      </ng-template>
    </p-drawer>

    <!-- Logs Modal -->
    <p-dialog header="AI Processing Logs" [(visible)]="showLogsModal" [modal]="true" [style]="{ width: '50rem' }" [dismissableMask]="true" (onHide)="closeLogsModal()">
      <div class="logs-container bg-gray-900 text-green-400 p-4 border-round h-24rem overflow-y-auto font-mono text-sm" #logsScroll>
        <div *ngFor="let log of activeLogs()">
          <span class="text-gray-500">[{{ log.created_at | date:'mediumTime' }}]</span> 
          <span [ngClass]="{'text-yellow-400': log.status === 'PROCESSING', 'text-green-500': log.status === 'COMPLETED', 'text-red-500': log.status === 'FAILED'}">[{{ log.status }}]</span> 
          <span class="white-space-pre-wrap">{{ log.message }}</span>
        </div>
        <div *ngIf="streamingThinkingText()" class="mb-2 p-2 border-round" style="background: #1a1a2e; border: 1px solid #444;">
          <div class="text-purple-300 text-xs font-bold mb-1">🧠 THINKING (Chain of Thought)</div>
          <span class="text-purple-200 white-space-pre-wrap" style="font-size: 0.8rem; opacity: 0.85">{{ streamingThinkingText() }}</span>
        </div>
        <div *ngIf="streamingLogText()" class="mt-2 text-yellow-300">
          <span class="text-gray-500">[Live Stream]</span> <span class="text-yellow-400">[GENERATING]</span> 
          <span class="white-space-pre-wrap">{{ streamingLogText() }}</span>
        </div>
        <div *ngIf="activeLogs().length === 0 && !streamingLogText() && !streamingThinkingText()" class="text-gray-500 italic">No logs available.</div>
        <div *ngIf="isPollingLogs()" class="mt-2 text-yellow-300 animate-pulse">Connected to live stream...</div>
      </div>
    </p-dialog>

    <!-- Amendment Chain Drawer -->
    <p-drawer
      [visible]="showAmendmentChainModal()"
      (visibleChange)="showAmendmentChainModal.set($event)"
      position="right"
      [style]="{ width: '600px', maxWidth: '96vw' }"
      [modal]="true"
      [dismissible]="true"
      [showCloseIcon]="false"
      styleClass="circular-drawer"
    >
      <ng-template pTemplate="header">
        <div class="drawer-header-row">
          <div class="drawer-title-wrap">
            <span class="drawer-title-icon" style="color: var(--teal-600); background: var(--teal-50); border-color: var(--teal-200)">
              <i class="pi pi-link"></i>
            </span>
            <div>
              <div class="text-900 font-semibold text-xl">Amendment Chain</div>
              <div class="text-600 text-sm mt-1">History of modifications and updates</div>
            </div>
          </div>
          <button pButton pRipple type="button" icon="pi pi-times" class="p-button-text p-button-rounded" (click)="closeAmendmentChainModal()"></button>
        </div>
      </ng-template>

      <ng-template pTemplate="content">
        <div class="drawer-content-shell">
          <div *ngIf="!amendmentChainData()" class="flex align-items-center justify-content-center p-5 text-gray-500">
            <i class="pi pi-spin pi-spinner text-2xl mr-2"></i> Loading chain...
          </div>
          
          <div *ngIf="amendmentChainData() as data" class="mt-2">
            <!-- Timeline UI using standard HTML/CSS for complete control -->
            <div class="amendment-timeline">
              <!-- Root / Original Circular -->
              <div class="timeline-event" *ngIf="data.original">
                <div class="timeline-marker">
                  <div class="marker-dot original-dot"></div>
                  <div class="marker-line" *ngIf="data.amendments?.length"></div>
                </div>
                <div class="timeline-content p-card p-3 w-full mb-4 border-1 border-gray-200 border-round-xl">
                  <div class="flex justify-content-between align-items-center mb-2">
                    <span class="p-badge p-badge-secondary p-badge-outlined px-2 py-1 text-xs">ORIGINAL</span>
                    <span class="text-gray-500 text-sm font-medium"><i class="pi pi-calendar mr-1 text-xs"></i> {{ data.original.published_date | date:'mediumDate' }}</span>
                  </div>
                  <div class="font-semibold text-lg text-900 mb-1 line-height-3">{{ data.original.title }}</div>
                  <div class="text-gray-600 text-sm mb-3">Ref: {{ data.original.reference_no || 'N/A' }}</div>
                  
                  <div class="flex justify-content-between align-items-center">
                    <span class="text-xs" [ngClass]="{'text-green-600 font-medium': data.original.ai_processing_status === 'COMPLETED'}">
                      <i class="pi" [ngClass]="{'pi-check-circle': data.original.ai_processing_status === 'COMPLETED', 'pi-clock text-orange-500': data.original.ai_processing_status !== 'COMPLETED'}"></i>
                      {{ data.original.ai_processing_status | titlecase }}
                    </span>
                    <button pButton pRipple icon="pi pi-external-link" label="View Tasks" class="p-button-text p-button-sm p-button-secondary py-1" (click)="viewTasks(data.original.id); closeAmendmentChainModal()"></button>
                  </div>
                </div>
              </div>

              <!-- Missing Original state -->
              <div class="timeline-event" *ngIf="!data.original && data.amendments?.length">
                <div class="timeline-marker">
                  <div class="marker-dot error-dot"></div>
                  <div class="marker-line"></div>
                </div>
                <div class="timeline-content p-3 w-full mb-4 border-round-xl" style="background: var(--red-50); border: 1px dashed var(--red-300)">
                  <div class="font-medium text-red-600"><i class="pi pi-exclamation-triangle mr-2"></i> Original Circular Not Found</div>
                  <div class="text-sm text-red-500 mt-1">The system could not automatically link the amendment to an original circular.</div>
                </div>
              </div>

              <!-- Amendments -->
              <div class="timeline-event" *ngFor="let am of data.amendments; let last = last; let i = index">
                <div class="timeline-marker">
                  <div class="marker-dot amendment-dot"></div>
                  <div class="marker-line" *ngIf="!last"></div>
                </div>
                <div class="timeline-content p-card p-3 w-full mb-4 border-1 border-blue-100 border-round-xl" [ngStyle]="{'background': 'linear-gradient(to right, var(--blue-50) 0%, #ffffff 50%)'}">
                  <div class="flex justify-content-between align-items-center mb-2">
                    <span class="p-badge p-badge-info px-2 py-1 text-xs"><i class="pi pi-pencil mr-1 text-xs"></i> AMENDMENT {{ i + 1 }}</span>
                    <span class="text-gray-500 text-sm font-medium"><i class="pi pi-calendar mr-1 text-xs"></i> {{ am.published_date | date:'mediumDate' }}</span>
                  </div>
                  <div class="font-semibold text-lg text-900 mb-1 line-height-3">{{ am.title }}</div>
                  <div class="text-gray-600 text-sm mb-3">Ref: {{ am.reference_no || 'N/A' }}</div>
                  
                  <div *ngIf="am.amendment_notes" class="bg-white p-2 border-round border-1 border-gray-200 text-sm text-gray-700 mb-3 shadow-1" style="border-left: 3px solid var(--blue-400)">
                    <strong>AI Notes:</strong> {{ am.amendment_notes }}
                  </div>
                  
                  <div class="flex justify-content-between align-items-center">
                    <span class="text-xs" [ngClass]="{'text-green-600 font-medium': am.ai_processing_status === 'COMPLETED'}">
                      <i class="pi" [ngClass]="{'pi-check-circle': am.ai_processing_status === 'COMPLETED', 'pi-clock text-orange-500': am.ai_processing_status !== 'COMPLETED'}"></i>
                      {{ am.ai_processing_status | titlecase }}
                    </span>
                    <button pButton pRipple icon="pi pi-external-link" label="View Tasks" class="p-button-text p-button-sm p-button-secondary py-1" (click)="viewTasks(am.id); closeAmendmentChainModal()"></button>
                  </div>
                </div>
              </div>
              
              <div *ngIf="!data.amendments?.length && data.original" class="text-center text-gray-500 mt-4 italic">
                No amendments have been issued for this circular.
              </div>
            </div>
          </div>
        </div>
      </ng-template>
    </p-drawer>
  `,
  styles: [`
    :host ::ng-deep .circular-drawer .p-drawer-content,
    :host ::ng-deep .chat-drawer .p-drawer-content {
      display: flex;
      flex-direction: column;
      padding: 0;
      background: var(--surface-ground);
    }

    :host ::ng-deep .circular-drawer .p-drawer-header,
    :host ::ng-deep .chat-drawer .p-drawer-header {
      padding: 1.15rem 1.35rem;
      border-bottom: 1px solid var(--surface-200);
      background: var(--surface-card);
    }

    :host ::ng-deep .circular-drawer .p-drawer-footer,
    :host ::ng-deep .chat-drawer .p-drawer-footer {
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

    .date-field-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .date-field-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-color-secondary);
    }

    .date-field-wrapper input[type="date"] {
      height: 2.75rem;
    }

    .penalty-toggle {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-height: 3rem;
      padding: 0.65rem 0.85rem;
      margin-bottom: 0.85rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
    }

    .penalty-fields {
      padding-top: 0.15rem;
    }

    :host ::ng-deep .circular-file-upload .p-fileupload-header {
      padding: 0.85rem;
      background: var(--surface-50);
      border-color: var(--surface-border);
      border-radius: 8px 8px 0 0;
    }

    :host ::ng-deep .circular-file-upload .p-fileupload-content {
      border-color: var(--surface-border);
      border-radius: 0 0 8px 8px;
      padding: 1rem;
    }

    :host ::ng-deep .circular-file-upload .p-fileupload-file {
      width: 100%;
      display: flex;
      padding: 0;
      margin: 0;
    }

    .processing-panel {
      margin-top: 0.9rem;
      padding: 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      background: var(--surface-50);
    }

    .processing-panel.processing {
      border-color: var(--primary-200, var(--surface-border));
      background: var(--primary-50, var(--surface-50));
    }

    .processing-panel.done {
      border-color: var(--green-200);
      background: var(--green-50);
    }

    .processing-panel.error {
      border-color: var(--red-200);
      background: var(--red-50);
    }

    .processing-panel i {
      color: var(--primary-color);
      font-size: 1.35rem;
    }

    .processing-panel.done i {
      color: var(--green-600);
    }

    .processing-panel.error i {
      color: var(--red-600);
    }

    .chat-shell {
      min-height: 0;
      flex: 1;
    }

    :host ::ng-deep .chat-scroll {
      min-height: 40vh;
      overflow-y: auto;
    }

    .chat-bubble {
      max-width: 80%;
      border-radius: 1rem;
      padding: 0.85rem 1rem;
      line-height: 1.45;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .chat-bubble-user {
      background: var(--primary-color);
      color: var(--primary-color-text, #ffffff);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    }

    .chat-bubble-ai {
      background: var(--surface-card);
      color: var(--text-color);
      border: 1px solid var(--surface-border);
    }

    .chat-content {
      font-size: 0.94rem;
    }

    .white-space-pre-wrap {
      white-space: pre-wrap;
    }

      @media (max-width: 520px) {
      .drawer-header-row {
        align-items: flex-start;
      }

      .drawer-footer-row {
        padding: 0.85rem 1rem;
      }

      .drawer-footer-row button {
        flex: 1 1 0;
        min-width: 0;
      }
    }

    /* Timeline styles for Amendment Chain */
    .amendment-timeline {
      position: relative;
      padding: 1rem 0 1rem 1rem;
    }
    .timeline-event {
      display: flex;
      position: relative;
    }
    .timeline-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: 1.5rem;
      width: 1.5rem;
    }
    .marker-dot {
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 2px var(--surface-border);
      z-index: 2;
      background: white;
      margin-top: 0.5rem;
    }
    .original-dot {
      box-shadow: 0 0 0 2px var(--gray-400);
      background: var(--gray-500);
    }
    .amendment-dot {
      box-shadow: 0 0 0 2px var(--blue-400);
      background: var(--blue-500);
    }
    .error-dot {
      box-shadow: 0 0 0 2px var(--red-400);
      background: var(--red-500);
    }
    .marker-line {
      flex: 1;
      width: 2px;
      background: var(--surface-border);
      margin-top: -0.25rem;
      margin-bottom: -1rem;
      z-index: 1;
    }
  `]
})
export class CircularsComponent implements OnInit, OnDestroy {
  circulars = signal<Circular[]>([]);
  authorities = signal<Authority[]>([]);

  showCircularDrawer = signal<boolean>(false);
  uploading = signal<boolean>(false);
  selectedCircularFiles = signal<File[]>([]);
  processingState = signal<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  processingMessage = signal<string>('');
  lastTaskCount = signal<number>(0);

  totalRecords = signal<number>(0);
  page = 1;
  limit = 10;
  searchQuery = '';

  newAuthorityId = signal<string>('');
  referenceNo = '';
  referenceNoField = signal<string>('');
  circularTitle = '';
  circularTitleField = signal<string>('');
  circularDate = signal<string>('');
  priority = signal<string>('Medium');
  circularType = signal<string>('6');
  description = '';
  descriptionField = signal<string>('');
  portalWebsite = '';
  portalWebsiteField = signal<string>('');
  isPenaltyApplicable = false;
  penaltyAmount: number | null = null;
  penaltyDescription = '';
  penaltyDescriptionField = signal<string>('');

  priorityOptions = [
    { label: 'Critical', value: 'Critical' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  circularTypeOptions = [
    { label: 'Regulatory & Statutory Compliance', value: '1' },
    { label: 'Supervisory Compliance', value: '2' },
    { label: 'Compliances to Advisories', value: '3' },
    { label: 'Compliances to Custom Requirements', value: '4' },
    { label: 'Compliances to Policy Guidelines, SOPs', value: '5' },
    { label: 'General Compliances', value: '6' },
  ];

  showChatDrawer = signal<boolean>(false);
  chatCircular = signal<Circular | null>(null);
  chatMessages = signal<{ role: 'user' | 'ai', content: string }[]>([]);
  chatInput = signal<string>('');
  isTyping = signal<boolean>(false);

  showLogsModal = false;
  activeLogs = signal<any[]>([]);
  activeLogsCircularId: number | null = null;
  logsPollingInterval: any;
  eventSource: EventSource | null = null;
  streamingLogText = signal<string>('');
  streamingThinkingText = signal<string>('');

  showAmendmentChainModal = signal<boolean>(false);
  amendmentChainData = signal<{ original: Circular | null, amendments: any[], isOriginal: boolean } | null>(null);

  private config: any = inject(APP_CONFIG);

  tableColumns: TableColumn[] = [
    { field: 'reference_no', header: 'Reference No.', width: '15%' },
    { field: 'authority_name', header: 'Authority', width: '18%' },
    { field: 'title', header: 'Circular Title', width: '22%' },
    { field: 'published_date', header: 'Circular Date', type: 'date', width: '12%' },
    { field: 'circular_nature', header: 'Nature', type: 'badge', width: '12%' },
    { field: 'circular_type_name', header: 'Type', width: '15%' },
    { field: 'ai_processing_status', header: 'Status', width: '10%' }
  ];

  tableActions: TableAction[] = [
    {
      label: 'View PDF',
      icon: 'pi pi-file-pdf',
      disabled: (row) => row?.ai_processing_status === 'QUEUED' || row?.ai_processing_status === 'PROCESSING',
      command: (row) => window.open(this.api.getFileUrl(row.pdf_url), '_blank')
    },
    {
      label: 'Tasks',
      icon: 'pi pi-list',
      disabled: (row) => row?.ai_processing_status === 'QUEUED' || row?.ai_processing_status === 'PROCESSING',
      command: (row) => this.viewTasks(row.id)
    },
    {
      label: 'Ask AI',
      icon: 'pi pi-comment',
      styleClass: 'text-purple-700',
      disabled: (row) => row?.ai_processing_status === 'QUEUED' || row?.ai_processing_status === 'PROCESSING',
      command: (row) => this.router.navigate(['/circulars', row.id, 'chat'])
    },
    {
      label: 'Amendment Chain',
      icon: 'pi pi-link',
      styleClass: 'text-teal-600',
      command: (row) => this.openAmendmentChainModal(row.id)
    },
    {
      label: 'View Logs',
      icon: 'pi pi-server',
      styleClass: 'text-blue-600',
      command: (row) => this.openLogsModal(row)
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      styleClass: 'text-red-500',
      disabled: (row) => row?.ai_processing_status === 'QUEUED' || row?.ai_processing_status === 'PROCESSING',
      command: (row) => this.confirmDelete(row)
    }
  ];

  constructor(private api: ComplianceApiService, private http: HttpClient, private router: Router, private confirmationService: ConfirmationService, private messageService: MessageService) { }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.closeLogsModal();
  }

  loadData() {
    const params: any = {
      page: this.page,
      limit: this.limit,
    };
    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    this.api.getCirculars(params).subscribe({
      next: (res) => {
        this.circulars.set(res.data);
        this.totalRecords.set(res.total);
      },
      error: (err) => console.error(err)
    });
    this.api.getAuthorities().subscribe(data => this.authorities.set(data));
  }

  handleLazyLoad(event: any) {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.limit = event.rows;
    if (event.globalFilter !== undefined) {
      this.searchQuery = event.globalFilter;
    }
    this.loadData();
  }

  handleSearch(query: string) {
    this.searchQuery = query;
    this.page = 1;
    this.loadData();
  }

  openUploadModal() {
    this.showCircularDrawer.set(true);
    this.newAuthorityId.set('');
    this.referenceNo = '';
    this.referenceNoField.set('');
    this.circularTitle = '';
    this.circularTitleField.set('');
    this.circularDate.set('');
    this.priority.set('Medium');
    this.circularType.set('6');
    this.description = '';
    this.descriptionField.set('');
    this.portalWebsite = '';
    this.portalWebsiteField.set('');
    this.isPenaltyApplicable = false;
    this.penaltyAmount = null;
    this.penaltyDescription = '';
    this.penaltyDescriptionField.set('');
    this.selectedCircularFiles.set([]);
    this.processingState.set('idle');
    this.processingMessage.set('');
    this.lastTaskCount.set(0);
  }

  closeCircularDrawer() {
    this.showCircularDrawer.set(false);
  }

  onFileSelected(event: any) {
    // kept for template compatibility if a file is reintroduced later
  }

  onCircularFilesSelected(event: any) {
    console.log('onCircularFilesSelected', event);
    this.selectedCircularFiles.set(event.currentFiles || event.files || []);
    this.processingState.set('idle');
    this.processingMessage.set('');
  }

  onCircularFileRemoved(event: any) {
    const removed = event.file;
    this.selectedCircularFiles.update(files => files.filter(file => file !== removed));
  }

  clearCircularFiles() {
    this.selectedCircularFiles.set([]);
  }

  onUpload(event: Event) {
    event.preventDefault();
    if (!this.newAuthorityId() || !this.circularTitleField().trim() || !this.circularDate()) {
      alert('Please fill all required fields');
      return;
    }

    const hasFiles = this.selectedCircularFiles().length > 0;

    this.uploading.set(true);
    this.processingState.set(hasFiles ? 'uploading' : 'processing');
    this.processingMessage.set(
      hasFiles
        ? 'Uploading PDFs to storage and queuing AI processing...'
        : 'Saving circular details...'
    );

    const payload = {
      authority_id: Number(this.newAuthorityId()),
      reference_no: this.referenceNoField().trim() || null,
      title: this.circularTitleField().trim(),
      published_date: this.circularDate(),
      priority: this.priority(),
      circular_type: Number(this.circularType()),
      description: this.descriptionField().trim() || null,
      portal_website: this.portalWebsiteField().trim() || null,
      is_penalty_applicable: this.isPenaltyApplicable,
      penalty_amount: this.isPenaltyApplicable && this.penaltyAmount !== null ? Number(this.penaltyAmount) : null,
      penalty_description: this.penaltyDescriptionField().trim() || null,
    };

    const request = hasFiles
      ? this.api.createCircularWithFiles(this.buildCircularFormData(payload))
      : this.api.createCircular(payload);

    request.subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.lastTaskCount.set((res as any).task_count || 0);
        this.processingState.set('done');
        this.processingMessage.set(
          hasFiles
            ? `Files uploaded! AI is extracting compliance tasks in the background — refresh Tasks shortly.`
            : 'Circular saved successfully.'
        );
        this.loadData();
        this.messageService.add({
          severity: hasFiles ? 'info' : 'success',
          summary: hasFiles ? 'Circular created' : 'Saved',
          detail: hasFiles
            ? 'Files uploaded! AI is extracting compliance tasks in the background.'
            : 'Circular saved successfully.',
          life: 4000
        });
        window.setTimeout(() => {
          this.closeCircularDrawer();
        }, 400);
      },
      error: (err) => {
        this.uploading.set(false);
        this.processingState.set('error');
        this.processingMessage.set('Save failed. Check MinIO is running, OCR service is up, and Ollama is available.');
        console.error(err);
      }
    });
  }

  private buildCircularFormData(payload: any): FormData {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return; // skip nulls — backend defaults handle them
      // booleans must be sent as strings; String(false) = "false" which toBoolean() handles correctly
      formData.append(key, String(value));
    });
    this.selectedCircularFiles().forEach(file => formData.append('files', file, file.name));
    return formData;
  }

  processingTitle(): string {
    switch (this.processingState()) {
      case 'uploading':
        return 'Uploading files';
      case 'processing':
        return 'AI preprocessing';
      case 'done':
        return 'Done';
      case 'error':
        return 'Processing failed';
      default:
        return '';
    }
  }

  processingIcon(): string {
    switch (this.processingState()) {
      case 'done':
        return 'pi pi-check-circle';
      case 'error':
        return 'pi pi-exclamation-triangle';
      case 'uploading':
      case 'processing':
        return 'pi pi-spin pi-spinner';
      default:
        return 'pi pi-info-circle';
    }
  }

  getCircularTypeLabel(value: string): string {
    return this.circularTypeOptions.find(option => option.value === value)?.label || 'General Compliances';
  }

  viewTasks(id: number) {
    this.router.navigate(['/tasks'], { queryParams: { circular_id: id } });
  }

  confirmDelete(row: Circular) {
    this.confirmationService.confirm({
      message: `Delete circular "<strong>${row.title}</strong>"? This will also delete all associated tasks and files.`,
      header: 'Delete Circular',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deleteCircular(row.id).subscribe({
          next: () => {
            this.circulars.update(list => list.filter(c => c.id !== row.id));
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `"${row.title}" deleted successfully.`, life: 3000 });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete circular.', life: 4000 });
          }
        });
      }
    });
  }

  openChatModal(c: Circular) {
    this.chatCircular.set(c);
    this.showChatDrawer.set(true);
    this.chatMessages.set([{
      role: 'ai',
      content: `Hello! I am Qwen. I have read the "${c.title}" circular. How can I assist you with compliance today?`
    }]);
  }

  closeChatDrawer() {
    this.showChatDrawer.set(false);
    this.chatCircular.set(null);
    this.chatInput.set('');
  }

  sendMessage(event: Event) {
    event.preventDefault();
    const chatCircular = this.chatCircular();
    if (!this.chatInput().trim() || !chatCircular) return;

    const question = this.chatInput().trim();
    this.chatMessages.update(msgs => [...msgs, { role: 'user', content: question }]);
    this.chatInput.set('');
    this.isTyping.set(true);

    this.http.post<{ response: string }>(`${this.config.apiUrl}/circulars/${chatCircular.id}/chat`, { question })
      .subscribe({
        next: (res) => {
          this.isTyping.set(false);
          this.chatMessages.update(msgs => [...msgs, { role: 'ai', content: res.response }]);
        },
        error: (err) => {
          this.isTyping.set(false);
          this.chatMessages.update(msgs => [...msgs, { role: 'ai', content: 'Sorry, I encountered an error connecting to the AI service.' }]);
          console.error(err);
        }
      });
  }

  isPollingLogs() {
    return !!this.eventSource;
  }

  openLogsModal(row: Circular) {
    this.activeLogsCircularId = row.id;
    this.showLogsModal = true;
    this.streamingLogText.set('');
    this.streamingThinkingText.set('');
    this.fetchLogs();

    // Connect to SSE for real-time updates if still processing
    if (row.ai_processing_status === 'QUEUED' || row.ai_processing_status === 'PROCESSING') {
      this.connectToLogStream(row.id);
    }
  }

  connectToLogStream(circularId: number) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`${this.config.apiUrl}/circulars/${circularId}/logs/stream`);

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.thinking) {
        // Real-time thinking tokens from the AI's chain of thought
        this.streamingThinkingText.update(text => text + data.thinking);
        this.scrollToBottom();
      } else if (data.chunk) {
        // Real-time content tokens (the actual JSON output)
        this.streamingLogText.update(text => text + data.chunk);
        this.scrollToBottom();
      } else if (data.status === 'START') {
        this.streamingLogText.set('');
        this.streamingThinkingText.set('');
      } else if (data.status === 'END') {
        this.streamingLogText.set('');
        this.streamingThinkingText.set('');
        this.fetchLogs(); // refresh DB logs to get the final extraction result
      } else if (data.status && data.message) {
        // Standard DB log entry
        this.activeLogs.update(logs => [...logs, {
          id: Date.now(),
          circular_id: circularId,
          status: data.status,
          message: data.message,
          created_at: new Date().toISOString()
        }]);
        this.scrollToBottom();

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
          }
          this.loadData();
        }
      }
    };

    this.eventSource.onerror = () => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = document.querySelector('.logs-container');
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 10);
  }

  closeLogsModal() {
    this.showLogsModal = false;
    this.activeLogsCircularId = null;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.streamingLogText.set('');
    this.streamingThinkingText.set('');
  }

  fetchLogs() {
    if (!this.activeLogsCircularId) return;
    this.api.getCircularLogs(this.activeLogsCircularId).subscribe({
      next: (logs) => {
        this.activeLogs.set(logs);
        this.scrollToBottom();
      }
    });
  }

  // ── Amendment Chain ──────────────────────────────────────────────────────────

  openAmendmentChainModal(circularId: number) {
    this.showAmendmentChainModal.set(true);
    this.amendmentChainData.set(null);
    this.api.getAmendmentChain(circularId).subscribe({
      next: (data) => {
        this.amendmentChainData.set(data);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load amendment chain.',
        });
        this.showAmendmentChainModal.set(false);
      }
    });
  }

  closeAmendmentChainModal() {
    this.showAmendmentChainModal.set(false);
    this.amendmentChainData.set(null);
  }
}
