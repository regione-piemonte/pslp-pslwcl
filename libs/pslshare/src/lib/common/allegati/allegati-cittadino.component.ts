import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BusinessService, Documento, TipoDocumento } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { fileType, FileTypeResult, StatoDocumento } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, LogService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';


declare const $: any;

const DOC_NON_PRESENTE = 'Documento non presente';
@Component({
  selector: 'pslshare-allegati-cittadino',
  templateUrl: './allegati-cittadino.component.html'
})
export class AllegatiCittadinoComponent implements OnInit {
  private static readonly ALLEGATI_SCROLL_TARGET = 'em[data-scroll-marker="allegatiScrollTarget"]';

  @Output() dataChanged: EventEmitter<void> = new EventEmitter();
  @Output() loaded = new EventEmitter();
  @Output() valid: EventEmitter<boolean> = new EventEmitter();

  flagAllegati = false;
  flagNuovoAllegato = false;
  showAggiungiAllegato = false;
  readOnly: boolean;
  popdown: boolean;

  messaggioHelp: string;
  tipoDocumento: TipoDocumento;

  listaTipiDocumento: TipoDocumento[] = [];
  listaDocumenti: Documento[] = [];
  userMessage: string;
  documentoInviare: Documento;
  documentoCancellare: Documento;
  flgRichiestaInvio: boolean;
  titoloRichiesta: string;
  questioneRichiesta: string;
  msgRichiesta: string;
  flgRichiestaCanc: boolean;

  constructor(
    private readonly commonPslpService: CommonPslpService,
    private readonly businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService
  ) { }

  async ngOnInit() {
    this.popdown = false;
    this.readOnly = this.commonPslpService.readOnly;
    const [ tipiDocumento, messaggioHelp, noDocMessage ] = await Promise.all([
      this.businessService.findTipiDocumenti(this.commonPslpService.getAmbito()).pipe(
        catchError(e => of([] as TipoDocumento[])))
      .toPromise(),
      this.utilitiesService.getMessage('HC005'),
      this.utilitiesService.getMessage('MI015')
    ]);
    this.listaTipiDocumento = tipiDocumento;
    this.messaggioHelp = messaggioHelp;

    await this.loadDocumenti();

    this.flagAllegati = this.listaDocumenti.length > 0 || this.listaTipiDocumento.length > 0;
    this.userMessage = noDocMessage;
    this.flagNuovoAllegato = this.listaTipiDocumento.length > 0;
    this.loaded.emit();
    this.valid.emit(true);
  }

  /**
   * Loads documenti
   */
  async loadDocumenti() {
    const docs = await this.businessService.findDocumenti(this.commonPslpService.getUtenteStorage().id_utente, this.commonPslpService.getAmbito())
      .pipe(catchError(e => of([] as Documento[])))
      .toPromise();
    this.listaDocumenti = docs;
  }

  /**
   * Determines whether invia documento on
   * @param documento Documento
   */
  onInviaDocumento(documento: Documento) {
    this.documentoInviare = documento;
    this.flgRichiestaInvio = true;
    this.flgRichiestaCanc = false;
    this.titoloRichiesta = 'Invio Documento';
    this.questioneRichiesta = ' Si desidera inviare il documento allegato ai fini della valutazione per l\'accettazione ?';
    this.msgRichiesta = ' file:' + documento.codice_estensione + ' nome:' + documento.nome;
      $('#modal_richiesta').modal({backdrop: 'static', keyboard: false});

  }

  /**
   * Determines whether elimina documento on
   * @param documento Documento
   */
  onEliminaDocumento(documento: Documento) {
    this.documentoCancellare = documento;
    this.flgRichiestaInvio = false;
    this.flgRichiestaCanc = true;
    this.titoloRichiesta = 'Eliminazione Documento';
    this.questioneRichiesta = 'Si desidera eliminare il documento allegato ?';
    this.msgRichiesta = ' file:' + documento.codice_estensione + ' nome:' + documento.nome;
      $('#modal_richiesta').modal({backdrop: 'static', keyboard: false});

  }

  /**
   * Do richiesta
   */
  doRichiesta() {
    if (this.flgRichiestaInvio) {
       this.doInviaDocumento(this.documentoInviare);
    } else if (this.flgRichiestaCanc) {
      this.doEliminaDocumento(this.documentoCancellare);
   }
  }


  /**
   * Do invia documento
   * @param documento Documento
   * @returns invia documento
   */
  async doInviaDocumento(documento: Documento): Promise<void> {

    this.utilitiesService.showSpinner();
    try {
      if (documento.stato === 'NI') {
          documento.stato = 'IN';

          await this.businessService.saveStatoDocumento(documento).pipe(
          catchError(err => {
              throw new Error(DOC_NON_PRESENTE);
             })
          ).toPromise();
      }
    } catch (e) {
      this.logService.error(e);
      this.utilitiesService.showToastrErrorMessage('invio allegato fallito.', e.message);
    }

    await this.loadDocumenti();
    this.utilitiesService.hideSpinner();
  }

  /**
   * Do elimina documento
   * @param documento Documento
   * @returns elimina documento
   */
  async doEliminaDocumento(documento: Documento): Promise<void> {
    this.utilitiesService.showSpinner();
    await this.businessService.deleteDocumento(documento.id).pipe(
      catchError(err => of(null))
    ).toPromise();
    await this.loadDocumenti();
    this.utilitiesService.hideSpinner();
  }
  /**
   * Determines whether aggiungi allegato on
   */
  onAggiungiAllegato() {
    this.showAggiungiAllegato = !this.showAggiungiAllegato;
  }
  /**
   * Opens documento
   * @param documento Documento
   */
  async openDocumento(documento: Documento) {
    this.utilitiesService.showSpinner();
    try {
      const doc: Documento = await this.businessService.loadDocumento(documento.id).pipe(
        catchError(err => {
          throw new Error(DOC_NON_PRESENTE);
        })
      ).toPromise();
      if (!doc.pdf || doc.pdf.length === 0) {
        throw new Error(DOC_NON_PRESENTE);
      }
      const arrayBuffer = this.base64ToArrayBuffer(doc.pdf);
      const type: FileTypeResult = fileType(arrayBuffer);

      this.utilitiesService.downloadBase64File(doc.pdf, type.mime, doc.nome);
    } catch (e) {
      // Do something?
      // Show toaster?
      this.logService.error(e);
      this.utilitiesService.showToastrErrorMessage('Lettura allegato fallita.', e.message);
    }
    this.utilitiesService.hideSpinner();
  }

  /**
   * Base64s to array buffer
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
   * Annullas allegato
   */
  annullaAllegato() {
    this.showAggiungiAllegato = false;
    this.utilitiesService.scrollTo(AllegatiCittadinoComponent.ALLEGATI_SCROLL_TARGET);
  }
  /**
   * Success allegato
   */
  successAllegato() {
    this.showAggiungiAllegato = false;
    this.utilitiesService.scrollTo(AllegatiCittadinoComponent.ALLEGATI_SCROLL_TARGET);
    this.ngOnInit();
  }

  /**
   * Gets stato descrizione
   * @param stato string
   * @returns descrizione
   */
  getStatoDescrizione(stato: string) {
     return StatoDocumento.getByCodice(stato).descrizione;
  }

  /**
   * Gets tipo documento descrizione
   * @param cod string
   * @returns descrizione
   */
  getTipoDocumentoDescrizione(cod: string) {
     const tipoDocumento = this.listaTipiDocumento.find(td => td.codice === cod);
    return tipoDocumento.descrizione;
   }
}
