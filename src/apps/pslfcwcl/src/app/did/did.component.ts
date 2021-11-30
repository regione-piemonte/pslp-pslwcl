import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Params, Router } from '@angular/router';
import { BusinessService, EsitoDettaglioDid, Indirizzo, Privacy, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { DettaglioDIDUtilitiesService } from './dettaglio-did/dettaglio-did-utilities.service';

const FASCICOLO_CITTADINO_LANDING_PARAM = '/fascicolo-cittadino-landing?param=';
@Component({
  selector: 'pslfcwcl-did',
  templateUrl: './did.component.html'
})

export class DIDComponent implements OnInit, OnDestroy {

  loaded = false;
  elencoPrivacyUtente: Privacy[];
  esitoDettaglioRicercaDid: EsitoDettaglioDid;

  private readonly subscriptions = [] as Array<Subscription>;

  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly logService: LogService,
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    protected businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService,
    private readonly dettaglioUtilitiesService: DettaglioDIDUtilitiesService
  ) { }

  /**
   * on init
   */
  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationStart && this.isInitUrl(event.url))
      ).subscribe(() => this.initialization())
    );
    await this.initialization();
    this.loaded = true;
  }

  /**
   * on destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Determines whether init url is
   * @param url string
   * @returns boolean
   */
  private isInitUrl(url: string) {
    return url === '' || url === '/did';
  }

  /**
   * Initializations didcomponent
   * @returns initialization
   */
  private async initialization(): Promise<void> {
    try {
      this.commonFCService.AMBITO = Ambito.FASC;

      let utente = await this.appUserService.verificaEsistenzaUtente();
      if (!utente.id_sil_lav_anagrafica) {
        if (!isNullOrUndefined(utente.id_utente)) {
           utente = await this.businessService.getUtenteById(+utente.id_utente).toPromise();
        }
        if (!utente.id_sil_lav_anagrafica) {
          this.logService.log('Verifica utente - Utente non presente in silp');
          this.openModal(await this.utilitiesService.getMessage('ME136'), FASCICOLO_CITTADINO_LANDING_PARAM + Ambito.DID);
          this.utilitiesService.hideSpinner();
          return;
        }
      }
      await this.commonFCService.verificaUtenteDID();

      let idUtente = this.appUserService.getIdUtente();
      if (isNullOrUndefined(idUtente)) {
        idUtente = await this.recuperaUtente();
      }
      /** controllo della privacy  */
      this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(idUtente);
      const laPrivacyDellUtente = this.elencoPrivacyUtente.find(el => el.cod_ambito === this.commonFCService.AMBITO);
      if (this.isPrivacyNonAccettata(laPrivacyDellUtente)) {
        this.utilitiesService.hideSpinner();
        const msg = (await this.utilitiesService.getMessage('ME101')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));
        this.openModal(msg, '/privacy-landing?param=' + Ambito.DID);
        return;
      }

      this.esitoDettaglioRicercaDid = await this.dettaglioUtilitiesService.ricercaDettaglioDIDService(idUtente);
      if (this.isPresentiErroriInRicercaDID()) {
        return this.esitoRicercaDettaglioDIDConErrori();
      } else if (!isNullOrUndefined(this.esitoDettaglioRicercaDid)) {
        // DID TROVATA
        if (this.isDidNonRegolare()) {
          this.utilitiesService.hideSpinner();
          this.openModalConfirm(await this.utilitiesService.getMessage('ME003'), true);
          return;
        }
      }

      const sap = await this.commonFCService.getSap$(idUtente);
      if (this.isDIDPresente()) {
        /** DID PRESENTE QUINDI METTO EVENTUALE MODALE CON SOLO CONFERMA PER PROSEGUIRE*/
        await this.DIDTrovata(sap);
      } else {
        /** DID NON PRESENTE QUINDI METTO EVENTUALE MODALE CON SI/NO
         * CONTROLLO EVENTUALE DOMICILIO IN PIEMONTE O RESIDENZA ALL'ESTERO
        */
        if (!this.utilitiesService.isSapDomicilioPiemonte(sap)) {
          this.utilitiesService.hideSpinner();
          // mettere il messaggio per il domicilio non in piemonte!
          const msg = (await this.utilitiesService.getMessage('ME137')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));
          this.openModal(msg, FASCICOLO_CITTADINO_LANDING_PARAM + Ambito.DID);
          return;
        } else if (this.isResidenzaEstera(sap.residenza)) {
          this.utilitiesService.hideSpinner();
          const msg = (await this.utilitiesService.getMessage('ME146')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));
          this.openModal(msg, FASCICOLO_CITTADINO_LANDING_PARAM + Ambito.DID);
          return;
        }
      }
      this.router.navigateByUrl('/did/riepilogo-did');
      this.utilitiesService.setLinkLand('/did');
      this.utilitiesService.hideSpinner();
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      this.router.navigate(['/error-page'], { queryParams: msg });
    }
  }

  /**
   * Determines whether did non regolare is
   * @returns boolean
   */
  private isDidNonRegolare() {
    return this.isCodUltimoStatoUgualeE() || (this.isStatoFinaleUgualeN() && this.isDataDidOrDataStato());
  }

  /**
   * Recuperas utente
   * @returns boolean
   */
  private async recuperaUtente() {
    await this.appUserService.saveUtente();
    const idUtente = this.appUserService.getIdUtente();
    let sappina: SchedaAnagraficoProfessionale;
    try {
      sappina = await this.businessService.getSAP(idUtente, this.commonFCService.AMBITO).toPromise();
    } catch (err) {
      const errore = (err instanceof HttpErrorResponse) ? err.error : err;
      const code = (err instanceof HttpErrorResponse) ? err.error.code : '500';
      if (code === '403') {
        throw new Error(errore.errorMessage || errore.message);
      }
    }
    if (!isNullOrUndefined(sappina)) {
      this.commonFCService.setSapAndIdUtenteStorage(sappina, idUtente);
    }
    return idUtente;
  }

  /**
   * Determines whether privacy non accettata is
   * @param laPrivacyDellUtente Privacy
   * @returns booelan
   */
  private isPrivacyNonAccettata(laPrivacyDellUtente: Privacy) {
    return isNullOrUndefined(laPrivacyDellUtente) || !laPrivacyDellUtente.stato;
  }

  /**
   * Determines whether didpresente is
   * @returns boolean
   */
  private isDIDPresente() {
    return !isNullOrUndefined(this.esitoDettaglioRicercaDid) && !isNullOrUndefined(this.esitoDettaglioRicercaDid.id_did);
  }

  /**
   * Determines whether presenti errori in ricerca did is
   * @returns boolean
   */
  private isPresentiErroriInRicercaDID() {
    return !isNullOrUndefined(this.esitoDettaglioRicercaDid)
      && !isNullOrUndefined(this.esitoDettaglioRicercaDid.error)
      && this.esitoDettaglioRicercaDid.error.length > 0;
  }

  /**
   * Determines whether residenza estera is
   * @param residenza Indirizzo
   * @returns boolean
   */
  private isResidenzaEstera(residenza: Indirizzo) {
    return !isNullOrUndefined(residenza)
      && !isNullOrUndefined(residenza.stato)
      && !isNullOrUndefined(residenza.stato.descrizione)
      && residenza.stato.descrizione !== 'ITALIA';
  }

  /**
   * Determines whether cod ultimo stato uguale e is
   * @returns boolean
   */
  private isCodUltimoStatoUgualeE() {
    return !isNullOrUndefined(this.esitoDettaglioRicercaDid.cod_ultimo_stato)
      && this.esitoDettaglioRicercaDid.cod_ultimo_stato === 'E';
  }

  /**
   * Determines whether stato finale uguale n is
   * @returns boolean
   */
  private isStatoFinaleUgualeN() {
    return !isNullOrUndefined(this.esitoDettaglioRicercaDid.flg_stato_finale)
      && (this.esitoDettaglioRicercaDid.flg_stato_finale === 'N');
  }

  /**
   * Determines whether data did or data stato is
   * @returns boolean
   */
  private isDataDidOrDataStato() {
    return (isNullOrUndefined(this.esitoDettaglioRicercaDid.data_did) ||
      !this.esitoDettaglioRicercaDid.data_did) || (isNullOrUndefined(this.esitoDettaglioRicercaDid.data_stato) ||
        !this.esitoDettaglioRicercaDid.data_stato);
  }

  /**
   * Didtrovatas didcomponent
   * @param sap SchedaAnagraficoProfessionale
   */
  private async DIDTrovata(sap: SchedaAnagraficoProfessionale) {
    if (!this.utilitiesService.isSapDomicilioPiemonte(sap)
      || this.esitoDettaglioRicercaDid.flg_ente_titolarita_piemontese !== 'S') {
      this.utilitiesService.hideSpinner();
      // mettere il messaggio per il domicilio non in piemonte!
      const msg = (await this.utilitiesService.getMessage('MI048')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));
      this.openModalConfirm(msg, false);
    } else if (!isNullOrUndefined(sap.residenza)
      && !isNullOrUndefined(sap.residenza.stato)
      && !isNullOrUndefined(sap.residenza.stato.descrizione)
      && sap.residenza.stato.descrizione !== 'ITALIA') {
      this.utilitiesService.hideSpinner();
      const msg = (await this.utilitiesService.getMessage('MI049')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));
      this.openModalConfirm(msg, false);
      // return;
    }
  }

  /**
   * Esitos ricerca dettaglio didcon errori
   */
  private esitoRicercaDettaglioDIDConErrori() {
    let msgError = "";
    for (const value of this.esitoDettaglioRicercaDid.error) {
      msgError += value;
    }
    this.utilitiesService.hideSpinner();
    this.openModalConfirm(msgError, true);
  }

  /**
   * Opens modal
   * @param msg string
   * @param destination string url
   */
  async openModal(msg: string, destination: string) {
    const data: DialogModaleMessage = {
      titolo: 'DID',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.router.navigateByUrl(destination);
    } else {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }

  /**
   * Opens modal confirm
   * @param msg string
   * @param home boolean se true torna alla homepage
   */
  async openModalConfirm(msg: string, home: boolean) {
    const data: DialogModaleMessage = {
      titolo: 'DID',
      tipo: TypeDialogMessage.Confirm,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      if (home) {
        this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
      }
    }
  }

}
