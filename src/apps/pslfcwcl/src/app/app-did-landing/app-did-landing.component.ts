import { Component, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';
import { SecurityService, UserInfo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { ConfigService, SpidUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'pslfcwcl-app-did-landing',
  templateUrl: './app-did-landing.component.html'
})
export class AppDIDLandingComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly spidUserService: SpidUserService,
    private readonly securityService: SecurityService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  ngOnInit(): void {
    this.controllaUtente();
  }

  controllaUtente() {
    // Non ho l'utente e sono in sviluppo/test, allora pagina di login
    this.utilitiesService.setLinkLand('/did');

    if (ConfigService.useAutenticationPage()) {
      if (this.spidUserService.getUser()) {
        // se sono autenticato vado direttamente alla pagina
        this.router.navigateByUrl(this.utilitiesService.getLinkLand());
      } else {
        // se non sono autenticato vado alla pagina di login
        this.router.navigateByUrl('/login');
      }
      return false;
    }

    // Non ho l'utente, lo prendo da Shibboleth/Spid
    return this.securityService
      .getCurrentUser()
      .pipe(
        map((userInfo: UserInfo) => {
          this.spidUserService.setUser(userInfo);
          this.router.navigateByUrl(this.utilitiesService.getLinkLand());
          return true;
        }),
        catchError(err => {
          const msg: Params = { message: 'Utente non autenticato.' };
          this.router.navigate(['/error-page'], { queryParams: msg });
          return of(false);
        })
      )
      .toPromise();
  }
}
