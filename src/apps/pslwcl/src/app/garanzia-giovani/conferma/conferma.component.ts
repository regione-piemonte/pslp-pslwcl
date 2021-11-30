import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationEmitter } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, ParametriSistemaService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'app-riepilogo',
  templateUrl: './conferma.component.html'
})
export class ConfermaComponent implements OnInit {
  isTutore: boolean;
  isProfilingGGEnabled: boolean;
  private loadedFlag = [false, false, false, false, false];

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly parametriSistemaService: ParametriSistemaService
   ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.isTutore = !!this.commonPslpService.tutore;
    if (!this.isTutore) {
      this.checkDataLoaded(1);
    }
    this.isProfilingGGEnabled = await this.parametriSistemaService.isProfilingGGEnabled;
    if (!this.isProfilingGGEnabled) {
      this.checkDataLoaded(3);
    }
    this.checkDataLoaded(0);
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
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  onExitPage(nav: NavigationEmitter) {
    this.router.navigateByUrl(nav.url);
  }
}
