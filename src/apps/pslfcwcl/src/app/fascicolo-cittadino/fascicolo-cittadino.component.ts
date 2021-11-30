import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart, Params } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { UtilitiesService, AppUserService, SecurityPslpService, LogService, CommonPslpService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { BusinessService, SchedaAnagraficoProfessionale, Privacy } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { HttpErrorResponse } from '@angular/common/http';
import { isNullOrUndefined, isNull } from 'util';
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslfcwcl-fascicolo-cittadino',
  templateUrl: './fascicolo-cittadino.component.html'
})

export class FascicoloCittadinoComponent implements OnInit, OnDestroy {

  loaded = false;
  elencoPrivacyUtente: Privacy[];

  private readonly subscriptions = [] as Array<Subscription>;

  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    protected businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationStart && this.isInitUrl(event.url))
      ).subscribe(() => this.initialization())
    );
    await this.initialization();
    this.loaded = true;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Determines whether init url is
   * @param url indirizzo
   * @returns true se indirizzo iniziale
   */
  private isInitUrl(url: string) {
    return url === '' || url === '/fascicolo-cittadino';
  }

  /**
   * Initializations fascicolo cittadino component
   */
  private async initialization() {
    try {
      this.commonFCService.AMBITO = Ambito.FASC;
      await this.commonFCService.verificaUtenteFC();

      let msg = null;

      let idUtente = this.appUserService.getIdUtente();
      if (isNullOrUndefined(idUtente)) {
        idUtente = await this.recuperaUtente();
      }
      await this.setElencoPrivacyUtente(idUtente);

      const laPrivacyDellAmbito = this.elencoPrivacyUtente.find(el => el.cod_ambito === this.commonFCService.AMBITO);
      if (this.isPrivacyAssente(laPrivacyDellAmbito)) {
        // 'ATTENZIONE! Prima di procedere occorre accettare l\'informativa sulla privacy, per far ciò,
        // è quindi necessario aggiornare il fascicolo cittadino.';
        msg = (await this.utilitiesService.getMessage('ME101')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));
      }
      const destinazione = new URL(location.href).searchParams.get("param");
      if (!isNull(destinazione)) {
        this.router.navigateByUrl('/privacy/riepilogo-privacy');
      } else {
        if (!isNull(msg)) {
          this.utilitiesService.hideSpinner();
          this.openModal(msg);
        } else {
          this.router.navigateByUrl('/fascicolo-cittadino/riepilogo');
        }
      }

      this.utilitiesService.setLinkLand('/fascicolo-cittadino');

      this.utilitiesService.hideSpinner();


    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      this.router.navigate(['/error-page'], { queryParams: msg });
    }
  }

  /**
   * Determines whether privacy assente is
   * @param laPrivacyDellAmbito Privacy
   * @returns true se privacy non presente
   */
  private isPrivacyAssente(laPrivacyDellAmbito: Privacy) {
    return isNullOrUndefined(laPrivacyDellAmbito) || !laPrivacyDellAmbito.stato;
  }

  /**
   * Recuperas utente
   *
   * @returns idUtente identificativo utente
   */
  private async recuperaUtente() {
    await this.appUserService.saveUtente();
    const idUtente = this.appUserService.getIdUtente();
    let sap: SchedaAnagraficoProfessionale;
    try {
      sap = await this.businessService.getSAP(idUtente, this.commonFCService.AMBITO).toPromise();
    } catch (err) {
      const errore = (err instanceof HttpErrorResponse) ? err.error : err;
      const code = (err instanceof HttpErrorResponse) ? err.error.code : '500';
      if (code === '403') {
        throw new Error(errore.errorMessage || errore.message);
      }
    }
    if (!isNullOrUndefined(sap)) {
      this.commonFCService.setSapAndIdUtenteStorage(sap, idUtente);
    }
    return idUtente;
  }

  /**
   * Sets elenco privacy utente
   * @param idUtente identificativo utente
   */
  private async setElencoPrivacyUtente(idUtente: number) {
    if (isNullOrUndefined(this.commonFCService.elencoPrivacyUtente)) {
      this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(idUtente);
    } else {
      this.elencoPrivacyUtente = this.commonFCService.elencoPrivacyUtente;
    }
  }

  /**
   * Opens modal
   * @param msg stringa da visualizzare nella finestra di richiesta
   */
  async openModal(msg: string) {
    const data: DialogModaleMessage = {
      titolo: 'Gestione Fascicolo',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.router.navigateByUrl('/privacy-landing?param=' + Ambito.FASC);
    } else {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }

}
