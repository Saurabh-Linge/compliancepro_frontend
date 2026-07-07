import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
                    <img src="assets/images/gmpl_wings_logo.png" alt="Logo" height="40px" class="mr-2"/>
                    by
                    <span class="font-medium ml-2">KredPool Solution Pvt Ltd</span>
                </div>
`
})
export class AppFooter { }
