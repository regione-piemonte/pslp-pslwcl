import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidationErrors, AbstractControl } from '@angular/forms';

@Directive({
  selector: '[pslwcllibDateFormatValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: DateFormatValidator,
      multi: true
    }
  ]
})

export class DateFormatValidator implements Validator {

  private static readonly CHECK_REGEX = /\d{2}\/\d{2}\/\d{4}/;
  validate(control: AbstractControl): ValidationErrors {
    const err = this.computeErrors(control);
    control.setErrors(err, {emitEvent: true});
    return err;
  }

  private computeErrors(control: AbstractControl): ValidationErrors {
    const value: string | Date = control.value;
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return this.checkDateValue(value);
    }
    return this.checkStringValue(value);
  }

  private checkStringValue(value: string): ValidationErrors {
    if (!value || value.length < 10) {
      return {'length': 'Il campo deve contenere 10 caratteri nel formato gg/mm/aaaa'};
    }
    if (value.length > 10) {
      return {'length': 'Il campo deve contenere 10 caratteri nel formato gg/mm/aaaa'};
    }
    if (!DateFormatValidator.CHECK_REGEX.test(value)) {
      return {'format': 'Il campo deve essere del formato gg/mm/aaaa'};
    }
    return null;
  }

  private checkDateValue(value: Date): ValidationErrors {
    // Check least the year has 4 values
    const year = value.getFullYear();
    if (year < 1000) {
      return {'format': 'Il campo deve essere del formato gg/mm/aaaa'};
    }
    return null;
  }

}
