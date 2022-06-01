import {HostTree} from '@angular-devkit/schematics';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';

import {
    createProject,
    createSourceFile,
    resetActiveProject,
    saveActiveProject,
    setActiveProject,
} from 'ng-morph';
import {join} from 'path';

const collectionPath = join(__dirname, '../../migration.json');

const BEFORE = `import { Component } from '@angular/core';
import { TuiPortalService } from '@taiga-ui/cdk';
import { TuiNotificationService } from '@taiga-ui/core';

function(service: TuiNotificationService) {
    service
    .show().subscribe();

    let open = getService().show();
}

function getService(): TuiNotificationService {
    return new TuiNotificationService();
}

@Component({templateUrl: './app.template.html'})
export class AppComponent {
    constructor(
      @Inject(TuiPortalService) portalService: TuiPortalService;
      @Inject(TuiNotificationService) private notificationService: TuiNotificationService;
    ) {
      notificationService.show(arg, arg2);
    }

    method(): void {
        this.notificationService.show(arg, arg2).subscribe();
    }
}`;

const AFTER = `import { TuiDropdownPortalService, TuiAlertService } from "@taiga-ui/cdk";
import { Component } from '@angular/core';

function(service: TuiAlertService) {
    service
    .open().subscribe();

    let open = getService().open();
}

function getService(): TuiAlertService {
    return new TuiAlertService();
}

@Component({templateUrl: './app.template.html'})
export class AppComponent {
    constructor(
      @Inject(TuiDropdownPortalService) portalService: TuiDropdownPortalService;
      @Inject(TuiAlertService) private notificationService: TuiAlertService;
    ) {
      notificationService.open(arg, arg2);
    }

    method(): void {
        this.notificationService.open(arg, arg2).subscribe();
    }
}`;

describe('ng-update', () => {
    let host: UnitTestTree;
    let runner: SchematicTestRunner;

    beforeEach(() => {
        host = new UnitTestTree(new HostTree());
        runner = new SchematicTestRunner('schematics', collectionPath);

        setActiveProject(createProject(host));

        createMainFiles();

        saveActiveProject();
    });

    it('should replace services', async () => {
        const tree = await runner.runSchematicAsync('updateToV3', {}, host).toPromise();

        expect(tree.readContent('test/app/app.component.ts')).toEqual(AFTER);
    });

    afterEach(() => {
        resetActiveProject();
    });
});

function createMainFiles(): void {
    createSourceFile('test/app/app.component.ts', BEFORE);

    createSourceFile('test/app/app.template.html', `<app></app>`);
}