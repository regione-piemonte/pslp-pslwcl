import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BusinessService, DatoreLavoro, Decodifica, ElenchiDecodifiche, EsperienzaLavoro, SchedaAnagraficoProfessionale, Indirizzo, TipoContratto } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { DialogModaleMessage, NavigationEmitter, TypeDialogMessage, SezioniSAP, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';

/* Rappresenta lo stato della maschera rispetto al singolo elemento selezionato
   I Inserimento, U Modifica, V visualizzazione */
export type WindowState = 'I' | 'U' | 'V';

@Component({
  selector: 'pslfcwcl-esperienze-lavoro',
  templateUrl: './esperienze-lavoro.component.html'
})
export class EsperienzeLavoroComponent implements OnInit {
  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="esperienze"]';

  readOnlyDomicilio: boolean;
  listaTipoContrattoValidiADataInizioRapporto: TipoContratto[] = [];

  statoMaschera: WindowState = 'V';
  readOnly: boolean;
  dataChanged = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  prevButtonName: string;
  titoloPagina = 'Esperienze di lavoro';
  urlUscita: string;
  esperienzeLavoro: EsperienzaLavoro[];
  esperienzaSelezionata: EsperienzaLavoro;
  tipoContrattoSelezionato: TipoContratto;
  showEsperienza: boolean;
  elenchiDecodifiche: ElenchiDecodifiche;
  listaQualifiche: Decodifica[] = [];
  indiceSelezionato = -1;
  constructor(
    private readonly router: Router,
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly storageService: SessionStorageService,
    private readonly pslbasepageService: PslshareService,
    private readonly businessService: BusinessService,
  ) {

  }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.dataChanged = false;
    this.nextButtonName = 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    this.readOnly = this.commonFCService.readOnly || this.commonFCService.readOnlyDomicilio;
    const [sap, elenchiDecodifiche, msgCambioDomicilio] = await Promise.all([
      this.commonFCService.getSap$(),
      this.storageService.getCachedValue('ELENCHI_DECODIFICHE', () => this.businessService.findElenchiDecodificheSap().toPromise()),
      this.utilitiesService.getMessage('ME085')
    ]);
    this.sap = sap;
    this.commonFCService.backupStorageFascicolo();
    this.elenchiDecodifiche = elenchiDecodifiche;
    this.esperienzeLavoro = sap.esperienze_di_lavoro;
    this.utilitiesService.hideSpinner();
    this.readOnlyDomicilio = this.commonFCService.readOnlyDomicilio;
    if (this.readOnlyDomicilio) {
      this.utilitiesService.showToastrInfoMessage(msgCambioDomicilio);
    }


  }

  /**
   * Determines whether nuovo on
   */
  onNuovo() {
    this.statoMaschera = 'I';
    this.flagChanging = true;
    this.esperienzaSelezionata = this.buildNewEsperienza();
    this.tipoContrattoSelezionato = null;
    this.utilitiesService.scrollTo(EsperienzeLavoroComponent.SCROLL_TARGET);
  }

  /**
   * Builds new esperienza
   * @returns new esperienza
   */
  private buildNewEsperienza(): EsperienzaLavoro {
    const esp = {} as EsperienzaLavoro;
    esp.esperienza_dichiarata = true;
    esp.datore_lavoro = this.buildNewDatore();
    esp.azienda_utilizzatrice = this.buildNewDatore();
    esp.indirizzo_di_lavoro = this.buildNewIndirizzo();
    return esp;
  }

  /**
   * Builds new datore
   * @returns new datore
   */
  private buildNewDatore(): DatoreLavoro {
    const d = {} as DatoreLavoro;
    d.indirizzo = this.buildNewIndirizzo();
    return d;
  }

  /**
   * Builds new indirizzo
   * @returns new indirizzo
   */
  private buildNewIndirizzo(): Indirizzo {
    return {} as Indirizzo;
  }

  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.statoMaschera = 'V';
    this.esperienzaSelezionata = null;
    this.flagChanging = false;
  }

  /**
   * Determines whether visualizza on
   * @param esperienza EsperienzaLavoro
   */
  onVisualizza(esperienza: EsperienzaLavoro) {
    this.statoMaschera = 'V';
    this.esperienzaSelezionata = UtilitiesService.clone(esperienza);
    this.tipoContrattoSelezionato =
      this.getTipoContrattoByCodice(
        this.esperienzaSelezionata.tipo_contratto ?
          this.esperienzaSelezionata.tipo_contratto.codice_ministeriale : undefined);
    this.indiceSelezionato = this.sap.esperienze_di_lavoro.findIndex(esp => esp === esperienza);
    this.utilitiesService.scrollTo(EsperienzeLavoroComponent.SCROLL_TARGET);
  }


  /**
   * Determines whether sezione change on
   * @param value string
   */
  onSezioneChange(value: string) {
    // Qui on so cosa fare, la sap dovrebbe contenera gia' la sezione esperienze aggiornata
    this.onDataChange(true);
    this.esperienzaSelezionata = null;
  }

  /**
   * Determines whether data change on
   * @param value boolean
   */
  onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = 'CONFERMA & PROSEGUI';
  }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  async onExitPage(nav: NavigationEmitter) {
    try {
      if (((nav.exit === TypeExit.Back || nav.exit === TypeExit.Prev)
        && (this.dataChanged))
        || (nav.exit === TypeExit.Wizard && this.dataChanged)
      ) {
        this.urlUscita = nav.url;
        this.openModal();

      } else {
        if (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) {

          if (this.dataChanged) {
            this.utilitiesService.showSpinner();
            this.commonFCService.setSapStorage(this.sap);
            this.commonFCService.setSapSezioniUpdate(SezioniSAP.ESPERIENZE_LAVORO);
            this.commonFCService.backupStorageFascicolo();
          }
        }
        this.router.navigateByUrl(nav.url);
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, this.titoloPagina);
    }
  }
  /**
   * Opens modal
   */
  async openModal() {

    const data: DialogModaleMessage = {
      titolo: 'Uscita ' + this.titoloPagina,
      tipo: TypeDialogMessage.YesOrNo,
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
      this.commonFCService.restoreStorageFascicolo();
    } else {
      this.commonFCService.azzeraStorageFascicolo();
    }
    this.router.navigateByUrl(this.urlUscita);
  }

  /**
   * Determines whether flag changing on
   * @param flg boolean
   */
  onFlagChanging(flg: boolean) {
    this.flagChanging = flg;
  }

  /**
   * Determines whether annulla dettaglio on
   */
  onAnnullaDettaglio() {

    this.onAnnulla();

  }

  /**
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {
    const valido = !this.flagChanging
      && this.sap
      && (this.commonFCService.wizard || this.dataChanged);
    return valido;
  }

  /**
   * Gets tipo contratto by codice
   * @param codice string
   * @returns tipo contratto by codice
   */
  getTipoContrattoByCodice(codice: string): TipoContratto {
    if (isNullOrUndefined(codice)) {
      return null;
    }
    const dataPerFiltro = this.commonFCService.cleanupDate(this.esperienzaSelezionata.data_inizio_rapporto || new Date());
    this.listaTipoContrattoValidiADataInizioRapporto = this.elenchiDecodifiche.tipi_contratto.filter(
      tc => this.commonFCService.isDataCompresa(dataPerFiltro, tc.data_inizio_validita, tc.data_fine_validita)
    );
    const tipoContratto = this.listaTipoContrattoValidiADataInizioRapporto.find(elem => elem.codice_ministeriale === codice);
    return tipoContratto;
  }

}
