import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import { ButtonModule } from 'primeng/button';

interface PdfViewerData {
  blob: Blob;
  filename: string;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="pdf-toolbar no-print">
      <p-button label="Download PDF" icon="pi pi-download" (click)="download()" severity="success"></p-button>
      <p-button label="Close" icon="pi pi-times" (click)="close()" severity="secondary"></p-button>
    </div>
    <iframe *ngIf="safeUrl()" 
      [src]="safeUrl()" 
      class="pdf-iframe"
      title="PDF Viewer"></iframe>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 90vh; 
      overflow: hidden;
      background: #f4f4f4;
    }
    .pdf-toolbar {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 12px 20px;
      background: white;
      border-bottom: 1px solid #ddd;
    }
    .pdf-iframe {
      flex: 1;
      width: 100%;
      border: none;
      display: block;
    }
  `]
})
export class PdfViewerComponent implements OnDestroy {
  private drawerRef = inject(FormDrawerRef<any, PdfViewerData>);
  private sanitizer = inject(DomSanitizer);

  safeUrl = signal<SafeResourceUrl | null>(null);
  private rawUrl: string | null = null;

  constructor() {
    const data = this.drawerRef.data;
    if (data?.blob) {
      this.rawUrl = URL.createObjectURL(data.blob);
      this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.rawUrl));
    }
  }

  download() {
    const data = this.drawerRef.data;
    if (this.rawUrl && data?.filename) {
      const link = document.createElement('a');
      link.href = this.rawUrl;
      link.download = data.filename;
      link.click();
    }
  }

  close() {
    this.drawerRef.close();
  }

  ngOnDestroy() {
    if (this.rawUrl) {
      URL.revokeObjectURL(this.rawUrl);
    }
  }
}
