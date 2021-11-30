import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';

declare var $: any;

@Component({
  selector: 'pslfcwcl-presentazione-fc',
  templateUrl: './presentazione-fc.component.html'
})
export class PresentazioneFCComponent implements OnInit, OnDestroy {

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
  sap: SchedaAnagraficoProfessionale;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly commonFCService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService
  ) {}

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.commonFCService.AMBITO = Ambito.FASC;
    this.completeNavigation = !!this.storageService.getItem(SessionStorageService.HAS_RIEPILOGO, true);
    const [testoBenvenuto] = await Promise.all([
      this.utilitiesService.getMessage('MI026'),
      this.getMessages()
    ]);
    this.testoBenvenuto = testoBenvenuto;

    this.checkInformativaPrivacy = this.appUserService.getPrivacy(this.commonFCService.AMBITO);
    this.subscriptions.push(
      this.appUserService.privacyFCUpdate.subscribe(
        (value: boolean) => { this.checkInformativaPrivacy = value; }
    ));

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
   * Gets messages
   */
  private async getMessages() {
    const {active, msg, userMessage} = await this.commonFCService.getUserMessages(this.appUserService.getUtente());
    this.scelteLavoratore[0].active = active;
    this.scelteLavoratore[0].msg = msg;
    this.messaggioUtente = userMessage;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Comincias presentazione fccomponent
   */
  async comincia() {
    this.utilitiesService.showSpinner();
    await this.appUserService.save();

    if (this.commonFCService.operareSoloMinori) {
      const utente = this.appUserService.getUtente();
      this.commonFCService.setUtenteStorage(utente);

      this.sap = await this.commonFCService.getSapAmbito(utente.id_utente
        , this.commonFCService.getAmbito());
      if (!isNullOrUndefined(this.sap)) {
        this.commonFCService.setSapAndIdUtenteStorage(this.sap, utente.id_utente);
      }

    }
    if (this.commonFCService.creareNuovaSap) {
      this.handleNuova();
    } else {
      this.handleMaggiorenne();
    }
  }

  /**
   * Indietros presentazione fccomponent
   */
  indietro() {
    this.router.navigateByUrl('/home');
  }

  /**
   * Handles maggiorenne
   */
  private async handleMaggiorenne() {

    const utente = this.appUserService.getUtente();
    this.commonFCService.setUtenteStorage(utente);
    this.sap = await this.commonFCService.getSap$(utente.id_utente);
    this.commonFCService.setSapAndIdUtenteStorage(this.sap, utente.id_utente);
    this.commonFCService.azzeraModificheSap();

  // forse non serve const modificata = await this.commonFCService.isSapModificata();
    this.commonFCService.tutore = undefined;
    this.commonFCService.wizard = true;
    this.commonFCService.readOnly = false;
    if (this.commonFCService.obbligoDomicilioPiemontePerModifica() &&
      !this.utilitiesService.isSapDomicilioPiemonte(this.sap)) {
        this.commonFCService.readOnlyDomicilio = true;
    }

    this.utilitiesService.hideSpinner();
    this.router.navigateByUrl('/fascicolo-cittadino/dati-anagrafici');
  }

  /**
   * Handles nuova
   */
  private handleNuova() {
    this.utilitiesService.hideSpinner();
    this.commonFCService.wizard = false;
    this.commonFCService.readOnly = false;
    this.router.navigateByUrl('/fascicolo-cittadino/riepilogo');
  }
}
