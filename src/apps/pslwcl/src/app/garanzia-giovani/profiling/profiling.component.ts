import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CondizioneOccupazionale, GradoStudio, MotivoPresenzaInItalia, ProfilingYG, Provincia, TitoloStudio } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, NavigationEmitter, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import getDeepValue from 'get-deep-value';
import { ProfilingUtilitiesService } from './profiling-utilities.service';

export interface DataModel {
  livelloStudio: number;
  titoloStudio: string;
  condizioneOccupazionale: number;
  presenzaItalia: number;
}

const PROFILING_SPINNER = 'profiling-spinner';
@Component({
  selector: 'app-profiling',
  templateUrl: './profiling.component.html',
  styleUrls: ['./profiling.component.css']
})
export class ProfilingComponent implements OnInit {
  profiloResult: ProfilingYG;
  profilingHelp: string;
  working: boolean;
  provinciaDescResult: Promise<string>;
  popdown: boolean;

  liste = {
    gradoStudio: [] as GradoStudio[],
    titoloStudio: [] as TitoloStudio[],
    condizioneOccupazionale: [] as CondizioneOccupazionale[],
    motivoPresenzaInItalia: [] as MotivoPresenzaInItalia[]
  };

  provinciaResidenza: Provincia;
  provinciaDomicilio: Provincia;
  eta: number;
  profilingDisabled: boolean;
  infoMsg: string;

  dataModel: DataModel;
  readOnly: boolean;
  navigationDisabled: boolean;
  datiObbligatori: boolean;

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly profilingUtilitiesService: ProfilingUtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.readOnly = this.commonPslpService.readOnly;
    this.navigationDisabled = !this.commonPslpService.wizard;
    this.profilingDisabled = this.readOnly;
    this.working = false;
    this.popdown = !this.commonPslpService.wizard;

    this.dataModel = {
      livelloStudio: null,
      titoloStudio: null,
      condizioneOccupazionale: null,
      presenzaItalia: null
    };

    const [profilingHelp, gradoStudio, titoliStudio, condizioneOccupazionale, motivoPresenzaInItalia, profiloResult, sap] =
      await Promise.all([
        this.utilitiesService.getMessage('HC001'),
        this.profilingUtilitiesService.getGradiStudio(),
        this.profilingUtilitiesService.getTitoliStudio(),
        this.profilingUtilitiesService.getCondizioniOccupazionali(),
        this.profilingUtilitiesService.getMotiviPresenzaInItalia(),
        this.commonPslpService.getProfiloResult$(),
        this.commonPslpService.getSap$()
      ]);
    this.profilingHelp = profilingHelp;
    this.liste.gradoStudio = gradoStudio;
    this.liste.titoloStudio = titoliStudio;
    this.liste.condizioneOccupazionale = condizioneOccupazionale;
    this.liste.motivoPresenzaInItalia = motivoPresenzaInItalia;
    this.profiloResult = profiloResult;
    this.provinciaDescResult = this.profilingUtilitiesService
      .getProvinciaDescByCodMinisteriale$(this.profiloResult.codice_ministeriale_provincia);
    this.provinciaResidenza = getDeepValue(sap, 'residenza.comune.provincia');
    this.provinciaDomicilio = getDeepValue(sap, 'domicilio.comune.provincia');
    await this.checkProvincia();
    this.eta = await this.commonPslpService.age$();
    this.datiObbligatori = !(profiloResult && profiloResult.indice);
    this.utilitiesService.hideSpinner();
  }

  /**
   * Determines whether change livello on
   */
  async onChangeLivello() {
    this.dataModel.titoloStudio = this.liste.titoloStudio = null;
    this.liste.titoloStudio = await this.profilingUtilitiesService.getTitoliStudio(this.dataModel.livelloStudio);
  }

  /**
   * Determines whether submit on
   */
  async onSubmit() {
    this.working = true;
    this.utilitiesService.showSpinner(PROFILING_SPINNER);
    try {
      const value = await this.commonPslpService.calcolaProfiling$(
        this.commonPslpService.getUtenteStorage().id_utente,
        this.dataModel.titoloStudio,
        this.dataModel.condizioneOccupazionale,
        this.dataModel.presenzaItalia,
        this.provinciaDomicilio ? this.provinciaDomicilio.codice_ministeriale : null,
        this.provinciaResidenza ? this.provinciaResidenza.codice_ministeriale : null
      );
      this.profiloResult = value;
      this.working = false;
      this.provinciaDescResult = this.profilingUtilitiesService.getProvinciaDescByCodMinisteriale$(value.codice_ministeriale_provincia);
      this.navigationDisabled = false;
    } catch (e) {
      this.utilitiesService.hideSpinner(PROFILING_SPINNER);
      this.profiloResult = {};
      this.working = false;
      const result = await this.openModalConfermaSenzaLink(e.message);
    }
    this.utilitiesService.hideSpinner(PROFILING_SPINNER);
  }
  /**
   * Checks provincia
   * @returns provincia
   */
  private async checkProvincia(): Promise<void> {
    //  controllare la regione, nel caso ci sia
    const goodProvinces = ['TORINO', 'CUNEO', 'VERCELLI', 'ALESSANDRIA', 'BIELLA', 'NOVARA', 'VERBANO CUSIO OSSOLA', 'ASTI'];
    const provinciaObj = (this.provinciaDomicilio || this.provinciaResidenza);
    const provincia = provinciaObj ? provinciaObj.descrizione.toUpperCase() : '';
    if (goodProvinces.indexOf(provincia) !== -1) {
      // Provincia del Piemonte: accettabile
      return;
    }
    this.profilingDisabled = true;
    this.infoMsg = await this.utilitiesService.getMessage('MI011');
  }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  onExitPage(nav: NavigationEmitter) {
    this.router.navigateByUrl(nav.url);
  }

  /**
   * Opens modal conferma senza link
   * @param messaggio string
   *
   */
  async openModalConfermaSenzaLink(messaggio: string) {
    const data: DialogModaleMessage = {
      titolo: 'Calcolo profiling',
      tipo: TypeDialogMessage.Confirm,
      messaggio: "",
      messaggioAggiuntivo: messaggio
    };
    const result = await this.pslbasepageService.openModal(data);
    return result;
  }
}
