import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `
    <ul class="layout-menu">
      <ng-container *ngFor="let item of model; let i = index">
        <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
        <li *ngIf="item.separator" class="menu-separator"></li>
      </ng-container>
    </ul>
  `,
})
export class AppMenu implements OnInit {
  model: MenuItem[] = [];

  ngOnInit(): void {
    let user: any = {};
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      console.warn('Invalid user JSON in menu:', e);
    }
    const userRole = String(user.role || '').toLowerCase();

    const menu: MenuItem[] = [];

    // 1. GENERAL Section
    const generalItems: MenuItem[] = [];
    generalItems.push({ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/home'] });

    if (['admin', 'co', 'cco'].includes(userRole)) {
      generalItems.push({
        label: 'Reports',
        icon: 'pi pi-fw pi-file',
        routerLink: ['/reports']
      });
    }

    menu.push({
      label: 'GENERAL',
      items: generalItems
    });

    // 2. COMPLIANCE Section
    const complianceItems: MenuItem[] = [];

    if (userRole === 'cco') {
      // CCO Review Queue
      complianceItems.push({ label: 'CCO Review Queue', icon: 'pi pi-fw pi-shield', routerLink: ['/cco-review'] });
    } else if (userRole === 'co') {
      // CO Review Queue
      complianceItems.push({ label: 'CO Review Queue', icon: 'pi pi-fw pi-check-circle', routerLink: ['/co-review'] });
    } else if (['branch', 'branch_user', 'department'].includes(userRole)) {
      complianceItems.push({ label: 'My Assignments', icon: 'pi pi-fw pi-briefcase', routerLink: ['/assignments'] });
    }

    if (complianceItems.length > 0) {
      menu.push({
        label: 'COMPLIANCE',
        items: complianceItems
      });
    }

    // 3. MASTERS Section
    const masterItems: MenuItem[] = [];

    if (['admin', 'cco', 'co'].includes(userRole)) {
      masterItems.push({ label: 'Authority Master', icon: 'pi pi-fw pi-building', routerLink: ['/admin/authorities'] });
    }

    if (['admin', 'cco', 'co'].includes(userRole)) {
      masterItems.push({
        label: 'Circular Master',
        icon: 'pi pi-fw pi-file-pdf',
        items: [
          { label: 'Circular List', icon: 'pi pi-fw pi-list', routerLink: ['/circulars'] },
          {
            label: 'Task Master',
            icon: 'pi pi-fw pi-check-square',
            routerLink: ['/tasks'],
            routerLinkActiveOptions: { paths: 'exact', queryParams: 'exact', matrixParams: 'ignored', fragment: 'ignored' }
          },
          { label: 'Task Header Master', icon: 'pi pi-fw pi-tags', routerLink: ['/admin/task-headers'] },
          {
            label: 'Task Set Master',
            icon: 'pi pi-fw pi-server',
            routerLink: ['/task-sets'],
            routerLinkActiveOptions: { paths: 'exact', queryParams: 'exact', matrixParams: 'ignored', fragment: 'ignored' }
          }
        ]
      });
    }

    if (userRole === 'admin') {
      masterItems.push({ label: 'Branch and Department Master', icon: 'pi pi-fw pi-map-marker', routerLink: ['/admin/branches'] });
      masterItems.push({ label: 'Users Master', icon: 'pi pi-fw pi-users', routerLink: ['/admin/users'] });
      masterItems.push({ label: 'Manage Assignments', icon: 'pi pi-fw pi-calendar-times', routerLink: ['/admin/manage-assignments'] });
    }

    if (masterItems.length > 0) {
      menu.push({
        label: 'MASTERS',
        items: masterItems
      });
    }

    this.model = menu;
  }
}

