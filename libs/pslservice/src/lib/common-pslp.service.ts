import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AdesioneYG, BusinessService, CollocamentoMiratoService, ConfigurazioneCollocamentoMirato, ConfigurazioneFamiliariACarico, DatiInputSaveRichiestaIscrizioneCollocamentoMirato, DettaglioCompletoDichiarazioneFamiliariACarico, DettaglioRichiestaIscrizioneL68, DidService, Documento, DomandaRDC, ErrorDef, Esito, EsitoDettaglioDid, EsitoRiepilogoCollocamentoMirato, EsitoSalvataggioRedditoCollocamentoMirato, EsitoSaveDichiarazione, EsitoSaveRichiestaIscrizioneCollocamentoMirato, Indirizzo, InformazioneAggiuntiva, ParametriCalcoloProfilingYG, ParametriSalvataggioRedditoCollocamentoMirato, ParametriSalvataggioSAP, PrenotazioneIncontro, Privacy, ProfilingYG, RedditoCollocamentoMirato, SchedaAnagraficoProfessionale, TipoResponsabilita, Utente, UtenteACarico, UtentePresaVisione } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, DialogModaleMessage, EsitoControlloValore, EsitoSaveErrato, InformazioneAggiuntivaExtend, ModificheSAP, SezioniSAP, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { of, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { isNull, isNullOrUndefined } from 'util';
import { AppUserService } from './app-user.service';
import { LogService } from './log';
import { ParametriSistemaService } from './parametri-sistema.service';
import { SessionStorageService } from './session-storage.service';
import { UtilitiesService } from './utilities.service';

/**
 * Injectable
 */
@Injectable({
  providedIn: 'root'
})
export class CommonPslpService {
  /** inizio variabili provenienti da Cittadino */
  static readonly DATA_NASCITA_SESSION_PLACEHOLDER = 'CommonPslpService.dataNascita';
  static readonly VERIFICA_UTENTE_APPUNTAMENTI = 'Verifica utente - Appuntamenti ? ';
  adesioneUpdate = new Subject<AdesioneYG>();
  domandaUpdate = new Subject<DomandaRDC>();
  wizard = false;
  wizardDisabile: boolean;

  utenteUpdate = new Subject<Utente>();
  obbligoFormativoUpdate = new Subject<boolean>();
  sapUpdate = new Subject<SchedaAnagraficoProfessionale>();
  informazioniAggiuntiveExtendUpdate = new Subject<InformazioneAggiuntivaExtend[]>();
  allegatiUpdate = new Subject<Documento[]>();
  appuntamentoUpdate = new Subject<PrenotazioneIncontro>();
// collocamento mirato
  dettaglioRichiestaUpdate = new Subject<DettaglioRichiestaIscrizioneL68>();
  idRichiestaUpdate = new Subject<number>();

  appuntamentiFlag = false;
  appuntamentoOld: PrenotazioneIncontro;
  msgSposta: string;
  operareSoloMinori = false;
  tutore: Utente;
  profiloResult: ProfilingYG;
  adesione: AdesioneYG;
  domandaRDC: DomandaRDC;
  utenteACarico: UtenteACarico;
  idUtenteSapUpdate = new Subject<number>();
  idUtenteMinore: number;

  AMBITO: Ambito;
  creareNuovaSap = false;
  tipoResponsabilita: TipoResponsabilita = null;
  sezioniModificabiliFuoriPiemonte = false;
  obbligoDomicilioPiemonte = true;
  readOnlyDomicilio = false;
  ambitoPrivacy: Ambito;
  firstPage: string;


  /** fine  variabili provenienti da Cittadino */
  readOnly = true;
  readOnlyCM: boolean = false;
  sapbysilpUpdate = new Subject<SchedaAnagraficoProfessionale>();
  modificheSAPUpdate = new Subject<ModificheSAP>();
  esitoSaveUpdate = new Subject<EsitoSaveErrato>();
  sapBackupUpdate = new Subject<SchedaAnagraficoProfessionale>();
  modificheSAPBackupUpdate = new Subject<ModificheSAP>();
  idUtenteSapBackupUpdate = new Subject<number>();
  elencoPrivacyUtente: Privacy[];
  dettaglioTestoPrivacy: string[];
  idUtenteMinorePrivacy: number;
  idUtenteMinoreDid: number;

  constructor(
    protected businessService: BusinessService,
    protected collocamentoMiratoService: CollocamentoMiratoService,
    protected storageService: SessionStorageService,
    protected logService: LogService,
    protected utilitiesService: UtilitiesService,
    private readonly parametriSistemaService: ParametriSistemaService,
    protected appUserService: AppUserService,
    private readonly didService: DidService,
    private readonly legge68: CollocamentoMiratoService
  ) { }

  // INIZIALIZZAZIONE
  /**
   * Inizializzas hard
   */
  inizializzaHard() {
    this.readOnly = true;
    this.readOnlyCM = false;
    this.readOnlyDomicilio = false;
    this.wizard = false;
    this.appuntamentiFlag = false;
    if (this.AMBITO === Ambito.GG) {
      this.inizializzaHardGG();
    }
    this.inizializzaHardFC();
    this.inizializzaProfilo();
  }

  /**
     * Gets user messages
     * @param utente pslp
     * @returns user messages
     */
  async getUserMessages(utente: Utente): Promise<{ active: boolean, msg: string, userMessage: string }> {
    switch (this.AMBITO) {
      case Ambito.GG:
        return this.getUserMessagesGG(utente);
      case Ambito.RDC:
        return this.getUserMessagesRDC(utente);
      default:
        return this.getUserMessagesFC(utente);
    }
  }

  // async getUserMessages(
  //   utente: Utente
  // ): Promise<{ active: boolean; msg: string; userMessage: string }> {
  //   return await this.getUserMessagesFC(utente);
  // }

  // UTENTE
  public setUtenteStorage(utente: Utente) {
    this.storageService.setItem<Utente>(SessionStorageService.UTENTE, utente);
    this.utenteUpdate.next(utente);
  }

  public getUtenteStorage(): Utente {
    const utente = this.storageService.getItem<Utente>(
      SessionStorageService.UTENTE,
      true
    );
    if (!utente) {
      throw new Error('Utente non definito.');
    }
    return utente;
  }

  // SCHEDA ANAGRAFICA PROFESSIONALE
  public setSapStorage(sap: SchedaAnagraficoProfessionale) {
    this.storageService.setItem<SchedaAnagraficoProfessionale>(
      SessionStorageService.SAP,
      sap
    );
    this.sapUpdate.next(sap);
    if (isNull(sap)) {
      this.setObbligoFormativoStorage(null);
    }
  }

  /**
   * @description Sets tipo responsabilita
   * @param ilTipo TipoResponsabilita
   */
  public setTipoResponsabilita(ilTipo: TipoResponsabilita) {
    this.tipoResponsabilita = ilTipo;
  }
  /**
   * @description Gets tipo responsabilita
   * @returns TipoResponsabilita
   */
  public getTipoResponsabilita() {
    return this.tipoResponsabilita;
  }

  /**
   * Sets obbligo formativo storage
   * @param sap scheda anagrafica professionale
   */
  public setObbligoFormativoStorage(sap: SchedaAnagraficoProfessionale) {
    let valore = false;
    if (!isNullOrUndefined(sap) && !isNullOrUndefined(sap.datiAmministrativi)
      && !isNullOrUndefined(sap.datiAmministrativi.obbligo_formativo_assolto)) {
      valore = sap.datiAmministrativi.obbligo_formativo_assolto;
    }
    this.storageService.setItem<boolean>(
      SessionStorageService.OBBLIGOFORMATIVO,
      valore
    );
    this.obbligoFormativoUpdate.next(valore);
  }
  /**
   * Gets obbligo formativo storage
   * @returns true if obbligo formativo e memorizza in session storage
   */
  public getObbligoFormativoStorage(): boolean {
    return this.storageService.getItem<boolean>(
      SessionStorageService.OBBLIGOFORMATIVO,
      true
    );
  }

  /**
   * Sets sap by silp e memorizza nello session storage
   * @param sap scheda anagrafica
   */
  public setSapBySilpStorage(sap: SchedaAnagraficoProfessionale) {
    this.storageService.setItem<SchedaAnagraficoProfessionale>(
      SessionStorageService.SAP,
      sap
    );
    this.sapbysilpUpdate.next(sap);
  }

  /**
   * Sets sap and id utente in session storage
   * @param sap scheda anagrafica
   * @param id idutente
   */
  public setSapAndIdUtenteStorage(sap: SchedaAnagraficoProfessionale, id: number) {
    this.setSapStorage(sap);
    this.setIdUtenteSAPStorage(id);
  }

  /**
   * Sets id utente della sap in session storage
   * @param id idutente
   */
  public setIdUtenteSAPStorage(id: number) {
    this.storageService.setItem<number>(
      SessionStorageService.IDUTENTESAP,
      id
    );
    this.idUtenteSapUpdate.next(id);
  }

  /**
   * Sets sap sezioni fascicolo update
   * @param sezioni del fascicolo
   */
  public setSapSezioniUpdate(...sezioni: SezioniSAP[]) {
    const modifiche: ModificheSAP = this.getSezioniModStorage();
    sezioni.forEach(sezione => {
      const i = modifiche.elencoModifiche.findIndex(s => s.key === sezione);
      modifiche.elencoModifiche[i] = { key: sezione, value: true };
    });
    modifiche.sapModificata = true;
    this.setSapSezioniStorage(modifiche);
  }

  /**
   * Sets sap sezioni del fascicolo modificate in session storage
   * @param modifiche sezioni della scheda fascicolo
   */
  private setSapSezioniStorage(modifiche: ModificheSAP) {
    this.storageService.setItem<ModificheSAP>(
      SessionStorageService.SEZIONI_MODIFICATE_SAP,
      modifiche
    );
    this.modificheSAPUpdate.next(modifiche);
  }

  /**
   * Gets id utente sapstorage
   * @returns id utente sapstorage
   */
  private getIdUtenteSAPStorage(): number {
    return this.storageService.getItem<number>(
      SessionStorageService.IDUTENTESAP,
      true
    );
  }

  /**
   * Determines whether sap modificata is
   * @returns sap modificata
   */
  public async isSapModificata(): Promise<boolean> {
    const modifiche = this.getSezioniModStorage();
    if (modifiche.sapModificata) {
      return true;
    }
    return false;
  }

  /**
   * Gets sezioni modifacate dal session  storage
   * @returns sezioni modificate presenti in storage
   */
  public getSezioniModStorage(): ModificheSAP {
    let modifiche = this.storageService.getItem<ModificheSAP>(
      SessionStorageService.SEZIONI_MODIFICATE_SAP,
      true
    );
    if (isNullOrUndefined(modifiche) || isNullOrUndefined(modifiche.elencoModifiche)) {
      modifiche = this.inizializzaModificaSAP();
    }
    return modifiche;
  }

  /**
   * Sets esito salvataggio fascicolo in sessione
   * @param esito operazione save
   */
  public setEsitoSave(esito: EsitoSaveErrato) {
    this.storageService.setItem<EsitoSaveErrato>(
      SessionStorageService.ESITO_SAVE_SAP,
      esito
    );
    this.esitoSaveUpdate.next(esito);
  }

  /**
   * Gets esito operazione save dalla sessione
   * @returns esito save presente in sessione
   */
  public async getEsitoSave(): Promise<EsitoSaveErrato> {
    return this.storageService.getItem<EsitoSaveErrato>(
      SessionStorageService.ESITO_SAVE_SAP,
      true
    );
  }

  /**
   * Azzeras modifiche sap
   */
  public azzeraModificheSap() {
    const modifiche = this.inizializzaModificaSAP();
    this.storageService.setItem<ModificheSAP>(
      SessionStorageService.SEZIONI_MODIFICATE_SAP,
      modifiche
    );
  }

  /**
   * Inizializza dati modifiche  sap
   * @returns modifiche sezioni fascicolo sap
   */
  private inizializzaModificaSAP(): ModificheSAP {
    const nuovo: ModificheSAP = {
      sapModificata: false,
      elencoModifiche: []
    };
    const sezioni = Object.keys(SezioniSAP).filter((item) => {
      return isNaN(Number(item));
    });
    for (let i = 0; i < sezioni.length; i++) {
      nuovo.elencoModifiche.push({ key: sezioni[i], value: false });
    }
    return nuovo;
  }

  /**
   * Gets sap$
   *  restituisce la scheda anagrafica
   *   dalla sessione quando identificativo utente è lo stesso
   *   altrimenti richiama servizio
   *
   * @param [idUtente] identificativo utente
   * @param [codAmbito] ambito dal quale è partita la richiesta
   * @returns sap$
   */
  public async getSap$(
    idUtente?: number, codAmbito?: string
  ): Promise<SchedaAnagraficoProfessionale> {

    if (idUtente) {
      const id = this.getIdUtenteSAPStorage();
      if (isNullOrUndefined(id) || id !== idUtente) {
        return this.getSchedaAnagraficoProfessionale$(idUtente);
      }
    }
    const sap = this.getSapStorage();
    if (sap) {
      return sap;
    }
    return this.getSchedaAnagraficoProfessionale$(
      this.getUtenteStorage().id_utente,
      true
    );
  }

  /**
   * Gets sap by silp dal session storage
   * @returns scheda anagrafica fascicolo
   */
  private getSapBySilpStorage() {
    return this.storageService.getItem<SchedaAnagraficoProfessionale>(
      SessionStorageService.SAPBYSILP,
      true
    );
  }

  /**
   * Gets sap by silp$
   * @param [id] identificativo lavoratore SILP
   * @returns sap scheda anagrafica
   */
  public async getSapBySilp$(id?: number): Promise<SchedaAnagraficoProfessionale> {

    let sapBySilp = this.getSapBySilpStorage();
    if (isNullOrUndefined(sapBySilp)
      || isNullOrUndefined(sapBySilp.id_sil_lav_anagrafica)
      || id !== sapBySilp.id_sil_lav_anagrafica) {

      // impostato ambito a FASC perchè altrimenti non riusciva a recuperare la sap dell'utente.
      sapBySilp = await this.businessService
        .getSAPBySILP(id, Ambito.FASC)
        .pipe(
          this.catchError()
        )
        .toPromise();
    }

    return sapBySilp;
  }

  private catchError() {
    return catchError((err: HttpErrorResponse) => {
      const errore = err.error || err;
      switch (+errore.code || errore.status) {
        case 403:
        case 500:
        default:
          // Errore generico
          throw new Error(errore.errorMessage || errore.message);
      }
    });
  }

  /**
   * Gets scheda anagrafico professionale$
   * @param id identificativo utente
   * @param [save] se true salva dati in sessione
   *
   *  scheda anagrafico professionale$
   */

  // UNIFICATO METODO CON IL COMMON-CITTADINO AGGIUNGENDO IL TRY-CATCH
  private getSchedaAnagraficoProfessionale$(
    id: number,
    save = false
  ): Promise<SchedaAnagraficoProfessionale> {
    try {
      return this.businessService
        .getSAP(id)
        .pipe(
          catchError((e) => UtilitiesService.throwHttpError(e)),
          tap((sap: SchedaAnagraficoProfessionale) => save &&
            this.setSapAndIdUtenteStorage(sap, id))
        ).toPromise();
    } catch (error) {
      return undefined;
    }

  }

  /**
   * Saves fascicolo sap
   * @returns esito salvataggio
   */
  public async saveSap(): Promise<Esito> {
    const sezioni: string[] = [SezioniSAP.DATI_ANAGRAFICI];
    return this.saveSezioniSap(sezioni);
  }

  /**
   * Saves sezioni sap
   * @param sezioni array sezioni modificate
   * @returns esito salvataggio
   *
   * UNIFICATO CON COMMON-CITTADINO DOVE NON ESISTEVA IL PARAM AMBITO
   *  codice_ambito: this.getAmbito(),
   */
  public async saveSezioniSap(sezioni: string[]): Promise<Esito> {
    try {
      const sap = await this.getSap$();
      const parm: ParametriSalvataggioSAP = {
        codice_ambito: this.getAmbito(),
        sap: sap,
        sezioni: sezioni
      };
      return this.businessService
        .saveSAP(this.getUtenteStorage().id_utente, parm)
        .pipe(
          catchError(err => {
            this.logService.error(
              '[commonPslpService::saveSezioniSap]',
              JSON.stringify(err)
            );
            const errore: ErrorDef =
              err instanceof HttpErrorResponse ? err.error : err;
            const esito: Esito = {
              code: errore.code,
              messaggioCittadino: errore.messaggioCittadino
                ? errore.messaggioCittadino
                : errore.errorMessage
            };
            return of(esito);
          })
        )
        .toPromise();
    } catch (error) {
      return undefined;
    }
  }

  // PROFILING
  /**
   * Sets profilo result
   * @param profiloResult profiling Garanzia Giovani
   */
  public setProfiloResult(profiloResult: ProfilingYG) {
    this.profiloResult = profiloResult;
  }
  /**
   * Gets profilo result$
   * @param [idUtente] identificativo utente
   * @returns profilo result$ profiling Garanzia Giovani
   */
  public async getProfiloResult$(idUtente?: number):
    Promise<ProfilingYG> {
    if (idUtente) {
      return this.getProfilingYG$(idUtente);
    }
    if (this.profiloResult) {
      return this.profiloResult;
    }
    return this.getProfilingYG$(
      this.getUtenteStorage().id_utente, true);
  }
  /**
   * Calcolas profiling$ profiling Garanzia Giovani
   * @param idUtente identificativo utente
   * @param codiceTitoloStudio cod titolo studio
   * @param codiceCondizioneOccupazionale  cod condizione lavoro
   * @param codicePresenzaInItalia cod presenza in italia
   * @param [codiceProvinciaDomicilio] provincia domicilio
   * @param [codiceProvinciaResidenza] provincia residenza
   * @returns profiling$ profiling Garanzia Giovani
   */
  public calcolaProfiling$(
    idUtente: number,
    codiceTitoloStudio: string,
    codiceCondizioneOccupazionale: number,
    codicePresenzaInItalia: number,
    codiceProvinciaDomicilio?: string,
    codiceProvinciaResidenza?: string
  ): Promise<ProfilingYG> {
    const profiloParam: ParametriCalcoloProfilingYG = {
      codice_silp_titolo_studio: codiceTitoloStudio,
      codice_silp_condizione_occupazionale: codiceCondizioneOccupazionale,
      codice_silp_presenza_in_italia: codicePresenzaInItalia,
      codice_ministeriale_provincia: codiceProvinciaDomicilio
        ? codiceProvinciaDomicilio
        : codiceProvinciaResidenza
    };
    return this.businessService
      .calcolaProfilingYG(idUtente, profiloParam)
      .pipe(
        tap(prof => (this.profiloResult = prof)),
        catchError(err => {
          const errore: ErrorDef =
            err instanceof HttpErrorResponse ? err.error : err;
          throw new Error(
            errore.messaggioCittadino
              ? errore.messaggioCittadino
              : errore.errorMessage
          );
        })
      )
      .toPromise();
  }
  /**
   * Gets  profiling Garanzia Giovani
   * @param id identificativo utente
   * @param [save] boolena per salvataggio in global
   * @returns profiling Garanzia Giovani
   */
  private getProfilingYG$(id: number, save = false): Promise<ProfilingYG> {
    return this.businessService
      .getProfilingYG(id)
      .pipe(
        catchError(() => of({} as ProfilingYG)),
        tap((profiling: ProfilingYG) => {
          if (save) {
            this.profiloResult = profiling;
          }
        })
      )
      .toPromise();
  }

  /**
   * Ages common fcpslp service  GESTIONE ETA
   * @param sap scheda anagrafica fascicolo
   * @returns age  età calcolata
   */
  public age(sap: SchedaAnagraficoProfessionale): number {
    if (sap && sap.dataDiNascita) {
      return UtilitiesService.calcAge(sap.dataDiNascita);
    }
    return undefined;
  }

  /**
   * Gets ambito
   * @returns ambito sigla dell'ambito attuale
   *
   * UNIFICATO CON COMMON-CITTADINO CHE AVEVA IL DEFAULT RETURN NULL
   */
  public getAmbito(): string {
    switch (this.AMBITO) {
      case Ambito.FASC:
        return 'FASC';
      case Ambito.COMI:
        return 'COMI';
      case Ambito.GG:
        return 'GG';
      case Ambito.RDC:
        return 'RDC';
      case Ambito.CMDIS:
        return 'CMDIS';
      case Ambito.CMPRO:
        return 'CMPRO';
      default:
        return 'FASC';
    }

  }

  /**
   * Determines whether iscritto is
   * @param esito   riepilogo collocamanto mirato
   * @returns true if iscritto
   */
  public isIscritto(esito: EsitoRiepilogoCollocamentoMirato): boolean {
    if (isNullOrUndefined(esito)) {
      return false;
    }
    if (isNullOrUndefined(esito.iscrizioneAltreCategorie) &&
      isNullOrUndefined(esito.iscrizioneDisabili)) {
      return false;
    }
    return true;

  }
  /**
   * Determines whether necessario cpi is
   * @param esito   riepilogo collocamanto mirato
   * @returns true quando è necessario che l'utente si presenti al cpi di riferimento
   */
  public isNecessarioCpi(esito: EsitoRiepilogoCollocamentoMirato): boolean {

    /*
      se sono presenti entrambe le iscrizioni e tutte attive bisogna recarsi al CPI di appartenenza
       */
    let validoDisabili = false;
    let validoAltre = false;
    if (!isNullOrUndefined(esito)) {
      if (!isNullOrUndefined(esito.iscrizioneDisabili)) {
        if (!esito.iscrizioneDisabili.statoFinale) {
          validoDisabili = true;
        }
      }
      if (!isNullOrUndefined(esito.iscrizioneAltreCategorie)) {
        if (!esito.iscrizioneAltreCategorie.statoFinale) {
          validoAltre = true;
        }
      }
    }
    if (validoAltre && validoDisabili) {
      return true;
    }
    if (validoAltre || validoDisabili) {
      return false;
    }
    return false;
  }
  /**
   * Obbligos domicilio piemonte per modifica
   * @returns true if domicilio piemonte per modifica
   */
  public obbligoDomicilioPiemontePerModifica(): boolean {
    return !this.sezioniModificabiliFuoriPiemonte;
  }


  /**
   * Errores obbligo piemonte
   * @param indirizzo da controllare
   * @returns true se è necessario il domicilio in piemonte in base a parametro su db
   */
  public erroreObbligoPiemonte(indirizzo: Indirizzo): boolean {
    if (this.obbligoDomicilioPiemonte && !this.utilitiesService.isProvinciaInPiemonte(indirizzo)) {
      return true;
    }
    return false;
  }

  /**
   * Inizializzas hard fc
   */
  private inizializzaHardFC() {
    this.setSapBySilpStorage(null);
    this.setSapAndIdUtenteStorage(null, null);
    this.tutore = null;
  }

  /**
   * Inizializzas hard gg
   */
  private inizializzaHardGG() {
    this.operareSoloMinori = false;
    this.tutore = null;
  }

  /**
   * Inizializzas soft fc
   */
  public inizializzaProfilo() {
    this.setProfiloResult(null);
  }

  /**
 * Inizializzas soft
 */
  inizializzaSoft() {
    this.appuntamentoOld = null;
    if (this.AMBITO === Ambito.GG) {
      this.inizializzaProfilo();
    }
  }


  /**
   * Gets collocamento mirato
   * @param id identificativo
   * @returns collocamento mirato
   */
  public async getCollocamentoMirato(id: number): Promise<EsitoRiepilogoCollocamentoMirato> {

    return this.collocamentoMiratoService.getRiepilogoCollocamentoMirato(id).pipe(
      catchError(() => of(null as EsitoRiepilogoCollocamentoMirato)))
      .toPromise();

  }

  /**
   * Gets configurazione familiari a carico
   * @returns configurazione familiari a carico
   */
  public async getConfigurazioneFamiliariAcarico(): Promise<ConfigurazioneFamiliariACarico> {

    return this.collocamentoMiratoService.loadConfigurazioneFamiliariACarico().pipe(
      catchError(() => of(null as ConfigurazioneFamiliariACarico)))
      .toPromise();

  }

  /**
   * Metodo che serve a caricare i seguenti dati:
   *
   * private List<Decodifica> elencoTipoIscrizione  Array<Decodifica>;
   * private List<Decodifica> elencoMotivoIscrizione = new ArrayList<Decodifica>();
   * private List<Decodifica> elencoStatoIscrizione = new ArrayList<Decodifica>();
   * private List<Decodifica> elencoTipoComunicazione = new ArrayList<Decodifica>();
   * private List<CategoriaProtettaDisab> elencoCategoriaProtettaDisabili = new ArrayList<CategoriaProtettaDisab>();
   * private List<CategoriaProtetta> elencoCategoriaProtetta = new ArrayList<CategoriaProtetta>();
   * private List<Decodifica> elencoQualificheNonVedenti = new ArrayList<Decodifica>();
   * private List<Decodifica> elencoCategoriaInvaliditaDisabili = new ArrayList<Decodifica>();
   *
   */
  public async getConfigurazioneCollocamentoMirato(): Promise<ConfigurazioneCollocamentoMirato> {

    return this.legge68.loadConfigurazioniCollocamentoMirato().pipe(
      catchError(() => of(null as ConfigurazioneCollocamentoMirato)))
      .toPromise();

  }

  /**
   * Saves collocamento mirato
   * @param id identificativo
   * @param reddito RedditoCollocamentoMirato
   * @returns EsitoSalvataggioRedditoCollocamentoMirato estito salvataggio collocamento mirato
   */
  public async saveCollocamentoMirato(id: number, reddito: RedditoCollocamentoMirato): Promise<EsitoSalvataggioRedditoCollocamentoMirato> {
    const parm: ParametriSalvataggioRedditoCollocamentoMirato = {
      anno: reddito.anno,
      dataInserimento: reddito.dataInserimento,
      codiceProvincia: reddito.provincia.codice_silp,
      valore: reddito.valore,
      note: reddito.note,
    };
    return this.collocamentoMiratoService.saveRedditoCollocamentoMirato(id, parm).pipe(
      catchError(() => of(null as EsitoSalvataggioRedditoCollocamentoMirato)))
      .toPromise();

  }

  /**
   * Saves dichiarazione
   * @param id identificativo
   * @param dettaglio DettaglioCompletoDichiarazioneFamiliariACarico
   * @returns EsitoSaveDichiarazione esito salvataggio dichiarazione
   */
  public async saveDichiarazione(id: number, dettaglio: DettaglioCompletoDichiarazioneFamiliariACarico): Promise<EsitoSaveDichiarazione> {
    return this.collocamentoMiratoService.saveFamiliariACarico(id, dettaglio).pipe(
      catchError(() => of(null as EsitoSaveDichiarazione)))
      .toPromise();

  }

  /**
   * Annullamentos reddito collocamento mirato
   * @param id identificativo
   * @param reddito RedditoCollocamentoMirato
   * @returns EsitoSalvataggioRedditoCollocamentoMirato esito save reddito collocamento mirato
   */
  public async annullamentoRedditoCollocamentoMirato(id: number, reddito: RedditoCollocamentoMirato): Promise<EsitoSalvataggioRedditoCollocamentoMirato> {
    const parm: ParametriSalvataggioRedditoCollocamentoMirato = {
      anno: reddito.anno,
      dataInserimento: reddito.dataInserimento,
      codiceProvincia: reddito.provincia.codice_silp,
      valore: reddito.valore,
      note: reddito.note,
      idRedditoPerAnnullo: reddito.idReddito,
      motivoAnnullo: "Annullamento da PSLP"
    };
    return this.collocamentoMiratoService.saveRedditoCollocamentoMirato(id, parm).pipe(
      catchError(() => of(null as EsitoSalvataggioRedditoCollocamentoMirato)))
      .toPromise();

  }

  /**
   * Verifica utente fascicolo
   *  esegue controlli di verifica
   */
  public async verificaUtenteFC() {

    this.operareSoloMinori = false;

    const utente = await this.appUserService.verificaEsistenzaUtente();

    if (!utente.id_sil_lav_anagrafica) {
      this.loggaUtenteNonPresenteinSILP();
      this.operareSoloMinori = true;
    }

    // verifica sap
    if (!this.operareSoloMinori) {
      const sapUtente = await this.getSapBySilp$(utente.id_sil_lav_anagrafica);
      if (!sapUtente.identificativo_sap) {
        // Identificativo SAP non presente: blocco operativita'
        this.operareSoloMinori = true;
      }
    }
    // se esiste l'utente allora carico le privacy a lui legate
    if (!isNullOrUndefined(utente.id_utente)) {
      this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(utente.id_utente);
    }

    if (!utente.id_utente) {
      this.logService.log('Verifica utente - Utente non presente in pslp');
      this.loggaOperareSoloMinori();

      return;
    }

    this.loggaOperareSoloMinori();

  }

  private loggaOperareSoloMinori() {
    this.logService.log(
      'Verifica utente - Solo Minori ? ',
      this.operareSoloMinori
    );
  }

  /**
   * Gets MESSAGGI UTENTE ambito fascicolo
   * @param utente portale pslp
   * @returns string messaggio
   */
  private async getUserMessagesFC(
    utente: Utente
  ): Promise<{ active: boolean; msg: string; userMessage: string }> {
    const res = {
      active: true,
      msg: null,
      userMessage: null
    };

    if (!utente.id_sil_lav_anagrafica) {
      res.active = false;
      res.msg = ' - Non risulti essere registrato sulla piattaforma';
      res.userMessage = await this.utilitiesService.getMessage(
        'MI027'
      );
      return res;
    }

    res.userMessage = await this.utilitiesService.getMessage(
      'MI027'
    );
    return res;
  }


  /**
   * Gets sap ambito
   * @param idUtente identificativo utente
   * @param codAmbito codice ambito
   * @returns scheda professionale  ambito
   */
  public async getSapAmbito(idUtente: number, codAmbito: string):
    Promise<SchedaAnagraficoProfessionale> {
    this.creareNuovaSap = false;
    const id = this.getIdUtenteSAPStorage();
    if (isNullOrUndefined(id) || id !== idUtente) {
      return this.getSchedaAnagraficoProfessionaleAmbito$(idUtente, codAmbito);
    }
    const sap = this.getSapStorage();
    if (sap) {
      return sap;
    }
    return this.getSchedaAnagraficoProfessionaleAmbito$(idUtente, codAmbito, true);
  }

  /**
   * Gets sap da session storage
   * @returns fascicolo presente in session storage
   */
  private getSapStorage(): SchedaAnagraficoProfessionale {
    return this.storageService.getItem<SchedaAnagraficoProfessionale>(
      SessionStorageService.SAP,
      true
    );
  }

  /**
   * Gets scheda anagrafico professionale ambito$
   * @param idUtente identificativo utente
   * @param codAmbito codice ambito
   * @param [save] boolean per salvataggio in sessione
   * @returns scheda anagrafico professionale ambito$
   */
  private getSchedaAnagraficoProfessionaleAmbito$(
    idUtente: number,
    codAmbito: string,
    save = false
  ): Promise<SchedaAnagraficoProfessionale> {

    return this.businessService.getSAP(idUtente, codAmbito).pipe(
      catchError((err: HttpErrorResponse) => {
        const errore = err.error || err;
        switch (+errore.code || errore.status) {
          case 404:
            this.creareNuovaSap = true;
            return of(undefined);
          case 500:
          case 403:
          default:
            // Errore generico
            throw new Error(errore.errorMessage || errore.message);
        }
      }),
      tap((sap: SchedaAnagraficoProfessionale) => save && this.setSapAndIdUtenteStorage(sap, idUtente))
    ).toPromise();
  }


  /**
   * Inizializzas sap
   * @param utente portale pslp
   * @returns sap scheda anagrafica inizializzata con dati utente
   */
  public inizializzaSAP(utente: Utente): SchedaAnagraficoProfessionale {
    const sap: SchedaAnagraficoProfessionale = {
      'nome': utente.nome,
      'cognome': utente.cognome,
      'luogoDiNascita': { 'comune': {}, 'stato': {} },
      'residenza': { 'toponimo': {}, 'comune': { 'provincia': {} }, 'stato': {} },
      'domicilio': { 'toponimo': {}, 'comune': { 'provincia': {} }, 'stato': {} },
      'recapito': {},
      'permessoDiSoggiorno': {}, 'codice_fiscale': utente.codice_fiscale
    };
    return sap;
  }

  /**
   * Azzeras storage fascicolo
   */
  public azzeraStorageFascicolo() {
    this.setSapAndIdUtenteStorage(null, null);
    this.setSapBySilpStorage(null);
    this.azzeraModificheSap();
    this.firstPage = null;
  }

  /**
   * Backups storage fascicolo
   */
  public backupStorageFascicolo() {
    const sap = this.getSapStorage();
    const idUtente = this.getIdUtenteSAPStorage();
    const sezioniSAP = this.getSezioniModStorage();

    this.backupIdUtenteSAPStorage(idUtente);
    this.backupSapStorage(sap);
    this.backupSezioniModStorage(sezioniSAP);
  }

  /**
   * Restores storage fascicolo
   */
  public restoreStorageFascicolo() {
    const sap = this.restoreSapStorage();
    const idUtente = this.restoreIdUtenteSAPStorage();
    const sezioniSAP = this.restoreSezioniModStorage();

    this.setSapStorage(sap);
    this.setIdUtenteSAPStorage(idUtente);
    this.setSapSezioniStorage(sezioniSAP);
  }

  /**
   * Restores sap storage
   * @returns sap storage
   */
  private restoreSapStorage(): SchedaAnagraficoProfessionale {
    return this.storageService.getItem<SchedaAnagraficoProfessionale>(
      SessionStorageService.SAP_BACKUP,
      true
    );
  }

  /**
   * Restores id utente sapstorage
   * @returns id utente sapstorage
   */
  private restoreIdUtenteSAPStorage(): number {
    return this.storageService.getItem<number>(
      SessionStorageService.IDUTENTESAP_BACKUP,
      true
    );
  }

  /**
   * Restores sezioni mod storage
   * @returns sezioni mod storage
   */
  private restoreSezioniModStorage(): ModificheSAP {
    let modifiche = this.storageService.getItem<ModificheSAP>(
      SessionStorageService.SEZIONI_MODIFICATE_SAP_BACKUP,
      true
    );
    if (isNullOrUndefined(modifiche) || isNullOrUndefined(modifiche.elencoModifiche)) {
      modifiche = this.inizializzaModificaSAP();
    }
    return modifiche;
  }

  /**
   * Backups sap storage
   * @param sap scheda fascicolo
   */
  private backupSapStorage(sap: SchedaAnagraficoProfessionale) {
    this.storageService.setItem<SchedaAnagraficoProfessionale>(
      SessionStorageService.SAP_BACKUP,
      sap
    );
    this.sapBackupUpdate.next(sap);
  }

  /**
   * Backups id utente sapstorage
   * @param id identificativo utente
   */
  private backupIdUtenteSAPStorage(id: number) {
    this.storageService.setItem<number>(
      SessionStorageService.IDUTENTESAP_BACKUP,
      id
    );
    this.idUtenteSapBackupUpdate.next(id);
  }

  /**
   * Backups sezioni mod storage
   * @param modifiche sezioni fascicolo modificate
   */
  private backupSezioniModStorage(modifiche: ModificheSAP) {
    this.storageService.setItem<ModificheSAP>(
      SessionStorageService.SEZIONI_MODIFICATE_SAP_BACKUP,
      modifiche
    );
    this.modificheSAPBackupUpdate.next(modifiche);
  }

  /**
   * Gets privacy minore
   * @param utenteACarico utente a carico
   * @returns true se presente privacy minore
   */
  public getPrivacyMinore(utenteACarico: UtenteACarico): boolean {
    const ambito = this.getAmbitoPrivacy();
    const prese: Array<UtentePresaVisione> = utenteACarico.prese_visione;
    let privacy = false;
    if (!isNullOrUndefined(prese)) {
      privacy = !isNullOrUndefined(prese.find(s => s.cod_ambito === ambito));
    }
    return privacy;
  }

  /* ***** */

  /**
   * Cleanups date
   * @param date data da ripulire
   * @returns data con orario azzerato
   */
  public cleanupDate(date: Date): Date {
    let res = date;
    if (date instanceof Date) {
      // To GMT
      res = new Date(date.getTime());
      res.setUTCHours(0, 0, 0, 0);
    }
    return res;
  }

  /**
   * Determines whether data compresa is
   * @param dataDaVerificare data da controllare
   * @param dataMin data inizio intervallo
   * @param dataMax data fine intervallo
   * @returns true se data compresa nell'intervallo
   */
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
   * esegue finestra modale di richiesta (es. si/no)
   * @param parametri DialogModaleMessage
   * @returns informazioni restituite dalla finestra modale
   */
  // public richiestaModale(data: DialogModaleMessage): Promise<any> {
  //   return this.pslbasepageService.openModal(data);
  // }

  /**
   * Sets data privacy
   * @param ilAmbitoPrivacy ambito
   * @param dettaglioTestoPrivacy testo di dettaglio
   * @param idUtenteMinorePrivacy identificativo utente
   * @param utenteACarico  UtenteACarico
   */
  public setDataPrivacy(ilAmbitoPrivacy: string, dettaglioTestoPrivacy: string[], idUtenteMinorePrivacy: number, utenteACarico: UtenteACarico) {
    this.ambitoPrivacy = Ambito[ilAmbitoPrivacy];
    this.dettaglioTestoPrivacy = dettaglioTestoPrivacy;
    this.idUtenteMinorePrivacy = idUtenteMinorePrivacy;
    this.utenteACarico = utenteACarico;
  }

  /**
   * Sets info did
   * @param idUtenteMinoreDid identificativo utente minore
   * @param utenteACarico utente a carico
   */
  public setInfoDid(idUtenteMinoreDid: number, utenteACarico: UtenteACarico) {
    this.idUtenteMinoreDid = idUtenteMinoreDid;
    this.utenteACarico = utenteACarico;
  }

  /**
   * Sets ambito privacy
   * @param ilAmbitoPrivacy string codice ambito
   */
  public setAmbitoPrivacy(ilAmbitoPrivacy: string) {
    this.ambitoPrivacy = Ambito[ilAmbitoPrivacy];
  }

  /**
   * Gets ambito privacy
   * @returns [Ambito] ambito privacy
   */
  public getAmbitoPrivacy() {
    return this.ambitoPrivacy;
  }

  /**
   * Gets dettaglio testo privacy
   * @returns string dettaglio
   */
  public getDettaglioTestoPrivacy() {
    return this.dettaglioTestoPrivacy;
  }
  /**
   * Gets id utente minore privacy
   * @returns identificativo utente minore
   */
  public getIdUtenteMinorePrivacy() {
    return this.idUtenteMinorePrivacy;
  }
  /**
   * Gets id utente minore did
   * @returns identificativo utente minore
   */
  public getIdUtenteMinoreDid() {
    return this.idUtenteMinoreDid;
  }
  /**
   * Gets utente acarico privacy
   * @returns utente a carico
   */
  public getUtenteACaricoPrivacy() {
    return this.utenteACarico;
  }
  /**
   * Gets utente a carico did
   * @returns utente a carico
   */
  public getUtenteACaricoDid() {
    return this.utenteACarico;
  }

  /**
     * Verificas utente
     * @returns void
     */
  async verificaUtente() {
    switch (this.AMBITO) {
      case Ambito.GG:
        return this.verificaUtenteGG();
      case Ambito.RDC:
        return this.verificaUtenteRDC();
      default:
        break;
    }
  }

  /**
   * Verifica utente GARANZIA GIOVANI
   *
   */
  private async verificaUtenteGG() {
    let sapUtente: SchedaAnagraficoProfessionale = null;
    const utente = await this.appUserService.verificaEsistenzaUtente();

    if (this.isUtentePresente(utente)) {
      sapUtente = await this.getSapBySilpCittadino$(utente.id_sil_lav_anagrafica);
    }

    const verificaAdesione = (id: number): Promise<AdesioneYG> =>
      this.businessService.getAdesioneYG(id).pipe(
        catchError(() => of(undefined))
      ).toPromise();
    const verificaAdesioneSilp = (idSilp: number): Promise<AdesioneYG> =>
      this.businessService.getAdesioneYGBySILP(idSilp).pipe(
        catchError(() => of(undefined))
      ).toPromise();
    const cercaMinoriACarico = (id: number): Promise<UtenteACarico[]> =>
      this.businessService.findUtentiACarico(id).pipe(
        catchError(() => of([] as UtenteACarico[]))
      ).toPromise();

    this.operareSoloMinori = false;
    this.appuntamentiFlag = false;

    if (!utente.id_sil_lav_anagrafica) {
      this.loggaUtenteNonPresenteinSILP();
      this.operareSoloMinori = true;
    }

    // verifica sap
    sapUtente = await this.verificheSap(utente, sapUtente);
    // Verifica adesione
    await this.verificaAdesione(utente, verificaAdesioneSilp, verificaAdesione);

    if (!utente.id_utente) {
      this.logService.log('Verifica utente - Utente non presente in pslp');
      this.loggaOperareSoloMinori();
      this.logService.log(CommonPslpService.VERIFICA_UTENTE_APPUNTAMENTI, this.appuntamentiFlag);
      return;
    }

    // verifico appuntamenti per se
    const appuntamenti = await this.cercaIncontri(utente.id_utente);
    this.appuntamentiFlag = appuntamenti.length > 0;
    this.logService.log('Verifica utente - Utente ha ', appuntamenti.length, ' appuntamenti');

    // verifico appuntamenti per minori
    await this.verificaAppuntamentoMinori(cercaMinoriACarico, utente);

    this.loggaOperareSoloMinori();
    this.logService.log(CommonPslpService.VERIFICA_UTENTE_APPUNTAMENTI, this.appuntamentiFlag);
  }

  /**
 * Verifiches sap
 * @param utente pslp
 * @param sapUtente fascicolo
 * @returns scheda
 */
  private async verificheSap(utente: Utente, sapUtente: SchedaAnagraficoProfessionale) {
    if (!this.operareSoloMinori) {
      if (this.isUtentePresente(utente)) {
        sapUtente = await this.getSapBySilpCittadino$(utente.id_sil_lav_anagrafica);
      }
      if (this.isSapNonPresente(sapUtente)) {
        // Identificativo SAP non presente: blocco operativita'
        this.operareSoloMinori = true;
      }
    }
    return sapUtente;
  }



  /**
 * Determines whether utente presente is
 * @param utente pslp
 * @returns true se utente presente con identificativo SILP
 */
  private isUtentePresente(utente: Utente) {
    return !isNullOrUndefined(utente) && !isNullOrUndefined(utente.id_sil_lav_anagrafica);
  }


  /**
   * Verificas utente rdc
   */
  private async verificaUtenteRDC() {
    this.appuntamentiFlag = false;

    // Verifica domanda
    const utente = await this.appUserService.verificaEsistenzaUtente();
    const domandaRDC = await this.verificaDomandaRDC(utente.id_sil_lav_anagrafica);
    this.storageService.setItem(SessionStorageService.DOMANDA_RDC, domandaRDC);
    if (!domandaRDC || (domandaRDC.stato_politica_rc1 && domandaRDC.stato_politica_rc1 !== '01')) {
      this.logService.log('Verifica utente - Utente non ha domanda RdC');
      const msg = await this.utilitiesService.getMessage('ME046');
      throw new Error(msg);
    }

    // verifico appuntamenti
    if (utente.id_utente) {
      const appuntamenti = await this.cercaIncontri(utente.id_utente);
      this.appuntamentiFlag = appuntamenti.length > 0;
    }
    this.logService.log(CommonPslpService.VERIFICA_UTENTE_APPUNTAMENTI, this.appuntamentiFlag);
  }

  /**
   * Verificas utente did
   *  esegue controlli di verifica iniziali
   */
  public async verificaUtenteDID() {
    let sapUtente: SchedaAnagraficoProfessionale = null;
    const utente = await this.appUserService.verificaEsistenzaUtente();
    this.operareSoloMinori = false;
    if (!utente.id_sil_lav_anagrafica) {
      this.loggaUtenteNonPresenteinSILP();
      this.operareSoloMinori = true;
    }

    // verifica sap
    if (!this.operareSoloMinori) {
      if (!isNullOrUndefined(utente) && !isNullOrUndefined(utente.id_sil_lav_anagrafica)) {
        sapUtente = await this.getSapBySilp$(utente.id_sil_lav_anagrafica);
      }
      if (isNullOrUndefined(sapUtente) || isNullOrUndefined(sapUtente.identificativo_sap)) {
        // Identificativo SAP non presente: blocco operativita'
        this.operareSoloMinori = true;
      }
    }
  }

  private loggaUtenteNonPresenteinSILP() {
    this.logService.log('Verifica utente - Utente non presente in silp');
  }

  /**
   * Verificas adesione
   * @param utente  pslp
   * @param verificaAdesioneSilp verifica adesione con identificativo silp
   * @param verificaAdesione verifica con id utente
   */
  private async verificaAdesione(utente: Utente, verificaAdesioneSilp: (idSilp: number) => Promise<AdesioneYG>, verificaAdesione: (id: number) => Promise<AdesioneYG>) {
    if (this.isMaggiorenneConUtente(utente)) {
      const adesioneGG = await (utente.id_sil_lav_anagrafica
        ? verificaAdesioneSilp(utente.id_sil_lav_anagrafica)
        : verificaAdesione(utente.id_utente));
      this.storageService.setItem(SessionStorageService.ADESIONE_GG, adesioneGG);
      if (this.isSenzaAdesioneAttiva(adesioneGG)) {
        this.logService.log('Verifica utente - Utente non ha l\'adesione (', adesioneGG, ')');
        this.operareSoloMinori = true;
      }
    }
  }


  /**
   * Cercas incontri
   * @param id identificativo
   * @returns incontri
   */
  private cercaIncontri(id: number): Promise<PrenotazioneIncontro[]> {
    return this.businessService.findIncontri(id, this.getAmbito()).pipe(
      catchError(() => of([] as PrenotazioneIncontro[]))
    ).toPromise();
  }

  /**
   * Verificas appuntamento minori
   * @param cercaMinoriACarico identificativo
   * @param utente utente pslp
   */
  private async verificaAppuntamentoMinori(cercaMinoriACarico: (id: number) => Promise<UtenteACarico[]>, utente: Utente) {
    if (!this.appuntamentiFlag) {
      const minori: UtenteACarico[] = await cercaMinoriACarico(utente.id_utente);
      if (this.sonoPresentiMinori(minori)) {
        const data: PrenotazioneIncontro[][] = await Promise.all(
          minori.map(
            minore => this.cercaIncontri(minore.tutelato.id_utente)
          )
        );
        this.appuntamentiFlag = data.some(incontri => incontri.length > 0);
        this.logService.log('Verifica utente - Utente ha ', data.length, ' minori con appuntamenti');
      }
    }
  }

  /**
   * Determines whether sap non presente is
   * @param sapUtente scheda anagrafica
   * @returns true se sulla scheda esiste identificativo lavoratore SILP
   */
  private isSapNonPresente(sapUtente: SchedaAnagraficoProfessionale) {
    return isNullOrUndefined(sapUtente) || isNullOrUndefined(sapUtente.identificativo_sap);
  }

  /**
   * Verificas domanda rdc
   * @param idSilp identificativo lavoratore SILP
   * @returns domanda rdc
   */
  private verificaDomandaRDC(idSilp: number): Promise<DomandaRDC> {
    return this.businessService.getDomandaRDCBySILP(idSilp).pipe(
      catchError(() => of(undefined))
    ).toPromise();
  }

  /**
 * Determines whether maggiorenne con utente is
 * @param utente pslp
 * @returns true se utente ha possibilità di operare e identificativo proprio SILP o pslp
 */
  private isMaggiorenneConUtente(utente: Utente) {
    return !this.operareSoloMinori && (utente.id_sil_lav_anagrafica || utente.id_utente);
  }

  /**
   * Determines whether senza adesione attiva is
   * @param adesioneGG AdesioneYG
   * @returns true se adesione assente o non attiva
   */
  private isSenzaAdesioneAttiva(adesioneGG: AdesioneYG) {
    return !adesioneGG || adesioneGG.codice !== 'A';
  }

  /**
   * Sonos presenti minori
   * @param minori elenco utenti a carico
   * @returns true se ci sono minori a carico
   */
  private sonoPresentiMinori(minori: UtenteACarico[]) {
    return minori !== undefined && minori.length > 0;
  }

  // MESSAGGI UTENTE
  /**
   * Gets user messages garanzia giovani
   * @param utente pslp
   * @returns user messages gg
   */
  private async getUserMessagesGG(utente: Utente): Promise<{ active: boolean, msg: string, userMessage: string }> {
    const res = {
      active: true,
      msg: null,
      userMessage: null
    };

    if (!utente.id_sil_lav_anagrafica) {
      res.active = false;
      res.msg = ' - Non risulti essere registrato sulla piattaforma';
      res.userMessage = await this.utilitiesService.getMessage('MI002');
      return res;
    }
    const ownAdesione: AdesioneYG = this.storageService.getItem(SessionStorageService.ADESIONE_GG, true);
    if (!ownAdesione) {
      res.active = false;
      res.msg = ' - Non è presente l\'adesione';
      res.userMessage = await this.utilitiesService.getMessage('MI003');
      return res;
    }

    if (ownAdesione.codice !== 'A' || !isNullOrUndefined(ownAdesione.data_rifiuto)) {
      res.active = false;
      res.msg = ' - L\'adesione non è valida';
      res.userMessage = await this.utilitiesService.getMessage('MI004');
      return res;
    }
    const ownAppuntamento: PrenotazioneIncontro = this.storageService.getItem(SessionStorageService.OWN_APPUNTAMENTO, true);

    if (isNullOrUndefined(ownAppuntamento) || isNullOrUndefined(ownAppuntamento.id_prenotazione)) {
      res.active = false;
      res.msg = ' - Non è presente un appuntamento a proprio nome';
      res.userMessage = await this.utilitiesService.getMessage('MI005');
      return res;
    }

    if (ownAppuntamento
      && ownAppuntamento.id_prenotazione
      && (ownAppuntamento.codice_anpal_stato_incontro === 'DE'
        || ownAppuntamento.codice_anpal_stato_incontro === 'ER')) {
      res.active = false;
      res.msg = ' - É già presente un appuntamento a proprio nome';
      let msgCod = 'MI007';
      if (ownAppuntamento.cod_ambito === 'RDC') {
        msgCod = 'MI017';
      }
      res.userMessage = await this.utilitiesService.getMessage(msgCod);
      return res;
    }
    res.userMessage = await this.utilitiesService.getMessage('MI010');
    return res;
  }

  // MESSAGGI UTENTE
  /**
   * Gets user messages rdc
   * @param utente pslp
   * @returns user messages rdc
   *
   *
   */
  private async getUserMessagesRDC(utente: Utente): Promise<{ active: boolean, msg: string, userMessage: string }> {
    const res = {
      active: true,
      msg: null,
      userMessage: null
    };
    const ownAppuntamento: PrenotazioneIncontro = this.storageService.getItem(SessionStorageService.OWN_APPUNTAMENTO, true);
    if (isNullOrUndefined(ownAppuntamento) || isNullOrUndefined(ownAppuntamento.id_prenotazione)) {
      res.active = false;
      res.msg = ' - Non è presente un appuntamento a proprio nome';
      res.userMessage = await this.utilitiesService.getMessage('MI033');
    } else if (ownAppuntamento && ownAppuntamento.id_prenotazione && (ownAppuntamento.codice_anpal_stato_incontro === 'DE' || ownAppuntamento.codice_anpal_stato_incontro === 'ER')) {
      res.active = false;
      res.msg = ' - É già presente un appuntamento per te';
      res.userMessage = await this.utilitiesService.getMessage('MI017');
    } else {
      res.userMessage = await this.utilitiesService.getMessage('MI034');
    }
    return res;
  }

  /**
   * Gets sap by silp$
   * @param [id] identificativo silp
   * @returns sap by silp$
   */


  public async getSapBySilpCittadino$(id?: number): Promise<SchedaAnagraficoProfessionale> {
    const errorMessage = await this.utilitiesService.getMessage('ME002');
    return this.businessService.getSAPBySILP(id).pipe(
      /*    catchError(() => of({} as SchedaAnagraficoProfessionale)),
        ).toPromise(); */
      catchError((err: HttpErrorResponse) => {
        const errore = err.error || err;
        switch (+errore.code || errore.status) {

          case 500:
            throw new Error(errorMessage);

          default:
            return of(undefined);
        }
      })
    ).toPromise();
  }


  // INFORMAZIONI AGGIUNTIVE
  /**
   * Sets informazione aggiuntiva extend
   * @param infoExt array InformazioneAggiuntivaExtend
   */
  public setInformazioneAggiuntivaExtend(infoExt: InformazioneAggiuntivaExtend[]) {
    this.storageService.setItem<InformazioneAggiuntivaExtend[]>(SessionStorageService.INFORMAZIONI_AGGIUNTIVE, infoExt);
    this.informazioniAggiuntiveExtendUpdate.next(infoExt);
  }
  /**
   * Gets informazione aggiuntiva extend$
   * @param [idUtente] identificativo
   * @param [forceReload] rilegge da sessione
   * @returns informazione aggiuntiva extend$
   */
  public getInformazioneAggiuntivaExtend$(idUtente?: number, forceReload: boolean = false):
    InformazioneAggiuntivaExtend[] | Promise<InformazioneAggiuntivaExtend[]> {
    if (idUtente) {
      return this.getInformazioniAggiuntive$(idUtente, forceReload);
    }
    if (!forceReload) {
      const infoExt = this.storageService.getItem<InformazioneAggiuntivaExtend[]>(SessionStorageService.INFORMAZIONI_AGGIUNTIVE, true);
      if (infoExt) {
        return infoExt;
      }
    }
    return this.getInformazioniAggiuntive$(this.getUtenteStorage().id_utente, true);
  }
  /**
   * Adds informazione aggiuntiva extend$
   * @param informazioneAggiuntiva InformazioneAggiuntiva
   * @returns informazione aggiuntiva extend$
   */
  public async addInformazioneAggiuntivaExtend$(informazioneAggiuntiva: InformazioneAggiuntiva): Promise<boolean> {
    let infoAggExt = await this.getInformazioneAggiuntivaExtend$();
    infoAggExt = infoAggExt || [];
    const oldNewData = infoAggExt.find(iae =>
      iae.informazioneAggiuntiva.codice_configurazione === informazioneAggiuntiva.codice_configurazione && iae.new);
    if (oldNewData) {
      return false;
    }
    infoAggExt.push({
      'informazioneAggiuntiva': informazioneAggiuntiva,
      'new': true
    });
    this.setInformazioneAggiuntivaExtend(infoAggExt);
    this.informazioniAggiuntiveExtendUpdate.next(infoAggExt);
    return true;
  }
  /**
   * Removes informazione aggiuntiva extend
   * @param informazioneAggiuntiva InformazioneAggiuntivaExtend
   * @returns informazione aggiuntiva extend
   */
  public async removeInformazioneAggiuntivaExtend(informazioneAggiuntiva: InformazioneAggiuntivaExtend): Promise<boolean> {
    let infoAggExt = await this.getInformazioneAggiuntivaExtend$();
    if (!informazioneAggiuntiva.new) {
      return false;
    }
    infoAggExt = (infoAggExt || []).filter(el =>
      !el.new || el.informazioneAggiuntiva.codice_configurazione !== informazioneAggiuntiva.informazioneAggiuntiva.codice_configurazione);
    this.setInformazioneAggiuntivaExtend(infoAggExt);
    this.informazioniAggiuntiveExtendUpdate.next(infoAggExt);
    return true;
  }
  /**
   * Gets informazioni aggiuntive$
   * @param id identificativo
   * @param [save] se true aggiunge a sessione
   * @returns informazioni aggiuntive$
   */
  private getInformazioniAggiuntive$(id: number, save = false): Promise<InformazioneAggiuntivaExtend[]> {
    return this.businessService.findInformazioniAggiuntive(id, this.getAmbito()).pipe(
      catchError(() => of([] as InformazioneAggiuntiva[])),
      map((value: InformazioneAggiuntiva[]) => (value || [])
        .map(informazioneAggiuntiva => ({ ...informazioneAggiuntiva, data: new Date(informazioneAggiuntiva.data) }))
        .map(informazioneAggiuntiva => ({
          'informazioneAggiuntiva': informazioneAggiuntiva,
          'descrizione': '',
          'new': false
        }))),
      tap((info: InformazioneAggiuntivaExtend[]) => save && this.setInformazioneAggiuntivaExtend(info))
    ).toPromise();
  }
  /**
   * Saves informazione aggiuntiva extend
   *
   */
  public async saveInformazioneAggiuntivaExtend() {
    const infoAggExt = await this.getInformazioneAggiuntivaExtend$();
    return Promise.all(
      (infoAggExt || [])
        .filter(v => v.new === true)
        .map(infoExt => {
          infoExt.new = false;
          return this.businessService.saveInformazioniAggiuntive(this.getUtenteStorage().id_utente, infoExt.informazioneAggiuntiva).pipe(
            tap((info: InformazioneAggiuntiva) => infoExt.informazioneAggiuntiva.codice = info.codice),
            catchError(err => {
              const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
              throw new Error(errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage);
            })
          ).toPromise();
        })
    );
  }

  // ADESIONE GARANZIA GIOVANI
  /**
   * Sets adesione
   * @param adesione granzia giovani
   */
  public setAdesione(adesione: AdesioneYG) {
    this.adesione = adesione;
    this.adesioneUpdate.next(this.adesione);
  }
  /**
   * Gets adesione$
   * @param [idUtente] identificativo utente
   * @returns adesione$
   */
  public async getAdesione$(idUtente?: number): Promise<AdesioneYG> {
    if (idUtente) {
      return this.getAdesioneYG$(idUtente);
    }
    if (this.adesione) {
      return this.adesione;
    }
    return this.getAdesioneYG$(this.getUtenteStorage().id_utente, true);
  }
  /**
   * Gets adesione by silp$
   * @param [id] identificativo lavoratore silp
   * @returns adesione by silp$
   */
  public getAdesioneBySilp$(id?: number): AdesioneYG | Promise<AdesioneYG> {
    return this.businessService.getAdesioneYGBySILP(id).pipe(
      catchError(() => of({} as AdesioneYG)),
    ).toPromise();
  }
  /**
   * Gets adesione yg$
   * @param id identificativo utente
   * @param [save] se true salva
   * @returns adesione yg$
   */
  private getAdesioneYG$(id: number, save = false): Promise<AdesioneYG> {
    return this.businessService.getAdesioneYG(id).pipe(
      catchError(() => of({} as AdesioneYG)),
      tap((adesione: AdesioneYG) => {
        if (save) {
          this.adesione = adesione;
        }
      })
    ).toPromise();
  }

  // DOMANDA REDDITO DI CITTADINANZA
  /**
   * Sets domanda
   * @param domandaRDC Domanda RDC
   */
  public setDomanda(domandaRDC: DomandaRDC) {
    this.domandaRDC = domandaRDC;
    this.domandaUpdate.next(this.domandaRDC);
  }
  /**
   * Gets domanda$
   * @param [idUtente] identificativo
   * @returns domanda$
   */
  public getDomanda$(idUtente?: number): DomandaRDC | Promise<DomandaRDC> {
    if (idUtente) {
      return this.getDomandaRDC$(idUtente);
    }
    if (this.domandaRDC) {
      return this.domandaRDC;
    }
    return this.getDomandaRDC$(this.getUtenteStorage().id_utente, true);
  }
  /**
   * Gets domanda rdcby silp$
   * @param [id] identificativo
   * @returns domanda rdcby silp$
   */
  public getDomandaRDCBySilp$(id?: number): DomandaRDC | Promise<DomandaRDC> {
    return this.businessService.getDomandaRDCBySILP(id).pipe(
      catchError(() => of({} as DomandaRDC)),
    ).toPromise();
  }
  /**
   * Gets domanda rdc$
   * @param id identificativo
   * @param [save]  se true salva
   * @returns domanda rdc$
   */
  private getDomandaRDC$(id: number, save = false): Promise<DomandaRDC> {
    return this.businessService.getDomandaRDC(id).pipe(
      catchError(() => of({} as DomandaRDC)),
      tap((domandaRDC: DomandaRDC) => {
        if (save) {
          this.domandaRDC = domandaRDC;
        }
      })
    ).toPromise();
  }

  // ALLEGATI
  /**
   * Sets allegati
   * allegati array Documento
   */
  public setAllegati(allegati: Documento[]) {
    this.storageService.setItem<Documento[]>(SessionStorageService.ALLEGATI, allegati);
    this.allegatiUpdate.next(allegati);
  }
  /**
   * Gets allegati$ da sessione
   * @returns allegati$  array Documento
   */
  public async getAllegati$(): Promise<Documento[]> {
    const allegati = this.storageService.getItem<Documento[]>(SessionStorageService.ALLEGATI, true);
    if (allegati) {
      return allegati;
    }
    return [];
  }
  /**
   * Adds allegati
   * @param allegato Documento
   */
  public addAllegati(allegato) {
    let allegati = this.storageService.getItem<Documento[]>(SessionStorageService.ALLEGATI, true);
    allegati = allegati || [];
    allegati.push(allegato);
    this.setAllegati(allegati);
    this.allegatiUpdate.next(allegati);
  }

  // GESTIONE ETA
  /**
   * Age$s common pslp service
   * @param [idUtente] identificativo
   * @returns age$ eta calcolata da scheda anagrafica
   */
  public async age$(idUtente?: number): Promise<number> {
    const sap = await this.getSap$(idUtente);
    if (sap && sap.dataDiNascita) {
      return UtilitiesService.calcAge(sap.dataDiNascita);
    }
    return undefined;
  }

  /**
   * Determines whether minorenne$ is
   * @param [idUtente] identificativo
   * @returns true se minorenne
   */
  public async isMinorenne$(idUtente?: number): Promise<boolean> {
    const eta = await this.age$(idUtente);
    return eta != null && eta < 18;
  }

  /**
   * Determines whether minorenne sap is
   * @param sap scheda anagrfica
   * @returns true if minorenne sap
   */
  public isMinorenneSap(sap: SchedaAnagraficoProfessionale): boolean {
    let eta = null;
    if (sap && sap.dataDiNascita) {
      eta = UtilitiesService.calcAge(sap.dataDiNascita);
    }
    return eta != null && eta < 18;
  }

  /**
 * Determines whether sap coerente gg is
 * @param sap scheda
 * @returns sap coerente gg
 */
  public async isSapCoerenteGG(sap: SchedaAnagraficoProfessionale): Promise<boolean> {
    let eta = null;
    const etaMin = await this.parametriSistemaService.etaMinGG;
    const etaMax = await this.parametriSistemaService.etaMaxGG;
    if (sap && sap.dataDiNascita) {
      eta = UtilitiesService.calcAge(sap.dataDiNascita);
    }
    return eta != null && (eta >= etaMin && eta <= etaMax);
  }

  public setDataIscrizione(idUtenteMinore: number, utenteACarico: UtenteACarico) {

    this.idUtenteMinore = idUtenteMinore;
    this.utenteACarico = utenteACarico;
  }

  /**
 * Determines whether sap domicilio piemonte is
 * @param sap scheda anagrafica
 * @returns true if sap domicilio piemonte
 */
  public isSapDomicilioPiemonte(sap: SchedaAnagraficoProfessionale): boolean {
    return sap &&
      this.utilitiesService.isProvinciaInPiemonte(sap.domicilio);
  }

  /**
* Gets id utente minore
* @returns identificativo utente
*/
  public getIdUtenteMinore() {
    return this.idUtenteMinore;
  }

  public async ricercaDettaglioDIDService(idUtente: number): Promise<EsitoDettaglioDid> {
    return this.didService.ricercaDettaglioDIDService(idUtente).pipe(
      catchError(err => of(null as EsitoDettaglioDid))
    ).toPromise();
  }

  /**
   * Gets Dettaglio Iscrizione Collocamento Mirato
   *  restituisce il dettaglio iscrizione collocamento Mirato
   *   dalla sessione quando identificativo richiesta è lo stesso
   *   altrimenti richiama servizio
   *
   * @param [idRichiesta] identificativo univoco richiesta
   *
   * @returns DettaglioRichiestaIscrizioneL68
   */
   public async getDettaglioIscrizioneL68$(
     idUtente?: number,
    idRichiesta?: number
  ): Promise<DettaglioRichiestaIscrizioneL68> {

    if (idRichiesta) {
      const id = this.getIdRichiestaIscrizioneStorage();
      if (isNullOrUndefined(id) || id !== idRichiesta) {
        return this.getDettaglioRichiestaIscrizione$(idUtente, idRichiesta);
      }
    }
    const detRichiesta = this.getRichiestaIscrizioneStorage();
    if (detRichiesta) {
      return detRichiesta;
    }
    return this.getDettaglioRichiestaIscrizione$(
      this.getUtenteStorage().id_utente, idRichiesta,
      true
    );
  }

  /**
   * Gets id richiesta in storage
   * @returns id richiesta presente in storage
   */
   private getIdRichiestaIscrizioneStorage(): number {
    return this.storageService.getItem<number>(
      SessionStorageService.COMI_ID_RICHIESTA_ISCRIZIONE,
      true
    );
  }

  /**
   * Gets dettaglio richiesta in storage
   * @returns la richiesta presente in storage
   */
   private getRichiestaIscrizioneStorage(): DettaglioRichiestaIscrizioneL68 {
    return this.storageService.getItem<DettaglioRichiestaIscrizioneL68>(
      SessionStorageService.COMI_DETTAGLIO_ISCRIZIONE,
      true
    );
  }

  resetRichiestaIscrizioneStorage(): void{
    this.storageService.setItem<DettaglioRichiestaIscrizioneL68>(SessionStorageService.COMI_DETTAGLIO_ISCRIZIONE, null);
    this.dettaglioRichiestaUpdate.next(null);
    this.storageService.setItem<number>(
      SessionStorageService.COMI_ID_RICHIESTA_ISCRIZIONE,
      null
    );
    this.idRichiestaUpdate.next(null);
  }

  /**
   * Sets richiesta iscrizione in storage
   * @param dettaglio  DettaglioRichiestaIscrizioneL68
   */
  setRichiestaIscrizioneStorage(dettaglio: DettaglioRichiestaIscrizioneL68): void {
    this.storageService.setItem<DettaglioRichiestaIscrizioneL68>(SessionStorageService.COMI_DETTAGLIO_ISCRIZIONE, dettaglio);
    this.dettaglioRichiestaUpdate.next(dettaglio);
    let id: number;
    if (!isNullOrUndefined(dettaglio) && !isNullOrUndefined(dettaglio.richiesta_iscrizione_header)) {
      id = dettaglio.richiesta_iscrizione_header.id_richiesta;
    }
    this.storageService.setItem<number>(
      SessionStorageService.COMI_ID_RICHIESTA_ISCRIZIONE,
      id
    );
    this.idRichiestaUpdate.next(id);
  }

  private async getDettaglioRichiestaIscrizione$(
    idUtente: number,
    idRichiesta: number,
    save = false
  ): Promise<DettaglioRichiestaIscrizioneL68> {
    try {
      const esito = await this.legge68.findRichiestaIscrizioneCollocamentoMirato(idUtente, idRichiesta).toPromise();
      if (!isNullOrUndefined(idRichiesta) && esito.dettaglio ) {
           if (save) {
               this.setRichiestaIscrizioneStorage( esito.dettaglio);
            }
            return esito.dettaglio;
         } else {
           return undefined;
         }

    } catch (error) {
      return  UtilitiesService.throwHttpError(error);
    }

  }

 /**
   * Salvataggio Richiesta Iscrizione
   *  occorre fornire idUtente e dettaglio richiesta iscrizione
   * @returns esito salvataggio
   */
  public async saveRichiestaIscrizione(idUtente: number, dettaglio: DettaglioRichiestaIscrizioneL68, stepControllo: string ): Promise<EsitoSaveRichiestaIscrizioneCollocamentoMirato> {

    const datiIn: DatiInputSaveRichiestaIscrizioneCollocamentoMirato = {
      step_controllo: stepControllo,
      richiesta: dettaglio
    };
    try {

    return this.legge68.saveRichiestaIscrizioneCollocamentoMirato(idUtente, datiIn )
        .pipe(
          catchError(err => {
            this.logService.error(
              '[commonPslpService::saveRichiestaIscrizione]',
              JSON.stringify(err)
            );
            const errore: ErrorDef =
              err instanceof HttpErrorResponse ? err.error : err;
            const esito: Esito = {
              code: errore.code,
              messaggioCittadino: errore.messaggioCittadino
                ? errore.messaggioCittadino
                : errore.errorMessage
            };
            return of(esito);
          })
        )
        .toPromise();
    } catch (error) {
      return undefined;
    }
  }


 /**
   * controllo valore importo reddito collocamanto mirato
   *  occorre fornire importo ed importo max e messaggio per errore
   * @returns esito salvataggio
   */
  public controlloValoreImporto(ctl: EsitoControlloValore ): EsitoControlloValore {
    let esito: EsitoControlloValore = {};
    const valoreRedditoInserito = (ctl.valore || '').replace(/\./g, '').replace(/,/, '.');
    const valoreMaxPerControllo = (ctl.maxRedditoCollMirato || '').replace(/\./g, '').replace(/,/, '.');
    esito.valore = ctl.valore.replace('.', '');
    if (parseFloat(valoreRedditoInserito) > parseFloat(valoreMaxPerControllo)) {
      let msg = ctl.messaggioInput;
      msg = msg.replace('{0}', '' + ctl.maxRedditoCollMirato);
      esito.messaggio = msg;
      esito.errore = true;
    } else {
      esito.errore = false;
    }
    return esito;
  }


  public modaleIndietroCOMI(titoloPagina: string): DialogModaleMessage {
    return {
      titolo: titoloPagina,
      messaggio: 'Sei sicuro di voler uscire e tornare alla pagina precedente ?',
      messaggioAggiuntivo: "<br>Se <strong>NO</strong>, rimani nella pagina.<br>Se <strong>SI</strong>, torni indietro e i dati eventualmente modificati nella pagina, dopo l'ultimo salvataggio, andranno perduti.",
      tipo: TypeDialogMessage.YesOrNo,
    };

  }
}
