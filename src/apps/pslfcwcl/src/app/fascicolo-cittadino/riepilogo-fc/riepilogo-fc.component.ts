import { Component, OnInit, ViewChild } from '@angular/core';
import { Params, Router } from '@angular/router';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, ParametriSistemaService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';


@Component({
  selector: 'pslfcwcl-riepilogo-fc',
  templateUrl: './riepilogo-fc.component.html'
})
export class RiepilogoFCComponent implements OnInit {
  idUtente: number;
  minori: UtenteACarico[];
  hasMinori = false;
  creareNuovaSAP = false;
  loading: number;
  messaggioUtente: string;

  @ViewChild('accordionMinori', { static: false }) accordionMinori: NgbAccordion;
  hasSAP: boolean;

  constructor(
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly appUserService: AppUserService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly commonFCService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.commonFCService.inizializzaHard();
    this.commonFCService.AMBITO = Ambito.FASC;
    this.storageService.setItem(SessionStorageService.HAS_RIEPILOGO, true);
    this.idUtente = this.appUserService.getIdUtente();
    try {
      this.minori = await this.appUserService.getUtentiACarico(this.idUtente);
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
    this.loading = this.minori.length + 1;
    this.hasMinori = this.minori.length > 0;

    let sap;

    if (!this.commonFCService.operareSoloMinori) {
      sap = await this.commonFCService.getSap$(this.idUtente);
      this.logService.log("getSap " + sap);
    } else {
      const ambito = this.commonFCService.getAmbito();
      sap = await this.commonFCService.getSapAmbito(this.idUtente, ambito);
      if (isNullOrUndefined(sap) || this.commonFCService.creareNuovaSap) {
        this.creareNuovaSAP = true;
      }
      this.logService.log("getSapAmbito " + sap);
      this.logService.log("creanuovasap " + this.creareNuovaSAP);
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
    if (!this.hasSAP) {
      await this.decreaseLoading();
    }
  }

  onGestionePrivacyEMinori() {
    this.setDataFascicolo();
    this.router.navigateByUrl('/privacy-landing?param=' + Ambito.FASC);
  }

  /**
   * Determines whether nuova sap on
   */
  onNuovaSap() {
    this.setDataFascicolo();
    this.router.navigateByUrl('/fascicolo-cittadino/registrazione-dati-anagrafici');
  }

  private setDataFascicolo() {
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
      const userMessage = await this.utilitiesService.getMessage('MI027');
      this.messaggioUtente = userMessage;

      if (this.minori.length === 1) {
        this.accordionMinori.expand(`minore-${this.minori[0].tutelato.id_utente}`);
      }

      this.utilitiesService.hideSpinner();
    }
  }

}
