import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Privacy, SchedaAnagraficoProfessionale, StampeService, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, SecurityPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { GestioneMinorePrivacyComponent } from '../../../privacy/riepilogo-privacy/gestione-minore-privacy/gestione-minore-privacy.component';

@Component({
  selector: 'pslfcwcl-scheda-fc',
  templateUrl: './scheda-fc.component.html',
  styleUrls: ['./scheda-fc.component.css']
})
export class SchedaFCComponent implements OnInit {
  @Input() idUtente: number;
  @Input() idTutore: number = null;
  @Input() utenteACarico: UtenteACarico = null;
  @Output() loadedData: EventEmitter<void> = new EventEmitter();
  sap: SchedaAnagraficoProfessionale;

  isMinore: boolean;
  eta: number;
  loadingData: boolean;
  privacyNonConfermata: boolean;
  allowSposta = false;

  loaded: boolean;
  msgAnnulla: string;
  msgSposta: string;
  message: string;
  messaggioMaggiorenne: string;
  elencoPrivacyMinore: Privacy[];

  constructor(
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly stampeService: StampeService,
    private readonly commonFCService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly appUserService: AppUserService,
    private readonly pslbasepageService: PslshareService,
    private readonly securityService: SecurityPslpService
  ) {
    this.loaded = false;
  }

  async ngOnInit() {
    this.message = await this.utilitiesService.getMessage('ME133');
    this.messaggioMaggiorenne = await this.utilitiesService.getMessage('ME021');
    this.commonFCService.setAmbitoPrivacy(Ambito.FASC);
    if (this.loaded === true) {
      return;
    }
    this.loadingData = true;
    try {
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
      }
    } catch (e) {
      const gestioneDateNascitaMinore: { [key: string]: Date } = this.storageService.getItem(GestioneMinorePrivacyComponent.DATA_NASCITA_SESSION_PLACEHOLDER, true);
      const dataNascita = gestioneDateNascitaMinore ? gestioneDateNascitaMinore[this.getCodiceFiscale()] : null;
      if (dataNascita) {
        this.eta = UtilitiesService.calcAge(dataNascita);
      }
    }
    this.isMinore = this.eta != null && this.eta < 18;
    this.loadingData = false;
    this.loadedData.emit();
    this.loaded = true;
    this.privacyNonConfermata = await this.isPrivacyNonConfermata();

  }

  /**
   * Gets codice fiscale
   * @returns boolean
   */
  private getCodiceFiscale() {
    return this.sap ? this.sap.codice_fiscale : this.utenteACarico && this.utenteACarico.tutelato ? this.utenteACarico.tutelato.codice_fiscale : '';
  }

  /**
   * Determines whether print on
   */
  async onPrint() {
    this.utilitiesService.showSpinner();
    try {
      const response = await this.stampeService.creaStampaSap(this.idUtente).toPromise();
      this.utilitiesService.downloadFile(response, 'application/pdf', 'FascicoloCittadino.pdf');
    } finally {
      this.utilitiesService.hideSpinner();
    }

  }

  /**
   * Determines whether print did on
   */
  async onPrintDID() {
    this.utilitiesService.showSpinner();
    /** Da collegare il servizio di stampa DID
    */
    // try {
    //   const response = await this.stampeService.creaStampaSap(this.idUtente).toPromise();
    //   this.utilitiesService.downloadFile(response, 'application/pdf', 'FascicoloCittadino.pdf');
    // } finally {
    //   this.utilitiesService.hideSpinner();
    // }

  }

  /**
   * Determines whether modifica on
   */
  async onModifica() {
    if (this.utenteACarico && !this.isMinore) {
      this.utilitiesService.showToastrErrorMessage(this.messaggioMaggiorenne, this.utilitiesService.getDescrAmbito(Ambito.FASC));
    } else {
      //  modificato controllo sulla privacy per via dell'elenco delle privacy che ha associate il minore
      if (!isNullOrUndefined(this.utenteACarico)) {
        if ( this.privacyNonConfermata ) {
          // 'per poter operare sul minore occorre prendere visione dell\'informativa sulla responsabilita\' genitoriale, in gestione minori';
          this.utilitiesService.hideSpinner();
          const msg = (await this.utilitiesService.getMessage('ME133')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));
          this.openModal(msg);
        } else {
          this.setDataFascicolo();
          this.router.navigateByUrl('/fascicolo-cittadino/dati-anagrafici');
        }
      } else {
        this.setDataFascicolo();
        this.router.navigateByUrl('/fascicolo-cittadino/dati-anagrafici');
      }
    }
  }
  /**
   * Determines whether privacy on
   */
  onPrivacy() {
    this.setDataFascicolo();
    this.router.navigateByUrl('/fascicolo-cittadino/dettaglio-privacy');
  }

  /**
   * Determines whether privacy non confermata is
   * @returns boolean
   */
  async isPrivacyNonConfermata() {
    if (!isNullOrUndefined(this.utenteACarico)) {
      this.elencoPrivacyMinore = await this.appUserService.loadPrivacyMinore(this.idTutore, this.utenteACarico.tutelato.id_utente);
      const laPrivacyDelMinoreDellAmbito = this.elencoPrivacyMinore.find(el => el.cod_ambito === this.commonFCService.AMBITO);
      if (isNullOrUndefined(laPrivacyDelMinoreDellAmbito) || !laPrivacyDelMinoreDellAmbito.stato) {
        return true;
      }
    }
    return false;
  }

  /**
   * Sets data fascicolo
   */
  private async setDataFascicolo() {
    this.commonFCService.inizializzaProfilo();

    this.commonFCService.setSapStorage(this.sap);
    this.commonFCService.setObbligoFormativoStorage(this.sap);
    this.commonFCService.azzeraModificheSap();
    this.commonFCService.wizard = true;
    this.commonFCService.readOnly = false;
    if (this.commonFCService.obbligoDomicilioPiemontePerModifica() &&
      !this.utilitiesService.isSapDomicilioPiemonte(this.sap)) {
      this.commonFCService.readOnlyDomicilio = true;
    }

    this.commonFCService.firstPage = "riepilogo";
    this.commonFCService.setUtenteStorage({ id_utente: this.idUtente });
  }

  /**
   * Determines whether visualizzabile sap is
   * @returns boolean
   */
  isVisualizzabileSAP() {
    return !!this.sap;
  }

  /**
   * Determines whether modificabile sap is
   * @returns always true boolean
   */
  isModificabileSAP() {
    return true;
  }

  /**
   * Determines whether nuova sap on
   */
  async onNuovaSap() {
    if (!isNullOrUndefined(this.utenteACarico) && !this.commonFCService.getPrivacyMinore(this.utenteACarico)) {
      // 'per poter operare sul minore occorre prendere visione dell\'informativa sulla responsabilita\' genitoriale, in gestione minori';
      const msg = (this.message).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.FASC));
      this.openModal(msg);
    } else {
      if (isNullOrUndefined(this.utenteACarico.tipo_responsabilita)) {
        this.commonFCService.setTipoResponsabilita(null);
      } else {
        this.commonFCService.setTipoResponsabilita(this.utenteACarico.tipo_responsabilita);
      }
      this.setDataFascicolo();
      this.router.navigateByUrl('/fascicolo-cittadino/registrazione-dati-anagrafici');
    }
  }

  /**
   * Opens modal
   * @param msg string
   */
  async openModal(msg: string) {
    const data: DialogModaleMessage = {
      titolo: 'Privacy',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.FASC, TypeApplicationCard.Fascicolo);
    }
  }


}
