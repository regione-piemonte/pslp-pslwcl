import { Component, OnInit, ViewChild } from '@angular/core';
import { Params, Router } from '@angular/router';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { BusinessService, Privacy, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, LogService, SecurityPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { CommonPslpService } from '@pslwcl/pslservice';

@Component({
  selector: 'app-riepilogo',
  templateUrl: './riepilogo.component.html'
})
export class RiepilogoComponent implements OnInit {
  idUtente: number;
  hasAppuntamento = false;
  minori: UtenteACarico[];
  hasMinori = false;
  hasAdesione = false;
  loading: number;
  messaggioUtente: string;
  elencoPrivacyUtente: Privacy[];

  @ViewChild('accordionMinori', { static: false }) accordionMinori: NgbAccordion;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService,
    private readonly businessService: BusinessService,
    private readonly storageService: SessionStorageService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.commonPslpService.AMBITO = Ambito.GG;
    this.storageService.setItem(SessionStorageService.HAS_RIEPILOGO, true);
    this.idUtente = this.appUserService.getIdUtente();
    try {
      if (isNullOrUndefined(this.idUtente)) {
        const utente = await this.appUserService.verificaEsistenzaUtente();
        this.idUtente = utente.id_utente;
      }
      this.minori = await this.appUserService.getUtentiACarico(this.idUtente);
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
    this.loading = this.minori.length + 1;
    this.hasMinori = this.minori.length > 0;
    const adesione = await this.businessService.getAdesioneYG(this.idUtente).pipe(catchError(err => of(null))).toPromise();
    this.hasAdesione = !!adesione;
    if (!this.hasAdesione) {
      await this.decreaseLoading();
    }
    const appuntamenti = await this.businessService.findIncontri(this.idUtente, this.commonPslpService.getAmbito()).toPromise();
    this.hasAppuntamento = appuntamenti.length > 0;
    this.logService.log('[RiepilogoComponent::ngOnInit]', 'Data to load: ', this.loading);
  }

  /**
   * Determines whether nuovo appuntamento on
   */
  async onNuovoAppuntamento() {
    this.setDataGaranziaGiovani();
    const idUtente = this.appUserService.getIdUtente();
    this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(idUtente);
    const laPrivacyDellUtente = this.elencoPrivacyUtente.find(el => el.cod_ambito === this.commonPslpService.AMBITO);
    if (isNullOrUndefined(laPrivacyDellUtente) || !laPrivacyDellUtente.stato) {
      const msg = (await this.utilitiesService.getMessage('ME101')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
      this.openModal(msg);
    } else {
      this.router.navigateByUrl('/garanzia-giovani/presentazione');
    }
  }

  /**
   * Sets data garanzia giovani
   */
  private setDataGaranziaGiovani() {
    this.commonPslpService.inizializzaSoft();
    this.commonPslpService.setSapStorage(null);
    this.commonPslpService.wizard = true;
    this.commonPslpService.readOnly = false;
    this.commonPslpService.tutore = undefined;
    this.commonPslpService.utenteACarico = undefined;

    this.commonPslpService.setUtenteStorage({ id_utente: this.idUtente });
  }

  /**
   * Decreases loading
   */
  async decreaseLoading() {
    this.loading--;
    this.logService.log('[RiepilogoComponent::decreaseLoading]', 'Data to load: ', this.loading);
    if (this.loading <= 1) {
      const { active, msg, userMessage} = await this.commonPslpService.getUserMessages(this.appUserService.getUtente()); // NOSONAR
      this.messaggioUtente = userMessage;

      if (this.minori.length === 1) {
        this.accordionMinori.expand(`minore-${this.minori[0].tutelato.id_utente}`);
      }

      this.utilitiesService.hideSpinner();
    }
  }
  /**
   * Opens modal
   * @param msg string
   */
  async openModal(msg: string) {
    const data: DialogModaleMessage = {
      titolo: 'Prenotazione Incontro Garanzia Giovani',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.GG, TypeApplicationCard.Fascicolo);
    } else {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }


  /**
   * Determines whether gestione privacy eminori on
   */
  onGestionePrivacyEMinori() {
    this.setDataGaranziaGiovani();
    this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.GG, TypeApplicationCard.Fascicolo);
  }


}
