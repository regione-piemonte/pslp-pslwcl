import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Indirizzo, Recapito, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, LogService, UrlRouteService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328




@Component({
  selector: 'pslshare-dati-anagrafici-cittadino',
  templateUrl: './dati-anagrafici-cittadino.component.html'
})
export class DatiAnagraficiCittadinoComponent implements OnInit {
  @Input() forceReadOnlyResidenza = false;
  @Output() dataChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() flagChanging: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() sapChange: EventEmitter<SchedaAnagraficoProfessionale> = new EventEmitter<SchedaAnagraficoProfessionale>();
  sap: SchedaAnagraficoProfessionale;
  flagResidenzaChanging = false;
  flagDomicilioChanging = false;
  flagRecapitiChanging = false;
  dataChanged = false;

  messaggioErroreProsegui: string;
  readOnly: boolean;
  popdown: boolean;
  helpMessage: string;

  constructor(
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService,
    private readonly router: Router,
    private readonly urlRouteService: UrlRouteService
  ) {}

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.popdown = !this.commonPslpService.wizard;
    this.readOnly = this.commonPslpService.readOnly;
    let codMessaggioErroreProsegui: string;
    let codHelpCampo: string;
    switch (this.commonPslpService.AMBITO) {
      case Ambito.GG:
        codMessaggioErroreProsegui = 'ME031';
        codHelpCampo = 'HC003';
        break;
      case Ambito.RDC:
        codMessaggioErroreProsegui = 'ME047';
        codHelpCampo = 'HC008';
        break;
      default:
        break;
    }
    try {
      const [sap, messaggioErroreProsegui, helpMessage] = await Promise.all([
        this.commonPslpService.getSap$(this.commonPslpService.getUtenteStorage().id_utente),
        this.utilitiesService.getMessage(codMessaggioErroreProsegui),
        this.utilitiesService.getMessage(codHelpCampo)
      ]);
      this.sap = sap;
      this.sapChange.emit(sap);
      this.messaggioErroreProsegui = messaggioErroreProsegui;
      this.helpMessage = helpMessage;
      this.logService.log('sap', this.sap);
    } catch (err) {
      const url = this.urlRouteService.getPreviousUrl();
      this.router.navigateByUrl(url);
      this.utilitiesService.showToastrErrorMessage(err.message);
    } finally {
      this.utilitiesService.hideSpinner();
    }
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
}
