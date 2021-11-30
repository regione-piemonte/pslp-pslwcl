import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'padNumber',
  pure: true
})
export class PadNumberPipe implements PipeTransform {
  constructor() {}

  transform(value: number, maxLength = 2, fillString = '0'): string {
    return ('' + value).padStart(maxLength, fillString);
  }

}
