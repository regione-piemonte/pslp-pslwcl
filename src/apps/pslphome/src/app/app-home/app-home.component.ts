import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';

import { BaseCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';



@Component({
  selector: 'pslphome-app-home',
  templateUrl: './app-home.component.html'
})
export class AppHomeComponent implements OnInit {

  elencoCard: Array<BaseCard>;

  flgAccesso: boolean;
  msgAccesso: string;

  constructor(
    private readonly utilitiesService: UtilitiesService,
    private readonly router: Router,

   // @Inject(DOCUMENT) private document: Document
  ) { }

  async ngOnInit() {
    this.flgAccesso = true;
    const [msgMI024] = await Promise.all([
      this.utilitiesService.getMessage('MI024')
    ]);

    if (!this.flgAccesso) {
      this.msgAccesso = msgMI024;
    }

    let id = new URL(location.href).searchParams.get("id");
    if (isNullOrUndefined(id)) {
      id = '0';
    }
    try {
      this.elencoCard = await this.utilitiesService.getMenu(id);
    } catch (error) {
      const msg: Params = { 'message': 'Menu non definito' };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
    if (isNullOrUndefined(this.elencoCard)) {
      const msg: Params = { 'message': 'Menu non definito' };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
  }


}
