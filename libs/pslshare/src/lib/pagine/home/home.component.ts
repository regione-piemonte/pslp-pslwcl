import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { BaseCard, TypeLinkCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { ENV_AMBIENTE, ENV_APPLICATION, LogService, SecurityPslpService, SpidUserService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

/**
 * Component per la visualizzazione
 *  homepage portale pslp
 *   cittadino / operatore
 */
@Component({
  selector: 'pslshare-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  @Input() elencoCard: Array<BaseCard>;
  @Input() flgAccesso: boolean;
  @Input() msgAccesso: string;
  hasUtente: boolean;

  constructor(
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly securityService: SecurityPslpService,
    @Inject(ENV_APPLICATION) @Optional() private envApplication: string,
    @Inject(ENV_AMBIENTE) @Optional() private envAmbiente: string,
    private readonly spidUserService: SpidUserService,
  ) { }

  async ngOnInit() {
    this.flgAccesso = true;
    this.hasUtente = !!this.spidUserService.getUser();

  }

  onGotoLink(el: BaseCard) {
    // da gestire l'applicazione qui dentro.

    if (el.tipoLink === TypeLinkCard.UrlInterno) {
      this.logService.log('link interno=' + el.link);
      this.router.navigateByUrl(el.link);
    } else {
      if (el.applicazione === this.envApplication) {
        if (this.envAmbiente === 'dev') {
          this.router.routeReuseStrategy.shouldReuseRoute = () => false;
          this.router.onSameUrlNavigation = 'reload';
          this.router.navigateByUrl(el.link);
        } else if (this.envAmbiente !== 'dev' &&
          el.tipoLink === 'E' &&
          el.applicazione === 'H') {
          this.logService.log('link=' + el.link + " su applicazione=" + el.applicazione);
          this.securityService.jumpToURL(el.link, el.applicazione);
        } else {
          this.router.navigateByUrl(el.link);
        }
      } else {
        this.logService.log('link=' + el.link + " su applicazione=" + el.applicazione);
        this.securityService.jumpToURL(el.link, el.applicazione);
      }
    }
  }
}
