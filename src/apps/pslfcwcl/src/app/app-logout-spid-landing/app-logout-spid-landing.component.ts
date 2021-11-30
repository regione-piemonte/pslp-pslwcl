import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserInfo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { TypeApplicationCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { ConfigService, SecurityPslpService, SessionStorageService, SpidUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';


@Component({
  selector: 'pslfcwcl-app-logout-spid-landing',
  templateUrl: './app-logout-spid-landing.component.html'
})
export class AppLogoutSpidLandingComponent implements OnInit {
  private readonly userFarlocco: UserInfo;

  constructor(
    private readonly router: Router,
    private readonly spidUserService: SpidUserService,
    private readonly securityService: SecurityPslpService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {
    await this.utilitiesService.logout();
    this.sessionStorageService.clearStorage();
    this.spidUserService.setUser(this.userFarlocco);
    this.spidUserService.nullifyUser();

    if ( isNullOrUndefined(ConfigService) || isNullOrUndefined(ConfigService.getSSOLogoutURL())  ) {
      this.securityService.jumpToURL('/', TypeApplicationCard.Home);
    } else {
      window.location.href = ConfigService.getSSOLogoutURL();
    }
  }

}
