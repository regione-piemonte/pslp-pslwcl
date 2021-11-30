import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { TypeApplicationCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { ConfigService } from './config.service';
import { ENV_AMBIENTE } from './injection-token';
import { LogService } from './log';
import { SpidUserService } from './spid-user.service';
import { isNullOrUndefined } from 'util';


@Injectable({
  providedIn: 'root'
})
export class SecurityPslpService {


  constructor(
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly spidUserService: SpidUserService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(ENV_AMBIENTE) @Optional() private ambiente: string
  ) { }

  /**
   *
   * @param url permette di saltare ad un url esterno
   */
  public jumpToURL(url: string, applicazione: TypeApplicationCard) {
    let urlBase: string;
    switch (applicazione) {
      case TypeApplicationCard.Fascicolo:
        urlBase = ConfigService.getFascicoloBaseURL();
        break;
      case TypeApplicationCard.Cittadino:
        urlBase = ConfigService.getCittadinoBaseURL();
        break;
      case TypeApplicationCard.BackOffice:
          urlBase = ConfigService.getBackOfficeBaseURL();
          break;
      default:
        urlBase = ConfigService.getHomeBaseURL();
    }
    this.logService.log('redirecting to ' + urlBase + url + '...');
    let queryParam = "";
      const loUser = this.spidUserService.getUser();
      if (!isNullOrUndefined(loUser)) {
        if (url.includes('?')) {
          queryParam = "&user=" + btoa(JSON.stringify(loUser));
        } else {
          queryParam = "?user=" + btoa(JSON.stringify(loUser));
        }
      }

    this.document.location.href = urlBase + url + queryParam;
  }

  /**
   * permette di visualizzare una pagina di cortesia
   */
  public jumpToCourtesyPage() {
    this.logService.log('redirecting to courtesy page...');
    this.router.navigate(['/courtesypage']);
  }

}
