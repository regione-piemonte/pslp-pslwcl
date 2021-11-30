import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, NgForm, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { BusinessService, Cittadinanza, Comune, DomandaRDC, ErrorDef, Esito, Indirizzo, Nazione, Recapito, SchedaAnagraficoProfessionale, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { NavigationEmitter, Sesso, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, ParametriSistemaService, UtilitiesService, CommonPslpService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { BehaviorSubject, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, delay, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/operators';


const SALVA_PROSEGUI = 'SALVA & PROSEGUI';
@Component({
  selector: 'app-dati-anagrafici-tutore',
  templateUrl: './dati-anagrafici-tutore.component.html'
})
export class DatiAnagraficiTutoreComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('anagraficaForm', { static: false }) anagraficaForm: NgForm;

  isRdcEnabled: Promise<boolean>;
  private loaded$: Subject<boolean> = new BehaviorSubject(false);
  sap: SchedaAnagraficoProfessionale;
  copiaDa: Indirizzo = null;

  liste = {
    tipiResponsabilita: [],
    sessi: [],
    nazioni: [],
    cittadinanze: [],
    statusExtraUe: [],
    motiviRilascio: [],
  };
  utenteACarico: UtenteACarico;
  flagResidenzaChanging = false;
  flagDomicilioChanging = false;
  flagRecapitiChanging = false;
  flagValidAnagraphicsForm = false;
  flagCittadinanzaUE = false;

  searching = false;
  searchFailed = false;
  readOnly: boolean;
  popdown: boolean;
  helpMessage: string;
  nextButtonName: string;
  prevButtonName: string;
  tipoResponsabilita: string;
  domandaRDC: DomandaRDC;
  noNazioneAndComuneNascita: () => any;
  nazioneComuneError: string;
  messaggioErroreDati: string;

  private changed = false;
  private readonly subscriptions: Subscription[] = [];
  private comuni: Comune[];
  mayUpdateResidenza: boolean;

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly businessService: BusinessService,
    private readonly logService: LogService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly utilitiesService: UtilitiesService
  ) {}

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.isRdcEnabled = this.parametriSistemaService.isRdcEnabled;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = this.commonPslpService.wizard === false ? 'INDIETRO' : 'ANNULLA';
    this.noNazioneAndComuneNascita = this._noNazioneAndComuneNascita.bind(this);
    this.popdown = !this.commonPslpService.wizard;
    this.utenteACarico = this.commonPslpService.utenteACarico;
    this.tipoResponsabilita = this.utenteACarico.tipo_responsabilita.codice;
    this.readOnly = this.commonPslpService.readOnly;
    const [comuni, nazioni, cittadinanze, statusExtraUe, motiviRilascio,
        tipiResponsabilita, sap, helpMessage, messaggioErroreDati] = await Promise.all([
      this.utilitiesService.getAllComuni(),
      this.businessService.getNazioni().toPromise(),
      this.businessService.getCittadinanze().toPromise(),
      this.businessService.findElencoStatusExtraUE().toPromise(),
      this.businessService.findMotiviRilascioPermessoDiSoggiorno().toPromise(),
      this.businessService.findTipiResponsabilita().toPromise(),
      this.businessService.getDatiResponsabile(this.commonPslpService.tutore.id_utente).pipe(
        catchError(err => of({} as SchedaAnagraficoProfessionale))
      ).toPromise(),
      this.utilitiesService.getMessage('HC004'),
      this.utilitiesService.getMessage('ME044')
    ]);
    this.comuni = comuni;
    this.liste.nazioni = nazioni;
    this.liste.cittadinanze = cittadinanze;
    this.liste.statusExtraUe = statusExtraUe;
    this.liste.motiviRilascio = motiviRilascio;
    this.liste.tipiResponsabilita = tipiResponsabilita;
    this.sap = sap;
    this.helpMessage = helpMessage;
    this.messaggioErroreDati = messaggioErroreDati;

    this.flagCittadinanzaUE = this.isCittadinanzaUE();
    this.liste.sessi = Sesso.get();
    this.utilitiesService.hideSpinner();
    this.loaded$.next(true);
    this.setCopiaDa();

    if (this.isRdcEnabled) {
      const [ domandaRDC] = await Promise.all([
      this.businessService.getDomandaRDC(this.commonPslpService.tutore.id_utente).pipe(
        catchError(err => {
          this.logService.log(err);
          return of(null);
        })
            ).toPromise()
          ]);
          this.domandaRDC = domandaRDC;
          this.mayUpdateResidenza = (!domandaRDC || (domandaRDC.stato_politica_rc1 && domandaRDC.stato_politica_rc1 !== '01'));
    } else {
        this.mayUpdateResidenza = true;
    }
  }
  /**
   * after view init
   */
  ngAfterViewInit(): void {
    this.subscriptions.push(this.loaded$.pipe(
      delay(0)
    ).subscribe((isLoaded) => {
      if (!isLoaded) {
        return;
      }
      this.subscriptions.push(this.anagraficaForm.statusChanges
        .pipe(
          startWith(false)
        )
        .subscribe(() => {
          this.flagValidAnagraphicsForm = this.anagraficaForm.valid;
          this.changed = this.changed || this.anagraficaForm.dirty;
          this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : SALVA_PROSEGUI;
        }));
    }));
  }
  /**
   * on destroy
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  /**
   * Sets copia da
   */
  private setCopiaDa() {
    if (!this.commonPslpService.tutore.id_sil_lav_anagrafica) {
      this.copiaDa = this.sap.residenza;
    }
  }
  /**
   * Residenzas edit state
   * @param stato boolean
   */
  residenzaEditState(stato: boolean) {
    this.flagResidenzaChanging = stato;
  }
  /**
   * Residenzas changed
   * @param indirizzo Indirizzo
   */
  residenzaChanged(indirizzo: Indirizzo) {
    this.changed = true;
    this.sap.residenza = indirizzo;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : SALVA_PROSEGUI;
    this.setCopiaDa();
  }
  /**
   * Domicilios edit state
   * @param stato boolean
   */
  domicilioEditState(stato: boolean) {
    this.flagDomicilioChanging = stato;
  }
  /**
   * Domicilios changed
   * @param indirizzo Indirizzo
   */
  domicilioChanged(indirizzo: Indirizzo) {
    this.changed = true;
    this.sap.domicilio = indirizzo;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : SALVA_PROSEGUI;
  }
  /**
   * Recapitis edit state
   * @param stato boolean
   */
  recapitiEditState(stato: boolean) {
    this.flagRecapitiChanging = stato;
  }
  /**
   * Recapitis changed
   * @param recapito Recapito
   */
  recapitiChanged(recapito: Recapito) {
    this.changed = true;
    this.sap.recapito = recapito;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : SALVA_PROSEGUI;
  }

  /**
   * Format matches of dati anagrafici tutore component
   */
  formatMatches = (item: Comune) => item ? item.descrizione : '';
  /**
   * Search comune of dati anagrafici tutore component
   */
  searchComune = (text$: Observable<string>): Observable<Comune[]> =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap(term => {
        let listaComuni = [] as Comune[];
        if (term && term.length >= 2 ) {
          const termUpper = term.toLocaleUpperCase();
          listaComuni = this.comuni.filter(
            comune => comune.descrizione.toLocaleUpperCase().includes(termUpper)
          );
        }
        return of (listaComuni);
      }),
      tap(() => this.searching = false)
    )

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  async onExitPage(nav: NavigationEmitter) {
    const oldTipoResponsabilita = this.utenteACarico.tipo_responsabilita.codice;
    try {
      if (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) {
        // save utenteACarico
        // save tutore
        // valutare come recuperare il changed. Verificare una diff rispetto all'originale
        if (this.changed || !this.anagraficaForm.pristine) {
          this.utilitiesService.showSpinner();
          this.patchSap();
          this.commonPslpService.utenteACarico.tipo_responsabilita.codice = this.tipoResponsabilita;
          const esitoSaveUtenteACarico = await this.businessService.saveUtenteACarico(
              this.commonPslpService.tutore.id_utente,
              this.commonPslpService.utenteACarico)
          .pipe(
            catchError(err => this.handleServiceError(err, 'saveUtenteACarico'))
          ).toPromise();
          this.handleEsito(esitoSaveUtenteACarico);
          const esitoSaveResponsabile = await this.businessService.saveResponsabile(this.commonPslpService.tutore.id_utente, this.sap)
          .pipe(
            catchError(err => this.handleServiceError(err, 'saveResponsabile'))
          ).toPromise();
          this.handleEsito(esitoSaveResponsabile);
          this.utilitiesService.hideSpinner();
        }
      }
      this.router.navigateByUrl(nav.url);
    } catch (e) {
      this.commonPslpService.utenteACarico.tipo_responsabilita.codice = oldTipoResponsabilita;
      this.utilitiesService.hideSpinner();
      this.utilitiesService.showToastrErrorMessage(e.message, 'Anagrafica');
    }
  }

  /**
   * Handles service error
   *
   */
  private handleServiceError(err, method) {
    this.logService.error(`[DatiAnagraficiTutore::${method}]`, JSON.stringify(err));
    const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
    const esito: Esito = {
      code: errore.code,
      messaggioCittadino: errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage
    };
    return of(esito);
  }
  private handleEsito(esito: Esito) {
    if (!esito.code) {
      // Something strange happened!
      return;
    }
    if (esito.code !== 'OK' && esito.code !== '200') {
      throw new Error(esito.messaggioCittadino);
    }
  }

  /**
   * Patchs sap
   */
  private patchSap() {
    // Eventuali patch della SAP. Da togliere quando sara' tutto coerente!!
    if (this.sap.luogoDiNascita && !this.sap.luogoDiNascita.comune) {
      this.sap.luogoDiNascita.comune = {};
    }
    if (this.sap.residenza && !this.sap.residenza.comune) {
      this.sap.residenza.comune = {};
    }
    if (this.sap.domicilio && !this.sap.domicilio.comune) {
      this.sap.domicilio.comune = {};
    }
  }

  /**
   * Parses date scadenza
   * @param e string
   *
   */
  parseDateScadenza(e: string) {
    if (!e) {
      this.sap.permessoDiSoggiorno.data_scadenza = null;
      return;
    }
    if (e.length < 10) {
      return;
    }
    const m = moment(e, 'DD/MM/YYYY', true);
    if (!m.isValid()) {
      return;
    }
    this.sap.permessoDiSoggiorno.data_scadenza = m.toDate();
  }

  /**
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {
    const flagChange = !this.flagResidenzaChanging
      && !this.flagDomicilioChanging
      && !this.flagRecapitiChanging
      && (this.commonPslpService.wizard || this.changed);

    const flagControlli1 = !!this.sap && (!!this.sap.recapito && !!this.sap.recapito.email);
    const flagControlli2 = this.flagValidAnagraphicsForm;
    const flagControlli3 = this.validNazioneAndComuneNascita();
    const flagControlli = flagControlli1 && flagControlli2 && flagControlli3;
    return flagChange && flagControlli;
  }

  /**
   * Determines whether change cittadinanza on
   */
  onChangeCittadinanza(): void {
    this.flagCittadinanzaUE = this.isCittadinanzaUE();
    if (this.flagCittadinanzaUE) {
      // Italia
      this.sap.permessoDiSoggiorno = {};
    }
  }

  /**
   * Determines whether cittadinanza ue is
   * @returns true if cittadinanza ue
   */
  private isCittadinanzaUE(): boolean {
    if (!this.sap.codice_ministeriale_cittadinanza) {
      return true;
    }
    const currentCittadinanza: Cittadinanza = this.liste.cittadinanze.find(
      el => el.codice_ministeriale === this.sap.codice_ministeriale_cittadinanza);
      this.logService.log(currentCittadinanza);
    if (!currentCittadinanza) {
      return false;
    }
    const nazione: Nazione = this.liste.nazioni.find(
      (el: Nazione) => el.codice_ministeriale === currentCittadinanza.codice_ministeriale_nazione
    );
    return nazione && nazione.flag_ue;
  }

  /**
   * nazione and comune nascita
   * @param e ElementRef
   * @param control AbstractControl
   * @returns nazione and comune nascita
   */
  private _noNazioneAndComuneNascita(e: ElementRef, control: AbstractControl): ValidationErrors | null {
    let err: ValidationErrors = null;
    const value = control.value;
    let check = '';
    switch (e.nativeElement.id) {
      case 'nazione':
        check = this.sap.luogoDiNascita.comune && this.sap.luogoDiNascita.comune.codice_ministeriale;
        break;
      case 'comuneNascita':
        check = this.sap.luogoDiNascita.stato && this.sap.luogoDiNascita.stato.codice_ministeriale;
        break;
      default:
        break;
    }
    if (value && check) {
      err = {'cojoin': 'Nazione e comune di nascita non possono essere specificati contemporaneamente'};
    }
    control.setErrors(null, {emitEvent: true});
    this.nazioneComuneError = err ? err.cojoin : undefined;
    // non funziona correttamente se ritorna err!!
    // return err;
    return null;
  }

  /**
   * Valids nazione and comune nascita
   * @returns true if nazione and comune nascita
   */
  private validNazioneAndComuneNascita(): boolean {
    if (!this.sap || !this.sap.luogoDiNascita) {
      return false;
    }
    const flagStato = this.sap.luogoDiNascita.stato && this.sap.luogoDiNascita.stato.codice_ministeriale;
    const flagComune = this.sap.luogoDiNascita.comune && this.sap.luogoDiNascita.comune.codice_ministeriale;
    return !flagStato !== !flagComune;
  }
}
