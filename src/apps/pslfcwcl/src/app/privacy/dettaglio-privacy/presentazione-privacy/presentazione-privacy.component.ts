import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BusinessService, ErrorDef, Privacy, SchedaAnagraficoProfessionale, Utente, UtenteACarico, UtentePresaVisione } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

declare var $: any;

@Component({
  selector: 'pslfcwcl-presentazione-privacy',
  templateUrl: './presentazione-privacy.component.html'
})
export class PresentazionePrivacyComponent implements OnInit, OnDestroy {

  private readonly subscriptions = [] as Array<Subscription>;
  privacyInizio: Privacy[];
  checkInformativaPrivacy = false;
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
    private readonly businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  /**
   * on init
   */
  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.appUserService.backupVisionePrivacy();
    if (!isNullOrUndefined(this.commonFCService.getAmbitoPrivacy)) {
      this.commonFCService.AMBITO = this.commonFCService.getAmbitoPrivacy();
    }
    this.privacyInizio = this.commonFCService.elencoPrivacyUtente;

    this.completeNavigation = !!this.storageService.getItem(SessionStorageService.HAS_RIEPILOGO, true);
    const [testoBenvenuto] = await Promise.all([
      this.utilitiesService.getMessage('MI026'),
      this.getMessages()
    ]);
    this.testoBenvenuto = testoBenvenuto;
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
    const { active, msg, userMessage } = await this.commonFCService.getUserMessages(this.appUserService.getUtente());
    this.scelteLavoratore[0].active = active;
    this.scelteLavoratore[0].msg = msg;
    this.messaggioUtente = userMessage;
  }

  /**
   * on destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Comincias presentazione privacy component
   */
  async comincia() {
    this.utilitiesService.showSpinner();
    const utente = this.appUserService.getUtente();
    if (!isNullOrUndefined(this.commonFCService.getIdUtenteMinorePrivacy())) {
      // utente minore
      await this.setPrivacyUtenteMinore(utente);
    } else {
      // utente non minore
      this.utilitiesService.showSpinner();
      await this.appUserService.save();

      if (this.commonFCService.operareSoloMinori) {
        this.sap = await this.commonFCService.getSapAmbito(utente.id_utente, this.commonFCService.getAmbito());
        if (!isNullOrUndefined(this.sap)) {
          this.commonFCService.setSapAndIdUtenteStorage(this.sap, utente.id_utente);
        }
      }
      this.creaNuovaSap();
    }
  }

  /**
   * Sets privacy utente minore
   * @param utente Utente
   */
  private async setPrivacyUtenteMinore(utente: Utente) {
    try {
      this.setPrivacy(this.commonFCService.getUtenteACaricoPrivacy(), true);
      await this.businessService.saveUtenteACarico(utente.id_utente, this.commonFCService.getUtenteACaricoPrivacy()).pipe(
        catchError(err => {
          const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
          throw new Error(errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage);
        })
      ).toPromise();
    } catch (error) {
      this.utilitiesService.showToastrErrorMessage(error.message, 'Minore a carico');
    } finally {
      this.utilitiesService.hideSpinner();
      this.appUserService.loadPrivacyMinore(utente.id_utente, this.commonFCService.getIdUtenteMinorePrivacy(), true);
      this.goRiepilogo();
    }
  }

  /**
   * Creas nuova sap
   */
  private creaNuovaSap() {
    if (this.commonFCService.creareNuovaSap) {
      this.handleNuova();
    } else {
      this.handleMaggiorenne();
    }
  }

  /**
   * Indietros presentazione privacy component
   */
  indietro() {
    this.appUserService.restoreVisionePrivacy();
    this.commonFCService.elencoPrivacyUtente = this.privacyInizio;
    this.subscriptions.forEach(s => s.unsubscribe());
    this.goRiepilogo();
  }

  /**
   * Go riepilogo
   */
  goRiepilogo() {
    this.router.navigateByUrl('/privacy/riepilogo-privacy');
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

    this.commonFCService.tutore = undefined;
    this.commonFCService.wizard = true;
    this.commonFCService.readOnly = false;
    if (this.commonFCService.obbligoDomicilioPiemontePerModifica() &&
      !this.utilitiesService.isSapDomicilioPiemonte(this.sap)) {
      this.commonFCService.readOnlyDomicilio = true;
    }

    this.utilitiesService.hideSpinner();
    this.appUserService.loadPrivacyUtente(this.appUserService.getIdUtente(), true);
    this.goRiepilogo();
  }

  /**
   * Handles nuova
   */
  private handleNuova() {
    this.utilitiesService.hideSpinner();
    this.commonFCService.wizard = false;
    this.commonFCService.readOnly = false;
    this.appUserService.loadPrivacyUtente(this.appUserService.getIdUtente(), true);
    this.goRiepilogo();
  }

  /**
   * Sets privacy
   * @param utenteACarico UtenteACarico
   * @param privacy boolean
   * @returns privacy UtenteACarico
   */
  private setPrivacy(utenteACarico: UtenteACarico, privacy: boolean): UtenteACarico {

    if (this.commonFCService.getPrivacyMinore(utenteACarico)) {
      if (!privacy) {
        const ind = utenteACarico.prese_visione.findIndex(s => s.cod_ambito === this.commonFCService.AMBITO);
        utenteACarico.prese_visione = [
          ...utenteACarico.prese_visione.filter((el, idx) => idx !== ind)
        ];
      }
    } else {
      if (privacy) {
        const presa: UtentePresaVisione = { cod_ambito: this.commonFCService.AMBITO };
        if (isNullOrUndefined(utenteACarico.prese_visione)) {
          utenteACarico.prese_visione = [];
        }
        utenteACarico.prese_visione.push(presa);
      }
    }
    return utenteACarico;
  }

}
