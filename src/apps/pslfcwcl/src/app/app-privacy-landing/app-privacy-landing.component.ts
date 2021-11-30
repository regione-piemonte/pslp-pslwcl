import { Component, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';
import { SecurityService, UserInfo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { ConfigService, LogService, SpidUserService, UtilitiesService} from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'pslfcwcl-app-privacy-landing',
  templateUrl: './app-privacy-landing.component.html'
})
export class AppPrivacyLandingComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly spidUserService: SpidUserService,
    private readonly securityService: SecurityService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  ngOnInit(): void {
    this.controllaUtente();
  }

  /**
   * Controlla utente
   *
   */
  controllaUtente() {
    const destinazione = new URL(location.href).searchParams.get("param");
    let link = '/privacy/riepilogo-privacy';
    if (!isNullOrUndefined(destinazione)) {
      this.utilitiesService.setParamLand(destinazione);
      link = link + '?param=' + destinazione;
    }
    this.utilitiesService.setLinkLand(link);
    if (ConfigService.useAutenticationPage()) {
      const user = this.spidUserService.getUser();
      if (user) {
        // se sono autenticato vado direttamente alla pagina
        this.router.navigateByUrl(link);
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
          this.router.navigateByUrl(link);
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
