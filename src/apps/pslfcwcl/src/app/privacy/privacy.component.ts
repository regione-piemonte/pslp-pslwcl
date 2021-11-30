import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Params, Router } from '@angular/router';
import { BusinessService, Privacy, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'pslfcwcl-privacy',
  templateUrl: './privacy.component.html'
})

export class PrivacyComponent implements OnInit, OnDestroy {

  loaded = false;
  elencoPrivacyUtente: Privacy[];

  private readonly subscriptions = [] as Array<Subscription>;

  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    protected businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
  ) { }

  /**
   * on init
   */
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

  /**
   * on destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Determines whether init url is
   * @param url string
   * @returns boolean
   */
  private isInitUrl(url: string) {
    return url === '' || url === '/privacy';
  }

  /**
   * Initializations privacy component
   */
  private async initialization() {
    try {

      await this.commonFCService.verificaUtenteFC();

      let idUtente = this.appUserService.getIdUtente();
      if (isNullOrUndefined(idUtente)) {
        idUtente = await this.recuperaUtente();
      }

      await this.setElencoPrivacyUtente(idUtente);

      const destinazione = new URL(location.href).searchParams.get("param");
      if (isNullOrUndefined(destinazione)) {
        this.router.navigateByUrl('/privacy/riepilogo-privacy');
      } else {
        this.router.navigateByUrl('/privacy/riepilogo-privacy?param=' + destinazione);
      }
      this.utilitiesService.setLinkLand('/privacy/riepilogo-privacy');
      this.utilitiesService.hideSpinner();
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      this.router.navigate(['/error-page'], { queryParams: msg });
    }
  }

  /**
   * Sets elenco privacy utente
   * @param idUtente identificativo univoco utente pslp
   */
  private async setElencoPrivacyUtente(idUtente: number) {

      this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(idUtente, true);

  }

  /**
   * Recupera utente
   * @returns  idUtente identificativo univoco utente pslp
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
}
