import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { SystemService } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { HelpMessage } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, SpidUserService, UrlRouteService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { KeyboardShortcutsComponent, ShortcutInput } from 'ng-keyboard-shortcuts';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'pslfcwcl-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  helpCache = new Map<string, HelpMessage>();
  subheaderContentTitolo: string;

  @ViewChild(KeyboardShortcutsComponent, { static: true }) private keyboard: KeyboardShortcutsComponent;
  shortcuts: ShortcutInput[] = [];
  pingTimeoutCounter: number;

  constructor(
    private readonly urlRouteService: UrlRouteService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService,
    private readonly systemservice: SystemService,
    private readonly ngbDatepickerConfig: NgbDatepickerConfig,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly spidUserService: SpidUserService,
  ) {
    this.urlRouteService.getCurrentUrl();

    const now = new Date();
    // 150 anni nel passato, 50 nel futuro. Il passato e' piu' importante per la data di nascita
    this.ngbDatepickerConfig.minDate = { day: 1, month: 1, year: now.getFullYear() - 150 };
    this.ngbDatepickerConfig.maxDate = { day: 31, month: 12, year: now.getFullYear() + 50 };
  }

  /**
   * on init
   */
  ngOnInit(): void {
    this.initHelpCache();
    const url = new URL(location.href);
    const destinazione = url.searchParams.get("param");
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

    this.logService.log('FCWCL app.component.ts ' + url);

    let titolo = this.utilitiesService.getTitle();
    if (isNullOrUndefined(titolo)) {
        if (url.toString().includes('-landing')) {
          titolo = 'I servizi per il cittadino';
        } else {
          titolo = 'Fascicolo del cittadino';
        }
        this.utilitiesService.setTitle(titolo);
    }
    this.subheaderContentTitolo = titolo;
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

  /**
   * on destroy
   */
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
    this.helpCache.set('/', { code: 'HP035' });
    this.helpCache.set('/home', { code: 'HP035' });
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
    this.helpCache.set('/collocamento-mirato/inizio', { code: 'HP045' });
    this.helpCache.set('/collocamento-mirato/dati-graduatoria', { code: 'HP046' });

    this.helpCache.set('/collocamento-mirato/lavoratore-wrapper', { code: 'HP055'	});

    this.helpCache.set('/collocamento-mirato/cittadino', { code: 'HP055'	});
    this.helpCache.set('/collocamento-mirato/richiesta', { code: 'HP056'	});
    this.helpCache.set('/collocamento-mirato/disabile', { code: 'HP057'	});
    this.helpCache.set('/collocamento-mirato/graduatoria', { code: 'HP058'	});
    this.helpCache.set('/collocamento-mirato/allegati-richiesta-iscrizione', { code: 'HP059'	});
    this.helpCache.set('/collocamento-mirato/riepilogo-richiesta-iscrizione', { code: 'HP060'	});
    this.helpCache.set('/collocamento-mirato/reddito-richiesta-iscrizione', { code: 'HP058'	});
    this.helpCache.set('/collocamento-mirato/familiari-richiesta-iscrizione', { code: 'HP061'	});
    this.helpCache.set('/privacy/riepilogo-privacy', { code: 'HP048' });
    this.helpCache.set('/privacy/dettaglio-privacy', { code: 'HP036' });
    this.helpCache.set('/privacy/presentazione-privacy', { code: 'HP007' });
    this.helpCache.set('/did/riepilogo-did', { code: 'HP052' });
    this.helpCache.set('/did/patto-servizio', { code: 'HP053' });
  }


}
