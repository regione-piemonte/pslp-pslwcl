import { Component, Input, OnInit } from '@angular/core';
import { SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslshare-dati-anagrafici-display',
  templateUrl: './dati-anagrafici-display.component.html',
  styleUrls: ['./dati-anagrafici-display.component.css']
})
export class DatiAnagraficiDisplayComponent implements OnInit {

  @Input() sap: SchedaAnagraficoProfessionale;

  constructor(
  ) { }

  async ngOnInit() {
  }

}
