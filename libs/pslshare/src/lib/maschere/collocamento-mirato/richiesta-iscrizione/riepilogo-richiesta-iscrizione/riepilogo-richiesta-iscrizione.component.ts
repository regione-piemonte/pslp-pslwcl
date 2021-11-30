import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BusinessService, CategoriaProtettaDisab, ConfigurazioneFamiliariACarico, Decodifica, DettaglioRichiestaIscrizioneL68, Documento, EsitoDettaglioDid, EsitoRiepilogoCollocamentoMirato, IscrizioneCollocamentoMirato, Provincia, SchedaAnagraficoProfessionale, TipoDocumento } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, DialogModaleMessage, fileType, FileTypeResult, NavigationEmitter, StatoDid, StatoDocumento, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel';
import { AppUserService, CommonPslpService, LogService, UrlRouteService, UtilitiesService } from '@pslwcl/pslservice';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { PslshareService } from '../../../../pslshare.service';
import { WindowState } from '../../dati-graduatoria/dati-graduatoria.component';

const DOC_NON_PRESENTE = 'Documento non presente';
const REDDITO_MAX_DA_SILP = '999999.99';
const REDDITO_MASSIMO = "Reddito massimo";
const urlRiepilogo =  '/collocamento-mirato/riepilogo' ;

@Component({
  selector: 'pslshare-riepilogo-richiesta-iscrizione',
  templateUrl: './riepilogo-richiesta-iscrizione.component.html',
})
export class RiepilogoRichiestaIscrizioneComponent implements OnInit, OnDestroy {
  TIPO_ISCRIZIONE_DISABILI = 'D';
  loaded: boolean = false;
  idUtente: number;
  elenco_categoria_invalidita_disabili: Decodifica[];
  configurazioneFamiliariACarico: ConfigurazioneFamiliariACarico;
  riepilogoCOMI: EsitoRiepilogoCollocamentoMirato;
  sap: SchedaAnagraficoProfessionale;
  isVisualizza: boolean = false;
  isVisualizzaDid: boolean = false;
  isRiepilogo: boolean = false;
  isBozza: boolean = false;
  isInviata: boolean = false;
  isVisibileSituazioneRevisione : boolean = false;
  MI056: string = '';
  ME166: string;
  ME167: string;

  // DID
  did: EsitoDettaglioDid;
  didTerminata: string;
  descrUltimoStatoDid: string;

  // RICHIESTA
  richiesta: DettaglioRichiestaIscrizioneL68;
  statoRichiesta: string;
  tipoIscrizione: string;
  categoriaAppartenenza: string;
  tipoComunicazione: string;
  motivoIscrizione: string;
  cpiUltimaIscrizione: string;
  cpiRichiesta: string;
  esitoRichiesta: boolean;
  dataIscrizione: Date;
  statoIscrizione: string;
  importoRedditoRichiesta: string = "n/a";

  // DISABILE
  categoriaInvalidita: string;
  visualizzaCategoriaInvalidita: boolean = false;
  visualizzaGradoInvalidita: boolean = false;
  descrizioneSituazioneRevisione: string = "";

  // ALLEGATI
  listaAllTipiDocumento: TipoDocumento[];
  elencoAllegati: Documento[];
  ambito: string;

  dataChanged = false;
  flagChanging = false;

  messaggioErroreDati: string;
  messaggioUtente: string;

  titoloPagina = 'Dati Anagrafici';
  urlUscita: string;
  prevButtonName = 'INDIETRO';
  statoMaschera: WindowState = 'V';
  isInviaEnabled = false;
  titolo: string;
  HC075: any;
  messaggioConfermaInvio: string;
  today: Date = new Date();


  constructor(
    private readonly pslshareService: PslshareService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly utilitiesService: UtilitiesService,
    private readonly commonPslpService: CommonPslpService,
    private readonly appUserService: AppUserService,
    private readonly businessService: BusinessService,
    private readonly logService: LogService,
    private readonly urlRouteService: UrlRouteService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    const url = this.activatedRoute.snapshot.url[0].path;
    await this.initData();
    if (url.startsWith('visualizza-')) {
      this.commonPslpService.wizard = false;
      this.titolo = "Visualizza Richiesta Iscrizione/Trasferimento Iscrizione";
      this.isVisualizza = true;
    }
    else {
      this.isInviaEnabled = true;
      this.commonPslpService.wizard = true;
      this.titolo = "Riepilogo Richiesta Iscrizione";
      if (this.commonPslpService.isIscritto(this.riepilogoCOMI) && this.utilitiesService.isIscrizioneAttiva(this.riepilogoCOMI)) {
        this.titolo=  this.titolo.concat(": Trasferimento Iscrizione in un'altra Provincia in Piemonte");
      } else {
        this.titolo=  this.titolo.concat(": Iscrizione in Piemonte.");
      }
      // this.prevButtonName = "RITORNA A RIEPILOGO";
      this.isRiepilogo = true;
    }


    if (this.richiesta) {
      const loIndirizzo = this.richiesta.domicilio_trasferimento;
      if (loIndirizzo && loIndirizzo.indirizzo && loIndirizzo.indirizzo.length > 0) {
        this.richiesta.domicilio_trasferimento.indirizzo_esteso = (loIndirizzo.toponimo ? loIndirizzo.toponimo.descrizione : '') + ' ' +
          (loIndirizzo.indirizzo ? loIndirizzo.indirizzo : '') + ' ' + (loIndirizzo.numero_civico ? loIndirizzo.numero_civico : '');
      }

      if (this.richiesta.importo_reddito === REDDITO_MAX_DA_SILP) {
        this.importoRedditoRichiesta = REDDITO_MASSIMO;
      } else if (!isNullOrUndefined(this.richiesta.importo_reddito)) {
        const valoreIn = this.richiesta.importo_reddito.replace(',', '.');
        if (this.isNumber(valoreIn)) {
          this.importoRedditoRichiesta = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(valoreIn));
        } else {
          this.importoRedditoRichiesta = this.richiesta.importo_reddito + " €";
        }
      }

      if (this.richiesta.richiesta_iscrizione_header) {
        if (this.richiesta.richiesta_iscrizione_header.cod_stato_richiesta === 'B') {
          this.isBozza = true;
        } else if (this.richiesta.richiesta_iscrizione_header.cod_stato_richiesta === 'I') {
          this.isInviata = true;
        }
      }

      if (this.richiesta.cod_tipo_iscrizione === 'D') {
        this.commonPslpService.AMBITO = Ambito.CMDIS;
      } else if (this.richiesta.cod_tipo_iscrizione === 'A') {
        this.commonPslpService.AMBITO = Ambito.CMPRO;
      }

    }

    this.elencoAllegati = await this.utilitiesService.loadDocumenti(
      this.idUtente, this.richiesta.richiesta_iscrizione_header.id_richiesta, this.commonPslpService.getAmbito());
    this.elenco_categoria_invalidita_disabili = await this.utilitiesService.getElencoCategoriaInvaliditaDisabili();

    this.initDid();
    await this.initRichiesta();
    if (this.richiesta.cod_tipo_iscrizione === 'D') { this.initDisabili(); }

    this.loaded = true;
    this.utilitiesService.hideSpinner();
    this.inizializzaBooleaniPerRiepilogo();
    this.setIsVisibileSituazioneRevisione();
  }

  ngOnDestroy() {
  }

  async initData() {
    this.idUtente = this.appUserService.getIdUtente();
    this.logService.log("utente " + this.idUtente);
    const [sap, did, richiestaIscrizioneCm, riepilogoCOMI, configurazioneFamiliariACarico, alltipiDocumentoCategoriaProtetta,
      alltipiDocumentoDisabili] = await Promise.all([
        this.commonPslpService.getSap$(this.idUtente),
        this.commonPslpService.ricercaDettaglioDIDService(this.idUtente),
        this.commonPslpService.getDettaglioIscrizioneL68$(this.idUtente),
        this.commonPslpService.getCollocamentoMirato(this.idUtente),
        this.commonPslpService.getConfigurazioneFamiliariAcarico(),
        this.businessService.findAllTipiDocumenti(Ambito.CMPRO).pipe(
          catchError(e => of([] as TipoDocumento[])))
          .toPromise(),
        this.businessService.findAllTipiDocumenti(Ambito.CMDIS).pipe(
          catchError(e => of([] as TipoDocumento[])))
          .toPromise()
      ]);
    this.sap = sap;
    this.did = did;
    this.richiesta = richiestaIscrizioneCm;
    this.riepilogoCOMI = riepilogoCOMI;
    this.configurazioneFamiliariACarico = configurazioneFamiliariACarico;
    this.listaAllTipiDocumento = this.richiesta.cod_tipo_iscrizione === 'D' ? alltipiDocumentoDisabili : alltipiDocumentoCategoriaProtetta;

    const [MI056, ME166, ME167, HC075, HC076, messaggioConfermaInvio] = await Promise.all([
      this.utilitiesService.getMessage('MI056'),
      this.utilitiesService.getMessage('ME166'),
      this.utilitiesService.getMessage('ME167'),
      this.utilitiesService.getMessage('HC075'),
      this.utilitiesService.getMessage('HC076'),
      this.utilitiesService.getMessage('MI068'),
    ]);
    this.MI056 = MI056;
    this.ME166 = ME166;
    this.ME167 = ME167;
    this.messaggioConfermaInvio = messaggioConfermaInvio;

    if (this.isRiepilogo) {
        this.messaggioUtente = HC075;
    } else {
      this.messaggioUtente = HC076;
    }
  }

  initDid() {
    this.isVisualizzaDid = false;
    if (!isNullOrUndefined(this.did) && !isNullOrUndefined(this.did.error) && !isNullOrUndefined(this.did.errore_ricerca_did) ) {
      this.didTerminata = this.did.flg_stato_finale === 'S' ? ' - Terminata' : ' - In corso';
      this.descrUltimoStatoDid = StatoDid.getDescrizioneByCodice(this.did.cod_ultimo_stato);
      if (this.isBozza) {
        this.isVisualizzaDid = true;
      }
    }
  }

  async initRichiesta() {
    const statiIscrizione = await this.utilitiesService.getElencoStatoIscrizione();
    const elencoCategorieProtette = await this.utilitiesService.getElencoCategoriaProtetta();
    const elencoCategorieDisabili = await this.utilitiesService.getElencoCategoriaProtettaDisabili();
    const motiviIscrizione = await this.utilitiesService.getElencoMotivoIscrizione();
    this.esitoRichiesta =
      this.richiesta.richiesta_iscrizione_header.cod_stato_richiesta === 'A' ||
      this.richiesta.richiesta_iscrizione_header.cod_stato_richiesta === 'R';

    this.statoRichiesta = statiIscrizione.find(el => el.codice_ministeriale === this.richiesta.richiesta_iscrizione_header.cod_stato_richiesta).descrizione;

    if (this.richiesta.cod_tipo_iscrizione === 'D') {
      this.tipoIscrizione = 'Disabili';
      this.categoriaAppartenenza = elencoCategorieDisabili.find(el => el.id_silp === this.richiesta.cod_categoria_appartenenza).descrizione;
    } else {
      this.tipoIscrizione = 'Altre categorie protette';
      this.categoriaAppartenenza = elencoCategorieProtette.find(el => el.id_silp === this.richiesta.cod_categoria_appartenenza).descrizione_silp;
    }

    this.impostaTipoComunicazione();

    this.motivoIscrizione = motiviIscrizione.find(el => el.codice_ministeriale === this.richiesta.cod_motivo_richiesta).descrizione;
    if (this.richiesta.id_cpi_ultima_iscrizione) {
      let cpiUltIscr = await this.utilitiesService.getCpiPerId(this.richiesta.id_cpi_ultima_iscrizione);
      if (cpiUltIscr) {
        this.cpiUltimaIscrizione = cpiUltIscr.descrizione;
        if (this.richiesta.id_provincia_ultima_iscrizione) {
          let provUltIscr = await this.getProvinciaSiglaByCodMinisteriale$(this.richiesta.id_provincia_ultima_iscrizione);
          if (provUltIscr && provUltIscr.length > 0) {
            this.cpiUltimaIscrizione += ' (' + provUltIscr + ')';
          }
        }
      }
    }
    let cpiRic = await this.utilitiesService.getCpiPerId(this.richiesta.id_cpi);
    if (cpiRic) {
      this.cpiRichiesta = cpiRic.descrizione;
      if (this.richiesta.id_provincia) {
        let provRichiesta = await this.getProvinciaSiglaByCodMinisteriale$(this.richiesta.id_provincia);
        if (provRichiesta && provRichiesta.length > 0) {
          this.cpiRichiesta += ' (' + provRichiesta + ')';
        }
      }
    }

    this.datiIscrizione();

    this.richiesta.elenco_allegati = await this.utilitiesService.loadDocumenti(this.appUserService.getIdUtente(), this.richiesta.richiesta_iscrizione_header.id_richiesta, this.commonPslpService.getAmbito());
  }


  private async impostaTipoComunicazione() {
    const elencoTipoComunicazione = await this.utilitiesService.getElencoTipoComunicazione();
    this.tipoComunicazione = elencoTipoComunicazione.find(el => el.codice_ministeriale === this.richiesta.cod_tipo_comunicazione).descrizione;
  }

  private datiIscrizione() {
    if (this.richiesta.richiesta_iscrizione_header.cod_stato_richiesta === 'A') {
      let iscrizione: IscrizioneCollocamentoMirato;

      if (this.richiesta.cod_tipo_iscrizione === 'D') {
        iscrizione = this.riepilogoCOMI.iscrizioneDisabili;
      } else {
        iscrizione = this.riepilogoCOMI.iscrizioneAltreCategorie;
      }

      if (iscrizione) {
        this.dataIscrizione = iscrizione.dataIscrizione;
        this.statoIscrizione = iscrizione.statoFinale ? 'CHIUSA' : 'ATTIVA';
      }
    }
  }

  initDisabili() {

    if (this.richiesta.cod_categoria_invalidita) {
      this.categoriaInvalidita = (this.elenco_categoria_invalidita_disabili
        .find(el => el.codice_ministeriale === this.richiesta.cod_categoria_invalidita.toString())).descrizione;
    }
  }

  onPrev() {
      this.urlUscita = this.urlRouteService.getPreviousUrl();
      this.router.navigateByUrl(this.urlUscita);
  }

  onRitorna() {
    this.router.navigateByUrl(urlRiepilogo);
  }

  async onInvia() {
    if (this.isInviaEnabled) {
      const data: DialogModaleMessage = {
        titolo: "Collocamento Mirato",
        tipo: TypeDialogMessage.YesOrNo,
        messaggio: this.messaggioConfermaInvio,
        messaggioAggiuntivo: ""
      };
      const res = await this.pslshareService.richiestaFinestraModale(data);
      if (res === 'NO') {
        return;
      }
      this.utilitiesService.showSpinner();
      /**
        *   invio richiesta
        */
      this.richiesta.tipo_operazione = "A";
      this.richiesta.richiesta_iscrizione_header.cod_stato_richiesta = "I";
      const esito = await this.commonPslpService.saveRichiestaIscrizione(this.idUtente, this.richiesta, null);
      /**
        *  controllare esito
        */
      if (esito.esitoPositivo) {
        this.commonPslpService.setRichiestaIscrizioneStorage(esito.richiesta);
        /* l'invio della richiesta e' andato a buon fine quindi mi occupo di
        aggiornare lo stato di tutti i documenti della richiesta in stato inviato
         */
        this.richiesta.elenco_allegati.forEach(element => {
          this.doInviaDocumento(element);
        });

        this.utilitiesService.hideSpinner();
        this.utilitiesService.showToastrInfoMessage('salvataggio effettuato', 'richiesta Iscrizione');
        this.router.navigateByUrl(urlRiepilogo);
      } else {
        this.utilitiesService.hideSpinner();

        return this.pslshareService.apriModale(esito.messaggioCittadino, "", this.titoloPagina, TypeDialogMessage.Confirm);
      }
    }

    this.router.navigateByUrl(urlRiepilogo);
  }

  async onModifica() {
    // richiesta iscrizione in bozza non modificabile se esiste una iscrizione attiva
    if (this.richiesta.cod_tipo_comunicazione !== 'T' && this.utilitiesService.isIscrizioneAttiva(this.riepilogoCOMI)) {
      return this.pslshareService.apriModale(this.ME166, "", this.titoloPagina, TypeDialogMessage.Confirm);
    }
    if (this.richiesta.cod_tipo_comunicazione === 'T' && !this.utilitiesService.isIscrizioneAttiva(this.riepilogoCOMI)) {
      return this.pslshareService.apriModale(this.ME167, "", this.titoloPagina, TypeDialogMessage.Confirm);
    }
    this.utilitiesService.showSpinner();

    this.commonPslpService.readOnlyCM = false;

    if (!isNullOrUndefined(this.richiesta)) {
      this.commonPslpService.wizard = true;
      this.commonPslpService.wizardDisabile = this.isDisabile(this.richiesta);
      this.commonPslpService.setRichiestaIscrizioneStorage(this.richiesta);
      this.commonPslpService.setSapAndIdUtenteStorage(this.sap, this.idUtente);
      this.commonPslpService.firstPage = "riepilogo";
      this.utilitiesService.hideSpinner();
      this.router.navigateByUrl('/collocamento-mirato/cittadino');
    }
    this.utilitiesService.hideSpinner();
  }

  async onElimina() {
    const data: DialogModaleMessage = {
      titolo: "Collocamento Mirato",
      tipo: TypeDialogMessage.CancelOrConfirm,
      messaggio: "Sei sicuro di voler procedere alla cancellazione ?",
      messaggioAggiuntivo: "Confermando, il dettaglio non verr&agrave; pi&ugrave; proposto nell'elenco Richieste."
    };
    const res = await this.pslshareService.richiestaFinestraModale(data);
    if (res === 'NO') {
      return;
    }

    this.utilitiesService.showSpinner();

    this.richiesta.tipo_operazione = 'N';
    this.richiesta.data_annullo = new Date();
    const esito = await this.commonPslpService.saveRichiestaIscrizione(this.idUtente, this.richiesta, '1');

    /*
    *  controllare esito
    */
    if (esito.esitoPositivo) {
      this.utilitiesService.hideSpinner();
      this.utilitiesService.showToastrInfoMessage('cancellazione effettuata', 'dati anagrafici');
      this.commonPslpService.setRichiestaIscrizioneStorage(null);

      this.router.navigateByUrl("/collocamento-mirato/inizio");
    } else {
      this.utilitiesService.hideSpinner();
      this.pslshareService.apriModale(esito.messaggioCittadino, "", this.titoloPagina, TypeDialogMessage.Confirm);
    }

  }

  isDisabile(richiestaIscrizioneCm: DettaglioRichiestaIscrizioneL68): boolean {
    if (!isNullOrUndefined(richiestaIscrizioneCm) && richiestaIscrizioneCm.cod_tipo_iscrizione === "D") {
      return true;
    }
    return false;
  }

  getDescMotivo(cod_ministeriale: string): string {
    return this.utilitiesService.getDescrizioneMotivoACarico(cod_ministeriale, this.configurazioneFamiliariACarico);
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
     * Gets tipo documento descrizione
     * @param cod string
     * @returns descrizione
     */
  getTipoDocumentoDescrizione(cod: string): string {
    let descr = '';
    if (this.listaAllTipiDocumento.length > 0) {
      const tipoDocumento = this.listaAllTipiDocumento.find(td => td.codice === cod);
      if (tipoDocumento) { descr = tipoDocumento.descrizione; }
    }

    return descr;
  }

  getStatoDescrizione(stato: string): string {
    if (stato && stato.length > 0) {
      return StatoDocumento.getByCodice(stato).descrizione;
    }
  }

  isValidData(): boolean {
    return !this.flagChanging
      && this.sap
      && (this.commonPslpService.wizard || this.dataChanged);
  }

  // usato dal wizard in alto
  async onExitPage(nav: NavigationEmitter) {
    if (this.isInviaEnabled) {
      if (this.isAvantiOrSalva(nav)) {
        const data: DialogModaleMessage = {
          titolo: "Collocamento Mirato",
          tipo: TypeDialogMessage.YesOrNo,
          messaggio: this.messaggioConfermaInvio,
          messaggioAggiuntivo: ""
        };
        const res = await this.pslshareService.richiestaFinestraModale(data);
        if (res === 'NO') {
          return;
        }
        this.utilitiesService.showSpinner();
        /**
         *   invio richiesta
         **/
        this.richiesta.tipo_operazione = "A";
        this.richiesta.richiesta_iscrizione_header.cod_stato_richiesta = "I";
        const esito = await this.commonPslpService.saveRichiestaIscrizione(this.idUtente, this.richiesta, null);
        /*
        *  controllare esito
        */
        if (esito.esitoPositivo) {
          this.commonPslpService.setRichiestaIscrizioneStorage(esito.richiesta);
          this.utilitiesService.hideSpinner();
          this.utilitiesService.showToastrInfoMessage('salvataggio effettuato', 'richiesta Iscrizione');

          this.router.navigateByUrl(nav.url);
        } else {
          this.utilitiesService.hideSpinner();

          return this.pslshareService.apriModale(esito.messaggioCittadino, "", this.titoloPagina, TypeDialogMessage.Confirm);
        }
      }
    }
    const urlUscita = nav.url;
    this.router.navigateByUrl(urlUscita);
  }

  private isAvantiOrSalva(nav: NavigationEmitter) {
    return (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save);
  }

  /**
   * Gets provincia desc by cod ministeriale$
   * @param codiceMinisteriale string
   * @returns Provincia
   */
  getProvinciaDescByCodMinisteriale$(codiceMinisteriale: string) {
    return this.businessService.getProvince().pipe(
      map((province: Provincia[]) =>
        province
          .filter(provincia => provincia.codice_ministeriale === codiceMinisteriale)
          .pop()
          .descrizione),
      catchError(() => of(''))
    ).toPromise();
  }

  /**
   * Gets sigla provincia by cod ministeriale$
   * @param codiceMinisteriale string
   * @returns Provincia
   */
  getProvinciaSiglaByCodMinisteriale$(codiceMinisteriale: string) {
    return this.businessService.getProvince().pipe(
      map((province: Provincia[]) =>
        province
          .filter(provincia => provincia.codice_ministeriale === codiceMinisteriale)
          .pop()
          .targa),
      catchError(() => of(''))
    ).toPromise();
  }

  async inizializzaBooleaniPerRiepilogo() {
    if (this.richiesta && this.richiesta.cod_tipo_iscrizione === this.TIPO_ISCRIZIONE_DISABILI) {
      if (!isNullOrUndefined(this.richiesta.cod_dichiarazione_visita_revisione_invalidita_civile)) {
        const listaComboSituazioneVisitaRevIC = await this.utilitiesService.getElencoDichiarazioneVisitaRevisioneInvaliditaCivile();
        this.descrizioneSituazioneRevisione = listaComboSituazioneVisitaRevIC.find(el => el.codice_ministeriale === this.richiesta.cod_dichiarazione_visita_revisione_invalidita_civile).descrizione;
      }
      const listeCategorieProtetteDisabili = await this.utilitiesService.getElencoCategoriaProtettaDisabili();
      let categoriaRichiedente: CategoriaProtettaDisab = listeCategorieProtetteDisabili.find(
        (el: CategoriaProtettaDisab) => { return el.id_silp === (this.richiesta.cod_categoria_appartenenza + '') });
      if (categoriaRichiedente.flg_attivare_grado_o_categoria === 'C') {
        this.visualizzaCategoriaInvalidita = true;
      } else if (categoriaRichiedente.flg_attivare_grado_o_categoria === 'G') {
        this.visualizzaGradoInvalidita = true;
      }
    }
  }

    /**
   * Determines whether number is
   */
     isNumber = function (num) {
      const n = Number(num);
      if (typeof (n) === 'number' && !isNaN(n)) {
        return true;
      }
      return false;
    };

  /**
   * Do invia documento
   * @returns invia documento
   */
   async doInviaDocumento(documento: Documento): Promise<void> {
    try {
        documento.stato = 'IN';
        await this.businessService.saveStatoDocumento(documento).pipe(
          catchError(err => {
            throw new Error(DOC_NON_PRESENTE);
          })
        ).toPromise();
    } catch (e) {
      this.logService.error(e);
    }
  }

  setIsVisibileSituazioneRevisione() {
    if (!isNullOrUndefined(this.richiesta)
      && !isNullOrUndefined(this.richiesta.verbale_invalidita_civile)
      && !isNullOrUndefined(this.richiesta.verbale_invalidita_civile.data_prossima_revisione)
      && !isNullOrUndefined(this.richiesta.cod_dichiarazione_visita_revisione_invalidita_civile)) {
        if (this.richiesta.verbale_invalidita_civile.data_prossima_revisione <= this.today) {
          this.isVisibileSituazioneRevisione = true;
        }
      }
  }
}
