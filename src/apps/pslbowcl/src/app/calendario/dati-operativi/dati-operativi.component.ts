import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurazioneCalendario, ConfigurazioneCalendarioDatiOperativi, ErrorDef, GestoreService } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { CampoApplicabileAdAltriCalendari, MOMENT_I18N_IT } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, OperatoreService, ParametriSistemaService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isBoolean, isNullOrUndefined, isNumber, isUndefined } from 'util';
import { ApplicaAdAltriComponent } from '../applica-ad-altri/applica-ad-altri.component';
import { CalendarioService } from '../calendario.service';


declare const $: any;

/**
 * Component DatiOperativiComponent
 *
 * gestione form dati oerativi configurazione calendario
 *
 */
@Component({
  selector: 'pslbowcl-dati-operativi',
  templateUrl: './dati-operativi.component.html',
  styleUrls: ['./dati-operativi.component.css']
})

export class DatiOperativiComponent implements OnInit, OnDestroy {
  @ViewChild('datiOperativiForm', { static: true }) form: NgForm;
  @ViewChild(ApplicaAdAltriComponent, { static: true }) applicaChild;

  enableApplica = true;
  confCalendario: ConfigurazioneCalendario;
  confCalendarioDatiOperativi: ConfigurazioneCalendarioDatiOperativi;
  private subscription: Subscription;

  flagSpostamento = 'SI';
  flagAnnullamento = 'SI';
  cacheOre = 0;
  mostraOre = true;
  visibilitaCpiMap: { [key: string]: string } =
    {
      'D': 'Domicilio',
      'R': 'Residenza',
      'T': 'Tutti'
    };
  mostraDisdettaGG: boolean;
  idCalendario: number;
  readOnly = false;
  modified = false;
  titolo: string;
  flgToBeSaved = false;
  ritornoRicerca = false;
  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService,
    private readonly gestoreService: GestoreService,
    private readonly calendarioService: CalendarioService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly parametriSistema: ParametriSistemaService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    moment.locale('it', MOMENT_I18N_IT);
  }

  async ngOnInit() {
    this.subscription = this.route.data.subscribe(
      (data: ConfigurazioneCalendario) => this.confCalendario = data['configurazioneCalendario']
    );
    this.idCalendario = this.route.snapshot.queryParams['idCalendario'];
    this.titolo = "Dati Operativi - " + this.confCalendario.nome + " [ " + this.confCalendario.codice_ambito + " ]";
    this.idCalendario = this.confCalendario.id_calendario;
    let confCalDatiOperativi: ConfigurazioneCalendarioDatiOperativi = {};
    if (!isUndefined(this.confCalendario.dati_operativi)) {
      confCalDatiOperativi = JSON.parse(JSON.stringify(this.confCalendario.dati_operativi));
    }
    this.confCalendarioDatiOperativi = confCalDatiOperativi;

    if (isNullOrUndefined(this.confCalendarioDatiOperativi)) {
      this.confCalendarioDatiOperativi = {};
    }

    this.setMostraDisdettaGG();

    if (isNullOrUndefined(this.confCalendarioDatiOperativi.flag_annullamento)) {
      this.confCalendarioDatiOperativi.flag_annullamento = false;
    }
    this.flgToBeSaved = false;
    if (isNullOrUndefined(this.confCalendarioDatiOperativi.ore_limite_spostamento) ||
      !isNumber(this.confCalendarioDatiOperativi.ore_limite_spostamento)) {
      this.confCalendarioDatiOperativi.ore_limite_spostamento = 24;
      this.flagSpostamento = 'SI';
      this.mostraOre = true;
      this.flgToBeSaved = true;
    } else if (isNumber(this.confCalendarioDatiOperativi.ore_limite_spostamento) &&
      this.confCalendarioDatiOperativi.ore_limite_spostamento > 0) {
      this.flagSpostamento = 'SI';
      this.mostraOre = true;
    } else {
      this.flagSpostamento = 'NO';
      this.confCalendarioDatiOperativi.ore_limite_spostamento = 0;
      this.mostraOre = false;
    }

    if (isNullOrUndefined(this.confCalendarioDatiOperativi.flag_annullamento) ||
      !isBoolean(this.confCalendarioDatiOperativi.flag_annullamento)) {
      this.confCalendarioDatiOperativi.flag_annullamento = true;
      this.flagAnnullamento = 'SI';
    } else if (this.confCalendarioDatiOperativi.flag_annullamento === true) {
      this.flagAnnullamento = 'SI';
    } else {
      this.flagAnnullamento = 'NO';
    }
    this.enableApplica = await this.parametriSistema.isOperatoriApplicaEnabled;
    this.readOnly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);
  }

  private setMostraDisdettaGG() {
    if (isNullOrUndefined(this.confCalendario.codice_ambito) || this.confCalendario.codice_ambito === 'GG') {
      this.mostraDisdettaGG = true;
    } else {
      this.mostraDisdettaGG = false;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onIndietro() {
    this.ritornoRicerca = false;
    this.tornaIndietro();
  }
  onTorna() {
    this.ritornoRicerca = true;
    this.tornaIndietro();
  }
  private tornaIndietro() {
    if (this.readOnly || (!this.form.dirty && !this.modified)) {
      this.doIndietro();
    } else {
      $('#modal_indietro').modal({ backdrop: 'static', keyboard: false });
    }
  }

  doIndietro() {
    if (this.ritornoRicerca === true) {
      this.router.navigate(['/calendario/ricerca']);
    } else {
      this.router.navigate(['/calendario/dati-mail'], { queryParams: { idCalendario: this.idCalendario } });
    }
  }

  async onSalva() {
    if (this.checkDati()) {
      this.salva();
    }
  }

  /**
   * Checks dati
   * imposta valori default per ambito Garanzia Giovani
   * @returns true
   */
  checkDati(): boolean {
    const result = true;
    if (this.confCalendario.codice_ambito !== 'GG') {
      this.confCalendarioDatiOperativi.flag_annullamento = false;
    } else if (this.flagAnnullamento === 'SI') {
      this.confCalendarioDatiOperativi.flag_annullamento = true;
    } else {
      this.confCalendarioDatiOperativi.flag_annullamento = false;
    }
    return result;
  }

  /**
   * Salva dati operativi configurazione calendario
   *  utilizza servizio salvataggio e rilegge
   */
  async salva() {
    if (this.isFormNonToccato()) {
      return this.router.navigate(
        ['/calendario/configurazione'],
        { queryParams: { idCalendario: this.confCalendario.id_calendario } }
      );
    }

    try {
      const op = this.operatoreService.getOperatoreByRuolo();
      const idUtente = op.id_utente;
      if (!isNullOrUndefined(this.confCalendario)) {
        this.confCalendario.dati_operativi = this.confCalendarioDatiOperativi;
        if (!isNullOrUndefined(this.confCalendario.dati_operativi)) {
          this.utilitiesService.showSpinner();

          // tslint:disable-next-line: max-line-length
          const calendarioSalvato: ConfigurazioneCalendario = await this.gestoreService.saveCalendarioDatiOperativi(idUtente, this.confCalendario)
            .pipe(
              catchError(err => {
                this.logService.error('[dati-operativi.component::salva]', JSON.stringify(err));
                const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
                const calendarioErr: ConfigurazioneCalendario = {
                  nome: errore.errorMessage
                };
                return of(calendarioErr);
              })).toPromise();
          // Reload calendario
          this.confCalendario = await this.calendarioService.loadCalendario(calendarioSalvato.id_calendario).toPromise();
          this.utilitiesService.hideSpinner();
          if (isNullOrUndefined(calendarioSalvato)) {
            throw new Error('salvataggio non riuscito');
          }
          if (isNullOrUndefined(calendarioSalvato.id_calendario)) {
            throw new Error('salvataggio non riuscito ' + calendarioSalvato.nome);
          }
          this.utilitiesService.showToastrInfoMessage('Salvataggio Eseguito', 'ConfigurazioneCalendario');
          this.router.navigate(['/calendario/configurazione'], { queryParams: { idCalendario: calendarioSalvato.id_calendario } });
        }
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'Configurazione Dati operativi Calendario');
    }
  }

  /**
   * Determines whether form non toccato is
   * @returns  true se dati form non toccati
   */
  private isFormNonToccato() {
    const readonly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);
    return readonly || (!this.flgToBeSaved && !this.form.dirty && !this.modified);
  }

  /**
   * Azzera ore limite spostamento
   */
  azzeraOreSpostamento() {
    this.flagSpostamento = 'NO';
    if (this.confCalendarioDatiOperativi.ore_limite_spostamento > 0) {
      this.cacheOre = this.confCalendarioDatiOperativi.ore_limite_spostamento;
    }
    this.confCalendarioDatiOperativi.ore_limite_spostamento = 0;
    this.mostraOre = false;
  }

  /**
   * Mostra  ore limite spostamento
   */
  mostraOreSpostamento() {
    this.mostraOre = true;
    if (this.cacheOre > 0) {
      this.confCalendarioDatiOperativi.ore_limite_spostamento = this.cacheOre;
    } else {
      this.confCalendarioDatiOperativi.ore_limite_spostamento = 23;
    }
  }
  /**
   * imposta flag per Annullamento appuntamento SI
   */
  onAnnullamentoSi() {
    this.flagAnnullamento = 'SI';
    this.confCalendarioDatiOperativi.flag_annullamento = true;
  }
  /**
   * imposta flag per Annullamento NO
   */
  onAnnullamentoNo() {
    this.flagAnnullamento = 'NO';
    this.confCalendarioDatiOperativi.flag_annullamento = false;
  }

  /**
   * Determines whether applica visibilita on
   */
  async onApplicaVisibilita() {
    const campoApplicare: CampoApplicabileAdAltriCalendari = {
      cod_ambito: this.confCalendario.codice_ambito,
      codiceCampo: "visibile_in_base",
      nomeCampo: " Visibilit&agrave; in base al CpI di",
      valore: this.confCalendarioDatiOperativi.flag_visibilita_cpi,
      valoreDescr: this.visibilitaCpiMap[this.confCalendarioDatiOperativi.flag_visibilita_cpi],
      idCalendario: this.confCalendario.id_calendario
    };
    this.applicaChild.campoDaApplicare = campoApplicare;
    this.applicaChild.show();
  }
  /**
   * Determines whether applica sposta on
   *  se possibile spostare un appuntamento
   */
  onApplicaSposta() {
    // Possibilit&agrave; di spostare un appuntamento
    const campoApplicare: CampoApplicabileAdAltriCalendari = {
      cod_ambito: this.confCalendario.codice_ambito,
      codiceCampo: "ore_limite_spostamento",
      valoreNum: this.confCalendarioDatiOperativi.ore_limite_spostamento,
      nomeCampo: "Possibilit&agrave; di spostare un appuntamento",

      valoreDescr: this.confCalendarioDatiOperativi.ore_limite_spostamento > 0 ?
        "SI entro ore: " + this.confCalendarioDatiOperativi.ore_limite_spostamento :
        "NO",
      idCalendario: this.confCalendario.id_calendario
    };
    this.applicaChild.campoDaApplicare = campoApplicare;
    this.applicaChild.show();
  }
  /**
   * Determines whether applica msg spostamento on
   */
  onApplicaMsgSpostamento() {
    const campoApplicare: CampoApplicabileAdAltriCalendari = {
      cod_ambito: this.confCalendario.codice_ambito,
      codiceCampo: "messaggio_spostamento_appuntamento",

      nomeCampo: "Messaggio visualizzato quando si sposta un appuntamento",
      valore: this.confCalendarioDatiOperativi.messaggio_spostamento,
      valoreDescr: this.confCalendarioDatiOperativi.messaggio_spostamento,
      idCalendario: this.confCalendario.id_calendario
    };
    this.applicaChild.campoDaApplicare = campoApplicare;
    this.applicaChild.show();
  }

  /**
   * Determines whether applica flag annullamento on
   */
  onApplicaFlagAnnullamento() {
    const campoApplicare: CampoApplicabileAdAltriCalendari = {
      cod_ambito: this.confCalendario.codice_ambito,
      codiceCampo: "annulla_garanzia_giovani",

      nomeCampo: "Possibilit&agrave; di specificare che in caso di disdetta di un appuntamento, si annulla l'adesione a Garanzia Giovani",
      valoreLogico: this.confCalendarioDatiOperativi.flag_annullamento,
      valoreDescr: this.flagAnnullamento,
      idCalendario: this.confCalendario.id_calendario
    };
    this.applicaChild.campoDaApplicare = campoApplicare;
    this.applicaChild.show();
  }


  /**
   * Determines whether applica msg annullamento on
   */
  onApplicaMsgAnnullamento() {
    const campoApplicare: CampoApplicabileAdAltriCalendari = {
      cod_ambito: this.confCalendario.codice_ambito,
      codiceCampo: "messaggio_annullamento_appuntamento",
      nomeCampo: "Messaggio visualizzato quando si annulla un appuntamento",
      valore: this.confCalendarioDatiOperativi.messaggio_annullamento,
      valoreDescr: this.confCalendarioDatiOperativi.messaggio_annullamento,
      idCalendario: this.confCalendario.id_calendario
    };
    this.applicaChild.campoDaApplicare = campoApplicare;
    this.applicaChild.show();
  }
}
