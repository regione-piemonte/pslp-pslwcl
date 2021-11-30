import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import * as moment from 'moment';
import { isNullOrUndefined } from 'util';

@Directive({
  selector: '[pslwcllibFutureDateIsInvalidValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: FutureDateIsInvalidValidator,
      multi: true
    }
  ]
})

export class FutureDateIsInvalidValidator implements Validator {

  private static readonly FORMAT_DATE = 'DD/MM/YYYY';
  validate(control: AbstractControl): ValidationErrors {
    const err = this.computeErrors(control);
    control.setErrors(err, { emitEvent: true });
    return err;
  }

  private computeErrors(control: AbstractControl): ValidationErrors {

    const value: Date = control.value;
    if (!value || value instanceof Date) {
      if (!isNullOrUndefined(value)) {
        if (value > new Date()) {
          return { 'format': 'La data non può essere maggiore della data odierna' };
        }
      }
    } else if (!moment(value, FutureDateIsInvalidValidator.FORMAT_DATE, true).isValid()) {
      return {'format': 'La data non è valida'};
    }
    return null;
  }

}
