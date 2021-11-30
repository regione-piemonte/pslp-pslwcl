import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { PslshareService } from '@pslwcl/pslshare';
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class PrivacyGuard implements CanActivate, CanActivateChild {
  /**
   * Creates an instance of privacy guard.
   *
   */
  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly utilitiesService: UtilitiesService,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService

  ) { }
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
      this.router.navigateByUrl('/');
      return false;
    }
    if (this.appUserService.getPrivacy(Ambito.RDC)) {
      return true;
    }
    if (route.url[0].path === 'presentazione-rdc') {
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
      titolo: 'Prenotazione Incontro Reddito Di Cittadinanza',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",

      messaggioAggiuntivo: (await this.utilitiesService.getMessage('ME101')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.RDC))
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.RDC, TypeApplicationCard.Fascicolo);
    } else {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }

}
