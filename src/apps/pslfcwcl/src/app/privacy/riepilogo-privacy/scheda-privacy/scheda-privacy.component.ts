import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Privacy, SchedaAnagraficoProfessionale, Utente, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, SessionStorageService, UtilitiesService, LogService, CommonPslpService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { GestioneMinorePrivacyComponent } from '../gestione-minore-privacy/gestione-minore-privacy.component';

export interface LaPrivacy { titolo?: string; valore?: string; }

/**
 * Component gestione
 *  pagina della scheda privacy
 */
@Component({
  selector: 'pslfcwcl-scheda-privacy',
  templateUrl: './scheda-privacy.component.html',
  styleUrls: ['./scheda-privacy.component.css']
})
export class SchedaPrivacyComponent implements OnInit {
  static readonly SCROLL_TARGET = 'em[data-scroll-marker="modificaResponsabilita"]';
  @Input() idUtente: number;
  @Input() ilDestino: string;
  @Input() pulsantiAbilitati: boolean;
  @Input() idTutore: number = null;
  @Input() utenteACarico: UtenteACarico = null;
  @Output() readonly loadedData: EventEmitter<void> = new EventEmitter();
  @Output() readonly sparaSuUtentePerModificareRespo: EventEmitter<UtenteACarico> = new EventEmitter();
  sap: SchedaAnagraficoProfessionale;

  isMinore: boolean;
  eta: number;
  loadingData: boolean;
  allowSposta = false;

  elencoPrivacyUtente: Privacy[];
  elencoPrivacyMinore: Privacy[];
  laPrivacy: LaPrivacy;
  loaded: boolean;
  msgAnnulla: string;
  msgSposta: string;
  utenteSenzaSap: Utente;

  constructor(
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly commonFCService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly appUserService: AppUserService
  ) {
    this.loaded = false;
  }

  async ngOnInit() {
    if (this.loaded === true) {
      return;
    }
    this.loadingData = true;
    try {
      const sap = await this.commonFCService.getSap$(this.idUtente);
      this.sap = sap;
      this.eta = this.commonFCService.age(this.sap);
    } catch (error) {
      this.logService.log("Eccezione ---->" + error);
      const gestioneDateNascitaMinore: { [key: string]: Date } = this.storageService.getItem(GestioneMinorePrivacyComponent.DATA_NASCITA_SESSION_PLACEHOLDER, true);
      const dataNascita = gestioneDateNascitaMinore ? gestioneDateNascitaMinore[this.getCodiceFiscale()] : null;
      if (dataNascita) {
        this.eta = UtilitiesService.calcAge(dataNascita);
      }
      this.utenteSenzaSap = this.appUserService.getUtente();
    }
    this.isMinore = this.eta != null && this.eta < 18;
    this.loadingData = false;
    this.loadedData.emit();
    this.loaded = true;
    if (isNullOrUndefined(this.idTutore)) {
      this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(this.idUtente, true);
    } else {
      this.elencoPrivacyUtente = await this.appUserService.loadPrivacyUtente(this.idTutore, true);
      this.elencoPrivacyMinore = await this.appUserService.loadPrivacyMinore(this.idTutore, this.idUtente, true);
    }
  }

  /**
   * Gets codice fiscale
   * @returns  il codice fiscale dalla sap del tutelato
   */
  private getCodiceFiscale() {
    return this.sap ? this.sap.codice_fiscale : this.utenteACarico && this.utenteACarico.tutelato ? this.utenteACarico.tutelato.codice_fiscale : '';
  }

  async onPrivacy(ambitoPrivacy: string, dettaglioTestoPrivacy: Array<string>, stato: boolean, idUtenteMinorePrivacy: number, etaDelMinore: number) {
    if (etaDelMinore != null && etaDelMinore >= 18) {
        const msg = await this.utilitiesService.getMessage('ME021');
        return this.utilitiesService.showToastrErrorMessage(msg);
    } else {
      this.setDataFascicolo();
      this.commonFCService.setDataPrivacy(ambitoPrivacy, dettaglioTestoPrivacy, idUtenteMinorePrivacy, this.utenteACarico);
      if (stato) {
        // lettura della privacy
        this.router.navigateByUrl('/privacy/dettaglio-privacy');
      } else {
        // presa visione della privacy
        if (!isNullOrUndefined(this.ilDestino)) {
          this.utilitiesService.setParamLand(this.ilDestino);
        }
        this.router.navigateByUrl('/privacy/presentazione-privacy');
      }
    }
  }

  private async setDataFascicolo() {
    this.commonFCService.inizializzaProfilo();

    this.commonFCService.setSapStorage(this.sap);
    this.commonFCService.setObbligoFormativoStorage(this.sap);
    this.commonFCService.azzeraModificheSap();
    this.commonFCService.wizard = true;
    this.commonFCService.readOnly = false;
    if (this.commonFCService.obbligoDomicilioPiemontePerModifica() && !this.utilitiesService.isSapDomicilioPiemonte(this.sap)) {
      this.commonFCService.readOnlyDomicilio = true;
    }
    this.commonFCService.firstPage = "riepilogo-privacy";
    this.commonFCService.setUtenteStorage({ id_utente: this.idUtente });
  }

  isVisualizzabileSAP() {
    return !!this.sap;
  }

  isModificabileSAP() {
    return true;
  }

  onSparaSuUtentePerModificareRespo() {
    this.sparaSuUtentePerModificareRespo.emit(this.utenteACarico);
    this.utilitiesService.scrollTo(SchedaPrivacyComponent.SCROLL_TARGET);
  }

  getDescrStatoPrivacy(privacy: Privacy): string {
    let desc = 'Da confermare';
    if (privacy.stato ) {
      desc = 'Confermata';
    }
    return desc;
  }

}
