import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { SystemService } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { HelpMessage } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, SpidUserService, UrlRouteService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { KeyboardShortcutsComponent, ShortcutInput } from 'ng-keyboard-shortcuts';

@Component({
  selector: 'pslphome-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  /**
   * Help cache of app component
   */
  helpCache = new Map<string, HelpMessage>();
  subheaderContentTitolo: string;
  url: string;


  @ViewChild(KeyboardShortcutsComponent, { static: true }) private keyboard: KeyboardShortcutsComponent;
  shortcuts: ShortcutInput[] = [];
  pingTimeoutCounter: number;

  constructor(
    private readonly urlRouteService: UrlRouteService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService,
    private readonly systemservice: SystemService,
    private readonly ngbDatepickerConfig: NgbDatepickerConfig,
    @Inject(DOCUMENT) private document: Document,
    private readonly spidUserService: SpidUserService,

  ) {
    this.url = this.urlRouteService.getCurrentUrl();
    this.logService.log('HOME app.component.ts =' + this.url);
    const now = new Date();
    // 150 anni nel passato, 50 nel futuro. Il passato e' piu' importante per la data di nascita
    this.ngbDatepickerConfig.minDate = { day: 1, month: 1, year: now.getFullYear() - 150 };
    this.ngbDatepickerConfig.maxDate = { day: 31, month: 12, year: now.getFullYear() + 50 };
  }
  ngOnInit(): void {
    this.initHelpCache();
    this.logService.log('HOME app.component.ts ');
    const url = new URL(location.href);
    const userUtente = url.searchParams.get("user");
    this.logService.log('userUtente-------------> ' + userUtente);
    if (this.document.location.search) {
      const urlSP = new URLSearchParams(this.document.location.search.substring(1));
      if (urlSP.get('user')) {
        try {
          this.spidUserService.setUser(JSON.parse(atob(urlSP.get('user'))));
          this.logService.log('SETTATO UTENTE SU SPIDUSER-------------> ');
        } catch (error) {
          // ignorata eccezione
        }
      }
    }


  }

  /**
   * after view init
   */
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
    this.helpCache.set('/', { code: 'HP047' });
    this.helpCache.set('/home', { code: 'HP047' });
    this.helpCache.set('/home?id=100', { code: 'HP049' });
    this.helpCache.set('/mappa', { code: 'HP050' });
    this.helpCache.set('/assistenza', { code: 'HP051' });
    this.helpCache.set('/fascicolo-cittadino/esito', { code: 'HP044' });
    this.helpCache.set('/fascicolo-cittadino/esito-errato', { code: 'HP044' });
    this.helpCache.set('/fascicolo-cittadino/politiche-attive', { code: 'HP043' });
    this.helpCache.set('/fascicolo-cittadino/dati-curriculari', { code: 'HP042' });
    this.helpCache.set('/fascicolo-cittadino/esperienze-lavoro', { code: 'HP041' });
    this.helpCache.set('/fascicolo-cittadino/dati-amministrativi', { code: 'HP040' });
    this.helpCache.set('/fascicolo-cittadino/dati-anagrafici', { code: 'HP039' });
    this.helpCache.set('/fascicolo-cittadino/registrazione-dati-anagrafici', { code: 'HP039' });
    this.helpCache.set('/fascicolo-cittadino/gestione-minore', { code: 'HP038' });
    this.helpCache.set('/fascicolo-cittadino/riepilogo', { code: 'HP037' });
    this.helpCache.set('/fascicolo-cittadino/presentazione', { code: 'HP036' });
    this.helpCache.set('/collocamento-mirato/riepilogo', { code: 'HP045' });
    this.helpCache.set('/collocamento-mirato/dati-graduatoria', { code: 'HP046' });
  }
}

