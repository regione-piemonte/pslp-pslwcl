import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, NgForm, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BusinessService,
  Cittadinanza, Comune,
  DomandaRDC, Esito, Indirizzo,
  Nazione, Recapito, SchedaAnagraficoProfessionale
} from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, NavigationEmitter, Sesso, EsitoSaveErrato, SezioniSAP, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, ParametriSistemaService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { BehaviorSubject, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, delay, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { GestioneMinorePrivacyComponent } from '../../privacy/riepilogo-privacy/gestione-minore-privacy/gestione-minore-privacy.component';

const SALVA_PROSEGUI = 'SALVA & PROSEGUI';
@Component({
  selector: 'pslfcwcl-dati-anagrafici-fascicolo-nuova-sap',
  templateUrl: './dati-anagrafici-nuova-sap.component.html'
})
export class DatiAnagraficiNuovaSapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('anagraficaForm', { static: false }) anagraficaForm: NgForm;

  isRdcEnabled: Promise<boolean>;
  private loaded$: Subject<boolean> = new BehaviorSubject(false);
  sap: SchedaAnagraficoProfessionale;
  copiaDa: Indirizzo = null;

  liste = {
    sessi: [],
    nazioni: [],
    cittadinanze: [],
    statusExtraUe: [],
    motiviRilascio: [],
  };

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

  domandaRDC: DomandaRDC;
  noNazioneAndComuneNascita: () => any;
  nazioneComuneError: string;
  messaggioErroreDati: string;
  private messaggioErroreProvincia: string;
  private changed = false;
  private readonly subscriptions: Subscription[] = [];
  private comuni: Comune[];
  mayUpdateResidenza: boolean;
  urlUscita: string;
  titoloPagina = 'Dati Anagrafici';
  sezioni: string[];
  provinciaDomicilioOriginal: string;
  isMinorenne: string = null;

  constructor(
    private readonly router: Router,
    private readonly commonFCService: CommonPslpService,
    private readonly businessService: BusinessService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly storageService: SessionStorageService,
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.isRdcEnabled = this.parametriSistemaService.isRdcEnabled;
    this.nextButtonName = this.commonFCService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = this.commonFCService.wizard === false ? 'INDIETRO' : 'ANNULLA';
    this.noNazioneAndComuneNascita = this._noNazioneAndComuneNascita.bind(this);
    this.popdown = true;

    const utente = this.commonFCService.getUtenteStorage();
    const idUtente = utente.id_utente;

    this.readOnly = this.commonFCService.readOnly;
    const [comuni, nazioni, cittadinanze, statusExtraUe, motiviRilascio,
      sap,
      helpMessage, messaggioErroreProvincia, messaggioErroreDati] = await Promise.all([
        this.utilitiesService.getAllComuni(),
        this.businessService.getNazioni().toPromise(),
        this.businessService.getCittadinanze().toPromise(),
        this.businessService.findElencoStatusExtraUE().toPromise(),
        this.businessService.findMotiviRilascioPermessoDiSoggiorno().toPromise(),

        this.businessService.getSAPVuota(idUtente).pipe(
          catchError(err => of(this.commonFCService.inizializzaSAP(utente)))
        ).toPromise(),
        this.utilitiesService.getMessage('HC004'),
        this.utilitiesService.getMessage('ME039'),
        this.utilitiesService.getMessage('ME091')
      ]);
    this.comuni = comuni;
    this.liste.nazioni = nazioni;
    this.liste.cittadinanze = cittadinanze;
    this.liste.statusExtraUe = statusExtraUe;
    this.liste.motiviRilascio = motiviRilascio;

    this.sap = sap;
    this.helpMessage = helpMessage;
    this.messaggioErroreProvincia = messaggioErroreProvincia;
    this.messaggioErroreDati = messaggioErroreDati;

    this.flagCittadinanzaUE = this.isCittadinanzaUE();
    this.liste.sessi = Sesso.get();
    this.utilitiesService.hideSpinner();
    this.loaded$.next(true);
    this.setCopiaDa();
    this.mayUpdateResidenza = true;

    if (this.sap && this.sap.codice_fiscale && !this.sap.dataDiNascita) {
      const gestioneDateNascitaMinore: { [key: string]: Date } = this.storageService.getItem(GestioneMinorePrivacyComponent.DATA_NASCITA_SESSION_PLACEHOLDER, true);
      const dataNascita = gestioneDateNascitaMinore ? gestioneDateNascitaMinore[this.sap.codice_fiscale] : null;
      this.sap.dataDiNascita = dataNascita;
    }

    if (isNullOrUndefined(this.commonFCService.getTipoResponsabilita())) {
      this.isMinorenne = null;
    } else {
      this.isMinorenne = 'true';
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
          this.nextButtonName = this.commonFCService.wizard === false ? 'SALVA' : SALVA_PROSEGUI;
        }));
    }));
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  private setCopiaDa() {
    if (!this.commonFCService.tutore || !this.commonFCService.tutore.id_sil_lav_anagrafica) {
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
    this.nextButtonName = this.commonFCService.wizard === false ? 'SALVA' : SALVA_PROSEGUI;
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
   *
   */
  domicilioChanged(indirizzo: Indirizzo) {
    this.changed = true;
    this.sap.domicilio = indirizzo;
    if (this.commonFCService.erroreObbligoPiemonte(this.sap.domicilio)) {
      return this.utilitiesService.showToastrErrorMessage(this.messaggioErroreProvincia, this.titoloPagina);
    }
    if (this.commonFCService.obbligoDomicilioPiemontePerModifica() && isNullOrUndefined(this.provinciaDomicilioOriginal)) {
      this.provinciaDomicilioOriginal = this.sap.domicilio.comune.provincia.descrizione ? this.sap.domicilio.comune.provincia.descrizione.toUpperCase() : '';
    }

    this.nextButtonName = this.commonFCService.wizard === false ? 'SALVA' : SALVA_PROSEGUI;
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
    this.nextButtonName = this.commonFCService.wizard === false ? 'SALVA' : SALVA_PROSEGUI;
  }

  formatMatches = (item: Comune) => item ? item.descrizione : '';
  /**
   * Search comune of dati anagrafici nuova sap component
   */
  searchComune = (text$: Observable<string>): Observable<Comune[]> =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap(term => {
        let listaComuni = [] as Comune[];
        if (term && term.length >= 2) {
          const termUpper = term.toLocaleUpperCase();
          listaComuni = this.comuni.filter(
            comune => comune.descrizione.toLocaleUpperCase().includes(termUpper)
          );
        }
        return of(listaComuni);
      }),
      tap(() => this.searching = false)
    )

  /**
   * Parses date scadenza
   * @param e string
   *
   */
  parseDateScadenza(e: string) {
    if (!e) {
      this.sap.permessoDiSoggiorno.data_scadenza = null;
    } else if (e.length >= 10) {
      const m = moment(e, 'DD/MM/YYYY', true);
      if (m.isValid()) {
        this.sap.permessoDiSoggiorno.data_scadenza = m.toDate();
      }
    }
  }

  /**
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {

    return this.isFlgChange()
           && this.controlliSap()
           && this.flagValidAnagraphicsForm
           && this.validNazioneAndComuneNascita()
           && this.controlliResidenza()
           && this.controlliDomicilio();
  }

  /**
   * Controllis domicilio
   * @returns boolean
   */
  private controlliDomicilio() {
    let flagControlliDomicilio = false;
    if (!isNullOrUndefined(this.sap)) {
      if (!isNullOrUndefined(this.sap.domicilio) && !isNullOrUndefined(this.sap.domicilio.comune)) {
        if (!isNullOrUndefined(this.sap.domicilio.comune.provincia) && !isNullOrUndefined(this.sap.domicilio.comune.provincia.codice_ministeriale)) {
          flagControlliDomicilio = true;
        } else {
          if (!isNullOrUndefined(this.sap.domicilio.stato) && !isNullOrUndefined(this.sap.domicilio.stato.codice_ministeriale)) {
            flagControlliDomicilio = true;
          }
        }
      }
    }
    return flagControlliDomicilio;
  }


/**
 * Controllis residenza
 * @returns boolean
 */
private controlliResidenza() {
    let flagControlliResidenza = false;
    if (!isNullOrUndefined(this.sap)) {
      if (!isNullOrUndefined(this.sap.residenza) && !isNullOrUndefined(this.sap.residenza.comune)) {
        if (!isNullOrUndefined(this.sap.residenza.comune.provincia) && !isNullOrUndefined(this.sap.residenza.comune.provincia.codice_ministeriale)) {
          flagControlliResidenza = true;
        } else {
          if (!isNullOrUndefined(this.sap.residenza.stato) && !isNullOrUndefined(this.sap.residenza.stato.codice_ministeriale)) {
            flagControlliResidenza = true;
          }
        }
      }
    }
    return flagControlliResidenza;
  }

  /**
   * Determines whether flg change is
   * @returns true if flg change
   */
  isFlgChange(): boolean {
    return !this.flagResidenzaChanging
    && !this.flagDomicilioChanging
    && !this.flagRecapitiChanging
    && (this.commonFCService.wizard || this.changed);
  }

  /**
   * Controllis sap
   * @returns true if sap
   */
  controlliSap(): boolean {
    return !!this.sap &&
    !!this.sap.recapito &&
    !!this.sap.recapito.email;
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
      err = { 'cojoin': 'Nazione e comune di nascita non possono essere specificati contemporaneamente' };
    }
    control.setErrors(null, { emitEvent: true });
    this.nazioneComuneError = err ? err.cojoin : undefined;
    // non funziona correttamente se ritorna err!!
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

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   * @returns va a exit page
   */
  async onExitPage(nav: NavigationEmitter): Promise<boolean | void> {
    try {
      if (this.isIndietroOrUscita(nav)) {
        this.urlUscita = nav.url;
        this.openModal();
      } else {
        if (this.isAvantiOrSalva(nav)) {
            if (this.commonFCService.erroreObbligoPiemonte(this.sap.domicilio)) {
              return this.utilitiesService.showToastrInfoMessage(this.messaggioErroreProvincia, this.titoloPagina);
            }
              this.checkCoerenzaProvincia();
              this.utilitiesService.showSpinner();

              this.sezioni = [SezioniSAP.DATI_ANAGRAFICI];
              this.commonFCService.setSapStorage(this.sap);
              const esito = await this.commonFCService.saveSezioniSap(this.sezioni);
              this.utilitiesService.hideSpinner();

              if (this.esitoErrato(esito)) {
                const esitoErr: EsitoSaveErrato = {
                  esitoErr: esito, urlReturn: '/fascicolo-cittadino/registrazione-dati-anagrafici',
                  nuovaSAP: true
                };
                this.commonFCService.setEsitoSave(esitoErr);
                return this.router.navigateByUrl('/fascicolo-cittadino/esito-errato-new');
              }
              this.commonFCService.setSapAndIdUtenteStorage(null, null);
              const utente = this.commonFCService.getUtenteStorage();
              this.sap = await this.commonFCService.getSap$(utente.id_utente);
              this.resettaSAP(utente.id_utente);
              this.utilitiesService.showToastrInfoMessage('salvataggio effettuato', 'dati anagrafici');

        }
        this.router.navigateByUrl(nav.url);
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, this.titoloPagina);
    }
  }

  /**
   * Resettas sap
   * @param idUtente identificativo utente
   */
  private resettaSAP(idUtente: number) {
    if (isNullOrUndefined(this.sap)) {
      throw new Error('salvataggio non riuscito');
    }
    this.commonFCService.setSapAndIdUtenteStorage(this.sap, idUtente);
    this.commonFCService.azzeraModificheSap();
    this.commonFCService.backupStorageFascicolo();
  }

  /**
   * Determines whether avanti or salva is
   * @param nav NavigationEmitter
   * @returns boolean
   */
  private isAvantiOrSalva(nav: NavigationEmitter) {
    return (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) && this.changed;
  }

  /**
   * Esitos errato
   * @param esito Esito
   * @returns boolean
   */
  private esitoErrato(esito: Esito) {
    return (esito.code !== 'OK' && esito.code !== '200') || !isNullOrUndefined(esito.messaggioInformativo);
  }

  /**
   * Determines whether indietro or uscita is
   * @param nav NavigationEmitter
   * @returns booelan
   */
  private isIndietroOrUscita(nav: NavigationEmitter) {
    return ((nav.exit === TypeExit.Back || nav.exit === TypeExit.Prev)
      && (this.changed))
      || (nav.exit === TypeExit.Wizard && this.changed);
  }

  /**
   * Opens modal
   */
  async openModal() {
    const data: DialogModaleMessage = {
      titolo: 'Uscita ' + this.titoloPagina,
      tipo: TypeDialogMessage.YesOrNo
    };
    const result = await this.pslbasepageService.richiestaFinestraModale(data);
    if (result === 'SI') {
      this.doUscita();
    }
  }

  /**
   * Do uscita
   */
  doUscita() {
    if (this.urlUscita.startsWith('/fascicolo-')) {
      this.commonFCService.restoreStorageFascicolo();
    } else {
      this.commonFCService.azzeraStorageFascicolo();
    }
    this.router.navigateByUrl(this.urlUscita);
  }

  /**
   * Checks coerenza provincia
   */
  private checkCoerenzaProvincia() {
    if (this.commonFCService.obbligoDomicilioPiemontePerModifica()) {
      if (!this.utilitiesService.isProvinciaInPiemonte(this.sap.domicilio)) {
        const provincia = this.sap.domicilio.comune.provincia.descrizione ? this.sap.domicilio.comune.provincia.descrizione.toUpperCase() : '';
        if (this.provinciaDomicilioOriginal !== provincia) {
          this.utilitiesService.showToastrInfoMessage("Essendo stata modificata la provincia del domicilio sarà possibile salvare esclusivamente i dati anagrafici!");
        }
        this.commonFCService.readOnlyDomicilio = true;
      } else {
        this.commonFCService.readOnlyDomicilio = false;
      }
    }
  }

}
