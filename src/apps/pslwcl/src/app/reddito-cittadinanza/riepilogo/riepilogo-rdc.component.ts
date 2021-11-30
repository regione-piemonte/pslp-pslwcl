import { Component, OnInit, ViewChild } from '@angular/core';
import { Params, Router } from '@angular/router';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { BusinessService, ParametriRicercaPrimaDisponibilitaIncontri, PrenotazioneIncontro, Privacy, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, DialogModaleMessage, StatoIncontro, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, SecurityPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import moment from 'moment';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';


@Component({
  selector: 'app-riepilogo-rdc',
  templateUrl: './riepilogo-rdc.component.html'
})
export class RiepilogoRDCComponent implements OnInit {
  private readonly DATE_FORMAT = 'DD/MM/YYYY';
  private readonly TIME_FORMAT = 'HH:mm';
  private readonly COD_AMBITO = 'RDC';
  idUtente: number;
  messaggioUtente: string;
  enableNuovaDomanda = false;
  elencoPrivacyUtente: Privacy[];
  appuntamentoDescrizione: string;
  msgAnnulla: string;
  msgSposta: string;
  allowSposta = false;



  minori: UtenteACarico[];
  loading: number;
  @ViewChild('accordionMinori', { static: false }) accordionMinori: NgbAccordion;


  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService,
    private readonly businessService: BusinessService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService,
    private readonly logService: LogService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.commonPslpService.AMBITO = Ambito.RDC;
    this.storageService.setItem(SessionStorageService.HAS_RIEPILOGO, true);
    this.idUtente = this.appUserService.getIdUtente();
    const appuntamento = await this.loadAppuntamento();
    const appuntamenti = await this.gestioneAppuntamento();

    this.commonPslpService.appuntamentoUpdate.subscribe(
      () => this.gestioneAppuntamento()
    );
    try {
      this.minori = await this.appUserService.getUtentiACarico(this.idUtente);
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }

    this.loading = this.minori.length + 1;

    this.utilitiesService.hideSpinner();
  }

  /**
   * Gestiones appuntamento
   */
  private async gestioneAppuntamento() {

    const appuntamenti = await this.businessService.findIncontri(this.idUtente, this.COD_AMBITO).toPromise();

    const { active, msg, userMessage } = await this.commonPslpService.getUserMessages(this.appUserService.getUtente());
    this.messaggioUtente = userMessage;
    if (!active) {
      this.enableNuovaDomanda = false;
    } else if (appuntamenti.length === 0) {
      this.enableNuovaDomanda = true;
    } else {
      appuntamenti.sort((a, b) => b.id_prenotazione - a.id_prenotazione);
      this.enableNuovaDomanda = appuntamenti[0].codice_anpal_stato_incontro !== StatoIncontro.getByDescrizione('Da Erogare').codice
        && appuntamenti[0].codice_anpal_stato_incontro !== StatoIncontro.getByDescrizione('Erogato').codice;
    }
  }

  /**
   * Determines whether nuova domanda on
   */
  async onNuovaDomanda() {
    this.setDataRedditoCittadinanza();

    const idUtente = this.appUserService.getIdUtente();
    this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(idUtente);
    const laPrivacyDellUtente = this.elencoPrivacyUtente.find(el => el.cod_ambito === this.commonPslpService.AMBITO);
    if (isNullOrUndefined(laPrivacyDellUtente) || !laPrivacyDellUtente.stato) {
      const msg = (await this.utilitiesService.getMessage('ME101')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.RDC));
      this.openModal(msg);
    } else {
      this.router.navigateByUrl('/reddito-cittadinanza/presentazione-rdc');
    }
  }
  /**
   * Sets data reddito cittadinanza
   */
  private setDataRedditoCittadinanza() {
    this.commonPslpService.inizializzaSoft();
    this.commonPslpService.setUtenteStorage({ id_utente: this.idUtente });
  }
  /**
   * Opens modal
   * @param msg string
   */
  async openModal(msg: string) {
    const data: DialogModaleMessage = {
      titolo: 'Prenotazione incontro Reddito di Cittadinanza',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.RDC, TypeApplicationCard.Fascicolo);
    } else {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }
  /**
   * Determines whether gestione privacy eminori on
   */
  onGestionePrivacyEMinori() {
    this.setDataRedditoCittadinanza();
    this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.RDC, TypeApplicationCard.Fascicolo);
  }

  /**
   * Decreases loading
   */
  async decreaseLoading() {
    this.loading--;
    this.logService.log('[RiepilogoComponent::decreaseLoading]', 'Data to load: ', this.loading);
    if (this.loading === 0) {
      const { active, msg, userMessage } = await this.commonPslpService.getUserMessages(this.appUserService.getUtente());
      this.messaggioUtente = userMessage;
      if (this.minori.length === 1) {
        this.accordionMinori.expand(`minore-${this.minori[0].tutelato.id_utente}`);
      }
      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Loads appuntamento
   * @returns appuntamento
   */
  private loadAppuntamento(): Promise<PrenotazioneIncontro> {
    return this.businessService.findIncontri(this.idUtente, this.commonPslpService.getAmbito()).pipe(
      map((incontri: PrenotazioneIncontro[]) => {
        incontri.sort((a: PrenotazioneIncontro, b: PrenotazioneIncontro) => b.id_prenotazione - a.id_prenotazione);
        if (incontri.length === 0) {
          throw new Error();
        }
        const st = StatoIncontro.getByCodice(incontri[0].codice_anpal_stato_incontro);
        this.appuntamentoDescrizione = st ? st.descrizione : '';
        return incontri[0];
      }),
      tap(appuntamento => {
        this.storageService.setItem(SessionStorageService.OWN_APPUNTAMENTO, appuntamento);
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
          this.msgAnnulla = calendario.messaggio_annullamento;
          this.msgSposta = calendario.messaggio_spostamento;
          if (isNullOrUndefined(this.msgAnnulla)) {
            this.msgAnnulla = '';
          }
          if (isNullOrUndefined(this.msgSposta)) {
            this.msgSposta = '';
          }
          this.allowSposta = this.isAppuntamentoIn(appuntamento, 'DE')
            && this.computeDiffHours(dating, moment()) >= calendario.ore_limite_spostamento;
        });
      }),
      catchError(() => of(null))
    ).toPromise();
  }
  private isAppuntamentoIn(appuntamento: PrenotazioneIncontro, ...stati: string[]): boolean {
    if (!appuntamento) {
      return false;
    }
    return stati.some(stato => appuntamento.codice_anpal_stato_incontro === stato);
  }

  /**
   * Computes diff hours
   * @param dateTo moment.Moment
   * @param dateFrom moment.Moment
   * @returns diff hours
   */
  private computeDiffHours(dateTo: moment.Moment, dateFrom: moment.Moment): number {
    let baseHours = dateTo.diff(dateFrom, 'hours');
    let dayDiff = dateTo.diff(dateFrom, 'days');
    let clone = moment(dateFrom);
    do {
      const isoWeekDay = clone.isoWeekday();
      if (isoWeekDay === 6 || isoWeekDay === 7) {
        baseHours -= 24;
      }
      clone = clone.add(1, 'days');
    } while (dayDiff-- > 0);

    return baseHours;
  }

}
