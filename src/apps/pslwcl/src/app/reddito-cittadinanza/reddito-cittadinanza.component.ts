import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Params, Router } from '@angular/router';
import { BusinessService, Privacy } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';  // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-reddito-cittadinanza',
  templateUrl: './reddito-cittadinanza.component.html'
})
export class RedditoCittadinanzaComponent implements OnInit, OnDestroy {
  private readonly subscriptions = [] as Array<Subscription>;
  elencoPrivacyUtente: Privacy[];

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService,
    private readonly appUserService: AppUserService,
    protected businessService: BusinessService
  ) {
    this.commonPslpService.AMBITO = Ambito.RDC;
  }

  ngOnInit() {
    this.utilitiesService.showSpinner();
    this.initRDC();
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationStart && (event.url === '' || event.url === '/reddito-cittadinanza'))
      ).subscribe(() => this.initRDC())
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Inits rdc
   *
   */
  private async initRDC() {
    try {

      let utente = await this.appUserService.verificaEsistenzaUtente();
      if (!utente.id_sil_lav_anagrafica) {
        if (!isNullOrUndefined(utente.id_utente)) {
           utente = await this.businessService.getUtenteById(+utente.id_utente).toPromise();
        }
        if (!utente.id_sil_lav_anagrafica) {
          this.openModalYesOrNo(await this.utilitiesService.getMessage('ME045'), '/fascicolo-cittadino-landing?param=' + Ambito.RDC);
          this.utilitiesService.hideSpinner();
          return;
        }
      }

      await this.commonPslpService.verificaUtente();
      if (this.commonPslpService.appuntamentiFlag) {
        this.router.navigateByUrl('/reddito-cittadinanza/riepilogo-rdc');
      } else {
        // utente senza appuntamenti ma potrebbe avere la privacy già confermata
        const idUtente = this.appUserService.getIdUtente();
        this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(idUtente);
        const laPrivacyDellUtente = this.elencoPrivacyUtente.find(el => el.cod_ambito === this.commonPslpService.AMBITO);
        if (isNullOrUndefined(laPrivacyDellUtente) || !laPrivacyDellUtente.stato) {
          this.utilitiesService.hideSpinner();
          const msg = (await this.utilitiesService.getMessage('ME101')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.RDC));
          this.openModalYesOrNo(msg, '/privacy-landing?param=' + Ambito.RDC);
        } else {
          this.router.navigateByUrl('/reddito-cittadinanza/presentazione-rdc');
        }
      }
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      return this.router.navigate(['/error-page'], { queryParams: msg });

    }
  }

  /**
   * Opens modal yes or no
   * @param msg string
   * @param destination url  string
   */
  async openModalYesOrNo(msg: string, destination: string) {
    const data: DialogModaleMessage = {
      titolo: 'Prenotazione incontro Reddito di Cittadinanza',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL(destination, TypeApplicationCard.Fascicolo);
    } else {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }

  /**
   * Opens modal confirm
   * @param msg string
   * @param home boolean
   */
  async openModalConfirm(msg: string, home: boolean) {
    const data: DialogModaleMessage = {
      titolo: 'REDDITO DI CITTADINANZA',
      tipo: TypeDialogMessage.Confirm,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (home) {
      this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
    }
  }


}
