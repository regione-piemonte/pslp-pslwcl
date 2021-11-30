import { Component, OnInit } from '@angular/core';
import { NavigationEmitter } from '../navigation-button/navigation-button.component';
import { Router } from '@angular/router';
import { UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'app-riepilogo-rdc',
  templateUrl: './conferma.component.html'
})
export class ConfermaComponent implements OnInit {
  private loadedFlag = [false, false, false];

  constructor(
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService
   ) { }

  ngOnInit() {
    this.utilitiesService.showSpinner();
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
