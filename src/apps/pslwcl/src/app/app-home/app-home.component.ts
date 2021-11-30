import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { BaseCard, TypeApplicationCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { SecurityPslpService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'app-home',
  templateUrl: './app-home.component.html'
})
export class AppHomeComponent implements OnInit {


  elencoCard: Array<BaseCard>;

  flgAccesso: boolean;
  msgAccesso: string;


  constructor(
    private readonly securityService: SecurityPslpService,
    @Inject(DOCUMENT) private document: Document
  ) { }

  async ngOnInit() {
    this.flgAccesso = true;
    this.securityService.jumpToURL('/home?id=100', TypeApplicationCard.Home);
  }
}
