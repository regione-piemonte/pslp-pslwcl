import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { NavigationEmitter } from '../navigation-button/navigation-button.component';

@Component({
  selector: 'app-informazioni',
  templateUrl: './informazioni.component.html',
  // styleUrls: ['./informazioni.component.css']
  styles: ['button { margin: 10px; }']
})
export class InformazioniComponent implements OnInit {

  private dataChanged: boolean;
  private loadedFlag = [false, false, false];
  private validInformazioniAggiuntive = false;
  nextButtonName: string;

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  ngOnInit() {
    this.utilitiesService.showSpinner();
    this.dataChanged = false;
    this.checkDataLoaded(0);
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
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
  async onExitPage(nav: NavigationEmitter) {
    // save informazioni aggiuntive
    try {
      await this.commonPslpService.saveInformazioneAggiuntivaExtend();
      this.router.navigateByUrl(nav.url);
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'Informazioni Aggiuntive');
    }
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
