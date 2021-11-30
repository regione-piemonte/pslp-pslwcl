import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidationErrors, FormGroup } from '@angular/forms';

@Directive({
  selector: '[pslwcllibIndirizzoValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: IndirizzoValidator,
      multi: true
    }
  ]
})

export class IndirizzoValidator implements Validator {
  private static readonly ITALIA = {
    descrizione: 'ITALIA',
    codice_ministeriale: 'Z000'
  };
  private readonly FIELDS = ['toponimo', 'indirizzo', 'numero', 'provincia', 'comune', 'cap'];
  private readonly FIELD_NAZIONE = 'nazione';

  validate(control: FormGroup): ValidationErrors {
    control.setErrors(null);
    const nazione = control.value[this.FIELD_NAZIONE];
    if (!nazione || nazione.trim() === '' || nazione === IndirizzoValidator.ITALIA.codice_ministeriale) {
      this.FIELDS.forEach(campo => this.testField(campo, control));
    } else {
      this.FIELDS.forEach( campo => this.setErrorField(campo, control, null));
    }
    if (control.invalid) {
      return {indirizzo: 'Se la nazione è vuota o "Italia", è obbligatorio inserire tutte le informazioni.'};
    }
    return null;
  }

  private testField(field: string, control: FormGroup) {
    if (control.value[field]) {
      this.setErrorField(field, control, null);
      if (field === 'cap') {
        this.testCap(control);
      }
    } else {
      this.setErrorField(field, control, {'required': true});
    }
  }

  private testCap(control: FormGroup) {
    const field = 'cap';
    const cap: string = control.value[field];
    if ( cap.length !== 5 ) {
      this.setErrorField(field, control, {'length': true});
    }
    if ( isNaN(+cap) ) {
      this.setErrorField(field, control, {'number': true});
    }
  }

  private setErrorField(field: string, control: FormGroup, errors: ValidationErrors) {
    if (control.controls[field]) {
      control.controls[field].setErrors(errors);
    }
  }
}
