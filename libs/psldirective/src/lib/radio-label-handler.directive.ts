import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[pslwcllibRadioLabelHandler]'
})
export class RadioLabelHandlerDirective implements OnInit {

  @Input('pslwcllibRadioLabelHandler') reference: HTMLElement;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    setTimeout(() => this.handleSelection());
  }

  @HostListener('change')
  private handleSelection() {
    if (this.el.nativeElement.querySelectorAll('input[type="radio"]:checked').length) {
      this.renderer.addClass(this.reference, 'with-data');
    } else {
      this.renderer.removeClass(this.reference, 'with-data');
    }
  }
}
