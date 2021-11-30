import { AfterContentChecked, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { EsitoRiepilogoCollocamentoMirato, RedditoCollocamentoMirato, TipoContratto } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '../../../../pslshare.service';
import { DialogModaleMessage, EsitoControlloValore, TypeDialogMessage } from '@pslwcl/pslmodel';
import { AppUserService, CommonPslpService, ParametriSistemaService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328


import * as moment from 'moment';
import { isNullOrUndefined } from 'util';
import { NgForm } from '@angular/forms';

type WindowState = 'I' | 'U' | 'V';

const REDDITO_COLLOCAMENTO_MIRATO = 'reddito collocamento mirato';
const REDDITO_MASSIMO = 'Reddito massimo';
const TITOLO_FINESTRA = 'Dichiarazione Reddito';
const REDDITO_MAX_DA_SILP = '999999.99';
@Component({
  selector: 'pslshare-dettaglio-reddito',
  templateUrl: './dettaglio-reddito.component.html',
  styleUrls: ['./dettaglio-reddito.component.css']
})
export class DettaglioRedditoComponent implements OnInit, AfterContentChecked {

  static readonly SCROLL_TARGET = 'em[data-scroll-marker="dettaglioReddito"]';

  @ViewChild('dettaglioRedditoForm', { static: false }) dettaglioRedditoForm: NgForm;
  @Input() riepilogo: EsitoRiepilogoCollocamentoMirato;
  @Input() redditoSelezionato: RedditoCollocamentoMirato;
  @Input() readOnly: boolean;
  @Input() statoMaschera: WindowState;
  @Input() indiceSelezionato: number;

  // serve per capire se il componente è richiamato in richiesta iscrizione
  @Input() isRichiestaIscrizione: boolean;

  @Output() annullaDettaglio: EventEmitter<void> = new EventEmitter();
  @Output() flagChanging: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() formChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() formValid: EventEmitter<boolean> = new EventEmitter<boolean>();

  isMsgAvviso = false;
  ilMsgDiAvviso: string;

  changed = false;
  valid = false;

  private readonly now: moment.Moment;
  private msgValoreImportoSuperato: string;
  private maxRedditoCollMirato: string;
  private msgRedditoInsOk: string;
  private msgRedditoInsSparito: string;

  dettaglioChanging: boolean;
  annoDaData: string;
  annoDichiarazione: string;
  dataOdierna: Date;

  listaTipoContrattoValidiADataInizioRapporto: TipoContratto[] = [];
  valoreEconomicoStr: string;
  cpi: string;
  idUtente: number;

  get isVisualizationState(): boolean { return this.statoMaschera === 'V'; }
  get isModifyState(): boolean { return this.statoMaschera === 'U'; }
  get isInsertState(): boolean { return this.statoMaschera === 'I'; }
  get isEditingState(): boolean { return this.isInsertState || this.isModifyState; }
  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly appUserService: AppUserService,
    private readonly pslshareService: PslshareService,
    private readonly parametriSistemaService: ParametriSistemaService
  ) { }

  ngAfterContentChecked(): void {

    if (this.dettaglioRedditoForm) {
       if (this.dettaglioRedditoForm.dirty && !this.changed) {
          this.changed = true;
          this.formChangedEmit();
       }
       if (isNullOrUndefined(this.valid)
           || (this.dettaglioRedditoForm.valid && !this.valid)
           || (this.dettaglioRedditoForm.invalid && this.valid)) {
            this.valid = this.dettaglioRedditoForm.valid;
            this.formValidEmit(this.valid);
       }
    }
  }

  async ngOnInit() {
    const [msgValoreImportoSuperato, msgRedditoInsOk, msgRedditoInsSparito
    ] = await Promise.all([
      this.utilitiesService.getMessage('ME120'),
      this.utilitiesService.getMessage('ME124'),
      this.utilitiesService.getMessage('ME130')
    ]);
    this.msgRedditoInsOk = msgRedditoInsOk;
    this.msgRedditoInsSparito = msgRedditoInsSparito;
    this.msgValoreImportoSuperato = msgValoreImportoSuperato;
    this.maxRedditoCollMirato = await this.parametriSistemaService.maxRedditoCollMirato;
    this.utilitiesService.showSpinner();
    this.idUtente = this.appUserService.getIdUtente();
    if (isNullOrUndefined(this.redditoSelezionato.dataInserimento)) {
      this.annoDaData = '' + (this.redditoSelezionato.anno + 1);
    } else {
      this.annoDaData = moment(this.redditoSelezionato.dataInserimento).format('YYYY');
    }
    this.annoDichiarazione = '' + (this.redditoSelezionato.anno);
    if (isNullOrUndefined(this.redditoSelezionato.provincia)) {
      if (!isNullOrUndefined(this.riepilogo.iscrizioneDisabili) && !isNullOrUndefined(this.riepilogo.iscrizioneDisabili.provincia)
        && (!this.riepilogo.iscrizioneDisabili.statoFinale)) {
        this.redditoSelezionato.provincia = this.riepilogo.iscrizioneDisabili.provincia;
      } else if (!isNullOrUndefined(this.riepilogo.iscrizioneAltreCategorie) && !isNullOrUndefined(this.riepilogo.iscrizioneAltreCategorie.provincia)
        && (!this.riepilogo.iscrizioneAltreCategorie.statoFinale)) {
        this.redditoSelezionato.provincia = this.riepilogo.iscrizioneAltreCategorie.provincia;
      }
    }
    this.cpi = isNullOrUndefined(this.redditoSelezionato.cpi) ? '' : this.redditoSelezionato.cpi.descrizione;
    if (this.redditoSelezionato.valore === REDDITO_MAX_DA_SILP) {
      this.valoreEconomicoStr = REDDITO_MASSIMO;
    } else {
      this.valoreEconomicoStr = this.redditoSelezionato.valore;
    }

    this.utilitiesService.hideSpinner();
    if (this.statoMaschera === 'U' || this.statoMaschera === 'I') {
      this.dettaglioChanging = true;
      this.flagChangingEmit();
    }
  }

  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.statoMaschera = 'V';
    this.redditoSelezionato = null;
    this.dettaglioChanging = false;
    this.flagChangingEmit();
    this.annullaDettaglio.emit();
  }

  /**
   * Determines whether salva on
   *
   */
  async onSalva() {
    if (this.isInsertState) {
      this.upperCaseNoteRedditoSelezionato();
      const controllo: EsitoControlloValore = {
        valore: this.redditoSelezionato.valore,
        maxRedditoCollMirato: this.maxRedditoCollMirato,
        messaggioInput: this.msgValoreImportoSuperato
      };
      const esitoCtl = this.commonFCService.controlloValoreImporto(controllo);
      if (esitoCtl.errore) {
        const data: DialogModaleMessage = {
          titolo: TITOLO_FINESTRA,
          tipo: TypeDialogMessage.Confirm,
          messaggio: esitoCtl.messaggio,
          messaggioAggiuntivo: ""
        };
        return this.pslshareService.richiestaFinestraModale(data);
      }

      this.redditoSelezionato.valore = esitoCtl.valore;

      const annoInCorso = moment().format('YYYY');
      if (!isNullOrUndefined(this.riepilogo.redditi)) {
        const elencoRedditiAnnoInCorso = this.riepilogo.redditi.filter(el => el.anno === (Number(annoInCorso) - 1));
        if (elencoRedditiAnnoInCorso.length === 1) {
          const data: DialogModaleMessage = {
            titolo: TITOLO_FINESTRA,
            tipo: TypeDialogMessage.Confirm,
            messaggio: this.msgRedditoInsSparito,
            messaggioAggiuntivo: ""
          };
          await this.pslshareService.richiestaFinestraModale(data);
        }
      }

      this.setFonteRedditoSelezionato();
      this.utilitiesService.showSpinner();
      const esito = await this.commonFCService.saveCollocamentoMirato(this.idUtente, this.redditoSelezionato);
      if (!isNullOrUndefined(esito) && !isNullOrUndefined(esito.messaggio_errore)) {
        this.utilitiesService.showToastrErrorMessage(esito.messaggio_errore, REDDITO_COLLOCAMENTO_MIRATO);
        this.utilitiesService.hideSpinner();
      } else {
        const riepilogo = await this.commonFCService.getCollocamentoMirato(this.appUserService.getIdUtente());
        this.riepilogo.redditi = riepilogo.redditi;
        this.utilitiesService.hideSpinner();
        this.utilitiesService.showToastrInfoMessage(this.msgRedditoInsOk, REDDITO_COLLOCAMENTO_MIRATO);
        this.flagChanging.emit(false);
        this.onAnnulla();
      }
    }
  }

  /**
   * Sets fonte reddito selezionato
   */
  private setFonteRedditoSelezionato() {
    if (!isNullOrUndefined(this.redditoSelezionato)) {
      this.redditoSelezionato.fonte = 'PSLP';
    }
  }

  /**
   * Uppers case note reddito selezionato
   */
  private upperCaseNoteRedditoSelezionato() {
    if (!isNullOrUndefined(this.redditoSelezionato.note)) {
      this.redditoSelezionato.note = this.redditoSelezionato.note.toUpperCase();
    }
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
    * Form changed emit - informa il componente padre che i dati sono cambiati
    */
    private formChangedEmit() {
       this.formChanged.emit(true);
    }

   /**
    * Form valid emit - informa il componente padre se il form è validato o meno
    */
    private formValidEmit(flg: boolean) {
      this.formValid.emit(flg);
   }
}
