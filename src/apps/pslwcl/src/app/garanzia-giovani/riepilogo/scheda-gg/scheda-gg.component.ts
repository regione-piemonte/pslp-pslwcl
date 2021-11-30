import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AdesioneYG, BusinessService, ErrorDef, ParametriRicercaPrimaDisponibilitaIncontri, ParametriSalvataggioIncontro, PrenotazioneIncontro, Privacy, SchedaAnagraficoProfessionale, StampeService, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { Ambito, DialogModaleMessage, StatoIncontro, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, LogService, ParametriSistemaService, SecurityPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { CommonPslpService } from '@pslwcl/pslservice';

declare var $: any;

@Component({
  selector: 'app-scheda-gg',
  templateUrl: './scheda-gg.component.html',
  styleUrls: ['./scheda-gg.component.css']
})
export class SchedaGGComponent implements OnInit {
  private readonly DATE_FORMAT = 'DD/MM/YYYY';
  private readonly TIME_FORMAT = 'HH:mm';
  isProfilingGGEnabled: boolean;
  @Input() idUtente: number;
  @Input() idTutore: number = null;
  @Input() utenteACarico: UtenteACarico = null;
  @Output() loadedData: EventEmitter<void> = new EventEmitter();
  sap: SchedaAnagraficoProfessionale;
  adesione: AdesioneYG;

  appuntamento: PrenotazioneIncontro;
  appuntamentoDescrizione: string;
  isMinore: boolean;
  loadingData: boolean;
  allowSposta = false;

  private loaded: boolean;
  msgAnnulla: string;
  msgSposta: string;
  messaggioErrore: string;
  eta: number;
  messaggioMaggiorenne: string;
  elencoPrivacyMinore: Privacy[];
  message: string;
  adesioneCompletamenteRespinta: boolean;
  privacyNonConfermata: boolean;

  constructor(
    private readonly router: Router,
    private readonly businessService: BusinessService,
    private readonly stampeService: StampeService,
    private readonly commonPslpService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly appUserService: AppUserService,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService
  ) {
    this.loaded = false;
  }

  async ngOnInit() {
    if (this.loaded === true) {
      return;
    }
    this.loadingData = true;
    this.isProfilingGGEnabled = await this.parametriSistemaService.isProfilingGGEnabled;
    this.messaggioErrore = null;
    let sap: SchedaAnagraficoProfessionale;
    try {
      sap = await this.commonPslpService.getSap$(this.idUtente);
      this.sap = sap;
    } catch (error) {
      const msgErr = await this.utilitiesService.getMessage('ME110');
      this.messaggioErrore = msgErr;
    }

    const adesione = await this.businessService.getAdesioneYG(this.idUtente).pipe(
      catchError(err => {
        this.logService.log(err);
        return of(null);
      })
    ).toPromise();

    if (isNullOrUndefined(this.messaggioErrore) && isNullOrUndefined(adesione)) {
      const msgErr = await this.utilitiesService.getMessage('ME111');
      this.messaggioErrore = msgErr;
    }
    const appuntamento = await this.loadAppuntamento();
    if (!isNullOrUndefined(sap) && !isNullOrUndefined(sap.dataDiNascita)) {
      this.eta = UtilitiesService.calcAge(sap.dataDiNascita);
    }

    this.isMinore = this.commonPslpService.isMinorenneSap(this.sap);
    this.adesione = adesione;
    this.adesioneCompletamenteRespinta = false;
    if (!isNullOrUndefined(this.adesione) && this.adesione.data_rifiuto) {
      this.adesioneCompletamenteRespinta = true;
    }
    this.privacyNonConfermata = await this.isPrivacyNonConfermata();
    this.appuntamento = appuntamento;
    this.loadingData = false;
    this.loadedData.emit();
    this.loaded = true;
  }

  /**
   * Determines whether privacy non confermata is
   * @returns boolean
   */
  async isPrivacyNonConfermata() {
    if (!isNullOrUndefined(this.utenteACarico)) {
      this.elencoPrivacyMinore = await this.appUserService.loadPrivacyMinore(this.idTutore, this.utenteACarico.tutelato.id_utente);
      const laPrivacyDelMinoreDellAmbito = this.elencoPrivacyMinore.find(el => el.cod_ambito === this.commonPslpService.AMBITO);
      if (isNullOrUndefined(laPrivacyDelMinoreDellAmbito) || !laPrivacyDelMinoreDellAmbito.stato) {
        return true;
      }
    }
    return false;
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
        if (!this.idTutore) {
          this.storageService.setItem(SessionStorageService.OWN_APPUNTAMENTO, appuntamento);
        }
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

  /**
   * Computes diff hours
   * @param dateTo  moment.Moment
   * @param dateFrom  moment.Moment
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

  /**
   * Adesiones in
   * @param stati string[]
   * @returns true if in
   */
  adesioneIn(...stati: string[]): boolean {
    if (!this.adesione) {
      return false;
    }
    return stati.some(stato => this.adesione.codice === stato);
  }

  /**
   * Appuntamentos in
   * @param stati string[]
   * @returns true if in
   */
  appuntamentoIn(...stati: string[]): boolean {
    return this.isAppuntamentoIn(this.appuntamento, ...stati);
  }
  /**
   * Determines whether print on
   */
  async onPrint() {
    this.utilitiesService.showSpinner();
    try {
      const response = await
        this.stampeService.creaStampaAdesione(this.idUtente, this.adesione.id_sil_lav_adesione).toPromise();
      this.utilitiesService.downloadFile(response, 'application/pdf', 'adesione.pdf');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }


  /**
   * Determines whether dati anagrafici tutore on
   */
  async onDatiAnagraficiTutore() {
    if (this.utenteACarico && !this.isMinore) {
      this.messaggioMaggiorenne = await this.utilitiesService.getMessage('ME021');
      this.utilitiesService.showToastrErrorMessage(this.messaggioMaggiorenne, this.utilitiesService.getDescrAmbito(Ambito.GG));
    } else {
      if (!isNullOrUndefined(this.utenteACarico)) {
        //  modificato controllo sulla privacy per via dell'elenco delle privacy che ha associate il minore
        if (this.privacyNonConfermata) {
          // 'per poter operare sul minore occorre prendere visione dell\'informativa sulla responsabilita\' genitoriale, in gestione minori';
          this.utilitiesService.hideSpinner();
          const msg = (await this.utilitiesService.getMessage('ME133')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
          this.openModal(msg);
        } else {
          this.setDataGaranziaGiovani();
          this.setDataGaranziaGiovaniTutore();
          this.router.navigateByUrl('/garanzia-giovani/dati-anagrafici-tutore');
        }
      } else {
        this.setDataGaranziaGiovani();
        this.setDataGaranziaGiovaniTutore();
        this.router.navigateByUrl('/garanzia-giovani/dati-anagrafici-tutore');
      }
    }
  }
  /**
   * Determines whether dati anagrafici on
   */
  async onDatiAnagrafici() {
    if (this.utenteACarico && !this.isMinore) {
      this.messaggioMaggiorenne = await this.utilitiesService.getMessage('ME021');
      this.utilitiesService.showToastrErrorMessage(this.messaggioMaggiorenne, this.utilitiesService.getDescrAmbito(Ambito.GG));
    } else {
      if (!isNullOrUndefined(this.utenteACarico)) {
        //  modificato controllo sulla privacy per via dell'elenco delle privacy che ha associate il minore
        if (this.privacyNonConfermata) {
          // 'per poter operare sul minore occorre prendere visione dell\'informativa sulla responsabilita\' genitoriale, in gestione minori';
          this.utilitiesService.hideSpinner();
          const msg = (await this.utilitiesService.getMessage('ME133')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
          this.openModal(msg);
        } else {
          this.setDataGaranziaGiovani();
          this.router.navigateByUrl('/garanzia-giovani/dati-anagrafici');
        }
      } else {
        this.setDataGaranziaGiovani();
        this.router.navigateByUrl('/garanzia-giovani/dati-anagrafici');
      }
    }
  }
  /**
   * Determines whether profiling on
   */
  async onProfiling() {
    if (this.utenteACarico && !this.isMinore) {
      this.messaggioMaggiorenne = await this.utilitiesService.getMessage('ME021');
      this.utilitiesService.showToastrErrorMessage(this.messaggioMaggiorenne, this.utilitiesService.getDescrAmbito(Ambito.GG));
    } else {
      if (!isNullOrUndefined(this.utenteACarico)) {
        //  modificato controllo sulla privacy per via dell'elenco delle privacy che ha associate il minore
        if (this.privacyNonConfermata) {
          // 'per poter operare sul minore occorre prendere visione dell\'informativa sulla responsabilita\' genitoriale, in gestione minori';
          this.utilitiesService.hideSpinner();
          const msg = (await this.utilitiesService.getMessage('ME133')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
          this.openModal(msg);
        } else {
          this.setDataGaranziaGiovani();
          this.router.navigateByUrl('/garanzia-giovani/profiling');
        }
      } else {
        this.setDataGaranziaGiovani();
        this.router.navigateByUrl('/garanzia-giovani/profiling');
      }
    }
  }
  /**
   * Determines whether informazioni aggiuntive on
   */
  async onInformazioniAggiuntive() {
    if (this.utenteACarico && !this.isMinore) {
      this.messaggioMaggiorenne = await this.utilitiesService.getMessage('ME021');
      this.utilitiesService.showToastrErrorMessage(this.messaggioMaggiorenne, this.utilitiesService.getDescrAmbito(Ambito.GG));
    } else {
      if (!isNullOrUndefined(this.utenteACarico)) {
        //  modificato controllo sulla privacy per via dell'elenco delle privacy che ha associate il minore
        if (this.privacyNonConfermata) {
          // 'per poter operare sul minore occorre prendere visione dell\'informativa sulla responsabilita\' genitoriale, in gestione minori';
          this.utilitiesService.hideSpinner();
          const msg = (await this.utilitiesService.getMessage('ME133')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));

          this.openModal(msg);
        } else {
          this.setDataGaranziaGiovani();
          this.router.navigateByUrl('/garanzia-giovani/informazioni');
        }
      } else {
        this.setDataGaranziaGiovani();
        this.router.navigateByUrl('/garanzia-giovani/informazioni');
      }
    }
  }
  /**
   * Determines whether annulla appuntamento on
   */
  onAnnullaAppuntamento() {
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
    try {
      await this.businessService.saveIncontro(parametriSalvataggioIncontro).toPromise();
      this.appuntamento = await this.loadAppuntamento();
      if (isNullOrUndefined(this.msgAnnulla)) {
        this.msgAnnulla = '';
      }
      if (isNullOrUndefined(this.msgSposta)) {
        this.msgSposta = '';
      }
    } catch (e) {
      const errore: ErrorDef = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage, 'Riepilogo');
    } finally {
      this.utilitiesService.hideSpinner();
      this.securityService.jumpToURL('/garanzia-landing', TypeApplicationCard.Cittadino);
    }
  }
  /**
   * Determines whether sposta appuntamento on
   */
  onSpostaAppuntamento() {
    this.setDataGaranziaGiovani();
    this.commonPslpService.appuntamentoOld = this.appuntamento;
    this.commonPslpService.msgSposta = this.msgSposta;
    this.router.navigateByUrl('/garanzia-giovani/appuntamento');
  }
  /**
   * Sets data garanzia giovani
   */
  private setDataGaranziaGiovani() {
    this.commonPslpService.inizializzaSoft();
    this.commonPslpService.setSapStorage(null);
    this.commonPslpService.wizard = false;
    this.commonPslpService.readOnly = !this.isModificabileAppuntamento();
    this.commonPslpService.setUtenteStorage({ id_utente: this.idUtente });
  }
  /**
   * Sets data garanzia giovani tutore
   */
  private setDataGaranziaGiovaniTutore() {
    this.commonPslpService.tutore = { id_utente: this.idTutore };
    this.commonPslpService.utenteACarico = this.utenteACarico;
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
      && this.hasAdesioneAttiva();
  }
  /**
   * Determines whether adesione has
   * @returns true if adesione
   */
  hasAdesione(): boolean {
    return this.adesione && !!this.adesione.codice;
  }

  /**
   * Determines whether adesione inviata is
   * @returns true if adesione inviata
   */
  isAdesioneInviata(): boolean {
    return this.adesione && this.adesione.flg_anpal_stato_corrente === 'S';
  }

  /**
   * Determines whether adesione attiva has
   * @returns true if adesione attiva
   */
  private hasAdesioneAttiva(): boolean {
    return this.adesione && this.adesione.codice === 'A' && isNullOrUndefined(this.adesione.data_rifiuto);
  }

  /**
   * Determines whether appuntamento in is
   * @param appuntamento PrenotazioneIncontro
   * @param stati  string[]
   * @returns true if appuntamento in
   */
  private isAppuntamentoIn(appuntamento: PrenotazioneIncontro, ...stati: string[]): boolean {
    if (!appuntamento) {
      return false;
    }
    return stati.some(stato => appuntamento.codice_anpal_stato_incontro === stato);
  }

  /**
   * Opens modal
   * @param msg string
   */
  async openModal(msg: string) {
    const data: DialogModaleMessage = {
      titolo: 'Privacy',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.GG, TypeApplicationCard.Fascicolo);
    }
  }

}
