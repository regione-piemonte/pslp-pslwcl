import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Params, Router } from '@angular/router';
import { BusinessService, Privacy, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { CommonPslpService } from '@pslwcl/pslservice';

@Component({
  selector: 'app-garanzia-giovani',
  templateUrl: './garanzia-giovani.component.html'
})
export class GaranziaGiovaniComponent implements OnInit, OnDestroy {
  private readonly subscriptions = [] as Array<Subscription>;
  elencoPrivacyUtente: Privacy[];

  constructor(
    private readonly commonPslpService: CommonPslpService,
    private readonly securityService: SecurityPslpService,
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly appUserService: AppUserService,
    protected businessService: BusinessService
  ) {
    this.commonPslpService.AMBITO = Ambito.GG;
  }

  ngOnInit() {
    this.utilitiesService.showSpinner();
    this.initialization();
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationStart && (event.url === '' || event.url === '/garanzia-giovani'))
      ).subscribe(() => this.initialization())
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Initializations garanzia giovani component
   *
   */
  private async initialization() {
    try {

      let utente = await this.appUserService.verificaEsistenzaUtente();
      if (!utente.id_sil_lav_anagrafica) {
        if (!isNullOrUndefined(utente.id_utente)) {
            utente = await this.businessService.getUtenteById(+utente.id_utente).toPromise();
        }
        if (!utente.id_sil_lav_anagrafica) {
          this.openModal(await this.utilitiesService.getMessage('ME139'), '/fascicolo-cittadino-landing?param=' + Ambito.GG);
          this.utilitiesService.hideSpinner();
          return;
        }
      }
      await this.commonPslpService.verificaUtente();
      let idUtente = this.appUserService.getIdUtente();
      if (isNullOrUndefined(idUtente)) {
        idUtente = await this.recuperaUtente();
      }
      // utente senza appuntamenti ma potrebbe avere la privacy già confermata
      this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(idUtente);
      const laPrivacyDellUtente = this.elencoPrivacyUtente.find(el => el.cod_ambito === this.commonPslpService.AMBITO);
      if (this.isPrivacyDaAccettare(laPrivacyDellUtente)) {
        this.utilitiesService.hideSpinner();
        const msg = (await this.utilitiesService.getMessage('ME101')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
        this.openModal(msg, '/privacy-landing?param=' + Ambito.GG);
      } else {
        this.router.navigateByUrl('/garanzia-giovani/riepilogo');
      }
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      this.router.navigate(['/error-page'], { queryParams: msg });
    }
  }

  /**
   * Recuperas utente
   * @returns  idUtente identificativo univoco utente pslp
   */
  private async recuperaUtente() {
    await this.appUserService.saveUtente();
    const idUtente = this.appUserService.getIdUtente();
    let sap: SchedaAnagraficoProfessionale;
    try {
      sap = await this.businessService.getSAP(idUtente, Ambito.GG).toPromise();
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
   * Determines whether privacy da accettare is
   * @param laPrivacyDellUtente  Privacy
   * @returns boolean
   */
  private isPrivacyDaAccettare(laPrivacyDellUtente: Privacy) {
    return isNullOrUndefined(laPrivacyDellUtente) || !laPrivacyDellUtente.stato;
  }

  /**
   * Opens modal
   */
  async openModal(msg: string, destination: string) {
    const data: DialogModaleMessage = {
      titolo: 'Prenotazione Incontro Garanzia Giovani',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL(destination, TypeApplicationCard.Fascicolo);
    } else {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }

  /**
   * Opens modal confirm
   * @param msg string
   * @param home boolean - truue torna alla home
   */
  async openModalConfirm(msg: string, home: boolean) {
    const data: DialogModaleMessage = {
      titolo: 'GARANZIA GIOVANI',
      tipo: TypeDialogMessage.Confirm,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    await this.pslbasepageService.openModal(data);
    if (home) {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }

}
