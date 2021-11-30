import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ConfigurazioneCalendarioPeriodoValidita } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { ParametriSistemaService, UtilitiesService, Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { isNull, isUndefined } from 'util';

@Component({
  selector: 'pslbowcl-aggiungi-periodo',
  templateUrl: './aggiungi-periodo.component.html',
  styleUrls: ['./aggiungi-periodo.component.css']
})
export class AggiungiPeriodoComponent implements OnInit {

  private static readonly FORMAT_DATE = 'DD/MM/YYYY';

  @Input() periodi: ConfigurazioneCalendarioPeriodoValidita[];
  @Input() periodoValidita: ConfigurazioneCalendarioPeriodoValidita;
  @Input() periodoIndex: number;
  @Input() duplicazione: boolean;
  @Output() success: EventEmitter<any> = new EventEmitter();
  @Output() annulla: EventEmitter<any> = new EventEmitter();
  @Output() periodoAggiunto: EventEmitter<ConfigurazioneCalendarioPeriodoValidita> = new EventEmitter();
  @Output() periodoModificato: EventEmitter<ConfigurazioneCalendarioPeriodoValidita> = new EventEmitter();

  private originalData: ConfigurazioneCalendarioPeriodoValidita;

  @ViewChild('periodoForm', { static: true }) form: NgForm;
  margine: number;
  constructor(
    private readonly utilitiesService: UtilitiesService,
    private readonly parametriSistemaService: ParametriSistemaService
  ) { }

  async ngOnInit() {
    // Clone data

    this.margine = await this.parametriSistemaService.AppuntamentoMargineGiorni;
    this.originalData = Utils.jsonParse(JSON.stringify(this.periodoValidita));
    if (isUndefined(this.periodoValidita) ) {
        this.periodoValidita = {};
        this.periodoValidita.data_da = null;
        this.periodoValidita.data_a = null;
    } else {
      if (isUndefined(this.periodoValidita.data_a)) {
        this.periodoValidita.data_a = null;
      }
      if (isUndefined(this.periodoValidita.data_da)) {
        this.periodoValidita.data_da = null;
      }
    }
  }

  onAnnulla() {
    this.annulla.emit();
  }

  /**
   * Determines whether submit on
   */
  async onSubmit() {
    const msg: string = await this.controlliPreSubmit();
    if (!isNull(msg)) {
        this.utilitiesService.showToastrErrorMessage(msg, 'Dati generali');
    } else {
      if (this.periodoIndex < 0) {
          this.periodoAggiunto.emit(this.periodoValidita);
      } else {
          this.periodoModificato.emit(this.periodoValidita);
      }
    }

  }
  /**
   * Controllis pre submit
   * @returns  msg con messaggio per utente
   */
  private async controlliPreSubmit() {
    let msg: string = null;
    if (this.periodoValidita.data_da.getTime() >= this.periodoValidita.data_a.getTime()) {
      msg = await this.utilitiesService.getMessage('ME053');
    } else {
      const nowPiuMargine = moment(new Date()).startOf('day').add(this.margine, 'days');
      if (this.duplicazione && moment(this.periodoValidita.data_a).startOf('day').isBefore(nowPiuMargine)) {
        //  La data fine validita\' del periodo digitato non puo\' essere antecedente alla data odierna '
        //
        msg = await this.utilitiesService.getMessage('ME132');
        msg = msg.replace('{0}', nowPiuMargine.format(AggiungiPeriodoComponent.FORMAT_DATE));
      } else if (!this.duplicazione && moment(this.periodoValidita.data_da).startOf('day').isBefore(nowPiuMargine)) {
        //  'La data inizio validita\' del periodo digitato non puo\' essere antecedente alla data odierna
        msg = await this.utilitiesService.getMessage('ME106');

        msg = msg.replace('{0}', nowPiuMargine.format(AggiungiPeriodoComponent.FORMAT_DATE));
      } else if (this.periodoSovrapposto()) {
        //  'il periodo indicato non deve sovrapporsi a periodi già presenti';
        msg = await this.utilitiesService.getMessage('ME052');
      }
    }
    return msg;
  }

  /**
   * periodoSovrapposto
   * @returns true se esistono periodi che si sovrappongono
   */
  periodoSovrapposto(): boolean {
    const momDataDa = moment(this.periodoValidita.data_da).startOf('day');
    const momDataA = moment(this.periodoValidita.data_a).startOf('day');
    for (let i = 0; i < this.periodi.length; i++) {
       if (i !== this.periodoIndex) {
          const perDataDa = moment(this.periodi[i].data_da).startOf('day');
          const perDataA = moment(this.periodi[i].data_a).startOf('day');
          if ((momDataDa.isBetween(perDataDa, perDataA)
              || momDataDa.isSame(perDataDa)
              || momDataDa.isSame(perDataA))
             || (momDataA.isBetween(perDataDa, perDataA)
             || momDataA.isSame(perDataDa)
             || momDataA.isSame(perDataA))
          ) {
                return true;
            }
       }
    }
    return false;
  }

  onDataInizioChange() {
    const dataCt = this.form.controls['dataInizio'];
    if (dataCt.valid) {
      const dataSt = dataCt.value;
      this.periodoValidita.data_da = moment(dataSt,  AggiungiPeriodoComponent.FORMAT_DATE).toDate();
    }
  }

  onDataFineChange() {
    const dataCt = this.form.controls['dataFine'];
    if (dataCt.valid) {
      const dataSt = dataCt.value;
      this.periodoValidita.data_a = moment(dataSt,  AggiungiPeriodoComponent.FORMAT_DATE).toDate();
    }
  }

}
