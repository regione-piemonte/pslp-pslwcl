import { HttpErrorResponse } from '@angular/common/http';
import { AfterContentChecked, AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as merge from 'deepmerge';
import { Subscription } from 'rxjs';
import { ConfigurazioneCalendario, ConfigurazioneCalendarioEccezione, ConfigurazioneCalendarioFascia, ConfigurazioneCalendarioPeriodoValidita, GestoreService, ErrorDef } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { OperatoreService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { ConfigurazioneCalendarioService } from './configurazione-calendario.service';
import { DisponibilitaSettimanaleComponent } from './disponibilita-settimanale/disponibilita-settimanale.component';
import { EccezioniComponent } from './eccezioni/eccezioni.component';

/**
 * Component
 * gestione confiurazione calendario
 * periodi di validità
 */
@Component({
  selector: 'pslbowcl-configurazione',
  templateUrl: './configurazione.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigurazioneComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked, AfterContentChecked {

  private subscription: Subscription[] = [];

  @ViewChild(EccezioniComponent, { static: false }) eccezioniChild;
  @ViewChild(DisponibilitaSettimanaleComponent, { static: false }) disponibilitaChild;

  fasce: ConfigurazioneCalendarioFascia[];
  eccezioni: ConfigurazioneCalendarioEccezione[];

  idPeriodo: number;

  confCalendario: ConfigurazioneCalendario;
  periodoValidita: ConfigurazioneCalendarioPeriodoValidita = {};
  readOnly = false;
  titolo: string;
  ritornoRicerca = false;
  disableConfermaIncontri = true;
  apertoFascia = false;
  apertoEccezione = false;

  get periodiValidita(): ConfigurazioneCalendarioPeriodoValidita[] {
    return this.confCalendario.periodi_validita.sort((a, b) => Utils.sortPeriodiValidita(a, b));
  }

  constructor(
    private readonly gestoreService: GestoreService,
    private readonly operatoreService: OperatoreService,
    private readonly configurazioneCalendarioService: ConfigurazioneCalendarioService,
    private readonly utilitiesService: UtilitiesService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly changeDetectionRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.subscription.push(
      this.route.data.subscribe((data: ConfigurazioneCalendario) => this.confCalendario = data['configurazioneCalendario'] || {})
    );
    this.titolo = 'Configurazione disponibilità ed eccezioni - '
      + this.confCalendario.nome
      + ' [ ' + this.confCalendario.codice_ambito + ' ]';
    this.configurazioneCalendarioService.updatePeriodo(null);
    this.configurazioneCalendarioService.updateFasce(null);
    this.configurazioneCalendarioService.updateEccezioni(null);

    this.subscription.push(
      this.configurazioneCalendarioService.periodo$.subscribe(p => this.handlePeriodoUpdate(p)),
      this.configurazioneCalendarioService.fasce$.subscribe(v => this.fasce = v),
      this.configurazioneCalendarioService.eccezioni$.subscribe(v => this.eccezioni = v)
    );

    if (this.confCalendario.periodi_validita.length === 1) {
      this.idPeriodo = this.confCalendario.periodi_validita[0].id_periodo;
      this.onChangePeriodo();
    }

    this.disableConfermaIncontri = false;
    this.readOnly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);

  }

  private handlePeriodoUpdate(periodo: ConfigurazioneCalendarioPeriodoValidita) {
    if (!periodo) {
      return;
    }
    this.confCalendario.periodi_validita = [
      ...(this.confCalendario.periodi_validita || []).filter(pv => +pv.id_periodo !== periodo.id_periodo),
      periodo
    ].filter(pv => pv.id_periodo !== undefined);
  }

  ngOnDestroy(): void {
    this.subscription.forEach(v => v.unsubscribe);
  }

  /**
   * esegue il savataggio della fascia oraria
   * tramite servizio saveCalendarioFasce
   */
  onSalvaFasciaOraria() {
    const operatore = this.operatoreService.getOperatoreByRuolo();
    //  da valorizzare
    const confCalendario: ConfigurazioneCalendario = {
      id_calendario: null,
      nome: null,
      codice_ambito: null,
      gruppo_operatore: null,
      codice_operatore: null,
      subcodice: null,
      dati_operativi: null,
      periodi_validita: null,
      mail: null
    };
    this.gestoreService.saveCalendarioFasce(operatore.id_utente, confCalendario);
  }

  onSalvaEccezioni() {
  }

  onChangePeriodo() {
    this.periodoValidita = merge({}, this.confCalendario.periodi_validita.find(el => +el.id_periodo === +this.idPeriodo) || {});
    this.configurazioneCalendarioService.updatePeriodo(this.periodoValidita);
    this.configurazioneCalendarioService.updateFasce(this.periodoValidita.fasce);
    this.configurazioneCalendarioService.updateEccezioni(this.periodoValidita.eccezioni);
  }

  onIndietro() {
    this.ritornoRicerca = false;
    this.doIndietro();
  }

  onTorna() {
    this.ritornoRicerca = true;
    this.doIndietro();
  }

  /**
   * Do indietro
   * torna alla pagina precedente o alla ricerca
   */
  doIndietro() {
    if (this.ritornoRicerca === true) {
      this.router.navigate(['/calendario/ricerca']);
    } else {
      this.router.navigate(['/calendario/dati-operativi'], { queryParams: { idCalendario: this.confCalendario.id_calendario } });
    }
  }

  /**
   * Determines whether genera on
   *  genera incontri
   */
  async onGenera() {
    const readonly = this.sessionStorageService.getItem<boolean>(SessionStorageService.READONLY, true);
    if (readonly) {
      return this.router.navigate(['/calendario/incontri'], { queryParams: { idCalendario: this.confCalendario.id_calendario } });
    }

    const periodi = (this.confCalendario.periodi_validita).filter(pv => !pv.flag_slot_generati && pv.fasce && pv.fasce.length);
    try {
      if (periodi.length) {
        const op = this.operatoreService.getOperatoreByRuolo();
        this.utilitiesService.showSpinner();
        for (const periodo of periodi) {
          await this.gestoreService.generaSlot(op.id_utente, periodo.id_periodo).toPromise();
        }
      }
      this.router.navigate(['/calendario/incontri'], { queryParams: { idCalendario: this.confCalendario.id_calendario } });
    } catch (e) {
      const errore: ErrorDef = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage, 'Configurazione calendario');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Determines whether incontri da generare has
   * @returns  boolean true se presenti incontri da generare
   */
  hasIncontriDaGenerare() {
    const periodi = (this.confCalendario.periodi_validita).filter(pv => !pv.flag_slot_generati && pv.fasce && pv.fasce.length);
    if (periodi.length) {
      return true;
    }
    return false;
  }

  /**
   * Determines whether periodo senza fasce has
   * @returns  boolean true se il periodo non ha fasce configurate
   */
  hasPeriodoSenzaFasce() {
    const periodi = (this.confCalendario.periodi_validita).filter(pv => !pv.flag_slot_generati && ( !pv.fasce || pv.fasce.length < 1 ));
    if (periodi.length) {
      return true;
    }
    return false;
  }

  ngAfterViewInit() {
    this.impostaDisableChild();
  }

  ngAfterViewChecked() {
    this.impostaDisableChild();
  }

  /**
   * Imposta disable child
   *
   *   fa in modo che non si possano modificare i dati dei component figli
   */
  impostaDisableChild() {
    if (!isNullOrUndefined(this.eccezioniChild) && !isNullOrUndefined(this.disponibilitaChild)) {
      this.disableConfermaIncontri = this.eccezioniChild.apertoNuovaEccezione ||
        this.disponibilitaChild.apertoNuovaFascia;
      this.eccezioniChild.disableConfermaIncontri = this.disableConfermaIncontri;
      this.disponibilitaChild.disableConfermaIncontri = this.disableConfermaIncontri;
      this.apertoFascia = this.disponibilitaChild.apertoNuovaFascia;
      this.apertoEccezione = this.eccezioniChild.apertoNuovaEccezione;
      if (this.apertoFascia) {
        this.eccezioniChild.apertoAltro = true;
        this.disponibilitaChild.apertoAltro = false;
      } else if (this.apertoEccezione) {
        this.eccezioniChild.apertoAltro = false;
        this.disponibilitaChild.apertoAltro = true;
      } else {
        this.eccezioniChild.apertoAltro = false;
        this.disponibilitaChild.apertoAltro = false;
      }
    } else if (!isNullOrUndefined(this.disponibilitaChild)) {
      this.disableConfermaIncontri = this.disponibilitaChild.apertoNuovaFascia;
      this.disponibilitaChild.disableConfermaIncontri = this.disableConfermaIncontri;
      this.apertoFascia = this.disponibilitaChild.apertoNuovaFascia;
      this.disponibilitaChild.apertoAltro = false;
    } else if (!isNullOrUndefined(this.eccezioniChild)) {
      this.disableConfermaIncontri = this.eccezioniChild.apertoNuovaEccezione;
      this.eccezioniChild.disableConfermaIncontri = this.disableConfermaIncontri;
      this.apertoEccezione = this.eccezioniChild.apertoNuovaEccezione;
      this.eccezioniChild.apertoAltro = false;
    } else {
      this.disableConfermaIncontri = false;
    }
    if (this.hasIncontriDaGenerare() && this.hasPeriodoSenzaFasce()) {
      this.disableConfermaIncontri = true;
    }
  }
  ngAfterContentChecked(): void {
    this.changeDetectionRef.detectChanges();
  }
}
