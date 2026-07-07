import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // Subject to trigger search input focus
  private focusSource = new Subject<void>();

  readonly searchFocus$ = this.focusSource.asObservable();

  requestFocus() {
    console.log('[SearchService] Focus requested');
    this.focusSource.next();
  }
}
