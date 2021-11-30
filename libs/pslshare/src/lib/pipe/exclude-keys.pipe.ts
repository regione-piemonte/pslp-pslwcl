import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'excludeKeys',
  pure: true
})
export class ExcludeKeysPipe implements PipeTransform {

  transform(errors: {key: string, value: any}[], keysToExclude?: string): {key: string, value: any}[] {
    const keys = keysToExclude ? keysToExclude.split(',') : [];
    return errors.filter(error => keys.indexOf(error.key) === -1);
  }

}
