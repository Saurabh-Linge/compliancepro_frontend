import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from './config/config.token';
import { firstValueFrom } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class OfflineTranslationService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  private currentLang = localStorage.getItem('selected_lang') || 'en';
  private originalTexts = new Map<Node, string>();
  private originalPlaceholders = new Map<HTMLInputElement | HTMLTextAreaElement, string>();
  private translationCache = new Map<string, string>();
  
  private observer: MutationObserver | null = null;
  private isTranslating = false;

  private messageService = inject(MessageService, { optional: true });
  private confirmationService = inject(ConfirmationService, { optional: true });

  constructor() {
    this.patchMessageService();
    this.patchConfirmationService();
    // Auto-apply initial language if stored and not English
    this.updateBodyClass();
    if (this.currentLang !== 'en') {
      setTimeout(() => {
        this.applyInitialLanguage();
      }, 0);
    }
  }

  private async applyInitialLanguage() {
    await this.loadDictionary(this.currentLang);
    await this.translatePage();
    this.startObserver();
  }

  private patchMessageService() {
    if (!this.messageService) return;

    const originalAdd = this.messageService.add.bind(this.messageService);
    this.messageService.add = (message: any) => {
      if (this.currentLang !== 'en' && message) {
        const summary = message.summary ? this.translateText(message.summary) : message.summary;
        const detail = message.detail ? this.translateText(message.detail) : message.detail;
        originalAdd({ ...message, summary, detail });
      } else {
        originalAdd(message);
      }
    };

    const originalAddAll = this.messageService.addAll.bind(this.messageService);
    this.messageService.addAll = (messages: any[]) => {
      if (this.currentLang !== 'en' && messages) {
        const translatedMessages = messages.map(msg => {
          const summary = msg.summary ? this.translateText(msg.summary) : msg.summary;
          const detail = msg.detail ? this.translateText(msg.detail) : msg.detail;
          return { ...msg, summary, detail };
        });
        originalAddAll(translatedMessages);
      } else {
        originalAddAll(messages);
      }
    };
  }

  private patchConfirmationService() {
    if (!this.confirmationService) return;

    const originalConfirm = this.confirmationService.confirm.bind(this.confirmationService);
    this.confirmationService.confirm = (config: any) => {
      if (this.currentLang !== 'en' && config) {
        const message = config.message ? this.translateText(config.message) : config.message;
        const header = config.header ? this.translateText(config.header) : config.header;
        const acceptLabel = config.acceptLabel ? this.translateText(config.acceptLabel) : config.acceptLabel;
        const rejectLabel = config.rejectLabel ? this.translateText(config.rejectLabel) : config.rejectLabel;
        
        return originalConfirm({ ...config, message, header, acceptLabel, rejectLabel });
      }
      return originalConfirm(config);
    };
  }

  getCurrentLanguage(): string {
    return this.currentLang;
  }

  async setLanguage(lang: string) {
    if (this.currentLang === lang) {
      localStorage.setItem('selected_lang', lang);
      return;
    }
    this.currentLang = lang;
    localStorage.setItem('selected_lang', lang);
    this.updateBodyClass();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (lang === 'en') {
      this.restoreOriginalText();
    } else {
      // 1. Load the complete dictionary from the database ONCE
      await this.loadDictionary(lang);
      
      // 2. Translate the page using the loaded dictionary
      await this.translatePage();
      
      // 3. Monitor for new elements dynamically loaded and translate them locally
      this.startObserver();
    }
  }

  private async loadDictionary(lang: string) {
    try {
      const apiUrl = `${this.config.apiUrl}/translate/all?target=${lang}`;
      const response = await firstValueFrom(
        this.http.get<Record<string, string>>(apiUrl)
      );

      this.translationCache.clear();
      for (const [english, translated] of Object.entries(response)) {
        this.translationCache.set(english.trim(), translated.trim());
      }
      console.log(`[OfflineTranslationService] Loaded ${this.translationCache.size} translations for ${lang}`);
    } catch (error) {
      console.error('[OfflineTranslationService] Failed to load translation dictionary:', error);
    }
  }

  private restoreOriginalText() {
    this.originalTexts.forEach((original, node) => {
      node.nodeValue = original;
    });
    this.originalPlaceholders.forEach((original, element) => {
      element.placeholder = original;
    });
  }

  private async translatePage() {
    if (this.isTranslating) return;
    this.isTranslating = true;
    try {
      await this.walkAndTranslate(document.body);
    } finally {
      this.isTranslating = false;
    }
  }

  private startObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (this.isTranslating || this.currentLang === 'en') return;
      this.isTranslating = true;

      const nodesToTranslate: Node[] = [];

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            nodesToTranslate.push(node);
          });
        } else if (mutation.type === 'characterData') {
          nodesToTranslate.push(mutation.target);
        }
      }

      if (nodesToTranslate.length > 0) {
        Promise.all(nodesToTranslate.map(node => this.walkAndTranslate(node)))
          .finally(() => {
            this.isTranslating = false;
          });
      } else {
        this.isTranslating = false;
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  private async walkAndTranslate(node: Node) {
    if (!node) return;

    if (this.isExcluded(node)) {
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      if (tagName === 'script' || tagName === 'style' || el.closest('.google-translate-container') || el.closest('.language-select-dropdown')) {
        return;
      }

      if (tagName === 'input' || tagName === 'textarea') {
        const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
        if (inputEl.placeholder) {
          const original = inputEl.placeholder;
          if (!this.originalPlaceholders.has(inputEl)) {
            this.originalPlaceholders.set(inputEl, original);
          }
          const translated = this.translateText(original);
          inputEl.placeholder = translated;
        }
      }
    }

    if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
      const text = node.nodeValue.trim();
      if (text.length > 1 && !/^[0-9\s,.\-():/|%&+$?_]+$/.test(text)) {
        const original = node.nodeValue;
        if (!this.originalTexts.has(node)) {
          this.originalTexts.set(node, original);
        }
        const translated = this.translateText(original);
        const leadingSpace = original.match(/^\s*/)?.[0] || '';
        const trailingSpace = original.match(/\s*$/)?.[0] || '';
        node.nodeValue = leadingSpace + translated + trailingSpace;
      }
    }

    let child = node.firstChild;
    while (child) {
      await this.walkAndTranslate(child);
      child = child.nextSibling;
    }
  }

  private translateText(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return text;
    return this.translationCache.get(trimmed) || text;
  }

  private isExcluded(node: Node): boolean {
    const parentEl = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    if (!parentEl) return false;

    const excludedSelectors = [
      '.question-card',
      '.workspace-question-panel',
      '.account-question-group',
      '.question-wise-scoring-table td',
      '.question-set',
      '.question-set-title',
      '.question-header-title',
      '.official-report-table td',
      '.assessment-observation',
      '#assessmentQuestions'
    ];

    if (parentEl.closest('[data-no-translate="true"]')) {
      return true;
    }

    for (const selector of excludedSelectors) {
      if (parentEl.closest(selector)) {
        return true;
      }
    }

    return false;
  }

  private updateBodyClass() {
    if (typeof document !== 'undefined') {
      if (this.currentLang === 'mr') {
        document.body.classList.add('lang-mr');
      } else {
        document.body.classList.remove('lang-mr');
      }
    }
  }
}
