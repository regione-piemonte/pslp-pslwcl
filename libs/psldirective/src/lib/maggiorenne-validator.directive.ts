import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';

@Directive({
  selector: '[pslwcllibMaggiorenneValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: MaggiorenneValidator,
      multi: true
    }
  ]
})

export class MaggiorenneValidator implements Validator {

  /**
   * Check regex of maggiorenne validator
   */
  private static readonly CHECK_REGEX = /\d{2}\/\d{2}\/\d{4}/;
  validate(control: AbstractControl): ValidationErrors {
    const err = this.computeErrors(control);
    control.setErrors(err, {emitEvent: true});
    return err;
  }

  /**
   * Computes errors
   * @param control data
   * @returns errors
   */
  private computeErrors(control: AbstractControl): ValidationErrors {
    const value: string | Date = control.value;

    let dateValue: Date;

    if (!moment(value, 'DD/MM/YYYY', true).isValid()) {
      return {'age': 'La data non è valida'};
    }

    if (typeof value === 'string') {
      if (!value || value.length < 10) {
        return {'length': 'Il campo deve contenere 10 caratteri nel formato gg/mm/aaaa'};
      }
      if (value.length > 10) {
        return {'length': 'Il campo deve contenere 10 caratteri nel formato gg/mm/aaaa'};
      }
      if (!MaggiorenneValidator.CHECK_REGEX.test(value)) {
        return {'format': 'Il campo deve essere del formato gg/mm/aaaa'};
      }
      dateValue = new Date(JSON.stringify(value));
      // Check invalid date
      if (isNaN(dateValue as unknown as number)) {
        const ba = value.split(/\//).map(v => Number.parseInt(v, 10));
        dateValue = new Date(ba[2], ba[1] - 1, ba[0]);
      }
    } else {
      dateValue = value;
    }
    if (dateValue > new Date) {
      return {'age': 'La data inserita non può essere maggiore della data odierna'};
    }
    const eta = UtilitiesService.calcAge(dateValue);
    if (eta < 18) {
      return {'age': 'L\'utente deve essere maggiorenne.'};
    }
    return null;
  }

}
