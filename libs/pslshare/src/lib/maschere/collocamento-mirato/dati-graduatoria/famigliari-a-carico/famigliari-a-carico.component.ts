import { AfterContentChecked, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, NgForm, ValidationErrors } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { BusinessService, Comune, ConfigurazioneFamiliariACarico, Decodifica, DettaglioCompletoDichiarazioneFamiliariACarico, DettaglioDichiarazioneFamiliariACarico, EsitoRiepilogoCollocamentoMirato, Nazione, TipoContratto } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, Sesso, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '../../../../pslshare.service';
import * as moment from 'moment';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

type WindowState = 'I' | 'U' | 'V';

const TITOLO_FINESTRA = 'Dichiarazione Familiari a Carico';
const TITOLO_PAGINA = 'FAMILIARI A CARICO';

const KO_PSLWEB_SERVER = "KO-saveFamiliariACarico";
@Component({
  selector: 'pslshare-famigliari-a-carico',
  templateUrl: './famigliari-a-carico.component.html',
  styleUrls: ['./famigliari-a-carico.component.css']
})
export class FamigliariACaricoComponent implements OnInit, AfterContentChecked {
  static readonly SCROLL_TARGET = 'em[data-scroll-marker="dichiarazioneFamiliari"]';

  @ViewChild('familiariACaricoForm', { static: false }) familiariACaricoForm: NgForm;

  @Input() riepilogo: EsitoRiepilogoCollocamentoMirato;
  @Input() dichiarazioneFamiliariCOMI: DettaglioCompletoDichiarazioneFamiliariACarico;
  @Input() erroreDettaglioFamiliari: string;
  @Input() readOnly: boolean;
  @Input() statoMaschera: WindowState;
  @Input() indiceSelezionato: number;
  @Input() isDuplicazione: boolean;


  // serve per capire se è richiamato in richiesta iscrizione
  @Input() isRichiestaIscrizione: boolean;

  @Output() annullaDettaglio: EventEmitter<void> = new EventEmitter();
  @Output() flagChanging: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() formChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() formNuovo: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() formValid: EventEmitter<boolean> = new EventEmitter<boolean>();

  liste = {
    sessi: [],
    nazioni: []
  };
  searchFailed = false;
  searching = false;
  private comuni: Comune[];

  private msgConfermaElimina: string;
  private msgDichiarazioneInsOk: string;
  private msgNazioneComuneNoContemporaneamente: string;
  private msgCFDelDichiarante: string;
  private msgErroreGenerico: string;

  listaTipologieFamiliariDescCompleta: Array<Decodifica>;
  listaTipologieFamiliariDescBreve: Array<Decodifica>;
  laDescrizioneLunga: string;
  noNazioneAndComuneNascita: () => any;
  ilFamiliareSelezionato: DettaglioDichiarazioneFamiliariACarico;
  updateIndex: number;

  statoDeiFamiliari: WindowState;

  dataChanged = false; // per il salvataggio
  changed = false;    // flag da restituire per iscrizione se il fomr è stato modificato
  valid = false;      // flag da restituire per iscrizione con stato valido del form
  private msgInserimentoDichiarazioneSenzaFamiliari: string;

  nazioneComuneError: string;

  private readonly now: moment.Moment;
  dettaglioChanging: boolean;
  annoInCorso: number;
  annoPrecedente: string;
  dataOdierna: Date;
  listaTipoContrattoValidiADataInizioRapporto: TipoContratto[] = [];
  intermediata: string;
  valoreEconomico: string;
  valoreEconomicoStr: string;
  cpi: string;
  laConfig: ConfigurazioneFamiliariACarico;
  testoHelp: string;
  element: string;
  provinciaDaRecuperare: Decodifica;
  isOperatore = false;
  idUtente: number;

  get isVisualizationState(): boolean { return this.statoMaschera === 'V'; }
  get isModifyState(): boolean { return this.statoMaschera === 'U'; }
  get isInsertState(): boolean { return this.statoMaschera === 'I'; }
  get isEditingState(): boolean { return this.isInsertState || this.isModifyState; }
  get isVisualizationStateFamiliare(): boolean { return this.statoDeiFamiliari === 'V'; }
  get isModifyStateFamiliare(): boolean { return this.statoDeiFamiliari === 'U'; }
  get isInsertStateFamiliare(): boolean { return this.statoDeiFamiliari === 'I'; }
  get isEditingStateFamiliare(): boolean { return this.isInsertStateFamiliare || this.isModifyStateFamiliare; }
  get isPresenteStatoOrComune(): boolean { return this.validNazioneAndComuneNascita(); }

  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly storageService: SessionStorageService,
    private readonly businessService: BusinessService,
    private readonly appUserService: AppUserService,
    private readonly pslshareService: PslshareService,
    private readonly sanitizer: DomSanitizer
  ) { }

  ngAfterContentChecked(): void {

    if (this.familiariACaricoForm) {
       if (this.familiariACaricoForm.dirty && !this.changed) {
          this.changed = true;
          this.formChangedEmit();
       }
       if (isNullOrUndefined(this.valid)
           || (this.familiariACaricoForm.valid && !this.valid)
           || (this.familiariACaricoForm.invalid && this.valid)) {
            this.valid = this.familiariACaricoForm.valid;
            this.formValidEmit(this.valid);
       }
    }
  }

  async ngOnInit() {
    this.utilitiesService.showSpinner();

    const operatore = this.appUserService.getOperatore();
    if (!isNullOrUndefined(operatore)) {
      this.isOperatore = true;
    }
    this.idUtente = this.appUserService.getIdUtente();



    this.statoDeiFamiliari = "V";
    this.annoInCorso = new Date().getFullYear();
    this.noNazioneAndComuneNascita = this._noNazioneAndComuneNascita.bind(this);
    if (!this.isRichiestaIscrizione) {
      if (!isNullOrUndefined(this.riepilogo.iscrizioneDisabili)) {
        if (!this.riepilogo.iscrizioneDisabili.statoFinale) {
          this.provinciaDaRecuperare = this.riepilogo.iscrizioneDisabili.provincia;
        }
      }
      if (!isNullOrUndefined(this.riepilogo.iscrizioneAltreCategorie)) {
        if (this.riepilogo.iscrizioneAltreCategorie.statoFinale) {
          this.provinciaDaRecuperare = this.riepilogo.iscrizioneAltreCategorie.provincia;
        }
      }
    }
    const [comuni,
      nazioni,
      configurazioneFamiliari,
      msgInserimentoDichiarazioneSenzaFamiliari,
      msgConfermaElimina,
      msgDichiarazioneInsOk,
      msgNazioneComuneNoContemporaneamente,
      msgCFDelDichiarante,
      msgErroreGenerico
    ] = await Promise.all([
      this.storageService.getCachedValue('COMUNI', () => this.utilitiesService.getAllComuni()),
      this.storageService.getCachedValue(
        'NAZIONI', () =>
        this.businessService.getNazioni().pipe(map((values: Nazione[]) => {
          values.sort(this.sortDescrizione);
          return values;
        })).toPromise()),
      this.storageService.getCachedValue('CONFIGURAZIONE FAMILIARI', () =>
        this.commonFCService.getConfigurazioneFamiliariAcarico()),
      this.utilitiesService.getMessage('ME122'),
      this.utilitiesService.getMessage('ME087'),
      this.utilitiesService.getMessage('ME123'),
      this.utilitiesService.getMessage('ME126'),
      this.utilitiesService.getMessage('ME129'),
      this.utilitiesService.getMessage('ME006')
    ]);
    this.msgInserimentoDichiarazioneSenzaFamiliari = msgInserimentoDichiarazioneSenzaFamiliari;
    this.msgDichiarazioneInsOk = msgDichiarazioneInsOk;
    this.msgNazioneComuneNoContemporaneamente = msgNazioneComuneNoContemporaneamente;
    this.msgCFDelDichiarante = msgCFDelDichiarante;
    this.msgErroreGenerico = msgErroreGenerico;
    this.msgConfermaElimina = msgConfermaElimina;
    this.laConfig = configurazioneFamiliari;
    this.listaTipologieFamiliariDescCompleta = (this.laConfig).elencoMotivoCaricoDescrizioneLunga;
    this.listaTipologieFamiliariDescBreve = (this.laConfig).elencoDecodeMotivoCarico;
    this.comuni = comuni;
    this.liste.nazioni = nazioni;

    if (this.statoMaschera === 'U' || this.statoMaschera === 'I') {
      this.dettaglioChanging = true;
      this.flagChangingEmit();
    }
    if (!isNullOrUndefined(this.dichiarazioneFamiliariCOMI) && this.dichiarazioneFamiliariCOMI.fonte === 'SILP') {
      this.cpi = this.dichiarazioneFamiliariCOMI.cpi.descrizione;
    }
    this.liste.sessi = Sesso.get();
    this.element = "";
    for (let index = 0; index < this.listaTipologieFamiliariDescCompleta.length; index++) {
      this.element += "<br>" + this.listaTipologieFamiliariDescCompleta[index].descrizione;
    }
    this.utilitiesService.hideSpinner();
  }

  /**
   * Sort descrizione of familiari acarico component
   */
  private readonly sortDescrizione = function (a: any, b: any) { return a.descrizione.localeCompare(b.descrizione); };

  /**
   * Determines whether annulla on
   *
   */
  async onAnnulla() {
    if (this.dataChanged || this.isDuplicazione) {
      const data: DialogModaleMessage = {
        titolo: TITOLO_FINESTRA,
        tipo: TypeDialogMessage.YesOrNo,
      };
      const res = await this.pslshareService.richiestaFinestraModale(data);
      if (res === 'NO') {
        return;
      }
    }
    this.statoMaschera = 'V';
    this.dichiarazioneFamiliariCOMI = null;
    this.dettaglioChanging = false;
    this.flagChangingEmit();
    this.annullaDettaglio.emit();
    this.ilFamiliareSelezionato = null;
    this.dataChanged = false;
    this.isDuplicazione = false;
  }

  /**
   * Determines whether salva dichiarazione on
   *
   */
  async onSalvaDichiarazione() {
    this.dataChanged = false;
    this.isDuplicazione = false;
    if (this.isInsertState) {
      if (isNullOrUndefined(this.dichiarazioneFamiliariCOMI.numero_familiari) || (this.dichiarazioneFamiliariCOMI.numero_familiari === 0)) {
        const data: DialogModaleMessage = {
          titolo: TITOLO_FINESTRA,
          tipo: TypeDialogMessage.CancelOrConfirm,
          messaggio: this.msgInserimentoDichiarazioneSenzaFamiliari,
          messaggioAggiuntivo: ""
        };
        const res = await this.pslshareService.richiestaFinestraModale(data);
        if (res === 'NO') {
          return;
        }
        this.dichiarazioneFamiliariCOMI.numero_familiari = 0;
      }
      this.upperCaseNote();
      this.utilitiesService.showSpinner();

      const esito = await this.commonFCService.saveDichiarazione(this.appUserService.getIdUtente(), this.dichiarazioneFamiliariCOMI);
      if (!isNullOrUndefined(esito) && !isNullOrUndefined(esito.messaggio_errore)) {
        if (esito.messaggio_errore === KO_PSLWEB_SERVER) {
          this.utilitiesService.showToastrErrorMessage(this.msgErroreGenerico, TITOLO_FINESTRA);
        } else {
          const ilMessaggio = esito.messaggio_errore.replace(/ERRORE/g, "<br> ERRORE");
          this.sanitizer.bypassSecurityTrustHtml(ilMessaggio);
          this.utilitiesService.showToastrErrorMessageEnableHtml(ilMessaggio.substring(5), TITOLO_FINESTRA);
        }
      } else {
        const riepilogo = await this.commonFCService.getCollocamentoMirato(this.appUserService.getIdUtente());
        this.riepilogo.dettaglioCompletoDichiarazioneFamiliariACarico = riepilogo.dettaglioCompletoDichiarazioneFamiliariACarico;
        this.utilitiesService.showToastrInfoMessage(this.msgDichiarazioneInsOk, TITOLO_FINESTRA);
        this.onAnnulla();
      }
    }
    this.utilitiesService.hideSpinner();
  }

  /**
   * Uppers case note
   */
  private upperCaseNote() {
    if (!isNullOrUndefined(this.dichiarazioneFamiliariCOMI.note)) {
      this.dichiarazioneFamiliariCOMI.note = this.dichiarazioneFamiliariCOMI.note.toUpperCase();
    }
  }

  /**
   * Determines whether salva familiare on
   *
   */
  async onSalvaFamiliare() {
    const erroriBloccanti = this.getElencoErroriBloccantiPerSalvataggio();
    if (erroriBloccanti.length > 0) {
      const data: DialogModaleMessage = {
        titolo: TITOLO_FINESTRA,
        tipo: TypeDialogMessage.Confirm,
        messaggio: erroriBloccanti,
        messaggioAggiuntivo: ""
      };
      return this.pslshareService.richiestaFinestraModale(data);
    }
    this.ilFamiliareSelezionato.codice_fiscale_familiare = this.ilFamiliareSelezionato.codice_fiscale_familiare.toUpperCase();
    this.ilFamiliareSelezionato.nome_familiare = this.ilFamiliareSelezionato.nome_familiare.toUpperCase();
    this.ilFamiliareSelezionato.cognome_familiare = this.ilFamiliareSelezionato.cognome_familiare.toUpperCase();

    this.ilFamiliareSelezionato.motivo_carico.descrizione = this.listaTipologieFamiliariDescBreve.find(
      el => el.codice_silp === this.ilFamiliareSelezionato.motivo_carico.codice_silp
    ).descrizione;

    if (this.isModifyStateFamiliare) {
      if (!isNullOrUndefined(this.ilFamiliareSelezionato.luogo_di_nascita.comune) && this.ilFamiliareSelezionato.luogo_di_nascita.comune === "") {
        this.ilFamiliareSelezionato.luogo_di_nascita.comune = null;
      }
      this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico = Object.assign(
        [], this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico, {
          [this.updateIndex]: this.ilFamiliareSelezionato
        }
      );
    } else if (this.isInsertStateFamiliare) {
      if (isNullOrUndefined(this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico)) {
        this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico = [];
      }
      this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico = [
        ...this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico,
        this.ilFamiliareSelezionato
      ];
      if (isNullOrUndefined(this.dichiarazioneFamiliariCOMI.numero_familiari)) {
        this.dichiarazioneFamiliariCOMI.numero_familiari = 0;
      }
      this.dichiarazioneFamiliariCOMI.numero_familiari++;
    }
    this.dataChanged = true;
    this.formChangedEmit(); // all'aggiunta di un familiare segnalo al padre che il form è cambiato

    this.onAnnullaDettaglioFamiliare();
  }

  /**
   * Gets elenco errori bloccanti per salvataggio
   * @returns elenco errori bloccanti per salvataggio
   */
  getElencoErroriBloccantiPerSalvataggio(): string {
    let stringaErrori = "";
    let utente = this.appUserService.getUtente();
    if (this.isOperatore) {
      utente = this.appUserService.getUtenteSimulato();
    }
    if (this.ilFamiliareSelezionato.codice_fiscale_familiare.toUpperCase() === utente.codice_fiscale.toUpperCase()) {
      stringaErrori = this.msgCFDelDichiarante;
    }
    return stringaErrori;
  }

  /**
   * Flags changing emit
   */
  private flagChangingEmit() {
    if (this.statoMaschera === 'U' || this.statoMaschera === 'I') {
      this.dettaglioChanging = true;
    }
    this.flagChanging.emit(this.dettaglioChanging);
  }

  /**
   * Determines whether visualizza on
   * @param ilFamiliare DettaglioDichiarazioneFamiliariACarico
   */
  onVisualizza(ilFamiliare: DettaglioDichiarazioneFamiliariACarico) {
    this.ilFamiliareSelezionato = UtilitiesService.clone(ilFamiliare);
    this.ilFamiliareSelezionato.motivo_carico = ilFamiliare.motivo_carico;
    if (isNullOrUndefined(this.ilFamiliareSelezionato.luogo_di_nascita)) {
      this.ilFamiliareSelezionato.luogo_di_nascita = {
        comune: {
          provincia: {}
        },
        stato: {
          codice_ministeriale: null
        }
      };
    } else if (isNullOrUndefined(this.ilFamiliareSelezionato.luogo_di_nascita.stato)) {
      this.ilFamiliareSelezionato.luogo_di_nascita.stato = {
        codice_ministeriale: null
      };
    }
    this.laDescrizioneLunga = this.listaTipologieFamiliariDescCompleta.find(
      el => el.codice_silp === this.ilFamiliareSelezionato.motivo_carico.codice_silp
    ).descrizione;
    this.updateIndex = this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico.findIndex(
      el => el.codice_fiscale_familiare === ilFamiliare.codice_fiscale_familiare
    );
    this.statoMaschera = 'V';
    this.statoDeiFamiliari = 'V';
    this.dataChanged = false;
    this.isDuplicazione = false;
  }

  /**
   * Format matches of familiari acarico component
   */
  formatMatches = (item: Comune) => item ? item.descrizione : '';
  /**
   * Search comune of familiari acarico component
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
   * Determines whether elimina on
   * @param ilFamiliare DettaglioDichiarazioneFamiliariACarico
   *
   */
  async onElimina(ilFamiliare: DettaglioDichiarazioneFamiliariACarico) {
    const data: DialogModaleMessage = {
      titolo: TITOLO_PAGINA,
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: this.msgConfermaElimina,
      messaggioAggiuntivo: ""
    };
    const res = await this.pslshareService.richiestaFinestraModale(data);
    if (res === 'NO') {
      return;
    }
    this.updateIndex = this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico.findIndex(
      el => el.codice_fiscale_familiare === ilFamiliare.codice_fiscale_familiare
    );
    this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico = this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico.filter(
      (el, idx) => idx !== this.updateIndex
    );
    this.ilFamiliareSelezionato = null;
    this.dichiarazioneFamiliariCOMI.numero_familiari--;
    this.formChangedEmit(); // all'aggiunta di un familiare segnalo al padre che il form è cambiato
  }

  /**
   * Determines whether modifica on
   * @param ilFamiliare DettaglioDichiarazioneFamiliariACarico
   */
  onModifica(ilFamiliare: DettaglioDichiarazioneFamiliariACarico) {
    this.statoDeiFamiliari = 'U';
    this.ilFamiliareSelezionato = UtilitiesService.clone(ilFamiliare);
    if (!isNullOrUndefined(this.ilFamiliareSelezionato.luogo_di_nascita)) {
      if (isNullOrUndefined(this.ilFamiliareSelezionato.luogo_di_nascita.comune)) {
        this.ilFamiliareSelezionato.luogo_di_nascita.comune = {};
      }
      if (isNullOrUndefined(this.ilFamiliareSelezionato.luogo_di_nascita.stato)) {
        this.ilFamiliareSelezionato.luogo_di_nascita.stato = { codice_ministeriale: null };
      }

    }
    this.ilFamiliareSelezionato.motivo_carico = ilFamiliare.motivo_carico;
    this.updateIndex = this.dichiarazioneFamiliariCOMI.dettaglio_dichiarazione_familiari_a_carico.findIndex(
      el => el.codice_fiscale_familiare === ilFamiliare.codice_fiscale_familiare
    );
    this.laDescrizioneLunga = this.listaTipologieFamiliariDescCompleta.find(
      el => el.codice_silp === this.ilFamiliareSelezionato.motivo_carico.codice_silp
    ).descrizione;
    this.formNuovoEmit(true); // all'aggiunta di un familiare segnalo al padre che il form è operativo
    this.utilitiesService.scrollTo(FamigliariACaricoComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {
    const valido = !this.flagChanging
      && (this.commonFCService.wizard || this.dataChanged);
    return valido;
  }

  /**
   * annulla il familiare selezionato
   */
  onAnnullaDettaglioFamiliare() {
    this.statoDeiFamiliari = 'V';
    this.ilFamiliareSelezionato = null;
    this.formNuovoEmit(false); // alla chiusura della finestra di un familiare segnalo al padre che il form non è più operativo
    this.formChangedEmit(); // all'aggiunta di un familiare segnalo al padre che il form è cambiato
  }

  /**
   * aggiunge un  nuovo familiare
   */
  onNuovoFamiliare() {
    this.statoMaschera = 'I';
    this.statoDeiFamiliari = 'I';
    this.ilFamiliareSelezionato = {
      luogo_di_nascita: { comune: {}, stato: {} },
      motivo_carico: {}
    };
    this.updateIndex = -1;
    this.laDescrizioneLunga = "";
    this.dataChanged = true;
    this.formNuovoEmit(true); // all'aggiunta di un familiare segnalo al padre che il form è operativo


    this.utilitiesService.scrollTo(FamigliariACaricoComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether change cambia messaggio on
   */
  onChangeCambiaMessaggio() {
    this.laDescrizioneLunga = this.listaTipologieFamiliariDescCompleta.find(el => el.codice_silp === this.ilFamiliareSelezionato.motivo_carico.codice_silp).descrizione;
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
        check = this.ilFamiliareSelezionato.luogo_di_nascita.comune && this.ilFamiliareSelezionato.luogo_di_nascita.comune.codice_ministeriale;
        break;
      case 'comuneNascita':
        check = this.ilFamiliareSelezionato.luogo_di_nascita.stato && this.ilFamiliareSelezionato.luogo_di_nascita.stato.codice_ministeriale;
        break;
      default:
        break;
    }
    if (value && check) {
      err = { 'cojoin': this.msgNazioneComuneNoContemporaneamente };
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
    if (!this.ilFamiliareSelezionato || !this.ilFamiliareSelezionato.luogo_di_nascita) {
      return false;
    }
    const flagStato = this.ilFamiliareSelezionato.luogo_di_nascita.stato && this.ilFamiliareSelezionato.luogo_di_nascita.stato.codice_ministeriale;
    const flagComune = this.ilFamiliareSelezionato.luogo_di_nascita.comune && this.ilFamiliareSelezionato.luogo_di_nascita.comune.codice_ministeriale;
    return !flagStato !== !flagComune;
  }

  /**
    * Form changed emit - informa il componente padre che i dati sono cambiati
    */
  private formChangedEmit() {
    this.formChanged.emit(true);
  }

  /**
    * Form changed emit - informa il componente padre che i dati sono cambiati
    */
   private formNuovoEmit(flg: boolean) {
    this.formNuovo.emit(flg);
  }

  /**
   * Form valid emit - informa il componente padre se il form è validato o meno
   */
  private formValidEmit(flg: boolean) {
    this.formValid.emit(flg);
  }

  getDescMotivo(cod_ministeriale: string): string {
    return this.utilitiesService.getDescrizioneMotivoACarico(cod_ministeriale, this.laConfig);
  }


}
