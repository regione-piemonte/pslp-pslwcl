import { AfterContentChecked, AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DettaglioCompletoDichiarazioneFamiliariACarico, DettaglioRichiestaIscrizioneL68, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, NavigationEmitter, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel';
import { AppUserService, CommonPslpService, UtilitiesService } from '@pslwcl/pslservice';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';
import { PslshareService } from '../../../../pslshare.service';
import { WindowState } from '../../dati-graduatoria/dati-graduatoria.component';
@Component({
  selector: 'pslshare-familiari-richiesta-iscrizione',
  templateUrl: './familiari-richiesta-iscrizione.component.html',
})

export class FamiliariRichiestaIscrizioneComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentChecked {

  isRichiestaIscrizione = true;
  readOnly: boolean;
  loaded = false;
  richiestaIscrizione: DettaglioRichiestaIscrizioneL68;
  dichiarazioneSelezionata: DettaglioCompletoDichiarazioneFamiliariACarico;

  dataChanged = false;
  formValid = false;

  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  private readonly subscriptions: Subscription[] = [];
  messaggioErroreDati: string;
  titoloPagina = 'Richiesta per il Collocamento Mirato';
  urlUscita: string;
  prevButtonName = 'INDIETRO';
  statoMaschera: WindowState = 'I';

  provinciaDomicilioOriginal: string;
  msgCambioDomicilio: string;
  private msgInserimentoDichiarazioneSenzaFamiliari: string;
  year1 = moment().subtract(1, 'years').format('YYYY');
  flgNuovoFamOpen = false;
  messaggioUtente: string;

  constructor(
    private readonly pslshareService: PslshareService,
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly changeDedectionRef: ChangeDetectorRef,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService
  ) { }

  async ngOnInit() {

    this.msgInserimentoDichiarazioneSenzaFamiliari = await this.utilitiesService.getMessage('ME122');
    const messaggioUtente = await this.utilitiesService.getMessage("HC074");
    this.messaggioUtente = messaggioUtente;
    this.richiestaIscrizione = await this.commonPslpService.getDettaglioIscrizioneL68$();

    this.sap = await this.commonPslpService.getSap$();

    let dichiarazioneCompleta: DettaglioCompletoDichiarazioneFamiliariACarico = {};
    dichiarazioneCompleta.id_sil_lav_anagrafica = this.sap.id_sil_lav_anagrafica;
    dichiarazioneCompleta.fonte = "PSLP";

    // dichiarazioneCompleta.data_dichiarazione =
    dichiarazioneCompleta.data_nascita_dichiarante = this.sap.dataDiNascita;
    dichiarazioneCompleta.flag_ultima_dichiarazione_inserita = true;
    if (this.richiestaIscrizione.anno_riferimento_familiari_a_carico) {
       dichiarazioneCompleta.anno_validita = this.richiestaIscrizione.anno_riferimento_familiari_a_carico;
    } else {
      const annoInCorso = new Date().getFullYear();
      dichiarazioneCompleta.anno_validita = annoInCorso;
      this.dataChanged = true;
    }

    dichiarazioneCompleta.dettaglio_dichiarazione_familiari_a_carico = this.richiestaIscrizione.elenco_familiari_a_carico ;
    if ( isNullOrUndefined(this.richiestaIscrizione.numero_familiari_a_carico)) {
       if (isNullOrUndefined(this.richiestaIscrizione.elenco_familiari_a_carico) || dichiarazioneCompleta.dettaglio_dichiarazione_familiari_a_carico.length === 0) {
          dichiarazioneCompleta.numero_familiari = 0;
          this.dataChanged = true;
       } else {
          dichiarazioneCompleta.numero_familiari = dichiarazioneCompleta.dettaglio_dichiarazione_familiari_a_carico.length;
       }
    } else {
      dichiarazioneCompleta.numero_familiari = this.richiestaIscrizione.numero_familiari_a_carico;
    }




    this.dichiarazioneSelezionata = dichiarazioneCompleta;


    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    this.readOnly = this.commonPslpService.readOnlyCM;
    this.loaded = true;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  isValidData(): boolean {
    // this.checkData();
    const valido = !this.flagChanging
      && this.sap
      && (this.commonPslpService.wizard || this.dataChanged);
    return valido;
  }
 /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   *
   */
  async onExitPage(nav: NavigationEmitter) {
    if (this.statoMaschera === 'I') {
      if (this.isIndietroOrUscita(nav)) {
        this.urlUscita = nav.url;
        const res = await this.pslshareService.richiestaFinestraModale(this.commonPslpService.modaleIndietroCOMI(this.titoloPagina));
        if (res === 'NO') {
          return;
        }
      } else if (this.isAvantiOrSalva(nav)) {
          if (isNullOrUndefined(this.dichiarazioneSelezionata.numero_familiari) || (this.dichiarazioneSelezionata.numero_familiari === 0)) {
            const data: DialogModaleMessage = {
              titolo: this.titoloPagina,
              tipo: TypeDialogMessage.CancelOrConfirm,
              messaggio: this.msgInserimentoDichiarazioneSenzaFamiliari,
              messaggioAggiuntivo: ""
            };
            const res = await this.pslshareService.richiestaFinestraModale(data);
            if (res === 'NO') {
              return;
            }
            this.dichiarazioneSelezionata.numero_familiari = 0;
          }

          this.utilitiesService.showSpinner();

          this.richiestaIscrizione.anno_riferimento_familiari_a_carico = this.dichiarazioneSelezionata.anno_validita;
          this.richiestaIscrizione.elenco_familiari_a_carico = this.dichiarazioneSelezionata.dettaglio_dichiarazione_familiari_a_carico;
          if (!isNullOrUndefined(this.dichiarazioneSelezionata.numero_familiari)) {
              this.richiestaIscrizione.numero_familiari_a_carico = this.dichiarazioneSelezionata.numero_familiari;
          }
          this.richiestaIscrizione.tipo_operazione = "A";
          const esito = await this.commonPslpService.saveRichiestaIscrizione(this.appUserService.getIdUtente(), this.richiestaIscrizione, '4');
          if (esito.esitoPositivo) {
            this.commonPslpService.setRichiestaIscrizioneStorage(esito.richiesta);
            this.utilitiesService.hideSpinner();
            this.utilitiesService.showToastrInfoMessage('salvataggio effettuato', 'richiesta Iscrizione');
          } else {
            this.utilitiesService.hideSpinner();
            return this.pslshareService.apriModale(esito.messaggioCittadino, "", this.titoloPagina, TypeDialogMessage.Confirm);

          }

        }

    }
    const urlUscita = nav.url;
    this.router.navigateByUrl(urlUscita);
  }

  /**
   * Determines whether avanti or salva is
   * @param nav NavigationEmitter
   * @returns boolean
   */
   private isAvantiOrSalva(nav: NavigationEmitter) {
    return (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) && this.dataChanged;
  }


/**
   * Determines whether indietro or uscita is
   * @param nav NavigationEmitter
   * @returns booelan
   */
 private isIndietroOrUscita(nav: NavigationEmitter) {
  return ((nav.exit === TypeExit.Back || nav.exit === TypeExit.Prev)
    && (this.dataChanged))
    || (nav.exit === TypeExit.Wizard && this.dataChanged);
}

/**
   * Do uscita
   */
 doUscita() {

  this.router.navigateByUrl(this.urlUscita);
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


  /**
   * recupera dal form del figlio informazione se i dati sono cambiati
   * @param flg boolean
   */
   onFormFamiliariChanged(flg: boolean) {
    this.dataChanged = flg;
  }

  /**
   * recupera dal form del figlio informazione se i dati sono cambiati
   * @param flg boolean
   */
   onFormNuovoFamChanged(flg: boolean) {
    this.flgNuovoFamOpen = flg;
  }

  /**
   * recupera dal form del figlio informazione se i dati sono cambiati
   * @param flg boolean
   */
   onFormFamiliariValid(flg: boolean) {
    this.formValid = flg;
  }

  /**
   * after content checked
   */
   ngAfterContentChecked(): void {
    this.changeDedectionRef.detectChanges();
  }
  /**
   * after view init
   */
   ngAfterViewInit() {
    this.changeDedectionRef.detectChanges();
  }
}
