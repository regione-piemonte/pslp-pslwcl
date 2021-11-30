import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Decodifica, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, TypeDialogMessage } from '@pslwcl/pslmodel';
import { UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { DatiComponenteCurriculare } from '../dati-curriculari.component';

type PatentePatentino = 'patenti' | 'patentini';

@Component({
  selector: 'pslfcwcl-patenti',
  templateUrl: './patenti.component.html',
  styleUrls: ['./patenti.component.css']
})
export class PatentiComponent implements OnInit {
  private static readonly SCROLL_TARGET = {
    patenti: 'em[data-scroll-marker="patenti"]',
    patentini: 'em[data-scroll-marker="patentini"]'
  };
  private static readonly SCROLL_TARGET_TORNA_SU = 'em[data-scroll-marker="tornaSu"]';


  @Input() sap: SchedaAnagraficoProfessionale;
  @Input() readOnly: boolean;
  @Input() listaPatenti: Decodifica[] = [];
  @Input() listaPatentini: Decodifica[] = [];
  @Output() sapChange = new EventEmitter<SchedaAnagraficoProfessionale>();
  @Output() datiComponenteCurriculareChange = new EventEmitter<DatiComponenteCurriculare>();
  @Output() patentiEditState = new EventEmitter<boolean>();

  patente: Decodifica;
  patentino: Decodifica;

  isVisualizza = {
    patenti: true,
    patentini: true
  };
  isAggiornamento = {
    patenti: false,
    patentini: false
  };
  updateIndex = {
    patenti: -1,
    patentini: -1
  };
  private datiComponenteCurriculare: DatiComponenteCurriculare;

  constructor(
    private readonly pslbasepageService: PslshareService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {
    this.sanifySap();
    this.datiComponenteCurriculare = {
      numeroRecordOrigine: this.sap.patenti.length + this.sap.patentini.length,
      numeroRecordInseriti: 0,
      numeroRecordAggiornati: 0,
      numeroRecordEliminati: 0
    };
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.patentiEditState.emit(true);
  }

  /**
   * Sanifys sap
   */
  private sanifySap() {
    this.sap.patenti = this.sap.patenti || [];
    this.sap.patentini = this.sap.patentini || [];
  }

  /**
   * Determines whether visualizza patente on
   * @param patente Decodifica
   */
  onVisualizzaPatente(patente: Decodifica) {
    this.patente = this.onVisualizza(patente, 'patenti');
  }
  /**
   * Determines whether submit patente on
   */
  onSubmitPatente() {
    this.onSubmit(this.patente, this.listaPatenti, 'patenti', 'PATENTI', 'Patente già presente');
  }
  /**
   * Determines whether nuovo patente on
   */
  onNuovoPatente() {
    // Inizializzazione oggetto
    this.patente = this.onNuovo('patenti');
    this.patentiEditState.emit(false);
  }
  /**
   * Determines whether annulla patente on
   */
  onAnnullaPatente() {
    this.patente = null;
    this.patentiEditState.emit(true);
    this.isVisualizza.patenti = true;
    this.utilitiesService.scrollTo(PatentiComponent.SCROLL_TARGET_TORNA_SU);
  }
  /**
   * Determines whether elimina patente on
   */
  onEliminaPatente() {
    this.onElimina('PATENTI', 'Sei sicuro di voler eliminare la patente selezionata?', 'patenti');
  }

  /**
   * Determines whether visualizza patentino on
   * @param patentino Decodifica
   */
  onVisualizzaPatentino(patentino: Decodifica) {
    this.patentino = this.onVisualizza(patentino, 'patentini');
  }
  /**
   * Determines whether submit patentino on
   */
  onSubmitPatentino() {
    this.onSubmit(this.patentino, this.listaPatentini, 'patentini', 'PATENTINI', 'Patentino già presente');
  }
  /**
   * Determines whether nuovo patentino on
   */
  onNuovoPatentino() {
    // Inizializzazione oggetto
    this.patentino = this.onNuovo('patentini');
    this.patentiEditState.emit(false);
  }
  /**
   * Determines whether annulla patentino on
   */
  onAnnullaPatentino() {
    this.patentino = null;
    this.patentiEditState.emit(true);
    this.isVisualizza.patentini = true;
    this.utilitiesService.scrollTo(PatentiComponent.SCROLL_TARGET_TORNA_SU);
  }
  /**
   * Determines whether elimina patentino on
   */
  onEliminaPatentino() {
    this.onElimina('PATENTINI', 'Sei sicuro di voler eliminare il patentino selezionata?', 'patentini');
  }


  /**
   * Determines whether visualizza on
   * @param decodifica Decodifica
   * @param type PatentePatentino
   * @returns clone Decodifica
   */
  private onVisualizza(decodifica: Decodifica, type: PatentePatentino): Decodifica {
    const clone = UtilitiesService.clone(decodifica);
    this.isVisualizza[type] = true;
    this.isAggiornamento[type] = true;
    this.updateIndex[type] = this.sap[type].findIndex(el => el === decodifica);
    this.utilitiesService.scrollTo(PatentiComponent.SCROLL_TARGET[type]);
    return clone;
  }
  /**
   * Determines whether nuovo on
   * @param type PatentePatentino
   * @returns nuovo Decodifica
   */
  private onNuovo(type: PatentePatentino): Decodifica {
    // Inizializzazione oggetto
    this.isAggiornamento[type] = false;
    this.isVisualizza[type] = false;
    this.updateIndex[type] = -1;
    this.patentiEditState.emit(false);
    this.utilitiesService.scrollTo(PatentiComponent.SCROLL_TARGET[type]);
    return {};
  }
  /**
   * Determines whether modifica on
   * @param type PatentePatentino
   */
  private onModifica(type: PatentePatentino) {
    this.isVisualizza[type] = false;
    this.patentiEditState.emit(false);
    this.utilitiesService.scrollTo(PatentiComponent.SCROLL_TARGET[type]);
  }

  /**
   * Determines whether submit on
   * @param decodifica Decodifica
   * @param list Decodifica[]
   * @param type PatentePatentino
   * @param titolo string
   * @param messaggio string
   *
   */
  private onSubmit(decodifica: Decodifica, list: Decodifica[], type: PatentePatentino, titolo: string, messaggio: string) {
    if (this.isVisualizza[type]) {
      return this.onModifica(type);
    }
    return this.onSalva(decodifica, list, type, titolo, messaggio);
  }

  /**
   * Determines whether salva on
   * @param decodifica Decodifica
   * @param list Decodifica[]
   * @param type PatentePatentino
   * @param titolo string
   * @param messaggio string
   *
   */
  private async onSalva(decodifica: Decodifica, list: Decodifica[], type: PatentePatentino, titolo: string, messaggio: string) {
    const retrievedDecodifica = {...list.find(a => a.codice_ministeriale === decodifica.codice_ministeriale)};
    if (this.isAggiornamento[type]) {
      this.sap[type] = Object.assign([], this.sap[type], { [this.updateIndex[type]]: retrievedDecodifica });
      this.datiComponenteCurriculare.numeroRecordAggiornati++;
    } else {
      if (this.sap[type].some(d => d.codice_ministeriale === retrievedDecodifica.codice_ministeriale)) {
        // Gia' presente
        const data: DialogModaleMessage = {
          titolo,
          tipo: TypeDialogMessage.Confirm,
          messaggio,
          messaggioAggiuntivo: ''
        };
        return await this.pslbasepageService.richiestaFinestraModale(data);
      }

      this.sap[type] = [
        ...this.sap[type],
        retrievedDecodifica
      ];
      this.datiComponenteCurriculare.numeroRecordInseriti++;
    }
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.sapChange.emit(this.sap);
    this.patentiEditState.emit(true);
    this.onAnnulla(type);
  }
  /**
   * Determines whether annulla on
   * @param type PatentePatentino
   * esegue annula Patente o PAtentino a seconda del tipo
   */
  private onAnnulla(type: PatentePatentino) {
    this.utilitiesService.scrollTo(PatentiComponent.SCROLL_TARGET_TORNA_SU);
    if (type === 'patenti') {
      return this.onAnnullaPatente();
    }
    return this.onAnnullaPatentino();

  }
  /**
   * Determines whether elimina on
   * @param titolo string
   * @param messaggio string
   * @param type PatentePatentino
   *
   */
  private async onElimina(titolo: string, messaggio: string, type: PatentePatentino) {
    const data: DialogModaleMessage = {
      titolo,
      tipo: TypeDialogMessage.CancelOrConfirm,
      messaggio,
      messaggioAggiuntivo: ''
    };
    const res = await this.pslbasepageService.richiestaFinestraModale(data);
    if (res === 'NO') {
      return;
    }

    this.sap[type] = this.sap[type].filter((el, idx) => idx !== this.updateIndex[type]);
    this.sapChange.emit(this.sap);
    this.datiComponenteCurriculare.numeroRecordEliminati++;
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.onAnnulla(type);
  }

}
