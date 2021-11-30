import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BusinessService, UtenteACarico, UtentePresaVisione } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, NavigationEmitter, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, LogService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-responsabilita',
  templateUrl: './responsabilita.component.html'
})
export class ResponsabilitaComponent implements OnInit {
  generale: string;
  responsabilitaTestata: String;
  responsabilitaDettaglio: String;
  checkResponsabilitaPrivacy = false;
  checkResponsabilitaPrivacyOrig = false;

  constructor(
    private readonly router: Router,
    private readonly businessService: BusinessService,
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService
  ) {}

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    const values = await Promise.all([
      this.utilitiesService.getMessage('PGEN1'),
      this.utilitiesService.getMessage('PRES1'),
      this.utilitiesService.getMessage('PRES2')
    ]);
    this.generale = values[0];
    this.responsabilitaTestata = values[1];
    this.responsabilitaDettaglio =  /^\?*$/.test(values[2]) ? '' : values[2];

    this.checkResponsabilitaPrivacy = this.getPrivacy(this.commonPslpService.utenteACarico);
    this.checkResponsabilitaPrivacyOrig = this.getPrivacy(this.commonPslpService.utenteACarico);
    this.utilitiesService.hideSpinner();
  }
  /**
   * Determines whether check responsabilita privacy on
   */
  onCheckResponsabilitaPrivacy() {
    this.checkResponsabilitaPrivacy = !this.checkResponsabilitaPrivacy;
  }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  onExitPage(nav: NavigationEmitter) {
    if (nav.exit === TypeExit.Next &&
      this.checkResponsabilitaPrivacy !== this.checkResponsabilitaPrivacyOrig) {
          // Chiamare il servizio per aggiornare l'utente a carico
        const tutore = this.commonPslpService.tutore;
        const utenteACarico = this.commonPslpService.utenteACarico;
        this.setPrivacy(utenteACarico, this.checkResponsabilitaPrivacy);

        this.businessService.saveUtenteACarico(tutore.id_utente, utenteACarico)
          .subscribe(() => this.logService.log('DONE') );
        // Migrazione dei dati sul responsabile
    }
    this.router.navigateByUrl(nav.url);
  }

  /**
   * Sets privacy
   * @param utenteACarico UtenteACarico
   * @param privacy boolean
   * @returns privacy UtenteACarico
   */
  private setPrivacy(utenteACarico: UtenteACarico, privacy: boolean): UtenteACarico {

      if (this.getPrivacy(utenteACarico)) {
          if (!privacy) {
            const ind = utenteACarico.prese_visione.findIndex(s => s.cod_ambito === Ambito.GG);
             utenteACarico.prese_visione = [
              ...utenteACarico.prese_visione.filter((el, idx) => idx !== ind)
            ];
          }
      } else {
          if (privacy) {
            const presa: UtentePresaVisione = { cod_ambito: Ambito.GG};
            if (isNullOrUndefined(utenteACarico.prese_visione)) {
              utenteACarico.prese_visione = [];
            }
            utenteACarico.prese_visione.push(presa);
          }
      }
      return utenteACarico;

  }

  /**
   * Gets privacy
   * @param utenteACarico boolean
   * @returns true if privacy
   */
  private getPrivacy(utenteACarico: UtenteACarico): boolean {
    const ambito = Ambito.GG;
    const prese: Array<UtentePresaVisione> =  utenteACarico.prese_visione ? utenteACarico.prese_visione : [];
    return !isNullOrUndefined(prese.find(s => s.cod_ambito === ambito));
  }
}
