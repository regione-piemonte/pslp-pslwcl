import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ConfigurazioneCalendario, ConfigurazioneCalendarioEccezione, ConfigurazioneCalendarioPeriodoValidita, ErrorDef, GestoreService, ParametriEliminazioneEccezione } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { CampoApplicabileAdAltriCalendari } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { OperatoreService, ParametriSistemaService, SessionStorageService, UtilitiesService, Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';
import { ApplicaAdAltriComponent } from '../../applica-ad-altri/applica-ad-altri.component';
import { CalendarioService } from '../../calendario.service';
import { ConfigurazioneCalendarioService } from '../configurazione-calendario.service';

declare const $: any;

/**
 * Component
 * per la gestione  delle eccezioni in configurazione calendario
 */
@Component({
  selector: 'pslbowcl-eccezioni',
  templateUrl: './eccezioni.component.html',
  styleUrls: ['./eccezioni.component.css']
})
export class EccezioniComponent implements OnInit, OnDestroy {
  private static readonly confECC: string = 'Configurazione eccezioni';

  @Input() disableConfermaIncontri: boolean;
  @Input() apertoAltro: boolean;

  private subscription: Subscription[] = [];
  private periodoValidita: ConfigurazioneCalendarioPeriodoValidita;
  private finestreDisponibilitaScelte: ConfigurazioneCalendarioEccezione[] = [];
  private checkedEccezioni: ConfigurazioneCalendarioEccezione[] = [];
  private configurazioneCalendario: ConfigurazioneCalendario;

  eccezioni: ConfigurazioneCalendarioEccezione[];
  eccezioneElaborazione: ConfigurazioneCalendarioEccezione;
  eccezioneDaEliminare: ConfigurazioneCalendarioEccezione;
  finestreDisponibilita: ConfigurazioneCalendarioEccezione[];
  now: moment.Moment;

  page = 1;
  pageSize = 10;
  pageSizes = [5, 10, 20, 25, 50];

  allSelected = false;
  allSelectedFinestraDisponibilita = false;
  readOnly = false;

  @ViewChild(ApplicaAdAltriComponent, { static: true }) applicaChild;

  apertoNuovaEccezione = false;
  enableApplica: any;

  get hasEccezioniModificabili(): boolean { return (this.eccezioni || []).some(e => !e.flag_elaborata); }
  get periodoScaduto(): boolean {
    return !this.periodoValidita
      || !this.periodoValidita.data_a
      || moment(this.periodoValidita.data_a).startOf('day').isBefore(this.now);
  }

  constructor(
    private readonly utilitiesService: UtilitiesService,
    private readonly configurazioneCalendarioService: ConfigurazioneCalendarioService,
    private readonly operatoreService: OperatoreService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly parametriSistema: ParametriSistemaService,
    private readonly gestoreService: GestoreService,
    private readonly utiliesService: UtilitiesService,
    private readonly calendarioService: CalendarioService,
  ) { }

  async ngOnInit() {
    this.now = moment(new Date()).startOf('day');
    this.eccezioneElaborazione = null;
    this.subscription.push(
      this.configurazioneCalendarioService.eccezioni$.subscribe(v => this.eccezioni = v),
      this.configurazioneCalendarioService.periodo$.subscribe(p => this.periodoValidita = p)
    );
    // tslint:disable-next-line: max-line-length
    this.configurazioneCalendario = this.sessionStorageService.getItem<ConfigurazioneCalendario>(SessionStorageService.CONFIGURAZIONE_CALENDARIO, true);
    this.apertoNuovaEccezione = false;
    if (isNullOrUndefined(this.disableConfermaIncontri)) {
      this.disableConfermaIncontri = false;
    }
    this.readOnly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);
    this.enableApplica = await this.parametriSistema.isOperatoriApplicaEnabled;

  }
  ngOnDestroy(): void {
    this.subscription.forEach(v => v.unsubscribe);
  }

  /**
   * Determines whether modifica eccezione on
   */
  async onModificaEccezione() {
    if (this.checkedEccezioni.length !== 1) {
      const msg = await this.utiliesService.getMessage('ME060');
      this.utilitiesService.showToastrErrorMessage(msg);
    } else
      if (this.checkedEccezioni[0].flag_elaborata) {
        const msg = await this.utiliesService.getMessage('ME061');
        this.utilitiesService.showToastrErrorMessage(msg);
      } else {
        this.apertoNuovaEccezione = true;
        this.eccezioneElaborazione = { ...this.checkedEccezioni[0] };
        await this.calcolaFinestreDisponibilita();
        this.finestreDisponibilitaScelte = this.finestreDisponibilita
          .filter(fd => fd.ora_inizio === this.eccezioneElaborazione.ora_inizio && fd.ora_fine === this.eccezioneElaborazione.ora_fine);
      }
  }
  /**
   * Determines whether elimina eccezione on
   *
   */
  async onEliminaEccezione() {
    if (!this.checkedEccezioni.length) {
      const msg = await this.utiliesService.getMessage('ME062');
      return this.utilitiesService.showToastrErrorMessage(msg);
    }
    this.apertoNuovaEccezione = true;
    this.eccezioneDaEliminare = this.checkedEccezioni[0];
    if (!isNullOrUndefined(this.eccezioneDaEliminare.id_eccezione)) {
      $('#modal_elimina_eccezione').modal({ backdrop: 'static', keyboard: false });
    }

  }

  /**
   * Do elimina eccezione
   * @param eccezioneDaEliminare ConfigurazioneCalendarioEccezione
   */
  async doEliminaEccezione(eccezioneDaEliminare: ConfigurazioneCalendarioEccezione) {
    try {
      this.utilitiesService.showSpinner();
      const op = this.operatoreService.getOperatoreByRuolo();
      const parmEliminazione: ParametriEliminazioneEccezione = { id_eccezione: eccezioneDaEliminare.id_eccezione };
      await this.gestoreService.eliminaEccezione(op.id_utente, parmEliminazione).toPromise();
      await this.reloadCalendario();
      this.utilitiesService.showToastrInfoMessage('Eliminazione eccezioni completata con successo', EccezioniComponent.confECC);
      this.checkedEccezioni = [];
      this.onChiudiEccezione();
    } catch (e) {
      const errore: ErrorDef = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage, EccezioniComponent.confECC);
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Gets applica disabled
   */
  get applicaDisabled() {
    if (this.readOnly || isNullOrUndefined(this.checkedEccezioni) ||
      this.checkedEccezioni.length !== 1 ||
      isNullOrUndefined(this.checkedEccezioni[0])
      || moment(this.checkedEccezioni[0].giorno).startOf('day').isBefore(this.now)) {
      return true;
    }
    return !this.checkedEccezioni[0].flag_elaborata;
  }

  /**
   * Checks able
   * @param ex ConfigurazioneCalendarioEccezione
   * @returns true se modificabile
   */
  checkAble(ex: ConfigurazioneCalendarioEccezione) {
    const modificaAbil = (!ex.flag_elaborata);
    const applicaAbil = ex.flag_elaborata &&
      !moment(ex.giorno).startOf('day').isBefore(this.now);
    return (modificaAbil || applicaAbil);
  }

  /**
   * Gets modifica disabled
   */
  get modificaDisabled() {
    return this.readOnly ||
      isNullOrUndefined(this.checkedEccezioni) ||
      this.checkedEccezioni.length !== 1 ||
      isNullOrUndefined(this.checkedEccezioni[0]) ||
      this.checkedEccezioni[0].flag_elaborata;
  }

  /**
   * Determines whether checked is
   * @param eccezione ConfigurazioneCalendarioEccezione
   * @returns true if checked
   */
  isChecked(eccezione: ConfigurazioneCalendarioEccezione): boolean {
    return this.checkedEccezioni.some(ex => ex.id_eccezione === eccezione.id_eccezione);
  }
  /**
   * Determines whether change eccezione on
   * @param eccezione ConfigurazioneCalendarioEccezione
   */
  onChangeEccezione(eccezione: ConfigurazioneCalendarioEccezione) {
    if (this.isChecked(eccezione)) {
      this.checkedEccezioni = this.checkedEccezioni.filter(ex => ex.id_eccezione !== eccezione.id_eccezione);
    } else {
      this.checkedEccezioni[0] = eccezione;
    }
  }
  /**
   * Prints exception date
   * @param ex ConfigurazioneCalendarioEccezione
   * @returns exception date
   */
  printExceptionDate(ex: ConfigurazioneCalendarioEccezione): string {
    return [
      moment(ex.giorno).format('DD/MM/YYYY'),
      this.toHourMinute(ex.ora_inizio),
      this.toHourMinute(ex.ora_fine)
    ]
      .filter(el => el)
      .join(' - ');
  }
  /**
   * Prints num app eccezione
   * @param ex ConfigurazioneCalendarioEccezione
   * @returns stringa numero massimo prenotazioni
   */
  printNumAppEccezione(ex: ConfigurazioneCalendarioEccezione): string {
    return "(" + ex.num_max_prenotazioni + " appuntament" +
      (ex.num_max_prenotazioni === 1 ? "o" : "i") + ")";
  }
  /**
   * Determines whether nuova eccezione on
   */
  onNuovaEccezione() {
    this.eccezioneElaborazione = {};
    this.finestreDisponibilita = null;
    this.apertoNuovaEccezione = true;
  }
  /**
   * Determines whether chiudi eccezione on
   */
  onChiudiEccezione() {
    this.eccezioneElaborazione = null;
    this.apertoNuovaEccezione = false;
  }
  /**
   * Determines whether salva eccezione on
   *  esegue salvataggio tramite servizio
   */
  async onSalvaEccezione() {
    if (this.noOneChecked()) {
      this.utilitiesService.showToastrErrorMessage('selezionare una fascia', EccezioniComponent.confECC);
      return;
    } else {
      this.utilitiesService.showSpinner();
      const op = this.operatoreService.getOperatoreByRuolo();
      try {
        const periodo = this.configurazioneCalendario.periodi_validita.find(pv => pv.id_periodo === this.periodoValidita.id_periodo);
        const eccezioniElaborazione: ConfigurazioneCalendarioEccezione[] = this.finestreDisponibilitaScelte.map(fd => ({
          ...this.eccezioneElaborazione,
          ora_inizio: fd.ora_inizio,
          ora_fine: fd.ora_fine
        }));
        if (!eccezioniElaborazione.length) {
          eccezioniElaborazione.push(this.eccezioneElaborazione);
        }

        periodo.eccezioni = [
          ...(periodo.eccezioni || []).filter(ex => ex.id_eccezione !== this.eccezioneElaborazione.id_eccezione),
          ...eccezioniElaborazione
        ];
        await this.gestoreService.saveCalendarioEccezioni(op.id_utente, this.configurazioneCalendario).toPromise();
        await this.reloadCalendario();
        this.eccezioneElaborazione = undefined;
        this.checkedEccezioni = [];
        this.utilitiesService.showToastrInfoMessage('Salvataggio delle eccezioni completato con successo', EccezioniComponent.confECC);
        this.onChiudiEccezione();
      } catch (e) {
        const errore: ErrorDef = (e instanceof HttpErrorResponse) ? e.error : e;
        this.utilitiesService.showToastrErrorMessage(errore.errorMessage, EccezioniComponent.confECC);
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }
  /**
   * Determines whether conferma data on
   */
  async onConfermaData() {
    if (!this.eccezioneElaborazione.giorno || !(this.eccezioneElaborazione.giorno instanceof Date)) {
      const msg = await this.utiliesService.getMessage('ME063');
      this.utilitiesService.showToastrErrorMessage(msg);
    } else if (this.periodoValidita.data_da.getTime() > this.eccezioneElaborazione.giorno.getTime()) {
      const msg = await this.utiliesService.getMessage('ME064');
      this.utilitiesService.showToastrErrorMessage(msg);
    } else if (this.periodoValidita.data_a.getTime() < this.eccezioneElaborazione.giorno.getTime()) {
      const msg = await this.utiliesService.getMessage('ME065');
      this.utilitiesService.showToastrErrorMessage(msg);
    } else {
      const giorno = moment(this.eccezioneElaborazione.giorno).startOf('day');
      if (giorno.isBefore(this.now)) {
        const msg = await this.utiliesService.getMessage('ME073');
        this.utilitiesService.showToastrErrorMessage(msg);
      } else {
        await this.calcolaFinestreDisponibilita();
      }
    }
  }

  /**
   * Calcolas finestre disponibilita
   *
   */
  async calcolaFinestreDisponibilita() {
    this.finestreDisponibilita = [];
    const giornoSettimana = moment(this.eccezioneElaborazione.giorno).day() || 7;
    (this.periodoValidita.fasce || [])
      .filter(f => f.id_giorno_settimana === giornoSettimana)
      .forEach(f => {
        let oraInizio = f.ora_inizio;
        do {
          const oraFine = +oraInizio + +f.durata_slot;
          this.finestreDisponibilita.push({
            giorno: this.eccezioneElaborazione.giorno,
            ora_inizio: oraInizio,
            ora_fine: oraFine
          });
          oraInizio += +f.durata_slot;
        } while (oraInizio < f.ora_fine);
      });
    if (!this.finestreDisponibilita.length) {
      this.finestreDisponibilita = null;
      const msg = await this.utiliesService.getMessage('ME066');
      return this.utilitiesService.showToastrErrorMessage(msg);
    }
    this.finestreDisponibilitaScelte = [];
    this.allSelectedFinestraDisponibilita = false;
  }
  /**
   * Determines whether change finestra disponibilita on
   * @param index number
   */
  onChangeFinestraDisponibilita(index: number) {
    const finestra = this.finestreDisponibilita[index];
    if (this.finestreDisponibilitaScelte.some(el => el === finestra)) {
      this.allSelectedFinestraDisponibilita = false;
      this.finestreDisponibilitaScelte = this.finestreDisponibilitaScelte.filter(el => el !== finestra);
    } else if (this.eccezioneElaborazione.id_eccezione === undefined) {
      this.finestreDisponibilitaScelte = [...this.finestreDisponibilitaScelte, finestra];
      this.allSelectedFinestraDisponibilita = this.finestreDisponibilitaScelte.length === this.finestreDisponibilita.length;
    } else {
      this.finestreDisponibilitaScelte = [finestra];
    }
  }
  /**
   * Determines whether checked finestra disponibilita is
   * @param index number
   * @returns true if checked finestra disponibilita
   */
  isCheckedFinestraDisponibilita(index: number): boolean {
    return this.finestreDisponibilitaScelte.some(fd => fd === this.finestreDisponibilita[index]);
  }
  /**
   * one checked
   * @returns true if one checked
   */
  noOneChecked(): boolean {
    if (this.finestreDisponibilitaScelte.length === 0) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Determines whether selezione tutto finestra disponibilita on
   * @returns selezione tutto finestra disponibilita
   */
  onSelezioneTuttoFinestraDisponibilita(): void {
    // Se sono in modifica non posso selezionare tutto. Disabilito il pulsante ma gestisco comunque per sicurezza
    if (this.eccezioneElaborazione.id_eccezione !== undefined) {
      return;
    }
    if (this.allSelectedFinestraDisponibilita) {
      this.finestreDisponibilitaScelte = [];
    } else {
      this.finestreDisponibilitaScelte = [...this.finestreDisponibilita];
    }
    this.allSelectedFinestraDisponibilita = !this.allSelectedFinestraDisponibilita;
  }
  /**
   * To hour minute
   * @param orario number
   * @returns string
   */
  toHourMinute(orario: number) {
    return Utils.toHourMinute(orario);
  }

  /**
   * Reloads calendario
   */
  private async reloadCalendario() {
    this.configurazioneCalendario = await this.calendarioService.loadCalendario(this.configurazioneCalendario.id_calendario)
      .toPromise();
    // Load eccezioni via periodo_validita
    this.periodoValidita = this.configurazioneCalendario.periodi_validita.find(pv => pv.id_periodo === this.periodoValidita.id_periodo);
    if (!this.periodoValidita) {
      throw new Error('Periodo di validità non presente sul Calendario.');
    }
    this.configurazioneCalendarioService.updateEccezioni(this.periodoValidita.eccezioni);
  }
  /**
   * Determines whether applica eccezione on
   */
  async onApplicaEccezione() {
    const campoApplicare: CampoApplicabileAdAltriCalendari = {
      cod_ambito: this.configurazioneCalendario.codice_ambito,
      codiceCampo: "eccezione",
      nomeCampo: "Eccezione",
      valoreDescr: this.printExceptionDate(this.checkedEccezioni[0]) + " " + this.printNumAppEccezione(this.checkedEccezioni[0]),
      idCalendario: this.configurazioneCalendario.id_calendario,
      idEccezione: this.checkedEccezioni[0].id_eccezione
    };
    this.applicaChild.campoDaApplicare = campoApplicare;
    this.applicaChild.show();
  }

  // Pagination
  /**
   * Go to page
   * @param pageNumber numero di pagina
   */
  goToPage(pageNumber: number): void {
    this.page = Math.max(1, Math.min(Math.ceil(this.eccezioni.length / this.pageSize), pageNumber));
  }

  /**
   * Gets page
   * @returns page
   */
  getPage(): ConfigurazioneCalendarioEccezione[] {
    return this.eccezioni.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  /**
   * Gets pagination footer
   */
  get paginationFooter(): string {
    if (this.eccezioni.length === 0) {
      return '';
    }
    // tslint:disable-next-line: max-line-length
    return `${Math.min((this.page - 1) * this.pageSize + 1, this.eccezioni.length)} - ${Math.min(this.page * this.pageSize, this.eccezioni.length)} di ${this.eccezioni.length}`;
  }

}
