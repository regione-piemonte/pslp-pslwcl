import { Validator, NG_VALIDATORS, AbstractControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';
import { Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

interface ValueNotPresentValidatorConfiguration {
  list: any[];
  path?: string;
  valuePath?: string;
  idx: number;
}

@Directive({
  selector: '[pslwcllibValueNotPresentValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: ValueNotPresentValidatorDirective, multi: true }]
})
export class ValueNotPresentValidatorDirective implements Validator {
  /*
  I parametri che forniamo sono 4:
  list => la lista con i valori pregressi
  path => una stringa che corrisponde al 'path' per andare a leggere la chiave dell'oggetto nella lista.
  Questo serve per andare poi a fare i controlli direttamente contro una chiave, e non tutto l'oggetto
  valuePath => una stringa che corrisponde al path per andare a leggere la chiave della option selezionata. Serve per il confronto con il valore estratto dal punto sopra
  idx => l'indice dell'elemento già pre-esistente
  */

  @Input('pslwcllibValueNotPresentValidator') set configuration(conf: ValueNotPresentValidatorConfiguration) {
    this.alreadyPresent = (conf.list || []).map(el => Utils.getDeepValue(el, conf.path || ''));
    this.valuePath = conf.valuePath || '';
    this.idx = conf.idx !== undefined ? conf.idx : -1;
  }

  private alreadyPresent: any[] = [];
  private valuePath: string;
  private idx: number;

  validate(control: AbstractControl): { [key: string]: any } | null {
    let checkValue = Utils.getDeepValue(control.value, this.valuePath || '');
    if (!isNullOrUndefined(checkValue)) {
      checkValue = checkValue.toUpperCase().trim();
    }
    if (this.alreadyPresent.some((el, idx) => el === checkValue && idx !== this.idx)) {
      return { 'valueAlreadyPresent': { value: control.value } };
    }
    return null;
  }
}
