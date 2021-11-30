import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Decodifica, PoliticaAttiva, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, NavigationEmitter, SezioniSAP, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { TipoDurataCorso } from '../dati-curriculari/formazione-professionale/formazione-professionale.component';

@Component({
  selector: 'pslfcwcl-politiche-attive',
  templateUrl: './politiche-attive.component.html'
})

export class PoliticheAttiveComponent implements OnInit {
  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="politicheAttive"]';

  readOnlyDomicilio = false;

  listaTipoDurata: { key: TipoDurataCorso, value: string }[] = [
    { key: 'O', value: 'Ore' },
    { key: 'G', value: 'Giorni' },
    { key: 'M', value: 'Mesi' },
    { key: 'A', value: 'Anni' }
  ];

  readOnly: boolean;
  dataChanged = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  prevButtonName: string;
  titoloPagina = 'Politiche Attive';
  urlUscita: string;

  politicaAttiva: PoliticaAttiva;

  constructor(
    private readonly router: Router,
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
   ) {  }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.nextButtonName = 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    this.readOnly = this.commonFCService.readOnly || this.commonFCService.readOnlyDomicilio;
    const [sap, msgCambioDomicilio] = await Promise.all([
      this.commonFCService.getSap$(),
      this.utilitiesService.getMessage('ME085')
    ]);
    this.sap = sap;
    this.commonFCService.backupStorageFascicolo();
    this.utilitiesService.hideSpinner();
    this.readOnlyDomicilio = this.commonFCService.readOnlyDomicilio;

    if (this.readOnlyDomicilio) {
      this.utilitiesService.showToastrInfoMessage(msgCambioDomicilio);
    }
  }

  /**
   * Determines whether sap change on
   * @param value SchedaAnagraficoProfessionale
   */
  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
  }

  /**
   * Determines whether data change on
   * @param value boolean
   */
  onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = 'PROSEGUI';
  }

  /**
   * Determines whether flag changing on
   * @param value boolean
   */
  onFlagChanging(value: boolean) {
    this.flagChanging = value;
  }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  async onExitPage(nav: NavigationEmitter) {
    try {
      if (this.dataChanged && (nav.exit === TypeExit.Wizard
        || nav.exit === TypeExit.Back
        || nav.exit === TypeExit.Prev)) {
        this.urlUscita = nav.url;
        this.openModal();
      } else {
        if (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) {

          if (!this.readOnly && this.dataChanged) {
            this.utilitiesService.showSpinner();
            this.commonFCService.setSapStorage(this.sap);

            this.commonFCService.setSapSezioniUpdate(SezioniSAP.POLITICHE_ATTIVE);
            this.commonFCService.backupStorageFascicolo();

            this.utilitiesService.hideSpinner();

          }
        }
        this.router.navigateByUrl(nav.url);
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, this.titoloPagina);
    }
  }

  /**
   * Opens modal
   */
  async openModal() {
    const data: DialogModaleMessage = {
      titolo: 'Uscita ' + this.titoloPagina,
      tipo: TypeDialogMessage.YesOrNo
    };

    const result = await this.pslbasepageService.richiestaFinestraModale(data);
      if (result === 'SI') {
        this.doUscita();
      }
  }

  /**
   * Do uscita
   */
  doUscita() {
    if (this.urlUscita.startsWith('/fascicolo-')) {
       this.commonFCService.restoreStorageFascicolo();
    } else {
       this.commonFCService.azzeraStorageFascicolo();
    }
    this.router.navigateByUrl(this.urlUscita);
  }

  /**
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {
    return !this.flagChanging
      && this.sap
      && (this.commonFCService.wizard || this.dataChanged);
  }

  /**
   * Gets durata edescrizione
   * @returns durata edescrizione
   */
  getDurataEDescrizione(): string {
    let result = "";
    if (!isNullOrUndefined(this.politicaAttiva.durata)) {
      result = this.politicaAttiva.durata + " " + this.listaTipoDurata.find(tipod => tipod.key === this.politicaAttiva.tipo_durata).value;
    }
    return result;
  }

  /**
   * Gets codice descrizione
   * @param d Decodifica
   * @returns codice descrizione
   */
  getCodiceDescrizione(d: Decodifica): string {
    let result = "";
    if (!isNullOrUndefined(d.codice_ministeriale)) {
      result = d.codice_ministeriale;
    }
    if (!isNullOrUndefined(d.descrizione)) {
      result = result +  " " + d.descrizione;
    }
    return result.trim();
  }

  /**
   * Determines whether visualizza on
   * @param politica PoliticaAttiva
   */
  onVisualizza(politica: PoliticaAttiva) {
    this.politicaAttiva = UtilitiesService.clone(politica);
    this.utilitiesService.scrollTo(PoliticheAttiveComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.politicaAttiva = null;
  }

}
