import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Decodifica, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, TypeDialogMessage } from '@pslwcl/pslmodel';
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { DatiComponenteCurriculare } from '../dati-curriculari.component';

@Component({
  selector: 'pslfcwcl-abilitazioni',
  templateUrl: './abilitazioni.component.html',
  styleUrls: ['./abilitazioni.component.css']
})
export class AbilitazioniComponent implements OnInit {
  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="abilitazioni"]';
  private static readonly SCROLL_TARGET_TORNA_SU = 'em[data-scroll-marker="tornaSu"]';

  @Input() sap: SchedaAnagraficoProfessionale;
  @Input() readOnly: boolean;
  @Input() listaAlbi: Decodifica[] = [];
  @Output() sapChange = new EventEmitter<SchedaAnagraficoProfessionale>();
  @Output() datiComponenteCurriculareChange = new EventEmitter<DatiComponenteCurriculare>();
  @Output() abilitazioniEditState = new EventEmitter<boolean>();

  albo: Decodifica;

  isVisualizza = true;
  isAggiornamento = false;
  updateIndex: number;
  private datiComponenteCurriculare: DatiComponenteCurriculare;
  private messaggioConfermaElimina: string;

  TITOLO_FINESTRA = 'ALBI E ORDINI PROFESSIONALI';

  constructor(
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
  ) { }

  async ngOnInit() {
    this.sanifySap();

    const [messaggioConfermaElimina] = await Promise.all([
      this.utilitiesService.getMessage('ME087')
    ]);

    this.messaggioConfermaElimina = messaggioConfermaElimina;

    this.datiComponenteCurriculare = {
      numeroRecordOrigine: this.sap.albi.length,
      numeroRecordInseriti: 0,
      numeroRecordAggiornati: 0,
      numeroRecordEliminati: 0
    };
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.abilitazioniEditState.emit(true);
  }

  private sanifySap() {
    this.sap.albi = this.sap.albi || [];
  }

  /**
   * Determines whether visualizza on
   * @param albo Decodifica
   */
  onVisualizza(albo: Decodifica) {
    this.albo = UtilitiesService.clone(albo);
    this.isVisualizza = true;
    this.isAggiornamento = true;
    this.updateIndex = this.sap.albi.findIndex(el => el === albo);
    this.utilitiesService.scrollTo(AbilitazioniComponent.SCROLL_TARGET);
  }
  /**
   * Determines whether submit on
   *
   */
  onSubmit() {
    if (this.isVisualizza) {
      return this.onModifica();
    }
    return this.onSalva();
  }
  /**
   * Determines whether nuovo on
   */
  onNuovo() {
    // Inizializzazione oggetto
    this.albo = {};
    this.isAggiornamento = false;
    this.isVisualizza = false;
    this.updateIndex = -1;
    this.abilitazioniEditState.emit(false);
    this.utilitiesService.scrollTo(AbilitazioniComponent.SCROLL_TARGET);
  }
  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.albo = null;
    this.abilitazioniEditState.emit(true);
    this.isVisualizza = true;
    this.utilitiesService.scrollTo(AbilitazioniComponent.SCROLL_TARGET_TORNA_SU);
  }
  /**
   * Determines whether modifica on
   */
  onModifica() {
    this.isVisualizza = false;
    this.abilitazioniEditState.emit(false);
    this.utilitiesService.scrollTo(AbilitazioniComponent.SCROLL_TARGET);
  }
  /**
   * Determines whether salva on
   */
  onSalva() {
    this.albo = { ...this.listaAlbi.find(a => a.codice_ministeriale === this.albo.codice_ministeriale) };
    if (this.isAggiornamento) {
      this.sap.albi = Object.assign([], this.sap.albi, { [this.updateIndex]: this.albo });
      this.datiComponenteCurriculare.numeroRecordAggiornati++;
    } else {
      this.sap.albi = [
        ...this.sap.albi,
        this.albo
      ];
      this.datiComponenteCurriculare.numeroRecordInseriti++;
    }
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.abilitazioniEditState.emit(true);
    this.sapChange.emit(this.sap);
    this.onAnnulla();
  }

  /**
   * Determines whether elimina on
   *
   */
  async onElimina() {
    const data: DialogModaleMessage = {
      titolo: this.TITOLO_FINESTRA,
      tipo: TypeDialogMessage.CancelOrConfirm,
      messaggio: this.messaggioConfermaElimina,
      messaggioAggiuntivo: ''
    };
    const res = await this.pslbasepageService.richiestaFinestraModale(data);
    if (res === 'NO') {
      return;
    }

    this.sap.albi = this.sap.albi.filter((el, idx) => idx !== this.updateIndex);
    this.datiComponenteCurriculare.numeroRecordEliminati++;
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.sapChange.emit(this.sap);
    this.onAnnulla();
  }


}
