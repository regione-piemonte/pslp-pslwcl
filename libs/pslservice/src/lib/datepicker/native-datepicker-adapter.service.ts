import {Injectable} from '@angular/core';
import { NgbDateAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class NativeDatepickerAdapterService extends NgbDateAdapter<Date> {
  // From source code of NgbDateNativeAdapter
  fromModel(date: Date): NgbDateStruct {
    return (date && date.getFullYear) ?
      {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      }
      : null;
  }

  toModel(date: NgbDateStruct): Date {
    return date && date.year && date.month
      ? new Date(date.year, date.month - 1, date.day, 0, 0, 0, 0)
      : null;
  }
}
