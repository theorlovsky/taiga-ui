import {
    ComponentFactory,
    ComponentRef,
    EmbeddedViewRef,
    Injectable,
    Injector,
    TemplateRef,
} from '@angular/core';
import {TuiNoHostException} from '@taiga-ui/cdk/exceptions';

import {AbstractTuiPortalHostComponent} from './portal-host';

/**
 * Abstract service for displaying portals
 */
@Injectable()
export abstract class AbstractTuiPortalService {
    protected host?: AbstractTuiPortalHostComponent;

    protected get safeHost(): AbstractTuiPortalHostComponent {
        if (!this.host) {
            throw new TuiNoHostException();
        }

        return this.host;
    }

    attach(host: AbstractTuiPortalHostComponent) {
        this.host = host;
    }

    add<C>(componentFactory: ComponentFactory<C>, injector: Injector): ComponentRef<C> {
        return this.safeHost.addComponentChild(componentFactory, injector);
    }

    remove<C>({hostView}: ComponentRef<C>) {
        hostView.destroy();
    }

    addTemplate<C>(templateRef: TemplateRef<C>, context?: C): EmbeddedViewRef<C> {
        return this.safeHost.addTemplateChild(templateRef, context);
    }

    removeTemplate<C>(viewRef: EmbeddedViewRef<C>) {
        viewRef.destroy();
    }
}
