import {Component, Inject, TemplateRef} from '@angular/core';
import {changeDetection} from '@demo/emulate/change-detection';
import {encapsulation} from '@demo/emulate/encapsulation';
import {clamp, TuiDropdownPortalService} from '@taiga-ui/cdk';
import {TuiDialogContext, TuiDialogService} from '@taiga-ui/core';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';

@Component({
    selector: 'tui-dialog-example-4',
    templateUrl: './index.html',
    styleUrls: ['./index.less'],
    changeDetection,
    encapsulation,
})
export class TuiDialogExampleComponent4 {
    filters = false;

    scale = 1;

    constructor(
        @Inject(TuiDialogService) private readonly dialogService: TuiDialogService,
        @Inject(TuiDropdownPortalService)
        private readonly portalService: TuiDropdownPortalService,
    ) {}

    get transform(): string {
        return `scale(${this.scale})`;
    }

    get width(): string {
        return `calc((100% + 4rem) * ${1 / this.scale})`;
    }

    onElastic(value: number) {
        this.scale = clamp(value, 0.5, 1);
    }

    onFilterClick() {
        this.filters = true;
        this.dialogService.open('Dialog with filters').subscribe({
            complete: () => {
                this.filters = false;
            },
        });
    }

    showDialog(content: PolymorpheusContent<TuiDialogContext>, button: TemplateRef<{}>) {
        const templateRef = this.portalService.addTemplate(button);

        this.dialogService.open(content).subscribe({
            complete: () => {
                this.portalService.removeTemplate(templateRef);
            },
        });
    }
}
