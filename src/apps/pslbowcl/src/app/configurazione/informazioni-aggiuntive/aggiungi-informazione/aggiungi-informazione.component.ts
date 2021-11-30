import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConfigurazioneInformazioneAggiuntiva, ErrorDef, GestoreService } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, OperatoreService, UtilitiesService, Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';


@Component({
  selector: 'pslbowcl-aggiungi-informazione',
  templateUrl: './aggiungi-informazione.component.html',
  styleUrls: ['./aggiungi-informazione.component.css']
})
export class AggiungiInformazioneComponent implements OnInit {

  @Input() configurazione: ConfigurazioneInformazioneAggiuntiva;
  @Input() ambito: string;
  @Output() success: EventEmitter<any> = new EventEmitter();
  @Output() annulla: EventEmitter<any> = new EventEmitter();

  originalData: ConfigurazioneInformazioneAggiuntiva;
  @Input() flgBloccante: boolean;
  @Input() flgVisibile: boolean;
  readOnly = false;
  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly gestoreService: GestoreService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  ngOnInit() {
    // Clone data

    if (isNullOrUndefined(this.configurazione)) {
      this.configurazione = {};
      this.configurazione.cod_ambito = this.ambito;
      this.configurazione.data_inizio = null;
      this.configurazione.data_fine = null;
      this.configurazione.flag_visibile_pslp = 'true';
      this.configurazione.bloccante = 'false';
    }
    if (isNullOrUndefined(this.configurazione.cod_ambito)) {

      this.configurazione.cod_ambito = this.ambito;

    }
    this.originalData = Utils.jsonParse(JSON.stringify(this.configurazione));

  }

  onAnnulla() {

    this.annulla.emit();
  }

  async onSalva() {
    try {
      if (this.configurazione.data_inizio.getTime() > this.configurazione.data_fine.getTime()) {
        const msg = await this.utilitiesService.getMessage('ME053');
        return this.utilitiesService.showToastrErrorMessage(msg, 'Dati generali');
      }
      this.utilitiesService.showSpinner();
      if (isNullOrUndefined(this.configurazione.cod_ambito)) {
        this.configurazione.cod_ambito = this.ambito;
      }
      if (!isNullOrUndefined(this.configurazione)
        && !isNullOrUndefined(this.configurazione.cod_ambito)
      ) {
        this.setFlagVisible();
        this.setFlagBloccante();
        this.configurazione.valore = "N";
        const op = this.operatoreService.getOperatoreByRuolo();
        const idUtente = op.id_utente;
        const esito: ConfigurazioneInformazioneAggiuntiva = await this.gestoreService.saveConfigurazioneInformazioniAggiuntive(idUtente, this.configurazione).pipe(
          catchError(err => {
            this.logService.error('[aggiungi-informazione.component::onSalva]', JSON.stringify(err));
            const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
            const esito2: ConfigurazioneInformazioneAggiuntiva = {
              codice: null,
              descrizione: errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage
            };
            return of(esito2);
          })).toPromise();
        this.utilitiesService.hideSpinner();
        if (isNullOrUndefined(esito.codice)) {
          throw new Error(esito.descrizione);
        }
        this.utilitiesService.showToastrInfoMessage('Salvataggio Eseguito', 'ConfigurazioneMail');
        this.success.emit();
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'ConfigurazioneInformazioniAggiuntive');
    }
    this.utilitiesService.hideSpinner();
  }

  private setFlagBloccante() {
    if (this.flgBloccante === true) {
      this.configurazione.bloccante = "S";
    } else {
      this.configurazione.bloccante = "N";
    }
  }

  private setFlagVisible() {
    if (this.flgVisibile === true) {
      this.configurazione.flag_visibile_pslp = "S";
    } else {
      this.configurazione.flag_visibile_pslp = "N";
    }
  }
}
