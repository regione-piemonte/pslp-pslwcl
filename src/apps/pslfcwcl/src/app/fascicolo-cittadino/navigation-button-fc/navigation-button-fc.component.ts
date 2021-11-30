import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonPslpService, LogService, ParametriSistemaService, UrlRouteService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';
import { NavigationEmitter, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslfcwcl-navigation-button-fc',
  templateUrl: './navigation-button-fc.component.html'
})
export class NavigationButtonFCComponent implements OnInit, OnDestroy {

  private static readonly FASCICOLO_CITTADINO = 'fascicolo-cittadino';
  private static readonly RIEPILOGO = 'riepilogo';

  private static readonly NUOVA_SAP = 'registrazione-dati-anagrafici';
  private static readonly DATI_ANAGRAFICI = 'dati-anagrafici';
  private static readonly DATI_AMMINISTRATIVI = 'dati-amministrativi';
  private static readonly ESPERIENZE_LAVORO = 'esperienze-lavoro';
  private static readonly DATI_CURRICULARI = 'dati-curriculari';
  private static readonly POLITICHE_ATTIVE = 'politiche-attive';
  private static readonly ESITO = 'esito';
  private static readonly ESITO_ERRATO = 'esito-errato';
  private static readonly ESITO_ERRATO_NEW = 'esito-errato-new';

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

  private readonly subscriptions = [] as Array<Subscription>;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly commonFCService: CommonPslpService,
    private readonly urlRouteService: UrlRouteService
  ) { }

  async ngOnInit() {
    if (this.commonFCService.readOnly &&
      !this.commonFCService.readOnlyDomicilio) {
      this.nextButtonHide = true;
      this.nextButtonDisabled = true;
      this.prevEvent.exit = TypeExit.Back;
      this.prevEvent.url = this.urlRouteService.getPreviousUrl();
      return;
    }

    if (!this.commonFCService.wizard) {
      this.prevButtonName = this.forcePrevButtonName ? this.prevButtonName : 'INDIETRO';
      this.nextButtonName = this.forceNextButtonName ? this.nextButtonName : 'SALVA';
      this.prevEvent.exit = TypeExit.Canc;
      this.nextEvent.exit = TypeExit.Save;
      this.prevEvent.url = this.nextEvent.url = this.urlRouteService.getPreviousUrl();
      return;
    }


    const inizio = this.commonFCService.firstPage ? this.commonFCService.firstPage : NavigationButtonFCComponent.RIEPILOGO;
    const paths: {current: string , prev?: string , next?: string}[] = [

      {
        current: NavigationButtonFCComponent.DATI_ANAGRAFICI,
        prev: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + inizio,
        next: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.DATI_AMMINISTRATIVI
      },
      {
        current: NavigationButtonFCComponent.DATI_AMMINISTRATIVI,
        prev: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.DATI_ANAGRAFICI,
        next: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.ESPERIENZE_LAVORO
      },
      {
        current: NavigationButtonFCComponent.ESPERIENZE_LAVORO,
        prev: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.DATI_AMMINISTRATIVI,
        next: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.DATI_CURRICULARI
      },

        {
          current: NavigationButtonFCComponent.DATI_CURRICULARI,
          prev: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.ESPERIENZE_LAVORO,
          next: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.POLITICHE_ATTIVE
        },
        {
          current: NavigationButtonFCComponent.POLITICHE_ATTIVE,
          prev: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.DATI_CURRICULARI,
          next: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.DATI_ANAGRAFICI
        },
        {
          current: NavigationButtonFCComponent.ESITO,
          prev: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.POLITICHE_ATTIVE,
          next: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + inizio
        },
        {
          current: NavigationButtonFCComponent.NUOVA_SAP,
          prev: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + inizio,
          next: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.DATI_AMMINISTRATIVI
        },
        {
          current: NavigationButtonFCComponent.ESITO_ERRATO,
          prev: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.ESITO,
          next: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO
        },
        {
          current: NavigationButtonFCComponent.ESITO_ERRATO_NEW,
          prev: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO + '/' + NavigationButtonFCComponent.NUOVA_SAP,
          next: '/' + NavigationButtonFCComponent.FASCICOLO_CITTADINO
        }
      ];

    const isModificata: boolean = await this.commonFCService.isSapModificata();
    if (isModificata) {
      const pathPoliticheAttive = paths.find(p => p.current === NavigationButtonFCComponent.POLITICHE_ATTIVE);
      pathPoliticheAttive.next = `/${NavigationButtonFCComponent.FASCICOLO_CITTADINO}/${NavigationButtonFCComponent.ESITO}`;
    }

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
