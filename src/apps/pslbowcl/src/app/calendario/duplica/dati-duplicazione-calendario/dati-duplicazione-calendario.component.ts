import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Ambito, Ente, Sportello, ConfigurazioneCalendario, ConfigurazioneCalendarioPeriodoValidita, GestoreService, ParametriDuplicazioneCalendario} from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { UtilitiesService, OperatoreService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Router } from '@angular/router';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { MOMENT_I18N_IT } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CalendarioService } from '../../calendario.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

/**
 * Component DatiDuplicazioneCalendarioComponent
 *
 * gestione form dati duplicazione calendario
 *
 */
@Component({
  selector: 'pslbowcl-dati-duplicazione-calendario',
  templateUrl: './dati-duplicazione-calendario.component.html',
  styleUrls: ['./dati-duplicazione-calendario.component.css']
})
export class DatiDuplicazioneCalendarioComponent implements OnInit, OnDestroy {

  @Input() title: string;
  @Input() disabledForm: boolean;
  @Input() id: string;
  @Input() confCalendario: ConfigurazioneCalendario;

  @Input() enti: Ente[];
  @Input() ambitoList: Ambito[];

  ambito: string;
  nomeCalendario: string;
  enteIndex: number;
  sportelloIndex: number;
  sportelli: Sportello[];
  sportello: Sportello;

  duplicaFasce: boolean;
  duplicaEccezioni: boolean;

  periodiValidita: ConfigurazioneCalendarioPeriodoValidita[];

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly calendarioService: CalendarioService,
    private readonly operatoreService: OperatoreService,
    private readonly gestoreService: GestoreService,
    private readonly utilitiesService: UtilitiesService,
    private readonly router: Router
  ) {
    moment.locale('it', MOMENT_I18N_IT);
  }

  ngOnInit() {
    this.ambito = this.confCalendario.codice_ambito || null;
    this.nomeCalendario = this.confCalendario.nome || null;
    this.periodiValidita = (this.confCalendario.periodi_validita || []).sort((a, b) => Utils.sortPeriodiValidita(a, b));

    this.enti = this.enti || [];
    this.ambitoList = this.ambitoList || [];

    this.duplicaFasce = true;
    this.duplicaEccezioni = false;

    this.initSportello();
  }
  private initSportello() {
    if (!this.confCalendario.codice_operatore && !this.confCalendario.gruppo_operatore && !this.confCalendario.subcodice) {
      if (this.enti.length === 1) {
        this.enteIndex = 0;
        this.sportelli = this.enti[this.enteIndex].sportelli;
        this.sportelloIndex = 0;
      }
      return;
    }

    for (let i = 0; i < this.enti.length; i++) {
      for (let j = 0; j < this.enti[i].sportelli.length; j++) {
        if (this.enti[i].sportelli[j].cod_operatore === this.confCalendario.codice_operatore
            && this.enti[i].sportelli[j].gruppo_operatore === this.confCalendario.gruppo_operatore
            && this.enti[i].sportelli[j].subcodice === this.confCalendario.subcodice) {
          this.enteIndex = i;
          this.sportelli = this.enti[i].sportelli;
          this.sportelloIndex = j;
          return;
        }
      }
    }
  }

  onChangeEnte() {
    if (this.enteIndex !== null && this.enteIndex !== undefined) {
      const ente = this.enti[this.enteIndex];
      if (ente) {
        this.sportelli = [...(ente.sportelli || [])];
        if (!this.sportelli.length) {
            this.sportelloIndex = null;
        } else {
            this.sportelloIndex = this.sportelli.length > 0 ? 0 : null;
        }
        this.onChangeSportello();
      } else {
        this.sportelli = null;
        this.sportelloIndex = null;
      }
    } else {
      this.sportelli = null;
      this.sportelloIndex = null;
    }
  }

  onChangeSportello() {
    if (this.sportelloIndex !== undefined && this.sportelloIndex !== null) {
      this.sportello = this.enti[this.enteIndex].sportelli[this.sportelloIndex];
    } else {
      this.sportello = null;
    }
  }

  onIndietro() {
    this.router.navigate(['/calendario/ricerca']);
  }

  async onSalva() {
    try {
      const op = this.operatoreService.getOperatoreByRuolo();

      const idUtente = op.id_utente;
      const parametriDuplicazioneCalendario: ParametriDuplicazioneCalendario = {};
      parametriDuplicazioneCalendario.ambito = this.ambito;
      parametriDuplicazioneCalendario.codice_operatore = this.sportelli[this.sportelloIndex].cod_operatore;
      parametriDuplicazioneCalendario.gruppo_operatore = this.sportelli[this.sportelloIndex].gruppo_operatore;
      parametriDuplicazioneCalendario.subcodice = this.sportelli[this.sportelloIndex].subcodice;
      parametriDuplicazioneCalendario.nome_calendario = this.nomeCalendario;
      parametriDuplicazioneCalendario.duplica_fasce = this.duplicaFasce;
      parametriDuplicazioneCalendario.duplica_eccezioni = this.duplicaEccezioni;

      this.utilitiesService.showSpinner();
      const calendario: ConfigurazioneCalendario = await this.gestoreService
            .duplicaCalendario(idUtente, this.confCalendario.id_calendario, parametriDuplicazioneCalendario)
            .toPromise();
      this.confCalendario = await this.calendarioService.loadCalendario(calendario.id_calendario).toPromise();
      this.utilitiesService.showToastrInfoMessage('Duplicazione eseguita con successo', 'Duplicazione Calendario');
      this.router.navigate(['/calendario/dati-generali'], { queryParams: { idCalendario: calendario.id_calendario } });
    } catch (e) {
      const errore = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage || errore.message, 'Configurazione Dati Generali Calendario');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
