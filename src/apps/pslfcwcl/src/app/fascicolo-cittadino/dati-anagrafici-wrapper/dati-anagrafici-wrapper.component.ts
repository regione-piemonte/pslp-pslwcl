import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CentroPerImpiego, EsitoRiepilogoCollocamentoMirato, RichiestaIscrizioneL68Header, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';       // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, NavigationEmitter, SezioniSAP, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';

declare const $: any;

@Component({
  selector: 'pslfcwcl-dati-anagrafici-fascicolo-wrapper',
  templateUrl: './dati-anagrafici-wrapper.component.html',
})

export class DatiAnagraficiWrapperComponent implements OnInit, OnDestroy {

  readOnly: boolean;
  dataChanged = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  prevButtonName: string;
  private readonly subscriptions: Subscription[] = [];
  private messaggioErroreProvincia: string;
  messaggioErroreDati: string;
  titoloPagina = 'Dati Anagrafici';
  urlUscita: string;

  provinciaDomicilioOriginal: string;
  msgCambioDomicilio: string;
  msgME169: string;
  msgME170: string;
  riepilogoCOMI:  EsitoRiepilogoCollocamentoMirato;
  cpiResidenza:  CentroPerImpiego;
  cpiDomicilio:  CentroPerImpiego;

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly appUserService: AppUserService,
    private readonly route: ActivatedRoute,
  ) { }

  async ngOnInit() {
    this.subscriptions.push(
      this.route.data.subscribe(data => this.sap = data.sap)
    );

    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    const idUtente = this.appUserService.getIdUtente();
    this.readOnly = this.commonPslpService.readOnly;
    const [messaggioErroreProvincia, messaggioErroreDati, msgCambioDomicilio, msgME169, msgME170, riepilogoCOMI] = await Promise.all([
      this.utilitiesService.getMessage('ME039'),
      this.utilitiesService.getMessage('ME091'),
      this.utilitiesService.getMessage('ME085'),
      this.utilitiesService.getMessage('ME169'),
      this.utilitiesService.getMessage('ME170'),
      this.commonPslpService.getCollocamentoMirato( idUtente)
    ]);

    this.riepilogoCOMI = riepilogoCOMI;
    this.messaggioErroreProvincia = messaggioErroreProvincia;
    this.messaggioErroreDati = messaggioErroreDati;
    this.msgCambioDomicilio = msgCambioDomicilio;
    this.msgME169 = msgME169;
    this.msgME170 = msgME170;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Determines whether sap change on
   *
   */
  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
    if (this.commonPslpService.erroreObbligoPiemonte(this.sap.domicilio)) {
      this.utilitiesService.showToastrErrorMessage(this.messaggioErroreProvincia, 'dati anagrafici');
    } else if (this.commonPslpService.obbligoDomicilioPiemontePerModifica() && isNullOrUndefined(this.provinciaDomicilioOriginal)) {
      this.provinciaDomicilioOriginal = this.sap.domicilio.comune.provincia.descrizione ? this.sap.domicilio.comune.provincia.descrizione.toUpperCase() : '';
    }
  }

  /**
   * Determines whether data change on
   *
   */
  onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'CONFERMA & PROSEGUI';
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
   *
   */
  async onExitPage(nav: NavigationEmitter) {
    try {

      if (this.isIndietroOrUscita(nav)) {
        this.urlUscita = nav.url;
        this.openModal();

      } else {
        if (this.isProseguiOrSalva(nav)) {
            if (this.commonPslpService.erroreObbligoPiemonte(this.sap.domicilio)) {
              return this.utilitiesService.showToastrErrorMessage(this.messaggioErroreProvincia, 'dati anagrafici');
            } else {
              await this.setCPIDomicilioeResidenza();
              if (this.controlliDomicilioCollocamentoMirato()) {
              // si è verificata una incongruenza rispetto all'ultima richiesta inviata
                 let msg = this.msgME170;
                 msg = msg.replace('{1}', this.getDescrCPIRichiestaInviata());
                 msg = msg.replace('{0}', this.cpiDomicilio.descrizione);
                 return await this.openModalConferma(msg);
              } else if (this.controlliResidenzaCollocamentoMirato()) {
              // si è verificata una incongruenza rispetto all'ultima richiesta inviata
                 let msg = this.msgME169;
                 msg = msg.replace('{1}', this.getDescrCPIRichiestaInviata());
                 msg = msg.replace('{0}', this.cpiResidenza.descrizione);
                 return await this.openModalConferma(msg);

              } else {
                this.checkCoerenzaProvincia();
                this.utilitiesService.showSpinner();
                this.commonPslpService.setSapStorage(this.sap);
                this.commonPslpService.setSapSezioniUpdate(SezioniSAP.DATI_ANAGRAFICI);
                this.commonPslpService.backupStorageFascicolo();
                this.utilitiesService.hideSpinner();
              }
            }
        }
        this.router.navigateByUrl(nav.url);
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, this.titoloPagina);
    }
  }

  private async setCPIDomicilioeResidenza() {
    if (!isNullOrUndefined(this.sap.residenza.comune.codice_ministeriale)) {
      this.cpiResidenza = await this.utilitiesService.getCpiDelComune(this.sap.residenza.comune.codice_ministeriale);
    }
    if (!isNullOrUndefined(this.sap.domicilio.comune.codice_ministeriale)) {
      this.cpiDomicilio = await this.utilitiesService.getCpiDelComune(this.sap.domicilio.comune.codice_ministeriale);
    }
  }

  /**
   * controlla la provincia della residenza in base a eventuale richiesta collocamento mirato
   * @returns true se residenza non modificabile
   *
   *  verifica su Ultima Richiesta con CpI Richiesta in Stato Inviata e con Tipo Comunicazione = P
   *
   *
   */
  private controlliResidenzaCollocamentoMirato():  boolean {


    if (!this.isPresenteRichiestaStatoInviata()) {
      return false;
    }
    if (this.getTipoComunicazioneRichiestaInviata() !== "P") {
      return false;
    }

    const descrCPI = this.getDescrCPIRichiestaInviata();

    if (this.cpiResidenza.descrizione !== descrCPI) {
      return true;
    }

    return false;
  }

  /**
   * controlla la provincia del domicilio in base a eventuale richiesta collocamento mirato
   * @returns true se domicilio non modificabile
   *
   * verifica Ultima Richiesta con CpI Richiesta in Stato Inviata
   * e con Tipo Comunicazione = I (Iscrizione Successiva) o T (Trasferimento),
   *
   */
  private  controlliDomicilioCollocamentoMirato(): boolean  {
    if (!this.isPresenteRichiestaStatoInviata()) {
      return false;
    }
    if (this.getTipoComunicazioneRichiestaInviata() === "I"
     || this.getTipoComunicazioneRichiestaInviata() === "T" ) {
      const descrCPI = this.getDescrCPIRichiestaInviata();

      if (this.cpiDomicilio.descrizione !== descrCPI) {
        return true;
      }
    }
    return false;
  }


  /**
   * controlla la presenza di richieste in stato inviata
   * @returns true   presente richiesta stato inviata
   */

  private isPresenteRichiestaStatoInviata(): boolean {
     if (this.nonPresenteElencoRichieste()) {
         return false;
     }
     let res = false;
     this.riepilogoCOMI.elencoRichieste.forEach((el: RichiestaIscrizioneL68Header) => {
      if (  el.cod_stato_richiesta === 'I' ) { res = true; }
     });
     return res;
  }

  private getTipoComunicazioneRichiestaInviata(): string {
    let res = "";
    if (this.nonPresenteElencoRichieste()) {
      return res;
    }

     this.riepilogoCOMI.elencoRichieste.forEach((el: RichiestaIscrizioneL68Header) => {
      if (  el.cod_stato_richiesta === 'I' ) { res = el.descr_tipo_comunicazione ? el.descr_tipo_comunicazione.substr(0, 1) : ""; }
     });

     return res;
  }

  private getDescrProvinciaRichiestaInviata(): string {
    let res = "";
    if (this.nonPresenteElencoRichieste()) {
         return res;
     }

     this.riepilogoCOMI.elencoRichieste.forEach((el: RichiestaIscrizioneL68Header) => {
      if (  el.cod_stato_richiesta === 'I' ) { res = el.descr_provincia ? el.descr_provincia.substr(0, 1) : ""; }
     });

     return res;
  }

  private nonPresenteElencoRichieste() {
    return isNullOrUndefined(this.riepilogoCOMI) || isNullOrUndefined(this.riepilogoCOMI.elencoRichieste)
      || this.riepilogoCOMI.elencoRichieste.length === 0;
  }

  private getDescrCPIRichiestaInviata(): string {
    let res = "";
    if (this.nonPresenteElencoRichieste()) {
         return res;
     }

     this.riepilogoCOMI.elencoRichieste.forEach((el: RichiestaIscrizioneL68Header) => {
      if (  el.cod_stato_richiesta === 'I' ) { res = el.descr_cpi ? el.descr_cpi : ""; }
     });

     return res;
  }

  /**
   * Determines whether prosegui or salva is
   * @param nav NavigationEmitter
   * @returns boolean
   */
  private isProseguiOrSalva(nav: NavigationEmitter) {
    return (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save)
      && this.dataChanged;
  }

  /**
   * Determines whether indietro or uscita is
   * @param nav NavigationEmitter
   * @returns boolean
   */
  private isIndietroOrUscita(nav: NavigationEmitter) {
    return ((nav.exit === TypeExit.Back || nav.exit === TypeExit.Prev)
      && (this.dataChanged || this.commonPslpService.isSapModificata()))
      || (nav.exit === TypeExit.Wizard && this.dataChanged);
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
      this.commonPslpService.restoreStorageFascicolo();
    } else {
      this.commonPslpService.azzeraStorageFascicolo();
    }
    this.router.navigateByUrl(this.urlUscita);
  }

  /**
   * Checks coerenza provincia
   */
  private checkCoerenzaProvincia() {
    if (this.commonPslpService.obbligoDomicilioPiemontePerModifica()) {
      if (!this.utilitiesService.isProvinciaInPiemonte(this.sap.domicilio)) {
        const provincia = this.sap.domicilio.comune.provincia.descrizione ? this.sap.domicilio.comune.provincia.descrizione.toUpperCase() : '';
        if (this.provinciaDomicilioOriginal !== provincia) {
          this.utilitiesService.showToastrInfoMessage(this.msgCambioDomicilio);
        }
        this.commonPslpService.readOnlyDomicilio = true;
      } else {
        this.commonPslpService.readOnlyDomicilio = false;
      }
    }
  }

  /**
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {
    return !this.flagChanging
      && this.sap
      && (this.sap.recapito && this.sap.recapito.email)
      && (this.commonPslpService.wizard || this.dataChanged)
      && this.controlliDomicilio() && this.controlliResidenza();
  }

  /**
   * Controllis domicilio
   * @returns boolean
   */
  private controlliDomicilio() {
    let flagControlliDomicilio = false;
    if (!isNullOrUndefined(this.sap)) {
      if (!isNullOrUndefined(this.sap.domicilio) && !isNullOrUndefined(this.sap.domicilio.comune)) {
        if (!isNullOrUndefined(this.sap.domicilio.comune.provincia) && !isNullOrUndefined(this.sap.domicilio.comune.provincia.codice_ministeriale)) {
          flagControlliDomicilio = true;
        } else {
          if (!isNullOrUndefined(this.sap.domicilio.stato) && !isNullOrUndefined(this.sap.domicilio.stato.codice_ministeriale)) {
            flagControlliDomicilio = true;
          }
        }
      }
    }
    return flagControlliDomicilio;
  }

  /**
   * Controllis residenza
   * @returns boolean
   */
  private controlliResidenza() {
    let flagControlliResidenza = false;
    if (!isNullOrUndefined(this.sap)) {
      if (!isNullOrUndefined(this.sap.residenza) && !isNullOrUndefined(this.sap.residenza.comune)) {
        if (!isNullOrUndefined(this.sap.residenza.comune.provincia) && !isNullOrUndefined(this.sap.residenza.comune.provincia.codice_ministeriale)) {
          flagControlliResidenza = true;
        } else {
          if (!isNullOrUndefined(this.sap.residenza.stato) && !isNullOrUndefined(this.sap.residenza.stato.codice_ministeriale)) {
            flagControlliResidenza = true;
          }
        }
      }
    }
    return flagControlliResidenza;
  }


  async openModalConferma(msg: string) {
    const data: DialogModaleMessage = {
      titolo:   this.titoloPagina,
      messaggio: msg,
      messaggioAggiuntivo: "",
      tipo: TypeDialogMessage.Confirm
    };
    const result = await this.pslbasepageService.richiestaFinestraModale(data);

  }

}
