import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CentroPerImpiego, DettaglioRichiestaIscrizioneL68, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { NavigationEmitter, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel';
import { AppUserService, CommonPslpService, UtilitiesService } from '@pslwcl/pslservice';
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';
import { PslshareService } from '../../../../pslshare.service';



@Component({
  selector: 'pslshare-lavoratore-wrapper',
  templateUrl: './lavoratore-wrapper.component.html',
})

export class LavoratoreWrapperComponent implements OnInit, OnDestroy {

  titoloPagina = 'Riepilogo lavoratore';

  readOnly: boolean;
  dataChanged = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  private readonly subscriptions: Subscription[] = [];
  messaggioUtente: string;
  messaggioErroreDati: string;
  // titoloPagina = 'Dati Anagrafici';
  urlUscita: string;
  prevButtonName = 'INDIETRO';
  idUtente: number;
  isIscritto: boolean;
  descCpiRes: string;
  descCpiDom: string;
  richiestaIscrizioneCm: DettaglioRichiestaIscrizioneL68;
  bloccoCpiDomNonDisponibile = false;
  bloccoCpiResNonDisponibile = false;

  provinciaDomicilioOriginal: string;
  msgCambioDomicilio: string;
  private messaggioErroreProvincia: string;
  msg174: string;
  isOperatore = false;
  msg180: string;
  msg172: string;


  constructor(
    private readonly pslshareService: PslshareService,
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly route: ActivatedRoute,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService,

  ) { }

  async ngOnInit() {
    this.commonPslpService.readOnlyDomicilio = true;
    this.subscriptions.push(
      this.route.data.subscribe(data => this.sap = data.sap)
    );
    const operatore = this.appUserService.getOperatore();
    if (!isNullOrUndefined(operatore)) {
      this.isOperatore = true;
    }

    this.idUtente = this.appUserService.getIdUtente();
    // riepilogo dati delle iscrizioni
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    this.commonPslpService.readOnly = true;
    this.readOnly = true;
    const [messaggioErroreProvincia, messaggioErroreDati, msgCambioDomicilio, messaggioUtente, msg174, msg180, msg172, sap, richiesta] = await Promise.all([
      this.utilitiesService.getMessage('ME039'),
      this.utilitiesService.getMessage('ME091'),
      this.utilitiesService.getMessage('ME085'),
      this.utilitiesService.getMessage('HC070'),
        this.utilitiesService.getMessage('ME174'),
        this.utilitiesService.getMessage('ME180'),
        this.utilitiesService.getMessage('ME172'),
      this.commonPslpService.getSap$(),
      this.commonPslpService.getDettaglioIscrizioneL68$()
    ]);
    this.messaggioErroreProvincia = messaggioErroreProvincia;
    this.messaggioErroreDati = messaggioErroreDati;
    this.msgCambioDomicilio = msgCambioDomicilio;
    this.messaggioUtente = messaggioUtente;
    this.sap =  sap;
    this.richiestaIscrizioneCm = richiesta;
    this.msg172 = msg172;
    this.msg174 = msg174;
    this.msg180 = msg180;

    if (!this.richiestaIscrizioneCm) {
      this.richiestaIscrizioneCm = {} as DettaglioRichiestaIscrizioneL68;
    }

    /** Viene recuperato il corrispondente Cpi del comune  */
    this.recuperoCpiDalComuneDiResEDom();


  }

  private async recuperoCpiDalComuneDiResEDom() {
    let ilCentroDom: CentroPerImpiego = {};
    let ilCentroRes: CentroPerImpiego = {};
    if (!isNullOrUndefined(this.sap.domicilio.comune.codice_ministeriale)) {
      ilCentroDom = await this.utilitiesService.getCpiDelComune(this.sap.domicilio.comune.codice_ministeriale);
    }
    if (!isNullOrUndefined(this.sap.residenza.comune.codice_ministeriale)) {
      ilCentroRes = await this.utilitiesService.getCpiDelComune(this.sap.residenza.comune.codice_ministeriale);
    }
    if (!isNullOrUndefined(ilCentroDom.descrizione)) {
      this.descCpiDom = ilCentroDom.descrizione;
    } else {
      this.descCpiDom = 'Dato non disponibile';
      this.bloccoCpiDomNonDisponibile = true;
    }
    if (!isNullOrUndefined(ilCentroRes.descrizione)) {
      this.descCpiRes = ilCentroRes.descrizione;
    } else {
      this.descCpiRes = 'Dato non disponibile';
      this.bloccoCpiResNonDisponibile = true;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  isValidData(): boolean {
    return  !this.flagChanging
      && this.sap
      && (this.commonPslpService.wizard || this.dataChanged);
  }
 /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   *
   */
  async onExitPage(nav: NavigationEmitter) {
    if (this.isAvantiOrSalva(nav)) {
      if (!isNullOrUndefined(this.sap.residenza.stato) && !isNullOrUndefined(this.sap.residenza.stato.descrizione)
           && this.sap.residenza.stato.descrizione.toUpperCase() !== "ITALIA") {
            if (this.isOperatore) {
              return this.pslshareService.apriModale('', this.msg180, this.titoloPagina, TypeDialogMessage.Confirm );
            }
            const res = await this.pslshareService.apriModale('', this.msg174, this.titoloPagina, TypeDialogMessage.YesOrNo);
            if (res === 'NO') {
              return this.goToRiepilogo();
            }
            if (res === 'SI') {
              return this.goToFascicolo();
            }
      } else if ( this.bloccoCpiDomNonDisponibile && this.bloccoCpiResNonDisponibile) {
          /** IN ATTESA DI UN MESSAGGIO PER L'ASSENZA DEI CPI  */
          // Per poter proseguire, modificare il Comune di Residenza o il Comune di Domicilio dalla funzionalita' FASCICOLO CITTADINO oppure rivolgersi al CpI di competenza, ove si vuole Iscriversi.'
          return this.pslshareService.apriModale('', this.msg172 , this.titoloPagina, TypeDialogMessage.Confirm );
        }
        this.commonPslpService.setRichiestaIscrizioneStorage(this.richiestaIscrizioneCm);
    }
    const urlUscita = nav.url;
    this.router.navigateByUrl(urlUscita);

  }

  goToFascicolo() {
    this.router.navigateByUrl('/fascicolo-cittadino/riepilogo');
  }

  goToRiepilogo() {
    this.router.navigateByUrl('/collocamento-mirato/riepilogo');
  }

  /**
   * Determina se avanti o  salva  e in questa pagina non controlla se i dati sono modificati
   * @param nav NavigationEmitter
   * @returns boolean
   */
   private isAvantiOrSalva(nav: NavigationEmitter) {
    // senza controllare cambiamento dati
    return (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) ;
  }

  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
  }

  /**
   * Determines whether data change on
   * @param value boolean
   */
   onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'SALVA & PROSEGUI';
  }

  /**
   * Determines whether flag changing on
   * @param value boolean
   */
   onFlagChanging(value: boolean) {
    this.flagChanging = value;
  }
}
