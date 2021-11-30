import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
    // tslint:disable-next-line: max-line-length
import { ConfigurazioneCalendario, ConfigurazioneCalendarioFascia, ConfigurazioneCalendarioPeriodoValidita, ErrorDef, GestoreService, ParametriEliminazioneFascia } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { SliderConfiguration } from '@pslwcl/pslmodel';
import { OperatoreService, SessionStorageService, UtilitiesService, Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';

import { CalendarioService } from '../../calendario.service';
import { ConfigurazioneCalendarioService } from '../configurazione-calendario.service';
import { DisponibilitaSettimanaleService } from './disponibilita-settimanale.service';

declare const $: any;

interface GiornoDisponibilita {
  value: number;
  label: string;
}
/**  -------------------------
 * component per gestione  configurazione calendario
 *   disponibilità settimanale
 *   -------------------------
 */
@Component({
  selector: 'pslbowcl-disponibilita-settimanale',
  templateUrl: './disponibilita-settimanale.component.html',
  styleUrls: ['./disponibilita-settimanale.component.css'],
  providers: [
    DisponibilitaSettimanaleService
  ]
})
export class DisponibilitaSettimanaleComponent implements OnInit, OnDestroy {
  private static readonly oraFasciaMIN: number = 480;
  private static readonly oraFasciaMAX: number = 1140;
  private static readonly oraFascia13: number = 780;

  private static readonly confFASC: string = 'Configurazione fasce';

  @Input() disableConfermaIncontri: boolean;
  @Input() apertoAltro: boolean;
  apertoNuovaFascia = false;

  durateAppuntamento = [15, 30, 45, 60, 90, 120];
  elencoGiorniDisponibilita: GiornoDisponibilita[] = [
    {value: 1, label: 'Lunedì'},
    {value: 2, label: 'Martedì'},
    {value: 3, label: 'Mercoledì'},
    {value: 4, label: 'Giovedì'},
    {value: 5, label: 'Venerdì'}
  ];
  fascePossibili = [0, 1];
  nomenclaturaProgressivo = ['Prima', 'Seconda'];

  fasce: ConfigurazioneCalendarioFascia[];
  checkedFasce: ConfigurazioneCalendarioFascia[];
  periodo: ConfigurazioneCalendarioPeriodoValidita;

  elaborazioni: {fascia: ConfigurazioneCalendarioFascia, sliderConfig: SliderConfiguration}[] = [];
  giorniDisponibilitaSelezionati: GiornoDisponibilita[] = [];
  allSelectedGiorniDisponibilita = false;

  private subscription: Subscription[] = [];
  private configurazioneCalendario: ConfigurazioneCalendario;
  private now: moment.Moment;
  readOnly = false;
  fasciaDaEliminare: ConfigurazioneCalendarioFascia;
  msgME078: string;

  get periodoScaduto(): boolean {
    return !this.periodo
      || !this.periodo.data_a
      || moment(this.periodo.data_a).startOf('day').isBefore(this.now);
  }

  constructor(
    private readonly configurazioneCalendarioService: ConfigurazioneCalendarioService,
    private readonly gestoreService: GestoreService,
    private readonly operatoreService: OperatoreService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly calendarioService: CalendarioService
  ) { }

  async ngOnInit() {
    this.now = moment(new Date()).startOf('day');
    this.checkedFasce = [];

    this.configurazioneCalendario = this.sessionStorageService.getItem<ConfigurazioneCalendario>
    (SessionStorageService.CONFIGURAZIONE_CALENDARIO, true);

    this.subscription.push(
      this.configurazioneCalendarioService.fasce$.subscribe(v => this.fasce = v),
      this.configurazioneCalendarioService.periodo$.subscribe(p => this.periodo = p)
    );
    const [msgME078] = await Promise.all([
      this.utilitiesService.getMessage('ME078')
    ]);
    this.msgME078 = msgME078;
    this.readOnly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);
    this.apertoNuovaFascia = false;
    if (isNullOrUndefined(this.disableConfermaIncontri)) {
      this.disableConfermaIncontri = false;
    }
  }

  ngOnDestroy(): void {
    this.subscription.forEach(v => v.unsubscribe);
  }

  decodeGiornoSettimana(idGiornoSettimana: number): string {
    return Utils.toWeekDay(idGiornoSettimana);
  }
  toHourMinute(orario: number) {
    return Utils.toHourMinute(orario);
  }
  isChecked(fascia: ConfigurazioneCalendarioFascia): boolean {
    return this.checkedFasce.some(fa => fa.id_fascia === fascia.id_fascia);
  }

  get modificaDisabled() {

    return this.readOnly ||
           isNullOrUndefined(this.checkedFasce) ||
           this.checkedFasce.length !== 1  ||
           isNullOrUndefined(this.checkedFasce[0]) ||
           this.periodo.flag_slot_generati ||
           this.apertoAltro || this.disableConfermaIncontri;
  }

  onChangeFascia(fascia: ConfigurazioneCalendarioFascia) {
    if (this.isChecked(fascia)) {
      this.checkedFasce = this.checkedFasce.filter(fa => fa.id_fascia !== fascia.id_fascia);
      return;
    }
    this.checkedFasce[0] = fascia;
  }
  async onModificaFascia() {
    if (this.checkedFasce.length !== 1) {
      const msg = await this.utilitiesService.getMessage('ME070');
      return this.utilitiesService.showToastrErrorMessage(msg);
    }
    if (this.periodo.flag_slot_generati) {
      const msg = await this.utilitiesService.getMessage('ME071');
      return this.utilitiesService.showToastrErrorMessage(msg);
    }
    this.apertoNuovaFascia = true;
    this.elaborazioni = [
      {
        fascia: {...this.checkedFasce[0]},
        sliderConfig: {
          type: 'double',
          min: DisponibilitaSettimanaleComponent.oraFasciaMIN,
          max: DisponibilitaSettimanaleComponent.oraFasciaMAX,
          step: 15,
          grid: true,
          grid_snap: true,
          from_fixed: false,
          to_fixed: false,
          prettify: d => this.toHourMinute(d)
        }
      }
    ];
    this.giorniDisponibilitaSelezionati = this.elencoGiorniDisponibilita
      .filter(gd => gd.value === this.checkedFasce[0].id_giorno_settimana);
    return;
  }

  async onEliminaFascia() {
    if (this.checkedFasce.length !== 1) {
      const msg = await this.utilitiesService.getMessage('ME070');
      this.utilitiesService.showToastrErrorMessage(msg);
    } else if (this.periodo.flag_slot_generati) {
      const msg = await this.utilitiesService.getMessage('ME071');
      this.utilitiesService.showToastrErrorMessage(msg);
    } else {
      //  eliminazione fascia
      this.fasciaDaEliminare = this.checkedFasce[0];
      if (!isNullOrUndefined(this.fasciaDaEliminare.id_fascia)) {
          $('#modal_elimina_fascia').modal({backdrop: 'static', keyboard: false});
      }
    }
  }

  async doEliminaFascia(fasciaDaEliminare: ConfigurazioneCalendarioFascia) {
    try {
      this.utilitiesService.showSpinner();
      const op = this.operatoreService.getOperatoreByRuolo();
      const parmEliminazione: ParametriEliminazioneFascia = {id_fascia: fasciaDaEliminare.id_fascia };
      await this.gestoreService.eliminaFascia(op.id_utente, parmEliminazione).toPromise();
      await this.reloadCalendario();
      this.utilitiesService.showToastrInfoMessage('Eliminazione fascia completata con successo', DisponibilitaSettimanaleComponent.confFASC);
      this.checkedFasce = [];
      this.onChiudiFascia();
    } catch (e) {
      const errore: ErrorDef = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage, DisponibilitaSettimanaleComponent.confFASC);
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async onNuovaFascia() {
    if (this.periodo && this.periodo.flag_slot_generati) {
       this.utilitiesService.showToastrErrorMessage('Slot già generati per il periodo selezionato', DisponibilitaSettimanaleComponent.confFASC);
    } else {
      this.apertoNuovaFascia = true;
      this.elaborazioni = [];
      this.giorniDisponibilitaSelezionati = [];
      this.allSelectedGiorniDisponibilita = false;
      this.elaborazioni.push({
        fascia: {
          ora_inizio: DisponibilitaSettimanaleComponent.oraFasciaMIN,
          ora_fine: DisponibilitaSettimanaleComponent.oraFascia13,
          durata_slot: 60
        },
        sliderConfig: {
          type: 'double',
          min: DisponibilitaSettimanaleComponent.oraFasciaMIN,
          max: DisponibilitaSettimanaleComponent.oraFasciaMAX,
          step: 15,
          grid: true,
          grid_snap: true,
          from_fixed: false,
          to_fixed: false,
          prettify: d => this.toHourMinute(d)
        }
      });
    }
  }
  onChiudiFascia(): void {
    // Cleanup
    this.elaborazioni = [];
    this.apertoNuovaFascia = false;
  }

  toggleFascia(idx: number) {
    if (this.elaborazioni[0].fascia.ora_fine === DisponibilitaSettimanaleComponent.oraFasciaMAX && !this.elaborazioni[idx]) {
      this.utilitiesService.showToastrErrorMessage(this.msgME078, DisponibilitaSettimanaleComponent.confFASC);
      // Per introdurre una nuova fascia occorre ridurre la precedente, anticipandone il termine!", DisponibilitaSettimanaleComponent.confFASC);
    } else if (!this.elaborazioni[idx]) {
      this.elaborazioni[idx] = {
        fascia: {
          ora_inizio: this.elaborazioni[idx - 1].fascia.ora_fine,
          ora_fine: DisponibilitaSettimanaleComponent.oraFasciaMAX,
          durata_slot: 60
        },
        sliderConfig: {
          ...this.elaborazioni[idx - 1].sliderConfig,
          from_min: this.elaborazioni[idx - 1].fascia.ora_fine
        }
      };
    } else {
      this.elaborazioni[idx] = null;
    }
  }

  onChangeGiornoDisponibilita(index: number) {
    const giornoDisponibilita = this.elencoGiorniDisponibilita[index];
    if (this.giorniDisponibilitaSelezionati.some(el => el === giornoDisponibilita)) {
      this.allSelectedGiorniDisponibilita = false;
      this.giorniDisponibilitaSelezionati = this.giorniDisponibilitaSelezionati.filter(el => el !== giornoDisponibilita);
    } else if (this.elaborazioni[0].fascia.id_fascia === undefined) {
      this.giorniDisponibilitaSelezionati = [...this.giorniDisponibilitaSelezionati, giornoDisponibilita];
      this.allSelectedGiorniDisponibilita = this.giorniDisponibilitaSelezionati.length === this.elencoGiorniDisponibilita.length;
    } else {
      this.giorniDisponibilitaSelezionati = [giornoDisponibilita];
    }
  }

  isCheckedGiornoDisponibilita(index: number): boolean {
    return this.giorniDisponibilitaSelezionati.some(fd => fd === this.elencoGiorniDisponibilita[index]);
  }

  onSelezioneTuttoGiornoDisponibilita(): void {
    // Se sono in modifica non posso selezionare tutto. Disabilito il pulsante ma gestisco comunque per sicurezza
    if (this.elaborazioni[0].fascia.id_fascia !== undefined) {
      return;
    }
    if (this.allSelectedGiorniDisponibilita) {
      this.giorniDisponibilitaSelezionati = [];
    } else {
      this.giorniDisponibilitaSelezionati = [...this.elencoGiorniDisponibilita];
    }
    this.allSelectedGiorniDisponibilita = !this.allSelectedGiorniDisponibilita;
    return;
  }

  async onSalva() {
    const op = this.operatoreService.getOperatoreByRuolo();

    if (this.giorniDisponibilitaSelezionati.length < 1) {
       return false;
    }

    if (!this.checkMaxAppuntamentiFasce()) {
      const msg = await this.utilitiesService.getMessage('ME075');
      return this.utilitiesService.showToastrErrorMessage(msg, DisponibilitaSettimanaleComponent.confFASC);
    }

    if (!this.checkCoerenzaFasce()) {
      const msg = await this.utilitiesService.getMessage('ME072');
      return this.utilitiesService.showToastrErrorMessage(msg, DisponibilitaSettimanaleComponent.confFASC);
    }

    try {
      this.utilitiesService.showSpinner();
      const fasce = [];
      this.giorniDisponibilitaSelezionati.forEach(gd => this.elaborazioni.forEach(elab => fasce.push({
        ...elab.fascia,
        id_giorno_settimana: gd.value
      })));

      this.periodo.fasce = [
        ...(this.periodo.fasce || []).filter(fascia => !this.elaborazioni.some(elab => elab.fascia.id_fascia === fascia.id_fascia)),
        ...fasce
      ];
      this.configurazioneCalendario.periodi_validita = [
        ...this.configurazioneCalendario.periodi_validita.filter(pv => pv.id_periodo !== this.periodo.id_periodo),
        this.periodo
      ];
      await this.gestoreService.saveCalendarioFasce(op.id_utente, this.configurazioneCalendario).toPromise();
      await this.reloadCalendario();
      this.utilitiesService.showToastrInfoMessage('Salvataggio delle fasce completato con successo', DisponibilitaSettimanaleComponent.confFASC);
      this.checkedFasce = [];
      this.onChiudiFascia();
    } catch (e) {
      const errore: ErrorDef = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage, DisponibilitaSettimanaleComponent.confFASC);
    } finally {
      this.utilitiesService.hideSpinner();
    }
    return;
  }
  private checkCoerenzaFasce(): boolean {
    for (const elab of this.elaborazioni) {
      if ((elab.fascia.ora_fine - elab.fascia.ora_inizio) % elab.fascia.durata_slot !== 0) {
        return false;
      }
    }
    return true;
  }

  private checkMaxAppuntamentiFasce(): boolean {
    for (const elab of this.elaborazioni) {

      if (!isNullOrUndefined(elab) && elab.fascia.num_max_prenotazioni < 1) {
        return false;
      }
    }
    return true;
  }

  private async reloadCalendario() {
    this.configurazioneCalendario = await this.calendarioService.loadCalendario(this.configurazioneCalendario.id_calendario)
      .toPromise();
    // Load eccezioni via periodo_validita
    this.periodo = this.configurazioneCalendario.periodi_validita.find(pv => pv.id_periodo === this.periodo.id_periodo);
    if (!this.periodo) {
      throw new Error('Periodo di validità non presente sul Calendario.');
    }
    this.configurazioneCalendarioService.updatePeriodo(this.periodo);
    this.configurazioneCalendarioService.updateFasce(this.periodo.fasce);
  }
}
