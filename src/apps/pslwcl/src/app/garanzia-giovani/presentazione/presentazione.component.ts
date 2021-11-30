import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';

declare var $: any;

@Component({
  selector: 'app-presentazione',
  templateUrl: './presentazione.component.html'
})
export class PresentazioneComponent implements OnInit, OnDestroy {

  private readonly subscriptions = [] as Array<Subscription>;

  checkInformativaPrivacy: boolean;
  testoBenvenuto: string;
  messaggioUtente: string;
  completeNavigation: boolean;

  sceltaLavoratore: string;
  scelteLavoratore = [
    {
      key: 'te',
      value: 'maggiorenne',
      labeltext: 'Per te',
      active: true,
      msg: null
    },
    {
      key: 'minore',
      value: 'minorenne',
      labeltext: 'Per un minore di cui sei in possesso di una responsabilità',
      active: true,
      msg: null
    }
  ];

  private loadedFlag = [false, false];
  msgErrore: string;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService,
    @Inject(DOCUMENT) private document: Document
  ) { }

  async ngOnInit() {
    this.commonPslpService.AMBITO = Ambito.GG;
    this.completeNavigation = !!this.storageService.getItem(SessionStorageService.HAS_RIEPILOGO, true);
    const [testoBenvenuto, msgErrore] = await Promise.all([
      this.utilitiesService.getMessage('MI008'),
      this.utilitiesService.getMessage('ME002'),
      this.handleAppuntamentoAdesione()
    ]);
    this.testoBenvenuto = testoBenvenuto;
    this.msgErrore = msgErrore;
    this.utilitiesService.hideSpinner();
    this.checkDataLoaded(0);
  }

  /**
   * Checks data loaded
   * @param id number
   */
  checkDataLoaded(id: number) {
    this.loadedFlag[id] = true;
    if (this.loadedFlag.every(Boolean)) {
      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Handles appuntamento adesione
   */
  private async handleAppuntamentoAdesione() {
    const { active, msg, userMessage } = await this.commonPslpService.getUserMessages(this.appUserService.getUtente());
    if (!this.isAppuntamentoNonPresente(msg)) {
      this.scelteLavoratore[0].active = active;
      this.scelteLavoratore[0].msg = msg;
    }
    this.messaggioUtente = userMessage;
  }

  private isAppuntamentoNonPresente(msg: string): boolean {
    return !isNullOrUndefined(msg) && msg === ' - Non è presente un appuntamento a proprio nome';
  }
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Comincia presentazione component
   *
   */
  async comincia() {
    try {
      await this.appUserService.save();
    } catch (e) {
        const msg: Params = { 'message': this.msgErrore };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
    if (this.commonPslpService.operareSoloMinori) {
      this.handleMinore();
    } else {
      $('#operare_per').modal('show');
    }
  }

  /**
   * Proseguis presentazione component
   */
  prosegui() {
    switch (this.sceltaLavoratore) {
      case this.scelteLavoratore[0].value:
        // maggiorenne
        this.handleMaggiorenne();
        break;
      case this.scelteLavoratore[1].value:
        // minore
        this.handleMinore();
        break;
      default:
        this.logService.error('Scelta lavoratore non effettuata!!!!');
        break;
    }
  }

  /**
   * Indietros presentazione component
   */
  indietro() {
    this.router.navigateByUrl('/garanzia-giovani/riepilogo');
  }

  /**
   * Handles maggiorenne
   */
  private handleMaggiorenne() {
    this.commonPslpService.setUtenteStorage(this.appUserService.getUtente());
    this.commonPslpService.tutore = undefined;
    this.commonPslpService.wizard = true;
    this.commonPslpService.readOnly = false;
    this.router.navigateByUrl('/garanzia-giovani/dati-anagrafici');
  }

  /**
   * Handles minore
   */
  private handleMinore() {
    this.commonPslpService.tutore = this.appUserService.getUtente();
    this.commonPslpService.wizard = true;
    this.commonPslpService.readOnly = false;
    this.router.navigateByUrl('/garanzia-giovani/scelta-minore');
  }
}
