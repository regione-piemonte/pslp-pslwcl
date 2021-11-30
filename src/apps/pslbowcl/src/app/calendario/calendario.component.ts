import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'pslbowcl-calendario',
  templateUrl: './calendario.component.html'
})
export class CalendarioComponent implements OnInit {
  readonly ambienteLocal: boolean = environment.ambiente === 'local';
  constructor(
  ) { }

  ngOnInit() {
  }
}
