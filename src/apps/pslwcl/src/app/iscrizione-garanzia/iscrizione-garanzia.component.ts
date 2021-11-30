import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Params, Router } from '@angular/router';
import { BusinessService, EsitoRiepilogoIscrizione, Privacy, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { CommonPslpService } from '@pslwcl/pslservice';

@Component({
  selector: 'app-iscrizione-garanzia',
  templateUrl: './iscrizione-garanzia.component.html'
})

export class IscrizioneGaranziaComponent implements OnInit, OnDestroy {

  loaded = false;
  elencoPrivacyUtente: Privacy[];

  private readonly subscriptions = [] as Array<Subscription>;
  riepilogo: EsitoRiepilogoIscrizione;

  constructor(
    private readonly commonPslpService: CommonPslpService,
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    protected businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationStart && this.isInitUrl(event.url))
      ).subscribe(() => this.initialization())
    );
    await this.initialization();
    this.loaded = true;
    this.utilitiesService.hideSpinner();
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
    return url === '' || url === '/iscrizione-garanzia';
  }

  /**
   * Initializations iscrizione garanzia component
   *
   */
  private async initialization() {
    try {
      this.commonPslpService.AMBITO = Ambito.GG;
      let utente = await this.appUserService.verificaEsistenzaUtente();
      if (!utente.id_sil_lav_anagrafica) {
        if (!isNullOrUndefined(utente.id_utente)) {
           utente = await this.businessService.getUtenteById(+utente.id_utente).toPromise();
        }
        if (!utente.id_sil_lav_anagrafica) {
          const msg = await this.utilitiesService.getMessage('ME139');
          this.openModal(msg, '/fascicolo-cittadino-landing?param=' + Ambito.ISCR,
                                TypeApplicationCard.Fascicolo,
                             '/home', TypeApplicationCard.Home);
          this.utilitiesService.hideSpinner();
          return;
        }
      }

      let idUtente = this.appUserService.getIdUtente();

      if (isNullOrUndefined(idUtente)) {
        idUtente = await this.recuperaUtente();
      }

      this.utilitiesService.hideSpinner();

      /** controllo della privacy  */
      this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(idUtente);
      const laPrivacyDellUtente = this.elencoPrivacyUtente.find(el => el.cod_ambito === Ambito.GG);
      if (this.isPrivacyNonAccettata(laPrivacyDellUtente)) {
        const msg = (await this.utilitiesService.getMessage('ME101')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
        this.openModal(msg,
          '/privacy-landing?param=' + Ambito.ISCR, TypeApplicationCard.Fascicolo,
          '/home', TypeApplicationCard.Home);
        return;
      }

      this.router.navigateByUrl('/iscrizione-garanzia/iscrizione-garanzia-riepilogo');

    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      this.router.navigate(['/error-page'], { queryParams: msg });
    }
  }

  /**
   * Determines whether privacy non accettata is
   * @param laPrivacyDellUtente Privacy
   * @returns boolean
   */
  private isPrivacyNonAccettata(laPrivacyDellUtente: Privacy) {
    return isNullOrUndefined(laPrivacyDellUtente) || !laPrivacyDellUtente.stato;
  }

  /**
   * Recuperas utente
   * @returns idUtente
   */
  private async recuperaUtente() {
    await this.appUserService.saveUtente();
    const idUtente = this.appUserService.getIdUtente();
    let sap: SchedaAnagraficoProfessionale;
    try {
      sap = await this.businessService.getSAP(idUtente, this.commonPslpService.AMBITO).toPromise();
    } catch (err) {
      const errore = (err instanceof HttpErrorResponse) ? err.error : err;
      const code = (err instanceof HttpErrorResponse) ? err.error.code : '500';
      if (code === '403') {
        throw new Error(errore.errorMessage || errore.message);
      }
    }
    if (!isNullOrUndefined(sap)) {
      this.commonPslpService.setSapAndIdUtenteStorage(sap, idUtente);
    }
    return idUtente;
  }

  /**
   * Opens modal
   *
   */
  async openModal(msg: string, yesDestination: string, yesAppl: TypeApplicationCard,
                                noDestination?: string, noAppl?: TypeApplicationCard) {
    const data: DialogModaleMessage = {
      titolo: 'Iscrizione Garanzia Giovani',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL(yesDestination, yesAppl);
    } else if (!isNullOrUndefined(noDestination)) {
      this.securityService.jumpToURL(noDestination, noAppl);
    }
  }

}
