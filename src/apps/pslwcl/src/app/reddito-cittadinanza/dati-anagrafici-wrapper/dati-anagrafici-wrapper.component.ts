import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { NavigationEmitter, TypeExit, SezioniSAP } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328


@Component({
  selector: 'app-dati-anagrafici-wrapper',
  templateUrl: './dati-anagrafici-wrapper.component.html'
})
export class DatiAnagraficiWrapperComponent implements OnInit {
  readOnly: boolean;
  dataChanged = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  prevButtonName: string;

  private messaggioErroreProvincia: string;
  messaggioErroreDati: string;

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = this.commonPslpService.wizard === false ? 'INDIETRO' : 'ANNULLA';
    this.readOnly = this.commonPslpService.readOnly;
    const [messaggioErroreProvincia, messaggioErroreDati] = await Promise.all([
      this.utilitiesService.getMessage('ME039'),
      this.utilitiesService.getMessage('ME047')
    ]);
    this.messaggioErroreProvincia = messaggioErroreProvincia;
    this.messaggioErroreDati = messaggioErroreDati;
  }

  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
  }

  onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'SALVA & PROSEGUI';
  }

  onFlagChanging(value: boolean) {
    this.flagChanging = value;
  }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  async onExitPage(nav: NavigationEmitter) {
    try {
      if (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) {
        this.checkCoerenzaProvincia();
        if (this.dataChanged) {
          this.utilitiesService.showSpinner();
          this.commonPslpService.setSapStorage(this.sap);

          const sezioni: string[] = [SezioniSAP.DATI_ANAGRAFICI];
          const esito = await this.commonPslpService.saveSezioniSap(sezioni);
          this.utilitiesService.hideSpinner();
          if (esito.code !== 'OK' && esito.code !== '200') {
            throw new Error(esito.messaggioCittadino);
          }
        }
      }
      this.router.navigateByUrl(nav.url);
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'Anagrafica');
    }
  }

  /**
   * Checks coerenza provincia
   *
   */
  private checkCoerenzaProvincia() {
    if (!this.commonPslpService.wizard) {
      return;
    }
    if (this.utilitiesService.isProvinciaInPiemonte(this.sap.domicilio)
      || this.utilitiesService.isProvinciaInPiemonte(this.sap.residenza)) {
      return;
    }
    throw new Error(this.messaggioErroreProvincia);
  }

  /**
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {
    return !this.flagChanging
      && this.sap
      && (this.sap.recapito && this.sap.recapito.email)
      && (
        (this.sap.residenza && this.sap.residenza.comune && this.sap.residenza.comune.provincia
            && !!this.sap.residenza.comune.provincia.codice_ministeriale)
        || (this.sap.domicilio && this.sap.domicilio.comune && this.sap.domicilio.comune.provincia
            && !!this.sap.domicilio.comune.provincia.codice_ministeriale)
      )
      && (this.commonPslpService.wizard || this.dataChanged);
  }
}
