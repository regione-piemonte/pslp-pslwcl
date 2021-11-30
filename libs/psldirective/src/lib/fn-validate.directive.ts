import { Directive, ElementRef, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[pslwcllibFnValidate]',
  providers: [{provide: NG_VALIDATORS, useExisting: FnValidateDirective, multi: true}]
})
export class FnValidateDirective implements Validator {

  constructor(private el: ElementRef) {
  }

  @Input() validateFunction: (el: ElementRef, c: AbstractControl) => ValidationErrors | null;

  validate(c: AbstractControl): ValidationErrors | null {
    return this.validateFunction(this.el, c);
  }
}
