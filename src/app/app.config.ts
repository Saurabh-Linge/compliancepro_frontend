import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling, withPreloading, PreloadAllModules, withHashLocation } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { Config } from './core/services/config/config.model';
import { APP_CONFIG, DEFAULT_APP_CONFIG } from './core/services/config/config.token';
import { environment } from '../environments/environment';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { authInterceptor } from './core/services/auth/auth.interceptor';

async function loadRuntimeConfig(url = environment.config_path): Promise<Config> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Failed to fetch runtime config, status:', res.status);
      return DEFAULT_APP_CONFIG;
    }
    const cfg = (await res.json()) as Config;
    return { ...DEFAULT_APP_CONFIG, ...cfg }; // merge with defaults
  } catch (err) {
    console.warn('Error loading runtime config:', err);
    return DEFAULT_APP_CONFIG;
  }
}

const config = await loadRuntimeConfig();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(
      routes,
      withHashLocation(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withEnabledBlockingInitialNavigation(),
      withPreloading(PreloadAllModules)
    ),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
    { provide: APP_CONFIG, useValue: config },
    MessageService,       // Global MessageService for toast notifications
    ConfirmationService,  // Global ConfirmationService for confirm dialogs
    DialogService         // Global DialogService for dynamic dialogs
  ]
};
