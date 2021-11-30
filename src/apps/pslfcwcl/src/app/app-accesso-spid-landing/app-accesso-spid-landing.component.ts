import { Component, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';
import { SecurityService, UserInfo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { TypeApplicationCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { ConfigService, SecurityPslpService, SpidUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';


@Component({
  selector: 'pslfcwcl-app-accesso-spid-landing',
  templateUrl: './app-accesso-spid-landing.component.html'
})
export class AppAccessoSpidLandingComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly spidUserService: SpidUserService,
    private readonly securityService: SecurityService,
    private readonly securityPslpService: SecurityPslpService,
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
    // Non ho l'utente e sono in sviluppo/test, allora pagina di login
    let link = '/home';
    const destinazione = new URL(location.href).searchParams.get("param");
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
          this.securityPslpService.jumpToURL('/home', TypeApplicationCard.Home);
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
