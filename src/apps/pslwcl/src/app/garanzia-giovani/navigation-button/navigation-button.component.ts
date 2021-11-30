import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavigationEmitter, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, ParametriSistemaService, UrlRouteService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { CommonPslpService } from '@pslwcl/pslservice';

@Component({
  selector: 'app-navigation-button',
  templateUrl: './navigation-button.component.html'
})
export class NavigationButtonComponent implements OnInit, OnDestroy {
  @Input() prevButtonName = 'INDIETRO';
  @Input() nextButtonName = 'PROSEGUI';
  @Input() prevButtonHide = false;
  @Input() nextButtonHide = false;
  @Input() forceNextButtonName = false;
  @Input() forcePrevButtonName = false;
  @Input() prevButtonDisabled = false;
  @Input() nextButtonDisabled = false;
  @Input() invertColumns = false;
  @Output() exitPage: EventEmitter<NavigationEmitter> = new EventEmitter<NavigationEmitter>();
  private prevEvent: NavigationEmitter = {exit: TypeExit.Prev, url: ''};
  private nextEvent: NavigationEmitter = {exit: TypeExit.Next, url: ''};

  private readonly subscriptions = [] as Array<Subscription>;
  private readonly GARANZIA_GIOVANI = 'garanzia-giovani';
  private readonly PRESENTAZIONE = 'presentazione';
  private readonly SCELTA_MINORE = 'scelta-minore';
  private readonly RESPONSABILITA = 'responsabilita';
  private readonly DATI_ANAGRAFICI_TUTORE = 'dati-anagrafici-tutore';
  private readonly DATI_ANAGRAFICI = 'dati-anagrafici';
  private readonly PROFILING = 'profiling';
  private readonly INFORMAZIONI = 'informazioni';
  private readonly CONFERMA = 'conferma';
  private readonly APPUNTAMENTO = 'appuntamento';

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly commonPslpService: CommonPslpService,
    private readonly urlRouteService: UrlRouteService,
    private readonly logService: LogService,
    private readonly parametriSistemaService: ParametriSistemaService
  ) { }

  async ngOnInit() {
    if (this.commonPslpService.readOnly) {
      this.nextButtonHide = true;
      this.nextButtonDisabled = true;
      this.prevEvent.exit = TypeExit.Back;
      this.prevEvent.url = this.urlRouteService.getPreviousUrl();
      this.logService.log('PreviousUrl', this.prevEvent.url);
      return;
    }

    if (!this.commonPslpService.wizard) {
      this.prevButtonName = this.forcePrevButtonName ? this.prevButtonName : 'ANNULLA';
      this.nextButtonName = this.forceNextButtonName ? this.nextButtonName : 'SALVA';
      this.prevEvent.exit = TypeExit.Canc;
      this.nextEvent.exit = TypeExit.Save;
      this.prevEvent.url = this.nextEvent.url = this.urlRouteService.getPreviousUrl();
      this.logService.log('PreviousUrl', this.prevEvent.url);
      return;
    }

    const isProfilingGGEnabled = await this.parametriSistemaService.isProfilingGGEnabled;
    const minorenne = this.commonPslpService.tutore !== undefined;
    const paths: {current: string , next?: string , prev?: string}[] = [
      {
        current: this.PROFILING,
        next: '/' + this.GARANZIA_GIOVANI + '/' + this.INFORMAZIONI,
        prev: '/' + this.GARANZIA_GIOVANI + '/' + this.DATI_ANAGRAFICI
      },
      {
        current: this.INFORMAZIONI,
        next: '/' + this.GARANZIA_GIOVANI + '/' + this.CONFERMA,
        prev: '/' + this.GARANZIA_GIOVANI + '/' + (isProfilingGGEnabled ? this.PROFILING : this.DATI_ANAGRAFICI)
      },
      {
        current: this.CONFERMA,
        next: '/' + this.GARANZIA_GIOVANI + '/' + this.APPUNTAMENTO,
        prev: '/' + this.GARANZIA_GIOVANI + '/' + this.INFORMAZIONI
      },
      {
        current: this.APPUNTAMENTO,
        next: '/' + this.GARANZIA_GIOVANI,
        prev: '/' + this.GARANZIA_GIOVANI + '/' + this.CONFERMA
      }
    ];
    if (minorenne) {
      paths.push(
        {
          current: this.SCELTA_MINORE,
          next: '/' + this.GARANZIA_GIOVANI + '/' + this.DATI_ANAGRAFICI_TUTORE,
          prev: '/' + this.GARANZIA_GIOVANI + '/' + this.PRESENTAZIONE
        },
        {
          current: this.DATI_ANAGRAFICI_TUTORE,
          next: '/' + this.GARANZIA_GIOVANI + '/' + this.DATI_ANAGRAFICI,
          prev: '/' + this.GARANZIA_GIOVANI + '/' + this.SCELTA_MINORE
        },
        {
          current: this.DATI_ANAGRAFICI,
          next: '/' + this.GARANZIA_GIOVANI + '/' + (isProfilingGGEnabled ? this.PROFILING : this.INFORMAZIONI),
          prev: '/' + this.GARANZIA_GIOVANI + '/' + this.DATI_ANAGRAFICI_TUTORE
        });
    } else {
      paths.push(
        {
          current: this.DATI_ANAGRAFICI,
          next: '/' + this.GARANZIA_GIOVANI + '/' + (isProfilingGGEnabled ? this.PROFILING : this.INFORMAZIONI),
          prev: '/' + this.GARANZIA_GIOVANI + '/' + this.PRESENTAZIONE
        });
    }

    const currentPath = this.activatedRoute.snapshot.url[0].path;
    this.prevEvent = { exit: TypeExit.Prev, url: paths.find(p => p.current === currentPath).prev };
    this.nextEvent = { exit: TypeExit.Next, url: paths.find(p => p.current === currentPath).next };
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
  /**
   * Determines whether prev on
   */
  onPrev() {
    this.exitPage.emit(this.prevEvent);
  }
  /**
   * Determines whether next on
   */
  onNext() {
    this.exitPage.emit(this.nextEvent);
  }
}
