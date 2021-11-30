import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

import { Indirizzo, Recapito, SchedaAnagraficoProfessionale, BusinessService, Cittadinanza, Nazione, PermessoDiSoggiorno } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

import { UtilitiesService, LogService, UrlRouteService, CommonPslpService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Router } from '@angular/router';
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328


@Component({
  selector: 'pslshare-dati-anagrafici-fascicolo',
  templateUrl: './dati-anagrafici-fascicolo.component.html'
})
export class DatiAnagraficiFascicoloComponent implements OnInit {
  @Input() forceReadOnlyResidenza = false;
  @Input() forceReadOnlyDomicilio = false;
  @Input() forceReadOnlyRecapiti = false;
  @Input() cpiVisible = false;
  @Input() descCpiRes: string;
  @Input() descCpiDom: string;
  @Input() showDatiAnagraficiHelp = true;
  @Output() dataChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() flagChanging: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() sapChange: EventEmitter<SchedaAnagraficoProfessionale> = new EventEmitter<SchedaAnagraficoProfessionale>();
  sap: SchedaAnagraficoProfessionale;
  flagResidenzaChanging = false;
  flagDomicilioChanging = false;
  flagRecapitiChanging = false;
  flagCittadinanzaUE = false;

  ilPermessoDiSoggiornoClonato: PermessoDiSoggiorno;

  dataChanged = false;

  messaggioErroreProsegui: string;
  readOnly: boolean;
  popdown: boolean;
  helpMessage: string;

  liste = {
    sessi: [],
    nazioni: [],
    cittadinanze: [],
    statusExtraUe: [],
    motiviRilascio: [],
  };


  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly router: Router,
    private readonly businessService: BusinessService,
    private readonly urlRouteService: UrlRouteService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.popdown = true;
    this.readOnly = this.commonFCService.readOnly;
    let codMessaggioErroreProsegui: string;
    let codHelpCampo: string;
    switch (this.commonFCService.AMBITO) {
      case Ambito.GG:
        codMessaggioErroreProsegui = 'ME031';
        codHelpCampo = 'HC003';
        break;
      case Ambito.RDC:
        codMessaggioErroreProsegui = 'ME047';
        codHelpCampo = 'HC008';
        break;
      case Ambito.COMI:
          codMessaggioErroreProsegui = 'ME047';
          codHelpCampo = 'HC070';
          break;

      default:  // come Ambito Fascicolo
        codMessaggioErroreProsegui = 'ME091';
        codHelpCampo = 'HC012';
        break;
    }
    try {
      const [sap, messaggioErroreProsegui, helpMessage] = await Promise.all([
        this.commonFCService.getSap$(),
        this.utilitiesService.getMessage(codMessaggioErroreProsegui),
        this.utilitiesService.getMessage(codHelpCampo)
      ]);
      this.sap = sap;
      this.sapChange.emit(sap);
      this.messaggioErroreProsegui = messaggioErroreProsegui;
      this.commonFCService.backupStorageFascicolo();
      this.helpMessage = helpMessage;
    } catch (err) {
      const url = this.urlRouteService.getPreviousUrl();
      this.router.navigateByUrl(url);
      this.utilitiesService.showToastrErrorMessage(err.message);
    } finally {
      this.utilitiesService.hideSpinner();
    }

    const [nazioni, cittadinanze, statusExtraUe, motiviRilascio] = await Promise.all([
      this.businessService.getNazioni().toPromise(),
      this.businessService.getCittadinanze().toPromise(),
      this.businessService.findElencoStatusExtraUE().toPromise(),
      this.businessService.findMotiviRilascioPermessoDiSoggiorno().toPromise()
    ]);
    this.liste.nazioni = nazioni;
    this.liste.cittadinanze = cittadinanze;
    this.liste.statusExtraUe = statusExtraUe;
    this.liste.motiviRilascio = motiviRilascio;

    this.flagCittadinanzaUE = this.isCittadinanzaUE();
    this.ilPermessoDiSoggiornoClonato = UtilitiesService.clone(this.sap.permessoDiSoggiorno);

  }
  /**
   * Residenzas edit state
   * @param stato boolean
   */
  residenzaEditState(stato: boolean) {
    this.flagResidenzaChanging = stato;
    this.flagChangingEmit();
  }
  /**
   * Residenzas changed
   * @param indirizzo Indirizzo
   */
  residenzaChanged(indirizzo: Indirizzo) {
    this.sap.residenza = indirizzo;
    this.dataChanged = true;
    this.sapChange.emit(this.sap);
    this.dataChange.emit(this.dataChanged);
  }
  /**
   * Domicilios edit state
   * @param stato boolean
   */
  domicilioEditState(stato: boolean) {
    this.flagDomicilioChanging = stato;
    this.flagChangingEmit();
  }
  /**
   * Domicilios changed
   * @param indirizzo Indirizzo
   */
  domicilioChanged(indirizzo: Indirizzo) {
    this.sap.domicilio = indirizzo;
    this.dataChanged = true;
    this.sapChange.emit(this.sap);
    this.dataChange.emit(this.dataChanged);
  }
  /**
   * Recapitis edit state
   * @param stato boolean
   */
  recapitiEditState(stato: boolean) {
    this.flagRecapitiChanging = stato;
    this.flagChangingEmit();
  }
  /**
   * Recapitis changed
   * @param recapito Recapito
   */
  recapitiChanged(recapito: Recapito) {
    this.sap.recapito = recapito;
    this.dataChanged = true;
    this.sapChange.emit(this.sap);
    this.dataChange.emit(this.dataChanged);
  }

  /**
   * Flags changing emit
   */
  private flagChangingEmit() {
    const flag = this.flagResidenzaChanging || this.flagDomicilioChanging || this.flagRecapitiChanging;
    this.flagChanging.emit(flag);
  }

  /**
   * Determines whether change cittadinanza on
   */
  onChangeCittadinanza(): void {

    this.sap.cittadinanza = this.liste.cittadinanze.filter(ts => ts.codice_ministeriale === this.sap.codice_ministeriale_cittadinanza)[0].descrizione;

    this.flagCittadinanzaUE = this.isCittadinanzaUE();
    if (this.flagCittadinanzaUE) {
      // Italia
      this.sap.permessoDiSoggiorno = {};
    } else {
      this.sap.permessoDiSoggiorno = this.ilPermessoDiSoggiornoClonato;
    }
    this.dataChanged = true;
    this.sapChange.emit(this.sap);
    this.dataChange.emit(this.dataChanged);

  }

  /**
   * Determines whether change permesso on
   * @param ilPermesso PermessoDiSoggiorno
   */
  onChangePermesso(ilPermesso: PermessoDiSoggiorno): void {
    this.sap.permessoDiSoggiorno = ilPermesso;
    this.dataChanged = true;
    this.sapChange.emit(this.sap);
    this.dataChange.emit(this.dataChanged);
  }

  /**
   * Determines whether cittadinanza ue is
   * @returns true if cittadinanza ue
   */
  private isCittadinanzaUE(): boolean {
    if (!this.sap.codice_ministeriale_cittadinanza) {
      return true;
    }
    const currentCittadinanza: Cittadinanza = this.liste.cittadinanze.find(
      el => el.codice_ministeriale === this.sap.codice_ministeriale_cittadinanza);
    if (!currentCittadinanza) {
      return false;
    }
    const nazione: Nazione = this.liste.nazioni.find(
      (el: Nazione) => el.codice_ministeriale === currentCittadinanza.codice_ministeriale_nazione
    );
    return nazione && nazione.flag_ue;
  }


}
