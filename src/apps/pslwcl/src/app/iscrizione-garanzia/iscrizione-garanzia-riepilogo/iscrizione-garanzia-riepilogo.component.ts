import { Component, OnInit, ViewChild } from '@angular/core';
import { Params, Router } from '@angular/router';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { EsitoRiepilogoIscrizione } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, TypeApplicationCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, SecurityPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-iscrizione-garanzia-riepilogo',
  templateUrl: './iscrizione-garanzia-riepilogo.component.html'
})
export class IscrizioneGaranziaRiepilogoComponent implements OnInit {
  idUtente: number;
  idSilLav: number;
  codFiscOperatore: string;
  loading: number;
  loaded = false;
  riepilogo: EsitoRiepilogoIscrizione;
  hasMinori = false;
  idactive = "";
  msgEtaNonCoerente = "";
  messaggioBenvenuto: string;
  hasUtente: boolean;
  @ViewChild('accordionMinori', { static: false }) accordionMinori: NgbAccordion;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly securityService: SecurityPslpService,
    private readonly commonPslpService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService,

  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();

      const userMessage = await this.utilitiesService.getMessage('MI035');
      this.messaggioBenvenuto = userMessage;

    this.storageService.setItem(SessionStorageService.HAS_RIEPILOGO, true);
    this.idUtente = this.appUserService.getIdUtente();
    this.idSilLav = this.appUserService.getUtente().id_sil_lav_anagrafica;
    this.codFiscOperatore = this.appUserService.getUtente().codice_fiscale;
    let riepilogo: EsitoRiepilogoIscrizione = null;
    try {
       riepilogo = await this.appUserService.getRiepilogoIscrizione(this.idUtente);
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
    this.riepilogo = riepilogo;
    this.msgEtaNonCoerente = this.riepilogo.messaggio_eta_non_coerente;
    this.hasMinori = false;

    if (!isNullOrUndefined(this.riepilogo.tutelati) &&
     this.riepilogo.tutelati.length > 0) {
      this.loading = this.riepilogo.tutelati.length + 1;
        this.hasMinori = true;
        if (this.riepilogo.tutelati.length === 1) {
          this.idactive = "minore-0";
        }
    } else {
      this.loading = 1;
    }


    this.logService.log("operare solo minori " + this.commonPslpService.operareSoloMinori);
    const sap = this.riepilogo.utente_tutore.dati.sap;
    const utente = this.riepilogo.utente_tutore;
    this.logService.log("getSap " + sap);

    if (!isNullOrUndefined(sap)) {
      this.commonPslpService.setSapAndIdUtenteStorage(sap, this.idUtente);
    } else {
      this.commonPslpService.setSapAndIdUtenteStorage(null, null);
    }

    this.hasUtente = !!utente;
    if (this.hasUtente) {
      this.decreaseLoading();
    }
  }

  /**
   * Determines whether gestione privacy eminori on
   */
  onGestionePrivacyEMinori() {
    this.setDataIscrizione();
    this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.ISCR, TypeApplicationCard.Fascicolo);
  }

  /**
   * Determines whether gestione fascicolo on
   */
  onGestioneFascicolo() {
    this.setDataIscrizione();
    this.securityService.jumpToURL('/fascicolo-cittadino-landing?param=' + Ambito.ISCR, TypeApplicationCard.Fascicolo);
  }

  /**
   * Determines whether gestione appuntamento on
   */
  onGestioneAppuntamento() {
    this.setDataIscrizione();
    this.router.navigateByUrl('/garanzia-giovani');
  }

  /**
   * Determines whether possibile gestione appuntamento is
   * @returns boolean
   */
  isPossibileGestioneAppuntamento(): boolean {
    let result = false;
    if (this.riepilogo.utente_tutore.dati.possibileAppuntamento) {
      result = true;
    } else {
      if (!isNullOrUndefined(this.riepilogo.tutelati) && this.riepilogo.tutelati.length > 0 ) {
          for (let index = 0; index < this.riepilogo.tutelati.length; index++) {
            const utenteRiep = this.riepilogo.tutelati[index];
            if (utenteRiep.dati.possibileAppuntamento)  {
              result = true;
            }
          }
      }
    }
    return result;
  }

  /**
   * Sets data iscrizione
   */
  private setDataIscrizione() {
    this.commonPslpService.inizializzaSoft();

    this.commonPslpService.wizard = true;
    this.commonPslpService.readOnly = false;

    this.commonPslpService.tutore = undefined;
    this.commonPslpService.utenteACarico = undefined;

    this.commonPslpService.setUtenteStorage({ id_utente: this.idUtente });
  }

  /**
   * Decreases loading
   */
  decreaseLoading() {
    this.loading--;
    if (this.loading <= 1) {
      this.loaded = true;
      this.utilitiesService.hideSpinner();
    }
  }


}
