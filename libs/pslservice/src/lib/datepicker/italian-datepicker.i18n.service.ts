import { Injectable } from '@angular/core';
import { NgbDatepickerI18n, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

const I18N_VALUES = {
  weekdays: ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'],
  monthsShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  // tslint:disable-next-line: max-line-length
  monthsLong: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
};

@Injectable({
  providedIn: 'root'
})
export class ItalianDatepickerI18nService extends NgbDatepickerI18n {

  getWeekdayShortName(weekday: number): string {
    return I18N_VALUES.weekdays[weekday - 1];
  }
  getMonthShortName(month: number, year?: number): string {
    return I18N_VALUES.monthsShort[month - 1];
  }
  getMonthFullName(month: number, year?: number): string {
    return I18N_VALUES.monthsLong[month - 1];
  }
  getDayAriaLabel(date: NgbDateStruct): string {
    return `${date.day}-${date.month}-${date.year}`;
  }

}
