import { Component, OnDestroy, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';

declare var $: any;

@Component({
  selector: 'app-presentazione-rdc',
  templateUrl: './presentazione-rdc.component.html'
})
export class PresentazioneRDCComponent implements OnInit, OnDestroy {

  private readonly subscriptions = [] as Array<Subscription>;

  checkInformativaPrivacy: boolean;
  testoBenvenuto: string;
  completeNavigation: boolean;
  msgErrore: string;

  private loadedFlag = [false, false];

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {
    this.commonPslpService.AMBITO = Ambito.RDC;
    this.completeNavigation = !!this.storageService.getItem(SessionStorageService.HAS_RIEPILOGO, true);
    this.testoBenvenuto = await this.utilitiesService.getMessage('MI016');
    this.msgErrore = await this.utilitiesService.getMessage('ME002');
    this.utilitiesService.hideSpinner();
    this.checkDataLoaded(0);
  }

  checkDataLoaded(id: number) {
    this.loadedFlag[id] = true;
    if (this.loadedFlag.every(Boolean)) {
      this.utilitiesService.hideSpinner();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Comincias presentazione rdccomponent
   *
   */
  async comincia() {
    // await this.appUserService.save();
    try {
      await this.appUserService.save();
    } catch (e) {
      const msg: Params = { 'message': this.msgErrore };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
    this.commonPslpService.setUtenteStorage(this.appUserService.getUtente());
    this.commonPslpService.wizard = true;
    this.commonPslpService.readOnly = false;
    this.router.navigateByUrl('/reddito-cittadinanza/dati-anagrafici');
  }

  /**
   * Indietro riepilogo presentazione rdccomponent
   */
  indietro() {
    this.router.navigateByUrl('/reddito-cittadinanza/riepilogo-rdc');
  }

}
