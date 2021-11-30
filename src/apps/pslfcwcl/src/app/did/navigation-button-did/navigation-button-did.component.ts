import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, UrlRouteService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';

export enum TypeExit {
  Prev, Next,
  Canc, Save,
  Back, Wizard
}

export interface NavigationEmiter {
  exit: TypeExit;
  url: string;
}

/**
 * Component
 */
@Component({
  selector: 'pslfcwcl-navigation-button-did',
  templateUrl: './navigation-button-did.component.html'
})
export class NavigationButtonDIDComponent implements OnInit, OnDestroy {

  @Input() prevButtonName = 'INDIETRO';
  @Input() nextButtonName = 'PROSEGUI';
  @Input() prevButtonHide = false;
  @Input() nextButtonHide = false;
  @Input() forceNextButtonName = false;
  @Input() forcePrevButtonName = false;
  @Input() prevButtonDisabled = false;
  @Input() nextButtonDisabled = false;
  @Input() invertColumns = false;
  @Input() isModifyState = false;
  @Output() exitPage: EventEmitter<NavigationEmiter> = new EventEmitter<NavigationEmiter>();
  private prevEvent: NavigationEmiter = { exit: TypeExit.Prev, url: '' };
  private nextEvent: NavigationEmiter = { exit: TypeExit.Next, url: '' };
  showNextButton = true;

  private readonly subscriptions = [] as Array<Subscription>;

  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly urlRouteService: UrlRouteService,
    private readonly pslbasepageService: PslshareService
  ) { }

  /**
   * on init
   *
   */
  async ngOnInit() {
    if (this.commonFCService.readOnly &&
      !this.commonFCService.readOnlyDomicilio) {
      this.nextButtonHide = true;
      this.nextButtonDisabled = true;
      this.prevEvent.exit = TypeExit.Back;
      this.prevEvent.url = this.urlRouteService.getPreviousUrl();
      return;
    }

    this.prevButtonName = this.forcePrevButtonName ? this.prevButtonName : 'INDIETRO';
    this.nextButtonName = this.forceNextButtonName ? this.nextButtonName : 'SALVA';
    this.prevEvent.exit = TypeExit.Canc;
    this.nextEvent.exit = TypeExit.Save;
    this.prevEvent.url = this.nextEvent.url = this.urlRouteService.getPreviousUrl();
  }

  /**
   * on destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Determines whether prev on
   */
  async onPrev() {
    if (this.isModifyState) {
      const data: DialogModaleMessage = {
        titolo: 'Torna Indietro',
        tipo: TypeDialogMessage.YesOrNo,
        messaggioAggiuntivo: 'Eventuali dati non confermati e salvati saranno perduti.'
      };
      const result = await this.pslbasepageService.openModal(data);
      if (result === 'SI') {
        this.exitPage.emit(this.prevEvent);
      }
    } else {
      this.exitPage.emit(this.prevEvent);
    }
  }
  /**
   * Determines whether next on
   */
  onNext() {
    if (!isNullOrUndefined(this.nextEvent)) {
      this.exitPage.emit(this.nextEvent);
    }
  }
}
