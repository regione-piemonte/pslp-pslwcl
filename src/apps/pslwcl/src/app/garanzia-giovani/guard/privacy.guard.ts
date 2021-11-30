import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { Utente } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, LogService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrivacyGuard implements CanActivate, CanActivateChild {
  utente: Promise<Utente>;
  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly logService: LogService,
    private readonly securityService: SecurityPslpService
  ) {
   }
  /**
   * Determines whether activate can
   * @param route ActivatedRouteSnapshot
   * @param state RouterStateSnapshot
   * @returns activate
   */
  canActivate(


    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    if (!this.appUserService.getUtente()) {
      this.router.navigateByUrl('/home');
      return false;
    }
    if (this.appUserService.getPrivacy(Ambito.GG)) {
      return true;
    }
    if (route.url[0].path === 'presentazione' || route.url[0].path === 'riepilogo') {
      return true;
    }
    this.utilitiesService.hideSpinner();
    this.openModal();

    return false;
  }

  /**
   * Determines whether activate child can
   * @param route ActivatedRouteSnapshot
   * @param state RouterStateSnapshot
   * @returns activate child
   */
  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state);
  }

  /**
   * Opens modal
   */
  async openModal() {
    const data: DialogModaleMessage = {
      titolo: 'Prenotazione Incontro Garanzia Giovani',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: (await this.utilitiesService.getMessage('ME101')).replace('{0}',  this.utilitiesService.getDescrAmbito(Ambito.GG))
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.GG, TypeApplicationCard.Fascicolo);
    } else {
      this.securityService.jumpToURL('/home?id=100', TypeApplicationCard.Home);
    }
  }
  /**
   * Gets utente
   * @returns Utente
   */
  async getUtente() {
    const userUtente = this.appUserService.getUtente();
    this.logService.log('userUtente-------------> ' + userUtente);
    if (userUtente) {
      const utente = await this.appUserService.verificaEsistenzaUtente();
      this.appUserService.setUtente(utente);
      return utente;
    }
    return this.appUserService.getUtente();
  }
}
