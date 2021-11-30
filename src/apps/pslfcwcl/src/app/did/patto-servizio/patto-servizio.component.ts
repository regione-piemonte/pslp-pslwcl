import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EsitoDettaglioDid } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { NavigationEmitter } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslfcwcl-patto-servizio',
  templateUrl: './patto-servizio.component.html',
  styles: ['button { margin: 10px; }']
})
export class PattoServizioComponent implements OnInit {

  /**
   * Data changed of patto servizio component
   */
  private dataChanged: boolean;
  private loadedFlag = [false, false, false];
  private validInformazioniAggiuntive = false;
  nextButtonName: string;
  prevButtonName = 'INDIETRO';
  idUtente: number;
  did: EsitoDettaglioDid = {};

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly appUserService: AppUserService
  ) { }

  /**
   * on init
   */
  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.idUtente = this.appUserService.getIdUtente();
    this.dataChanged = false;
    this.checkDataLoaded(0);
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.utilitiesService.hideSpinner();
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

  /**
   * Sets validity informazione aggiuntiva
   * @param validity boolean
   */
  setValidityInformazioneAggiuntiva(validity: boolean) {
    this.validInformazioniAggiuntive = validity;
  }

  /**
   * Sets data changed
   */
  setDataChanged() {
    this.dataChanged = true;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'SALVA & PROSEGUI';
  }

  /**
   * Disables next button
   * @returns true if next button
   */
  disableNextButton(): boolean {
    return this.commonPslpService.readOnly
      || (!this.commonPslpService.wizard && !this.dataChanged)
      || !this.validInformazioniAggiuntive;
  }
}
