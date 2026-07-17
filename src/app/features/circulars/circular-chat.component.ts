import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ComplianceApiService, Circular } from '../../core/services/api/compliance-api.service';
import { APP_CONFIG } from '../../core/services/config/config.token';
import { ButtonModule } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  thoughts?: string;         // Qwen3 <think> block
  showThoughts?: boolean;    // toggle state
  elapsed?: number;          // seconds taken to respond
  timestamp: Date;
}

const SUGGESTED_PROMPTS: { label: string; icon: string; text: string }[] = [
  {
    label: 'Obligations Matrix',
    icon: 'pi pi-list-check',
    text: 'Generate a structured Compliance Obligations Matrix from this circular. Provide a clear table containing: 1) Specific Regulatory Mandate, 2) Action Item, 3) Probable Owner Department, and 4) Core Implementation Criteria.',
  },
  {
    label: 'Penal Consequences',
    icon: 'pi pi-exclamation-triangle',
    text: 'What is our regulatory risk exposure here? Detail all penal consequences, financial interest liabilities, personal accountability metrics, or enforcement actions specified for non-compliance or delayed execution.',
  },
  {
    label: 'Implementation Timeline',
    icon: 'pi pi-calendar',
    text: 'Extract all timeline milestones. Provide a chronological breakdown of transition periods, phase-wise implementation milestones, and final hard deadlines for compliance as specified in this text.',
  },
  {
    label: 'Internal Audit Checklist',
    icon: 'pi pi-check-square',
    text: 'Draft an internal audit readiness checklist. Provide clear control points, testing methodologies, and verification steps that our internal auditors can use to validate that we are fully compliant with these directions.',
  },
  {
    label: 'Branch Operations Impact',
    icon: 'pi pi-building',
    text: 'Analyze the operational workflow modifications. How exactly do these guidelines impact day-to-day branch execution, customer-facing touchpoints, or localized internal reporting procedures?',
  },
  {
    label: 'Record Retention',
    icon: 'pi pi-folder',
    text: 'List the exact record-keeping mandates. What logs, registers, complaint trails, or documents must we archive for future regulatory inspection, and what is the exact legally required retention duration?',
  },
  {
    label: 'Applicability & Scope',
    icon: 'pi pi-info-circle',
    text: 'Act as a Chief Compliance Officer. Analyze this circular and determine exactly which entities, business units, or departments must comply. Highlight any explicit exemptions or exclusions that we can leverage.',
  },
  {
    label: 'Reporting Mandates',
    icon: 'pi pi-chart-bar',
    text: 'Identify all mandatory reporting returns, filings, and notifications required by the regulator. Detail the required format, frequency, recipient authority, and state explicitly if board-level reporting or sign-off is mandated.',
  },
];

@Component({
  selector: 'app-circular-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    Textarea,
    SkeletonModule,
    TagModule,
    TooltipModule,
  ],
  template: `
    <div class="chat-full-page">

      <!-- Slim top bar: back button + circular title -->
      <div class="chat-topbar">
        <button
          pButton
          pRipple
          icon="pi pi-arrow-left"
          label="Circulars"
          class="p-button-text p-button-secondary p-button-sm"
          (click)="goBack()"
        ></button>
        <div class="chat-topbar-title">
          <i class="pi pi-comment text-primary"></i>
          <span>AI Chat</span>
          @if (circular()) {
            <span class="topbar-divider">·</span>
            <span class="topbar-circular-name">{{ circular()!.title }}</span>
          }
        </div>
        <button
          pButton
          pRipple
          icon="pi pi-refresh"
          class="p-button-text p-button-secondary p-button-sm"
          pTooltip="Clear chat"
          tooltipPosition="left"
          (click)="clearChat()"
          [disabled]="messages().length === 0"
        ></button>
      </div>

      <!-- Body: sidebar + chat -->
      <div class="chat-page-layout">

        <!-- Left Panel: Circular Info + Suggested Prompts -->
        <aside class="chat-sidebar">

          <!-- Circular Info Card -->
          <div class="sidebar-card circular-info-card">
            <div class="sidebar-card-header">
              <i class="pi pi-file-pdf sidebar-card-icon"></i>
              <span class="sidebar-card-title">Circular Details</span>
            </div>

            @if (loadingCircular()) {
              <div class="flex flex-column gap-2 mt-2">
                <p-skeleton width="100%" height="1rem"></p-skeleton>
                <p-skeleton width="80%" height="1rem"></p-skeleton>
                <p-skeleton width="60%" height="1rem"></p-skeleton>
              </div>
            } @else if (circular()) {
              <div class="circular-detail-grid">
                <div class="detail-row">
                  <span class="detail-label">Title</span>
                  <span class="detail-value font-semibold">{{ circular()!.title }}</span>
                </div>
                @if (circular()!.authority_name) {
                  <div class="detail-row">
                    <span class="detail-label">Authority</span>
                    <span class="detail-value">{{ circular()!.authority_name }}</span>
                  </div>
                }
                @if (circular()!.reference_no) {
                  <div class="detail-row">
                    <span class="detail-label">Reference</span>
                    <span class="detail-value text-mono">{{ circular()!.reference_no }}</span>
                  </div>
                }
                @if (circular()!.published_date) {
                  <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">{{ circular()!.published_date | date:'dd MMM yyyy' }}</span>
                  </div>
                }
                @if (circular()!.priority) {
                  <div class="detail-row">
                    <span class="detail-label">Priority</span>
                    <p-tag
                      [value]="circular()!.priority!"
                      [severity]="prioritySeverity(circular()!.priority!)"
                    ></p-tag>
                  </div>
                }
                @if (circular()!.circular_type_name) {
                  <div class="detail-row">
                    <span class="detail-label">Type</span>
                    <span class="detail-value text-sm">{{ circular()!.circular_type_name }}</span>
                  </div>
                }
                @if (circular()!.pdf_url) {
                  <div class="detail-row mt-1">
                    <a [href]="getFileUrl(circular()!.pdf_url)" target="_blank" class="view-pdf-link">
                      <i class="pi pi-external-link"></i>
                      View PDF
                    </a>
                  </div>
                }
              </div>
            } @else {
              <p class="text-600 text-sm mt-2">Circular not found.</p>
            }
          </div>

          <!-- Suggested Prompts -->
          <div class="sidebar-card prompts-card">
            <div class="sidebar-card-header">
              <i class="pi pi-bolt sidebar-card-icon"></i>
              <span class="sidebar-card-title">Quick Prompts</span>
            </div>
            <div class="prompts-list">
              @for (prompt of suggestedPrompts; track prompt.label) {
                <button
                  class="prompt-chip"
                  [disabled]="isTyping()"
                  (click)="sendSuggestedPrompt(prompt.text)"
                  [pTooltip]="prompt.text"
                  tooltipPosition="right"
                >
                  <i [class]="prompt.icon + ' prompt-chip-icon'"></i>
                  <span>{{ prompt.label }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Circular Comparator Card -->
          <div class="sidebar-card comparator-card">
            <div class="sidebar-card-header">
              <i class="pi pi-sync sidebar-card-icon"></i>
              <span class="sidebar-card-title">Compare Circulars</span>
            </div>
            <p class="text-600 text-xs mb-2">Upload a revised version of this circular to identify compliance changes.</p>
            
            <div class="flex flex-column gap-2">
              @if (linkedCirculars().length > 0) {
                <div class="flex flex-column gap-1 mb-1">
                  <select
                    [(ngModel)]="selectedTargetId"
                    class="w-full text-xs p-2 border-1 border-round surface-border text-color bg-surface-card"
                    style="border-style: solid; outline: none; max-width: 100%; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;"
                    [disabled]="isComparing() || isTyping()"
                  >
                    <option value="">-- Compare Stored Revision --</option>
                    @for (lc of linkedCirculars(); track lc.id) {
                      <option [value]="lc.id">
                        {{ lc.reference_no || 'No Ref' }} - {{ lc.title }}
                      </option>
                    }
                  </select>
                  <button
                    pButton
                    pRipple
                    type="button"
                    icon="pi pi-sync"
                    label="Compare Stored"
                    class="p-button-primary p-button-sm w-full mt-1"
                    (click)="compareStored(selectedTargetId()); selectedTargetId.set('')"
                    [disabled]="isComparing() || isTyping() || !selectedTargetId()"
                  ></button>
                </div>
                <div class="text-center text-500 text-xs my-1">— OR —</div>
              }
              <input
                #fileInput
                type="file"
                accept="application/pdf"
                style="display: none"
                (change)="onRevisedFileSelected($event)"
              />
              <button
                pButton
                pRipple
                type="button"
                [icon]="selectedRevisedFile() ? 'pi pi-file-pdf' : 'pi pi-upload'"
                [label]="selectedRevisedFile() ? selectedRevisedFile()!.name : 'Choose Revised PDF'"
                class="p-button-outlined p-button-secondary p-button-sm text-left overflow-hidden text-overflow-ellipsis w-full"
                style="display: block; max-width: 100%; white-space: nowrap;"
                (click)="fileInput.click()"
                [disabled]="isComparing() || isTyping()"
              ></button>
              
              @if (selectedRevisedFile()) {
                <div class="flex gap-2">
                  <button
                    pButton
                    pRipple
                    type="button"
                    icon="pi pi-sync"
                    label="Compare"
                    class="p-button-primary p-button-sm flex-grow-1"
                    (click)="compareCirculars()"
                    [loading]="isComparing()"
                    [disabled]="isTyping()"
                  ></button>
                  <button
                    pButton
                    pRipple
                    type="button"
                    icon="pi pi-times"
                    class="p-button-outlined p-button-danger p-button-sm"
                    (click)="clearSelectedFile()"
                    [disabled]="isComparing()"
                  ></button>
                </div>
              }
            </div>
          </div>

          <!-- AI Info -->
          <div class="sidebar-card ai-info-card">
            <div class="flex align-items-center gap-2">
              <span class="ai-badge">Qwen</span>
              <span class="text-500 text-xs">via Ollama · RAG</span>
            </div>
          </div>

        </aside>

        <!-- Right Panel: Chat Area -->
        <main class="chat-main">

          <!-- Chat Messages -->
          <div class="chat-messages-container" #chatContainer>
            @if (messages().length === 0 && !isTyping()) {
              <div class="chat-empty-state">
                <div class="empty-icon-wrap">
                  <i class="pi pi-comments"></i>
                </div>
                <p class="text-700 font-semibold text-lg mt-3 mb-1">Start a conversation</p>
                <p class="text-500 text-sm">
                  Ask anything about <strong>{{ circular()?.title || 'this circular' }}</strong>.
                  Use the quick prompts on the left to get started.
                </p>
              </div>
            }

            @for (msg of messages(); track $index) {
              <div class="chat-message-row" [class.user-row]="msg.role === 'user'">
                @if (msg.role === 'ai') {
                  <div class="avatar ai-avatar">
                    <i class="pi pi-microchip-ai"></i>
                  </div>
                }
                <div class="message-block" [class.user-block]="msg.role === 'user'">
                  <div class="message-meta">
                    <span class="message-sender">{{ msg.role === 'user' ? 'You' : 'Qwen Assistant' }}</span>
                    <span class="message-time">{{ msg.timestamp | date:'HH:mm' }}</span>
                    @if (msg.elapsed) {
                      <span class="message-elapsed">{{ msg.elapsed }}s</span>
                    }
                  </div>
                  <!-- Thoughts block (AI only) -->
                  @if (msg.role === 'ai' && msg.thoughts) {
                    <div class="thoughts-block">
                      <button class="thoughts-toggle" (click)="msg.showThoughts = !msg.showThoughts">
                        <i class="pi pi-lightbulb"></i>
                        <span>{{ msg.showThoughts ? 'Hide' : 'Show' }} thinking</span>
                        <i [class]="msg.showThoughts ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                      </button>
                      @if (msg.showThoughts) {
                        <div class="thoughts-content">{{ msg.thoughts }}</div>
                      }
                    </div>
                  }
                  <div
                    class="message-bubble"
                    [class.bubble-user]="msg.role === 'user'"
                    [class.bubble-ai]="msg.role === 'ai'"
                  >
                    <span class="message-text" [innerHTML]="renderMarkdown(msg.content)"></span>
                  </div>
                </div>
                @if (msg.role === 'user') {
                  <div class="avatar user-avatar">
                    <i class="pi pi-user"></i>
                  </div>
                }
              </div>
            }

            @if (isTyping()) {
              <div class="chat-message-row">
                <div class="avatar ai-avatar">
                  <i class="pi pi-microchip-ai"></i>
                </div>
                <div class="message-block">
                  <div class="message-meta">
                    <span class="message-sender">Qwen Assistant</span>
                    <span class="message-elapsed thinking-timer">{{ elapsedSeconds() }}s</span>
                  </div>
                  <!-- Live thoughts while waiting -->
                  @if (thinkingText()) {
                    <div class="thoughts-block live">
                      <div class="thoughts-live-header">
                        <i class="pi pi-lightbulb"></i>
                        <span>Thinking...</span>
                        <span class="thinking-dots"><span></span><span></span><span></span></span>
                      </div>
                      <div class="thoughts-content live-content">{{ thinkingText() }}</div>
                    </div>
                  } @else {
                    <div class="message-bubble bubble-ai typing-bubble">
                      <span class="typing-dot"></span>
                      <span class="typing-dot"></span>
                      <span class="typing-dot"></span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Input Area -->
          <div class="chat-input-area">
            <div class="chat-input-wrap">
              <textarea
                pTextarea
                [(ngModel)]="inputText"
                [autoResize]="false"
                rows="2"
                placeholder="Ask a question about this circular..."
                class="chat-textarea"
                (keydown)="onKeydown($event)"
                [disabled]="isTyping() || loadingCircular()"
              ></textarea>
              <div class="input-actions">
                <span class="input-hint text-500 text-xs">Enter to send &nbsp;·&nbsp; Shift+Enter for new line</span>
                <button
                  pButton
                  pRipple
                  type="button"
                  icon="pi pi-send"
                  label="Send"
                  class="p-button-sm send-btn"
                  (click)="sendMessage()"
                  [disabled]="isTyping() || !inputText.trim() || loadingCircular()"
                  [loading]="isTyping()"
                ></button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    /* ── Full page container (fills the shell layout content area) ── */
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    .chat-full-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      background: var(--surface-ground);
    }

    /* ── Slim top bar ──────────────────────────────────── */
    .chat-topbar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.45rem 1rem;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      flex-shrink: 0;
    }

    .chat-topbar-title {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
      min-width: 0;
    }

    .chat-topbar-title i {
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .topbar-divider {
      color: var(--text-color-secondary);
      flex-shrink: 0;
    }

    .topbar-circular-name {
      color: var(--text-color-secondary);
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Layout ────────────────────────────────────────── */
    .chat-page-layout {
      display: flex;
      gap: 0.75rem;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: 0.75rem;
    }

    /* ── Sidebar ────────────────────────────────────────── */
    .chat-sidebar {
      width: 260px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      overflow-y: auto;
    }

    .sidebar-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 0.75rem;
    }

    .sidebar-card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.6rem;
    }

    .sidebar-card-icon {
      color: var(--primary-color);
      font-size: 0.875rem;
    }

    .sidebar-card-title {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-color);
    }

    /* Circular Details */
    .circular-detail-grid {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .detail-label {
      font-size: 0.67rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-color-secondary);
    }

    .detail-value {
      font-size: 0.825rem;
      color: var(--text-color);
      word-break: break-word;
    }

    .text-mono {
      font-family: 'Courier New', monospace;
    }

    .view-pdf-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
      padding: 0.3rem 0.55rem;
      border-radius: 6px;
      background: var(--primary-50, var(--surface-100));
      border: 1px solid var(--primary-100, var(--surface-border));
      transition: background 0.15s;
    }

    .view-pdf-link:hover {
      background: var(--primary-100, var(--surface-200));
    }

    /* Suggested Prompts */
    .prompts-list {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .prompt-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.65rem;
      border-radius: 6px;
      border: 1px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s, border-color 0.15s;
      width: 100%;
    }

    .prompt-chip:hover:not(:disabled) {
      background: var(--primary-50, var(--surface-100));
      border-color: var(--primary-200, var(--surface-border));
      color: var(--primary-color);
    }

    .prompt-chip:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .prompt-chip-icon {
      font-size: 0.8rem;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    /* AI Badge */
    .ai-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.15rem 0.5rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }

    .ai-info-card {
      padding: 0.55rem 0.75rem;
    }

    /* ── Chat Main Area ────────────────────────────────── */
    .chat-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      overflow: hidden;
    }

    /* Messages */
    .chat-messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      background: var(--surface-ground);
    }

    /* Empty state */
    .chat-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      padding: 2rem 1rem;
      text-align: center;
    }

    .empty-icon-wrap {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: var(--primary-50, var(--surface-100));
      border: 1px solid var(--primary-100, var(--surface-border));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-icon-wrap i {
      font-size: 1.4rem;
      color: var(--primary-color);
    }

    /* Message rows */
    .chat-message-row {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
    }

    .user-row {
      flex-direction: row-reverse;
    }

    .avatar {
      width: 1.9rem;
      height: 1.9rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 0.8rem;
    }

    .ai-avatar {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }

    .user-avatar {
      background: var(--primary-color);
      color: var(--primary-color-text, white);
    }

    .message-block {
      max-width: 74%;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-block {
      align-items: flex-end;
    }

    .message-meta {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .message-sender {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-color-secondary);
    }

    .message-elapsed {
      font-size: 0.68rem;
      color: var(--text-color-secondary);
      opacity: 0.7;
      background: var(--surface-100);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .thinking-timer {
      color: #8b5cf6;
      opacity: 1;
      background: #ede9fe;
      font-weight: 600;
    }

    /* Thoughts block */
    .thoughts-block {
      margin-bottom: 0.35rem;
      border-radius: 8px;
      border: 1px solid #e0d9f7;
      background: #f7f5ff;
      overflow: hidden;
      max-width: 100%;
    }

    .thoughts-block.live {
      border-color: #c4b5fd;
      background: #f5f3ff;
    }

    .thoughts-toggle {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      width: 100%;
      padding: 0.4rem 0.65rem;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      color: #7c3aed;
      text-align: left;
    }

    .thoughts-toggle:hover {
      background: #ede9fe;
    }

    .thoughts-toggle .pi-lightbulb {
      font-size: 0.75rem;
    }

    .thoughts-toggle .pi-chevron-up,
    .thoughts-toggle .pi-chevron-down {
      margin-left: auto;
      font-size: 0.65rem;
    }

    .thoughts-live-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #7c3aed;
    }

    .thoughts-content {
      font-size: 0.775rem;
      color: #5b21b6;
      line-height: 1.55;
      padding: 0 0.65rem 0.5rem;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 180px;
      overflow-y: auto;
    }

    .live-content {
      max-height: 140px;
    }

    /* Animated thinking dots */
    .thinking-dots {
      display: inline-flex;
      gap: 3px;
      margin-left: 0.25rem;
    }

    .thinking-dots span {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #7c3aed;
      animation: typing-bounce 1.2s ease-in-out infinite;
    }

    .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
    .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

    .message-bubble {
      border-radius: 1rem;
      padding: 0.65rem 0.9rem;
      line-height: 1.5;
    }

    .bubble-user {
      background: var(--primary-color);
      color: var(--primary-color-text, white);
      border-radius: 1rem 1rem 0.25rem 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .bubble-ai {
      background: var(--surface-card);
      color: var(--text-color);
      border: 1px solid var(--surface-border);
      border-radius: 1rem 1rem 1rem 0.25rem;
    }

    .message-text {
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Typing indicator */
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.75rem 1rem;
    }

    .typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-color-secondary);
      animation: typing-bounce 1.2s ease-in-out infinite;
    }

    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
      30% { transform: translateY(-5px); opacity: 1; }
    }

    /* ── Input Area ───────────────────────────────────── */
    .chat-input-area {
      padding: 0.65rem 0.85rem;
      border-top: 1px solid var(--surface-border);
      background: var(--surface-card);
    }

    .chat-input-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 0.6rem 0.75rem;
      transition: border-color 0.15s;
    }

    .chat-input-wrap:focus-within {
      border-color: var(--primary-color);
    }

    .chat-textarea {
      width: 100%;
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
      resize: none;
      font-size: 0.875rem;
      line-height: 1.5;
      padding: 0 !important;
      outline: none !important;
    }

    :host ::ng-deep .chat-textarea.p-textarea {
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    .input-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .input-hint {
      font-size: 0.7rem;
    }

    .send-btn {
      min-width: 5.5rem;
    }

    /* ── Responsive ───────────────────────────────────── */
    .comparator-card {
      border: 1px dashed var(--primary-color);
    }
    .comparator-card ::ng-deep .p-button-icon {
      margin-right: 0.5rem;
    }
    ::ng-deep .markdown-header {
      font-size: 0.95rem;
      font-weight: 700;
      margin-top: 0.8rem;
      margin-bottom: 0.4rem;
      color: var(--text-color);
      display: block;
    }
    ::ng-deep .markdown-li {
      margin-left: 1.25rem;
      margin-bottom: 0.25rem;
      list-style-type: disc;
      display: list-item;
    }
    ::ng-deep .markdown-table-wrapper {
      width: 100%;
      overflow-x: auto;
      margin: 0.8rem 0;
      border: 1px solid var(--surface-border);
      border-radius: 6px;
    }
    ::ng-deep .markdown-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.825rem;
      text-align: left;
    }
    ::ng-deep .markdown-table th, ::ng-deep .markdown-table td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--surface-border);
    }
    ::ng-deep .markdown-table th {
      background: var(--surface-100);
      font-weight: 600;
      color: var(--text-color-secondary);
    }
    ::ng-deep .markdown-table tr:last-child td {
      border-bottom: none;
    }
    @media (max-width: 900px) {
      .chat-page-layout {
        flex-direction: column;
        overflow-y: auto;
      }
      .chat-sidebar {
        width: 100%;
        flex-direction: row;
        flex-wrap: wrap;
        overflow-x: auto;
        overflow-y: visible;
        flex-shrink: 0;
      }
      .sidebar-card {
        min-width: 220px;
        flex: 1 1 220px;
      }
      .chat-main {
        min-height: 50vh;
      }
    }
  `],
})
export class CircularChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ComplianceApiService);
  private http = inject(HttpClient);
  private config: any = inject(APP_CONFIG);
  private messageService = inject(MessageService);

  circular = signal<Circular | null>(null);
  loadingCircular = signal<boolean>(true);
  messages = signal<ChatMessage[]>([]);
  isTyping = signal<boolean>(false);
  inputText = '';
  elapsedSeconds = signal<number>(0);
  thinkingText = signal<string>('');

  selectedRevisedFile = signal<File | null>(null);
  isComparing = signal<boolean>(false);
  linkedCirculars = signal<any[]>([]);
  selectedTargetId = signal<string>('');

  readonly suggestedPrompts = SUGGESTED_PROMPTS;

  private circularId!: number;
  private shouldScrollToBottom = false;
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;
  private thinkTimer: ReturnType<typeof setInterval> | null = null;

  getFileUrl(url: string | null | undefined): string {
    return this.api.getFileUrl(url);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/circulars']);
      return;
    }
    this.circularId = parseInt(idParam, 10);
    this.loadCircular();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.stopTimers();
  }

  private loadCircular(): void {
    this.loadingCircular.set(true);
    this.api.getCircularById(this.circularId).subscribe({
      next: (data) => {
        this.circular.set(data);
        this.loadingCircular.set(false);
        this.messages.set([
          {
            role: 'ai',
            content: `Hello! I'm Qwen, your compliance assistant. I've read the circular "${data.title}" and I'm ready to answer your questions. You can use the quick prompts on the left or ask me anything directly.`,
            timestamp: new Date(),
          },
        ]);
        this.shouldScrollToBottom = true;
        this.loadLinkedCirculars();
      },
      error: () => {
        this.loadingCircular.set(false);
      },
    });
  }

  private loadLinkedCirculars(): void {
    this.http.get<{ original: any; amendments: any[]; isOriginal: boolean }>(
      `${this.config.apiUrl}/circulars/${this.circularId}/amendment-chain`
    ).subscribe({
      next: (res) => {
        const list: any[] = [];
        if (res.isOriginal) {
          if (res.amendments && res.amendments.length > 0) {
            list.push(...res.amendments);
          }
        } else {
          if (res.original) {
            list.push({ ...res.original, depth: 0, title: `[Original] ${res.original.title}` });
          }
          if (res.amendments && res.amendments.length > 0) {
            res.amendments.forEach(am => {
              if (am.id !== this.circularId) {
                list.push(am);
              }
            });
          }
        }

        // Filter out duplicate IDs
        const uniqueList: any[] = [];
        const seen = new Set<number>();
        for (const item of list) {
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id);
            uniqueList.push(item);
          }
        }
        this.linkedCirculars.set(uniqueList);
      },
      error: (err) => {
        console.error('Failed to load amendment chain for comparison:', err);
      }
    });
  }

  sendSuggestedPrompt(text: string): void {
    this.inputText = text;
    this.sendMessage();
  }

  sendMessage(): void {
    const question = this.inputText.trim();
    if (!question || this.isTyping()) return;

    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: question, timestamp: new Date() },
    ]);
    this.inputText = '';
    this.isTyping.set(true);
    this.elapsedSeconds.set(0);
    this.thinkingText.set('');
    this.shouldScrollToBottom = true;

    // Start elapsed timer
    const startTime = Date.now();
    this.elapsedTimer = setInterval(() => {
      this.elapsedSeconds.set(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    this.http
      .post<{ thoughts: string; response: string }>(
        `${this.config.apiUrl}/circulars/${this.circularId}/chat`,
        { question },
      )
      .subscribe({
        next: (res) => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          this.stopTimers();
          this.isTyping.set(false);
          this.messages.update((msgs) => [
            ...msgs,
            {
              role: 'ai',
              content: res.response,
              thoughts: res.thoughts || '',
              showThoughts: false,
              elapsed,
              timestamp: new Date(),
            },
          ]);
          this.shouldScrollToBottom = true;
        },
        error: () => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          this.stopTimers();
          this.isTyping.set(false);
          this.messages.update((msgs) => [
            ...msgs,
            {
              role: 'ai',
              content: 'Sorry, I encountered an error connecting to the AI service. Please check that Ollama is running.',
              elapsed,
              timestamp: new Date(),
            },
          ]);
          this.shouldScrollToBottom = true;
        },
      });
  }

  private stopTimers(): void {
    if (this.elapsedTimer) { clearInterval(this.elapsedTimer); this.elapsedTimer = null; }
    if (this.thinkTimer) { clearInterval(this.thinkTimer); this.thinkTimer = null; }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    const c = this.circular();
    this.stopTimers();
    this.isTyping.set(false);
    this.elapsedSeconds.set(0);
    this.thinkingText.set('');
    this.messages.set(
      c
        ? [{ role: 'ai', content: `Chat cleared. I still have the full context of "${c.title}". What would you like to know?`, timestamp: new Date() }]
        : [],
    );
    this.shouldScrollToBottom = true;
  }

  goBack(): void {
    this.router.navigate(['/circulars']);
  }

  prioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warn';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  }

  onRevisedFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        this.selectedRevisedFile.set(file);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid File Type',
          detail: 'Please upload a PDF file only.',
        });
      }
    }
  }

  clearSelectedFile(): void {
    this.selectedRevisedFile.set(null);
  }

  compareStored(targetIdStr: string): void {
    const targetId = parseInt(targetIdStr, 10);
    if (isNaN(targetId) || this.isComparing() || this.isTyping()) return;

    this.isComparing.set(true);
    this.isTyping.set(true);
    this.elapsedSeconds.set(0);
    this.thinkingText.set('Retrieving and comparing stored circulars...');
    this.shouldScrollToBottom = true;

    const selected = this.linkedCirculars().find(lc => lc.id === targetId);
    const targetLabel = selected ? (selected.reference_no || selected.title) : `#${targetId}`;

    this.messages.update((msgs) => [
      ...msgs,
      {
        role: 'user',
        content: `Compare with stored circular: "${targetLabel}"`,
        timestamp: new Date(),
      },
    ]);

    const startTime = Date.now();
    this.elapsedTimer = setInterval(() => {
      this.elapsedSeconds.set(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    this.http
      .post<{ thoughts: string; response: string }>(
        `${this.config.apiUrl}/circulars/${this.circularId}/compare-stored`,
        { targetCircularId: targetId }
      )
      .subscribe({
        next: (res) => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          this.stopTimers();
          this.isComparing.set(false);
          this.isTyping.set(false);
          this.messages.update((msgs) => [
            ...msgs,
            {
              role: 'ai',
              content: res.response,
              thoughts: res.thoughts || '',
              showThoughts: false,
              elapsed,
              timestamp: new Date(),
            },
          ]);
          this.shouldScrollToBottom = true;
        },
        error: (err) => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          this.stopTimers();
          this.isComparing.set(false);
          this.isTyping.set(false);
          
          let errMsg = 'Error: Failed to perform comparison with the selected circular. Please verify that the target circular has a valid PDF file.';
          if (err?.error?.message) {
            errMsg = `Error: ${err.error.message}`;
          }

          this.messages.update((msgs) => [
            ...msgs,
            {
              role: 'ai',
              content: errMsg,
              elapsed,
              timestamp: new Date(),
            },
          ]);
          this.shouldScrollToBottom = true;
        },
      });
  }

  compareCirculars(): void {
    const file = this.selectedRevisedFile();
    if (!file || this.isComparing() || this.isTyping()) return;

    this.isComparing.set(true);
    this.isTyping.set(true);
    this.elapsedSeconds.set(0);
    this.thinkingText.set('Analyzing PDFs and extracting comparative compliance changes...');
    this.shouldScrollToBottom = true;

    // Push system/user action message to chat stream
    this.messages.update((msgs) => [
      ...msgs,
      {
        role: 'user',
        content: `Compare with revised circular: "${file.name}"`,
        timestamp: new Date(),
      },
    ]);

    const startTime = Date.now();
    this.elapsedTimer = setInterval(() => {
      this.elapsedSeconds.set(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const formData = new FormData();
    formData.append('file', file);

    this.http
      .post<{ thoughts: string; response: string }>(
        `${this.config.apiUrl}/circulars/${this.circularId}/compare`,
        formData
      )
      .subscribe({
        next: (res) => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          this.stopTimers();
          this.isComparing.set(false);
          this.isTyping.set(false);
          this.messages.update((msgs) => [
            ...msgs,
            {
              role: 'ai',
              content: res.response,
              thoughts: res.thoughts || '',
              showThoughts: false,
              elapsed,
              timestamp: new Date(),
            },
          ]);
          this.clearSelectedFile();
          this.shouldScrollToBottom = true;
        },
        error: (err) => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          this.stopTimers();
          this.isComparing.set(false);
          this.isTyping.set(false);

          let errMsg = 'Error: Failed to perform circular comparison. Please verify that the PDF is valid and the backend is running.';
          if (err?.error?.message) {
            errMsg = `Error: ${err.error.message}`;
          }

          this.messages.update((msgs) => [
            ...msgs,
            {
              role: 'ai',
              content: errMsg,
              elapsed,
              timestamp: new Date(),
            },
          ]);
          this.shouldScrollToBottom = true;
        },
      });
  }

  renderMarkdown(text: string | null | undefined): string {
    if (!text) return '';
    let html = text;

    // Normalize carriage returns: \r\n -> \n
    html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Escape basic HTML characters to avoid security risks
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Parse Bold text: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Parse headers: ### text or ## text -> <h4>text</h4>
    html = html.replace(/^(?:###|##)\s+(.*?)$/gm, '<span class="markdown-header">$1</span>');

    // Parse list items: - text or * text -> <li class="markdown-li">text</li>
    html = html.replace(/^-\s+(.*?)$/gm, '<li class="markdown-li">$1</li>');

    // Parse tables
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const outputLines: string[] = [];
    let isHeaderRow = true;

    for (let line of lines) {
      const trimmed = line.trim();
      const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');

      if (isTableRow) {
        if (trimmed.includes('---')) {
          isHeaderRow = false;
          continue;
        }
        if (!inTable) {
          inTable = true;
          tableHtml = '<div class="markdown-table-wrapper"><table class="markdown-table">';
          isHeaderRow = true;
        }
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map(cell => cell.trim());

        tableHtml += '<tr>';
        for (const cell of cells) {
          const tag = isHeaderRow ? 'th' : 'td';
          tableHtml += `<${tag}>${cell}</${tag}>`;
        }
        tableHtml += '</tr>';
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</table></div>';
          outputLines.push(tableHtml);
          tableHtml = '';
        }
        outputLines.push(line);
      }
    }
    if (inTable) {
      tableHtml += '</table></div>';
      outputLines.push(tableHtml);
    }

    return outputLines.join('\n');
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch { }
  }
}
