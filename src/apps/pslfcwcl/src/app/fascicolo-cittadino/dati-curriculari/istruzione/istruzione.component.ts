import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, NgModel, ValidationErrors } from '@angular/forms';
import { BusinessService, Comune, Decodifica, GradoStudio, Nazione, Provincia, SchedaAnagraficoProfessionale, TitoloDiStudio, TitoloStudio } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { SezioniSAP, DialogModaleMessage, TypeDialogMessage } from '@pslwcl/pslmodel';
import { CommonPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { DettaglioDIDUtilitiesService } from '../../../did/dettaglio-did/dettaglio-did-utilities.service';
import { DatiComponenteCurriculare } from '../dati-curriculari.component';


type StatoCompletamento = 'C' | 'I' | 'N';

@Component({
  selector: 'pslfcwcl-istruzione',
  templateUrl: './istruzione.component.html',
  styleUrls: ['./istruzione.component.css']
})
export class IstruzioneComponent implements OnInit, OnChanges {
  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="istruzione"]';
  private static readonly SCROLL_TARGET_TORNA_SU = 'em[data-scroll-marker="tornaSu"]';

  @ViewChild('titoloStudio', { static: false }) private titoloStudioNgModel: NgModel;


  @Input() sap: SchedaAnagraficoProfessionale;
  @Input() readOnly: boolean;

  @Output() sapChange = new EventEmitter<SchedaAnagraficoProfessionale>();
  @Output() sezioneChange = new EventEmitter<string>();
  @Output() datiComponenteCurriculareChange = new EventEmitter<DatiComponenteCurriculare>();
  @Output() istruzioneEditState = new EventEmitter<boolean>();

  titoloDiStudio: TitoloDiStudio;

  indirizzo: {
    comune?: Comune;
    provincia?: string;
    nazione?: string;
  };

  statoCompletamento: StatoCompletamento;
  isVisualizza = true;
  isAggiornamento = false;
  updateIndex: number;
  abilitaComune = false;

  listaGradoStudio: GradoStudio[] = [];
  listaProvincia: Provincia[] = [];
  listaNazione: Nazione[] = [];
  private listaComune: Comune[] = [];
  private listaTitoloStudioFull: TitoloStudio[] = [];
  private titoloStudioProfiling: TitoloStudio;
  private datiComponenteCurriculare: DatiComponenteCurriculare;
  private msgEliminaUltimoTitoloStudio: string;
  private msgTitoloStudioLegatoProfiling: string;
  private messaggioConfermaElimina: string;
  private msgDataConseguitaMinoreDataNascita: string;

  private readonly TITOLO_PAGINA = 'ISTRUZIONE';



  get listaTitoloStudio(): TitoloStudio[] {
    if (!this.titoloDiStudio || !this.titoloDiStudio.livello_scolarizzazione || !this.titoloDiStudio.livello_scolarizzazione.codice) {
      return [];
    }
    return this.listaTitoloStudioFull.filter(el => !el.gradoStudio || el.gradoStudio.codice === this.titoloDiStudio.livello_scolarizzazione.codice);
  }


  get tipoScuola(): string {
    const titoloStudio = this.findTitoloStudio();
    return titoloStudio ? titoloStudio.descrizioneTipoScuola : '';
  }

  constructor(
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly commonFCService: CommonPslpService,
    private readonly businessService: BusinessService,
    private readonly dettaglioUtilitiesService: DettaglioDIDUtilitiesService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.sanifySap();
    this.datiComponenteCurriculare = {
      numeroRecordOrigine: this.sap.titoli_di_studio.length,
      numeroRecordInseriti: 0,
      numeroRecordAggiornati: 0,
      numeroRecordEliminati: 0
    };
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);

    const [gradiStudio, titoliStudio, province, nazioni, comuni, profilingYG,
      msgEliminaUltimoTitoloStudio, msgTitoloStudioLegatoProfiling, messaggioConfermaElimina, msgDataConseguitaMinoreDataNascita] = await Promise.all([
        this.dettaglioUtilitiesService.getGradiStudio(),
        this.dettaglioUtilitiesService.getTitoliStudioFull(),
        this.storageService.getCachedValue('PROVINCE', () =>
          this.businessService.getProvince().pipe(map((values: Provincia[]) => {
            values.sort(this.sortDescrizione);
            return values;
          } )).toPromise()),
        this.storageService.getCachedValue('NAZIONI', () =>
          this.businessService.getNazioni().pipe(map((values: Nazione[]) => {
            values.sort(this.sortDescrizione);
            return values;
          } )).toPromise()),
        this.storageService.getCachedValue('COMUNI', () => this.utilitiesService.getAllComuni()),
        this.commonFCService.getProfiloResult$(this.commonFCService.getUtenteStorage().id_utente),
        this.utilitiesService.getMessage('ME089'),
        this.utilitiesService.getMessage('ME090'),
        this.utilitiesService.getMessage('ME087'),
        this.utilitiesService.getMessage('ME116')
      ]);

    this.listaGradoStudio = gradiStudio;
    titoliStudio.sort(this.sortDescrizione);
    this.listaTitoloStudioFull = titoliStudio;
    this.listaProvincia = province;
    this.listaNazione = nazioni;
    this.listaComune = comuni;
    this.utilitiesService.hideSpinner();
    this.titoloStudioProfiling = profilingYG.titolo_studio;
    this.msgEliminaUltimoTitoloStudio = msgEliminaUltimoTitoloStudio;
    this.msgTitoloStudioLegatoProfiling = msgTitoloStudioLegatoProfiling;
    this.messaggioConfermaElimina = messaggioConfermaElimina;
    this.msgDataConseguitaMinoreDataNascita = msgDataConseguitaMinoreDataNascita;
    this.istruzioneEditState.emit(true);
  }

  /**
   * on changes
   * @param changes SimpleChanges
   * @returns on changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.sap.isFirstChange()) {
      return;
    }
    this.sanifySap();
  }

  private sanifySap() {
    this.sap.titoli_di_studio = this.sap.titoli_di_studio || [];
  }

  /**
   * Determines whether submit on
   *
   */
  async onSubmit() {
    if (this.isVisualizza) {
      return this.onModifica();
    }
    return this.onSalva();
  }

  /**
   * Determines whether elimina on
   *
   */
  async onElimina() {
    if (this.sap.titoli_di_studio.length === 1) {
      const msg: DialogModaleMessage = {
        titolo: this.TITOLO_PAGINA,
        tipo: TypeDialogMessage.Confirm,
        messaggio: this.msgEliminaUltimoTitoloStudio,
        messaggioAggiuntivo: ""
      };
      return await this.pslbasepageService.richiestaFinestraModale(msg);
    }
    if (this.titoloStudioProfiling) {
      const msg: DialogModaleMessage = { titolo: this.TITOLO_PAGINA,
        tipo: TypeDialogMessage.Confirm,
        messaggio: this.msgTitoloStudioLegatoProfiling,
        messaggioAggiuntivo: ""
      };
      return await this.pslbasepageService.richiestaFinestraModale(msg);
    }
    const data: DialogModaleMessage = {
      titolo: this.TITOLO_PAGINA,
      tipo: TypeDialogMessage.CancelOrConfirm,
      messaggio: this.messaggioConfermaElimina,
      messaggioAggiuntivo: ""
    };
    const res = await this.pslbasepageService.richiestaFinestraModale(data);
    if (res === 'NO') {
      return;
    }

    this.sap.titoli_di_studio = this.sap.titoli_di_studio.filter((el, idx) => idx !== this.updateIndex);
    this.sapChange.emit(this.sap);
    this.sezioneChange.emit(SezioniSAP.ISTRUZIONE);

    this.datiComponenteCurriculare.numeroRecordEliminati++;
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);

    this.onAnnulla();
  }

  /**
   * Determines whether modifica on
   */
  async onModifica() {
    this.istruzioneEditState.emit(false);
    this.isVisualizza = false;
    this.utilitiesService.scrollTo(IstruzioneComponent.SCROLL_TARGET);
    this.abilitaComune = false;
  }

  /**
   * Gets elenco errori bloccanti per salvataggio
   * @returns elenco errori bloccanti per salvataggio
   */
  getElencoErroriBloccantiPerSalvataggio(): string {
    let stringaErrori = "";
    if (!isNullOrUndefined(this.titoloDiStudio.anno_se_conseguito)
      && this.sap.dataDiNascita.getFullYear() > this.titoloDiStudio.anno_se_conseguito) {
      stringaErrori = this.msgDataConseguitaMinoreDataNascita;
    }
    if (!isNullOrUndefined(this.titoloDiStudio.anno_di_frequenza_se_in_corso)
      && this.sap.dataDiNascita.getFullYear() > this.titoloDiStudio.anno_di_frequenza_se_in_corso) {
      stringaErrori = this.msgDataConseguitaMinoreDataNascita;
    }
    if (!isNullOrUndefined(this.titoloDiStudio.ultimo_anno_frequentato_se_non_conseguito)
      && this.sap.dataDiNascita.getFullYear() > this.titoloDiStudio.ultimo_anno_frequentato_se_non_conseguito) {
      stringaErrori = this.msgDataConseguitaMinoreDataNascita;
    }
    return stringaErrori;
  }

  /**
   * Determines whether nuovo on
   */
  onNuovo() {
    // Inizializzazione oggetto
    this.titoloDiStudio = {
      corso_di_studio: {},
      livello_scolarizzazione: {},
      riconosciuto_in_italia: false
    };
    this.statoCompletamento = null;
    this.indirizzo = {
      comune: {}
    };
    this.isAggiornamento = false;
    this.isVisualizza = false;
    this.updateIndex = -1;
    this.istruzioneEditState.emit(false);

    this.utilitiesService.scrollTo(IstruzioneComponent.SCROLL_TARGET);
    this.abilitaComune = false;
  }
  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.titoloDiStudio = null;
    this.statoCompletamento = null;
    this.indirizzo = null;
    this.istruzioneEditState.emit(true);
    this.isVisualizza = true;
    this.utilitiesService.scrollTo(IstruzioneComponent.SCROLL_TARGET_TORNA_SU);
  }



  /**
   * Determines whether salva on
   *
   */
  async onSalva() {
    const erroriBloccanti = this.getElencoErroriBloccantiPerSalvataggio();
    if (erroriBloccanti.length > 0) {
      const data: DialogModaleMessage = { titolo: this.TITOLO_PAGINA,
        tipo: TypeDialogMessage.Confirm,
        messaggio: erroriBloccanti,
        messaggioAggiuntivo: ""
      };
      return await this.pslbasepageService.richiestaFinestraModale(data);
    }
    if (!isNullOrUndefined(this.titoloDiStudio)) {
      if (!isNullOrUndefined(this.titoloDiStudio.descrizione)) {
        this.titoloDiStudio.descrizione = this.titoloDiStudio.descrizione.toUpperCase();
      }
    }
    this.titoloDiStudio.frequentato_in = {
      comune: this.indirizzo.comune,
      stato: this.listaNazione.find(n => n.codice_ministeriale === this.indirizzo.nazione)
    };
    if (isNullOrUndefined(this.titoloDiStudio.corso_di_studio.descrizione)) {

      this.titoloDiStudio.corso_di_studio = {
        codice_ministeriale: this.listaTitoloStudio.find(ts => ts.codice === this.titoloDiStudio.corso_di_studio).codice,
        descrizione: this.listaTitoloStudio.find(ts => ts.codice === this.titoloDiStudio.corso_di_studio).descrizione
      };
    }
    this.titoloDiStudio.livello_scolarizzazione.descrizione = this.listaGradoStudio.find(ts => ts.codice === this.titoloDiStudio.livello_scolarizzazione.codice).descrizione;

    if (this.isAggiornamento) {
      this.sap.titoli_di_studio = Object.assign([], this.sap.titoli_di_studio, { [this.updateIndex]: this.titoloDiStudio });
      this.datiComponenteCurriculare.numeroRecordAggiornati++;
    } else {
      this.sap.titoli_di_studio = [
        ...this.sap.titoli_di_studio,
        this.titoloDiStudio
      ];
      this.datiComponenteCurriculare.numeroRecordInseriti++;
    }
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.sapChange.emit(this.sap);
    this.sezioneChange.emit(SezioniSAP.ISTRUZIONE);
    this.onAnnulla();
    this.istruzioneEditState.emit(true);
    this.utilitiesService.scrollTo(IstruzioneComponent.SCROLL_TARGET_TORNA_SU);
  }

  /**
   * Determines whether change provincia on
   */
  onChangeProvincia() {
    this.indirizzo.comune = null;
    this.indirizzo.nazione = null;
    this.abilitaComune = true;
  }
  /**
   * Cleans nazione
   */
  cleanNazione() {
    if (this.indirizzo.nazione && this.indirizzo.nazione.trim() !== '' && this.indirizzo.nazione !== 'Z000') {
      this.indirizzo.nazione = null;
    }
  }
  /**
   * Determines whether change nazione on
   */
  onChangeNazione() {
    // use default
    if (this.indirizzo.nazione && this.indirizzo.nazione.trim() !== '' && this.indirizzo.nazione !== 'Z000') {
      this.indirizzo.comune = null;
      this.indirizzo.provincia = null;
    }
  }
  /**
   * Formats matches
   * @param item Comune
   * @returns descrizione
   */
  formatMatches(item: Comune) {
    return item ? item.descrizione : '';
  }
  /**
   * Determines whether change conseguimento on
   * @param conseguimento StatoCompletamento
   */
  onChangeConseguimento(conseguimento: StatoCompletamento) {
    if (conseguimento === 'C') {
      this.titoloDiStudio.anno_di_frequenza_se_in_corso = null;
      this.titoloDiStudio.ultimo_anno_frequentato_se_non_conseguito = null;
    } else if (conseguimento === 'I') {
      this.titoloDiStudio.anno_se_conseguito = null;
      this.titoloDiStudio.votazione_conseguita = null;
      this.titoloDiStudio.ultimo_anno_frequentato_se_non_conseguito = null;
    } else if (conseguimento === 'N') {
      this.titoloDiStudio.anno_se_conseguito = null;
      this.titoloDiStudio.votazione_conseguita = null;
      this.titoloDiStudio.anno_di_frequenza_se_in_corso = null;
    }
  }
  /**
   * Search comune of istruzione component
   */
  searchComune = (text$: Observable<string>): Observable<Comune[]> =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        let listaComuni = [] as Comune[];
        if (term && term.length >= 2) {
          listaComuni = this.listaComune;
          if (this.indirizzo.provincia) {
            listaComuni = listaComuni.filter(comune => comune.provincia.codice_ministeriale === this.indirizzo.provincia);
          }
          const termUpper = term.toLocaleUpperCase();
          listaComuni = listaComuni.filter(comune => comune.descrizione.toLocaleUpperCase().includes(termUpper));
        }
        return of(listaComuni);
      }),
    )

  /**
   * Finds titolo studio
   * @returns titolo studio
   */
  findTitoloStudio(): TitoloStudio {
    if (this.titoloDiStudio.corso_di_studio && this.titoloDiStudio.corso_di_studio.codice_ministeriale) {
      return this.listaTitoloStudioFull.find(el => el.codice === this.titoloDiStudio.corso_di_studio.codice_ministeriale);
    }
    return undefined;
  }
  /**
   * Sorts descrizione
   *
   */
  private sortDescrizione(a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  }

  /**
   * Determines whether visualizza on
   * @param titolo TitoloDiStudio
   */
  onVisualizza(titolo: TitoloDiStudio) {
    this.titoloDiStudio = UtilitiesService.clone(titolo);
    this.indirizzo = {
      provincia: this.titoloDiStudio.frequentato_in
        && this.titoloDiStudio.frequentato_in.comune
        && this.titoloDiStudio.frequentato_in.comune.provincia
        ? this.titoloDiStudio.frequentato_in.comune.provincia.codice_ministeriale
        : undefined,
      comune: this.titoloDiStudio.frequentato_in ? this.titoloDiStudio.frequentato_in.comune : undefined,
      nazione: this.titoloDiStudio.frequentato_in
        && this.titoloDiStudio.frequentato_in.stato
        ? this.titoloDiStudio.frequentato_in.stato.codice_ministeriale
        : undefined
    };
    this.statoCompletamento = (this.titoloDiStudio.anno_se_conseguito || this.titoloDiStudio.votazione_conseguita) ? 'C'
      : (this.titoloDiStudio.anno_di_frequenza_se_in_corso) ? 'I'
        : (this.titoloDiStudio.ultimo_anno_frequentato_se_non_conseguito) ? 'N' : null;
    this.isVisualizza = true;
    this.isAggiornamento = true;
    this.updateIndex = this.sap.titoli_di_studio.findIndex(el => el === titolo);
    this.utilitiesService.scrollTo(IstruzioneComponent.SCROLL_TARGET);
    this.abilitaComune = false;
  }

  /**
   * Search titolo of istruzione component
   */
  searchTitolo = (text$: Observable<string>): Observable<TitoloStudio[]> =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        let lista = [] as TitoloStudio[];
        if (term && term.length >= 3) {
          lista = this.listaTitoloStudio;
          const termUpper = term.toLocaleUpperCase();
          lista = lista.filter(q => q.descrizione.toLocaleUpperCase().includes(termUpper)).sort(this.sortDescrizione);
        }
        return of(lista);
      }),
    )

  /**
   * Formats matches titolo studio
   * @param item TitoloStudio
   * @returns descrizione
   */
  formatMatchesTitoloStudio(item: TitoloStudio) {
    return item ? item.descrizione : '';
  }

  /**
   * Determines whether change azzera titolo studio on
   */
  onChangeAzzeraTitoloStudio() {
    this.titoloDiStudio.corso_di_studio = null;
    const list = this.listaTitoloStudio;
    if (list.length === 1) {
      this.titoloDiStudio.corso_di_studio = this.convertToDecodifica(list[0]);
    } else {
      this.titoloDiStudio.corso_di_studio = null;
    }
    this.titoloStudioNgModel.control.markAsTouched();
  }

  /**
   * Sets corso di studio
   *
   */
  setCorsoDiStudio(e: string | TitoloStudio) {
    if (e && typeof e !== 'string' && e.codice) {
      this.titoloDiStudio.corso_di_studio = this.convertToDecodifica(e);
    }
  }

  /**
   * Converts to decodifica
   * @param ts TitoloStudio
   * @returns to decodifica
   */
  private convertToDecodifica(ts: TitoloStudio): Decodifica {
    return {
      codice_ministeriale: ts.codice,
      descrizione: ts.descrizione
    };
  }

  /**
   * one then full input
   * @param c AbstractControl
   * @returns one then full input
   */
  ifOneThenFullInput(c: AbstractControl & { getRawValue?: () => any }): ValidationErrors {
    const value = c.value;
    const txtProvincia = value && value.provincia;
    let txtComune = value && value.comune;
    if (isNullOrUndefined(txtComune) && !isNullOrUndefined(c.getRawValue().comune)) {
      txtComune = c && c.getRawValue().comune.codice_ministeriale;
    }
    if ((txtProvincia && txtComune)
      || (!txtProvincia && !txtComune)
      || (txtComune instanceof Object && !txtComune.codice_ministeriale)) {
      return null;
    }
    return { 'tuttiONessuno': 'I campi Provincia e Comune vanno compilati obbligatoriamente entrambi.' };

  }

}
