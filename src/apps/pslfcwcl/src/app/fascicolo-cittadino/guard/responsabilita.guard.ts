import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UtilitiesService, LogService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328


@Injectable({
  providedIn: 'root'
})
export class ResponsabilitaGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService
  ) {}

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
      this.router.navigateByUrl('/fascicolo-cittadino/gestione-minore');
      return false;
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      return this.canActivate(route, state);
  }
}

