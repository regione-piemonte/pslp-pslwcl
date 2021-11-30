import { Component, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';
import { BaseCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { OperatoreService, ParametriSistemaService, SessionStorageService, SpidUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

/**
 * Component
 * gestione home page lato operatore
 * con ausilio libreria
 *   pslshare
 */
@Component({
  // tslint:disable-next-line: component-selector
  selector: 'pslbowcl-main-home',
  templateUrl: './main-home.component.html'
})
export class MainHomeComponent implements OnInit {
  elencoCard: Array<BaseCard>;
  readonly voci = [
    { titolo: 'Operazioni per conto terzi', descrizione: '', enabled: false },
    { titolo: 'Gestione calendari', descrizione: '', enabled: false },
    { titolo: 'Configurazione piattaforma', descrizione: '', enabled: false },
  ];
  flgAccesso: boolean;
  msgAccesso: string;

  constructor(
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly operatoreService: OperatoreService,
    private readonly spidUserService: SpidUserService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    const flags: boolean[] = await Promise.all([
      this.parametriSistemaService.isOperatoriContoTerziEnabled,
      this.parametriSistemaService.isOperatoriCalendarioEnabled,
      this.parametriSistemaService.isOperatoriConfigurazioniEnabled
    ]);
    flags.forEach((v, i) => this.voci[i].enabled = v);
    const accesso: boolean = await this.parametriSistemaService.isAccessoOperatoreEnabled;
    this.flgAccesso = accesso;

    const [msgMI025] = await Promise.all([
      this.utilitiesService.getMessage('MI025')
    ]);

    if (!this.flgAccesso) {
      this.msgAccesso = msgMI025;
    }
    try {
      const user = this.spidUserService.getUser();
      this.elencoCard = await this.utilitiesService.getMenu('OP', user.codFisc);
    } catch (error) {
      const msg: Params = { 'message': 'Menu non definito' };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
    if (isNullOrUndefined(this.elencoCard)) {
      const msg: Params = { 'message': 'Menu non definito' };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }

    if (this.flgAccesso && isNullOrUndefined(this.operatoreService.getRuolo())) {
      this.utilitiesService.hideSpinner();

      return this.router.navigateByUrl('/scelta-operatore');
    }

    this.utilitiesService.hideSpinner();
  }




}
