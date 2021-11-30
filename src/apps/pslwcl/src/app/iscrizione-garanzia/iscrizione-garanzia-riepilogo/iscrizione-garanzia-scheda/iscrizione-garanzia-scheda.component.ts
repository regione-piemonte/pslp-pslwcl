import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Params, Router } from '@angular/router';
import { AdesioneYG, BusinessService, DatiInputStatoAdesione, ErrorDef, EsitoSendStatoAdesione, PrenotazioneIncontro, SchedaAnagraficoProfessionale, StampeService, UtenteRiepilogoIscrizione } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { Ambito, DialogModaleMessage, StatoIncontro, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, ParametriSistemaService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { CommonPslpService } from '@pslwcl/pslservice';


const PRIVACY_LANDING_ISCR = '/privacy-landing?param=ISCR';
const FASCICOLO_CITTA_LANDING_PARAM = '/fascicolo-cittadino-landing?param=';
const ISCRIZIONE_GARANZIA_GIOVANI = 'Iscrizione garanzia giovani';
const ISCRIZIONE_GARANZIA = '/iscrizione-garanzia';
@Component({
  selector: 'app-iscrizione-garanzia-scheda',
  templateUrl: './iscrizione-garanzia-scheda.component.html',
  styleUrls: ['./iscrizione-garanzia-scheda.component.css']
})
export class IscrizioneGaranziaSchedaComponent implements OnInit {
  @Input() idUtente: number;
  @Input() idSilLav: number;
  @Input() codFiscOperatore: string;
  @Input() idTutore: number = null;
  @Input() isTutelato: boolean;
  @Input() utenteRiepIscr: UtenteRiepilogoIscrizione;
  @Input() msgEtaNonCoerente: string;
  @Output() loadedData: EventEmitter<void> = new EventEmitter();
  sap: SchedaAnagraficoProfessionale;
  loaded: boolean;
  adesioneGG: AdesioneYG;
  adesionePostfisso: string;
  adesioneUltimaVariazione: boolean;
  appuntamento: PrenotazioneIncontro;
  appuntamentoDescrizione: string;
  eta: number;
  msgErroreBloccante: string;
  loadingData: boolean;
  adesioneCompletamenteRespinta: boolean;
  adesioneStatoInvio: string;
  adesioneMsgRespinta: string;
  dataFormat = "";
  eliminaIncontro: boolean;
  visualizzaBloccoMsg = true;

  constructor(
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly businessService: BusinessService,
    private readonly stampeService: StampeService,
    private readonly commonPslpService: CommonPslpService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly securityService: SecurityPslpService
  ) {
    this.loaded = false;
  }

  async ngOnInit() {
    if (this.loaded === true) {
      return;
    }
    this.loadingData = true;
    this.adesioneGG = this.utenteRiepIscr.dati.adesione;
    this.sap = this.utenteRiepIscr.dati.sap;
    this.eta = this.utenteRiepIscr.dati.eta;
    this.appuntamento = this.utenteRiepIscr.dati.appuntamento;
    if (this.appuntamento) {
      const st = StatoIncontro.getByCodice(this.appuntamento.codice_anpal_stato_incontro);
      this.appuntamentoDescrizione = st ? st.descrizione : '';
    }
    if (this.isPresenteAdesione()) {
      if (this.adesioneGG.presenzaPiuAdesioniAperte) {
        const msg = await this.utilitiesService.getMessage('ME151');
        this.msgErroreBloccante = msg;
        this.utenteRiepIscr.dati.messaggi = [];
      }
      this.setAdesionePostfisso();
      // cambio requisito visualizza sempre Riep_Maggior_GG_24 3/12/2020
      this.adesioneUltimaVariazione = true;
      if (!this.adesioneGG.data_stato_corrente) {
        this.adesioneGG.data_stato_corrente = this.adesioneGG.data_adesione;
      }
      this.adesioneCompletamenteRespinta = false;
      if (this.adesioneGG.data_rifiuto) {
        await this.setAdesioneRespinta();
      }
      this.adesioneStatoInvio = "Inviata";
      if (this.adesioneGG.flg_anpal_stato_corrente !== "S") {
        const msg = await this.utilitiesService.getMessage('MI037');
        this.adesioneStatoInvio = msg;
      }
      if (this.isVisualizzaBloccoMsg()) {
        this.visualizzaBloccoMsg = false;
      }
    }
    this.loadingData = false;
    this.loadedData.emit();
    this.loaded = true;
  }

  /**
   * Determines whether visualizza blocco msg is
   *
   */
  private isVisualizzaBloccoMsg() {
    return !isNullOrUndefined(this.utenteRiepIscr.dati.messaggi) &&
      this.utenteRiepIscr.dati.messaggi.length > 0 &&
      (this.adesioneGG && this.adesioneGG.id_sil_lav_adesione) &&
      this.adesioneGG.stato_corrente_finale === 'N' &&
      !this.utenteRiepIscr.dati.adesioneFuoriRegione;
  }

  /**
   * Sets adesione respinta
   */
  private async setAdesioneRespinta() {
    this.adesioneCompletamenteRespinta = true;
    let msg = await this.utilitiesService.getMessage('MI038');
    this.dataFormat = moment(this.adesioneGG.data_rifiuto).format('DD/MM/YYYY');
    msg = msg.replace('{0}', this.dataFormat);
    if (this.adesioneGG.motivo_rifiuto_stato_corrente) {
      msg = msg.replace('{1}', this.adesioneGG.motivo_rifiuto_stato_corrente);
    } else {
      const msg1 = await this.utilitiesService.getMessage('MI040');
      msg = msg.replace('{1}', msg1);
    }
    this.adesioneMsgRespinta = msg;
  }

  /**
   * Determines whether presente adesione is
   * @returns boolean
   */
  private isPresenteAdesione() {
    return this.adesioneGG
      && this.adesioneGG.id_sil_lav_adesione;
  }

  /**
   * Sets adesione postfisso
   */
  private setAdesionePostfisso() {
    if (this.adesioneGG.stato_corrente_finale === 'S') {
      this.adesionePostfisso = "Terminata";
    } else {
      this.adesionePostfisso = "In corso";
    }
  }

  /**
   * Determines whether privacy on
   */
  onPrivacy() {
    this.setDataIscrizione();
    this.securityService.jumpToURL(PRIVACY_LANDING_ISCR, TypeApplicationCard.Fascicolo);
  }

  /**
   * Sets data iscrizione
   */
  private async setDataIscrizione() {
    this.commonPslpService.inizializzaSoft();

    this.commonPslpService.setSapStorage(this.sap);

    this.commonPslpService.wizard = true;
    this.commonPslpService.readOnly = false;
    if (this.commonPslpService.obbligoDomicilioPiemontePerModifica() &&
      !this.commonPslpService.isSapDomicilioPiemonte(this.sap)) {
      this.commonPslpService.readOnlyDomicilio = true;
    }

    this.commonPslpService.firstPage = "riepilogo";
    this.commonPslpService.setUtenteStorage({ id_utente: this.idUtente });
  }

  /**
   * Determines whether adesione presente is
   * @returns boolean
   */
  isAdesionePresente() {
    return !isNullOrUndefined(this.adesioneGG);
  }

  /**
   * Determines whether possibile iscrizione is
   * @returns boolean
   */
  isPossibileIscrizione() {
    if (this.adesioneGG
      && this.adesioneGG.id_sil_lav_adesione
      && this.adesioneGG.presenzaPiuAdesioniAperte) {
      return false;
    }
    if (this.isTutelato && this.utenteRiepIscr.dati.maggiorenne) {
      return false;
    }
    return this.utenteRiepIscr.dati.possibileIscrizione;
  }

  /**
   * Determines whether possibile stampa is
   * @returns boolean
   */
  isPossibileStampa() {
    if (this.isTutelato && this.utenteRiepIscr.dati.maggiorenne) {
      return false;
    }
    return this.utenteRiepIscr.dati.possibileStampa;
  }

  /**
   * Determines whether possibile annullamento is
   * @returns boolean
   */
  isPossibileAnnullamento() {
    if (this.adesioneGG
      && this.adesioneGG.id_sil_lav_adesione
      && this.adesioneGG.presenzaPiuAdesioniAperte) {
      return false;
    }
    if (this.isTutelato && this.utenteRiepIscr.dati.maggiorenne) {
      return false;
    }
    return this.utenteRiepIscr.dati.possibileAnnullamento;
  }



  /**
   * Determines whether stampa adesione on
   */
  async onStampaAdesione() {
    this.utilitiesService.showSpinner();
    try {
      const response = await
        this.stampeService.creaStampaAdesione(this.idUtente, this.adesioneGG.id_sil_lav_adesione).toPromise();
      this.utilitiesService.downloadFile(response, 'application/pdf', 'adesione.pdf');
    } finally {
      this.utilitiesService.hideSpinner();
    }

  }

  /**
   * Determines whether iscriviti gg on
   *
   */
  async onIscrivitiGG() {
    let messaggio = '';
    if (isNullOrUndefined(this.utenteRiepIscr.utente.id_sil_lav_anagrafica) || isNullOrUndefined(this.sap)) {
      messaggio = await this.utilitiesService.getMessage('ME139');
      this.openModalSiNo(messaggio, FASCICOLO_CITTA_LANDING_PARAM + Ambito.ISCR, TypeApplicationCard.Fascicolo);
      return;
    }
    if (!this.isTutelato) {
      // tutore per se stesso
      if (!this.utenteRiepIscr.dati.presente_privacy) {
        messaggio = await this.utilitiesService.getMessage('ME101');
        messaggio = messaggio.replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
        this.openModalSiNo(messaggio, PRIVACY_LANDING_ISCR, TypeApplicationCard.Fascicolo);
        return;
      }
    } else {
      // tutore dev prender visione della privacy per tutelato
      if (!this.utenteRiepIscr.dati.presente_privacy) {
        messaggio = await this.utilitiesService.getMessage('ME133');
        messaggio = messaggio.replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
        this.openModalSiNo(messaggio, PRIVACY_LANDING_ISCR, TypeApplicationCard.Fascicolo);
        return;
      }
    }
    // controlla se presente mail
    if (isNullOrUndefined(this.sap.recapito.email)) {
      messaggio = await this.utilitiesService.getMessage('ME141');
      /* "Per procedere, è necessario impostare indirizzo mail per ricevere eventuali
       comunicazioni future. Selezionare la funzionalità Gestione Fascicolo cittadino dalla Home
       Page ed aggiornare i dati anagrafici, impostando la mail";
       */
      this.openModalSiNo(messaggio, FASCICOLO_CITTA_LANDING_PARAM + Ambito.ISCR, TypeApplicationCard.Fascicolo);
      return;
    }

    if (!this.utenteRiepIscr.dati.domicilio_piemonte) {
      messaggio = (await this.utilitiesService.getMessage('ME140')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));
      this.openModalSiNo(messaggio, FASCICOLO_CITTA_LANDING_PARAM + Ambito.ISCR, TypeApplicationCard.Fascicolo);
      return;
    }

    if (!this.utenteRiepIscr.dati.eta_coerente) {
      this.utilitiesService.hideSpinner();
      // eta fuori dal range GG
      messaggio = this.msgEtaNonCoerente;

      this.openModalSiNo(messaggio, '/iscrizione-garanzia/iscrizione-garanzia-riepilogo', TypeApplicationCard.Cittadino);
      return;
    }

    messaggio = "Si desidera procedere all'iscrizione?";
    this.confermaOperazione(messaggio, 'I');

  }

  /**
   * Determines whether annulla adesione on
   *
   */
  async onAnnullaAdesione() {
    let messaggio = '';
    if (!this.isTutelato) {
      // tutore per se stesso
      if (!this.utenteRiepIscr.dati.presente_privacy) {
        messaggio = await this.utilitiesService.getMessage('ME101');
        messaggio = messaggio.replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
        this.openModalSiNo(messaggio, PRIVACY_LANDING_ISCR, TypeApplicationCard.Fascicolo);
        return;
      }
    } else {
      // tutore dev prender visione della privacy per tutelato
      if (!this.utenteRiepIscr.dati.presente_privacy) {
        messaggio = await this.utilitiesService.getMessage('ME133');
        messaggio = messaggio.replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
        this.openModalSiNo(messaggio, PRIVACY_LANDING_ISCR, TypeApplicationCard.Fascicolo);
        return;
      }
    }
    // controlla se presente mail
    if (isNullOrUndefined(this.sap.recapito.email)) {
      messaggio = await this.utilitiesService.getMessage('ME141');
      /* "Per procedere, è necessario impostare indirizzo mail per ricevere eventuali
      comunicazioni future. Selezionare la funzionalità Gestione Fascicolo cittadino dalla Home Page
       ed aggiornare i dati anagrafici, impostando la mail";
       */
      this.openModalSiNo(messaggio, FASCICOLO_CITTA_LANDING_PARAM + Ambito.ISCR, TypeApplicationCard.Fascicolo);
      return;
    }
    this.eliminaIncontro = false;
    // controlla se presente appuntamento da erogare
    if (!isNullOrUndefined(this.utenteRiepIscr.dati.appuntamento)
      && this.utenteRiepIscr.dati.appuntamento.codice_anpal_stato_incontro === "DE") {
      messaggio = await this.utilitiesService.getMessage('MI042');
      await this.openModalConfermaSenzaLink(messaggio);
      this.eliminaIncontro = true;
    }

    messaggio = "Si desidera procedere all'annullamento dell'adesione?";
    this.confermaOperazione(messaggio, 'A');
  }

  /**
   * Opens modal si no
   * @param messaggio string
   * @param destination string
   * @param appl TypeApplicationCard
   */
  async openModalSiNo(messaggio: string, destination: string, appl: TypeApplicationCard) {
    const data: DialogModaleMessage = {
      titolo: ISCRIZIONE_GARANZIA_GIOVANI,
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: messaggio
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      if (appl === TypeApplicationCard.Cittadino) {
        this.router.navigateByUrl(destination);
      } else {
        this.securityService.jumpToURL(destination, appl);
      }
    }
  }

  /**
   * Opens modal conferma
   * @param messaggio string
   * @param destination string
   * @param appl TypeApplicationCard
   */
  async openModalConferma(messaggio: string, destination: string, appl: TypeApplicationCard) {
    const data: DialogModaleMessage = {
      titolo: ISCRIZIONE_GARANZIA_GIOVANI,
      tipo: TypeDialogMessage.Confirm,
      messaggio: "",
      messaggioAggiuntivo: messaggio
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      if (appl === TypeApplicationCard.Cittadino) {
        this.router.navigateByUrl(destination);
      } else {
        this.securityService.jumpToURL(destination, appl);
      }
    }
  }
  /**
   * Opens modal conferma senza link
   * @param messaggio string
   *
   */
  async openModalConfermaSenzaLink(messaggio: string) {
    const data: DialogModaleMessage = {
      titolo: ISCRIZIONE_GARANZIA_GIOVANI,
      tipo: TypeDialogMessage.Confirm,
      messaggio: "",
      messaggioAggiuntivo: messaggio
    };
    const result = await this.pslbasepageService.openModal(data);
    return result;
  }

  /**
   * Confermas operazione
   * @param messaggio string
   * @param destination string
   */
  async confermaOperazione(messaggio: string, destination: string) {
    const data: DialogModaleMessage = {
      titolo: ISCRIZIONE_GARANZIA_GIOVANI,
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: messaggio
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      switch (destination) {
        case 'I':
          this.doIscrizione();
          break;
        case 'A':
          this.doAnnullaAdesione();
          break;
        default:
          break;
      }
    }
  }

  /**
   * Do iscrizione
   * @returns string
   */
  async doIscrizione() {

    this.utilitiesService.showSpinner();
    this.setDataIscrizione();

    let codFisc = null;
    let idSilLav = null;

    if (!isNullOrUndefined(this.sap) && !isNullOrUndefined(this.sap.codice_fiscale)) {
      codFisc = this.sap.codice_fiscale;
      idSilLav = this.idSilLav;
    } else if (!isNullOrUndefined(this.utenteRiepIscr)
      && !(isNullOrUndefined(this.utenteRiepIscr.utente))
      && !isNullOrUndefined(this.utenteRiepIscr.utente.codice_fiscale)) {
      codFisc = this.utenteRiepIscr.utente.codice_fiscale;
    }
    const parametri: DatiInputStatoAdesione = {
      id_anagrafica: this.idSilLav,
      codice_fiscale: codFisc,
      data_adesione: new Date(),
      identificativo_sap: this.sap.identificativo_sap,
      codice_stato_adesione: 'A',
      codice_fiscale_operatore: this.codFiscOperatore

    };
    const esito = await
      this.businessService.sendStatoAdesione(this.idUtente, parametri).pipe(
        catchError(err => {
          this.logService.error('[iscrizione-garanzia-scheda.component::doIscrizione]', JSON.stringify(err));
          const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
          const esito2: EsitoSendStatoAdesione = {
            code: errore.code,
            messaggioCittadino: errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage
          };
          return of(esito2);
        })).toPromise();
    this.utilitiesService.hideSpinner();
    if (esito.code === "ERR") {
      const msg: Params = { 'message': esito.messaggioCittadino };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }

    this.openModalConferma(esito.messaggioCittadino, ISCRIZIONE_GARANZIA, TypeApplicationCard.Cittadino);


    if (!isNullOrUndefined(esito.adesione)) {
      this.adesioneGG = esito.adesione;
    }

    this.router.navigateByUrl(ISCRIZIONE_GARANZIA);
  }


  /**
   * Do annulla adesione
   *
   */
  async doAnnullaAdesione() {
    this.utilitiesService.showSpinner();

    this.setDataIscrizione();

    let codFisc = null;
    let idSilLav = null;
    if (!isNullOrUndefined(this.sap) && !isNullOrUndefined(this.sap.codice_fiscale)) {
      codFisc = this.sap.codice_fiscale;
      idSilLav = this.idSilLav;
    } else if (!isNullOrUndefined(this.utenteRiepIscr)
      && !(isNullOrUndefined(this.utenteRiepIscr.utente))
      && !isNullOrUndefined(this.utenteRiepIscr.utente.codice_fiscale)) {
      codFisc = this.utenteRiepIscr.utente.codice_fiscale;
    }
    const parametri: DatiInputStatoAdesione = {
      id_anagrafica: this.idSilLav,
      codice_fiscale: codFisc,
      data_adesione: this.adesioneGG.data_stato_corrente,
      identificativo_sap: this.sap.identificativo_sap,
      id_adesione: this.adesioneGG.id_sil_lav_adesione,
      data_stato_adesione: new Date(),
      codice_stato_adesione: 'D',
      motivo: 'annullato dal cittadino',
      codice_fiscale_operatore: this.codFiscOperatore
    };
    if (this.eliminaIncontro) {
      parametri.appuntamento_da_cancellare = this.appuntamento;
    }

    const esito = await
      this.businessService.sendStatoAdesione(this.idUtente, parametri).pipe(
        catchError(err => {
          this.logService.error('[iscrizione-garanzia-scheda.component::doAnnullaAdesione]', JSON.stringify(err));
          const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
          const esito2: EsitoSendStatoAdesione = {
            code: errore.code,
            messaggioCittadino: errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage
          };
          return of(esito2);
        })).toPromise();
    this.utilitiesService.hideSpinner();


    this.adesioneGG = esito.adesione;
    if (esito.code === "ERR") {
      const msg: Params = { 'message': esito.messaggioCittadino };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
    this.openModalConferma(esito.messaggioCittadino, ISCRIZIONE_GARANZIA, TypeApplicationCard.Cittadino);
    this.router.navigateByUrl(ISCRIZIONE_GARANZIA);
  }

  /**
   * Adesiones in
   * @param stati string[]
   * @returns boolean
   */
  adesioneIn(...stati: string[]): boolean {
    if (!this.adesioneGG || !this.adesioneGG.codice) {
      return false;
    }
    return stati.some(stato => this.adesioneGG.codice === stato);
  }

  /**
   * Appuntamentos in
   * @param stati string[]
   * @returns boolean
   */
  appuntamentoIn(...stati: string[]): boolean {
    return this.isAppuntamentoIn(this.appuntamento, ...stati);
  }
  /**
   * Determines whether appuntamento in is
   * @param appuntamento PrenotazioneIncontro
   * @param stati string[]
   * @returns true if appuntamento in
   */
  private isAppuntamentoIn(appuntamento: PrenotazioneIncontro, ...stati: string[]): boolean {
    if (!appuntamento) {
      return false;
    }
    return stati.some(stato => appuntamento.codice_anpal_stato_incontro === stato);
  }
}
