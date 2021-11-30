import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavigationEmitter, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, LogService, UrlRouteService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';



@Component({
  selector: 'pslshare-navigation-button-cm',
  templateUrl: './navigation-button-cm.component.html'
})
export class NavigationButtonCMComponent implements OnInit, OnDestroy {

  private static readonly COLLOCAMENTO_MIRATO = 'collocamento-mirato';
  private static readonly RIEPILOGO_CM = 'riepilogo';


  private static readonly DATI_GRADUATORIA = 'dati-graduatoria';
  private static readonly CITTADINO = 'cittadino';
  private static readonly RICHIESTA = 'richiesta';
  private static readonly DISABILI = 'disabile';
  private static readonly REDDITO = 'reddito-richiesta-iscrizione';
  private static readonly FAMILIARI = 'familiari-richiesta-iscrizione';
  private static readonly ALLEGATI = 'allegati-richiesta-iscrizione';
  private static readonly RIEPILOGO_RICHIESTA = 'riepilogo-richiesta-iscrizione';


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
  showNextButton = true;
  isDisabile: boolean;

  private readonly subscriptions = [] as Array<Subscription>;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly commonPslpService: CommonPslpService,
    private readonly urlRouteService: UrlRouteService,
    private readonly logService: LogService
  ) { }

  async ngOnInit() {
    this.isDisabile = this.commonPslpService.wizardDisabile;
    if (this.commonPslpService.readOnlyCM &&
      !this.commonPslpService.readOnlyDomicilio) {
      this.nextButtonHide = true;
      this.nextButtonDisabled = true;
      this.prevEvent.exit = TypeExit.Back;
      this.prevEvent.url = this.urlRouteService.getPreviousUrl();
      return;
    }

    if (!this.commonPslpService.wizard) {
      this.prevButtonName = this.forcePrevButtonName ? this.prevButtonName : 'INDIETRO';
      this.nextButtonName = this.forceNextButtonName ? this.nextButtonName : 'SALVA';
      this.prevEvent.exit = TypeExit.Canc;
      this.nextEvent.exit = TypeExit.Save;
      this.prevEvent.url = this.nextEvent.url = this.urlRouteService.getPreviousUrl();
      this.logService.log('PreviousUrl', this.prevEvent.url);
      return;
    }

    const lavoratoreNext = this.isDisabile ? NavigationButtonCMComponent.DISABILI : NavigationButtonCMComponent.REDDITO;
    const redditoPrev = this.isDisabile ? NavigationButtonCMComponent.DISABILI : NavigationButtonCMComponent.RICHIESTA;
    const inizio = this.commonPslpService.firstPage ? this.commonPslpService.firstPage : NavigationButtonCMComponent.RIEPILOGO_CM;
    const paths: {current: string , prev?: string , next?: string}[] = [
      {
        current: NavigationButtonCMComponent.DATI_GRADUATORIA,
        prev: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.RIEPILOGO_CM,
      },
      {
        current: NavigationButtonCMComponent.CITTADINO,
        prev: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + inizio,
        next: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.RICHIESTA
      },
      {
        current: NavigationButtonCMComponent.RICHIESTA,
        prev: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.CITTADINO,
        next: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + lavoratoreNext
      },
      {
        current: NavigationButtonCMComponent.DISABILI,
        prev: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.RICHIESTA,
        next: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.REDDITO
      },
      {
        current: NavigationButtonCMComponent.REDDITO,
        prev: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + redditoPrev,
        next: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.FAMILIARI
      },
      {
        current: NavigationButtonCMComponent.FAMILIARI,
        prev: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.REDDITO,
        next: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.ALLEGATI
      },
      {
        current: NavigationButtonCMComponent.ALLEGATI,
        prev: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.FAMILIARI,
        next: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.RIEPILOGO_RICHIESTA
      },
      {
        current: NavigationButtonCMComponent.RIEPILOGO_RICHIESTA,
        prev: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.ALLEGATI,
        next: '/' + NavigationButtonCMComponent.COLLOCAMENTO_MIRATO + '/' + NavigationButtonCMComponent.RIEPILOGO_CM
      },

    ];

    const currentPath = this.activatedRoute.snapshot.url[0].path;
    this.prevEvent = { exit: TypeExit.Prev, url: paths.find(p => p.current === currentPath).prev };
    if (!isNullOrUndefined( paths.find(p => p.current === currentPath).next)) {
       this.nextEvent = { exit: TypeExit.Next, url: paths.find(p => p.current === currentPath).next };
       this.showNextButton = true;
      } else {
       this.nextEvent = null;
       this.showNextButton = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
  onPrev() {
    this.exitPage.emit(this.prevEvent);
  }
  onNext() {
    if (!isNullOrUndefined(this.nextEvent)) {
       this.exitPage.emit(this.nextEvent);
    }
  }

  isNextSalva(): boolean {
    return false;
  }
  isNextConferma(): boolean {
    const nome = this.nextButtonName.toUpperCase();
    return nome.includes('CONFERMA');
  }

}
