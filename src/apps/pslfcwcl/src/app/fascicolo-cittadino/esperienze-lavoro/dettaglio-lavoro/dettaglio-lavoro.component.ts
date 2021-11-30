import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { BusinessService, Comune, Decodifica, ElenchiDecodifiche, EsperienzaLavoro, Indirizzo, Nazione, SchedaAnagraficoProfessionale, TipoContratto } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, SezioniSAP, TypeDialogMessage } from '@pslwcl/pslmodel';
import { CommonPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

type WindowState = 'I' | 'U' | 'V';

@Component({
  selector: 'pslfcwcl-dettaglio-lavoro',
  templateUrl: './dettaglio-lavoro.component.html',
  styleUrls: ['./dettaglio-lavoro.component.css']
})
export class DettaglioLavoroComponent implements OnInit {
  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="esperienze"]';
  @Input() sap: SchedaAnagraficoProfessionale;
  @Input() esperienzaSelezionata: EsperienzaLavoro;
  @Input() tipoContrattoSelezionato: TipoContratto;
  @Input() readOnly: boolean;
  @Input() statoMaschera: WindowState;
  @Input() elenchiDecodifiche: ElenchiDecodifiche;
  @Input() listaQualifiche: Decodifica[];
  @Input() indiceSelezionato: number;
  @Input() forceReadOnlyResidenza = false;
  @Output() sezioneChange = new EventEmitter<string>();
  @Output() esperienzaChange = new EventEmitter<EsperienzaLavoro>();
  @Output() annullaDettaglio: EventEmitter<void> = new EventEmitter();
  @Output() flagChanging: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() sapChange: EventEmitter<SchedaAnagraficoProfessionale> = new EventEmitter<SchedaAnagraficoProfessionale>();
  @Output() dataChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  listaNazione: Nazione[] = [];
  private listaComune: Comune[] = [];
  nazioneProve: any;

  categoriaIsProtect = false;
  isMsgAvviso = false;
  ilMsgDiAvviso: string;

  flagDatoreLavoroChanging = false;
  flagIndirizzoLavoroChanging = false;
  flagAziendaUtilizzatriceChanging = false;
  flagDomicilioChanging = false;
  flagRecapitiChanging = false;
  dataChanged = false;

  private readonly TITOLO_ESPERIENZE_LAVORO = 'ESPERIENZE DI LAVORO';

  private messaggioConfermaElimina: string;
  private msgEliminaComunicazioneObbligatoria: string;
  private msgDataFineSuccessivaDataInizio: string;
  private msgDataPeriodoFormMaggioreDataInizioOrMinoreDataCessa: string;
  private msgCodFiscUgualiDatoreAzienda: string;
  private msgDataAssunzioneMaggioreSysDate: string;
  private msgDataAssunzioneMinoreDataNascita: string;
  private msgIndirizzoObblig: string;
  msgComunicazioneObbligatoria: string;
  elencoSettoriAteco: Array<Decodifica>;
  dettaglioLavoroChanging: boolean;

  listaTipoContrattoValidiADataInizioRapporto: TipoContratto[] = [];

  get isVisualizationState(): boolean { return this.statoMaschera === 'V'; }
  get isModifyState(): boolean { return this.statoMaschera === 'U'; }
  get isInsertState(): boolean { return this.statoMaschera === 'I'; }
  get isEditingState(): boolean { return this.isInsertState || this.isModifyState; }
  get isDataFineRapportoObbligatoria(): boolean {
    return this.isEditingState
      && !isNullOrUndefined(this.tipoContrattoSelezionato)
      && this.tipoContrattoSelezionato.ammissibile_forma_TD
      && !this.tipoContrattoSelezionato.ammissibile_forma_TI;
  }
  get isSezioneAziendaUtilizzatriceEditable(): boolean { return this.isEditingState && this.isContrattoConMissione; }
  get isEsperienzaDichiarata(): boolean { return this.esperienzaSelezionata !== null && this.esperienzaSelezionata.esperienza_dichiarata; }
  get isFlgLegge68Editable(): boolean { return this.isEditingState && !isNullOrUndefined(this.tipoContrattoSelezionato) && this.tipoContrattoSelezionato.ammissibile_legge_68; }
  get isFlgStagionaleEditable(): boolean {
    return this.isEditingState &&
      !isNullOrUndefined(this.tipoContrattoSelezionato) &&
      this.tipoContrattoSelezionato.ammissibile_stagionale;
  }
  get isFlgMobilitaEditable(): boolean { return this.isEditingState && !isNullOrUndefined(this.tipoContrattoSelezionato) && this.tipoContrattoSelezionato.ammissibile_mobilita; }
  get isFlgAgricolturaEditable(): boolean {
    return this.isEditingState &&
      !isNullOrUndefined(this.tipoContrattoSelezionato) &&
      this.tipoContrattoSelezionato.ammissibile_agricoltura;
  }
  get isApprendistatoEditable(): boolean { return this.isEditingState && this.isTipoContrattoApprendistato; }
  private get isTipoContrattoApprendistato(): boolean { return this.tipoContrattoSelezionato && this.tipoContrattoSelezionato.codice_silp === 'AP'; }
  get isContrattoConMissione(): boolean { return this.tipoContrattoSelezionato && this.tipoContrattoSelezionato.ammissibile_missione; }

  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly businessService: BusinessService,
    private readonly pslbasepageService: PslshareService
  ) { }

  /**
   * on init
   */
  async ngOnInit() {
    this.utilitiesService.showSpinner();
    // Chiamo subito per eventuali abilitazioni dipendenti dal tipo contratto attuale
    this.onChangeTipoContratto();

    const [ilMsgDiAvviso,
      messaggioConfermaElimina,
      msgEliminaComunicazioneObbligatoria,
      msgDataFineSuccessivaDataInizio,
      msgCodFiscUgualiDatoreAzienda,
      msgIndirizzoObblig,
      msgComunicazioneObbligatoria,
      msgDataPeriodoFormMaggioreDataInizioOrMinoreDataCessa,
      msgDataAssunzioneMaggioreSysDate,
      msgDataAssunzioneMinoreDataNascita
    ] = await Promise.all([
      this.utilitiesService.getMessage('ME107'),
      this.utilitiesService.getMessage('ME087'),
      this.utilitiesService.getMessage('ME088'),
      this.utilitiesService.getMessage('ME092'),
      this.utilitiesService.getMessage('ME094'),
      this.utilitiesService.getMessage('ME095'),
      this.utilitiesService.getMessage('ME096'),
      this.utilitiesService.getMessage('ME100'),
      this.utilitiesService.getMessage('ME108'),
      this.utilitiesService.getMessage('ME115')
    ]);

    this.ilMsgDiAvviso = ilMsgDiAvviso;

    const [nazioni,
      comuni,
      qualifiche] = await Promise.all([
        this.storageService.getCachedValue('NAZIONI', () =>
          this.businessService.getNazioni().pipe(map((values: Nazione[]) => {
            values.sort(this.sortDescrizione);
            return values;
          })).toPromise()),
        this.storageService.getCachedValue('COMUNI', () => this.utilitiesService.getAllComuni()),
        this.storageService.getCachedValue('QUALIFICHE', () =>
          this.businessService.getQualificheProfessionali('', '').pipe(map((values: Decodifica[]) => {
            values.sort(this.sortDescrizione);
            return values;
          })).toPromise())
      ]);
    this.listaNazione = nazioni;
    this.listaComune = comuni;
    this.listaQualifiche = qualifiche;
    // ordino qualche elenco in input
    this.elenchiDecodifiche.settori_ateco.sort(this.sortCodiceMinisteriale);
    this.elencoSettoriAteco = this.elenchiDecodifiche.settori_ateco;
    this.messaggioConfermaElimina = messaggioConfermaElimina;
    this.msgEliminaComunicazioneObbligatoria = msgEliminaComunicazioneObbligatoria;
    this.msgDataFineSuccessivaDataInizio = msgDataFineSuccessivaDataInizio;
    this.msgCodFiscUgualiDatoreAzienda = msgCodFiscUgualiDatoreAzienda;
    this.msgComunicazioneObbligatoria = msgComunicazioneObbligatoria;
    this.msgIndirizzoObblig = msgIndirizzoObblig;
    this.msgDataPeriodoFormMaggioreDataInizioOrMinoreDataCessa = msgDataPeriodoFormMaggioreDataInizioOrMinoreDataCessa;
    this.msgDataAssunzioneMaggioreSysDate = msgDataAssunzioneMaggioreSysDate;
    this.msgDataAssunzioneMinoreDataNascita = msgDataAssunzioneMinoreDataNascita;
    this.utilitiesService.hideSpinner();
    if (this.statoMaschera === 'U' || this.statoMaschera === 'I') {
      this.dettaglioLavoroChanging = true;
      this.flagChangingEmit();
    }
    this.computeListaTipoContratto();
    if (isNullOrUndefined(this.esperienzaSelezionata.assunzione_l68)) {
      this.esperienzaSelezionata.assunzione_l68 = false;
    }
    if (isNullOrUndefined(this.esperienzaSelezionata.lavoro_in_agricoltura)) {
      this.esperienzaSelezionata.lavoro_in_agricoltura = false;
    }
    if (isNullOrUndefined(this.esperienzaSelezionata.lavoro_stagionale)) {
      this.esperienzaSelezionata.lavoro_stagionale = false;
    }
    if (isNullOrUndefined(this.esperienzaSelezionata.lavoratore_in_mobilita)) {
      this.esperienzaSelezionata.lavoratore_in_mobilita = false;
    }
  }

  /**
   * Sorts descrizione
   */
  private sortDescrizione(a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  }
  /**
   * Sorts codice ministeriale
   */
  private sortCodiceMinisteriale(a: any, b: any) {
    return a.codice_ministeriale.localeCompare(b.codice_ministeriale);
  }

  /**
   * Determines whether modifica on
   */
  onModifica() {

    if (this.tipoContrattoSelezionato && (this.tipoContrattoSelezionato.codice_tipo_lavoro === 'R' || this.tipoContrattoSelezionato.codice_tipo_lavoro === 'S')) {
      this.categoriaIsProtect = false;
    } else {
      this.categoriaIsProtect = true;
    }

    if (!isNullOrUndefined(this.esperienzaSelezionata.categoria_inquadramento)) {
      if (isNullOrUndefined(this.esperienzaSelezionata.categoria_inquadramento.codice_ministeriale)) {
        this.esperienzaSelezionata.categoria_inquadramento = null;
      }
    }
    this.statoMaschera = 'U';
    // Chiamo questo per impostare il tipo contratto per le eventuali configurazioni maschera legate ad esso
    this.onChangeTipoContratto();
    this.dettaglioLavoroChanging = true;
    this.flagChangingEmit();
    this.utilitiesService.scrollTo(DettaglioLavoroComponent.SCROLL_TARGET);
  }


  /**
   * Determines whether elimina on
   *  controlli per consentire eliminazione
   */
  async onElimina() {

    /* controllo relativo
    UPD / DEL = NON è ammessa, se la fonte è COB (Comunicazioni OBbligatorie)  Controllo fornito campo fonte nella GetSAP
    Devi verificare l'attributo "tipoSpecificoEntita":  ="ESP" e' Dichiarata,  "RAP" e' COB
*/
    if (!this.esperienzaSelezionata.esperienza_dichiarata) {
      const msg: DialogModaleMessage = {
        titolo: this.TITOLO_ESPERIENZE_LAVORO,
        tipo: TypeDialogMessage.Confirm,
        messaggio: this.msgEliminaComunicazioneObbligatoria,
        messaggioAggiuntivo: ""
      };
      return await this.pslbasepageService.richiestaFinestraModale(msg);
    }
    const data: DialogModaleMessage = {
      titolo: this.TITOLO_ESPERIENZE_LAVORO,
      tipo: TypeDialogMessage.CancelOrConfirm,
      messaggio: this.messaggioConfermaElimina,
      messaggioAggiuntivo: ""
    };
    const res = await this.pslbasepageService.richiestaFinestraModale(data);
    if (res === 'NO') {
      return;
    }
    this.sap.esperienze_di_lavoro = this.sap.esperienze_di_lavoro.filter((el, idx) => idx !== this.indiceSelezionato);
    this.sezioneChange.emit(SezioniSAP.ESPERIENZE_LAVORO);
    this.esperienzaSelezionata = null;
  }

  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.statoMaschera = 'V';
    this.esperienzaSelezionata = null;
    this.dettaglioLavoroChanging = false;
    this.flagChangingEmit();
    this.annullaDettaglio.emit();
  }

  /**
   * Compares by codice ministeriale
   *
   */
  compareByCodiceMinisteriale(a: { codice_ministeriale: string }, b: { codice_ministeriale: string }): boolean {
    return a && b && a.codice_ministeriale === b.codice_ministeriale;
  }

  /**
   * Determines whether salva on
   *  controlli alla pression tasto prosegui salva
   */
  async onSalva() {
    this.setAziendaUtilizzatrice();
    const erroriBloccanti = this.getElencoErroriBloccantiPerSalvataggio();
    if (erroriBloccanti.length > 0) {
      const data: DialogModaleMessage = {
        titolo: this.TITOLO_ESPERIENZE_LAVORO,
        tipo: TypeDialogMessage.Confirm,
        messaggio: erroriBloccanti,
        messaggioAggiuntivo: ""
      };
      return await this.pslbasepageService.richiestaFinestraModale(data);
    }
    this.setEsperienzaSelezionata();
    if (this.isModifyState) {
      this.sap.esperienze_di_lavoro = Object.assign([], this.sap.esperienze_di_lavoro, { [this.indiceSelezionato]: this.esperienzaSelezionata });
    } else if (this.isInsertState) {
      if (isNullOrUndefined(this.sap.esperienze_di_lavoro)) {
        this.sap.esperienze_di_lavoro = [this.esperienzaSelezionata];
      } else {
        this.sap.esperienze_di_lavoro = [this.esperienzaSelezionata, ...this.sap.esperienze_di_lavoro];
      }
    }
    this.sezioneChange.emit(SezioniSAP.ESPERIENZE_LAVORO);
    this.flagChanging.emit(false);
  }

  /**
   * Sets esperienza selezionata
   */
  private setEsperienzaSelezionata() {
    if (!isNullOrUndefined(this.esperienzaSelezionata)) {
      if (!isNullOrUndefined(this.esperienzaSelezionata.principali_mansioni)) {
        this.esperienzaSelezionata.principali_mansioni = this.esperienzaSelezionata.principali_mansioni.toUpperCase();
      }
      if (!isNullOrUndefined(this.esperienzaSelezionata.datore_lavoro)) {
        if (!isNullOrUndefined(this.esperienzaSelezionata.datore_lavoro.denominazione)) {
          this.esperienzaSelezionata.datore_lavoro.denominazione = this.esperienzaSelezionata.datore_lavoro.denominazione.toUpperCase();
        }
        if (!isNullOrUndefined(this.esperienzaSelezionata.azienda_utilizzatrice)) {
          if (!isNullOrUndefined(this.esperienzaSelezionata.azienda_utilizzatrice.denominazione)) {
            this.esperienzaSelezionata.azienda_utilizzatrice.denominazione = this.esperienzaSelezionata.azienda_utilizzatrice.denominazione.toUpperCase();
          }
        }
      }
    }
  }

  /**
   * Sets azienda utilizzatrice
   *
   */
  private setAziendaUtilizzatrice() {
    if (!isNullOrUndefined(this.esperienzaSelezionata.azienda_utilizzatrice)) {
      if (typeof this.esperienzaSelezionata.azienda_utilizzatrice.settore === 'string') {
        this.esperienzaSelezionata.azienda_utilizzatrice.settore = null;
      }
      if (this.esperienzaSelezionata.azienda_utilizzatrice.denominazione === '') {
        this.esperienzaSelezionata.azienda_utilizzatrice.denominazione = null;
      }
      if (this.esperienzaSelezionata.azienda_utilizzatrice.codice_fiscale === '') {
        this.esperienzaSelezionata.azienda_utilizzatrice.codice_fiscale = null;
      }
    }
  }

  /**
   * Gets elenco errori bloccanti per salvataggio
   * @returns elenco errori bloccanti per salvataggio
   */
  getElencoErroriBloccantiPerSalvataggio(): string {
    let stringaErrori = "";
    if (this.isDataFineSuccessivaDataInizio()) {
      stringaErrori = this.msgDataFineSuccessivaDataInizio;
    }
    if (!isNullOrUndefined(this.esperienzaSelezionata.data_inizio_rapporto)) {
      if (this.esperienzaSelezionata.data_inizio_rapporto > new Date()) {
        stringaErrori = this.aggiungiBR(stringaErrori);
        stringaErrori += this.msgDataAssunzioneMaggioreSysDate;
      }
      if (this.isDataAssunzioneMinoreDataNascita()) {
        stringaErrori = this.aggiungiBR(stringaErrori);
        stringaErrori += this.msgDataAssunzioneMinoreDataNascita;
      }
    }
    if (this.isDataPeriodoFormMaggioreDataInizioOrMinoreDataCessa()) {
      stringaErrori = this.aggiungiBR(stringaErrori);
      stringaErrori += this.msgDataPeriodoFormMaggioreDataInizioOrMinoreDataCessa;
    }
    if (this.isCodFiscUgualiDatoreAzienda()) {
      stringaErrori = this.aggiungiBR(stringaErrori);
      stringaErrori += this.msgCodFiscUgualiDatoreAzienda;
    }
    if (this.isIndirizzoCorretto()) {
      /* è stato inserito o l'indirizzo o la nazione
      quindi non si fa nulla perchè è corretto  */
    } else {
      stringaErrori = this.aggiungiBR(stringaErrori);
      stringaErrori += this.msgIndirizzoObblig;
    }
    if (this.isTipoContrattoNonSelezionato()) {
      stringaErrori = this.aggiungiBR(stringaErrori);
      stringaErrori += this.msgIndirizzoObblig;
    }
    return stringaErrori;
  }

  /**
   * Determines whether tipo contratto non selezionato is
   * @returns true se manca tipo contratto
   */
  private isTipoContrattoNonSelezionato() {
    return isNullOrUndefined(this.esperienzaSelezionata.tipo_contratto)
      || isNullOrUndefined(this.esperienzaSelezionata.tipo_contratto.codice_ministeriale);
  }

  /**
   * Determines whether indirizzo corretto is
   * @returns true se presenti dati indirzzo lavoro
   */
  private isIndirizzoCorretto() {
    return (!isNullOrUndefined(this.esperienzaSelezionata.indirizzo_di_lavoro)
      && !isNullOrUndefined(this.esperienzaSelezionata.indirizzo_di_lavoro.indirizzo)
      && !isNullOrUndefined(this.esperienzaSelezionata.indirizzo_di_lavoro.comune))
      || !isNullOrUndefined(this.esperienzaSelezionata.indirizzo_di_lavoro.stato);
  }

  /**
   * Determines whether data fine successiva data inizio is
   * @returns true se date coerenti
   */
  private isDataFineSuccessivaDataInizio() {
    return !isNullOrUndefined(this.esperienzaSelezionata.data_fine_rapporto)
      && this.esperienzaSelezionata.data_inizio_rapporto > this.esperienzaSelezionata.data_fine_rapporto;
  }

  /**
   * Determines whether data assunzione minore data nascita is
   * @returns true se data assunzione precedente nascita
   */
  private isDataAssunzioneMinoreDataNascita() {
    return this.esperienzaSelezionata.data_inizio_rapporto <= this.sap.dataDiNascita;
  }

  /**
   * Determines whether data periodo form maggiore data inizio or minore data cessa is
   * @returns boolean
   */
  private isDataPeriodoFormMaggioreDataInizioOrMinoreDataCessa() {
    return !isNullOrUndefined(this.esperienzaSelezionata.data_fine_periodo_formativo)
      && (this.esperienzaSelezionata.data_fine_periodo_formativo > this.esperienzaSelezionata.data_fine_rapporto ||
        this.esperienzaSelezionata.data_fine_periodo_formativo < this.esperienzaSelezionata.data_inizio_rapporto);
  }

  /**
   * Determines whether cod fisc uguali datore azienda is
   * @returns boolean
   */
  private isCodFiscUgualiDatoreAzienda() {
    return !isNullOrUndefined(this.esperienzaSelezionata.datore_lavoro.codice_fiscale)
      && !isNullOrUndefined(this.esperienzaSelezionata.azienda_utilizzatrice.codice_fiscale) &&
      this.esperienzaSelezionata.azienda_utilizzatrice.codice_fiscale === this.esperienzaSelezionata.datore_lavoro.codice_fiscale;
  }

  /**
   * Aggiungis br
   * @param stringaErrori stringa iniziale
   * @returns string
   */
  private aggiungiBR(stringaErrori: string) {
    if (stringaErrori != null && stringaErrori !== "") {
      stringaErrori += ".<br><br>";
    }
    return stringaErrori;
  }

  /**
   * Determines whether change tipo contratto on
   */
  onChangeTipoContratto() {
    this.cleanAziendaUtilizzatriceSeNecessario();
    if (!this.isTipoContrattoApprendistato) {
      this.esperienzaSelezionata.data_fine_periodo_formativo = null;
    }

    if (this.tipoContrattoSelezionato && (this.tipoContrattoSelezionato.codice_tipo_lavoro === 'R' || this.tipoContrattoSelezionato.codice_tipo_lavoro === 'S')) {
      this.categoriaIsProtect = false;
    } else {
      this.categoriaIsProtect = true;
    }
    this.esperienzaSelezionata.tipo_contratto = this.tipoContrattoSelezionato
      ? UtilitiesService.copyProperties(this.tipoContrattoSelezionato, 'codice_ministeriale', 'descrizione')
      : null;
  }

  /**
   * Determines whether change tipo contratto azzera flag on
   */
  onChangeTipoContrattoAzzeraFlag() {

    this.onChangeTipoContratto();
    this.cleanFlags();
    if (this.categoriaIsProtect) {
      this.esperienzaSelezionata.categoria_inquadramento = null;
    }

    this.isMsgAvviso = true;
  }

  /**
   * Ritorna true se il comune o la nazione del luogo di lavoro sono selezionati
   */
  isLuogoSelezionato(): boolean {
    const comune = this.esperienzaSelezionata.indirizzo_di_lavoro && this.esperienzaSelezionata.indirizzo_di_lavoro.comune;
    const nazione = this.esperienzaSelezionata.indirizzo_di_lavoro && this.esperienzaSelezionata.indirizzo_di_lavoro.stato;
    return (comune && !isNullOrUndefined(comune.codice_ministeriale))
      || (nazione && !isNullOrUndefined(nazione.codice_ministeriale));
  }

  /**
   * Determines whether change nazione on
   */
  onChangeNazione() {
    const nazSel = this.esperienzaSelezionata.indirizzo_di_lavoro.stato;
    if (nazSel !== null && nazSel.codice_ministeriale !== null) {
      this.esperienzaSelezionata.indirizzo_di_lavoro.comune = null;
    }
  }

  /**
   * Determines whether change comune on
   */
  onChangeComune() {
    const comSel = this.esperienzaSelezionata.indirizzo_di_lavoro.comune;
    if (comSel !== null && comSel.codice_ministeriale !== null) {
      this.esperienzaSelezionata.indirizzo_di_lavoro.stato = null;
    }
  }

  /**
   * Cleans azienda utilizzatrice se necessario
   */
  cleanAziendaUtilizzatriceSeNecessario() {
    if (!this.isContrattoConMissione) {
      this.esperienzaSelezionata.azienda_utilizzatrice.codice_fiscale = null;
      this.esperienzaSelezionata.azienda_utilizzatrice.denominazione = null;
      this.esperienzaSelezionata.azienda_utilizzatrice.indirizzo = {};
      this.esperienzaSelezionata.azienda_utilizzatrice.settore = null;
    } else if (this.esperienzaSelezionata.azienda_utilizzatrice.settore
      && !this.esperienzaSelezionata.azienda_utilizzatrice.settore.codice_ministeriale) {
      this.esperienzaSelezionata.azienda_utilizzatrice.settore = null;
    }
  }

  /**
   * Cleans flags
   */
  cleanFlags() {
    this.esperienzaSelezionata.assunzione_l68 = false;
    this.esperienzaSelezionata.lavoro_in_agricoltura = false;
    this.esperienzaSelezionata.lavoro_stagionale = false;
    this.esperienzaSelezionata.lavoratore_in_mobilita = false;
  }


  /**
   * Gets tipo contratto by codice
   * @param codice string
   * @returns tipo contratto by codice
   */
  getTipoContrattoByCodice(codice: string): TipoContratto {
    if (isNullOrUndefined(codice)) {
      return null;
    }
    return this.elenchiDecodifiche.tipi_contratto.find(elem => elem.codice_ministeriale === codice);
  }

  /**
   * Search comune of dettaglio lavoro component
   */
  searchComune = (text$: Observable<string>): Observable<Comune[]> =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        let listaComuni = [] as Comune[];
        if (term && term.length >= 2) {
          listaComuni = this.listaComune;
          const termUpper = term.toLocaleUpperCase();
          listaComuni = listaComuni.filter(comune => comune.descrizione.toLocaleUpperCase().includes(termUpper));
        }
        return of(listaComuni);
      }),
    )

  /**
   * Search qualifica of dettaglio lavoro component
   */
  searchQualifica = (text$: Observable<string>): Observable<Decodifica[]> =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        let listaQual = [] as Decodifica[];
        if (term && term.length >= 3) {
          listaQual = this.listaQualifiche;
          const termUpper = term.toLocaleUpperCase();
          listaQual = listaQual.filter(q => q.descrizione.toLocaleUpperCase().includes(termUpper)).sort(this.sortDescrizione);
        }
        return of(listaQual);
      }),
    )

  /**
   * Custom search fn of dettaglio lavoro component
   */
  customSearchFn = (text$: Observable<string>): Observable<Decodifica[]> =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        let listaSettoriAteco = [] as Decodifica[];
        if (term && term.length >= 3) {
          listaSettoriAteco = this.elencoSettoriAteco;
          const termUpper = term.toLocaleUpperCase();
          listaSettoriAteco = listaSettoriAteco.filter(q => ((q.codice_ministeriale + ' - ' + q.descrizione.toLocaleUpperCase()).includes(termUpper)));
        }
        return of(listaSettoriAteco);
      }),
    )

  /**
   * Formats matches
   * @param item Comune
   *
   * @returns descrizione
   */
  formatMatches(item: Comune) {
    return item ? item.descrizione : '';
  }

  /**
   * Formats matches qualifica
   * @param item Decodifica
   * @returns descrizione
   */
  formatMatchesQualifica(item: Decodifica) {
    return item ? item.descrizione : '';
  }

  /**
   * Formats matches settori ateco
   * @param item Decodifica
   * @returns codice - descrizione
   */
  formatMatchesSettoriAteco(item: Decodifica) {
    if (isNullOrUndefined(item)) {
      return;
    } else {
      if (!isNullOrUndefined(item.codice_ministeriale) &&
        !isNullOrUndefined(item.descrizione)) {
        return item ? (item.codice_ministeriale + " - " + item.descrizione) : '';
      } else {
        return;
      }
    }
  }

  /**
   * Datores lavoro edit state
   * @param stato boolean
   */
  datoreLavoroEditState(stato: boolean) {
    this.flagDatoreLavoroChanging = stato;
    this.flagChangingEmit();
  }

  /**
   * Datores lavoro changed
   * @param indirizzo Indirizzo
   */
  datoreLavoroChanged(indirizzo: Indirizzo) {
    this.esperienzaSelezionata.datore_lavoro.indirizzo = indirizzo;
    this.dataChanged = true;
  }

  /**
   * Indirizzos lavoro edit state
   * @param stato boolean
   */
  indirizzoLavoroEditState(stato: boolean) {
    this.flagIndirizzoLavoroChanging = stato;
    this.flagChangingEmit();
  }
  /**
   * Indirizzos lavoro changed
   * @param indirizzo Indirizzo
   */
  indirizzoLavoroChanged(indirizzo: Indirizzo) {
    this.esperienzaSelezionata.indirizzo_di_lavoro = indirizzo;
    this.dataChanged = true;
  }
  /**
   * Aziendas utilizzatrice edit state
   * @param stato boolean
   */
  aziendaUtilizzatriceEditState(stato: boolean) {
    this.flagAziendaUtilizzatriceChanging = stato;
    this.flagChangingEmit();
  }
  /**
   * Aziendas utilizzatrice changed
   * @param indirizzo Indirizzo
   */
  aziendaUtilizzatriceChanged(indirizzo: Indirizzo) {
    this.esperienzaSelezionata.azienda_utilizzatrice.indirizzo = indirizzo;
    this.dataChanged = true;
  }

  /**
   * Flags changing emit
   */
  private flagChangingEmit() {
    if (this.statoMaschera === 'U' || this.statoMaschera === 'I') {
      this.dettaglioLavoroChanging = true;
    }
    const flag =
      this.dettaglioLavoroChanging ||
      this.flagIndirizzoLavoroChanging || this.flagAziendaUtilizzatriceChanging || this.flagDatoreLavoroChanging || this.flagDomicilioChanging || this.flagRecapitiChanging;
    this.flagChanging.emit(flag);
  }


  /**
   * Gets whether is all in one
   */
  get isAllInOne(): boolean {
    if (this.esperienzaSelezionata.azienda_utilizzatrice) {
      if (this.esperienzaSelezionata.azienda_utilizzatrice.codice_fiscale &&
        this.esperienzaSelezionata.azienda_utilizzatrice.denominazione &&
        this.esperienzaSelezionata.azienda_utilizzatrice.settore.codice_ministeriale) {
        return true;
      }
    }
    return false;
  }

  ifOneThenFullInput(c: AbstractControl): ValidationErrors {

    const value = c.value;
    const txtCodiceFiscaleUtilizzatrice = value && value.txtCodiceFiscaleUtilizzatrice;
    const txtDenominazioneUtilizzatrice = value && value.txtDenominazioneUtilizzatrice;
    const cmbSettoreUtilizzatrice = value && value.cmbSettoreUtilizzatrice;

    if ((txtCodiceFiscaleUtilizzatrice && txtDenominazioneUtilizzatrice && cmbSettoreUtilizzatrice)
      || (!txtCodiceFiscaleUtilizzatrice && !txtDenominazioneUtilizzatrice && !cmbSettoreUtilizzatrice)) {
      return null;
    }
    return { 'tuttiONessuno': 'Per fornire l\'Azienda Utilizzatrice, devono essere indicati obbligatoriamente: Codice Fiscale, Denominazione e Settore Attivita\'' };

  }

  /**
   * Gets whether is data inserita
   */
  get isDataInserita(): boolean {
    if (this.esperienzaSelezionata.data_inizio_rapporto == null) {
      return true;
    }
    return false;
  }


  /**
   * Cancellas tipo contratto ericarica
   */
  cancellaTipoContrattoERicarica() {
    this.esperienzaSelezionata.tipo_contratto = null;
    this.tipoContrattoSelezionato = null;
    this.listaTipoContrattoValidiADataInizioRapporto = [];
    if (this.esperienzaSelezionata.data_inizio_rapporto instanceof Date) {
      this.computeListaTipoContratto();
    }
    this.isMsgAvviso = true;
  }



  /**
   * Computes lista tipo contratto
   */

  private computeListaTipoContratto() {
    const dataPerFiltro = this.commonFCService.cleanupDate(this.esperienzaSelezionata.data_inizio_rapporto || new Date());

    this.listaTipoContrattoValidiADataInizioRapporto = this.elenchiDecodifiche.tipi_contratto.filter(
      tc => this.commonFCService.isDataCompresa(dataPerFiltro, tc.data_inizio_validita, tc.data_fine_validita)
    ).sort(this.sortCodiceMinisteriale);
  }

}
