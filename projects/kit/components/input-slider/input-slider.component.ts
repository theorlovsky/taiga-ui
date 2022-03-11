import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Directive,
    ElementRef,
    forwardRef,
    Inject,
    Input,
    Optional,
    Self,
    ViewChild,
} from '@angular/core';
import {NgControl} from '@angular/forms';
import {
    clamp,
    isNativeFocused,
    round,
    setNativeFocused,
    TUI_FOCUSABLE_ITEM_ACCESSOR,
    tuiAssert,
    TuiContextWithImplicit,
    tuiDefaultProp,
    TuiFocusableElementAccessor,
    TuiNativeFocusableElement,
    tuiPure,
} from '@taiga-ui/cdk';
import {
    getFractionPartPadded,
    HINT_CONTROLLER_PROVIDER,
    NumberFormatSettings,
    TEXTFIELD_CONTROLLER_PROVIDER,
    TUI_NUMBER_FORMAT,
    TUI_TEXTFIELD_WATCHED_CONTROLLER,
    TuiDecimalT,
    TuiSizeL,
    TuiTextfieldController,
} from '@taiga-ui/core';
import {AbstractTuiInputSlider} from '@taiga-ui/kit/abstract';
import {TuiInputNumberComponent} from '@taiga-ui/kit/components/input-number';
import {
    TuiSliderComponent,
    tuiSliderOptionsProvider,
} from '@taiga-ui/kit/components/slider';
import {TUI_FLOATING_PRECISION} from '@taiga-ui/kit/constants';
import {TUI_FROM_TO_TEXTS} from '@taiga-ui/kit/tokens';
import {TuiKeySteps} from '@taiga-ui/kit/types';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';
import {Observable} from 'rxjs';

/**
 * Turn on new `InputSlider`'s version.
 * The new version will behave almost the same as `InputSlider` from the next major release.
 * @deprecated TODO remove me in v3.0 and make `InputSlider` always "new".
 */
@Directive({
    selector: 'tui-input-slider[new]',
})
export class TuiNewInputSliderDirective {}

// @dynamic
@Component({
    selector: 'tui-input-slider',
    templateUrl: './input-slider.template.html',
    styleUrls: ['./input-slider.style.less'],
    host: {
        /**
         * TODO delete it in v3.0
         * Dont forget to clear html-tags
         */
        '[class._show-ticks-labels]': '!isNew',
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: TUI_FOCUSABLE_ITEM_ACCESSOR,
            useExisting: forwardRef(() => TuiInputSliderComponent),
        },
        tuiSliderOptionsProvider({trackColor: 'transparent'}),
        HINT_CONTROLLER_PROVIDER,
        TEXTFIELD_CONTROLLER_PROVIDER,
    ],
})
/**
 * TODO replace `extends AbstractTuiInputSlider<number>` by `extends AbstractTuiControl<number> implements TuiWithOptionalMinMax<number>`
 * in v3.0
 */
export class TuiInputSliderComponent
    extends AbstractTuiInputSlider<number>
    implements TuiFocusableElementAccessor
{
    @ViewChild(TuiInputNumberComponent)
    private readonly inputNumberRef?: TuiInputNumberComponent;

    @ViewChild(TuiSliderComponent, {read: ElementRef})
    private readonly sliderRef?: ElementRef<HTMLInputElement>;

    @Input()
    @tuiDefaultProp()
    min = 0;

    @Input()
    @tuiDefaultProp()
    max = Infinity;

    @Input()
    @tuiDefaultProp(quantumAssertion, 'Quantum must be positive')
    quantum = 1;

    @Input()
    @tuiDefaultProp()
    steps = 0;

    @Input()
    @tuiDefaultProp()
    segments = 0;

    @Input()
    @tuiDefaultProp()
    keySteps: TuiKeySteps | null = null;

    @Input()
    @tuiDefaultProp()
    valueContent: PolymorpheusContent<TuiContextWithImplicit<number>> = '';

    @Input()
    @tuiDefaultProp()
    prefix = '';

    @Input()
    @tuiDefaultProp()
    postfix = '';

    /**
     * @deprecated use `tuiTextfieldSize` instead
     * TODO delete in v3.0
     */
    @Input()
    @tuiDefaultProp()
    size: TuiSizeL = 'l';

    /**
     * @deprecated use `tuiTextfieldCustomContent` instead
     * TODO delete in v3.0
     */
    @Input()
    @tuiDefaultProp()
    secondary = '';

    constructor(
        @Optional()
        @Self()
        @Inject(NgControl)
        control: NgControl | null,
        @Inject(ChangeDetectorRef) changeDetectorRef: ChangeDetectorRef,
        @Inject(TUI_TEXTFIELD_WATCHED_CONTROLLER)
        readonly controller: TuiTextfieldController,
        @Inject(TUI_NUMBER_FORMAT)
        protected readonly numberFormat: NumberFormatSettings,
        @Inject(TUI_FROM_TO_TEXTS) readonly fromToTexts$: Observable<[string, string]>,
        @Optional()
        @Inject(TuiNewInputSliderDirective)
        readonly isNew: TuiNewInputSliderDirective | null,
    ) {
        super(control, changeDetectorRef);
    }

    get nativeFocusableElement(): TuiNativeFocusableElement | null {
        return !this.inputNumberRef?.nativeFocusableElement || this.computedDisabled
            ? null
            : this.inputNumberRef.nativeFocusableElement;
    }

    get focused(): boolean {
        return (
            isNativeFocused(this.nativeFocusableElement) ||
            isNativeFocused(this.sliderRef?.nativeElement || null)
        );
    }

    get computedSteps(): number {
        return this.steps || (this.max - this.min) / this.quantum;
    }

    get precision(): number {
        return getFractionPartPadded(this.quantum).length;
    }

    get decimal(): TuiDecimalT {
        return this.precision ? 'not-zero' : 'never';
    }

    /**
     * TODO remove old property `size` in v3.0
     */
    get computedSize(): TuiSizeL {
        if (this.isNew) {
            tuiAssert.assert(
                this.controller.size !== 's',
                "Size 's' is not supported by this input.",
            );

            return this.controller.size === 'l' ? 'l' : 'm';
        }

        return this.size;
    }

    /**
     * @deprecated for backward compatibility
     * TODO replace by just `this.valueContent` in v3.0
     */
    get computedValueContent(): PolymorpheusContent<TuiContextWithImplicit<number>> {
        return this.minLabel || this.maxLabel
            ? legacyMinMaxLabel(this)
            : this.valueContent;
    }

    @tuiPure
    computeContext(value: number): TuiContextWithImplicit<number> {
        return {$implicit: value};
    }

    focusTextInput() {
        const focusableElement = this.inputNumberRef?.nativeFocusableElement;

        if (focusableElement) {
            setNativeFocused(focusableElement);
        }
    }

    onVerticalArrowKeyDown(coefficient: number) {
        if (this.readOnly) {
            return;
        }

        const value = this.valueGuard(this.value + coefficient * this.step);

        if (value !== this.value) {
            this.updateValue(value);
        }

        if (this.inputNumberRef) {
            this.inputNumberRef.nativeValue =
                this.inputNumberRef.getFormattedValue(value);
        }
    }

    onValue(value: number) {
        this.updateValue(this.valueGuard(value));
    }

    protected getFallbackValue(): number {
        return 0;
    }

    protected valueGuard(value: number): number {
        const correctedValue = Number.isInteger(value)
            ? value
            : round(
                  Math.round(value / this.quantum) * this.quantum,
                  TUI_FLOATING_PRECISION,
              );

        return clamp(correctedValue, this.min, this.max);
    }
}

function quantumAssertion(quantum: number): boolean {
    return quantum > 0;
}

/**
 * @deprecated helper for backward compatibility.
 * TODO remove in v3.0
 */
function legacyMinMaxLabel({min, max, minLabel, maxLabel}: TuiInputSliderComponent) {
    return ({$implicit: value}: TuiContextWithImplicit<number>) => {
        switch (value) {
            case min:
                return minLabel || value;
            case max:
                return maxLabel || value;
            default:
                return value;
        }
    };
}
