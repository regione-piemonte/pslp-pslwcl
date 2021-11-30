import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SchedaAnagraficoProfessionale, BusinessService } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LogService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice';

@Component({
  selector: 'pslshare-conferma-dati-anagrafici-tutore',
  templateUrl: './conferma-dati-anagrafici-tutore.component.html'
})
export class ConfermaDatiAnagraficiTutoreComponent implements OnInit {
   static counter = 0;

   @Output() loaded = new EventEmitter();

  id: string;
  sap: SchedaAnagraficoProfessionale;
  constructor(
    private readonly router: Router,
    private readonly businessService: BusinessService,
    private readonly commonPslpService: CommonPslpService,
    private readonly logService: LogService
  ) { }

  async ngOnInit() {
    this.id = '' + ConfermaDatiAnagraficiTutoreComponent.counter++;
    this.sap = await this.businessService.getDatiResponsabile(this.commonPslpService.tutore.id_utente).pipe(
      catchError(err => of({} as SchedaAnagraficoProfessionale))
    ).toPromise();

    this.logService.log('[ConfermaDatiAnagraficiComponent]', this.sap);
    this.loaded.emit();
  }

  /**
   * Determines whether dati anagrafici on
   */
  onDatiAnagrafici() {
    this.router.navigateByUrl('/garanzia-giovani/dati-anagrafici-tutore');
  }
}
