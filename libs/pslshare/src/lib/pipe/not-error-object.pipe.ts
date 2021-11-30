import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'notErrorObject',
  pure: true
})
export class NotErrorObjectPipe implements PipeTransform {

  transform(errors: {key: string, value: any}[]): {key: string, value: any}[] {
    return errors.filter(error => error.key === 'required' || typeof error.value === 'string');
  }

}
