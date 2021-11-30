import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DatiInputAggiornamentoDid, DatiProfilingDid, EsitoDettaglioDid, EsitoSaveDid, SchedaAnagraficoProfessionale, TitoloStudio } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { Ambito, DialogModaleMessage, StatoDid, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, LogService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import moment from 'moment';
import { isNullOrUndefined } from 'util';
import { DettaglioDIDUtilitiesService } from '../../dettaglio-did/dettaglio-did-utilities.service';

const TITOLO_DID = 'Dichiarazione di Immediata Disponibilità al lavoro';
const DD_MM_YYYY = 'DD/MM/YYYY';
const FASCICOLO_CITTADINO_LANDING_PARAM = '/fascicolo-cittadino-landing?param=';

@Component({
  selector: 'pslfcwcl-scheda-did',
  templateUrl: './scheda-did.component.html',
  styleUrls: ['./scheda-did.component.css']
})
export class SchedaDIDComponent implements OnInit {
  @Input() idUtente: number;
  @Output() loadedData: EventEmitter<void> = new EventEmitter();
  sap: SchedaAnagraficoProfessionale;
  datiProfilingDid: DatiProfilingDid = {};
  eta: number;
  loadingData: boolean;
  loaded: boolean;
  message: string;
  messaggioMaggiorenne: string;
  textStatoDid: string;
  descrUltimoStato: string;
  msgStatoDid: string;
  msgDid: string;
  msgStatoInvio: string;
  msgUltimoProfiling: string;
  did: EsitoDettaglioDid;
  msgsTitoloStudio: string;
  msgAssenzaMail: string;
  loEsitoControlloInsTramiteServizioSilp: EsitoSaveDid;
  loEsitoControlloConvTramiteServizioSilp: EsitoSaveDid;
  titoliStudioPerProfiling = [] as TitoloStudio[];
  dataDid = "";
  dataStatoDid = "";
  terminata = "";
  enteTitolaritaDescrizione = "";

  constructor(
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly securityService: SecurityPslpService,
    private readonly dettaglioUtilitiesService: DettaglioDIDUtilitiesService
  ) {
    this.loaded = false;
  }

  /**
   * on init
   *
   */
  async ngOnInit() {
    this.utilitiesService.showSpinner();

    this.commonFCService.setAmbitoPrivacy(Ambito.FASC);
    this.msgsTitoloStudio = await this.utilitiesService.getMessage('ME142');
    this.msgAssenzaMail = await this.utilitiesService.getMessage('ME138');
    if (this.loaded === true) {
      this.utilitiesService.hideSpinner();
      return;
    }
    this.loadingData = true;

    await this.caricaSap();

    await this.caricaEventualiTitoliDiStudioDaSap();

    const didControlloIns: DatiInputAggiornamentoDid = {};
    didControlloIns.codice_fiscale = this.sap.codice_fiscale;
    didControlloIns.id_anagrafica = this.sap.id_sil_lav_anagrafica;
    didControlloIns.data_did = new Date();
    didControlloIns.data_stato_did = new Date();
    didControlloIns.cod_stato_did = 'I';
    const [esitoControlloInsDid
    ] = await Promise.all([
      this.dettaglioUtilitiesService.controlloDidService(this.idUtente, 'N', didControlloIns)
    ]);
    this.loEsitoControlloInsTramiteServizioSilp = esitoControlloInsDid;

    this.did = await this.dettaglioUtilitiesService.ricercaDettaglioDIDService(this.idUtente);

    if (this.isDidPresenteSenzaErrori()) {

      this.setEnteTitolaritaDescrizione();

      const didControlloConv: DatiInputAggiornamentoDid = {};
      didControlloConv.codice_fiscale = this.sap.codice_fiscale;
      didControlloConv.id_anagrafica = this.sap.id_sil_lav_anagrafica;
      didControlloConv.data_did = this.did.data_did;
      didControlloConv.data_stato_did = new Date();
      didControlloConv.id_did = this.did.id_did;
      didControlloConv.cod_stato_did = 'C';

      const [esitoControlloConvDid
      ] = await Promise.all([
        this.dettaglioUtilitiesService.controlloDidService(this.idUtente, 'N', didControlloConv)
      ]);
      this.loEsitoControlloConvTramiteServizioSilp = esitoControlloConvDid;

      this.setVarieDid();

      this.setTerminata();

      if (this.did.flg_rifiuto === 'S') {
        // DID RESPINTA
        this.terminata = " - Terminata";
        this.msgStatoDid = !isNullOrUndefined(this.did.motivo_rifiuto) ? this.did.motivo_rifiuto : await this.utilitiesService.getMessage('MI040');
        if (!isNullOrUndefined(this.did.data_did_respinta)) {
          this.dataStatoDid = moment(this.did.data_did_respinta).format(DD_MM_YYYY);
        }
        this.textStatoDid = 'bg-danger text-white';
      } else if (this.did.flg_attesa_invio === 'S') {
        /** se il flag è 'N' significa che è stata "Da inviare" */
        this.textStatoDid = StatoDid.getColoreByCodice(this.did.cod_ultimo_stato);
        this.msgStatoInvio = await this.utilitiesService.getMessage('MI037');
      } else {
        /** se il flag è 'S' significa che è stata inviata correttamente */
        this.textStatoDid = StatoDid.getColoreByCodice(this.did.cod_ultimo_stato);
        this.msgStatoInvio = 'Inviata';
      }
    } else {
      this.msgUltimoProfiling = null;
    }
    this.loadingData = false;
    this.loadedData.emit();
    this.loaded = true;
    this.utilitiesService.hideSpinner();

  }

  /**
   * Caricas sap
   */
  private async caricaSap() {
    try {
      const sap = await this.commonFCService.getSap$(this.idUtente);
      this.sap = sap;
      this.eta = this.commonFCService.age(this.sap);
    } catch (error) {
      this.logService.log('Eccezione ---->  ' + error);
    }
  }

  /**
   * Sets ente titolarita descrizione
   */
  private setEnteTitolaritaDescrizione() {
    if (!isNullOrUndefined(this.did.ente_titolarita) && this.did.ente_titolarita.indexOf('-') >= 0) {
      this.enteTitolaritaDescrizione = this.did.ente_titolarita.substring(0, this.did.ente_titolarita.indexOf('-'));
    } else {
      this.enteTitolaritaDescrizione = this.did.ente_titolarita;
    }
  }

  /**
   * Sets varie did
   */
  private setVarieDid() {
    if (!isNullOrUndefined(this.did.dati_profiling_did)) {
      this.msgUltimoProfiling = '' + moment(this.did.dati_profiling_did.data_inserimento).format(DD_MM_YYYY);
    }
    if (!isNullOrUndefined(this.did.data_did)) {
      this.dataDid = moment(this.did.data_did).format(DD_MM_YYYY);
    }
    if (!isNullOrUndefined(this.did.data_stato)) {
      this.dataStatoDid = moment(this.did.data_stato).format(DD_MM_YYYY);
    }
    if (!isNullOrUndefined(this.did.cod_ultimo_stato)) {
      this.descrUltimoStato = StatoDid.getDescrizioneByCodice(this.did.cod_ultimo_stato);
    }
  }

  /**
   * Sets terminata
   */
  private setTerminata() {
    if (this.did.flg_stato_finale === 'S') {
      this.terminata = " - Terminata";
    } else {
      this.terminata = " - In corso";
    }
  }

  /**
   * Determines whether did presente senza errori is
   * @returns boolean
   */
  private isDidPresenteSenzaErrori() {
    return this.isDIDPresente() && !isNullOrUndefined(this.did) && isNullOrUndefined(this.did.errore_ricerca_did);
  }

  /**
   * Caricas eventuali titoli di studio da sap
   */
  private async caricaEventualiTitoliDiStudioDaSap() {
    if (!isNullOrUndefined(this.sap.titoli_di_studio)) {
      const [titoliStudioPerProfiling
      ] = await Promise.all([
        this.dettaglioUtilitiesService.getTitoliStudioPerInserimento(this.sap.titoli_di_studio)
      ]);
      this.titoliStudioPerProfiling = titoliStudioPerProfiling;
    } else {
      this.titoliStudioPerProfiling = null;
    }
  }

  /**
   * Determines whether visualizza did on
   */
  async onVisualizzaDID() {
    this.setData();
    this.router.navigateByUrl('/did/visualizza-did');
  }
  /**
   * Determines whether stampa did on
   */
  async onStampaDID() {
  }
  /**
   * Determines whether firma patto on
   */
  async onFirmaPatto() {
    this.setData();
    this.router.navigateByUrl('/did/patto-servizio');
  }

  /**
   * Determines whether aggiorna profiling on
   */
  async onAggiornaProfiling() {
    if (!isNullOrUndefined(this.loEsitoControlloConvTramiteServizioSilp.error)
      && this.loEsitoControlloConvTramiteServizioSilp.error.length > 0) {
      // DID APERTA ME003
      // DOMICILIO NON IN PIEMONTE ME137
      // RAPPORTO LAVORO APERTI ME145
      let elencoMessaggi = "";
      for (const value of this.loEsitoControlloConvTramiteServizioSilp.error) {
        elencoMessaggi += value.descr_messaggio;
      }

      this.dettaglioUtilitiesService.logService(this.idUtente, "PULSANTE AGGIORNA PROFILING->" + elencoMessaggi);
      this.openModalConfirm(elencoMessaggi);
      this.ngOnInit();
      this.loaded = true;
    } else if (this.did.flg_ente_titolarita_piemontese !== 'S'
      || !this.utilitiesService.isSapDomicilioPiemonte(this.sap)) {
      this.openModalConfirm("Il Domicilio o la titolarita' del Cpi NON e' in Piemonte");
      this.ngOnInit();
      this.loaded = true;
    } else if (this.sap.residenza.stato.codice_ministeriale !== undefined
      && this.sap.residenza.stato.codice_ministeriale !== 'Z00') {
      this.openModalConfirm("La residenza NON è in Italia");
      this.ngOnInit();
      this.loaded = true;
    } else {
      if (this.controlloPresenzaMail()
        && this.controlloPresenzaAlmenoUnTitoloStudio()
      ) {
        this.setData();
        this.router.navigateByUrl('/did/aggiorna-profiling');
      } else {
        this.ngOnInit();
        this.loaded = true;
      }
    }
  }

  /**
   * Determines whether richiedi did on
   */
  async onRichiediDID() {
    this.loaded = false;
    if (!isNullOrUndefined(this.loEsitoControlloInsTramiteServizioSilp.messaggioErrori)) {
      this.dettaglioUtilitiesService.logService(this.idUtente, "PULSANTE RICHIEDI DID->" + this.loEsitoControlloInsTramiteServizioSilp.messaggioErrori);
      this.openModalConfirm(this.loEsitoControlloInsTramiteServizioSilp.messaggioErrori);
      this.ngOnInit();
      this.loaded = true;
    } else {
      if (this.controlloPresenzaMail()
        && this.controlloPresenzaAlmenoUnTitoloStudio()
      ) {
        this.setData();
        this.router.navigateByUrl('/did/richiesta-did');
      } else {
        this.ngOnInit();
        this.loaded = true;
      }
    }
  }


  /**
   * Determines whether privacy on
   */
  onPrivacy() {
    this.setData();
    this.router.navigateByUrl('/fascicolo-cittadino/dettaglio-privacy');
  }

  /**
   * Sets data
   */
  private async setData() {
    this.commonFCService.inizializzaProfilo();
    this.commonFCService.setSapStorage(this.sap);
    this.commonFCService.setObbligoFormativoStorage(this.sap);
    this.commonFCService.azzeraModificheSap();
    this.commonFCService.wizard = true;
    this.commonFCService.readOnly = false;
    if (this.commonFCService.obbligoDomicilioPiemontePerModifica() &&
      !this.utilitiesService.isSapDomicilioPiemonte(this.sap)) {
      this.commonFCService.readOnlyDomicilio = true;
    }

    this.commonFCService.firstPage = "riepilogo";
    this.commonFCService.setUtenteStorage({ id_utente: this.idUtente });
  }

  /**
   * Determines whether didpresente is
   * @returns boolean
   */
  isDIDPresente() {
    if (isNullOrUndefined(this.did)) {
      this.did = null;
      return false;
    } else if (isNullOrUndefined(this.did.errore_ricerca_did)) {
      return true;
    }
  }

  /**
   * Tastos richiesta did
   * @returns boolean
   */
  tastoRichiestaDid() {
    if (this.isDIDPresente() && !isNullOrUndefined(this.did)) {
      if (this.did.flg_ente_titolarita_piemontese === 'S' &&
        (this.did.cod_ultimo_stato === 'R' || this.did.cod_ultimo_stato === 'A' || this.did.flg_rifiuto === 'S')) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  /**
   * Tastos aggiorna profiling
   * @returns boolean
   */
  tastoAggiornaProfiling() {
    if (this.isDIDPresente()
      && !isNullOrUndefined(this.did)
      && this.did.flg_rifiuto === 'N'
      && (this.did.cod_ultimo_stato === 'I' || this.did.cod_ultimo_stato === 'C')) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Tastos stampa did
   * @returns boolean
   */
  tastoStampaDid() {
    if (this.isDIDPresente()
      && !isNullOrUndefined(this.did)
      && this.did.flg_ente_titolarita_piemontese === 'S'
      && this.did.flg_rifiuto === 'N'
      && this.did.flg_attesa_invio === 'S') {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Tastos visualizza did
   * @returns boolean
   */
  tastoVisualizzaDid() {
    if (!isNullOrUndefined(this.did)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Tastos firma patto
   * @returns boolean
   */
  tastoFirmaPatto() {
    if (this.isDIDPresente()
      && !isNullOrUndefined(this.did)
    ) {
      return true;
    } else {
      return false;
    }
  }


  /**
   * Opens modal
   * @param msg string
   * @param destination string url
   */
  async openModal(msg: string, destination: string) {
    const data: DialogModaleMessage = {
      titolo: TITOLO_DID,
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.utilitiesService.showSpinner();
      this.securityService.jumpToURL(destination, TypeApplicationCard.Fascicolo);
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
    if (result === "SI") {
      msg = msg + '';
    }
  }

  /**
   * Controllos presenza mail
   * @returns true if presenza mail
   */
  controlloPresenzaMail(): boolean {
    let ritorno = true;
    /** CONTROLLO DELLA PRESENZA DELLA MAIL  */
    if (isNullOrUndefined(this.sap.recapito.email)) {
      this.openModal(this.msgAssenzaMail, FASCICOLO_CITTADINO_LANDING_PARAM + Ambito.DID);
      ritorno = false;
    }
    return ritorno;
  }

  /**
   * Controllos presenza almeno un titolo studio
   * @returns true if presenza almeno un titolo studio
   */
  controlloPresenzaAlmenoUnTitoloStudio(): boolean {
    /** CONTROLLO DELLA PRESENZA DI ALMENO UN TITOLO DI STUDIO */
    if (isNullOrUndefined(this.sap.titoli_di_studio)) {
      this.openModal(this.msgsTitoloStudio, FASCICOLO_CITTADINO_LANDING_PARAM + Ambito.DID);
    } else {
      /**BISOGNA CONTROLLARE SE I TITOLI DI STUDIO PRESENTI NELLA SAP SONO VALIDI ANCHE PER L'INSERIMENTO DEL PROFILING  */
      if (isNullOrUndefined(this.titoliStudioPerProfiling) || this.titoliStudioPerProfiling.length === 0) {
        this.openModal(this.msgsTitoloStudio, FASCICOLO_CITTADINO_LANDING_PARAM + Ambito.DID);
        return false;
      }
    }
    return true;
  }
}
