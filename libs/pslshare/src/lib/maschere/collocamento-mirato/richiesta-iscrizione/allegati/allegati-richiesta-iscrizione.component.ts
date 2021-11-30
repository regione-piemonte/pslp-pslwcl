import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BusinessService, DettaglioRichiestaIscrizioneL68, Documento, SchedaAnagraficoProfessionale, TipoDocumento } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, fileType, FileTypeResult, NavigationEmitter, StatoDocumento, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel';
import { AppUserService, CommonPslpService, LogService, UtilitiesService } from '@pslwcl/pslservice';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { PslshareService } from '../../../../pslshare.service';

declare const $: any;
const DOC_NON_PRESENTE = 'Documento non presente';

@Component({
  selector: 'pslshare-allegati-richiesta-iscrizione',
  templateUrl: './allegati-richiesta-iscrizione.component.html'
})
export class AllegatiRichiestaIscrizioneComponent implements OnInit, OnDestroy {
  @Output() loaded = new EventEmitter();
  @Output() valid: EventEmitter<boolean> = new EventEmitter();

  showAggiungiAllegato = false;
  idUtente: number;

  readOnly: false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  private readonly subscriptions: Subscription[] = [];
  messaggioErroreDati: string;
  titoloPagina = 'Dati Anagrafici';
  urlUscita: string;
  prevButtonName = 'INDIETRO';
  dataChanged: boolean;

  provinciaDomicilioOriginal: string;
  msgCambioDomicilio: string;

  // Allegati
  messaggioHelp: string;
  tipoDocumento: TipoDocumento;
  listaAllTipiDocumento: TipoDocumento[] = [];
  listaTipiDocumentoValidi: TipoDocumento[] = [];
  msgObbligatoriNonInseriti: string;

  listaDocObbligatori: TipoDocumento[] = [];
  listaDoc: Documento[] = [];

  userMessage: string;
  documentoInviare: Documento;
  documentoCancellare: Documento;
  flgRichiestaInvio: boolean;
  titoloRichiesta: string;
  questioneRichiesta: string;
  msgRichiesta: string;
  flgRichiestaCanc: boolean;
  noteDelCittadino: string;
  richiestaSalvata: DettaglioRichiestaIscrizioneL68;

  constructor(
    private readonly pslshareService: PslshareService,
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly route: ActivatedRoute,
    private readonly logService: LogService,
    private readonly commonPslpService: CommonPslpService,
    private readonly appUserService: AppUserService,
    private readonly businessService: BusinessService
  ) {}

  async ngOnInit() {
    /** ATTENZIONE.....
     * IN BASE AL TIPO DI RICHIESTA CHE VIENE FATTA NELLE PAGINE PRECEDENTI
     * BISOGNERA' CARICARE IL TIPO DI DOCUMENTI CORRISPONDENTE ALL'AMBITO
     * DELLA RICHIESTA
     * OSSIA:
     * SE LA RICHIESTA E' DI TIPO CATEGORIA PROTETTA BISOGNERA' IMPOSTARE AMBITO = CMPRO
     * SE LA RICHIESTA E' DI TIPO DISABILI BISOGNERA' IMPOSTARE AMBITO = CMDIS
     * E CARICARE I DOCUMENTI CORRISPONDENTI
     */
    this.dataChanged = false;

    this.subscriptions.push(
      this.route.data.subscribe(data => (this.sap = data.sap))
    );

    this.idUtente = this.appUserService.getIdUtente();

    const [
      alltipiDocumentoCategoriaProtetta,
      alltipiDocumentoDisabili,
      tipiDocumentoValidiCategoriaProtetta,
      tipiDocumentoValidiDisabili,
      messaggioHelp,
      noDocMessage,
      sap,
      richiestaSalvata,
      msgObbligatoriNonInseriti
    ] = await Promise.all([
      this.businessService
        .findAllTipiDocumenti(Ambito.CMPRO)
        .pipe(catchError(e => of([] as TipoDocumento[])))
        .toPromise(),
      this.businessService
        .findAllTipiDocumenti(Ambito.CMDIS)
        .pipe(catchError(e => of([] as TipoDocumento[])))
        .toPromise(),
      this.businessService
        .findTipiDocumenti(Ambito.CMPRO)
        .pipe(catchError(e => of([] as TipoDocumento[])))
        .toPromise(),
      this.businessService
        .findTipiDocumenti(Ambito.CMDIS)
        .pipe(catchError(e => of([] as TipoDocumento[])))
        .toPromise(),
      this.utilitiesService.getMessage('HC041'),
      this.utilitiesService.getMessage('MI052'),
      this.commonPslpService.getSap$(),
      this.commonPslpService.getDettaglioIscrizioneL68$(this.idUtente),
      this.utilitiesService.getMessage('ME171')
    ]);

    this.msgObbligatoriNonInseriti = msgObbligatoriNonInseriti;
    if (richiestaSalvata.cod_tipo_iscrizione === 'D') {
      this.commonPslpService.AMBITO = Ambito.CMDIS;
      if (alltipiDocumentoDisabili.length < 1) {
        this.userMessage = noDocMessage;
      }
      this.listaAllTipiDocumento = alltipiDocumentoDisabili;
      this.listaTipiDocumentoValidi = tipiDocumentoValidiDisabili;
    } else {
      this.commonPslpService.AMBITO = Ambito.CMPRO;
      if (alltipiDocumentoCategoriaProtetta.length < 1) {
        this.userMessage = noDocMessage;
      }
      this.listaAllTipiDocumento = alltipiDocumentoCategoriaProtetta;
      this.listaTipiDocumentoValidi = tipiDocumentoValidiCategoriaProtetta;
    }
    this.listaDocObbligatori = this.listaTipiDocumentoValidi.filter(
      ildoc => ildoc.flg_obbligatorio === 'S'
    );

    this.messaggioHelp = messaggioHelp;
    this.sap = sap;
    this.richiestaSalvata = richiestaSalvata;
    this.nextButtonName =
      this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    // this.listaDoc = await this.loadDocumenti();
    this.listaDoc = await this.utilitiesService.loadDocumenti(
      this.appUserService.getIdUtente(),
      this.richiestaSalvata.richiesta_iscrizione_header.id_richiesta,
      this.commonPslpService.getAmbito()
    );
    if (
      !isNullOrUndefined(this.richiestaSalvata) &&
      !isNullOrUndefined(this.richiestaSalvata.note)
    ) {
      this.noteDelCittadino = this.richiestaSalvata.note;
    } else {
      this.noteDelCittadino = '';
    }
    this.tipoDocumento = null;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  isValidData(): boolean {
    return (
      !this.flagChanging &&
      this.sap &&
      (this.commonPslpService.wizard || this.dataChanged)
    );
  }
  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   *
   */
  async onExitPage(nav: NavigationEmitter) {
    const urlUscita = nav.url;
    if (this.isIndietroOrUscita(nav)) {
      /** Se torna indietro bisogna ricaricare la richiesta da servizio  */

      const res = await this.pslshareService.richiestaFinestraModale(
        this.commonPslpService.modaleIndietroCOMI(this.titoloPagina)
      );
      if (res === 'NO') {
        return;
      }
    } else if (this.isAvantiOrSalva(nav)) {
      this.assegnaDocumentiAllaRichiesta();

      /** Bisogna controllar che siano stati inseriti tutti i documenti che risultano obbligatori  */
      if (this.controlliObbligatori()) {
        this.utilitiesService.showSpinner();
        const esito = await this.salvataggioRichiestaConDocumenti();
        this.commonPslpService.setRichiestaIscrizioneStorage(this.richiestaSalvata);

        /*
         *  controllare esito
         */
        if (esito.esitoPositivo) {
          this.utilitiesService.hideSpinner();
          this.utilitiesService.showToastrInfoMessage('salvataggio effettuato', 'Gestione Allegati');
        } else {
          this.utilitiesService.hideSpinner();
          return this.pslshareService.apriModale(esito.messaggioCittadino,
            '', this.titoloPagina, TypeDialogMessage.Confirm
          );
        }
      } else {
        return this.pslshareService.apriModale(this.msgObbligatoriNonInseriti, '', this.titoloPagina, TypeDialogMessage.Confirm);
      }
    } else if (this.isAvantiSenzaModifiche(nav)) {
      this.assegnaDocumentiAllaRichiesta();

      /** Bisogna controllar che siano stati inseriti tutti i documenti che risultano obbligatori  */

      if (this.controlliObbligatori()) {
        this.utilitiesService.showSpinner();
        const esito = await this.salvataggioRichiestaConDocumenti();
        this.commonPslpService.setRichiestaIscrizioneStorage(this.richiestaSalvata);

      } else {
        return this.pslshareService.apriModale(this.msgObbligatoriNonInseriti, '', this.titoloPagina, TypeDialogMessage.Confirm);
      }
    }
    this.router.navigateByUrl(urlUscita);
  }

  private controlliObbligatori() {
    let docObbligatoriInseriti = false;
    this.listaDocObbligatori.forEach(elementDocObbligatori => {
      this.listaDoc.forEach(elementDocInseriti => {
        if (
          elementDocObbligatori.codice ===
          elementDocInseriti.codice_tipo_documento
        ) {
          docObbligatoriInseriti = true;
        }
      });
    });
    return docObbligatoriInseriti;
  }

  private async salvataggioRichiestaConDocumenti() {
    if (!isNullOrUndefined(this.noteDelCittadino)) {
      this.richiestaSalvata.note = this.noteDelCittadino.toUpperCase();
    }
    this.richiestaSalvata.tipo_operazione = "A";
    return this.commonPslpService.saveRichiestaIscrizione(
      this.idUtente,
      this.richiestaSalvata,
      '5'
    );
  }

  /**
   * Assegnas documenti alla richiesta
   */
  private assegnaDocumentiAllaRichiesta() {
    if (!isNullOrUndefined(this.richiestaSalvata)) {
      this.richiestaSalvata.elenco_allegati = this.listaDoc;
    }
  }

  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
  }

  /**
   * Determines whether flag changing on
   * @param value boolean
   */
  onFlagChanging(value: boolean) {
    this.flagChanging = value;
  }

  /**
   * Determines whether elimina documento on
   */
  onEliminaDocumento(documento: Documento) {
    this.documentoCancellare = documento;
    this.flgRichiestaInvio = false;
    this.flgRichiestaCanc = true;
    this.titoloRichiesta = 'Eliminazione Documento';
    this.questioneRichiesta = 'Si desidera eliminare il documento allegato ?';
    this.msgRichiesta =
      ' file:' + documento.codice_estensione + ' nome:' + documento.nome;
    $('#modal_richiesta').modal({ backdrop: 'static', keyboard: false });
  }

  /**
   * Opens documento
   * @param documento Documento
   */
  async openDocumento(documento: Documento) {
    this.utilitiesService.showSpinner();
    try {
      const doc: Documento = await this.businessService
        .loadDocumento(documento.id)
        .pipe(
          catchError(err => {
            throw new Error(DOC_NON_PRESENTE);
          })
        )
        .toPromise();
      if (!doc.pdf || doc.pdf.length === 0) {
        throw new Error(DOC_NON_PRESENTE);
      }
      const arrayBuffer = this.base64ToArrayBuffer(doc.pdf);
      const type: FileTypeResult = fileType(arrayBuffer);

      this.utilitiesService.downloadBase64File(doc.pdf, type.mime, doc.nome);
    } catch (e) {
      this.logService.error(e);
      this.utilitiesService.showToastrErrorMessage(
        'Lettura allegato fallita.',
        e.message
      );
    }
    this.utilitiesService.hideSpinner();
  }
  /**
   * Base64s to array buffer
   *
   */
  private base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Gets tipo documento descrizione
   * @param cod string
   * @returns descrizione
   */
  getTipoDocumentoDescrizione(cod: string) {
    let descr = '';
    if (this.listaAllTipiDocumento.length > 0) {
      const tipoDocumento = this.listaAllTipiDocumento.find(
        td => td.codice === cod
      );
      descr = tipoDocumento.descrizione;
      return descr;
    } else {
      return null;
    }
  }

  /**
   * Annulla  allegato
   */
  annullaAllegato() {
    this.tipoDocumento = null;
    this.showAggiungiAllegato = false;
  }
  /**
   * Success allegato
   */
  async successAllegato() {
    /** A questo punto bisogna comunque salvare la richiesta su silp per corrispondenza allegati */
    this.listaDoc = await this.utilitiesService.loadDocumenti(
      this.appUserService.getIdUtente(),
      this.richiestaSalvata.richiesta_iscrizione_header.id_richiesta,
      this.commonPslpService.getAmbito()
    );
    this.assegnaDocumentiAllaRichiesta();
    const esito = await this.salvataggioRichiestaConDocumenti();
    this.commonPslpService.setRichiestaIscrizioneStorage(this.richiestaSalvata);
    this.dataChanged = true;
    this.showAggiungiAllegato = false;
    this.ngOnInit();
  }

  /**
   * Determina se visualizzare la finestrella richiesta allegato
   */
  onAggiungiAllegato() {
    this.showAggiungiAllegato = !this.showAggiungiAllegato;
  }

  /**
   * Gets stato descrizione
   * @param stato codice string
   * @returns descrizione
   */
  getStatoDescrizione(stato: string) {
    return StatoDocumento.getByCodice(stato).descrizione;
  }

  /**
   * Do richiesta
   */
  doRichiesta() {
    if (this.flgRichiestaCanc) {
      this.doEliminaDocumento(this.documentoCancellare);
      this.dataChanged = true;
    }
  }
  /**
   * Do elimina documento
   *  documento
   * @returns elimina documento
   */
  async doEliminaDocumento(documento: Documento): Promise<void> {
    this.utilitiesService.showSpinner();

    const risultatoCancellazione = await this.utilitiesService.deleteDocumenti(
      documento.id
    );
    if (risultatoCancellazione) {
      this.logService.log('documento cancellato');
    }
    // await this.businessService.deleteDocumento(documento.id).pipe(
    //   catchError(err => of(null))
    // ).toPromise();

    /** A questo punto bisogna comunque salvare la richiesta su silp per avere una corrispondenza sugli allegati */
    this.listaDoc = await this.utilitiesService.loadDocumenti(
      this.appUserService.getIdUtente(),
      this.richiestaSalvata.richiesta_iscrizione_header.id_richiesta,
      this.commonPslpService.getAmbito()
    );
    this.assegnaDocumentiAllaRichiesta();
    const esito = await this.salvataggioRichiestaConDocumenti();
    this.commonPslpService.setRichiestaIscrizioneStorage(this.richiestaSalvata);

    this.utilitiesService.hideSpinner();
  }

  /**
   * Determines whether indietro or uscita is
   * @param nav NavigationEmitter
   * @returns booelan
   */
  private isIndietroOrUscita(nav: NavigationEmitter) {
    return (
      ((nav.exit === TypeExit.Back || nav.exit === TypeExit.Prev) &&
        this.dataChanged) ||
      (nav.exit === TypeExit.Wizard && this.dataChanged)
    );
  }

  private isAvantiOrSalva(nav: NavigationEmitter) {
    return (
      (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) &&
      this.dataChanged
    );
  }

  /**
   * Determina se avanti o  salva  ma i dati non sono modificati
   * @param nav NavigationEmitter
   * @returns boolean
   */
  private isAvantiSenzaModifiche(nav: NavigationEmitter) {
    return (
      (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) &&
      !this.dataChanged
    );
  }
  /**
   * Do uscita
   */
  doUscita() {
    if (this.urlUscita.startsWith('/fascicolo-')) {
      this.commonPslpService.restoreStorageFascicolo();
    } else {
      this.commonPslpService.azzeraStorageFascicolo();
    }
    this.router.navigateByUrl(this.urlUscita);
  }
}
