import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Params, Router, RouterStateSnapshot } from '@angular/router';
import { SecurityService, UserInfo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { ConfigService, LogService, SpidUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OperatoreGuard implements CanActivate {
  constructor(
    private readonly spidUserService: SpidUserService,
    private readonly securityService: SecurityService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService,
    private readonly router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    // C'è l'utente, esco
    this.logService.log("user " + this.spidUserService.getUser());
    if (this.spidUserService.getUser()) {
      return true;
    }

    // Non ho l'utente e sono in sviluppo/test, allora pagina di login
    if (ConfigService.useAutenticationPage()) {
      this.router.navigateByUrl('/login');
      return false;
    }

    // Non ho l'utente, lo prendo da Shibboleth/Spid
    return this.securityService.getCurrentUser().pipe(
      map((userInfo: UserInfo) => {
        this.spidUserService.setUser(userInfo);
        return true;
      }),
      catchError(err => {
        console.error(err);
        const msgErr = this.utilitiesService.getMessage('ME051');
        const msg: Params = {message: msgErr};
        this.router.navigate(['/error-page'], {queryParams: msg});
        return of(false);
      })
    ).toPromise();
  }
}
