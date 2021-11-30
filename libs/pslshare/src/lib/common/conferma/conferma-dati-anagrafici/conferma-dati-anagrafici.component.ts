import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Router } from '@angular/router';
import { LogService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice';
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslshare-conferma-dati-anagrafici',
  templateUrl: './conferma-dati-anagrafici.component.html'
})
export class ConfermaDatiAnagraficiComponent implements OnInit {
   static counter = 0;

   @Output() loaded = new EventEmitter();

  id: string;
  title: string;

  sap: SchedaAnagraficoProfessionale;
  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly logService: LogService
  ) { }

  async ngOnInit() {
    this.id = '' + ConfermaDatiAnagraficiComponent.counter++;
    this.sap = await this.commonPslpService.getSap$();
    this.logService.log('[ConfermaDatiAnagraficiComponent]', this.sap);
    this.loaded.emit();
  }

  /**
   * Determines whether dati anagrafici on
   */
  onDatiAnagrafici() {
    switch (this.commonPslpService.AMBITO) {
      case Ambito.GG:
          this.router.navigateByUrl('/garanzia-giovani/dati-anagrafici');
        break;
        case Ambito.RDC:
          this.router.navigateByUrl('/reddito-cittadinanza/dati-anagrafici');
        break;
      default:
        break;
    }
  }
}
