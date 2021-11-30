import { JsonPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgModel, ValidationErrors } from '@angular/forms';
import { Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isString } from 'util';

@Component({
  selector: 'pslshare-error-handler',
  templateUrl: './error-handler.component.html',
  providers: [ JsonPipe ]
})
export class ErrorHandlerComponent implements OnInit {

  @Input() model: NgModel;
  @Input() errors: ValidationErrors;

  constructor(
    private readonly jsonPipe: JsonPipe
  ) { }

  ngOnInit() {
  }

  extractErrorMessage(error: {key: string, value: any}): any {
    if (error.value && isString(error.value)) {
      return error.value;
    }
    const tmp = this.model.errors[error.key];
    if (!error.value) {
      return tmp;
    }
    if (error.value.path) {
      return Utils.getDeepValue(tmp, error.value.path);
    }
    return this.jsonPipe.transform(tmp);
  }

}
