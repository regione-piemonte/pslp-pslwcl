import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConfigurazioneCalendario, ConfigurazioneCalendarioMail, GestoreService } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { UtilitiesService, OperatoreService, SessionStorageService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { isUndefined, isNull, isNumber } from 'util';
import * as moment from 'moment';
import { MOMENT_I18N_IT } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CalendarioService } from '../calendario.service';
import { Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

declare const $: any;

/**
 * Component DatiMailComponent
 *
 * per la gestione dei dati mail relativi alla configurazione del calendario
 */
@Component({
  selector: 'pslbowcl-dati-mail',
  templateUrl: './dati-mail.component.html',
  styleUrls: ['./dati-mail.component.css']
})
export class DatiMailComponent implements OnInit, OnDestroy  {
  @ViewChild('datiMailForm', { static: true }) form: NgForm;
  confCalendario: ConfigurazioneCalendario;
  confCalendarioMail: ConfigurazioneCalendarioMail;
  mostraOre = true;
  cacheOre = 0;
  idCalendario: number;
  flagInvioMailPromemoria: boolean;
  readOnly = false;
  modified = false;
  private readonly subscriptions: Subscription[] = [];
  titolo: string;
  flgToBeSaved: boolean;
  ritornoRicerca: boolean;

  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly calendarioService: CalendarioService,
    private readonly utilitiesService: UtilitiesService,
    private readonly gestoreService: GestoreService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
    ) {
    moment.locale('it', MOMENT_I18N_IT);
  }

  ngOnInit() {
    this.subscriptions.push(
      this.route.data.subscribe(data => this.confCalendario = data['configurazioneCalendario'])
    );
    this.idCalendario = this.confCalendario.id_calendario;
    this.titolo = "Dati e-mail - " + this.confCalendario.nome + " [ " + this.confCalendario.codice_ambito + " ]";
    this.confCalendarioMail = Utils.jsonParse(JSON.stringify(this.confCalendario.mail || {}));

    if (isUndefined(this.confCalendarioMail.flag_invio_mail_conferma_prenotazione)
        || isNull(this.confCalendarioMail.flag_invio_mail_conferma_prenotazione)) {
      this.confCalendarioMail.flag_invio_mail_conferma_prenotazione = true;
    }
    this.flgToBeSaved = false;
    if (isUndefined(this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione)
        || isNull(this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione)
        || !isNumber(this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione)) {
      this.flgToBeSaved = true;
      this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione = 23;
      this.flagInvioMailPromemoria = true;
      this.mostraOre = true;
    } else if (isNumber(this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione)
        && this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione > 0) {
      this.flagInvioMailPromemoria = true;
      this.mostraOre = true;
    } else {
      this.flagInvioMailPromemoria = false;
      this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione = 0;
      this.mostraOre = false;
    }

    this.readOnly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);

  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * esegue salvataggio alla pressione del pulsante prosegui/salva
   */
  async onSalva() {
    if (this.checkDati()) {
       this.salva();
    }
  }

  /**
   * Checks dati
   * @returns true if dati pronti per salvataggio
   */
  checkDati(): boolean {
    let result = true;
    if ( (this.confCalendarioMail.flag_invio_mail_conferma_prenotazione === null
        || this.confCalendarioMail.flag_invio_mail_conferma_prenotazione === undefined) ||
         (this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione === null
        || this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione === undefined
        || isNaN(+this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione)) ) {
      result = false;
    }

    return result;
  }

  /**
   * Salva dati mail component
   *
   * esegue il salvataggio chiamando il servizio
   *
   */
  async salva() {
    const readonly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);
    if (readonly || (!this.flgToBeSaved && !this.form.dirty && !this.modified)) {
      return this.router.navigate(
        ['/calendario/dati-operativi'],
        { queryParams: { idCalendario: this.confCalendario.id_calendario  } }
      );
    }

    try {
      const op = this.operatoreService.getOperatoreByRuolo();

      if (!isNull(this.confCalendario) && !isUndefined(this.confCalendario)) {
        this.confCalendario.mail = this.confCalendarioMail;
        this.utilitiesService.showSpinner();

        // tslint:disable-next-line: max-line-length
        const calendarioSalvato: ConfigurazioneCalendario = await this.gestoreService.saveCalendarioMail(op.id_utente, this.confCalendario).toPromise();
        // Reload calendario
        this.confCalendario = await this.calendarioService.loadCalendario(calendarioSalvato.id_calendario).toPromise();
        this.utilitiesService.showToastrInfoMessage('Salvataggio Eseguito', 'Configurazione Dati Mail Calendario');
        this.router.navigate(['/calendario/dati-operativi'], { queryParams: { idCalendario: calendarioSalvato.id_calendario } });
      }
    } catch (e) {
      const errore = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage || errore.message, 'Configurazione Dati Mail Calendario');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Azzera ore promemoria
   *
   */
  azzeraOrePromemoria() {
    this.flagInvioMailPromemoria = false;
    if (this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione > 0) {
      this.cacheOre = this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione;
    }
    this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione = 0;
    this.mostraOre = false;
  }

  /**
   * Mostra ore promemoria
   *
   */
  mostraOrePromemoria() {
    this.mostraOre = true;
    this.confCalendarioMail.ore_invio_mail_promemoria_prenotazione = this.cacheOre || 23;
  }

  onIndietro() {
    this.ritornoRicerca = false;
    if (this.readOnly || (!this.form.dirty && !this.modified)) {

      this.doIndietro();
    } else {
      $('#modal_indietro').modal({backdrop: 'static', keyboard: false});
    }
  }

  /**
   * torna al passo  wizard precedente o alla ricerca
   *
   */
  doIndietro() {
    if (this.ritornoRicerca === true) {
       this.router.navigate(['/calendario/ricerca']);
    } else {
      this.router.navigate(['/calendario/dati-generali'], { queryParams: { idCalendario: this.idCalendario  } });
    }
  }

  /**
   * decide se visualizza modale di conferma per tornare indietro
   *
   */
  onTorna() {
    this.ritornoRicerca = true;
    if (this.readOnly || (!this.form.dirty && !this.modified)) {
      this.doIndietro();
    } else {
      $('#modal_indietro').modal({backdrop: 'static', keyboard: false});
    }
  }

}
