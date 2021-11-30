import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Recapito } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

import getDeepValue from 'get-deep-value';

@Component({
  selector: 'pslshare-recapiti',
  templateUrl: './recapiti.component.html',
  styleUrls: ['./recapiti.component.css']
})
export class RecapitiComponent implements OnInit {
  @Input() name = 'recapiti';
  @Input() recapiti: Recapito;
  @Input() mayUpdate = true;
  @Output() recapitiChanged = new EventEmitter<Recapito>();
  @Output() recapitiEditState =  new EventEmitter<boolean>();
  recapitoModel: any;

  edit = false;

  constructor(
  ) {}

  ngOnInit() {
  }

  onToggle() {
    this.edit = !this.edit;
    if (this.recapiti) {
      this.recapitoModel = {
        telefono: getDeepValue(this.recapiti, 'telefono'),
        cellulare: getDeepValue(this.recapiti, 'cellulare'),
        fax: getDeepValue(this.recapiti, 'fax'),
        email: getDeepValue(this.recapiti, 'email')
      };
    }
    this.recapitiEditState.emit(this.edit);
  }

  onSubmit() {
    this.recapiti = {
      telefono: this.recapitoModel.telefono,
      cellulare: this.recapitoModel.cellulare,
      fax: this.recapitoModel.fax,
      email: this.recapitoModel.email
    };
    this.recapitiChanged.emit(this.recapiti);
    this.onToggle();
  }

}
