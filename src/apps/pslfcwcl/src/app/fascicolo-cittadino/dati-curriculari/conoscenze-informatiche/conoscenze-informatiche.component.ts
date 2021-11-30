import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConoscenzaInformatica, Decodifica, SchedaAnagraficoProfessionale, TipoConoscenzaInformatica } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, SezioniSAP, TypeDialogMessage } from '@pslwcl/pslmodel';
import { UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { DatiComponenteCurriculare } from '../dati-curriculari.component';

interface ConoscenzaInformaticaWrapper {
  conoscenza?: ConoscenzaInformatica;
  categoria?: Decodifica;
}

@Component({
  selector: 'pslfcwcl-conoscenze-informatiche',
  templateUrl: './conoscenze-informatiche.component.html',
  styleUrls: ['./conoscenze-informatiche.component.css']
})
export class ConoscenzeInformaticheComponent implements OnInit {
  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="conoscenzeInformatiche"]';
  private static readonly SCROLL_TARGET_TORNA_SU = 'em[data-scroll-marker="tornaSu"]';

  @Input() sap: SchedaAnagraficoProfessionale;
  @Input() readOnly: boolean;
  @Input() listaConoscenzeInformatiche: TipoConoscenzaInformatica[] = [];
  @Input() listaGradiConoscenzaInformatica: Decodifica[] = [];
  @Input() listaCategorieConoscenzeInformatiche: Decodifica[] = [];
  @Output() sapChange = new EventEmitter<SchedaAnagraficoProfessionale>();
  @Output() sezioneChange = new EventEmitter<string>();
  @Output() conoscenzeEditState = new EventEmitter<boolean>();
  @Output() datiComponenteCurriculareChange = new EventEmitter<DatiComponenteCurriculare>();

  conoscenza: ConoscenzaInformatica;

  conoscenzeInformaticheWrapper: ConoscenzaInformaticaWrapper[] = [];

  isAggiornamento = false;
  isVisualizza = true;
  updateIndex: number;
  noteSpecifiche: string;
  livelloConoscenza: string;
  laCategoriaConoscenzaInformatica: Decodifica = {};
  laListaCatConoInfo: Decodifica[];


  private messaggioConfermaElimina: string;

  private readonly TITOLO_PAGINA = 'CONOSCENZE INFORMATICHE';


  private datiComponenteCurriculare: DatiComponenteCurriculare;


  get listaConoscenzaSpecifica(): TipoConoscenzaInformatica[] {
    if (!this.conoscenza || !this.laCategoriaConoscenzaInformatica.codice_ministeriale) {
      return [];
    }
    return this.listaConoscenzeInformatiche.filter(
      el => el.codice_categoria_conoscenza_informatica === this.laCategoriaConoscenzaInformatica.codice_ministeriale).sort(this.sortDescrizione);
  }

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

    this.listaCategorieConoscenzeInformatiche.sort(this.sortDescrizione);
    this.laListaCatConoInfo = this.listaCategorieConoscenzeInformatiche;

    this.wrapConoscenzeInformatiche();

    this.datiComponenteCurriculare = {
      numeroRecordOrigine: this.sap.conoscenze_informatiche.length,
      numeroRecordInseriti: 0,
      numeroRecordAggiornati: 0,
      numeroRecordEliminati: 0
    };
    this.noteSpecifiche = "";
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.conoscenzeEditState.emit(true);
  }

  /**
   * Wraps conoscenze informatiche
   */
  private wrapConoscenzeInformatiche() {
    this.conoscenzeInformaticheWrapper = (this.sap.conoscenze_informatiche || []).map(conoscenza => ({
      conoscenza,
      categoria: this.caricaCategoriaConoscenzaInformatica(conoscenza)
    }));
  }

  /**
   * Sorts descrizione
   */
  private sortDescrizione(a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  }


  /**
   * Determines whether visualizza on
   * @param laConoscenza ConoscenzaInformatica
   */
  onVisualizza(laConoscenza: ConoscenzaInformatica) {
    this.conoscenza = UtilitiesService.clone(laConoscenza);
    this.laCategoriaConoscenzaInformatica = this.caricaCategoriaConoscenzaInformatica(laConoscenza);
    this.isVisualizza = true;
    this.isAggiornamento = true;
    this.updateIndex = this.sap.conoscenze_informatiche.findIndex(el => el === laConoscenza);
    if (!isNullOrUndefined(laConoscenza.eventuali_specifiche)) {
      this.noteSpecifiche = laConoscenza.eventuali_specifiche.substring(laConoscenza.eventuali_specifiche.lastIndexOf(";") + 1);
    } else {
      this.noteSpecifiche = "";
    }
    this.utilitiesService.scrollTo(ConoscenzeInformaticheComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether nuovo on
   */
  onNuovo() {
    this.conoscenza = {
      tipo_conoscenza: {},
      livello_conoscenza: {}
    };
    this.isVisualizza = false;
    this.isAggiornamento = false;
    this.noteSpecifiche = "";
    this.laCategoriaConoscenzaInformatica = {};
    this.conoscenzeEditState.emit(false);
    this.utilitiesService.scrollTo(ConoscenzeInformaticheComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.conoscenza = null;
    this.isVisualizza = true;
    this.isAggiornamento = false;
    this.conoscenzeEditState.emit(true);
    this.utilitiesService.scrollTo(ConoscenzeInformaticheComponent.SCROLL_TARGET_TORNA_SU);
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
    this.sap.conoscenze_informatiche = this.sap.conoscenze_informatiche.filter((el, idx) => idx !== this.updateIndex);
    this.wrapConoscenzeInformatiche();
    this.datiComponenteCurriculare.numeroRecordEliminati++;
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.sapChange.emit(this.sap);
    this.sezioneChange.emit(SezioniSAP.CONOSCENZE_INFORMATICHE);
    this.onAnnulla();

  }

  /**
   * Determines whether modifica on
   */
  onModifica() {
    this.isVisualizza = false;
    this.conoscenzeEditState.emit(false);
    this.utilitiesService.scrollTo(ConoscenzeInformaticheComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether salva on
   */
  onSalva() {

    this.conoscenza.eventuali_specifiche = ":;;" + this.noteSpecifiche.toUpperCase();

    this.conoscenza.tipo_conoscenza.descrizione =
      this.listaConoscenzeInformatiche.find(
        ts => ts.codice_ministeriale === this.conoscenza.tipo_conoscenza.codice_ministeriale).descrizione;
    this.conoscenza.livello_conoscenza.descrizione =
      this.listaGradiConoscenzaInformatica.find(
        ts => ts.codice_ministeriale === this.conoscenza.livello_conoscenza.codice_ministeriale).descrizione;
    if (this.isAggiornamento) {
      this.sap.conoscenze_informatiche = Object.assign([], this.sap.conoscenze_informatiche, { [this.updateIndex]: this.conoscenza });
      this.datiComponenteCurriculare.numeroRecordAggiornati++;
    } else {
      this.sap.conoscenze_informatiche = [
        ...this.sap.conoscenze_informatiche,
        this.conoscenza
      ];
      this.datiComponenteCurriculare.numeroRecordInseriti++;
    }
    this.wrapConoscenzeInformatiche();
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.sapChange.emit(this.sap);
    this.sezioneChange.emit(SezioniSAP.CONOSCENZE_INFORMATICHE);
    this.onAnnulla();
    this.conoscenzeEditState.emit(true);
    this.noteSpecifiche = "";
    this.utilitiesService.scrollTo(ConoscenzeInformaticheComponent.SCROLL_TARGET_TORNA_SU);
  }


  /**
   * Sanifys sap
   */
  private sanifySap() {
    this.sap.conoscenze_informatiche = this.sap.conoscenze_informatiche || [];
  }

  /**
   * Caricas categoria conoscenza informatica
   * @param laConoscenza ConoscenzaInformatica
   * @returns categoria conoscenza informatica
   */
  private caricaCategoriaConoscenzaInformatica(laConoscenza: ConoscenzaInformatica): Decodifica {
    try {
      let codiceCategoria = null;
      if (!isNullOrUndefined(laConoscenza.codice_categoria_conoscenza_informatica)) {
        codiceCategoria = laConoscenza.codice_categoria_conoscenza_informatica;
      } else {
        codiceCategoria = this.listaConoscenzeInformatiche.find(
          ts => ts.codice_ministeriale === laConoscenza.tipo_conoscenza.codice_ministeriale).codice_categoria_conoscenza_informatica;
      }
      const categoria = this.listaCategorieConoscenzeInformatiche.find(ps => ps.codice_ministeriale === codiceCategoria) || {};
      return { ...categoria };
    } catch (error) {
      this.laCategoriaConoscenzaInformatica = { codice_ministeriale: '000', descrizione: 'NON DEFINITO' };
      return this.laCategoriaConoscenzaInformatica;
    }
  }
}
