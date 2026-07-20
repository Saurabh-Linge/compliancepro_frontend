import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer text-xs md:text-sm text-600">
                    <img src="assets/images/logos/kredpool_logo.png" alt="Logo" height="24px" class="mr-2" style="opacity: 0.8; filter: grayscale(100%) brightness(0.85);" />
                    <span>© {{ currentYear }} <b>KredPool Solutions Pvt Ltd.</b> All rights reserved.</span>
                </div>
`
})
export class AppFooter {
    readonly currentYear = new Date().getFullYear();
}
