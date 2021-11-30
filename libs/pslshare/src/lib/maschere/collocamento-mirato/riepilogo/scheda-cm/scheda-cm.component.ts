import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { EsitoRiepilogoCollocamentoMirato, IscrizioneCollocamentoMirato, RichiestaIscrizioneL68Header, SchedaAnagraficoProfessionale, StampeService, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { TypeDialogMessage } from '@pslwcl/pslmodel';
import { AppUserService, CommonPslpService, ParametriSistemaService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { PslshareService } from '../../../../pslshare.service';


const GESTIONE_COLLOCAMENTO_MIRATO = "Gestione collocamento mirato";

@Component({
  selector: 'pslshare-scheda-cm',
  templateUrl: './scheda-cm.component.html',
  styleUrls: ['./scheda-cm.component.css']
})
export class SchedaCMComponent implements OnInit {
  @Input() idUtente: number;
  @Input() idTutore: number = null;
  @Input() utenteACarico: UtenteACarico = null;
  @Output() loadedData: EventEmitter<void> = new EventEmitter();
  sap: SchedaAnagraficoProfessionale;

  isMinore: boolean;
  eta: number;
  loadingData: boolean;
  allowSposta = false;
  msgIdentificativoLavoratore = "";
  isIscritto: boolean;
  elencoRichieste: RichiestaIscrizioneL68Header[];
  MI057: string;
  MI058: string;
  msgInfoRichieste: string;
  titoloPagina = 'Richiesta per il Collocamento Mirato';
  isCoMiRichiestaEnabled: boolean;
  isOperatore = false;


  loaded: boolean;
  msgAnnulla: string;
  msgSposta: string;
  private isModificabileSAPValue: boolean;
  riepilogoCOMI: EsitoRiepilogoCollocamentoMirato;
  ME002: string;

  constructor(
    private readonly router: Router,
    private readonly stampeService: StampeService,
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslshareService: PslshareService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly sanitizer: DomSanitizer,
    private readonly appUserService: AppUserService
  ) {
    this.loaded = false;
  }

  async ngOnInit() {

    const [msgIdentificativoLavoratore, MI057, MI058, ME002] =
      await Promise.all([
        this.utilitiesService.getMessage('HC042'),
        this.utilitiesService.getMessage('MI057'),
        this.utilitiesService.getMessage('MI058'),
        this.utilitiesService.getMessage('ME002')
      ]);
    this.msgIdentificativoLavoratore = msgIdentificativoLavoratore;
    this.MI057 = MI057;
    this.MI058 = MI058;
    this.ME002 = ME002;

    if (this.loaded === true) {
      return;
    }
    this.loadingData = true;
    try {
      const sap = await this.commonPslpService.getSap$(this.idUtente);
      this.sap = sap;

      const riepilogoCOMI = await this.commonPslpService.getCollocamentoMirato(this.idUtente);

      this.riepilogoCOMI = riepilogoCOMI;
      this.isIscritto = this.commonPslpService.isIscritto(riepilogoCOMI);
      this.elencoRichieste = this.riepilogoCOMI.elencoRichieste;
      if (this.elencoRichieste[0].cod_stato_richiesta === 'B') { this.msgInfoRichieste = this.MI057; }
      if (this.elencoRichieste[0].cod_stato_richiesta === 'I') { this.msgInfoRichieste = this.MI058; }
      this.isModificabileSAPValue = (this.getIscrizioneAltreCategorieStatoFinale(riepilogoCOMI) === "ATTIVA" || this.getIscrizioneDisabiliStatoFinale(riepilogoCOMI) === "ATTIVA");

      /* questo controllo va effettuato sul visualizza
      if (!this.isModificabileSAPValue && this.isIscritto) {
        this.utilitiesService.showToastrInfoMessage(await this.utilitiesService.getMessage('ME128'), GESTIONE_COLLOCAMENTO_MIRATO);
      } */
    } catch (e) {
      // Ignore error!

    }
    this.isCoMiRichiestaEnabled =await  this.parametriSistemaService.isCoMiRichiestaEnabled;

    this.isMinore = this.eta != null && this.eta < 18;
    this.loadingData = false;
    this.loadedData.emit();
    this.loaded = true;

    const operatore = this.appUserService.getOperatore();
    if (!isNullOrUndefined(operatore)) {
      this.isOperatore = true;
    }

  }

  /**
   * Determines whether print on
   */
  async onPrintIscrizioneL68() {
    this.utilitiesService.showSpinner();
    try {
      const response = await this.stampeService.creaStampaIscrizioneCollocamentoMirato(this.idUtente).pipe(
        catchError(err => {
          return throwError(err);
        })
      ).toPromise();
      this.utilitiesService.downloadFileDaStampa(response, 'application/pdf', 'Iscrizione_L68_'+  this.sap.codice_fiscale+'.pdf');
      this.pslshareService.apriModale("La stampa e' stata completata ed e' stata scaricata.", "", this.titoloPagina, TypeDialogMessage.Confirm);
    } catch (err) {
      const msg = this.ME002;
      // this.sanitizer.bypassSecurityTrustHtml(msg);
      // this.utilitiesService.showToastrErrorMessageEnableHtml(msg, "Richiesta di iscrizione");
      this.utilitiesService.showToastrInfoMessageEnableHtml(msg, "Richiesta di iscrizione");
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

  }

  /**
   * Determina e permette la modifica/visualizzazione dell'iscrizione al collocamento mirato
   */
  onVisualizzaModifica() {
    this.setData();

    this.router.navigateByUrl('/collocamento-mirato/dati-graduatoria');
  }

  /**
   * Determina e permette la sola visualizzazione dell'iscrizione al collocamento mirato
   */
   onVisualizza() {
    this.setData();

    this.router.navigateByUrl('/collocamento-mirato/dati-graduatoria');
  }


  /**
   * Sets data
   */
  private async setData() {
    this.commonPslpService.inizializzaProfilo();
    this.commonPslpService.setSapAndIdUtenteStorage(this.sap, this.idUtente);
    this.commonPslpService.wizard = true;
    this.commonPslpService.readOnlyCM = false;
    if (this.commonPslpService.obbligoDomicilioPiemontePerModifica() &&
      !this.utilitiesService.isSapDomicilioPiemonte(this.sap)) {
      this.commonPslpService.readOnlyDomicilio = true;
    }

    this.commonPslpService.firstPage = "riepilogo";
    this.commonPslpService.setUtenteStorage({ id_utente: this.idUtente });
  }

  /**
   * Determinse la sap è visualizzabile
   * @returns boolean
   */
  isVisualizzabileSAP() {
    return !!this.sap;
  }

  /**
   * Determines whether modificabile sap is
   * @returns boolean
   */
  isModificabileSAP() {
    return this.isModificabileSAPValue;
  }

  /**
   * Determina se permettere di effettuare una richiesta di iscrizione
   */
  async onRichiestaIscrizione() {
    if (!this.sap.recapito || !this.sap.recapito.email || this.sap.recapito.email.length === 0) {
      if (this.isOperatore) {
        const msgOp = await this.utilitiesService.getMessage('ME176');
        this.pslshareService.apriModale('', msgOp, this.titoloPagina, TypeDialogMessage.Confirm);
      } else {
        const msg = await this.utilitiesService.getMessage('ME156');
        this.pslshareService.apriModale('', msg, this.titoloPagina, TypeDialogMessage.YesOrNo).then(res => {
          if (res === 'SI') {
            this.goToFascicolo();
          }
        });
      }
    } else {
      this.setData();
      this.commonPslpService.wizardDisabile = true;
      this.router.navigateByUrl('/collocamento-mirato/cittadino');
    }
  }

  /**
   * Sets iscrizione disabili stato finale
   * @param riepilogoCOMI EsitoRiepilogoCollocamentoMirato
   */
  private getIscrizioneDisabiliStatoFinale(riepilogoCOMI: EsitoRiepilogoCollocamentoMirato) {
    return this.getStatoIscrizione(riepilogoCOMI.iscrizioneDisabili);
  }

  private getIscrizioneAltreCategorieStatoFinale(riepilogoCOMI: EsitoRiepilogoCollocamentoMirato) {
    return this.getStatoIscrizione(riepilogoCOMI.iscrizioneAltreCategorie);
  }

  private getStatoIscrizione(iscr: IscrizioneCollocamentoMirato): string {
    let stato = "";
    if (!isNullOrUndefined(iscr)) {
      if (iscr.statoFinale) {
        stato = "CHIUSA";
      } else {
        stato = "ATTIVA";
      }
    }
    return stato;
  }

  puoInserire(): boolean {
      if (!this.hasIscrizioneAttiva() && !this.hasRichiestePendenti()) {
        return true;
      }
      return false;
  }

  puoModificare(): boolean {
    if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneDisabili) || !isNullOrUndefined(this.riepilogoCOMI.iscrizioneAltreCategorie)) { // deve esister un iscrizione
        if (  this.hasIscrizioneAttiva())   {
          return true;
        }
    }
    return false;
  }

  puoSoloVisualizzare(): boolean {
    if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneDisabili) || !isNullOrUndefined(this.riepilogoCOMI.iscrizioneAltreCategorie)) { // deve esister un iscrizione
        if ( !this.hasIscrizioneAttiva())   {
          return true;
        }
    }
    return false;
  }

  puoRichiedereTrasferimento(): boolean {
    if (!this.hasRichiestePendenti() && this.hasIscrizioneAttiva()) {
      return true;
    }

    return false;
  }

  hasIscrizioneAttiva(): boolean {
    return (this.riepilogoCOMI.iscrizioneDisabili && !this.riepilogoCOMI.iscrizioneDisabili.statoFinale) ||
      (this.riepilogoCOMI.iscrizioneAltreCategorie && !this.riepilogoCOMI.iscrizioneAltreCategorie.statoFinale);
  }

  hasIscrizioneAttivaStatoIscritto(): boolean {
    if (this.hasIscrizioneAttiva()) {
      if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneDisabili) && this.riepilogoCOMI.iscrizioneDisabili.stato.codice_ministeriale === 'I') {
        return true;
      }
      if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneAltreCategorie) && this.riepilogoCOMI.iscrizioneAltreCategorie.stato.codice_ministeriale === 'I') {
        return true;
      }
    }
    return false;
  }

  hasRichiestePendenti(): boolean {
    let res = false;
    if (this.elencoRichieste && this.elencoRichieste.length > 0) {
      this.elencoRichieste.forEach((el: RichiestaIscrizioneL68Header) => {
        // if (!(el.cod_stato_richiesta === 'A' || el.cod_stato_richiesta === 'R')) { res = true; }
        if (el.cod_stato_richiesta === 'B' || el.cod_stato_richiesta === 'I') {
           res = true;
        }
      });
    }

    return res;
  }

  goToFascicolo() {
    this.router.navigateByUrl('/fascicolo-cittadino/riepilogo');
  }
}
