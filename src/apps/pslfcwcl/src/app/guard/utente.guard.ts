import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Params, Router, RouterStateSnapshot } from '@angular/router';
import { SecurityService, UserInfo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { ConfigService, SpidUserService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UtenteGuard implements CanActivate {

  linkLand: string;
  constructor(
    private readonly spidUserService: SpidUserService,
    private readonly securityService: SecurityService,
    private readonly router: Router
  ) {}

  /**
   * Determines whether activate can
   * @param next ActivatedRouteSnapshot
   * @param state RouterStateSnapshot
   * @returns activate
   */
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    // C'è l'utente, esco
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
        const msg: Params = {message: 'Utente non autenticato.'};
        this.router.navigate(['/error-page'], {queryParams: msg});
        return of(false);
      })
    ).toPromise();
  }
}
