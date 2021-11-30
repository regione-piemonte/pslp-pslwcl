import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[pslwcllibIfOneThenFullValidate]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: IfOneThenFullValidator,
      multi: true
    }
  ]
})

export class IfOneThenFullValidator implements Validator {
  @Input('pslwcllibIfOneThenFullValidate') fn: (c: AbstractControl) => ValidationErrors;

  validate(c: AbstractControl): ValidationErrors {
    return this.fn(c);
  }
}
