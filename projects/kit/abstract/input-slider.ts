import {Directive, HostBinding, Input} from '@angular/core';
import {
    AbstractTuiControl,
    clamp,
    round,
    tuiDefaultProp,
    TuiInputModeT,
    TuiMapper,
    tuiPure,
} from '@taiga-ui/cdk';
import {
    maskedNumberStringToNumber,
    NumberFormatSettings,
    tuiCreateAutoCorrectedNumberPipe,
    tuiCreateNumberMask,
    TuiPluralize,
    tuiPluralizeToICU,
    TuiSizeL,
    TuiTextMaskOptions,
    TuiWithOptionalMinMax,
} from '@taiga-ui/core';
import {tuiEnableAutoCorrectDecimalSymbol} from '@taiga-ui/core/utils';
import {TUI_FLOATING_PRECISION} from '@taiga-ui/kit/constants';
import {TuiKeySteps} from '@taiga-ui/kit/types';
import {getPrecision} from '@taiga-ui/kit/utils';
import {TextMaskConfig} from 'angular2-text-mask';

export function quantumAssertion(quantum: number): boolean {
    return quantum > 0;
}

/**
 * @internal
 * @deprecated TODO delete me after `InputSlider` and `InputRange` stop using it
 */
@Directive()
export abstract class AbstractTuiInputSlider<T>
    extends AbstractTuiControl<T>
    implements TuiWithOptionalMinMax<number>
{
    protected abstract readonly numberFormat: NumberFormatSettings;

    @Input()
    @tuiDefaultProp()
    min = 0;

    @Input()
    @tuiDefaultProp()
    max = Infinity;

    @Input()
    @tuiDefaultProp()
    minLabel = '';

    @Input()
    @tuiDefaultProp()
    maxLabel = '';

    // TODO: remove setter in v3.0:
    @Input()
    @tuiDefaultProp()
    set pluralize(pluralize: TuiPluralize | Record<string, string> | null) {
        this.pluralizeMap = Array.isArray(pluralize)
            ? tuiPluralizeToICU(pluralize)
            : pluralize;
    }

    /**
     * @deprecated This input-property will be deleted in next major update.
     * You can create ticks labels below this input by yourself. It is easy!
     * Mixin `tui-slider-ticks-labels` will help with it. See examples in demo page `InputSlider`.
     * ___
     * TODO remove in v3.0.
     * Dont forget to delete:
     *** {@link segmentsPluralizeMap}
     *** {@link getTickPrefix}
     *** TuiFormatNumberPipeModule
     *** TuiRepeatTimesModule
     */
    @Input()
    @tuiDefaultProp()
    set segmentsPluralize(pluralize: TuiPluralize | Record<string, string> | null) {
        this.segmentsPluralizeMap = Array.isArray(pluralize)
            ? tuiPluralizeToICU(pluralize)
            : pluralize;
    }

    @Input()
    @tuiDefaultProp()
    segments = 0;

    @Input()
    @tuiDefaultProp()
    steps = 0;

    @Input()
    @tuiDefaultProp(quantumAssertion, 'Quantum must be positive')
    quantum = 1;

    @Input()
    @tuiDefaultProp()
    keySteps: TuiKeySteps | null = null;

    @Input()
    @HostBinding('attr.data-size')
    size: TuiSizeL = 'l';

    pluralizeMap: Record<string, string> | null = null;
    /** @deprecated TODO remove in v3.0 */
    segmentsPluralizeMap: Record<string, string> | null = null;
    /** @deprecated TODO remove in v3.0 */
    readonly pluralizeMapFallback = {
        one: '',
        few: '',
        many: '',
        other: '',
    };

    /** @deprecated TODO remove in v3.0 */
    @tuiPure
    getTickPrefix(segment: number, segments: number, texts: [string, string]): string {
        if (segments !== 1) {
            return '';
        }

        return segment === 0 ? `${texts[0]}` : `${texts[1]}`;
    }

    mask: TuiMapper<number, TextMaskConfig> = (quantum: number, min: number) =>
        ({
            mask: tuiCreateNumberMask({
                allowNegative: min < 0,
                allowDecimal: !Number.isInteger(quantum),
                decimalSymbol: this.numberFormat.decimalSeparator,
                thousandSymbol: this.numberFormat.thousandSeparator,
                decimalLimit: getPrecision(quantum),
                autoCorrectDecimalSymbol: tuiEnableAutoCorrectDecimalSymbol(
                    this.numberFormat,
                ),
            }),
            pipe: tuiCreateAutoCorrectedNumberPipe(
                0,
                this.numberFormat.decimalSeparator,
                this.numberFormat.thousandSeparator,
                undefined,
                min < 0,
            ),
            guide: false,
        } as TuiTextMaskOptions as unknown as TextMaskConfig);

    @HostBinding('class._segmented')
    get segmented(): boolean {
        return this.segments > 0;
    }

    get hasPlaceholder(): boolean {
        return this.size === 'l';
    }

    get inputMode(): TuiInputModeT {
        return Number.isInteger(this.quantum) ? 'numeric' : 'decimal';
    }

    get length(): number {
        return this.max - this.min;
    }

    get computedSteps(): number {
        return this.steps || this.length / this.quantum;
    }

    get step(): number {
        return this.length / this.computedSteps;
    }

    get computedKeySteps(): TuiKeySteps {
        return this.computePureKeySteps(this.keySteps, this.min, this.max);
    }

    onHovered(hovered: boolean) {
        this.updateHovered(hovered);
    }

    protected valueGuard(value: number): number {
        return this.quantum
            ? clamp(
                  round(
                      Math.round(value / this.quantum) * this.quantum,
                      TUI_FLOATING_PRECISION,
                  ),
                  this.min,
                  this.max,
              )
            : clamp(value, this.min, this.max);
    }

    protected capInputValue(value: string, max: number = this.max): number | null {
        const capped = Math.min(
            maskedNumberStringToNumber(
                value,
                this.numberFormat.decimalSeparator,
                this.numberFormat.thousandSeparator,
            ),
            max,
        );

        if (this.min < 0 && capped < this.min) {
            return this.min;
        }

        return isNaN(capped) || capped < this.min ? null : capped;
    }

    @tuiPure
    private computePureKeySteps(
        keySteps: TuiKeySteps | null,
        min: number,
        max: number,
    ): TuiKeySteps {
        return [[0, min], ...(keySteps || []), [100, max]];
    }
}
