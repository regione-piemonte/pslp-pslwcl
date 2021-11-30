import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ConfigurazioneQuestionario, ConfigurazioneRisposta, DatiInputAggiornamentoDid,
  DatiInputProfilingDid, DatiProfilingDid, Decodifica, EsitoDettaglioDid,
  EsitoSaveDid, SchedaAnagraficoProfessionale, TitoloDiStudio, TitoloStudio } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, NavigationEmitter, StatoDid, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import moment from 'moment';
import { isNullOrUndefined } from 'util';
import { DettaglioDIDUtilitiesService } from './dettaglio-did-utilities.service';

export type WindowState = 'I' | 'V' | 'U';
const TITOLO_DID = 'Dichiarazione di Immediata Disponibilità al lavoro';

export interface DataModel {
  corsiFormazione: string;
  titoloStudio: string;
  condizioneOccupazionale: string;
  presenzaItalia: string;
  posizioneProfessionale: string;
}

const NAVIGATE_BY_URL = '/did/riepilogo-did';
const PROFILING_SPINNER = 'profiling-spinner';
@Component({
  selector: 'pslfcwcl-dettaglio-did',
  templateUrl: './dettaglio-did.component.html',
  styleUrls: ['./dettaglio-did.component.css']
})
export class DettaglioDIDComponent implements OnInit {
  ngOnInitTerminated = false;

  idUtente: number;
  prevButtonName = 'INDIETRO';
  statoMaschera: WindowState;
  did: EsitoDettaglioDid = {};
  profiling: DatiProfilingDid = {};

  readOnly = false;
  domandaLavoroChiuso: string;
  listaRisposteLavoroChiuso: ConfigurazioneRisposta[];
  laRispostaDelLavoroChiuso: ConfigurazioneRisposta = {};
  flgRispostaPresenteLavoroChiuso = false;

  domandaPercettore: string;
  listaRispostePercettore: ConfigurazioneRisposta[];
  laRispostaDelPercettore: ConfigurazioneRisposta = {};
  flgRispostaPresentePercettore = false;
  msgStatoInvio: string;
  ID_RISPOSTA_LAVORO_CHIUSO = 17062;
  isDidSenzaProfilng = false;

  get isVisualizationState(): boolean { return this.statoMaschera === 'V'; }
  get isModifyState(): boolean { return this.statoMaschera === 'U'; }
  get isInsertState(): boolean { return this.statoMaschera === 'I'; }
  get isEditingState(): boolean { return this.isInsertState || this.isModifyState; }

  popdown: boolean;
  textStatoDid: string;
  descrUltimoStato: string;
  dataModel: DataModel;

  liste = {
    titoloStudio: [] as TitoloStudio[],
    condizioneOccupazionale: [] as Decodifica[],
    motivoPresenzaInItalia: [] as Decodifica[],
    corsiFormazione: [] as Decodifica[]
  };

  eta: number;
  provinciaRes: string;
  navigationDisabled: boolean;

  laSap: SchedaAnagraficoProfessionale;
  isCittadinanzaItaliana = true;
  ilSesso: string;
  laCittadinanza: string;
  isMaiLavorato = false;
  listaCategorieInquadramento: Array<Decodifica>;
  domandeQuestionarioDid: ConfigurazioneQuestionario;
  isFigliCoabitanti = false;
  private listaTitoloStudioFull: TitoloStudio[] = [];
  dataDid: Date;
  dataUltimoStatoDid: Date;
  flgHaAvutoLavoro: boolean;
  flgFigliCarico: boolean;
  flgFigliCaricoMinori: boolean;

  genereInfo = "";
  etaInfo = "";
  cittadinanzaInfo = "";
  presenzaItaInfo = "";
  titoloStudioInfo = "";
  condizioneOccuInfo = "";
  avutoLavoroInfo = "";
  mesiUltimoLavInfo = "";
  posizioneInfo = "";
  mesiCercandoInfo = "";
  corsiInfo = "";
  numComponentiInfo = "";
  figliCoaInfo = "";
  figliCoaMinoInfo = "";
  confermaLavoroInfo = "";
  percettoreInfo = "";
  provinciaInfo = "";
  dataProfilingInfo = "";
  indiceProfilingInfo = "";
  esitoDettaglioRicercaDid: EsitoDettaglioDid;


  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly dettaglioUtilitiesService: DettaglioDIDUtilitiesService,
  ) { }

  /**
   * on init
   */
  async ngOnInit() {

    this.utilitiesService.showSpinner();
    this.idUtente = this.appUserService.getIdUtente();
    this.popdown = !this.commonFCService.wizard;

    this.did = await this.dettaglioUtilitiesService.ricercaDettaglioDIDService(this.idUtente);
    const path = new URL(location.href).pathname;
    this.setStatoMaschera(path);
    this.dataModel = {
      corsiFormazione: null,
      titoloStudio: null,
      condizioneOccupazionale: null,
      presenzaItalia: null,
      posizioneProfessionale: null
    };

    this.commonFCService.inizializzaHard();
    const [
      condizioneOccupazionale,
      motivoPresenzaInItalia,
      titoliDiStudioFull,
      corsiFormazione,
      categorieProfessionali,
      domandeQuestionarioDID] =
      await Promise.all([
        this.dettaglioUtilitiesService.getCondizioniOccupazionali(),
        this.dettaglioUtilitiesService.getMotiviPresenzaInItalia(),
        this.dettaglioUtilitiesService.getTitoliStudioFull(),
        this.dettaglioUtilitiesService.getIscrizioniCorso(),
        this.dettaglioUtilitiesService.getElenchiCategorieProfessionali(),
        this.dettaglioUtilitiesService.getDomandeQuestionarioDid()
      ]);
    this.liste.condizioneOccupazionale = condizioneOccupazionale;
    this.liste.corsiFormazione = corsiFormazione;
    this.liste.motivoPresenzaInItalia = motivoPresenzaInItalia;
    this.listaCategorieInquadramento = categorieProfessionali;
    this.domandeQuestionarioDid = domandeQuestionarioDID;

    const [
      genereInfo,
      cittadinanzaInfo,
      presenzaItaInfo,
      titoloStudioInfo,
      condizioneOccuInfo,
      avutoLavoroInfo,
      mesiUltimoLavInfo,
      posizioneInfo,
      mesiCercandoInfo,
      corsiInfo,
      numComponentiInfo,
      figliCoaInfo,
      figliCoaMinoInfo,
      confermaLavoroInfo,
      percettoreInfo,
      etaInfo,
      provinciaInfo,
      dataProfilingInfo,
      indiceProfilingInfo
    ] =
      await Promise.all([
        this.utilitiesService.getMessage('HC019'),
        this.utilitiesService.getMessage('HC020'),
        this.utilitiesService.getMessage('HC021'),
        this.utilitiesService.getMessage('HC022'),
        this.utilitiesService.getMessage('HC023'),
        this.utilitiesService.getMessage('HC024'),
        this.utilitiesService.getMessage('HC025'),
        this.utilitiesService.getMessage('HC026'),
        this.utilitiesService.getMessage('HC027'),
        this.utilitiesService.getMessage('HC028'),
        this.utilitiesService.getMessage('HC029'),
        this.utilitiesService.getMessage('HC030'),
        this.utilitiesService.getMessage('HC031'),
        this.utilitiesService.getMessage('HC032'),
        this.utilitiesService.getMessage('HC033'),
        this.utilitiesService.getMessage('HC034'),
        this.utilitiesService.getMessage('HC035'),
        this.utilitiesService.getMessage('HC036'),
        this.utilitiesService.getMessage('HC037')
      ]);
    this.genereInfo = genereInfo;
    this.etaInfo = etaInfo;
    this.cittadinanzaInfo = cittadinanzaInfo;
    this.presenzaItaInfo = presenzaItaInfo;
    this.titoloStudioInfo = titoloStudioInfo;
    this.condizioneOccuInfo = condizioneOccuInfo;
    this.avutoLavoroInfo = avutoLavoroInfo;
    this.mesiUltimoLavInfo = mesiUltimoLavInfo;
    this.posizioneInfo = posizioneInfo;
    this.mesiCercandoInfo = mesiCercandoInfo;
    this.corsiInfo = corsiInfo;
    this.numComponentiInfo = numComponentiInfo;
    this.figliCoaInfo = figliCoaInfo;
    this.figliCoaMinoInfo = figliCoaMinoInfo;
    this.confermaLavoroInfo = confermaLavoroInfo;
    this.percettoreInfo = percettoreInfo;
    this.provinciaInfo = provinciaInfo;
    this.dataProfilingInfo = dataProfilingInfo;
    this.indiceProfilingInfo = indiceProfilingInfo;


    this.setLeRisposteDalQuestionario();

    this.listaTitoloStudioFull = titoliDiStudioFull;

    const sap = await this.commonFCService.getSap$(this.idUtente);

    this.laSap = sap;
    this.ilSesso = this.laSap.sesso === 'F' ? 'Femmina' : 'Maschio';
    this.laCittadinanza = this.laSap.cittadinanza;

    this.isCittadinanzaItaliana = this.laSap.codice_ministeriale_cittadinanza === '000';


    const iTitoliDistudio = this.laSap.titoli_di_studio;
    this.eta = this.commonFCService.age(sap);
    this.provinciaRes = '';
    if (!isNullOrUndefined(sap.residenza.comune) && !isNullOrUndefined(sap.residenza.comune.provincia)) {
      this.provinciaRes = sap.residenza.comune.provincia.descrizione;
    } else if (!isNullOrUndefined(sap.residenza.stato) && !isNullOrUndefined(sap.residenza.stato.descrizione)) {
      this.provinciaRes = sap.residenza.stato.descrizione;
    }

    if (!isNullOrUndefined(this.did)) {
      /***********************************************************************
      * ******************* UTENTE CON DID VALIDA*****************************
      * **********************************************************************
      */
      await this.utenteConDidValida(iTitoliDistudio);
    } else {

      /************************************************************************
       * ******************* UTENTE SENZA DID *********************************
       * **********************************************************************
       */
      await this.utenteSenzaDid(iTitoliDistudio);
    }

    this.utilitiesService.hideSpinner();
    this.ngOnInitTerminated = true;
  }

  /**
   * Utentes senza did
   * @param iTitoliDistudio array TitoloDiStudio
   */
  private async utenteSenzaDid(iTitoliDistudio: TitoloDiStudio[]) {
    this.did = { data_did: new Date(), dati_profiling_did: {} };
    this.flgRispostaPresenteLavoroChiuso = true;
    this.flgRispostaPresentePercettore = true;
    if (!isNullOrUndefined(iTitoliDistudio)) {
      this.liste.titoloStudio = await this.dettaglioUtilitiesService.getTitoliStudioPerInserimento(iTitoliDistudio);
    }
    this.dataDid = new Date();
  }

  /**
   * Utentes con did valida
   * @param iTitoliDistudio TitoloDiStudio
   */
  private async utenteConDidValida(iTitoliDistudio: TitoloDiStudio[]) {
    this.dataDid = this.did.data_did;

    await this.setMsgStatoInvio();

    await this.setMsgDidRifiutata();

    if (!isNullOrUndefined(this.did.contenuto) && this.did.contenuto.length > 0) {
      /* cerco la domanda del lavoro chiuso per poter controllare la risposta  */
      for (const laDomanda of this.did.contenuto) {
        if (laDomanda.id_domanda === 12941) {
          this.laRispostaDelLavoroChiuso = { id_domanda: laDomanda.id_domanda, id_risposta: laDomanda.id_risposta };
          this.flgRispostaPresenteLavoroChiuso = true;
        } else {
          this.laRispostaDelPercettore = { id_domanda: laDomanda.id_domanda, id_risposta: laDomanda.id_risposta };
          this.flgRispostaPresentePercettore = true;
        }
      }
    }
    await this.setTitoloStudio(iTitoliDistudio);
    /************************************************************************
     * ******************* CONTROLLO ESISTENZA PROFILING ********************
     * **********************************************************************
     */
    if (isNullOrUndefined(this.did.dati_profiling_did)) {
      /************************************************************************
       * ******************* SENZA PROFILING **********************************
       * **********************************************************************
       */
      await this.senzaProfiling(iTitoliDistudio);
    } else {
      /************************************************************************
        * ******************* CON PROFILING **********************************
        * **********************************************************************
        */
      this.conProfiling();
    }
  }

  /**
   * Sets titolo studio
   * @param iTitoliDistudio TitoloDiStudio[]
   */
  private async setTitoloStudio(iTitoliDistudio: TitoloDiStudio[]) {
    if (!this.isModifyState && !isNullOrUndefined(this.did.dati_profiling_did)) {
      this.liste.titoloStudio = this.findTitoloStudio();
    } else {
      this.liste.titoloStudio = await this.dettaglioUtilitiesService.getTitoliStudioPerInserimento(iTitoliDistudio);
    }
  }

  /**
   * Sets msg did rifiutata
   */
  private async setMsgDidRifiutata() {
    let dataStatoDid = "";
    if (this.did.flg_rifiuto === 'S') {
      const msgRifiutata = await this.utilitiesService.getMessage('MI038');
      this.descrUltimoStato =
        msgRifiutata.replace(
          '{1}',
          !isNullOrUndefined(this.did.motivo_rifiuto) ?
            this.did.motivo_rifiuto : await this.utilitiesService.getMessage('MI040'));
      if (!isNullOrUndefined(this.did.data_did_respinta)) {
        dataStatoDid = moment(this.did.data_did_respinta).format('DD/MM/YYYY');
      }
      this.descrUltimoStato = this.descrUltimoStato.replace('{0}', dataStatoDid);
      this.textStatoDid = 'bg-danger text-white';
    }
  }

  /**
   * Sets msg stato invio
   */
  private async setMsgStatoInvio() {
    if (!isNullOrUndefined(this.did.cod_ultimo_stato)) {
      this.textStatoDid = StatoDid.getColoreByCodice(this.did.cod_ultimo_stato);
      this.descrUltimoStato = StatoDid.getDescrizioneByCodice(this.did.cod_ultimo_stato);
      if (isNullOrUndefined(this.did.flg_rifiuto) || this.did.flg_rifiuto !== 'S') {
        if (this.did.flg_attesa_invio === 'S') {
          /** se il flag è 'N' significa che è stata "Da inviare" */
          this.msgStatoInvio = '- ' + await this.utilitiesService.getMessage('MI037');
        } else {
          /** se il flag è 'S' significa che è stata inviata correttamente */
          this.msgStatoInvio = '- Inviata';
        }
      }
    }
  }

  /**
   * Determines whether profiling con
   */
  private conProfiling() {
    if (this.isVisualizationState) {
      this.eta = this.did.dati_profiling_did.eta;
      this.provinciaRes = this.did.dati_profiling_did.ds_provincia_residenza;
    }

    if (!isNullOrUndefined(this.did.dati_profiling_did.ds_iscrizione_corsi)) {
      this.dataModel.corsiFormazione = this.liste.corsiFormazione.find(el => el.descrizione === this.did.dati_profiling_did.ds_iscrizione_corsi).codice_silp;
    }
    this.dataModel.titoloStudio = this.listaTitoloStudioFull.find(el => el.codice === this.did.dati_profiling_did.codice_ministeriale_titolo_studio).codice_silp;
    this.dataModel.condizioneOccupazionale =
      this.liste.condizioneOccupazionale.find(
        el => el.descrizione === this.did.dati_profiling_did.ds_condizione_occupazionale).codice_silp;
    this.dataModel.presenzaItalia =
      this.liste.motivoPresenzaInItalia.find(
        el => el.descrizione === this.did.dati_profiling_did.ds_presenza_in_italia).codice_silp;
    this.dataModel.posizioneProfessionale = this.listaCategorieInquadramento.find(
      el => el.descrizione === this.did.dati_profiling_did.ds_posizione_professionale).codice_silp;
    this.onChangeMaiUnLavoro(this.did.dati_profiling_did.flg_ha_avuto_lavoro);
    this.onChangeFigliCoabitanti(this.did.dati_profiling_did.flg_figli_carico);
    this.flgHaAvutoLavoro = this.did.dati_profiling_did.flg_ha_avuto_lavoro === 'S' ? true : false;
    this.flgFigliCarico = this.did.dati_profiling_did.flg_figli_carico === 'S' ? true : false;
    this.flgFigliCaricoMinori = this.did.dati_profiling_did.flg_figli_carico_minori === 'S' ? true : false;
  }

  /**
   * Senzas profiling
   * @param iTitoliDistudio TitoloDiStudio[]
   */
  private async senzaProfiling(iTitoliDistudio: TitoloDiStudio[]) {
    this.isDidSenzaProfilng = true;
    this.did.dati_profiling_did = {};
    if (!isNullOrUndefined(iTitoliDistudio)) {
      this.liste.titoloStudio = await this.dettaglioUtilitiesService.getTitoliStudioPerInserimento(iTitoliDistudio);
    }
  }

  /**
   * Sets le risposte dal questionario
   */
  private setLeRisposteDalQuestionario() {
    if (!isNullOrUndefined(this.domandeQuestionarioDid) && this.domandeQuestionarioDid.configurazione_domanda.length > 0) {
      /* cerco la domanda del lavoro chiuso per poter controllare la risposta  */
      for (const laDomanda of this.domandeQuestionarioDid.configurazione_domanda) {
        if (laDomanda.id_domanda === 12941) {
          this.domandaLavoroChiuso = laDomanda.domanda;
          this.listaRisposteLavoroChiuso = laDomanda.risposte;
          this.laRispostaDelLavoroChiuso.id_domanda = laDomanda.id_domanda;
          this.laRispostaDelLavoroChiuso.id_configurazione_questionario = laDomanda.id_configurazione_questionario;
        } else {
          this.domandaPercettore = laDomanda.domanda;
          this.listaRispostePercettore = laDomanda.risposte;
          this.laRispostaDelPercettore.id_domanda = laDomanda.id_domanda;
          this.laRispostaDelPercettore.id_configurazione_questionario = laDomanda.id_configurazione_questionario;
        }
      }
    }
  }

  /**
   * Sets stato maschera
   * @param path string
   */
  private setStatoMaschera(path: string) {
    if (path.endsWith('richiesta-did')) {
      this.statoMaschera = 'I';
      if (!isNullOrUndefined(this.did)) {
        this.did.dati_profiling_did = null;
        this.did = null;
      }
    } else if (path.endsWith('aggiorna-profiling')) {
      if (!isNullOrUndefined(this.did)) {
        if (!isNullOrUndefined(this.did.dati_profiling_did)) {
          this.onChangeFigliCoabitanti(this.did.dati_profiling_did.flg_figli_carico);
        }
      }
      this.statoMaschera = 'U';
    } else if (path.endsWith('visualizza-did')) {
      this.statoMaschera = 'V';
    } else {
      this.statoMaschera = 'V';
    }
  }

  /**
   * Determines whether submit on
   */
  async onSubmit() {
    this.utilitiesService.showSpinner(PROFILING_SPINNER);
    this.onSalva();
    this.utilitiesService.hideSpinner(PROFILING_SPINNER);
  }

  /**
   * Determines whether change lavoro on
   */
  async onChangeLavoro() {
    if (this.laRispostaDelLavoroChiuso.id_risposta == this.ID_RISPOSTA_LAVORO_CHIUSO) {
      return this.openModalConfirm(await this.utilitiesService.getMessage('ME145'));
    }

  }

  /**
   * Opens modal confirm
   * @param msg string
   */
  async openModalConfirm(msg: string) {
    const data: DialogModaleMessage = {
      titolo: TITOLO_DID,
      tipo: TypeDialogMessage.Confirm,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      // non deve fare nulla ma senza da problemi.
      msg = msg + '';
    }
  }

  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.router.navigateByUrl('/did/richiesta-did');
  }

  /**
   * Determines whether salva on
   */
  async onSalva() {
    this.utilitiesService.showSpinner();
    const profilingInput: DatiInputProfilingDid = {};
    this.caricaDatiProfilingInput(profilingInput);
    if (this.isModifyState) {
      /** *********************************************************************
       *  *********************** AGGIORNAMENTO PROFILING *********************
       *  *********************************************************************
      */
      await this.aggiornamentoProfiling(profilingInput);
    } else if (this.isInsertState) {

      /** **************************************************************************
       *  *************************** INSERIMENTO DID ******************************
       * **************************************************************************
      */

      /** comunque bisogna sempre prima inserire il profiling e poi effettuare l'inserimento della did  */
      await this.inserimentoDID(profilingInput);

    }
    this.utilitiesService.hideSpinner();
  }

  /**
   * Aggiornamentos profiling
   * @param profilingInput DatiInputProfilingDid
   */
  private async aggiornamentoProfiling(profilingInput: DatiInputProfilingDid) {
    const didDaAggiornare: DatiInputAggiornamentoDid = {};
    didDaAggiornare.codice_fiscale = this.laSap.codice_fiscale;
    didDaAggiornare.id_anagrafica = this.laSap.id_sil_lav_anagrafica;
    didDaAggiornare.data_did = this.did.data_did;
    didDaAggiornare.data_stato_did = new Date();
    didDaAggiornare.cod_stato_did = 'C';
    didDaAggiornare.id_did = this.did.id_did;
    const esitoControlloDid = await this.dettaglioUtilitiesService.controlloDidService(this.idUtente, 'S', didDaAggiornare);
    if (isNullOrUndefined(esitoControlloDid.messaggioErrori)) {
      /** NESSUN MESSAGGIO DI ERRORE DAI CONTROLLI POSSIAMO PROCEDERE ALL'AGGIORNAMENTO DEL PROFILING  */
      const esitoInsertProfiling = await this.dettaglioUtilitiesService.saveProfilingDidService(this.idUtente, profilingInput);
      if (!isNullOrUndefined(esitoInsertProfiling.idDatiProfiling)) {
        /** IL PROFILING è STATO INSERITO CORRETTAMENTE SI PROCEDE ALLA CHIAMATA DEL SERVIZIO PER CAMBIARE
         * LO STATO ALLA DID IN STATO C    */
        const esitoInsertDid = await this.dettaglioUtilitiesService.changeStateDidAfterInsertProfilingService(this.idUtente, didDaAggiornare);
        if (isNullOrUndefined(esitoInsertDid.messaggioErrori)) {
          this.openModalConfirm(esitoInsertDid.messaggioInfo);
        } else if (!isNullOrUndefined(esitoInsertDid.messaggioErrori)) {
          /** ERRORE NELL'AGGIORNAMENTO DID IN STATO C */
          this.openModalConfirm(esitoInsertDid.messaggioErrori);
        } else if (!isNullOrUndefined(esitoInsertDid.messaggioInfo)) {
          /** ERRORE NELL'AGGIORNAMENTO DID IN STATO C */
          this.openModalConfirm(esitoInsertDid.messaggioInfo);
        }
        this.router.navigateByUrl(NAVIGATE_BY_URL);
      } else {
        /** ERRORE NELL'AGGIORNAMENTO PROFILING */
        this.openModalConfirm(esitoInsertProfiling.messaggioCittadino);
      }
    } else {
      /** CONTROLLI DID ANDATI IN ERRORE */
      this.openModalConfirm(esitoControlloDid.messaggioErrori);
    }
  }

  /**
   * Inserimentos did
   * @param profilingInput DatiInputProfilingDid
   */
  private async inserimentoDID(profilingInput: DatiInputProfilingDid) {
    const didDaInserire: DatiInputAggiornamentoDid = {};
    didDaInserire.codice_fiscale = this.laSap.codice_fiscale;
    didDaInserire.id_anagrafica = this.laSap.id_sil_lav_anagrafica;
    didDaInserire.data_did = new Date();
    didDaInserire.data_stato_did = new Date();
    didDaInserire.cod_stato_did = 'I';
    const esitoControlloDidXProfiling = await this.dettaglioUtilitiesService.controlloDidService(this.idUtente, 'S', didDaInserire);
    if (isNullOrUndefined(esitoControlloDidXProfiling.messaggioErrori)) {
      const esitoInsertProfiling = await this.dettaglioUtilitiesService.saveProfilingDidService(this.idUtente, profilingInput);
      if (!isNullOrUndefined(esitoInsertProfiling.idDatiProfiling)) {
        /** IL PROFILING è STATO INSERITO CORRETTAMENTE SI PROCEDE ALLA CHIAMATA DEL SERVIZIO PER INSERIMENTO DID
          NESSUN MESSAGGIO DI ERRORE DAI CONTROLLI POSSIAMO PROCEDERE ALL'INSERIMENTO DID  */
        await this.inseritoProfilingCorrettamente(didDaInserire);
      } else {
        /** ERRORE NELL'AGGIORNAMENTO PROFILING */
        this.openModalConfirm(esitoInsertProfiling.messaggioCittadino);
      }
    } else {
      /** CONTROLLI DID ANDATI IN ERRORE */
      this.openModalConfirm(esitoControlloDidXProfiling.messaggioCittadino);
    }
  }

  /**
   * Inseritos profiling correttamente
   * @param didDaInserire DatiInputAggiornamentoDid
   */
  private async inseritoProfilingCorrettamente(didDaInserire: DatiInputAggiornamentoDid) {
    didDaInserire.risposta_questionario = [this.laRispostaDelLavoroChiuso, this.laRispostaDelPercettore];
    const esitoInsertDidStatoI = await this.dettaglioUtilitiesService.saveDidService(this.idUtente, didDaInserire);
    if (!isNullOrUndefined(esitoInsertDidStatoI.idDid)) {
      await this.effettuatoInserimentoDIDInStatoI(didDaInserire, esitoInsertDidStatoI);
    } else if (!isNullOrUndefined(esitoInsertDidStatoI.messaggioErrori)) {
      /** PRESENTE MESSAGGIO ERRORE  */
      this.openModalConfirm(esitoInsertDidStatoI.messaggioErrori);
    } else if (!isNullOrUndefined(esitoInsertDidStatoI.messaggioInfo)) {
      /** PRESENTE MESSAGGIO INFO  */
      this.openModalConfirm(esitoInsertDidStatoI.messaggioInfo);
      this.router.navigateByUrl(NAVIGATE_BY_URL);
    }
  }

  /**
   * Effettuatos inserimento didin stato i
   * @param didDaInserire DatiInputAggiornamentoDid
   * @param esitoInsertDidStatoI EsitoSaveDid
   */
  private async effettuatoInserimentoDIDInStatoI(didDaInserire: DatiInputAggiornamentoDid, esitoInsertDidStatoI: EsitoSaveDid) {
    didDaInserire.id_did = esitoInsertDidStatoI.idDid;
    didDaInserire.cod_stato_did = 'C';
    didDaInserire.risposta_questionario = null;
    const esitoInsertDidStatoC = await this.dettaglioUtilitiesService.saveDidService(this.idUtente, didDaInserire);
    if (isNullOrUndefined(esitoInsertDidStatoC.messaggioErrori)) {
      /** NESSUN MESSAGGIO ERRORE O INFO  */
      this.openModalConfirm(esitoInsertDidStatoC.messaggioInfo);
      this.router.navigateByUrl(NAVIGATE_BY_URL);
    } else {
      /** ERRORI E QUINDI VADO A VEDERE L'ESITO DELL'INSERIMENTO EFFETTUATO PRECEDENTEMENTE */
      await this.erroreInserimentoDIDInStatoC(esitoInsertDidStatoI);
      this.router.navigateByUrl(NAVIGATE_BY_URL);
    }
  }

  /**
   * Errores inserimento didin stato c
   * @param esitoInsertDidStatoI EsitoSaveDid
   */
  private async erroreInserimentoDIDInStatoC(esitoInsertDidStatoI: EsitoSaveDid) {
    if (isNullOrUndefined(esitoInsertDidStatoI.messaggioInfo)) {
      if (isNullOrUndefined(esitoInsertDidStatoI.messaggioErrori)) {
        this.openModalConfirm(await this.utilitiesService.getMessage('ME002'));
      } else {
        this.openModalConfirm(esitoInsertDidStatoI.messaggioErrori);
      }
    } else {
      this.openModalConfirm(esitoInsertDidStatoI.messaggioInfo);
    }
  }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  onExitPage(nav: NavigationEmitter) {
    this.router.navigateByUrl(nav.url);
  }

  /**
   * Determines whether change mai un lavoro on
   * @param valore string
   */
  onChangeMaiUnLavoro(valore: string) {
    if (valore === 'S') {
      this.isMaiLavorato = true;
    } else if (valore === 'N') {
      this.isMaiLavorato = false;
      this.did.dati_profiling_did.ds_posizione_professionale = null;
    }
  }

  /**
   * Determines whether change figli coabitanti on
   * @param valore string
   */
  onChangeFigliCoabitanti(valore: string) {
    if (valore === 'S') {
      this.isFigliCoabitanti = true;
    } else if (valore === 'N') {
      this.isFigliCoabitanti = false;
      this.profiling.flg_figli_carico_minori = null;
    }
  }

  /**
   * Finds titolo studio
   * @returns titolo studio
   */
  findTitoloStudio(): TitoloStudio[] {
    if (this.did.dati_profiling_did.codice_ministeriale_titolo_studio) {
      const listaTitoliDiStudio: Array<TitoloStudio> = [this.listaTitoloStudioFull.find(el => el.codice === this.did.dati_profiling_did.codice_ministeriale_titolo_studio)];
      return listaTitoliDiStudio;
    }
    return undefined;
  }

  /**
   * Caricas dati profiling input
   * @param profilingInput DatiInputProfilingDid
   * @returns dati profiling input
   */
  caricaDatiProfilingInput(profilingInput: DatiInputProfilingDid): DatiInputProfilingDid {
    profilingInput.codice_fiscale = this.laSap.codice_fiscale;
    profilingInput.id_anagrafica = this.laSap.id_sil_lav_anagrafica;
    profilingInput.id_iscrizione_corsi = this.dataModel.corsiFormazione;
    profilingInput.avuto_almeno_un_lav = this.flgHaAvutoLavoro;
    if (this.flgHaAvutoLavoro) {
      profilingInput.num_mesi_fine_ultimo_lavoro = this.did.dati_profiling_did.num_mesi_ultimo_rapporto;
      profilingInput.id_posizione_professionale = this.dataModel.posizioneProfessionale;
    } else {
      profilingInput.id_posizione_professionale = "14";
      profilingInput.num_mesi_fine_ultimo_lavoro = 0;
    }
    profilingInput.figli_a_carico = this.flgFigliCarico;
    profilingInput.id_condizione_occupazionale = this.dataModel.condizioneOccupazionale;
    profilingInput.id_iscrizione_corsi = this.dataModel.corsiFormazione;
    profilingInput.id_titolo_studio = this.dataModel.titoloStudio;
    profilingInput.num_componenti_famiglia = this.did.dati_profiling_did.num_componenti_famiglia;
    profilingInput.num_mesi_ricerca_lavoro = this.did.dati_profiling_did.num_mesi_ricerca_lavoro;
    if (this.flgFigliCarico) {
      profilingInput.figli_minori_a_carico = this.flgFigliCaricoMinori;
    } else {
      profilingInput.figli_minori_a_carico = false;
    }
    if (this.isCittadinanzaItaliana) {
      profilingInput.id_presenza_in_italia = "1";
    } else {
      profilingInput.id_presenza_in_italia = this.dataModel.presenzaItalia;
    }
    return profilingInput;
  }

  /**
   * pop up
   * @param name del popup
   */
  myPopUp(name) {
    const popup = document.getElementById(name);
    popup.classList.toggle("show");
  }

}
