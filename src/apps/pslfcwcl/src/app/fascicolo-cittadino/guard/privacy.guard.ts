import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild } from '@angular/router';
import { Observable } from 'rxjs';
import { AppUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

@Injectable({
  providedIn: 'root'
})
export class PrivacyGuard implements CanActivate, CanActivateChild {
  constructor(private readonly router: Router,
              private readonly appUserService: AppUserService,
              private readonly utilitiesService: UtilitiesService
  ) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      if (!this.appUserService.getUtente()) {
        this.router.navigateByUrl('/');
        return false;
      }
      if ( !isNullOrUndefined(this.utilitiesService.getParamLand())) {
        return true;
      }
      if (this.appUserService.getPrivacy(Ambito.FASC)) {
        return true;
      }
      if (route.url[0].path === 'presentazione') {
        return true;
      }
      const msg = 'Prima di procedere, accettare l\'informativa sulla privacy e navigare solo dall\'applicazione.';
      this.utilitiesService.showToastrErrorMessage(msg, 'Privacy');
      this.router.navigateByUrl('/fascicolo-cittadino/presentazione');
      return false;
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      return this.canActivate(route, state);
  }
}
