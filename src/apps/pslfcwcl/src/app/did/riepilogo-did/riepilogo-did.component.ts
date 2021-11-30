import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, ParametriSistemaService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';


@Component({
  selector: 'pslfcwcl-riepilogo-did',
  templateUrl: './riepilogo-did.component.html'
})
export class RiepilogoDIDComponent implements OnInit {
  idUtente: number;
  loading: number;
  messaggioUtente: string;

  @ViewChild('accordionMinori', { static: false }) accordionMinori: NgbAccordion;
  hasSAP: boolean;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly commonFCService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  /**
   * on init
   */
  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.commonFCService.AMBITO = Ambito.FASC;
    this.storageService.setItem(SessionStorageService.HAS_RIEPILOGO, true);
    this.idUtente = this.appUserService.getIdUtente();
    this.loading = 2;

    let sap;

    if (!this.commonFCService.operareSoloMinori) {
      sap = await this.commonFCService.getSap$(this.idUtente);
    } else {
      const ambito = this.commonFCService.getAmbito();
      sap = await this.commonFCService.getSapAmbito(this.idUtente, ambito);
    }
    if (!isNullOrUndefined(sap)) {
      this.commonFCService.setSapAndIdUtenteStorage(sap, this.idUtente);
    } else {
      this.commonFCService.setSapAndIdUtenteStorage(null, null);
    }

    const flagS: boolean = await this.parametriSistemaService.isModificabiliSezioni;
    this.commonFCService.sezioniModificabiliFuoriPiemonte = flagS;
    const flagP: boolean = await this.parametriSistemaService.isObbligoDomicPiemonte;
    this.commonFCService.obbligoDomicilioPiemonte = flagP;

    this.hasSAP = !!sap;
    if (this.hasSAP) {
      await this.decreaseLoading();
    }
  }

  /**
   * Determines whether gestione privacy eminori on
   * Permette di andare direttamente alla pagina di gestione privacy
   */
  onGestionePrivacyEMinori() {
    this.setInfoDID();
    this.router.navigateByUrl('/privacy-landing?param=' + Ambito.DID);
  }

  /**
   * Determines whether gestione fascicolo on
   * Permette di passare direttamente alla pagina del fascicolo sanitario
   */
  onGestioneFascicolo() {
    this.setInfoDID();
    this.router.navigateByUrl('/fascicolo-cittadino-landing?param=' + Ambito.DID);
  }

  /**
   * Sets info did
   */
  private setInfoDID() {
    this.commonFCService.inizializzaProfilo();

    this.commonFCService.wizard = true;
    this.commonFCService.readOnly = false;

    this.commonFCService.tutore = undefined;
    this.commonFCService.utenteACarico = undefined;

    this.commonFCService.setUtenteStorage({ id_utente: this.idUtente });
  }

  /**
   * Decreases loading
   */
  async decreaseLoading() {
    this.loading--;
    if (this.loading === 0) {
      const userMessage = await this.utilitiesService.getMessage('MI036');
      this.messaggioUtente = userMessage;
    }
    this.utilitiesService.hideSpinner();
  }

}
