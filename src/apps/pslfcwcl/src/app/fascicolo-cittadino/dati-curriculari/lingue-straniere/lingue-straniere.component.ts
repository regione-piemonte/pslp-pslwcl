import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Decodifica, Lingua, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, SezioniSAP, TypeDialogMessage } from '@pslwcl/pslmodel';
import { UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { DatiComponenteCurriculare } from '../dati-curriculari.component';

/* Rappresenta lo stato della maschera rispetto al singolo elemento selezionato
   I Inserimento, U Modifica, V visualizzazione */
export type WindowState = 'I' | 'U' | 'V';

@Component({
  selector: 'pslfcwcl-lingue-straniere',
  templateUrl: './lingue-straniere.component.html',
  styleUrls: ['./lingue-straniere.component.css']
})
export class LingueStraniereComponent implements OnInit {
  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="lingueStraniere"]';
  private static readonly SCROLL_TARGET_TORNA_SU = 'em[data-scroll-marker="tornaSu"]';

  @Input() sap: SchedaAnagraficoProfessionale;
  @Input() readOnly: boolean;
  @Input() listaConoscenzaLingua: Decodifica[] = [];
  @Input() listaGradoConoscenzaLingua: Decodifica[] = [];
  @Output() sapChange = new EventEmitter<SchedaAnagraficoProfessionale>();
  @Output() sezioneChange = new EventEmitter<string>();
  @Output() datiComponenteCurriculareChange = new EventEmitter<DatiComponenteCurriculare>();
  @Output() lingueEditState = new EventEmitter<boolean>();
  linguaSelezionata: Lingua;

  statoMaschera: WindowState = 'V';
  updateIndex: number;
  private readonly TITOLO_PAGINA = 'LINGUE STRANIERE';

  get isVisualizationState(): boolean { return this.statoMaschera === 'V'; }
  get isModifyState(): boolean { return this.statoMaschera === 'U'; }
  get isInsertState(): boolean { return this.statoMaschera === 'I'; }
  get isEditingState(): boolean { return this.isInsertState || this.isModifyState; }

  private datiComponenteCurriculare: DatiComponenteCurriculare;
  private messaggioConfermaElimina: string;

  constructor(
    private readonly pslbasepageService: PslshareService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {

    this.sanifySap();

    const [ messaggioConfermaElimina] = await Promise.all([
      this.utilitiesService.getMessage('ME087')
    ]);

    this.messaggioConfermaElimina = messaggioConfermaElimina;


    this.datiComponenteCurriculare = {
      numeroRecordOrigine: this.sap.lingue_straniere.length,
      numeroRecordInseriti: 0,
      numeroRecordAggiornati: 0,
      numeroRecordEliminati: 0
    };
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.lingueEditState.emit(true);

  }

  /**
   * Sanifys sap
   */
  private sanifySap() {
    this.sap.lingue_straniere = this.sap.lingue_straniere || [];
  }

  /**
   * Determines whether visualizza on
   * @param lingua Lingua
   */
  onVisualizza(lingua: Lingua) {
    this.linguaSelezionata = UtilitiesService.clone(lingua);
    this.updateIndex = this.sap.lingue_straniere.findIndex(el => el === lingua);
    this.statoMaschera = 'V';
    this.utilitiesService.scrollTo(LingueStraniereComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether elimina on
   *
   */
  async onElimina() {
    const data: DialogModaleMessage = {
      titolo: this.TITOLO_PAGINA,
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: this.messaggioConfermaElimina,
      messaggioAggiuntivo: ""
    };
    const res = await this.pslbasepageService.richiestaFinestraModale(data);
    if (res === 'NO') {
      return;
    }

    this.sap.lingue_straniere = this.sap.lingue_straniere.filter((el, idx) => idx !== this.updateIndex);
    this.linguaSelezionata = null;
    this.sapChange.emit(this.sap);
    this.sezioneChange.emit(SezioniSAP.LINGUE_STRANIERE);
    this.datiComponenteCurriculare.numeroRecordEliminati++;
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
  }
  /**
   * Determines whether modifica on
   */
  onModifica() {
    this.statoMaschera = 'U';
    this.lingueEditState.emit(false);
    this.utilitiesService.scrollTo(LingueStraniereComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether nuovo on
   */
  onNuovo() {
    this.statoMaschera = 'I';
    this.linguaSelezionata = {};
    this.updateIndex = -1;
    this.lingueEditState.emit(false);
    this.utilitiesService.scrollTo(LingueStraniereComponent.SCROLL_TARGET);
  }
  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.statoMaschera = 'V';
    this.linguaSelezionata = null;
    this.lingueEditState.emit(true);
    this.utilitiesService.scrollTo(LingueStraniereComponent.SCROLL_TARGET_TORNA_SU);
  }

  /**
   * Determines whether salva on
   */
  onSalva() {
    if (this.statoMaschera === 'U') {
      this.sap.lingue_straniere = Object.assign([], this.sap.lingue_straniere, { [this.updateIndex]: this.linguaSelezionata });
      this.datiComponenteCurriculare.numeroRecordAggiornati++;
    } else {
      this.sap.lingue_straniere = [
        ...this.sap.lingue_straniere,
        this.linguaSelezionata
      ];
      this.datiComponenteCurriculare.numeroRecordInseriti++;
    }
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.sapChange.emit(this.sap);
    this.sezioneChange.emit(SezioniSAP.LINGUE_STRANIERE);
    this.onAnnulla();
    this.lingueEditState.emit(true);
  }

  /**
   * Compares by codice ministeriale
   *
   */
  compareByCodiceMinisteriale(a: {codice_ministeriale: string}, b: {codice_ministeriale: string}): boolean {
    return a && b && a.codice_ministeriale === b.codice_ministeriale;
  }

}
