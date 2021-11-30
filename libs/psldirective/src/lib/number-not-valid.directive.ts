import { Validator, NG_VALIDATORS, AbstractControl } from '@angular/forms';
import { Directive } from '@angular/core';

@Directive({
  selector: '[pslwcllibNumberNotValidValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: NumberNotValidValidatorDirective, multi: true }]
})
export class NumberNotValidValidatorDirective implements Validator {

  validate(control: AbstractControl): { [key: string]: any } | null {
    const anno = control.value;
    if (anno && !/^[0-9]*$/.test(anno)) {
      return {
        'numberNonValido': {
          value: control.value, message: "Il campo deve essere numerico"
        }
      };
    }
    return null;
  }
}
