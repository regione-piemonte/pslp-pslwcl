import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Decodifica, FormazioneProfessionale, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, SezioniSAP, TypeDialogMessage } from '@pslwcl/pslmodel';
import { UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { DatiComponenteCurriculare } from '../dati-curriculari.component';

export type TipoDurataCorso = 'O' | 'G' | 'M' | 'A';
type Stage = 'S' | 'N';


@Component({
  selector: 'pslfcwcl-formazione-professionale',
  templateUrl: './formazione-professionale.component.html',
  styleUrls: ['./formazione-professionale.component.css']
})
export class FormazioneProfessionaleComponent implements OnInit, OnChanges {
  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="formazioneProfessionale"]';
  private static readonly SCROLL_TARGET_TORNA_SU = 'em[data-scroll-marker="tornaSu"]';


  @Input() sap: SchedaAnagraficoProfessionale;
  @Input() readOnly: boolean;
  @Input() listaCertificazioniAttestazioni: Decodifica[] = [];
  @Input() listaRegioni: any[] = [];
  @Output() sapChange = new EventEmitter<SchedaAnagraficoProfessionale>();
  @Output() sezioneChange = new EventEmitter<string>();
  @Output() formazioneProfessEditState = new EventEmitter<boolean>();
  @Output() datiComponenteCurriculareChange = new EventEmitter<DatiComponenteCurriculare>();

  formazioneProfessionale: FormazioneProfessionale;

  msgProvenienteDaFormProf: string;

  get isCorsoProvDaFormProf(): boolean { return !isNullOrUndefined(this.formazioneProfessionale.codice_fp); }

  listaTipoDurataCorso: { key: TipoDurataCorso, value: string }[] = [
    { key: 'O', value: 'Ore' },
    { key: 'G', value: 'Giorni' },
    { key: 'M', value: 'Mesi' },
    { key: 'A', value: 'Anni' }
  ];

  isAggiornamento = false;
  isVisualizza = true;
  updateIndex: number;

  provenienzaFormazione = false;

  FORMAZIONE_PROFESSIONALE = 'CORSI DI FORMAZIONE';

  stage: Stage;

  isDelete = false;
  provincia: string;
  private datiComponenteCurriculare: DatiComponenteCurriculare;
  private messaggioConfermaElimina: string;
  private msgDoppioneTitoloEnte: string;
  listaCertAttest: Decodifica[];

  constructor(
    private readonly pslbasepageService: PslshareService,
    private readonly utilitiesService: UtilitiesService
  ) {
  }

  async ngOnInit() {
    this.sanifySap();
    const [messaggioConfermaElimina, msgProvenienteDaFormProf, msgDoppioneTitoloEnte] = await Promise.all([
      this.utilitiesService.getMessage('ME087'),
      this.utilitiesService.getMessage('ME097'),
      this.utilitiesService.getMessage('ME109')
    ]);

    this.messaggioConfermaElimina = messaggioConfermaElimina;
    this.msgProvenienteDaFormProf = msgProvenienteDaFormProf;
    this.msgDoppioneTitoloEnte = msgDoppioneTitoloEnte;
    this.listaCertificazioniAttestazioni.sort(this.sortDescrizione);
    this.listaCertAttest = this.listaCertificazioniAttestazioni;

    this.datiComponenteCurriculare = {
      numeroRecordOrigine: this.sap.formazione_professionale_corsi.length,
      numeroRecordInseriti: 0,
      numeroRecordAggiornati: 0,
      numeroRecordEliminati: 0
    };
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.formazioneProfessEditState.emit(true);
  }
  private sortDescrizione(a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  }

  /**
   * on changes
   * @param changes SimpleChanges
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.sap.isFirstChange()) {
      this.sanifySap();
    }
  }

  /**
   * Sanifys sap
   */
  private sanifySap() {
    this.sap.formazione_professionale_corsi = this.sap.formazione_professionale_corsi || [];
  }

  /**
   * Determines whether nuovo on
   */
  onNuovo() {
    this.formazioneProfessionale = {
      certificazioni_attestazioni: {},
      regione_sede: {}
    };
    this.provincia = null;
    this.isAggiornamento = false;
    this.isVisualizza = false;
    this.updateIndex = -1;
    this.formazioneProfessEditState.emit(false);
    this.provenienzaFormazione = false;
    this.utilitiesService.scrollTo(FormazioneProfessionaleComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.formazioneProfessionale = null;
    this.stage = null;
    this.formazioneProfessEditState.emit(true);
    this.isVisualizza = true;
    this.utilitiesService.scrollTo(FormazioneProfessionaleComponent.SCROLL_TARGET_TORNA_SU);
  }

  /**
   * Determines whe ther change stage on
   * @param stage Stage
   */
  onChangeStage(stage: Stage) {
    if (stage === 'N') {
      this.formazioneProfessionale.nome_azienda_stage = null;
    }
  }

  /**
   * Determines whether salva on
   *
   */
  async onSalva() {
    if (!isNullOrUndefined(this.formazioneProfessionale.titolo_corso)) {
      this.formazioneProfessionale.titolo_corso = this.formazioneProfessionale.titolo_corso.toUpperCase().trim();
    }
    if (!isNullOrUndefined(this.formazioneProfessionale.ente_erogatore)) {
      this.formazioneProfessionale.ente_erogatore = this.formazioneProfessionale.ente_erogatore.toUpperCase().trim();
    }
    if (!isNullOrUndefined(this.formazioneProfessionale.nome_azienda_stage)) {
      this.formazioneProfessionale.nome_azienda_stage = this.formazioneProfessionale.nome_azienda_stage.toUpperCase().trim();
    }

    if (this.isAggiornamento) {
      this.sap.formazione_professionale_corsi = Object.assign([], this.sap.formazione_professionale_corsi, { [this.updateIndex]: this.formazioneProfessionale });
      this.datiComponenteCurriculare.numeroRecordAggiornati++;
    } else {
      const corsoDaInserire = this.sap.formazione_professionale_corsi.find(el =>
        (el.titolo_corso === this.formazioneProfessionale.titolo_corso &&
          el.ente_erogatore === this.formazioneProfessionale.ente_erogatore));
      if (corsoDaInserire) {
          /* reinserisco l'elemento perchè esiste un doppione*/
          const data: DialogModaleMessage = {
            titolo: this.FORMAZIONE_PROFESSIONALE,
            tipo: TypeDialogMessage.Confirm,
            messaggio: this.msgDoppioneTitoloEnte,
            messaggioAggiuntivo: ""
          };
          return await this.pslbasepageService.richiestaFinestraModale(data);
      }
      this.sap.formazione_professionale_corsi = [
        ...this.sap.formazione_professionale_corsi,
        this.formazioneProfessionale
      ];
      this.datiComponenteCurriculare.numeroRecordInseriti++;
    }
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.sapChange.emit(this.sap);
    this.sezioneChange.emit(SezioniSAP.FORMAZIONE_PROFESSIONALE);
    this.onAnnulla();
    this.formazioneProfessEditState.emit(true);
    this.utilitiesService.scrollTo(FormazioneProfessionaleComponent.SCROLL_TARGET_TORNA_SU);
  }


  /**
   * Determines whether modifica on
   */
  async onModifica() {

    if (this.formazioneProfessionale.codice_fp) {
       const data: DialogModaleMessage = { titolo: this.FORMAZIONE_PROFESSIONALE,
        tipo: TypeDialogMessage.Confirm,
        messaggio: this.msgProvenienteDaFormProf,
        messaggioAggiuntivo: ""
      };
      await this.pslbasepageService.richiestaFinestraModale(data);

    } else {
      this.stage = this.formazioneProfessionale.nome_azienda_stage ? 'S' : 'N';
      this.isVisualizza = false;
      this.formazioneProfessEditState.emit(false);
    }
    this.utilitiesService.scrollTo(FormazioneProfessionaleComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether visualizza on
   * @param formazione FormazioneProfessionale
   */
  onVisualizza(formazione: FormazioneProfessionale) {
    this.formazioneProfessionale = UtilitiesService.clone(formazione);
    this.stage = formazione.nome_azienda_stage ? 'S' : 'N';
    this.isVisualizza = true;
    this.isAggiornamento = true;
    this.updateIndex = this.sap.formazione_professionale_corsi.findIndex(el => el === formazione);
    if (this.formazioneProfessionale.codice_fp) {
      this.provenienzaFormazione = true;
    } else {
      this.provenienzaFormazione = false;
    }
    this.utilitiesService.scrollTo(FormazioneProfessionaleComponent.SCROLL_TARGET);

  }

  /**
   * Determines whether elimina on
   * @param formazione FormazioneProfessionale
   *
   */
  async onElimina(formazione: FormazioneProfessionale) {
    if (this.formazioneProfessionale.codice_fp) {
      const data: DialogModaleMessage = {
        titolo: this.FORMAZIONE_PROFESSIONALE,
        tipo: TypeDialogMessage.Confirm,
        messaggio: this.msgProvenienteDaFormProf,
        messaggioAggiuntivo: ""
      };
       await this.pslbasepageService.richiestaFinestraModale(data);
    } else {
      const data: DialogModaleMessage = {
        titolo: this.FORMAZIONE_PROFESSIONALE,
        tipo: TypeDialogMessage.YesOrNo,
        messaggio: this.messaggioConfermaElimina,
        messaggioAggiuntivo: ""
      };
      const res = await this.pslbasepageService.richiestaFinestraModale(data);
      if (res === 'NO') {
        return;
      }
    }
    this.sap.formazione_professionale_corsi = this.sap.formazione_professionale_corsi.filter((el, idx) => idx !== this.updateIndex);

    this.datiComponenteCurriculare.numeroRecordEliminati++;
    this.datiComponenteCurriculareChange.emit(this.datiComponenteCurriculare);
    this.sapChange.emit(this.sap);
    this.sezioneChange.emit(SezioniSAP.FORMAZIONE_PROFESSIONALE);
    this.onAnnulla();
  }


  /**
   * one then full input
    */
  ifOneThenFullInput(c: AbstractControl): ValidationErrors {

    const value = c.value;
    const durataCorso = value && value.durataCorso;
    const tipoDurata = value && value.tipoDurata;

    if ((durataCorso && tipoDurata) || (!durataCorso && !tipoDurata)) {
      return null;
    }
    return { 'tuttiONessuno': 'I campi Tipo Durata e Durata Corso vanno compilati obbligatoriamente entrambi.' };

  }


}
