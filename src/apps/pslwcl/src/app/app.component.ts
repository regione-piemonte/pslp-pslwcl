// #####################################################
// # Copyright Regione Piemonte - 2021                 #
// # SPDX-License-Identifier: EUPL-1.2-or-later        #
// #####################################################

import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { SystemService } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { HelpMessage } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, UrlRouteService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { KeyboardShortcutsComponent, ShortcutInput } from 'ng-keyboard-shortcuts';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  helpCache = new Map<string, HelpMessage>();

  @ViewChild(KeyboardShortcutsComponent, { static: true }) private keyboard: KeyboardShortcutsComponent;
  shortcuts: ShortcutInput[] = [];
  pingTimeoutCounter: number;
  subheaderContentTitolo: string;

  constructor(
    private readonly urlRouteService: UrlRouteService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService,
    private readonly systemservice: SystemService,
    private readonly ngbDatepickerConfig: NgbDatepickerConfig
  ) {
    this.urlRouteService.getCurrentUrl();

    const now = new Date();
    // 150 anni nel passato, 50 nel futuro. Il passato e' piu' importante per la data di nascita
    this.ngbDatepickerConfig.minDate = { day: 1, month: 1, year: now.getFullYear() - 150 };
    this.ngbDatepickerConfig.maxDate = { day: 31, month: 12, year: now.getFullYear() + 50 };
  }
  ngOnInit(): void {
    this.initHelpCache();
    const url = new URL(location.href);
    let titolo = this.utilitiesService.getTitle();
    const destinazione = url.searchParams.get("param");
    this.logService.log('WCL app.component.ts ' + url);
    if (isNullOrUndefined(titolo)) {
        if (url.toString().includes('-landing')) {
          titolo = 'I servizi per il cittadino';
        } else {
          titolo = 'Piattaforma Servizi al Lavoro';
        }
        this.utilitiesService.setTitle(titolo);
    }
    this.subheaderContentTitolo = titolo;
  }

  ngAfterViewInit() {
    this.shortcuts.push(
      {
        key: ['cmd + =', 'cmd + z'],
        command: () => this.utilitiesService.toggleDebug(),
        preventDefault: true
      }
    );
    this.doPing();
  }

  ngOnDestroy() {
    clearTimeout(this.pingTimeoutCounter);
  }

  /**
   * Do ping
   */
  private doPing() {
    if (this.pingTimeoutCounter) {
      clearTimeout(this.pingTimeoutCounter);
    }
    this.systemservice.ping()
      .toPromise()
      .then(() => this.pingTimeoutCounter = window.setTimeout(() => this.doPing(), 60 * 1000));
  }

  /**
   * Inits help cache
   */
  private initHelpCache() {
    this.helpCache.set('/', { code: 'HP001' });
    this.helpCache.set('/home', { code: 'HP001' });

    this.helpCache.set('/garanzia-giovani/presentazione', { code: 'HP002' });
    this.helpCache.set('/garanzia-giovani/dati-anagrafici', { code: 'HP003' });
    this.helpCache.set('/garanzia-giovani/profiling', { code: 'HP004' });
    this.helpCache.set('/garanzia-giovani/informazioni', { code: 'HP005' });
    this.helpCache.set('/garanzia-giovani/scelta-minore', { code: 'HP006' });
    this.helpCache.set('/garanzia-giovani/responsabilita', { code: 'HP007' });
    this.helpCache.set('/garanzia-giovani/dati-anagrafici-tutore', { code: 'HP008' });
    this.helpCache.set('/garanzia-giovani/conferma', { code: 'HP009' });
    this.helpCache.set('/garanzia-giovani/appuntamento', { code: 'HP010' });
    this.helpCache.set('/garanzia-giovani/riepilogo', { code: 'HP011' });

    this.helpCache.set('/reddito-cittadinanza/presentazione-rdc', { code: 'HP019' });
    this.helpCache.set('/reddito-cittadinanza/dati-anagrafici', { code: 'HP020' });
    this.helpCache.set('/reddito-cittadinanza/informazioni', { code: 'HP021' });
    this.helpCache.set('/reddito-cittadinanza/conferma', { code: 'HP022' });
    this.helpCache.set('/reddito-cittadinanza/appuntamento', { code: 'HP023' });
    this.helpCache.set('/reddito-cittadinanza/riepilogo-rdc', { code: 'HP024' });
    this.helpCache.set('/iscrizione-garanzia/iscrizione-garanzia-riepilogo', { code: 'HP054' });
  }

}
