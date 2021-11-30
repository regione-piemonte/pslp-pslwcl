import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BusinessService, Documento, EsitoDettaglioDid, SchedaAnagraficoProfessionale, StampeService, TipoDocumento, Utente } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

import { Ambito, DialogModaleMessage, fileType, FileTypeResult, StatoDocumento, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, ParametriSistemaService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PslshareService } from '../../pslshare.service';


declare const $: any;
const TITOLO_DID = 'Dichiarazione di Immediata Disponibilità al lavoro';

const DOC_NON_PRESENTE = 'Documento non presente';
@Component({
  selector: 'pslshare-allegati-patto',
  templateUrl: './allegati-patto.component.html'
})
export class AllegatiPattoComponent implements OnInit {

  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="aggiungiAllegato"]';

  @Output() dataChanged: EventEmitter<void> = new EventEmitter();
  @Output() loaded = new EventEmitter();
  @Output() valid: EventEmitter<boolean> = new EventEmitter();

  flagNuovoAllegato = true;
  flagListaAllegati = false;
  showAggiungiAllegato = false;
  readOnly: boolean;
  popdown: boolean;

  messaggioHelp: string;
  tipoDocumento: TipoDocumento;

  listaAllTipiDocumento: TipoDocumento[] = [];
  listaTipiDocumentoValidi: TipoDocumento[] = [];
  listaPatti: Documento[] = [];
  userMessage: string;
  documentoInviare: Documento;
  documentoCancellare: Documento;
  flgRichiestaInvio: boolean;
  titoloRichiesta: string;
  questioneRichiesta: string;
  msgRichiesta: string;
  flgRichiestaCanc: boolean;
  did: EsitoDettaglioDid = {};
  utente: Utente;
  titolo: string;
  sottotitolo: string;

  constructor(
    private readonly businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService,
    private readonly stampeService: StampeService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly commonFCService: CommonPslpService,
    private readonly pslbasepageService: PslshareService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();

    this.popdown = false;
    this.utente = this.appUserService.getUtente();
    const sap = await this.commonFCService.getSap$(this.utente.id_utente);

    this.did = await this.commonPslpService.ricercaDettaglioDIDService(this.utente.id_utente);
    this.readOnly = this.isReadOnly(sap);
    const [alltipiDocumento, tipiDocumentoValidi, messaggioHelp, noDocMessage] = await Promise.all([
      this.businessService.findAllTipiDocumenti(Ambito.DID).pipe(
        catchError(e => of([] as TipoDocumento[])))
        .toPromise(),
      this.businessService.findTipiDocumenti(Ambito.DID).pipe(
        catchError(e => of([] as TipoDocumento[])))
        .toPromise(),
      this.utilitiesService.getMessage('HC038'),
      this.utilitiesService.getMessage('MI052')
    ]);
    this.listaAllTipiDocumento = alltipiDocumento;
    if (this.listaAllTipiDocumento.length < 1) {
      this.userMessage = noDocMessage;
    }
    this.listaTipiDocumentoValidi = tipiDocumentoValidi;
    this.messaggioHelp = messaggioHelp;

    await this.loadDocumenti();

    if (this.listaPatti.length > 0) {
      this.setFlagListaAllegati();
    }
    if (this.flagListaAllegati
      || this.controlliDID()
      || this.utilitiesService.isSapDomicilioPiemonte(sap)
      || (sap.residenza.stato.codice_ministeriale !== undefined
        && sap.residenza.stato.codice_ministeriale === 'Z00')
    ) {
      this.userMessage = noDocMessage;
    }
    this.titolo = await this.parametriSistemaService.didTitoloPatto;
    this.sottotitolo = await this.parametriSistemaService.didSottotitoloPatto;
    this.loaded.emit();
    this.valid.emit(true);
    this.utilitiesService.hideSpinner();

  }

  private isReadOnly(sap: SchedaAnagraficoProfessionale): boolean {
   return this.commonFCService.readOnly ||
    !(this.did.cod_ultimo_stato === 'I' || this.did.cod_ultimo_stato === 'C')
    || !this.utilitiesService.isSapDomicilioPiemonte(sap)
    || (sap.residenza.stato.codice_ministeriale !== undefined  && sap.residenza.stato.codice_ministeriale !== 'Z00')
    || this.did.flg_ente_titolarita_piemontese !== 'S';

  }
  private controlliDID(): boolean {
    return this.did.cod_ultimo_stato === 'R'
    || this.did.cod_ultimo_stato === 'S'
    || this.did.cod_ultimo_stato === 'A'
    || this.did.cod_ultimo_stato === 'E'
    || this.did.flg_ente_titolarita_piemontese === 'S'
    || this.did.flg_rifiuto === 'N';
  }

  private setFlagListaAllegati() {
    this.listaPatti.forEach(element => {
      if (element.stato === 'NI' || element.stato === 'IN' || element.stato === 'AC') {
        this.flagListaAllegati = true;
      }
    });
  }

  /**
   * Loads documenti
   */
  async loadDocumenti() {
    const pdf = await this.businessService.findDocumentiPattiServizio(this.utente.id_utente, this.did.id_did, Ambito.DID)
      .pipe(catchError(e => of([] as Documento[])))
      .toPromise();
    pdf.sort((a: Documento, b: Documento) => (a.id - b.id));
    this.listaPatti = pdf;
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
    $('#modal_richiesta').modal({ backdrop: 'static', keyboard: false });

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
    this.msgRichiesta = ' file:' + documento.codice_estensione + ' nome:' + documento.nome;
    $('#modal_richiesta').modal({ backdrop: 'static', keyboard: false });


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
   *  documento
   * @returns elimina documento
   */
  async doEliminaDocumento(documento: Documento): Promise<void> {
    this.utilitiesService.showSpinner();
    await this.businessService.deleteDocumento(documento.id).pipe(
      catchError(err => of(null))
    ).toPromise();
    await this.loadDocumenti();
    this.utilitiesService.hideSpinner();
    this.flagNuovoAllegato = true;
    this.flagListaAllegati = false;
    if (this.listaPatti.length > 0) {
      this.setFlagListaAllegati();
    }

  }
  /**
   * Determines whether aggiungi allegato on
   */
  onAggiungiAllegato() {
    this.showAggiungiAllegato = !this.showAggiungiAllegato;
    this.utilitiesService.scrollTo(AllegatiPattoComponent.SCROLL_TARGET);

  }

  /**
   * Determines whether stampa patto on
   */
  async onStampaPatto() {
    this.utilitiesService.showSpinner();
    try {
      const response = await this.stampeService.creaStampaPattoDiServizio(this.utente.id_utente, this.did.id_did).pipe(
        catchError(err => {
          return throwError(err);
        })
      ).toPromise();
      this.utilitiesService.downloadFileDaStampa(response, 'application/pdf', 'patto_servizio_' + this.utente.codice_fiscale + '.pdf');
    } catch (err) {
      this.utilitiesService.showToastrErrorMessage("Patto di Servizio", await this.utilitiesService.getMessage('ME002'));
      return;
    }
    this.utilitiesService.hideSpinner();
    this.openModalConfirm((await this.utilitiesService.getMessage('MI053')).replace('{0}', this.utente.codice_fiscale));
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
      this.logService.error(e);
      this.utilitiesService.showToastrErrorMessage('Lettura allegato fallita.', e.message);
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
   * Annullas allegato
   */
  annullaAllegato() {
    this.showAggiungiAllegato = false;
  }
  /**
   * Success allegato
   */
  successAllegato() {
    this.showAggiungiAllegato = false;
    this.ngOnInit();
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
   * Gets tipo documento descrizione
   * @param cod string
   * @returns descrizione
   */
  getTipoDocumentoDescrizione(cod: string) {
    let descr = '';
    if (this.listaAllTipiDocumento.length > 0) {
      const tipoDocumento = this.listaAllTipiDocumento.find(td => td.codice === cod);
      descr = tipoDocumento.descrizione;
      return descr;
    } else {
      return null;
    }
  }

  /**
   * Sorts id patto
   *
   */
  private sortIdPatto(a: any, b: any) {
    return a.id.localeCompare(b.id);
  }

  /**
   * Opens modal confirm
   * @param msg string
   *
   */
  async openModalConfirm(msg: string) {
    const data: DialogModaleMessage = {
      titolo: 'Patto di Servizio',
      tipo: TypeDialogMessage.Confirm,
      messaggio: msg,
      messaggioAggiuntivo: ''
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      return;
    }
  }


}
