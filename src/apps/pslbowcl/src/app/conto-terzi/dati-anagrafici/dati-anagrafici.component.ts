import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LogService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { BusinessService, Esito, Indirizzo, ErrorDef, ParametriSalvataggioSAP, Recapito, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslbowcl-dati-anagrafici',
  templateUrl: './dati-anagrafici.component.html'
})
export class DatiAnagraficiComponent implements OnInit, OnDestroy {
  @Input() forceReadOnlyResidenza = false;

  sap: SchedaAnagraficoProfessionale;
  flagResidenzaChanging = false;
  flagDomicilioChanging = false;
  flagRecapitiChanging = false;

  idUtente: number;
  salvaDisabled = true;
  messaggioErroreProsegui: string;
  messaggioErroreDati: string;
  readOnly: boolean;
  popdown: boolean;
  helpMessage: string = 'Bravo pirletto!';
  private sub;

  constructor(
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService,
    private readonly route: ActivatedRoute,
    private readonly businessService: BusinessService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.utilitiesService.showSpinner();
    this.inizializza(this.route.snapshot.queryParams['idUtente']);
    this.sub = this.route.queryParams.subscribe(params => {
      this.utilitiesService.showSpinner();
      this.inizializza(params['idUtente']);
    });
  }

  private async inizializza(id: string) {
    this.idUtente = +id;
    const [sap,
      messaggioErroreDati, helpMessage] = await Promise.all([
      this.businessService.getSAP(this.idUtente).toPromise(),
      this.utilitiesService.getMessage('ME103'),
      this.utilitiesService.getMessage('HC009')
    ]);
    this.sap = sap;
    this.messaggioErroreDati = messaggioErroreDati;
    this.helpMessage = helpMessage;
    this.logService.log('sap', this.sap);
    this.utilitiesService.hideSpinner();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
  residenzaEditState(stato: boolean) {
    this.flagResidenzaChanging = stato;
  }
  residenzaChanged(indirizzo: Indirizzo) {
    this.sap.residenza = indirizzo;
    this.salvaDisabled = false;
  }
  domicilioEditState(stato: boolean) {
    this.flagDomicilioChanging = stato;
  }
  domicilioChanged(indirizzo: Indirizzo) {
    this.sap.domicilio = indirizzo;
    this.salvaDisabled = false;
  }
  recapitiEditState(stato: boolean) {
    this.flagRecapitiChanging = stato;
  }
  recapitiChanged(recapito: Recapito) {
    this.sap.recapito = recapito;
    this.salvaDisabled = false;
  }

  onIndietro() {
    this.router.navigate(['/conto-terzi/ricerca'], { queryParams: { idUtente: this.idUtente } } );
  }
  async onSalva() {
    try {
      this.checkCoerenzaProvincia();
      this.utilitiesService.showSpinner();
      const parm: ParametriSalvataggioSAP = {sap: this.sap,
         sezioni: ['DATI_ANAGRAFICI']};
      const esito = await this.businessService.saveSAP(this.idUtente, parm).pipe(
        catchError( err => {
          this.logService.error('[dati-anagrafici.component::onSalva]', JSON.stringify(err));
          const errore: ErrorDef  = (err instanceof HttpErrorResponse) ? err.error : err;
          const esito2: Esito = {
            code: errore.code,
            messaggioCittadino: errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage
          };
          return of(esito2);
      })).toPromise();
      this.utilitiesService.hideSpinner();
      if (esito.code !== 'OK' && esito.code !== '200') {
        throw new Error(esito.messaggioCittadino);
      }
      this.utilitiesService.showToastrInfoMessage('Salvataggio Eseguito', 'Anagrafica');
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'Anagrafica');
    }
  }

  private async checkCoerenzaProvincia() {
    const messaggioErroreProvincia = await this.utilitiesService.getMessage('ME039');
    // Controllo domicilio
    if (this.utilitiesService.hasDataProvincia(this.sap.domicilio)
     || this.utilitiesService.hasDataNazione(this.sap.domicilio)) {
      // Check sap domicilio
      if (this.utilitiesService.isProvinciaInPiemonte(this.sap.domicilio)) {
        return;
      }
      throw new Error(messaggioErroreProvincia);
    }

    if (this.utilitiesService.isProvinciaInPiemonte(this.sap.residenza)) {
      return;
    }
    throw new Error(messaggioErroreProvincia);
  }

  isValidData(): boolean {
    return (this.sap.recapito && this.sap.recapito.email)
      && (
        (this.sap.residenza && this.sap.residenza.comune && this.sap.residenza.comune.provincia
            && !!this.sap.residenza.comune.provincia.codice_ministeriale)
        || (this.sap.domicilio && this.sap.domicilio.comune && this.sap.domicilio.comune.provincia
            && !!this.sap.domicilio.comune.provincia.codice_ministeriale)
      );
  }

}
