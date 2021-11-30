import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { EsitoRicercaRichiestaIscrizioneCollocamentoMirato, Operatore, RichiestaIscrizioneL68Header, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito } from '@pslwcl/pslmodel';
import { AppUserService, CommonPslpService, LogService, ParametriSistemaService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'pslshare-riepilogo-cm',
  templateUrl: './riepilogo-cm.component.html'
})
export class RiepilogoCMComponent implements OnInit {
  idUtente: number;
  isOperatore = false;
  minori: UtenteACarico[];
  hasMinori = false;
  creareNuovaSAP = false;
  loading: number;
  messaggioUtente: string;


  @ViewChild('accordionMinori', { static: false }) accordionMinori: NgbAccordion;
  hasSAP: boolean;
  flgBackOffice: boolean;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly commonPslpService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.storageService.setItem(SessionStorageService.HAS_RIEPILOGO, true);
    this.commonPslpService.resetRichiestaIscrizioneStorage();

    const operatore = this.appUserService.getOperatore();
    if (!isNullOrUndefined(operatore)) {
      this.isOperatore = true;
    }
    this.idUtente = this.appUserService.getIdUtente();
    let utente = this.appUserService.getUtente();
    if (this.isOperatore) {
       utente = this.appUserService.getUtenteSimulato();
    }

    // this.commonPslpService.getDettaglioIscrizioneL68$(this.idUtente);
    this.logService.log("******* riepilogo cm ************************");
    this.logService.log("isOperatore " + this.isOperatore );
    this.logService.log("utente idUtente " + utente.id_utente);
    this.logService.log("utente id sil lav " + utente.id_sil_lav_anagrafica);
    this.logService.log("*********************************************");
    this.commonPslpService.setUtenteStorage( utente );
    this.loading = 1;
    let sap;

    if (!this.commonPslpService.operareSoloMinori) {
      sap = await this.commonPslpService.getSap$(this.idUtente);
    } else {
      const ambito = this.commonPslpService.getAmbito();
      sap = await this.commonPslpService.getSapAmbito(this.idUtente, ambito);
      if (isNullOrUndefined(sap) || this.commonPslpService.creareNuovaSap) {
        this.creareNuovaSAP = true;
      }
    }

    const flagS: boolean = await this.parametriSistemaService.isModificabiliSezioni;
    this.commonPslpService.sezioniModificabiliFuoriPiemonte = flagS;
    const flagP: boolean = await this.parametriSistemaService.isObbligoDomicPiemonte;
    this.commonPslpService.obbligoDomicilioPiemonte = flagP;

    this.hasSAP = !!sap;
    if (!this.hasSAP) {
      await this.decreaseLoading();
    }

    this.logService.log('[RiepilogoComponent::ngOnInit]', 'Data to load: ', this.loading);
  }


  /**
   * Determines whether nuova dichiarazione on
   */
  onNuovaDichiarazione() {
    this.setDataCollocamento();
    this.router.navigateByUrl('/collocamento-mirato/dati-graduatoria');
  }

  /**
   * Sets data collocamento
   */
  private setDataCollocamento() {
    this.commonPslpService.inizializzaProfilo();
    this.commonPslpService.setSapAndIdUtenteStorage(null, null);
    this.commonPslpService.wizard = true;
    this.commonPslpService.readOnlyCM = false;

    this.commonPslpService.tutore = undefined;
    this.commonPslpService.utenteACarico = undefined;

    this.commonPslpService.setUtenteStorage({ id_utente: this.idUtente });
  }

  /**
   * Decreases loading
   */
  async decreaseLoading() {
    this.loading--;
    this.logService.log('[RiepilogoComponent::decreaseLoading]', 'Data to load: ', this.loading);
    if (this.loading === 0) {
      const userMessage = await this.utilitiesService.getMessage('MI028');
      this.messaggioUtente = userMessage;
      this.utilitiesService.hideSpinner();
    }
  }
  /**
 * Determines whether gestione privacy eminori on
 * Permette di andare direttamente alla pagina di gestione privacy
 */
  onGestionePrivacyEMinori() {
    this.router.navigateByUrl('/privacy-landing?param=' + Ambito.COMI);
  }

  /**
   * Determines whether gestione fascicolo on
   * Permette di passare direttamente alla pagina del fascicolo sanitario
   */
  onGestioneFascicolo() {
    this.router.navigateByUrl('/fascicolo-cittadino-landing?param=' + Ambito.COMI);
  }


}
