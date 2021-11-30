import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrivacyGuard implements CanActivate, CanActivateChild {
  constructor(private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly utilitiesService: UtilitiesService
  ) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.appUserService.getUtente()) {
      this.router.navigateByUrl('/');
      return false;
    }
    if (this.appUserService.getPrivacy(Ambito.FASC)) {
      return true;
    }
    const msg =
      'ATTENZIONE!!! Prima di procedere nel collocamento mirato, occorre accettare l\'informativa sulla privacy, '
      + ' per far ciò, è quindi necessario aggiornare il fascicolo cittadino.';
    this.utilitiesService.showToastrErrorMessage(msg, 'Privacy');
    this.router.navigateByUrl('/home');
    return false;
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state);
  }
}
