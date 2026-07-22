import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
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
  isTaskGeneration?: boolean;
}

const SUGGESTED_PROMPTS: { label: string; icon: string; text: string }[] = [
  {
    label: 'Generate Tasks',
    icon: 'pi pi-cog',
    text: 'Extract a clean list of actionable compliance tasks from this circular that need to be performed. Provide them as clear, concrete action items.',
  },
  {
    label: 'Summary',
    icon: 'pi pi-align-left',
    text: 'Please provide a comprehensive summary of this circular. Outline the key requirements, the target departments, the effective date, and any primary reporting mandates.',
  },
  {
    label: 'Translation',
    icon: 'pi pi-language',
    text: 'Please translate the core requirements and directives of this circular into Marathi, ensuring all critical regulatory and compliance instructions are translated accurately.',
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
    DialogModule,
    ToastModule,
  ],
  templateUrl: './circular-chat.component.html',
  styleUrl: './circular-chat.component.css'
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
  selectedTargetCircular = signal<any | null>(null);
  showDropdown = signal<boolean>(false);

  searchQuery = signal<string>('');
  searchResults = signal<any[]>([]);
  isSearching = signal<boolean>(false);
  private searchTimeout: any = null;

  readonly suggestedPrompts = SUGGESTED_PROMPTS;

  private circularId!: number;
  private pendingIsTaskPrompt = false;
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

  sendSuggestedPrompt(prompt: any): void {
    this.inputText = prompt.text;
    const isTaskPrompt = prompt.label === 'Generate Tasks';
    this.sendMessage(isTaskPrompt);
  }

  sendMessage(isTaskPrompt: boolean = false): void {
    const question = this.inputText.trim();
    if (!question || this.isTyping()) return;

    this.pendingIsTaskPrompt = isTaskPrompt;

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
          const isTaskGen = this.pendingIsTaskPrompt;
          this.messages.update((msgs) => [
            ...msgs,
            {
              role: 'ai',
              content: res.response,
              thoughts: res.thoughts || '',
              showThoughts: false,
              elapsed,
              timestamp: new Date(),
              isTaskGeneration: isTaskGen,
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

  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.showDropdown.set(true);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.searchOtherCirculars();
    }, 300);
  }

  selectCircular(c: any): void {
    this.selectedTargetCircular.set(c);
    this.selectedTargetId.set(String(c.id));
    this.showDropdown.set(false);
  }

  clearSelectedTarget(): void {
    this.selectedTargetCircular.set(null);
    this.selectedTargetId.set('');
  }

  isTargetSelected(id: number): boolean {
    return this.selectedTargetId() === String(id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    if (!el.closest('.comparator-card')) {
      this.showDropdown.set(false);
    }
  }

  searchOtherCirculars(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    this.api.getCirculars({ limit: 15, search: query }).subscribe({
      next: (res) => {
        this.isSearching.set(false);
        const filtered = (res.data || []).filter((c: any) => c.id !== this.circularId);
        this.searchResults.set(filtered);
      },
      error: (err) => {
        this.isSearching.set(false);
        console.error('Failed to search circulars:', err);
      }
    });
  }

  compareStored(targetIdStr: string): void {
    const targetId = parseInt(targetIdStr, 10);
    if (isNaN(targetId) || this.isComparing() || this.isTyping()) return;

    this.isComparing.set(true);
    this.isTyping.set(true);
    this.elapsedSeconds.set(0);
    this.thinkingText.set('Retrieving and comparing stored circulars...');
    this.shouldScrollToBottom = true;

    const selected = this.linkedCirculars().find(lc => lc.id === targetId) || this.searchResults().find(c => c.id === targetId);
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
          this.clearSelectedTarget();
          this.searchQuery.set('');
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

  loadingExtractionMap: { [timestampKey: number]: boolean } = {};
  showPreviewDialog = signal<boolean>(false);
  previewTasks = signal<{ description: string; checked: boolean }[]>([]);
  savingTasks = signal<boolean>(false);

  shouldShowImportButton(msg: ChatMessage, index: number): boolean {
    if (!msg || msg.role !== 'ai') return false;
    if (msg.isTaskGeneration) return true;

    if (index > 0) {
      const prevMsg = this.messages()[index - 1];
      if (prevMsg && prevMsg.role === 'user') {
        const text = prevMsg.content || '';
        const lowerText = text.toLowerCase();
        if (
          lowerText.includes('compliance tasks') ||
          lowerText.includes('generate tasks') ||
          lowerText.includes('extract a clean list')
        ) {
          return true;
        }
      }
    }
    return false;
  }

  extractAndPreviewTasks(msg: ChatMessage): void {
    const key = msg.timestamp.getTime();
    this.loadingExtractionMap[key] = true;

    this.api.extractTasksFromText(msg.content).subscribe({
      next: (res) => {
        this.loadingExtractionMap[key] = false;
        this.previewTasks.set(res.tasks.map(t => ({ description: t, checked: true })));
        this.showPreviewDialog.set(true);
      },
      error: (err) => {
        this.loadingExtractionMap[key] = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Extraction Failed',
          detail: 'Could not extract tasks from this message.',
          life: 4000
        });
        console.error(err);
      }
    });
  }

  selectAllPreview(checked: boolean): void {
    this.previewTasks.update(tasks => tasks.map(t => ({ ...t, checked })));
  }

  addNewPreviewTask(): void {
    this.previewTasks.update(tasks => [
      ...tasks,
      { description: 'New custom task description...', checked: true }
    ]);
  }

  togglePreviewTaskChecked(index: number): void {
    this.previewTasks.update(tasks => tasks.map((t, i) => i === index ? { ...t, checked: !t.checked } : t));
  }

  updatePreviewTaskDescription(index: number, newDesc: string): void {
    this.previewTasks.update(tasks => tasks.map((t, i) => i === index ? { ...t, description: newDesc } : t));
  }

  removePreviewTask(index: number): void {
    this.previewTasks.update(tasks => tasks.filter((_, i) => i !== index));
  }

  getCheckedPreviewCount(): number {
    return this.previewTasks().filter(t => t.checked).length;
  }

  savePreviewedTasks(): void {
    const selected = this.previewTasks().filter(t => t.checked && t.description.trim().length > 0);
    if (selected.length === 0) return;

    this.savingTasks.set(true);
    this.api.createBulkTasks(this.circularId, selected.map(s => ({ description: s.description }))).subscribe({
      next: () => {
        this.savingTasks.set(false);
        this.showPreviewDialog.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Import Successful',
          detail: `Successfully imported ${selected.length} tasks to Task Master.`,
          life: 3000
        });
      },
      error: (err) => {
        this.savingTasks.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Import Failed',
          detail: 'Failed to save tasks to Task Master. Please try again.',
          life: 4000
        });
        console.error(err);
      }
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch { }
  }
}
