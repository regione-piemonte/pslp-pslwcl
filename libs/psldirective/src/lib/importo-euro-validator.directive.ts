import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[pslwcllibImportoEuroValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: ImportoEuroValidator,
      multi: true
    }
  ]
})

export class ImportoEuroValidator implements Validator {

  private static readonly regex = /^[0-9]\d*(((\.\d{3}){1})?(,\d{0,2})?)$/;
  validate(control: AbstractControl): ValidationErrors {
    const err = this.computeErrors(control);
    control.setErrors(err, {emitEvent: true});
    return err;
  }

  private computeErrors(control: AbstractControl): ValidationErrors {
    const value: string  = control.value;
    if (!value ) {
      return null;
    }
    if (!ImportoEuroValidator.regex.test(value)) {
      return {
        'importoNotValid': {
          value: control.value, message: "Importo non valido."
        }
      };
    }
    return null;
  }

}
