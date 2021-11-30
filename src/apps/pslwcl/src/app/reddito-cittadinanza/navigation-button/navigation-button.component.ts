import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UrlRouteService, LogService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice';
import { TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328



export interface NavigationEmitter {
  exit: TypeExit;
  url: string;
}

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
  @Output() exitPage: EventEmitter<NavigationEmitter> = new EventEmitter<NavigationEmitter>();
  private prevEvent: NavigationEmitter = {exit: TypeExit.Prev, url: ''};
  private nextEvent: NavigationEmitter = {exit: TypeExit.Next, url: ''};

  private readonly subscriptions = [] as Array<Subscription>;
  private readonly REDDITO_DI_CITTADINANZA = 'reddito-cittadinanza';
  private readonly PRESENTAZIONE = 'presentazione-rdc';
  private readonly DATI_ANAGRAFICI = 'dati-anagrafici';
  private readonly INFORMAZIONI = 'informazioni';
  private readonly CONFERMA = 'conferma';
  private readonly APPUNTAMENTO = 'appuntamento';

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly commonPslpService: CommonPslpService,
    private readonly urlRouteService: UrlRouteService,
    private readonly logService: LogService
  ) { }

  ngOnInit() {
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

    const paths: {current: string , next?: string , prev?: string}[] = [
      {
        current: this.DATI_ANAGRAFICI,
        next: '/' + this.REDDITO_DI_CITTADINANZA + '/' + this.INFORMAZIONI,
        prev: '/' + this.REDDITO_DI_CITTADINANZA + '/' + this.PRESENTAZIONE
      },
      {
        current: this.INFORMAZIONI,
        next: '/' + this.REDDITO_DI_CITTADINANZA + '/' + this.CONFERMA,
        prev: '/' + this.REDDITO_DI_CITTADINANZA + '/' + this.DATI_ANAGRAFICI
      },
      {
        current: this.CONFERMA,
        next: '/' + this.REDDITO_DI_CITTADINANZA + '/' + this.APPUNTAMENTO,
        prev: '/' + this.REDDITO_DI_CITTADINANZA + '/' + this.INFORMAZIONI
      },
      {
        current: this.APPUNTAMENTO,
        next: '/' + this.REDDITO_DI_CITTADINANZA,
        prev: '/' + this.REDDITO_DI_CITTADINANZA + '/' + this.CONFERMA
      }
    ];

    const currentPath = this.activatedRoute.snapshot.url[0].path;
    this.prevEvent = { exit: TypeExit.Prev, url: paths.find(p => p.current === currentPath).prev };
    this.nextEvent = { exit: TypeExit.Next, url: paths.find(p => p.current === currentPath).next};
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
  onPrev() {
    this.exitPage.emit(this.prevEvent);
  }
  onNext() {
    this.exitPage.emit(this.nextEvent);
  }
}
