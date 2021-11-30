import { AfterContentChecked, AfterViewInit, ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ListaSpeciale, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, NavigationEmitter, SezioniSAP, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'pslfcwcl-dati-amministrativi',
  templateUrl: './dati-amministrativi.component.html',
  styleUrls: ['./dati-amministrativi.component.css']
})
export class DatiAmministrativiComponent implements OnInit, OnChanges, AfterViewInit, AfterContentChecked {
  @ViewChild('datiAmministrativiForm', { static: true }) form: NgForm;
  readOnly = false;
  readOnlyDomicilio = false;
  isVisualizza = false;
  dataChanged = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  prevButtonName: string;
  statoOccupazionale: string;
  condizione: string;
  categoria: string;
  dataUltimoEvento: Date;
  dataDID: Date;
  indiceProfiling: string;
  anzianita: string;
  listeSpeciali: ListaSpeciale[];
  appartenenzaCP: string;
  indiceISEE: string;
  obbligoFormativoAssolto: boolean;
  titoloPagina = 'Dati amministrativi';
  urlUscita: string;
  obbligoFormativoAssoltoOriginal: boolean;
  assoltoOrigine: boolean;
  dataUltimoAggiornamentoSAP: Date;

  constructor(
    private readonly router: Router,
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly changeDedectionRef: ChangeDetectorRef
  ) {
  }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.nextButtonName = 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    this.readOnly = this.commonFCService.readOnly || this.commonFCService.readOnlyDomicilio;
    this.readOnlyDomicilio = this.commonFCService.readOnlyDomicilio;
    const [sap, msgCambioDomicilio] = await Promise.all([
      this.commonFCService.getSap$(),
      this.utilitiesService.getMessage('ME085')
    ]);
    this.sap = sap;

    this.assoltoOrigine =
      this.commonFCService.getObbligoFormativoStorage() ?
        this.commonFCService.getObbligoFormativoStorage() :
        this.sap.datiAmministrativi.obbligo_formativo_assolto;
    this.commonFCService.backupStorageFascicolo();

    this.statoOccupazionale = this.codiceDescrizione(sap.datiAmministrativi.stato_occupazionale.codice_silp,
      sap.datiAmministrativi.stato_occupazionale.descrizione);

    this.condizione = this.codiceDescrizione(sap.datiAmministrativi.condizione.codice_silp,
      sap.datiAmministrativi.condizione.descrizione);

    this.categoria = this.codiceDescrizione(sap.datiAmministrativi.categoria_dlg297.codice_silp,
      sap.datiAmministrativi.categoria_dlg297.descrizione);

    this.anzianita = "";
    if (!isNullOrUndefined(sap.datiAmministrativi.stato_occupazionale) &&
      !isNullOrUndefined(sap.datiAmministrativi.condizione.codice_ministeriale) &&
      ('IN' === sap.datiAmministrativi.stato_occupazionale.codice_ministeriale ||
        'DI' === sap.datiAmministrativi.stato_occupazionale.codice_ministeriale)) {
      this.anzianita = (
        !isNullOrUndefined(
          sap.datiAmministrativi.anzianita_disoccupazione_mesi) ?
          sap.datiAmministrativi.anzianita_disoccupazione_mesi.toString() + " mesi al "
          + sap.data_ultimo_aggiornamento.toLocaleDateString() : "");
    }

    this.dataUltimoAggiornamentoSAP = sap.data_ultimo_aggiornamento;
    this.indiceProfiling = sap.datiAmministrativi.indice_profiling;
    this.dataUltimoEvento = sap.datiAmministrativi.data_evento;
    this.dataDID = sap.datiAmministrativi.data_dichiarazione_disponibilita;

    this.listeSpeciali = sap.datiAmministrativi.liste_speciali;
    this.appartenenzaCP = this.codiceDescrizione(sap.datiAmministrativi.appartenenza_categorie_protette.codice_silp,
      sap.datiAmministrativi.appartenenza_categorie_protette.descrizione);
    this.indiceISEE = sap.datiAmministrativi.indice_isee;
    this.obbligoFormativoAssolto = sap.datiAmministrativi.obbligo_formativo_assolto;
    this.obbligoFormativoAssoltoOriginal = sap.datiAmministrativi.obbligo_formativo_assolto;
    this.utilitiesService.hideSpinner();
    if (this.readOnlyDomicilio) {
      this.utilitiesService.showToastrInfoMessage(msgCambioDomicilio);
    }
  }

  /**
   * on changes
   * @param changes SimpleChanges
   * @returns on changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.sap.isFirstChange()) {
      this.sanifySap();
    }
  }

  private sanifySap() {
  }

  /**
   * Codices descrizione
   * @param codice string
   * @param descrizione string
   * @returns concatena
   */
  private codiceDescrizione(codice: string, descrizione: string) {
    const codice1 = isNullOrUndefined(codice) ? '' : codice;
    const descrizione1 = isNullOrUndefined(descrizione) ? '' : descrizione;
    return codice1 + ' ' + descrizione1;
  }

  /**
   * Determines whether sap change on
   * @param value SchedaAnagraficoProfessionale
   */
  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
  }

  /**
   * Determines whether data change on
   * @param value boolean
   */
  onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = this.commonFCService.wizard === false ? 'CONFERMA' : 'CONFERMA & PROSEGUI';
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
   */
  async onExitPage(nav: NavigationEmitter) {
    try {

      if (this.dataChanged && (nav.exit === TypeExit.Back
        || nav.exit === TypeExit.Prev
        || nav.exit === TypeExit.Wizard)) {
        this.urlUscita = nav.url;
        this.openModal();
      } else {
        if (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) {
          this.checkData();
          if (!this.readOnly && this.dataChanged) {
            this.utilitiesService.showSpinner();
            this.commonFCService.setSapStorage(this.sap);
            this.commonFCService.setSapSezioniUpdate(SezioniSAP.DATI_AMMINISTRATIVI);
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
   * Checks data
   */
  checkData() {
    if (this.sap) {
      this.sap.datiAmministrativi.obbligo_formativo_assolto = this.obbligoFormativoAssolto;
      if (this.obbligoFormativoAssolto !== this.obbligoFormativoAssoltoOriginal) {
        this.onDataChange(true);
      }
    }
  }
  /**
   * Opens modal
   */
  async openModal() {

    const data: DialogModaleMessage = {
      titolo: 'Uscita ' + this.titoloPagina,
      tipo: TypeDialogMessage.YesOrNo,
      messaggioAggiuntivo: 'I dati non confermati saranno perduti.'
    };

    const res = await this.pslbasepageService.richiestaFinestraModale(data);
    if (res === 'SI') {
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
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {
    this.checkData();
    const valido = !this.flagChanging
      && this.sap
      && (this.commonFCService.wizard || this.dataChanged);
    return valido;
  }
  /**
   * after view init
   */
  ngAfterViewInit() {
    this.checkData();
  }


  /**
   * after content checked
   */
  ngAfterContentChecked(): void {
    this.changeDedectionRef.detectChanges();
  }
}
