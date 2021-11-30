import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { LogService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResponsabilitaGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService
  ) {}

  /**
   * Determines whether activate can
   * @param route ActivatedRouteSnapshot
   * @param state RouterStateSnapshot
   * @returns activate
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return true;
      this.logService.log('route url', route.url);
      if (route.url[0].path === 'scelta-minore' || route.url[0].path === 'informativa-responsabilita') {
        return true;
      }
      const msg = 'Prima di procedere, accettare l\'informativa sulla responsabilità genitoriale';
      this.utilitiesService.showToastrErrorMessage(msg, 'Privacy');
      this.router.navigateByUrl('/garanzia-giovani/tutore/scelta-minore');
      return false;
  }

  /**
   * Determines whethe r activate child can
   * @param route ActivatedRouteSnapshot
   * @param state RouterStateSnapshot
   * @returns activate child
   */
  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      return this.canActivate(route, state);
  }
}
