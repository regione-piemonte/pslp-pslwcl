import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CommonPslpService } from '@pslwcl/pslservice';
import { LogService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { StatoIncontro } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { BusinessService, DomandaRDC, ParametriRicercaPrimaDisponibilitaIncontri, ParametriSalvataggioIncontro, PrenotazioneIncontro, SchedaAnagraficoProfessionale, StampeService } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

declare var $: any;

@Component({
  selector: 'app-scheda-rdc',
  templateUrl: './scheda-rdc.component.html',
  styleUrls: ['./scheda-rdc.component.css']
})
export class SchedaRDCComponent implements OnInit {
  private readonly DATE_FORMAT = 'DD/MM/YYYY';
  private readonly TIME_FORMAT = 'HH:mm';
  private readonly COD_AMBITO = 'RDC';
  @Input() idUtente: number;
  @Output() loadedData: EventEmitter<void> = new EventEmitter();

  sap: SchedaAnagraficoProfessionale;
  domanda: DomandaRDC;
  appuntamento: PrenotazioneIncontro;
  appuntamentoDescrizione: string;
  loadingData: boolean;
  allowSposta = false;

  private loaded: boolean;
  msgAnnulla: string;
  msgSposta: string;

  constructor(
    private readonly router: Router,
    private readonly businessService: BusinessService,
    private readonly stampeService: StampeService,
    private readonly commonPslpService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService
  ) {
    this.loaded = false;
  }

  async ngOnInit() {
    if (this.loaded === true) {
      return;
    }
    this.loadingData = true;
    const [sap, domanda, appuntamento] = await Promise.all([
      this.commonPslpService.getSap$(this.idUtente),
      this.businessService.getDomandaRDC(this.idUtente).pipe(
        catchError(err => {
          this.logService.log(err);
          return of(null);
        })
      ).toPromise(),
      this.loadAppuntamento()
    ]);
    this.sap = sap;
    this.domanda = domanda;
    this.appuntamento = appuntamento;


    this.loadingData = false;
    this.loadedData.emit();
    this.loaded = true;
  }



  /**
   * Loads appuntamento
   * @returns appuntamento
   */
  private loadAppuntamento(): Promise<PrenotazioneIncontro> {
    return this.businessService.findIncontri(this.idUtente, this.COD_AMBITO).pipe(
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
          if (isNullOrUndefined(this.msgAnnulla)) {
            this.msgAnnulla = '';
          }
          this.msgSposta = calendario.messaggio_spostamento;
          if (isNullOrUndefined(this.msgSposta)) {
            this.msgSposta = '';
          }
          this.allowSposta = dating.diff(moment(), 'hours') >= calendario.ore_limite_spostamento
            && this.isAppuntamentoIn(appuntamento, 'DE');
        });
      }),
      catchError(() => of(null))
    ).toPromise();
  }

  domandaIn(...stati: string[]): boolean {
    if (!this.domanda) {
      return false;
    }
    return stati.some(stato => this.domanda.stato_domanda === stato);
  }

  appuntamentoIn(...stati: string[]): boolean {
    return this.isAppuntamentoIn(this.appuntamento, ...stati);
  }

  /**
   * Determines whether print on
   */
  async onPrint() {
    this.utilitiesService.showSpinner();
    try {
      const response = await this.stampeService.creaStampaRedditoDiCittadinanza(this.idUtente).toPromise();
      this.utilitiesService.downloadFile(response, 'application/pdf', "domanda.pdf");
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Determines whether dati anagrafici on
   */
  onDatiAnagrafici() {
    this.setDataRedditoCittadinanza();
    this.router.navigateByUrl('/reddito-cittadinanza/dati-anagrafici');
  }
  /**
   * Determines whether informazioni aggiuntive on
   */
  onInformazioniAggiuntive() {
    this.setDataRedditoCittadinanza();
    this.router.navigateByUrl('/reddito-cittadinanza/informazioni');
  }
  /**
   * Determines whether annulla appuntamento on
   */
  async onAnnullaAppuntamento() {
    $('#annulla_appuntamento_' + this.idUtente).modal('show');
  }
  /**
   * Do annulla appuntamento
   */
  async doAnnullaAppuntamento() {
    const parametriSalvataggioIncontro: ParametriSalvataggioIncontro = {
      id_prenotazione: this.appuntamento.id_prenotazione,
      id_slot: this.appuntamento.slot.id_slot,
      id_utente: this.idUtente,
      id_stato_appuntamento: 'DC'
    };
    this.utilitiesService.showSpinner();
    await this.businessService.saveIncontro(parametriSalvataggioIncontro).toPromise();
    this.appuntamento = await this.loadAppuntamento();
    this.commonPslpService.appuntamentoUpdate.next(this.appuntamento);
    this.utilitiesService.hideSpinner();
  }
  /**
   * Determines whether sposta appuntamento on
   */
  onSpostaAppuntamento() {
    this.setDataRedditoCittadinanza();
    this.commonPslpService.appuntamentoOld = this.appuntamento;
    this.commonPslpService.msgSposta = this.msgSposta;
    this.router.navigateByUrl('/reddito-cittadinanza/appuntamento');
  }
  /**
   * Sets data reddito cittadinanza
   */
  private setDataRedditoCittadinanza() {
    this.commonPslpService.inizializzaSoft();
    this.commonPslpService.wizard = false;
    this.commonPslpService.readOnly = !this.isModificabileAppuntamento();
    this.commonPslpService.setUtenteStorage({ id_utente: this.idUtente });
  }
  /**
   * Determines whether modificabile appuntamento is
   * @returns true if modificabile appuntamento
   */
  isModificabileAppuntamento(): boolean {
    return this.isVisualizzabileAppuntamento()
      && !this.appuntamentoIn('ER');
  }
  /**
   * Determines whether visualizzabile appuntamento is
   * @returns true if visualizzabile appuntamento
   */
  isVisualizzabileAppuntamento(): boolean {
    return this.appuntamento
      && this.appuntamento.id_prenotazione
      && this.hasDomandaAttiva();
  }
  hasDomanda(): boolean {
    return this.domanda && !!this.domanda.codice;
  }
  /**
   * Determines whether domanda attiva has
   * @returns true if domanda attiva
   */
  private hasDomandaAttiva(): boolean {
    return this.domanda &&
      (!this.domanda.stato_politica_rc1 || this.domanda.stato_politica_rc1 === '01');
  }

  /**
   * Determines whether appuntamento in is
   * @param appuntamento PrenotazioneIncontro
   * @param stati string
   *
   * @returns true if appuntamento in
   */
  private isAppuntamentoIn(appuntamento: PrenotazioneIncontro, ...stati: string[]): boolean {
    if (!appuntamento) {
      return false;
    }
    return stati.some(stato => appuntamento.codice_anpal_stato_incontro === stato);
  }
}

