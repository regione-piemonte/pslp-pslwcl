import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdesioneYG, BusinessService, DomandaRDC, Ente, ParametriRicercaPrimaDisponibilitaIncontri, ParametriSalvataggioIncontro, PrenotazioneIncontro, SchedaAnagraficoProfessionale, StampeService, Utente } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppuntamentoUtilitiesService } from '@pslwcl/pslshare';
import { StatoIncontro, TipoUtente, TipoUtenteCodice } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, OperatoreService, ParametriSistemaService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

import * as moment from 'moment';
import { of, Subscription } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { isNull, isNullOrUndefined } from 'util';


declare var $: any;

@Component({
  selector: 'pslbowcl-ricerca',
  templateUrl: './ricerca.component.html',
  styleUrls: ['./ricerca.component.css']
})
export class RicercaComponent implements OnInit, OnDestroy {
  private readonly DATE_FORMAT = 'DD/MM/YYYY';
  private readonly TIME_FORMAT = 'HH:mm';

  utente: Utente;
  codiceFiscale: string;
  sap: SchedaAnagraficoProfessionale = null;
  adesioneGG: AdesioneYG = null;
  appuntamentoGG: PrenotazioneIncontro = null;
  domandaRDC: DomandaRDC = null;
  msgPoliticaAttiva: string = null;
  msgMI021: string;
  msgMI022: string;
  msgME056: string;
  msgME057: string;
  msgME067: string;
  msgME068: string;
  msgME104: string;
  msgME079: string;
  nonIdoneoGG: boolean;
  nonIdoneoRDC: boolean;
  msgWarningGG: string;
  msgWarningRDC: string;

  appuntamentoRDC: PrenotazioneIncontro = null;
  showData = false;
  showCollapse1 = false;
  private readonly subscriptions: Subscription[] = [];

  viewNuovoGG: boolean;
  viewNuovoRDC: boolean;
  allowSpostaGG: boolean;
  allowSpostaRDC: boolean;
  msgAnnullaGG = '';
  msgSpostaGG = '';
  msgAnnullaRDC = '';
  msgSpostaRDC = '';
  enableEnteGG: boolean;
  enableEnteRDC: boolean;
  rdcEnabled: boolean;
  isAPLREG: boolean;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly stampeService: StampeService,
    private readonly appuntamentoUtilitiesService: AppuntamentoUtilitiesService,
    private readonly operatoreService: OperatoreService,
    private readonly parametriSistema: ParametriSistemaService,

  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.logService.log('ricerca x conto terzi');
    this.rdcEnabled = await this.parametriSistema.isRdcEnabled;
    this.inizializza(this.route.snapshot.queryParams['idUtente']);
    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      this.utilitiesService.showSpinner();
      this.inizializza(params['idUtente']);
    }));

    const [msgMI021, msgMI022, msgME056, msgME057, msgME067, msgME068, msgME104, msgME079
      , tipoOperatore] = await Promise.all([
        this.utilitiesService.getMessage('MI021'),
        this.utilitiesService.getMessage('MI022'),
        this.utilitiesService.getMessage('ME056'),
        this.utilitiesService.getMessage('ME057'),
        this.utilitiesService.getMessage('ME067'),
        this.utilitiesService.getMessage('ME068'),
        this.utilitiesService.getMessage('ME104'),
        this.utilitiesService.getMessage('ME079'),
        this.operatoreService.getRuolo()
      ]);

    this.msgMI021 = msgMI021;
    this.msgMI022 = msgMI022;
    this.msgME056 = msgME056;
    this.msgME057 = msgME057;
    this.msgME067 = msgME067;
    this.msgME068 = msgME068;
    this.msgME079 = msgME079;
    this.msgME104 = msgME104;

    this.isAPLREG = (tipoOperatore === TipoUtenteCodice.APL ||
      tipoOperatore === TipoUtenteCodice.REG);

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

    const adesioneGG: AdesioneYG = await this.businessService.getAdesioneYG(this.utente.id_utente)
      .pipe(catchError(() => of({} as AdesioneYG))).toPromise();
    this.adesioneGG = adesioneGG;

    const domandaRDC: DomandaRDC = await this.businessService.getDomandaRDC(this.utente.id_utente)
      .pipe(catchError(() => of({} as DomandaRDC))).toPromise();
    this.domandaRDC = domandaRDC;

    const appuntamentoGG: PrenotazioneIncontro = await this.loadAppuntamento(this.utente.id_utente, 'GG');
    this.appuntamentoGG = appuntamentoGG;

    const appuntamentoRDC: PrenotazioneIncontro = await this.loadAppuntamento(this.utente.id_utente, 'RDC');
    this.appuntamentoRDC = appuntamentoRDC;
    this.logService.log('getsportelli GG');
    const codTipoUtente = TipoUtente.getByCodice(this.operatoreService.getRuolo()).valore;
    const enteGG: Ente[] = await this.appuntamentoUtilitiesService.getSportelli(this.sap, 'GG', codTipoUtente);
    this.setEnableEnteGG(enteGG);
    this.logService.log('getsportelli GG');
    const enteRDC: Ente[] = await this.appuntamentoUtilitiesService.getSportelli(this.sap, 'RDC', codTipoUtente);
    this.setEnableEnteRDC(enteRDC);

    this.setMsgPoliticaAttiva();

    this.showData = true;
    this.showCollapse1 = true;

    this.nonIdoneoGG = this.isNonIdoneoGG(adesioneGG);

    this.nonIdoneoRDC = this.isNonIdoneoRDC(domandaRDC);

    this.setMsgWarningGG();
    this.setMsgWarningRDC();

    this.viewNuovoGG = this.isViewNuovoGG(adesioneGG, appuntamentoGG);

    this.viewNuovoRDC = this.isViewNuovoRDC(domandaRDC, appuntamentoRDC);

  }

  private setMsgPoliticaAttiva() {
    if (isNullOrUndefined(this.domandaRDC.stato_politica_rc1) ||
      this.domandaRDC.stato_politica_rc1 === '01') {
      this.msgPoliticaAttiva = this.msgMI021;
    } else {
      this.msgPoliticaAttiva = this.msgMI022;
    }
  }

  private isViewNuovoRDC(domandaRDC: DomandaRDC, appuntamentoRDC: PrenotazioneIncontro): boolean {
    return domandaRDC && (!domandaRDC.stato_politica_rc1 || domandaRDC.stato_politica_rc1 === '01')
      && this.utilitiesService.isProvinciaInPiemonte(this.sap.residenza)
      && (!appuntamentoRDC || !this.isAppuntamentoIn(appuntamentoRDC, 'DE', 'ER'));
  }

  private isViewNuovoGG(adesioneGG: AdesioneYG, appuntamentoGG: PrenotazioneIncontro): boolean {
    return adesioneGG && adesioneGG.codice && adesioneGG.codice.toLocaleUpperCase() === 'A'
      && this.utilitiesService.isProvinciaInPiemonte(this.sap.domicilio)
      && (!appuntamentoGG || !this.isAppuntamentoIn(appuntamentoGG, 'DE', 'ER'));
  }

  private isNonIdoneoRDC(domandaRDC: DomandaRDC): boolean {
    return !((isNullOrUndefined(domandaRDC)) ||
      ((isNullOrUndefined(domandaRDC.stato_politica_rc1))
        || domandaRDC.stato_politica_rc1 === '01'));
  }

  private isNonIdoneoGG(adesioneGG: AdesioneYG): boolean {
    return (!isNullOrUndefined(adesioneGG) && !isNullOrUndefined(adesioneGG.id_sil_lav_adesione)) &&
      ((isNullOrUndefined(adesioneGG.codice)) || adesioneGG.codice.toLocaleUpperCase() !== 'A');
  }

  private setMsgWarningRDC() {
    if (this.nonIdoneoRDC) {
      this.msgWarningRDC = this.msgME068;
    } else {
      this.msgWarningRDC = this.msgME057;
    }
  }

  private setMsgWarningGG() {
    if (this.nonIdoneoGG) {
      this.msgWarningGG = this.msgME067;
    } else {
      this.msgWarningGG = this.msgME056;
    }
  }

  private setEnableEnteRDC(enteRDC: Ente[]) {
    if (isNull(enteRDC)) {
      this.enableEnteRDC = false;
    } else {
      this.enableEnteRDC = enteRDC.length > 0;
    }
  }

  private setEnableEnteGG(enteGG: Ente[]) {
    if (isNull(enteGG)) {
      this.enableEnteGG = false;
    } else {
      this.enableEnteGG = enteGG.length > 0;
    }
  }

  private loadAppuntamento(idUtente: number, ambito: string): Promise<PrenotazioneIncontro> {
    this['allowSposta' + ambito] = false;
    this['msgAnnulla' + ambito] = null;
    this['msgSposta' + ambito] = null;
    return this.businessService.findIncontri(idUtente, ambito).pipe(
      map((incontri: PrenotazioneIncontro[]) => {
        incontri.sort((a: PrenotazioneIncontro, b: PrenotazioneIncontro) => b.id_prenotazione - a.id_prenotazione);
        if (incontri.length === 0) {
          return {} as PrenotazioneIncontro;
        }
        return incontri[0];
      }),
      tap(appuntamento => {
        const parametri: ParametriRicercaPrimaDisponibilitaIncontri = {
          cod_ambito: appuntamento.cod_ambito,
          gruppo_operatore: appuntamento.sportello.gruppo_operatore,
          cod_operaratore: appuntamento.sportello.cod_operatore,
          subcodice: appuntamento.sportello.subcodice
        };
        this.businessService.findCalendario(parametri).toPromise().then(calendario => {
          const time = moment(appuntamento.slot.da_ora, this.TIME_FORMAT);
          const dating = moment(appuntamento.slot.giorno, this.DATE_FORMAT).hour(time.hour()).minute(time.minute());
          let msgAnnulla = calendario.messaggio_annullamento;
          let msgSposta = calendario.messaggio_spostamento;
          if (isNullOrUndefined(msgAnnulla)) {
            msgAnnulla = '';
          }
          if (isNullOrUndefined(msgSposta)) {
            msgSposta = '';
          }
          this['msgAnnulla' + ambito] = msgAnnulla;
          this['msgSposta' + ambito] = msgSposta;
          this['allowSposta' + ambito] = dating.diff(moment(), 'hours') >= calendario.ore_limite_spostamento
            && this.isAppuntamentoIn(appuntamento, 'DE');
        });
      }),
      catchError(() => of({} as PrenotazioneIncontro))
    ).toPromise();
  }
  async onPrintAdesione() {
    this.stampeService.creaStampaAdesione(this.utente.id_utente, this.adesioneGG.id_sil_lav_adesione).toPromise().then(
      response => this.utilitiesService.downloadFile(response, 'application/pdf', 'adesione_' + this.codiceFiscale + '.pdf')
    );
  }

  async onPrintDomanda() {
    this.stampeService.creaStampaRedditoDiCittadinanza(this.utente.id_utente).toPromise().then(
      response => this.utilitiesService.downloadFile(response, 'application/pdf', 'domanda_' + this.codiceFiscale + '.pdf')
    );
  }

  adesioneIn(...stati: string[]): boolean {
    if (!this.adesioneGG || !this.adesioneGG.codice) {
      return false;
    }
    return stati.some(stato => this.adesioneGG.codice === stato);
  }

  statoAppuntamentoDescr(stato: string): string {
    if (!stato) {
      return '';
    }
    return StatoIncontro.getByCodice(stato).descrizione;
  }

  isAppuntamentoIn(appuntamento: PrenotazioneIncontro, ...stati: string[]): boolean {
    if (!appuntamento) {
      return false;
    }
    return stati.some(stato => appuntamento.codice_anpal_stato_incontro === stato);
  }

  onDatiAnagrafici() {
    this.router.navigate(['/conto-terzi/dati-anagrafici'], { queryParams: { idUtente: this.utente.id_utente } });
  }

  onNuovoAppuntamento(ambito: string) {
    this.router.navigate(['/conto-terzi/appuntamento'], { queryParams: { ambito: ambito, idUtente: this.utente.id_utente } });
  }
  onModificaAppuntamento(ambito: string) {
    this.router.navigate(['/conto-terzi/appuntamento'], {
      queryParams: {
        ambito: ambito,
        idUtente: this.utente.id_utente,
        idPrenotazione: ambito === 'GG' ? this.appuntamentoGG.id_prenotazione : this.appuntamentoRDC.id_prenotazione,
        msgSposta: ambito === 'GG' ? this.msgSpostaGG : this.msgSpostaRDC
      }
    });
  }
  onCancellaAppuntamento(ambito: string) {
    $('#annulla_appuntamento_' + ambito).modal('show');
  }
  async doAnnullaAppuntamento(ambito: string) {
    const appuntamento = ambito === 'GG' ? this.appuntamentoGG : this.appuntamentoRDC;
    const parametriSalvataggioIncontro: ParametriSalvataggioIncontro = {
      id_prenotazione: appuntamento.id_prenotazione,
      id_slot: appuntamento.slot.id_slot,
      id_utente: this.utente.id_utente,
      //  note
      id_stato_appuntamento: 'DC'
    };
    this.utilitiesService.showSpinner();
    await this.businessService.saveIncontro(parametriSalvataggioIncontro).toPromise();
    this.inizializza(this.utente.id_utente + '');
    this.utilitiesService.hideSpinner();
    this.utilitiesService.showToastrInfoMessage('Appuntamento cancellato', 'Appuntamento');
  }

  onIndietro() {
    this.router.navigateByUrl('/home');
  }
}
