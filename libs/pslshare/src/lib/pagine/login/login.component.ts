import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Params, Router } from '@angular/router';
import { TypeApplicationCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, ConfigService, LogService, SecurityPslpService, SpidUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

/**
 * Component gestione  pagina login virtuale
 *   per simulazione accesso SPID
 *   in ambiente di sviluppo/test
 */
@Component({
  selector: 'pslshare-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  @ViewChild('loginForm', { static: true }) loginForm: NgForm;
  dateObj: Date;
  meseAnnoRevisioneIC = "07/2019";
  constructor(
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly spidUserService: SpidUserService,
    private readonly utilitiesService: UtilitiesService,
    private readonly appUserService: AppUserService,
    private readonly securityService: SecurityPslpService,
  ) { }

  ngOnInit() {
    if (!ConfigService.useAutenticationPage()) {
      const msg: Params = { message: 'Non è possibile usare la pagina di login per effettuare l\'autenticazione!' };
      this.router.navigate(['/error-page'], { queryParams: msg });
    }
  }

  onSubmit() {
    this.appUserService.setUtente({});
    this.spidUserService.setUser({
      codFisc: this.loginForm.controls.cf.value,
      nome: this.loginForm.controls.nome.value,
      cognome: this.loginForm.controls.cognome.value
    });
    const linkL = this.utilitiesService.getLinkLand();
    this.logService.log("--linkL-------------->" + linkL);
    if (isNullOrUndefined(linkL) || linkL === "") {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    } else {
      if (linkL === '/home') {
        this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
      } else {
        this.router.navigateByUrl(linkL);
      }
    }
  }
}
