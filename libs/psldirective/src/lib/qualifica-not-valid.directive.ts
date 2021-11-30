import { Validator, NG_VALIDATORS, AbstractControl } from '@angular/forms';
import { Directive } from '@angular/core';

@Directive({
  selector: '[pslwcllibCodMinistNotValidValidatorDirective]',
  providers: [{ provide: NG_VALIDATORS, useExisting: CodMinistNotValidValidatorDirective, multi: true }]
})
export class CodMinistNotValidValidatorDirective implements Validator {

  validate(control: AbstractControl): { [key: string]: any } | null {
    const laDecodifica = control.value;
    if (laDecodifica) {
      if (!laDecodifica.codice_ministeriale) {
        return {
          'codiceMinisterialeNotValid': {
            value: control.value,
            message: "Non e' stata selezionata una voce dall'elenco. Si puo' ricercare indicando alcuni caratteri; sull'elenco filtrato, si puo' selezionare la voce interessata"
          }
        };

      }
    }
    return null;
  }
}
