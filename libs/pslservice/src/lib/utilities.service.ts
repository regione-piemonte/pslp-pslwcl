import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BusinessService, CategoriaProtetta, CategoriaProtettaDisab, CentroPerImpiego, Comune, ConfigurazioneCollocamentoMirato, Decodifica, Indirizzo, CollocamentoMiratoService, MenuHelpPage, MenuHomeCard, Messaggio, SchedaAnagraficoProfessionale, SystemService, Esito, Documento, Utente, ConfigurazioneFamiliariACarico, EsitoRiepilogoCollocamentoMirato } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, BaseCard, BaseHelp, ComponenteHelp, DialogModaleMessage, GruppoHelp, TipoComponenteHelp, TypeApplicationCard, TypeDialogMessage, TypeLinkCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { LogService } from './log';
import { ParametriSistemaService } from './parametri-sistema.service';
import { SessionStorageService } from './session-storage.service';
import { Utils } from './utils';


@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {

  private static readonly TIMEOUT_STAMPA = 3600000;
  private static readonly TOASTR_OPTION = {
    timeOut: 10000,
    positionClass: 'toast-top-full-width',
    closeButton: true
  };
  private static readonly TOASTR_OPTION_ENABLE_HTML = {
    timeOut: 10000,
    positionClass: 'toast-top-full-width',
    closeButton: true,
    enableHtml: true
  };
  private static readonly MESSAGE_CACHE = {};
  private debug: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private linkLand: string;
  private paramLand: string;
  private title: string;
  private fromLanding = false;

  constructor(
    private readonly businessService: BusinessService,
    private readonly legge68Service: CollocamentoMiratoService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly logService: LogService,
    private readonly toastrService: ToastrService,
    private readonly ngxSpinnerService: NgxSpinnerService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly systemService: SystemService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.parametriSistemaService.tempoEspoMsgMs.then(
      (timeOut: number) => (UtilitiesService.TOASTR_OPTION.timeOut = timeOut)
    );
  }

  get debug$(): Observable<boolean> {
    return this.debug.asObservable();
  }

  static clone<T>(obj: T): T {
    const str = JSON.stringify(obj);
    return UtilitiesService.jsonParse(str);
  }

  static jsonParse<T>(str: string): T {
    const tmp: T = JSON.parse(str);
    return Utils.convertHandlingDate(tmp);
  }

  static copyProperties<T, U extends T>(
    obj: U,
    ...propertiesToCopy: string[]
  ): T {
    return propertiesToCopy.reduce(
      (acc, el) => Utils.setDeepValue(acc, el, Utils.getDeepValue(obj, el)),
      {} as T
    );
  }

  /**
   * Calcola l'eta di una persono ad oggi partendo dalla data di nascita
   *
   * @param birthday  [data di nascita] può essere un oggetto json che rappresenta una data o una stringa nel formato "gg/mm/aaaa"
   */
  static calcAge(birthday: Date): number {
    const today: Date = new Date();
    let years: number = today.getFullYear() - birthday.getFullYear();
    if (
      today.getMonth() < birthday.getMonth() ||
      (today.getMonth() === birthday.getMonth() &&
        today.getDate() < birthday.getDate())
    ) {
      years--;
    }
    return years;
  }

  /**
   * lancia una eccezione con l'errore
   *
   * @param error errore Html o applicativo
   */
  static throwHttpError(error: any): any {
    if (!(error instanceof HttpErrorResponse)) {
      throw new Error(error);
    }
    if (!error.error) {
      throw new Error(error.message);
    }
    if (!error.error.messaggioCittadino) {
      throw new Error(error.error.errorMessage);
    }
    throw new Error(error.error.messaggioCittadino);
  }

  setDebug(mode: boolean) {
    this.debug.next(mode);
  }
  toggleDebug() {
    this.debug.next(!this.debug.value);
  }

  /**
   * ritorna descrizione di un messaggio
   *
   * @param codice codice del messaggio
   */
  getMessage(codice: string): Promise<string> {
    if (UtilitiesService.MESSAGE_CACHE[codice]) {
      return Promise.resolve(UtilitiesService.MESSAGE_CACHE[codice]);
    }
    return this.businessService
      .loadMessaggio(codice)
      .pipe(
        map((value: Messaggio) => value.testo),
        tap(value => (UtilitiesService.MESSAGE_CACHE[codice] = value)),
        catchError(err => {
          this.logService.error('messaggio non trovato:', codice);
          this.logService.log(err);
          return of('Messaggio ' + codice + '.');
        })
      )
      .toPromise();
  }


  downloadFileDaStampa(data: any, type: string, filename = 'stampa.pdf') {
    const blob = new Blob([data], { type: type });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);

    } else {
      const elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }


  downloadFile(data: any, type: string, filename = 'stampa.pdf') {
    const blob = new Blob([data], { type: type });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      const url = window.URL.createObjectURL(blob);
      const pwa = window.open(url, '_blank');
      if (!pwa || pwa.closed || typeof pwa.closed === 'undefined') {
        alert('Please disable your Pop-up blocker and try again.');
      }
      setTimeout(
        () => window.URL.revokeObjectURL(url),
        UtilitiesService.TIMEOUT_STAMPA
      );
    }
  }

  /**
   * download di un file in Base64
   * @param data file da scaricare
   */
  downloadBase64File(data: string, type: string, fileName: string) {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      const blob = this.base64ToBlob(data, type);
      window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
      const linkSource = `data:${type};base64,${data}`;
      const downloadLink = document.createElement('a');

      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    }
  }

  base64ToBlob(base64Data: string, contentType = '', sliceSize = 512): Blob {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  /**
   * Mostra un messaggio di informazione
   *
   * @param message messaggio
   * @param [title=''] titolo
   */
  showToastrInfoMessage(message: string, title = '') {
    this.toastrService.info(message, title, UtilitiesService.TOASTR_OPTION);
  }

  showToastrInfoMessageEnableHtml(message: string, title = '') {
    this.toastrService.info(
      message,
      title,
      UtilitiesService.TOASTR_OPTION_ENABLE_HTML
    );
  }


  /**
   * Mostra un messaggio di errore
   *
   * @param message messaggio
   * @param [title=''] titolo
   */
  showToastrErrorMessage(message: string, title = '') {
    this.toastrService.error(message, title, UtilitiesService.TOASTR_OPTION);
  }

  showToastrErrorMessageEnableHtml(message: string, title = '') {
    this.toastrService.error(
      message,
      title,
      UtilitiesService.TOASTR_OPTION_ENABLE_HTML
    );
  }

  async getAndShowToastrMessageHtml(msgCod: string, title = '') {
    const msg = await this.getMessage(msgCod);
    this.showToastrErrorMessageEnableHtml(msg, title);
  }
  /**
   * Mostra uno spinner. Di default copre tutta la pagina
   *
   * @param [name='main-spinner'] nome dello spinner
   */
  showSpinner(name = 'main-spinner') {
    this.ngxSpinnerService.show(name);
  }

  /**
   * Nasconde uno spinner. Di default quello che copre tutta la pagina
   *
   * @param [name='main-spinner'] nome dello spinner
   */
  hideSpinner(name = 'main-spinner') {
    this.ngxSpinnerService.hide(name);
  }

  /**
   * Lista dei comuni; se esiste già sul Session Storage, usa questa lista
   */
  async getAllComuni(): Promise<Comune[]> {
    const comuni = this.sessionStorageService.getItem<Comune[]>(
      SessionStorageService.COMUNI,
      true
    );
    if (comuni && comuni.length > 0) {
      return comuni;
    }
    return this.businessService
      .getComuni('')
      .pipe(
        map((result: Comune[]) => {
          result.sort((a: Comune, b: Comune) => a.descrizione.localeCompare(b.descrizione));
          return result;
        }

        ),
        tap((values: Comune[]) =>
          this.sessionStorageService.setItem<Comune[]>(
            SessionStorageService.COMUNI,
            values
          )
        ),
        catchError(() => of([]))
      )
      .toPromise();
  }

  scrollTo(selector: string): void {
    // Invokes next tick
    setTimeout(() => {
      const scrollElement = this.document.querySelector(selector);
      if (scrollElement) {
        scrollElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  async logout(): Promise<string> {
    return this.systemService
      .logout()
      .pipe(
        // Ignore errors in logout
        catchError(() => of('OK'))
      )
      .toPromise();
  }

  setLinkLand(linkLand: string) {
    this.linkLand = linkLand;
  }

  getLinkLand(): string {
    let link = '';
    if (!isNullOrUndefined(this.linkLand)) {
      link = '' + this.linkLand;
      this.linkLand = null;
    }
    return link;
  }

  setParamLand(paramLand: string) {
    this.paramLand = paramLand;
  }

  getParamLand(): string {
    let param: string = null;
    if (!isNullOrUndefined(this.paramLand)) {
      param = this.paramLand;
    }
    return param;
  }

  setTitle(title: string) {
    this.title = title;
  }

  getTitle(): string {
    let param: string = null;
    if (!isNullOrUndefined(this.title)) {
      param = this.title;
    }
    return param;
  }

  setFromLanding(flag: boolean) {
    this.fromLanding = flag;
  }
  isFromLanding(): boolean {
    return this.fromLanding;
  }

  /**
   * valorizza il menu
   *
   * @param codice codice del menu
   */
  async getMenu(codice: string, codFisc?: string): Promise<BaseCard[]> {
    const card: BaseCard[] = [];
    let menu: MenuHomeCard[];
    if (codFisc && codice === "OP") {

      codice = "OP-" + codFisc;
      this.logService.log("utente impostato per menu " + codice);

    }

    menu = await this.businessService
      .loadMenu(codice)
      .pipe(catchError(e => of([] as MenuHomeCard[])))
      .toPromise();

    if (isNullOrUndefined(menu) || menu.length < 1) {
      return null;
    }

    menu.forEach((element) => {
      const a: BaseCard = {
        id: element.id_card,
        titolo: element.titolo,
        link: element.link,
        icon: element.icon,
        testoCard: element.testo,
        urlImg: element.url_img,
        tipoLink: this.setTypeLink(element.tipo_link),
        applicazione: this.setTypeApplication(element.cod_app),
        flgAccessoAutenticato: element.flg_accesso_autenticato,
      };

      card.push(a);
    });
    return card;
  }


  setTypeLink(type: string): TypeLinkCard {
    let a: TypeLinkCard = TypeLinkCard.UrlInterno;
    switch (type) {
      case TypeLinkCard.UrlEsterno:
        a = TypeLinkCard.UrlEsterno;
        break;
    }
    return a;

  }

  setTypeApplication(type: string): TypeApplicationCard {
    let a: TypeApplicationCard = TypeApplicationCard.Home;
    switch (type) {
      case TypeApplicationCard.Fascicolo:
        a = TypeApplicationCard.Fascicolo;
        break;
      case TypeApplicationCard.Cittadino:
        a = TypeApplicationCard.Cittadino;
        break;
    }
    return a;

  }

  /**
   * valorizza pagina help
   *
   * @param codice codice del help
   */
  async getHelp(codice: string): Promise<BaseHelp> {

    const help = await this.businessService
      .loadMenuHelpPage(codice)
      .pipe(catchError(e => of(null as MenuHelpPage)))
      .toPromise();
    if (isNullOrUndefined(help)) {
      throw new Error('Help non definito.');
    }
    const baseHlp: BaseHelp = {
      id: '0',
      titolo: 'Assistenza',
      listaMessaggi: [],
      listaManuali: [],
      listaVideo: help.video_tutorial

    };
    this.logService.log("************************* help *****");
    this.logService.log(help);
    help.messaggi.forEach((element) => {
      const a: ComponenteHelp = {
        tipo: TipoComponenteHelp.MESSAGGIO,
        gruppo: GruppoHelp.ASSISTENZA,
        link: "",
        titolo: "",
        testo: element.contenuto[0],
      };
      baseHlp.listaMessaggi.push(a);
    }
    );
    help.manuali.forEach((element) => {
      const a: ComponenteHelp = {
        tipo: TipoComponenteHelp.MANUALE,
        gruppo: GruppoHelp.MANUALI,
        link: element.file_url,
        titolo: element.file_titolo,
        testo: '',
      };
      baseHlp.listaManuali.push(a);
    }
    );


    return baseHlp;
  }

  getDescrAmbito(loAmbito: Ambito): string {
    /*
    COMI	Collocamento Mirato
    FASC	Fascicolo
    GG	        Garanzia Giovani
    OPE	        Operatore gestore
    RDC	        Reddito di Cittadinanza
    TRV	        Trasversale
    **/
    switch (loAmbito) {
      case Ambito.FASC:
        return 'Fascicolo';
      case Ambito.COMI:
        return 'Fascicolo';
      case Ambito.GG:
        return 'Garanzia Giovani';
      case Ambito.RDC:
        return 'Reddito di Cittadinanza';
      default:
        return '';
    }

  }

  public isSapDomicilioPiemonte(sap: SchedaAnagraficoProfessionale): boolean {
    return sap && this.isProvinciaInPiemonte(sap.domicilio);
  }

  public isSapResidenzaPiemonte(sap: SchedaAnagraficoProfessionale): boolean {
    return sap && this.isProvinciaInPiemonte(sap.residenza);
  }

  public isProvinciaInPiemonte(indirizzo: Indirizzo): boolean {
    if (!this.hasDataProvincia(indirizzo)) {
      return false;
    }
    // controllare la regione, nel caso ci sia
    const goodProvinces = ['TORINO', 'CUNEO', 'VERCELLI', 'ALESSANDRIA', 'BIELLA', 'NOVARA', 'VERBANO CUSIO OSSOLA', 'ASTI'];
    const provincia = indirizzo.comune.provincia.descrizione ? indirizzo.comune.provincia.descrizione.toUpperCase() : '';
    return goodProvinces.indexOf(provincia) !== -1;
  }

  public isProvinciaCodInPiemonte(codMinisteriale: string): boolean {
    const codiciProvincePiemonte = ['001', '002', '003', '004', '005', '006', '096', '103'];

    if (codMinisteriale && codMinisteriale.length > 0) {
      return !isNullOrUndefined(codiciProvincePiemonte.find(el => el === codMinisteriale));
    }
    return false;
  }

  public hasDataProvincia(indirizzo: Indirizzo): boolean {
    return !!(indirizzo && indirizzo.comune && indirizzo.comune.provincia && indirizzo.comune.provincia.descrizione);
  }

  public hasDataNazione(indirizzo: Indirizzo): boolean {
    return !!(indirizzo && indirizzo.stato && indirizzo.stato.descrizione);
  }

  /* ***** */

  public cleanupDate(date: Date): Date {
    let res = date;
    if (date instanceof Date) {
      // To GMT
      res = new Date(date.getTime());
      res.setUTCHours(0, 0, 0, 0);
    }
    return res;
  }

  public isDataCompresa(dataDaVerificare: Date, dataMin: Date, dataMax: Date): boolean {
    const dataIniziale = this.cleanupDate(dataMin);
    const dataFinale = this.cleanupDate(dataMax);
    if (isNullOrUndefined(dataDaVerificare)) {
      return false;
    }
    if (!isNullOrUndefined(dataIniziale) && dataDaVerificare < dataIniziale) {
      return false;
    }
    if (!isNullOrUndefined(dataFinale) && dataDaVerificare > dataFinale) {
      return false;
    }
    return true;
  }



  /**
   * Lista dei MOTIVO_ISCRIZIONE se esiste già sul Session Storage, usa questa lista
   */
  async getElencoMotivoIscrizione(): Promise<Decodifica[]> {
    const elenco = this.sessionStorageService.getItem<Decodifica[]>(
      SessionStorageService.COMI_MOTIVO_ISCRIZIONE,
      true
    );
    if (elenco && elenco.length > 0) {
      return elenco;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.elenco_motivo_iscrizione;
  }

  private async getElenchiConfigurazioneCollocamentoMirato() {
    const conf = await this.legge68Service.loadConfigurazioniCollocamentoMirato().toPromise();
    this.setStorageElenchi(conf);
    return conf;
  }

  /**
   * Lista dei TIPO_ISCRIZIONE se esiste già sul Session Storage, usa questa lista
   */
  async getElencoTipoIscrizione(): Promise<Decodifica[]> {
    const elenco = this.sessionStorageService.getItem<Decodifica[]>(
      SessionStorageService.COMI_TIPO_ISCRIZIONE,
      true
    );
    if (elenco && elenco.length > 0) {
      return elenco;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.elenco_tipo_iscrizione;
  }

  /**
   * Lista dei STATO_ISCRIZIONE se esiste già sul Session Storage, usa questa lista
   */
  async getElencoStatoIscrizione(): Promise<Decodifica[]> {
    const elenco = this.sessionStorageService.getItem<Decodifica[]>(
      SessionStorageService.COMI_STATO_ISCRIZIONE,
      true
    );
    if (elenco && elenco.length > 0) {
      return elenco;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.elenco_stato_iscrizione;
  }

  /**
   * Lista dei TIPO_COMUNICAZIONE se esiste già sul Session Storage, usa questa lista
   */
  async getElencoTipoComunicazione(): Promise<Decodifica[]> {
    const elenco = this.sessionStorageService.getItem<Decodifica[]>(
      SessionStorageService.COMI_TIPO_COMUNICAZIONE,
      true
    );
    if (elenco && elenco.length > 0) {
      return elenco;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.elenco_tipo_comunicazione;
  }

  /**
   * Lista dei CATEG_PROTETTA_DISAB se esiste già sul Session Storage, usa questa lista
   */
  async getElencoCategoriaProtettaDisabili(): Promise<CategoriaProtettaDisab[]> {
    const elenco = this.sessionStorageService.getItem<CategoriaProtettaDisab[]>(
      SessionStorageService.COMI_CATEG_PROTETTA_DISAB,
      true
    );
    if (elenco && elenco.length > 0) {
      return elenco;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.elenco_categoria_protetta_disabili;
  }

  /**
    * Lista dei CATEG_PROTETTA se esiste già sul Session Storage, usa questa lista
    */
  async getElencoCategoriaProtetta(): Promise<CategoriaProtetta[]> {
    const elenco = this.sessionStorageService.getItem<CategoriaProtetta[]>(
      SessionStorageService.COMI_CATEG_PROTETTA,
      true
    );
    if (elenco && elenco.length > 0) {
      return elenco;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.elenco_categoria_protetta;
  }

  /**
    * Lista dei QUALIF_NON_VEDENTI se esiste già sul Session Storage, usa questa lista
    */
  async getElencoQualificheNonVedenti(): Promise<Decodifica[]> {
    const elenco = this.sessionStorageService.getItem<Decodifica[]>(
      SessionStorageService.COMI_QUALIF_NON_VEDENTI,
      true
    );
    if (elenco && elenco.length > 0) {
      return elenco;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.elenco_qualifiche_non_vedenti;
  }

  /**
   * Lista dei CATEG_INVALIDITA_DISAB se esiste già sul Session Storage, usa questa lista
   */
  async getElencoCategoriaInvaliditaDisabili(): Promise<Decodifica[]> {
    const elenco = this.sessionStorageService.getItem<Decodifica[]>(
      SessionStorageService.COMI_CATEG_INVALIDITA_DISAB,
      true
    );
    if (elenco && elenco.length > 0) {
      return elenco;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.elenco_categoria_invalidita_disabili;

  }

  /**
   * Lista dei DICHIARAZIONE_VISITA_REVISIONE_INVALIDITA_CIVILE se esiste già sul Session Storage, usa questa lista
   */
  async getElencoDichiarazioneVisitaRevisioneInvaliditaCivile(): Promise<Decodifica[]> {
    const elenco = this.sessionStorageService.getItem<Decodifica[]>(
      SessionStorageService.COMI_ELENCO_DICHIARAZIONE_VISITA_REVISIONE_INVALIDITA_CIVILE,
      true
    );
    if (elenco && elenco.length > 0) {
      return elenco;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.elenco_dichiarazione_visita_revisione_invalidita_civile;

  }
  /**
    * restituisce il grado prelevato dai parametri di configurazione
    */
  async getGradoDisabilitaNonVedenti(): Promise<string> {
    const grado = this.sessionStorageService.getItem<string>(
      SessionStorageService.COMI_GRADO_DISAB_NON_VEDENTI,
      true
    );
    if (!isNullOrUndefined(grado)) {
      return grado;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.grado_disabilita_non_vedenti;

  }

  /**
   * restituisce il grado prelevato dai parametri di configurazione
   */
  async getGradoDisabilitaSordomuti(): Promise<string> {
    const grado = this.sessionStorageService.getItem<string>(
      SessionStorageService.COMI_GRADO_DISAB_SORDOMUTI,
      true
    );
    if (!isNullOrUndefined(grado)) {
      return grado;
    }
    const conf = await this.getElenchiConfigurazioneCollocamentoMirato();
    return conf.grado_disabilita_sordomuti;

  }

  private setStorageElenchi(conf: ConfigurazioneCollocamentoMirato) {

    this.sessionStorageService.setItem<Decodifica[]>(SessionStorageService.COMI_CATEG_INVALIDITA_DISAB, conf.elenco_categoria_invalidita_disabili);
    this.sessionStorageService.setItem<Decodifica[]>(SessionStorageService.COMI_QUALIF_NON_VEDENTI, conf.elenco_qualifiche_non_vedenti);
    this.sessionStorageService.setItem<CategoriaProtetta[]>(SessionStorageService.COMI_CATEG_PROTETTA, conf.elenco_categoria_protetta);
    this.sessionStorageService.setItem<CategoriaProtettaDisab[]>(SessionStorageService.COMI_CATEG_PROTETTA_DISAB, conf.elenco_categoria_protetta_disabili);
    this.sessionStorageService.setItem<Decodifica[]>(SessionStorageService.COMI_TIPO_COMUNICAZIONE, conf.elenco_tipo_comunicazione);
    this.sessionStorageService.setItem<Decodifica[]>(SessionStorageService.COMI_STATO_ISCRIZIONE, conf.elenco_stato_iscrizione);
    this.sessionStorageService.setItem<Decodifica[]>(SessionStorageService.COMI_TIPO_ISCRIZIONE, conf.elenco_tipo_iscrizione);
    this.sessionStorageService.setItem<Decodifica[]>(SessionStorageService.COMI_MOTIVO_ISCRIZIONE, conf.elenco_motivo_iscrizione);
    this.sessionStorageService.setItem<string>(SessionStorageService.COMI_GRADO_DISAB_NON_VEDENTI, conf.grado_disabilita_non_vedenti);
    this.sessionStorageService.setItem<string>(SessionStorageService.COMI_GRADO_DISAB_SORDOMUTI, conf.grado_disabilita_sordomuti);
    this.sessionStorageService.setItem<Decodifica[]>(SessionStorageService.COMI_ELENCO_DICHIARAZIONE_VISITA_REVISIONE_INVALIDITA_CIVILE, conf.elenco_dichiarazione_visita_revisione_invalidita_civile);
  }

  /**
   * Lista dei centri per l'impiego; se esiste già sul Session Storage, usa questa lista
   */
  async getAllCentriPerImpiego(): Promise<CentroPerImpiego[]> {
    const cpi = this.sessionStorageService.getItem<CentroPerImpiego[]>(
      SessionStorageService.CENTRI_IMPIEGO,
      true
    );
    if (cpi && cpi.length > 0) {
      return cpi;
    }
    return this.businessService
      .getCentriPerImpiego()
      .pipe(
        map((result: CentroPerImpiego[]) => {
          result.sort((a: CentroPerImpiego, b: CentroPerImpiego) => a.descrizione.localeCompare(b.descrizione));
          return result;
        }

        ),
        tap((values: CentroPerImpiego[]) =>
          this.sessionStorageService.setItem<CentroPerImpiego[]>(
            SessionStorageService.CENTRI_IMPIEGO,
            values
          )
        ),
        catchError(() => of([]))
      )
      .toPromise();
  }


  /**
   * usa la Lista dei centri per l'impiego; per recuperare il cpi del singolo comune
   */
  async getCpiDelComune(codiceMinisteriale: string): Promise<CentroPerImpiego> {
    return this.businessService
      .getCpiDelComune(codiceMinisteriale).toPromise();
  }

  /**
    * Lista dei centri per l'impiego legati ad una singola provincia (codice ministeriale)
    */
  async getCpiDellaprovincia(codiceMinisteriale: string): Promise<CentroPerImpiego[]> {
    return this.businessService
      .getCpiDellaProvincia(codiceMinisteriale).pipe(
        map((result: CentroPerImpiego[]) => {
          result.sort((a: CentroPerImpiego, b: CentroPerImpiego) => a.descrizione.localeCompare(b.descrizione));
          return result;
        }

        ),
        catchError(() => of([]))
      )
      .toPromise();
  }

  async getCpiPerId(id: number): Promise<CentroPerImpiego> {
    const cpi = await this.businessService.getCentriPerImpiego(id).toPromise();
    return cpi[0];
  }

  async deleteDocumenti(id: number): Promise<string> {
    const risultatoDelete: Esito = await this.businessService.deleteDocumento(id).pipe(
      catchError(err => of(null))
    ).toPromise();
    return risultatoDelete.code;
  }

  /**
   * Loads documenti
   */
  async loadDocumenti(idUtente: number, idRichiesta: number, codAmbito: string): Promise<Documento[]> {
    /** METODO PER RICHIAMARE IL SERVIZIO CHE RESTITUISCE I  DOCUMENTI  */
    const pdf = await this.businessService.findDocumentiRichiestaIscrizione(idUtente, idRichiesta, codAmbito)
      .pipe(catchError(e => of([] as Documento[])))
      .toPromise();
    pdf.sort((a: Documento, b: Documento) => (a.id - b.id));
    return pdf;
  }

  getDescrizioneMotivoACarico(cod_ministeriale: string, laConfig: ConfigurazioneFamiliariACarico): string {
    if (!isNullOrUndefined(laConfig)) {
      let motivo: Decodifica = laConfig.elencoDecodeMotivoCarico.find(motivo => motivo.codice_silp === cod_ministeriale);
      if (motivo) {
        return motivo.descrizione;
      }
    }
    return '';
  }

  /**
 * verifica se esistono iscrizioni in stato finale
 * @param esito
 * @returns
 */
  isIscrizioneAttiva(esito: EsitoRiepilogoCollocamentoMirato): boolean {
    if (esito.iscrizioneAltreCategorie && !esito.iscrizioneAltreCategorie.statoFinale) {
      return true;
    }
    if (esito.iscrizioneDisabili && !esito.iscrizioneDisabili.statoFinale) {
      return true;
    }
    return false;
  }


}
