import { InjectionToken } from '@angular/core';
import { Config } from './config.model';

export const APP_CONFIG = new InjectionToken<Config>('app.config');


export const DEFAULT_APP_CONFIG: Config = {
  company_uuid4: "",
  apiUrl: "",
  bank_name: ""
};