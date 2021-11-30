import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Params, Router } from '@angular/router';
import { BusinessService, EsitoRiepilogoCollocamentoMirato, Privacy, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isNull, isNullOrUndefined } from 'util';

const COLLOCAMENTO_MIRATO = 'Collocamento Mirato';
@Component({
  selector: 'pslfcwcl-collocamento-mirato',
  templateUrl: './collocamento-mirato.component.html'
})

export class CollocamentoMiratoComponent implements OnInit, OnDestroy {

  loaded = false;
  elencoPrivacyUtente: Privacy[];

  private readonly subscriptions = [] as Array<Subscription>;

  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly utilitiesService: UtilitiesService,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService,
    protected businessService: BusinessService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.commonFCService.AMBITO = Ambito.COMI;
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationStart && this.isInitUrl(event.url))
      ).subscribe(() => this.initialization())
    );
    await this.initialization();
    this.loaded = true;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Determines whether init url is
   * @param url string
   * @returns boolean
   */
  private isInitUrl(url: string) {
    return url === '' || url === '/collocamento-mirato';
  }

  /**
   * Initializations collocamento mirato component
   *
   */
  private async initialization() {
    try {
      await this.commonFCService.verificaUtenteFC();

      let idUtente = this.appUserService.getIdUtente();
      const operatore = this.appUserService.getOperatore();
      idUtente = await this.saveUtenteSeNuovo(idUtente);

      let utente = await this.appUserService.verificaEsistenzaUtente();
      if (!utente.id_sil_lav_anagrafica) {
        if (!isNullOrUndefined(utente.id_utente)) {
           utente = await this.businessService.getUtenteById(+utente.id_utente).toPromise();
        }
        if (!utente.id_sil_lav_anagrafica) {
          this.openModal(await this.utilitiesService.getMessage('ME135'), '/fascicolo-cittadino-landing?param=' + Ambito.COMI);
          this.utilitiesService.hideSpinner();
          return;
        }
      }

      const esito = await this.commonFCService.getCollocamentoMirato(idUtente);
      /** Non bisogna più controllare la presenza dell'iscrizione al collocamento mirato. */
      // const iscritto = this.commonFCService.isIscritto(esito);

      // if (!iscritto) {
      //   // 'non iscritto al collocamento mirato';
      //   msg = await this.utilitiesService.getMessage('ME102');
      //   this.utilitiesService.hideSpinner();
      //   this.openModalAnnulla(msg);
      // } else {
      //   await this.controlliIscritto(esito, msg, idUtente);
      // }
        await this.controlliIscritto(esito, idUtente);
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      this.router.navigate(['/error-page'], { queryParams: msg });
    }
  }

  /**
   * Controllis iscritto
   * @param esito EsitoRiepilogoCollocamentoMirato
   *
   * @param idUtente number
   */
  private async controlliIscritto(esito: EsitoRiepilogoCollocamentoMirato, idUtente: number) {
    let msg: string;
    const occorreCPI = this.commonFCService.isNecessarioCpi(esito);
    if (occorreCPI) {
      //  'occorre rivolgersi al Centro per l\'impiego di competenza';
      msg = await this.utilitiesService.getMessage('ME127');
    }
    // per il momento il Collocamento mirato utilizza la privacy del FASCICOLO ...
    // quindi bisogna forzare la chiamata delle privacy per fascicolo
    const privacyAssente = await this.isNonPresentePrivacy(idUtente);
    if (privacyAssente) {
      /*  'ATTENZIONE! Prima di procedere nel collocamento mirato, occorre accettare l\'informativa sulla privacy,
       per far ciò, è quindi necessario aggiornare il fascicolo cittadino.';
      */
      msg = (await this.utilitiesService.getMessage('ME101')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));

    }

    this.utilitiesService.hideSpinner();
    if (!isNullOrUndefined(msg)) {
      if (privacyAssente) {
        this.openModal(msg, '/privacy-landing?param=' + Ambito.COMI);
      } else {
        this.openModalConfirm(msg);
      }
    } else {
      this.router.navigateByUrl('/collocamento-mirato/riepilogo');
    }

  }

   // per il momento il Collocamento mirato utilizza la privacy del FASCICOLO ... quindi bisogna forzare la chiamata delle privacy per fascicolo
  /**
   * Determines whether non presente privacy is
   * @param idUtente number
   * @returns non presente privacy
   */
  private async isNonPresentePrivacy(idUtente: number): Promise<boolean> {

    if (isNullOrUndefined(this.commonFCService.elencoPrivacyUtente)) {
      this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(idUtente);
    } else {
      this.elencoPrivacyUtente = this.commonFCService.elencoPrivacyUtente;
    }
    const laPrivacyDellAmbito = this.elencoPrivacyUtente.find(el => el.cod_ambito === Ambito.FASC);
    return isNullOrUndefined(laPrivacyDellAmbito) || !laPrivacyDellAmbito.stato;
  }

  /**
   * Saves utente se nuovo
   * @param idUtente number
   * @returns idUtente salvato
   */
  private async saveUtenteSeNuovo(idUtente: number) {
    if (isNullOrUndefined(idUtente)) {
      await this.appUserService.saveUtente();
      idUtente = this.appUserService.getIdUtente();
      let sap: SchedaAnagraficoProfessionale;
      try {
        sap = await this.businessService.getSAP(idUtente, this.commonFCService.AMBITO).toPromise();
      } catch (err) {
        const errore = (err instanceof HttpErrorResponse) ? err.error : err;
        const code = (err instanceof HttpErrorResponse) ? err.error.code : '500';
        if (code === '403') {
          throw new Error(errore.errorMessage || errore.message);
        }
      }
      if (!isNullOrUndefined(sap)) {
        this.commonFCService.setSapAndIdUtenteStorage(sap, idUtente);
      }
    }
    return idUtente;
  }

  /**
   * Opens modal
   * @param msg string
   * @param destination string
   */
  async openModal(msg: string, destination: string) {
    const data: DialogModaleMessage = {
      titolo: COLLOCAMENTO_MIRATO,
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.utilitiesService.setParamLand('COMI');
      this.router.navigateByUrl(destination);
    } else {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }

  /**
   * Opens modal confirm
   * @param msg string
   */
  async openModalConfirm(msg: string) {
    const data: DialogModaleMessage = {
      titolo: COLLOCAMENTO_MIRATO,
      tipo: TypeDialogMessage.Confirm,
      messaggio: msg,
      messaggioAggiuntivo: ''
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }


  /**
   * Opens modal annulla
   * @param msg string
   */
  async openModalAnnulla(msg: string) {
    const data: DialogModaleMessage = {
      titolo: COLLOCAMENTO_MIRATO,
      tipo: TypeDialogMessage.Annulla,
      messaggio: msg,
      messaggioAggiuntivo: ""
    };
    await this.pslbasepageService.openModal(data);
    this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
  }

}
