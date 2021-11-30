import { AfterContentInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { SliderConfiguration, SliderEvent } from '@pslwcl/pslmodel';
import * as merge from 'deepmerge';

declare const $: any;

/**
 * Component
 *  gestione slider
 */
@Component({
  selector: 'pslshare-slider',
  templateUrl: './slider.component.html'
})
export class SliderComponent implements AfterContentInit, OnDestroy, OnChanges {
  static watchedProperties = ['from', 'to', 'min'];

  @Input() sliderConfig: SliderConfiguration;
  @Input() from: number;
  @Input() to: number;
  @Input() min: number;

  @Output() sliderEnd: EventEmitter<{from: number, to: number}> = new EventEmitter<{from: number, to: number}>();

  private currentConfig: SliderConfiguration;

  baseConfig: SliderConfiguration = {
    onFinish: e => this.onHandleFinish(e)
  };

  private instance: any;

  constructor(
    private readonly elementRef: ElementRef,
    private readonly ngZone: NgZone
  ) {}

  ngAfterContentInit(): void {
    const elt = this.elementRef.nativeElement.children[0];
    this.currentConfig = merge.all([
      this.baseConfig,
      this.sliderConfig,
      {
        from: this.from || this.sliderConfig.min,
        to: this.to || this.sliderConfig.max,
        from_min: this.min || this.sliderConfig.min,
        to_min: this.min || this.sliderConfig.min
      }
    ]);
    this.ngZone.runOutsideAngular(() => {
      const jQueryInstance = $(elt).ionRangeSlider(this.currentConfig);
      this.instance = jQueryInstance.data('ionRangeSlider');
    });
  }
  ngOnDestroy(): void {
    this.ngZone.runOutsideAngular(() =>
      this.instance.destroy()
    );
  }
  ngOnChanges(changes: SimpleChanges): void {
    const mustUpdate = SliderComponent.watchedProperties.reduce((acc, el) => this.mustUpdate(changes[el]) || acc, false);
    if (mustUpdate) {
      this.ngZone.runOutsideAngular(() => {
        this.currentConfig = merge(
          this.currentConfig, {
            from: changes.from ? changes.from.currentValue : this.currentConfig.from,
            from_min: changes.min ? changes.min.currentValue : this.currentConfig.from_min,
            to: changes.to ? changes.to.currentValue : this.currentConfig.to,
            to_min: changes.min ? changes.min.currentValue : this.currentConfig.to_min,
          }
        );
        this.instance.update(this.currentConfig);
      });
    }
  }

  private onHandleFinish(e: SliderEvent): void {
    this.sliderEnd.emit({from: e.from, to: e.to});
  }

  private mustUpdate(change: SimpleChange): boolean {
    return change && !change.isFirstChange() && change.currentValue !== change.previousValue;
  }

}
