import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Ambito, ConfigurazioneCalendario, ConfigurazioneCalendarioPeriodoValidita, Ente, // NOSONAR evita falso positivo rule typescript:S4328
  GestoreService, ParametriRicercaCalendari, Sportello, Utente } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { MOMENT_I18N_IT, TipoUtente } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { OperatoreService, SessionStorageService, UtilitiesService, Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { isNull, isNullOrUndefined, isUndefined } from 'util';
import { CalendarioService } from '../calendario.service';

/*
    -------------------------
    configurazione calendario
    dati generali
    -------------------------
*/
declare const $: any;

/**
 * Component configurazione calendario
    dati generali
 */
@Component({
  selector: 'pslbowcl-dati-generali',
  templateUrl: './dati-generali.component.html',
  styleUrls: ['./dati-generali.component.css']
})
export class DatiGeneraliComponent implements OnInit, OnDestroy {
  @ViewChild('datiGeneraliForm', { static: true }) form: NgForm;
  confCalendario: ConfigurazioneCalendario;
  periodiValidita: ConfigurazioneCalendarioPeriodoValidita[];
  salvaDisabled = true;
  flag = {
    confermato: false,
    errore: false,
    confermaAttivo: true,
    periodo: true,
    disableCalendar: false
  };
  ambitoList: Ambito[];
  enti: Ente[];
  sportelli: Sportello[];
  enteIndex: number;
  ambitoIndex: number;
  sportelloIndex: number;
  sportello: Sportello;

  periodoIndex = -1;
  periodoValidita: ConfigurazioneCalendarioPeriodoValidita;
  inDuplicazione: boolean;
  inModificaDuplicato = false;

  utente: Utente;
  codiceFiscale: string;

  private readonly subscriptions: Subscription[] = [];
  private periodoDuplicato: ConfigurazioneCalendarioPeriodoValidita;

  ambito: string;
  nomeCalendario: string;

  showAggiungiPeriodo = false;
  readOnly = false;
  modified = false;
  titolo: string;
  sportelloPresente: boolean;
  isInserimentoNuovo: boolean;
  idDuplicato: number;
  constructor(
    private readonly calendarioService: CalendarioService,
    private readonly operatoreService: OperatoreService,
    private readonly gestoreService: GestoreService,
    private readonly utilitiesService: UtilitiesService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    moment.locale('it', MOMENT_I18N_IT);
  }

  async ngOnInit(): Promise<void> {
    this.utilitiesService.showSpinner();

    this.subscriptions.push(
      this.route.data.subscribe(data => this.confCalendario = data.configurazioneCalendario)
    );
    const op = this.operatoreService.getOperatoreByRuolo();
    const ruolo: string = TipoUtente.getByCodice(this.operatoreService.getRuolo()).valore;

    if (isNullOrUndefined(this.confCalendario)) {
      this.confCalendario = {};
    }
    this.isInserimentoNuovo = isNullOrUndefined(this.confCalendario.nome);
    this.ambito = this.confCalendario.codice_ambito || null;
    this.nomeCalendario = this.confCalendario.nome || null;

    this.setTitolo();
    this.periodiValidita = (this.confCalendario.periodi_validita || []).sort((a, b) => Utils.sortPeriodiValidita(a, b));

    const [enti, ambitoList] = await Promise.all([
      this.gestoreService.getEnti(op.id_utente, ruolo, this.confCalendario.id_calendario !== undefined ? 'M' : 'I').toPromise(),
      this.gestoreService.getAmbiti(op.id_utente).toPromise()
    ]);
    this.enti = enti;
    this.ambitoList = ambitoList;
    this.sportelloPresente = false;
    if (
      isNullOrUndefined(this.confCalendario.codice_operatore) &&
      isNullOrUndefined(this.confCalendario.gruppo_operatore) &&
      isNullOrUndefined(this.confCalendario.subcodice)
    ) {
      if (this.enti.length === 1) {
        this.enteIndex = 0;
        this.sportelli = enti[this.enteIndex].sportelli;
        this.sportelloIndex = 0;
        this.sportelloPresente = true;
      }
    } else {
      this.ciclo();
    }
    this.readOnly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);
    this.utilitiesService.hideSpinner();
  }

  private setTitolo() {
    if (isNullOrUndefined(this.nomeCalendario)) {
      this.titolo = 'Dati generali';
    } else {
      this.titolo = 'Dati generali - ' + this.nomeCalendario + ' [ ' + this.confCalendario.codice_ambito + ' ]';
    }
  }

  private ciclo() {
    for (let _e = 0; _e < this.enti.length; _e++) {
      for (let _s = 0; _s < this.enti[_e].sportelli.length; _s++) {
        if (this.enti[_e].sportelli[_s].cod_operatore === this.confCalendario.codice_operatore &&
          this.enti[_e].sportelli[_s].gruppo_operatore === this.confCalendario.gruppo_operatore &&
          this.enti[_e].sportelli[_s].subcodice === this.confCalendario.subcodice
        ) {
          this.enteIndex = _e;
          this.sportelli = this.enti[_e].sportelli;
          this.sportelloIndex = _s;
          this.sportelloPresente = true;
          break;
        }
      }
    }
  }

  onChangeEnte() {
    if (isNullOrUndefined(this.enteIndex)) {
      this.sportelli = null;
      this.sportelloIndex = null;
    } else {
      const ente: Ente = this.enti[this.enteIndex];
      if (isNullOrUndefined(ente)) {
        this.sportelli = null;
        this.sportelloIndex = null;
      } else {
        const sportelli: Array<Sportello> = ente.sportelli;
        this.sportelli = sportelli;
        if (isUndefined(this.sportelli)) {
          this.sportelloIndex = null;
        } else {
          this.sportelloIndex = this.sportelli.length > 0 ? 0 : null;
        }
        this.onChangeSportello();
      }
    }
    this.sportelloPresente = !isNull(this.sportelloIndex);
  }

  async onChangeSportello() {

    if (isNullOrUndefined(this.sportelloIndex)) {
      this.sportello = null;
    } else {
      this.sportello = this.enti[this.enteIndex].sportelli[this.sportelloIndex];
    }
    this.sportelloPresente = !isNull(this.sportelloIndex);
  }

  async onAggiungiPeriodo() {
    //
    if (this.isInserimentoNuovo && this.periodiValidita.length < 1) {
      const operatore = this.operatoreService.getOperatoreByRuolo();
      const parametriRicercaCalendari: ParametriRicercaCalendari = {
        cod_ambito: this.ambito,
        gruppo_operatore: this.sportelli[this.sportelloIndex].gruppo_operatore,
        cod_operaratore: this.sportelli[this.sportelloIndex].cod_operatore,
        subcodice: this.sportelli[this.sportelloIndex].subcodice,
        cod_tipo_utente: operatore.codice_tipo_utente,
        calendario_eliminato: false
      };
      const [calendariElenco] = await Promise.all([
        this.gestoreService.findCalendari(operatore.id_utente, parametriRicercaCalendari).toPromise()
      ]);
      const calendari = calendariElenco;
      if (calendari.length > 0) {
        const msg = await this.utilitiesService.getMessage('ME069');
        return this.utilitiesService.showToastrErrorMessage(msg, 'Calendario Dati Generali');

      }
    }
    this.showAggiungiPeriodo = !this.showAggiungiPeriodo;
    this.periodoIndex = -1;
    this.periodoValidita = {};

  }

  onModificaPeriodo(index: number) {
    this.periodoValidita = { ...this.periodiValidita[index] };
    this.periodoIndex = index;
    this.showAggiungiPeriodo = !this.showAggiungiPeriodo;
    if (this.inDuplicazione) {
      this.inModificaDuplicato = true;
    }
    this.modified = true;
  }

  onEliminaPeriodo(index: number) {
    this.periodiValidita = [
      ...this.periodiValidita.filter((el, idx) => idx !== index)
    ].sort((a, b) => Utils.sortPeriodiValidita(a, b));
    this.confCalendario.periodi_validita = this.periodiValidita;
    this.modified = true;
    if (this.inDuplicazione) {
      this.inDuplicazione = false;
      this.inModificaDuplicato = false;
      this.idDuplicato = null;
      this.periodoDuplicato = null;
    }
  }

  annullaPeriodo() {
    this.showAggiungiPeriodo = false;
    if (this.inDuplicazione && isNullOrUndefined(this.periodoDuplicato)) {
      this.inDuplicazione = false;
      this.inModificaDuplicato = false;
      this.idDuplicato = null;
      this.periodoDuplicato = null;
    }
  }

  successPeriodo() {
    this.showAggiungiPeriodo = false;
  }

  periodoAggiunto(periodo: ConfigurazioneCalendarioPeriodoValidita) {
    if (isNullOrUndefined(this.periodiValidita)) {
      this.periodiValidita = [];
    }
    if (this.inModificaDuplicato) {
      this.periodiValidita[this.periodoIndex] = periodo;
      this.inModificaDuplicato = false;
    } else {
      this.periodiValidita = [
        ...this.periodiValidita,
        periodo
      ].sort((a, b) => Utils.sortPeriodiValidita(a, b));
    }
    this.showAggiungiPeriodo = false;
    if (isNullOrUndefined(this.confCalendario)) {
      this.confCalendario = {};
    }
    this.confCalendario.periodi_validita = this.periodiValidita;
    this.periodoValidita = null;
    this.modified = true;
  }

  periodoModificato(periodo: ConfigurazioneCalendarioPeriodoValidita) {
    if (this.inDuplicazione) {
      this.periodoDuplicato = periodo;
      this.periodoAggiunto(periodo);
    } else if (isNullOrUndefined(this.periodiValidita) || this.periodoIndex < 0) {
      this.periodoAggiunto(periodo);
    } else {
      this.periodiValidita.splice(this.periodoIndex, 1, periodo);
      this.periodiValidita.sort((a, b) => Utils.sortPeriodiValidita(a, b));
    }

    this.showAggiungiPeriodo = false;
    if (isNullOrUndefined(this.confCalendario)) {
      this.confCalendario = {};
    }
    this.periodoValidita = null;
    this.confCalendario.periodi_validita = this.periodiValidita;
    this.modified = true;
  }

  onDuplicaPeriodo(index: number) {
    this.idDuplicato = this.periodiValidita[index].id_periodo;
    this.periodoValidita = {
      id_periodo: null,
      data_da: moment(this.periodiValidita[index].data_a).add(1, 'days').toDate(),
    };
    this.periodoIndex = index;
    this.showAggiungiPeriodo = !this.showAggiungiPeriodo;
    this.inDuplicazione = true;

    this.modified = true;
  }

  /**
   * controlli eseguiti al momento del pulsante [prosegui]
   *  ed esecuzione del salvataggio del calendario
   *   e della duplicazione nel caso di periodo duplicato
   *
   * al termine ricarica il calendario dal servizio
   */
  async onSalva() {
    if (!this.isFormNonToccato()) {
      await this.eseguiSalvataggioCalendario();
    } else {
      return this.router.navigate(['/calendario/dati-mail'], { queryParams: { idCalendario: this.confCalendario.id_calendario } });
    }
  }

  private async eseguiSalvataggioCalendario() {
    try {
      const op = this.operatoreService.getOperatoreByRuolo();

      const idUtente = op.id_utente;
      if (!isNullOrUndefined(this.confCalendario)) {
        this.confCalendario.codice_ambito = this.ambito;
        this.confCalendario.codice_operatore = this.sportelli[this.sportelloIndex].cod_operatore;
        this.confCalendario.nome = this.nomeCalendario;
        this.confCalendario.gruppo_operatore = this.sportelli[this.sportelloIndex].gruppo_operatore;
        this.confCalendario.subcodice = this.sportelli[this.sportelloIndex].subcodice;

        if (!isNullOrUndefined(this.confCalendario.periodi_validita)) {
          this.utilitiesService.showSpinner();
          // Ignore periodi da duplicare
          this.ignoraPeriodiDaDuplicare();
          const calendarioSalvato: ConfigurazioneCalendario = await this.gestoreService
            .saveCalendarioDatiGenerali(idUtente, this.confCalendario)
            .toPromise();
          if (this.periodoDuplicato) {
            await this.gestoreService.duplicaPeriodo(op.id_utente, {
              id_periodo: this.idDuplicato,
              data_a: this.periodoDuplicato.data_a,
              duplica_eccezione: false
            }).toPromise();
          }
          // Reload calendario
          this.confCalendario = await this.calendarioService.loadCalendario(calendarioSalvato.id_calendario).toPromise();

          this.utilitiesService.showToastrInfoMessage('Salvataggio Eseguito', 'ConfigurazioneCalendario');
          this.router.navigate(['/calendario/dati-mail'], { queryParams: { idCalendario: calendarioSalvato.id_calendario } });
        }
      }
    } catch (e) {
      const errore = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage || errore.message, 'Configurazione Dati Generali Calendario');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Ignora periodi da duplicare
   */
  private ignoraPeriodiDaDuplicare() {
    if (this.periodoDuplicato) {
      this.confCalendario.periodi_validita = [
        ...this.confCalendario.periodi_validita.filter(pv => pv !== this.periodoDuplicato)
      ];
    }
  }

  /**
   * Determines whether form non toccato is
   * @returns  true se non si è intervenuti sui dati nel form
   */
  private isFormNonToccato() {
    const readonly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);
    return readonly || (!this.form.dirty && !this.modified);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Determines whether indietro on
   *  controlli per tornare indietro
   */
  onIndietro() {
    if (this.readOnly || (!this.form.dirty && !this.modified)) {
      this.doIndietro();
    } else {
      $('#modal_indietro').modal({ backdrop: 'static', keyboard: false });
    }
  }

  /**
   * Do indietro - torna alla ricerca
   */
  doIndietro() {
    this.router.navigate(['/calendario/ricerca']);
  }


  /**
   * Determines whether periodo aggiungibile is
   * @returns true if periodo aggiungibile
   */
  isPeriodoAggiungibile(): boolean {
    return !(this.periodiValidita.find(t => !t.flag_slot_generati));
  }
}
