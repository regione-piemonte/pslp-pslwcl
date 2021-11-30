import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Params, Router, CanActivateChild } from '@angular/router';
import { Observable } from 'rxjs';
import { OperatoreService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Injectable({
  providedIn: 'root'
})
export class AuthorizedUserGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly utilitiesService: UtilitiesService,
    private readonly router: Router
  ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> |Observable<boolean> {
    return this.isUtenteAutorizzato();
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> | Observable<boolean> {
    return this.isUtenteAutorizzato();
  }
  private async isUtenteAutorizzato(): Promise<boolean>{
    return this.operatoreService.isOperatore().then(
      async (autorizzato: boolean) => {
        if (!autorizzato) {
          const msgErr = await this.utilitiesService.getMessage('ME051');
          const msg: Params = {message: msgErr};
          this.router.navigate(['/error-page'], {queryParams: msg});
        }
        return autorizzato;
      }
    );
  }
}
