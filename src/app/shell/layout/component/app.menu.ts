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
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = String(user.role || '').toLowerCase();

    const menu: MenuItem[] = [
      {
        label: 'Home',
        items: [
          { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/home'] }
        ]
      }
    ];

    const complianceItems: any[] = [];
    
    // 1. Circulars Submenu
    const circularSubItems: any[] = [];
    if (['admin', 'co', 'cco'].includes(userRole)) {
      circularSubItems.push({ label: 'All Circulars', icon: 'pi pi-fw pi-list', routerLink: ['/circulars'] });
    }
    if (userRole === 'admin') {
      circularSubItems.push({ label: 'Authorities Master', icon: 'pi pi-fw pi-building', routerLink: ['/admin/authorities'] });
    }

    // 2. Tasks Submenu
    const taskSubItems: any[] = [];
    if (['admin', 'co', 'cco'].includes(userRole)) {
      taskSubItems.push({ label: 'All Tasks', icon: 'pi pi-fw pi-list', routerLink: ['/tasks'] });
      taskSubItems.push({ label: 'Task Sets Master', icon: 'pi pi-fw pi-server', routerLink: ['/task-sets'] });
    }
    if (userRole === 'co') {
      taskSubItems.push({ label: 'Compliances', icon: 'pi pi-fw pi-briefcase', routerLink: ['/assignments'] });
      taskSubItems.push({ label: 'CO Review Queue', icon: 'pi pi-fw pi-check-circle', routerLink: ['/co-review'] });
    }
    if (userRole === 'cco') {
      taskSubItems.push({ label: 'CCO Review Queue', icon: 'pi pi-fw pi-shield', routerLink: ['/cco-review'] });
    }
    if (userRole === 'admin') {
      taskSubItems.push({ label: 'Task Headers Master', icon: 'pi pi-fw pi-tags', routerLink: ['/admin/task-headers'] });
    }

    // 3. Assemble Compliance Menu
    if (circularSubItems.length > 0) {
      complianceItems.push({
        label: 'Circulars',
        icon: 'pi pi-fw pi-file-pdf',
        items: circularSubItems
      });
    }
    
    if (taskSubItems.length > 0) {
      complianceItems.push({
        label: 'Tasks',
        icon: 'pi pi-fw pi-check-square',
        items: taskSubItems
      });
    }

    if (['branch', 'branch_user'].includes(userRole)) {
      complianceItems.push({ label: 'My Assignments', icon: 'pi pi-fw pi-briefcase', routerLink: ['/assignments'] });
    }

    if (complianceItems.length > 0) {
      menu.push({
        label: 'Compliance',
        icon: 'pi pi-fw pi-briefcase',
        items: complianceItems
      });
    }

    // 4. Admin Menu
    if (userRole === 'admin') {
      menu.push({
        label: 'Administration',
        items: [
          { label: 'Branch and Department Master', icon: 'pi pi-fw pi-map-marker', routerLink: ['/admin/branches'] },
          { label: 'Users Master', icon: 'pi pi-fw pi-users', routerLink: ['/admin/users'] }
        ]
      });
    }

    this.model = menu;
  }
}
