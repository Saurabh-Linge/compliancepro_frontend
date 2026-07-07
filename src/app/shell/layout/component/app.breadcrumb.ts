import { Component, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { filter, Subscription } from 'rxjs';
import { LayoutService } from '../service/layout.service';



@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    imports: [CommonModule, BreadcrumbModule, ButtonModule, TooltipModule],
    template: `
        <div class="breadcrumb-container" [class.no-transition]="layoutService.isSidebarResizing()">
            <div class="breadcrumb-content">
                <a (click)="navigateHome()" class="breadcrumb-home-logo">
                    <!-- <img src="assets/images/logos/kredpool_logo.png" alt="Home"> -->
                </a>
                <p-breadcrumb [model]="breadcrumbItems"></p-breadcrumb>
                
                <!-- <div class="zoom-controls"> -->
                    <!-- <p-button 
                        icon="pi pi-minus" 
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        size="small"
                        pTooltip="Zoom Out" 
                        tooltipPosition="bottom"
                        (onClick)="zoomOut()">
                    </p-button>
                     -->
                    <!-- <span class="zoom-percentage">{{ zoomPercentage() }}%</span> -->
                    
                    <!-- <p-button 
                        icon="pi pi-plus" 
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        size="small"
                        pTooltip="Zoom In" 
                        tooltipPosition="bottom"
                        (onClick)="zoomIn()">
                    </p-button>
                     -->
                    <!-- <p-button 
                        icon="pi pi-refresh" 
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        size="small"
                        pTooltip="Reset Zoom" 
                        tooltipPosition="bottom"
                        (onClick)="resetZoom()">
                    </p-button> -->
                <!-- </div> -->
            </div>
        </div>
    `,
    styles: [`
        .breadcrumb-container {
            position: fixed;
            top: 3.5rem;
            left: 0;
            right: 0;
            margin-left: var(--sidebar-width, 16rem);
            z-index: 996;
            background: var(--surface-ground);
            border-bottom: 1px solid var(--surface-border);
            padding: 0.5rem 1.5rem;
            height: 3rem;
            transition: margin-left 0.3s ease;
        }

        .breadcrumb-container.no-transition {
            transition: none !important;
        }

        .breadcrumb-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            height: 100%;
        }

        ::ng-deep .breadcrumb-container .p-breadcrumb {
            background: transparent;
            border: none;
            padding: 0;
            flex: 1;
            display: flex;
            align-items: center;
        }

        ::ng-deep .breadcrumb-container .p-breadcrumb .p-breadcrumb-list {
            background: transparent;
            display: flex;
            align-items: center;
        }

        ::ng-deep .breadcrumb-container .p-breadcrumb .p-menuitem-link {
            color: var(--text-color) !important;
            opacity: 0.8;
            transition: opacity 0.2s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
        }

        ::ng-deep .breadcrumb-container .p-breadcrumb .p-menuitem-link .p-menuitem-text {
            color: var(--text-color) !important;
            display: inline !important;
            visibility: visible !important;
        }

        ::ng-deep .breadcrumb-container .p-breadcrumb .p-menuitem-link .p-menuitem-icon {
            color: var(--text-color) !important;
            display: inline-flex !important;
            visibility: visible !important;
        }

        ::ng-deep .breadcrumb-container .p-breadcrumb .p-menuitem {
            display: flex !important;
            align-items: center !important;
        }

        ::ng-deep .breadcrumb-container .p-breadcrumb .p-menuitem-link:hover {
            opacity: 1;
            background: var(--surface-hover);
        }

        ::ng-deep .breadcrumb-container .p-breadcrumb .p-menuitem-separator {
            color: var(--text-color-secondary) !important;
            margin: 0 0.5rem;
        }

        .zoom-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .zoom-percentage {
            min-width: 3rem;
            text-align: center;
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--text-color);
            padding: 0 0.5rem;
        }

        ::ng-deep .zoom-controls .p-button {
            width: 1.75rem;
            height: 1.75rem;
        }

        ::ng-deep .zoom-controls .p-button:hover {
            background: rgba(255, 255, 255, 0.15) !important;
        }

        ::ng-deep .zoom-controls .p-button .p-button-icon {
            font-size: 0.75rem;
        }

        .breadcrumb-home-logo {
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 0.125rem 0.5rem;
            border-radius: 6px;
            transition: all 0.2s ease;

            img {
                height: 2.5rem;
                width: auto;
                object-fit: contain;
                transition: transform 0.2s ease;
            }

            &:hover {
                background: var(--surface-hover);
                
                img {
                    transform: scale(1.05);
                }
            }
        }

        /* Responsive: Remove margin when sidebar is collapsed/hidden */
        @media (min-width: 992px) {
            :host-context(.layout-overlay) .breadcrumb-container,
            :host-context(.layout-static-inactive) .breadcrumb-container {
                margin-left: 0;
            }
        }

        @media (max-width: 991px) {
            .breadcrumb-container {
                margin-left: 0;
            }
        }
    `]
})
export class AppBreadcrumb implements OnInit, OnDestroy {
    breadcrumbItems: MenuItem[] = [];
    homeItem: MenuItem = {
        icon: 'pi pi-home',
        command: () => this.router.navigate(['/'])
    };
    private routerSubscription?: Subscription;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        public layoutService: LayoutService
    ) { }

    ngOnInit() {
        this.updateBreadcrumb();
        this.routerSubscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.updateBreadcrumb());
    }

    ngOnDestroy() {
        this.routerSubscription?.unsubscribe();
    }

    navigateHome() {
        this.router.navigate(['/']);
    }

    private updateBreadcrumb() {
        const breadcrumbs: MenuItem[] = [];
        let currentRoute = this.activatedRoute.root;

        while (currentRoute.firstChild) {
            currentRoute = currentRoute.firstChild;
            const routeSnapshot = currentRoute.snapshot;
            const routeUrl = routeSnapshot.url.map(segment => segment.path).join('/');

            if (routeUrl) {
                const label = this.formatLabel(routeUrl);
                const fullPath = this.getFullPath(currentRoute);

                breadcrumbs.push({
                    label: label,
                    icon: this.getIconForRoute(routeUrl),
                    command: () => this.router.navigate([fullPath])
                });
            }
        }

        this.breadcrumbItems = breadcrumbs;
    }

    private formatLabel(path: string): string {
        return path.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    private getFullPath(route: ActivatedRoute): string {
        const segments: string[] = [];
        let current: ActivatedRoute | null = route;

        while (current) {
            const segment = current.snapshot.url.map(s => s.path).join('/');
            if (segment) segments.unshift(segment);
            current = current.parent;
        }

        return '/' + segments.join('/');
    }

    private getIconForRoute(path: string): string | undefined {
        const iconMap: { [key: string]: string } = {
            'dashboard': 'pi pi-chart-line',
            'pos': 'pi pi-shopping-cart',
            'product-master': 'pi pi-box',
            'sales': 'pi pi-dollar',
            'purchase': 'pi pi-shopping-bag',
            'inventory': 'pi pi-database',
            'reports': 'pi pi-file',
            'settings': 'pi pi-cog'
        };
        return iconMap[path];
    }


}
