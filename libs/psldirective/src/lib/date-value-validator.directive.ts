import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidationErrors, AbstractControl } from '@angular/forms';
import * as moment from 'moment';

@Directive({
  selector: '[pslwcllibDateValueValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: DateValueValidator,
      multi: true
    }
  ]
})

export class DateValueValidator implements Validator {

  private static readonly FORMAT_DATE = 'DD/MM/YYYY';
  validate(control: AbstractControl): ValidationErrors {
    const err = this.computeErrors(control);
    control.setErrors(err, {emitEvent: true});
    return err;
  }

  private computeErrors(control: AbstractControl): ValidationErrors {
    const value: string | Date = control.value;
    if (!value || value instanceof Date) {
      return null;
    }
    if (!moment(value, DateValueValidator.FORMAT_DATE, true).isValid()) {
      return {'format': 'La data non è valida'};
    }
    return null;
  }

}
