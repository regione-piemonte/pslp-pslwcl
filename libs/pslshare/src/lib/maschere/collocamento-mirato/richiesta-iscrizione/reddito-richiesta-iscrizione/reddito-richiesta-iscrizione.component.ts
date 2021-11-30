import { AfterContentChecked, AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CentroPerImpiego, DettaglioRichiestaIscrizioneL68, RedditoCollocamentoMirato, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, EsitoControlloValore, NavigationEmitter, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel';
import { AppUserService, CommonPslpService, ParametriSistemaService, UtilitiesService } from '@pslwcl/pslservice';
import * as moment from 'moment';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';
import { PslshareService } from '../../../../pslshare.service';

declare var $: any;

type WindowState = 'I' | 'U' | 'V';
@Component({
  selector: 'pslshare-reddito-richiesta-iscrizione',
  templateUrl: './reddito-richiesta-iscrizione.component.html',
})

export class RedditoRichiestaIscrizioneComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentChecked {

  isRichiestaIscrizione = true;
  loaded = false;
  private loaded$: Subject<boolean> = new BehaviorSubject(false);
  readOnly: boolean;
  dataChanged = false;
  formValid = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  private readonly subscriptions: Subscription[] = [];
  messaggioErroreDati: string;
  titoloPagina = 'Richiesta per il Collocamento Mirato';
  urlUscita: string;
  prevButtonName = 'INDIETRO';
  statoMaschera: WindowState = 'I';
  now = moment(new Date()).startOf('day');
  year = moment().format('YYYY');
  year1 = moment().subtract(1, 'years').format('YYYY');

  msgMI029: string;
  provinciaDomicilioOriginal: string;
  msgCambioDomicilio: string;
  private messaggioErroreProvincia: string;
  richiestaIscrizione: DettaglioRichiestaIscrizioneL68;
  redditoSelezionato: RedditoCollocamentoMirato;
  indiceSelezionato = -1;
  private maxRedditoCollMirato: string;
  private msgValoreImportoSuperato: string;
  flagValidForm: boolean;
  messaggioUtente: string;
  isOperatore = false;
  idUtente: number;


  constructor(
    private readonly pslshareService: PslshareService,
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly changeDedectionRef: ChangeDetectorRef,
    private readonly commonPslpService: CommonPslpService,
    private readonly appUserService: AppUserService,
    private readonly parametriSistemaService: ParametriSistemaService
  ) { }

  async ngOnInit() {

    const msgValoreImportoSuperato = await this.utilitiesService.getMessage('ME120');
    const msgMI029 = await this.utilitiesService.getMessage("MI029");
    const messaggioUtente = await this.utilitiesService.getMessage("HC073");
    this.messaggioUtente = messaggioUtente;
    this.msgMI029 = msgMI029;
    this.msgValoreImportoSuperato = msgValoreImportoSuperato;

    const operatore = this.appUserService.getOperatore();
    if (!isNullOrUndefined(operatore)) {
      this.isOperatore = true;
    }
    this.idUtente = this.appUserService.getIdUtente();

    this.readOnly = this.commonPslpService.readOnlyCM;
    this.sap = await this.commonPslpService.getSap$();
    this.richiestaIscrizione = await this.commonPslpService.getDettaglioIscrizioneL68$();
    if (this.readOnly) {
      this.statoMaschera = 'V';
    } else {
      this.statoMaschera = 'I';
    }

    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    const annoDichiarazione = this.year1;

    let centro: CentroPerImpiego = {};
    let redditoSelezionato: RedditoCollocamentoMirato = {};
    if (this.richiestaIscrizione.id_cpi) {
      centro = await this.utilitiesService.getCpiPerId(this.richiestaIscrizione.id_cpi);

    }
    if (this.richiestaIscrizione) {

      const strImporto = isNullOrUndefined(this.richiestaIscrizione.importo_reddito) ? '' : this.richiestaIscrizione.importo_reddito;

      redditoSelezionato = {
        dataInserimento: this.now.toDate(),
        anno: parseInt(annoDichiarazione, 10),
        fonte: 'PSLP',
        cpi: {
          descrizione: centro ? centro.descrizione : ""
        },
        provincia: {
          descrizione: ""
        },
        valore: strImporto,
        note: this.richiestaIscrizione.note_reddito,
      };
    }
    this.redditoSelezionato = redditoSelezionato;
    this.maxRedditoCollMirato = await this.parametriSistemaService.maxRedditoCollMirato;
    this.loaded = true;
    this.loaded$.next(true);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  isValidData(): boolean {
    const valido = !this.flagChanging
      && this.redditoSelezionato
      && (this.commonPslpService.wizard || this.dataChanged);
    return valido;
  }
  /**
    * Determines whether exit page on
    * @param nav NavigationEmitter
    *
    */
  async onExitPage(nav: NavigationEmitter) {
    if (this.isIndietroOrUscita(nav)) {

      const res = await this.pslshareService.richiestaFinestraModale(this.commonPslpService.modaleIndietroCOMI(this.titoloPagina));
      if (res === 'NO') {
        return;
      }
    } else if (this.isAvantiOrSalva(nav)) {
      const controllo: EsitoControlloValore = {
        valore: this.redditoSelezionato.valore,
        maxRedditoCollMirato: this.maxRedditoCollMirato,
        messaggioInput: this.msgValoreImportoSuperato
      };
      const esitoCtl = this.commonPslpService.controlloValoreImporto(controllo);
      if (esitoCtl.errore) {
        const data: DialogModaleMessage = {
          titolo: this.titoloPagina,
          tipo: TypeDialogMessage.Confirm,
          messaggio: esitoCtl.messaggio,
          messaggioAggiuntivo: ""
        };
        return this.pslshareService.richiestaFinestraModale(data);
      }
      this.redditoSelezionato.valore = esitoCtl.valore;

        this.utilitiesService.showSpinner();

        this.richiestaIscrizione.importo_reddito = this.redditoSelezionato.valore;
        this.richiestaIscrizione.note_reddito = this.redditoSelezionato.note ? this.redditoSelezionato.note.toUpperCase() : '';
        this.richiestaIscrizione.anno_reddito = this.redditoSelezionato.anno;
        this.richiestaIscrizione.tipo_operazione = "A";
        const esito = await this.commonPslpService.saveRichiestaIscrizione(this.idUtente, this.richiestaIscrizione, '3');
        if (esito.esitoPositivo) {
          this.commonPslpService.setRichiestaIscrizioneStorage(esito.richiesta);
          this.utilitiesService.hideSpinner();
          this.utilitiesService.showToastrInfoMessage('salvataggio effettuato', 'richiesta Iscrizione');
        } else {
          this.utilitiesService.hideSpinner();
          return this.pslshareService.apriModale(esito.messaggioCittadino, "", this.titoloPagina, TypeDialogMessage.Confirm);
        }

    }
    const urlUscita = nav.url;
    this.router.navigateByUrl(urlUscita);
  }
  /**
     * Determines whether indietro or uscita is
     * @param nav NavigationEmitter
     * @returns booelan
     */
  private isIndietroOrUscita(nav: NavigationEmitter) {
    return ((nav.exit === TypeExit.Back || nav.exit === TypeExit.Prev)
      && (this.dataChanged))
      || (nav.exit === TypeExit.Wizard && this.dataChanged);
  }

  /**
     * Determines whether avanti or salva is
     * @param nav NavigationEmitter
     * @returns boolean
     */
  private isAvantiOrSalva(nav: NavigationEmitter) {
    return (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) && this.dataChanged;
  }







  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
  }

  /**
   * Determines whether data change on
   * @param value boolean
   */
  onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'SALVA & PROSEGUI';
  }

  /**
   * Determines whether flag changing on
   * @param value boolean
   */
  onFlagChanging(value: boolean) {
    this.flagChanging = value;
  }
  /**
   * recupera dal form del figlio informazione se i dati sono cambiati
   * @param flg boolean
   */
   onFormRedditoChanged(flg: boolean) {
    this.dataChanged = flg;
  }

  /**
   * recupera dal form del figlio informazione se i dati sono cambiati
   * @param flg boolean
   */
   onFormRedditoValid(flg: boolean) {
    this.formValid = flg;
  }

  /**
   * after content checked
   */
   ngAfterContentChecked(): void {
    this.changeDedectionRef.detectChanges();
  }
  /**
   * after view init
   */
   ngAfterViewInit() {
    this.changeDedectionRef.detectChanges();
  }
}
