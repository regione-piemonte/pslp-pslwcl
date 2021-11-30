import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BusinessService, PrenotazioneIncontro, SchedaAnagraficoProfessionale, Utente } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, LogService, OperatoreService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of, Subscription } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';

declare var $: any;

@Component({
  selector: 'pslbowcl-ricerca-cm',
  templateUrl: './ricerca-collocamento-mirato.component.html',
  styleUrls: ['./ricerca-collocamento-mirato.component.css']
})
export class RicercaCollocamentoMiratoComponent implements OnInit, OnDestroy {
  private readonly DATE_FORMAT = 'DD/MM/YYYY';
  private readonly TIME_FORMAT = 'HH:mm';

  /** DAVIDE */

  utente: Utente;
  codiceFiscale: string;
  sap: SchedaAnagraficoProfessionale = null;

  msgWarning: string;


  appuntamentoRDC: PrenotazioneIncontro = null;
  showData = false;

  private readonly subscriptions: Subscription[] = [];
  msgME104: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly operatoreService: OperatoreService,
    private readonly logService: LogService,
    private readonly businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly appUserService: AppUserService,
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.logService.log('ricerca Collocamento mirato x conto terzi');

    this.inizializza(this.route.snapshot.queryParams['idUtente']);
    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      this.utilitiesService.showSpinner();
      this.inizializza(params['idUtente']);
    }));

    const  msgME104  = await this.utilitiesService.getMessage('ME104');

    this.msgME104 = msgME104;



  }

  private async inizializza(idUtente: string) {
    if (!idUtente) {
      this.utilitiesService.hideSpinner();
      return;
    }
    this.utente = await this.businessService.getUtenteById(+idUtente).toPromise();
    if (this.utente) {
      this.codiceFiscale = this.utente.codice_fiscale;
    }
    await this.impostaData('');
    this.utilitiesService.hideSpinner();
  }
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
  async onCerca() {
    let errorMessage = '';
    this.utilitiesService.showSpinner();
    const cf = (this.codiceFiscale || '').toUpperCase();
    this.utente = await this.businessService.getUtenteByCf(cf).pipe(take(1), catchError((err: HttpErrorResponse) => {
      const prova: HttpErrorResponse = err;
      errorMessage = prova.error.errorMessage;
      return of(null as Utente);
    })).toPromise();
    await this.impostaData(errorMessage);
    this.utilitiesService.hideSpinner();
  }

  private async impostaData(msg: string) {
    let msgCode = 'ME076';
    try {
      if (!this.utente) {
        throw new Error(msg);
      }
      if (!this.utente.id_sil_lav_anagrafica) {
        //   Cittadino non trovato
        throw new Error(this.msgME104);
      }
      if (!this.utente.id_utente) {
        this.utente = await this.businessService.saveUtente(this.utente).toPromise();
      }
      const operatore = this.operatoreService.getOperatoreByRuolo();
      this.appUserService.setUtenteSimulato(this.utente, operatore);
      this.sap = await this.businessService.getSAP(this.utente.id_utente).pipe(
        tap(value => {
          if (!value || !value.identificativo_sap) {
            msgCode = 'ME050';
            throw new Error();
          }
        }),
        catchError(() =>
          this.utilitiesService.getMessage(msgCode).then(
            (message) => { throw new Error(message); }
          )
        )
      ).toPromise();

    } catch (e) {
      this.showData = false;
      return this.utilitiesService.showToastrErrorMessage(e.message, 'Ricerca');
    }
  }

  onIscrizione() {
    this.router.navigate(['/collocamento-mirato'], { queryParams: { idUtente: this.utente.id_utente } });
  }

  onIndietro() {
    this.router.navigateByUrl('/home');
  }
}
