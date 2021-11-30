import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';

declare var $: any;

@Component({
  selector: 'pslfcwcl-dettaglio-privacy',
  templateUrl: './dettaglio-privacy.component.html'
})
export class DettaglioPrivacyComponent
  implements OnInit {

  /**
   * Subscriptions  of dettaglio privacy component
   */
  private readonly subscriptions = [] as Array<Subscription>;

  checkInformativaPrivacy: boolean;
  testoBenvenuto: string;
  messaggioUtente: string;
  completeNavigation: boolean;

  private loadedFlag = [false, false];
  sap: SchedaAnagraficoProfessionale;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly commonFCService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  /**
   * on init
   */
  async ngOnInit() {
    this.utilitiesService.showSpinner();
    if (!isNullOrUndefined(this.commonFCService.getAmbitoPrivacy)) {
      this.commonFCService.AMBITO = this.commonFCService.getAmbitoPrivacy();
    }
    this.completeNavigation = !!this.storageService.getItem(SessionStorageService.HAS_RIEPILOGO, true);
     this.appUserService.backupVisionePrivacy();
    this.checkInformativaPrivacy = this.appUserService.getPrivacy(this.commonFCService.AMBITO);
    this.checkDataLoaded(0);
    this.utilitiesService.hideSpinner();
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
   * Indietros dettaglio privacy component
   */
  indietro() {
    this.appUserService.restoreVisionePrivacy();
    const destino = this.utilitiesService.getParamLand();
    this.router.navigateByUrl('/privacy/riepilogo-privacy?param=' + destino);
  }

}
