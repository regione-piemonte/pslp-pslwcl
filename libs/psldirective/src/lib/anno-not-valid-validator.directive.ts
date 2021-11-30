import { Validator, NG_VALIDATORS, AbstractControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';

export interface AnnoNotValidConfiguration {
  delta?: number;
  operation?: AnnoNotValidOperation;
}
export enum AnnoNotValidOperation {
  LT = 'LT',
  GT = 'GT',
  EQ = 'EQ',
  LE = 'LE',
  GE = 'GE'
}

interface AnnoNotValidCheckOperation {
  check: (year: number, current: number) => boolean;
  message: string;
}

@Directive({
  selector: '[pslwcllibAnnoNotValidValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: AnnoNotValidValidatorDirective, multi: true }]
})
export class AnnoNotValidValidatorDirective implements Validator {

  @Input('pslwcllibAnnoNotValidValidator') set configuration(conf: AnnoNotValidConfiguration) {
    this._configuration = {
      delta: conf && conf.delta || this._configuration.delta,
      operation: conf && conf.operation || this._configuration.operation
    };
  }
  private _configuration: AnnoNotValidConfiguration = {
    delta: 0,
    operation: AnnoNotValidOperation.GT
  };

  validate(control: AbstractControl): { [key: string]: any } | null {
    const anno = control.value;
    if (anno && !/^[1-2][0-9]{3}$/.test(anno)) {
      return { 'annoNonValido': { value: control.value, message: "L\' anno non è correttamente formattato" } };
    }
    const now = new Date();
    const year = now.getFullYear();
    const { check, message } = this.getOperation();
    if (check(+anno, year)) {
      return { 'annoNonValido': { value: control.value, message } };
    }
    return null;
  }

  private getOperation(): AnnoNotValidCheckOperation {
    switch (this._configuration.operation) {
      case AnnoNotValidOperation.LT: return {
        check: (year, current) => year < current + this._configuration.delta, message: `L'anno inserito non deve essere inferiore a quello attuale${this.addDelta()}`
      };
      case AnnoNotValidOperation.GT: return {
        check: (year, current) => year > current + this._configuration.delta, message: `L'anno inserito non deve essere superiore a quello attuale${this.addDelta()}`
      };
      case AnnoNotValidOperation.EQ: return {
        check: (year, current) => year === current + this._configuration.delta, message: `L'anno inserito non deve essere pari a quello attuale${this.addDelta()}`
      };
      case AnnoNotValidOperation.LE: return {
        check: (year, current) => year <= current + this._configuration.delta, message: `L'anno inserito non deve essere inferiore o pari a quello attuale${this.addDelta()}`
      };
      case AnnoNotValidOperation.GE: return {
        check: (year, current) => year >= current + this._configuration.delta, message: `L'anno inserito non deve essere superiore o pari a quello attuale${this.addDelta()}`
      };
      default: return { check: () => false, message: '' };
    }
  }

  private addDelta(): string {
    return this._configuration.delta ? `+${this._configuration.delta}` : '';
  }
}
