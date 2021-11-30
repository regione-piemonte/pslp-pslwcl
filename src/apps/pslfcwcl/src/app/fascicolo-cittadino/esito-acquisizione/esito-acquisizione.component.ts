import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, EsitoSaveErrato, ModificheSAP, NavigationEmitter, SezioniSAP, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

export interface FascicoloSezioniInterface {
  titolo: string;
  modificato: boolean;
  livello: boolean;
}

@Component({
  selector: 'pslfcwcl-esito-acquisizione',
  templateUrl: './esito-acquisizione.component.html'
})
export class EsitoAcquisizioneComponent implements OnInit {

  elencoSezioni: FascicoloSezioniInterface[] = [];
  readOnly: boolean;
  dataChanged = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  prevButtonName: string;
  titoloPagina = 'Riepilogo Modifiche';
  sezioni: string[];
  sezioniMod: ModificheSAP;
  risultatoErrato: string = null;

  constructor(
    private readonly router: Router,
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService
  ) { }

   async ngOnInit() {
    this.nextButtonName =  'SALVA';
    this.prevButtonName = 'INDIETRO';
    this.readOnly = this.commonFCService.readOnly;
    const [sap, sezioniMod] = await Promise.all([
      this.commonFCService.getSap$(),
      this.commonFCService.getSezioniModStorage()
    ]);
    this.sap = sap;
    this.sezioni = [];

    this.sezioniMod = sezioniMod;
    this.elencoSezioni.push(
      {
        titolo: 'Dati anagrafici',
        modificato: this.getValue(SezioniSAP.DATI_ANAGRAFICI),
        livello: false
      },
      {
        titolo: 'Dati amministrativi',
        modificato: this.getValue(SezioniSAP.DATI_AMMINISTRATIVI),
        livello: false
      },
      {
        titolo: 'Esperienze di lavoro',
        modificato: this.getValue(SezioniSAP.ESPERIENZE_LAVORO),
        livello: false
      },

      {
        titolo: 'Istruzione',
        modificato: this.getValue(SezioniSAP.ISTRUZIONE),
        livello: true
      },
      {
        titolo: 'Corsi di Formazione',
        modificato: this.getValue(SezioniSAP.FORMAZIONE_PROFESSIONALE),
        livello: true
      },
      {
        titolo: 'Lingue straniere',
        modificato: this.getValue(SezioniSAP.LINGUE_STRANIERE),
        livello: true
      },
      {
        titolo: 'Conoscenze Informatiche',
        modificato: this.getValue(SezioniSAP.CONOSCENZE_INFORMATICHE),
        livello: true
      },
      {
        titolo: 'Albi e Ordini professionali & Patenti & Patentini',
        modificato: this.getValue(SezioniSAP.ABILITAZIONI_E_PATENTI),
        livello: true
      },
      {
        titolo: 'Politiche Attive',
        modificato: this.getValue(SezioniSAP.POLITICHE_ATTIVE),
        livello: false
      }
    );
    if (this.commonFCService.readOnlyDomicilio &&
      (this.sezioni.length > 1 ||
        (this.sezioni.length === 1
          && this.sezioni[0] !== SezioniSAP.DATI_ANAGRAFICI))) {
      this.readOnly = true;
    }
  }

  private getValue(sezione: string): boolean {
    const isMod = this.sezioniMod.elencoModifiche.find(s => s.key === sezione).value;
    if (isMod) {
        this.sezioni.push(sezione);
    }
    return isMod;
  }

  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
  }

  onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = 'SALVA';
  }

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
      if (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) {

          this.utilitiesService.showSpinner();
          this.commonFCService.setSapStorage(this.sap);
          const esito = await this.commonFCService.saveSezioniSap(this.sezioni);
          this.utilitiesService.hideSpinner();
          if ((esito.code !== 'OK' && esito.code !== '200') || !isNullOrUndefined(esito.messaggioInformativo)) {
            this.risultatoErrato = esito.messaggioCittadino;
            const esitoErr: EsitoSaveErrato = { esitoErr: esito, urlReturn: '/fascicolo-cittadino/esito', nuovaSAP: false};
            this.commonFCService.setEsitoSave(esitoErr);
            return this.router.navigateByUrl('/fascicolo-cittadino/esito-errato');
          }
          this.commonFCService.azzeraModificheSap();
          this.commonFCService.setSapAndIdUtenteStorage(null, null);

            const data: DialogModaleMessage = {
              titolo: 'Fascicolo del Cittadino',
              tipo: TypeDialogMessage.Confirm,
              messaggio: 'Salvataggio effettuato correttamente',
              messaggioAggiuntivo: ''
            };
            const result = await this.pslbasepageService.openModal(data);
      }
      this.router.navigateByUrl(nav.url);
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'riepilogo');
    }

  }


  /**
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {
    return  !this.flagChanging
      && this.sap
      && (this.commonFCService.wizard || this.dataChanged);
  }
}
