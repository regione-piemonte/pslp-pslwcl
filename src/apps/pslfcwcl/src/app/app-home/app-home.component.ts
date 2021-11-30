import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { BaseCard, TypeApplicationCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslfcwcl-app-home',
  templateUrl: './app-home.component.html'
})
export class AppHomeComponent implements OnInit {
  elencoCard: Array<BaseCard>;

  flgAccesso: boolean;
  msgAccesso: string;

  constructor(
    private readonly utilitiesService: UtilitiesService,
    private readonly securityService: SecurityPslpService,
    @Inject(DOCUMENT) private readonly document: Document
  ) { }

  async ngOnInit() {
    this.flgAccesso = true;
    const [msgMI024] = await Promise.all([
      this.utilitiesService.getMessage('MI024')
    ]);
    if (!this.flgAccesso) {
      this.msgAccesso = msgMI024;
    }
    this.securityService.jumpToURL('/home', TypeApplicationCard.Home);
  }
}
