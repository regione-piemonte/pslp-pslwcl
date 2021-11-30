import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Ambito, ConfigurazioneCalendarioHeader, ErrorDef } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { InterfacciaCalendarioExport, TipoUtenteCodice } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { ExcelService, LogService, OperatoreService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { RicercaCalendarioService, SearchParameters, SportelloExtend } from './ricerca-calendario.service';

declare const $: any;

/**
 * Component RicercaComponent
 *  gestione ricerca calendari
 */
@Component({
  selector: 'pslbowcl-ricerca',
  templateUrl: './ricerca-calendario.component.html',
  styleUrls: ['./ricerca-calendario.component.css']
})
export class RicercaCalendarioComponent implements OnInit {
  private static readonly ricCALEN = 'Ricerca Calendari';
  private static readonly datiGEN = '/calendario/dati-generali';

  @ViewChild('ricercaForm', { static: false }) ricercaForm: NgForm;
  calendari: ConfigurazioneCalendarioHeader[];
  selected: ConfigurazioneCalendarioHeader;
  listaAmbiti: Ambito[];
  listaEnti: SportelloExtend[];
  pageSizes: number[] = [5, 10, 20, 25, 50];
  ricercaExecute = false;
  viewBlocca = false;
  searchParameters: SearchParameters;
  idEnte: number;
  pageSize = 10;
  page: number;
  messaggioElimina = '';
  isCPI: boolean;
  abilitaNuovo = false;

  calendarioElimina = "I";

  constructor(
    private readonly ricercaCalendarioService: RicercaCalendarioService,
    private readonly operatoreService: OperatoreService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService,
    private readonly router: Router,
    private readonly sessionStorageService: SessionStorageService,
    private readonly excelService: ExcelService
  ) { }

  async ngOnInit() {
    const operatore = this.operatoreService.getOperatoreByRuolo();
    const tipoOperatore: TipoUtenteCodice = this.operatoreService.getRuolo();
    this.utilitiesService.showSpinner();
    this.isCPI = (tipoOperatore === TipoUtenteCodice.CPI);

    const [listaAmbiti, listaEnti] = await Promise.all([
      this.ricercaCalendarioService.getAmbiti(operatore),
      this.ricercaCalendarioService.getSportelliExtend(operatore)

    ]);
    this.abilitaNuovo = false;
    if (this.isCPI) {
      const [enti] = await Promise.all([
        this.ricercaCalendarioService.getEntiExtend(operatore)
      ]);
      if (!isNullOrUndefined(enti) && enti.length > 0) {
        this.abilitaNuovo = true;
      }
    } else {
      this.abilitaNuovo = true;
    }
    this.listaAmbiti = listaAmbiti;
    this.listaEnti = listaEnti;
    const searchParameters = this.sessionStorageService.getItem<SearchParameters>(SessionStorageService.PARAM_RICERCA_CALENDARIO, true);
    if (searchParameters) {
      this.searchParameters = searchParameters;
      this.page = +this.sessionStorageService.getItem<number>(SessionStorageService.CURRENT_PAGE) || 1;
      this.idEnte = this.ricercaCalendarioService.getIdEnteSearchParameter(this.listaEnti, this.searchParameters.sportello);
      this.onCerca(false);
    } else {
      this.searchParameters = {
        codiceAmbito: null,
        sportello:
        {
          gruppo_operatore: null,
          cod_operatore: null,
          subcodice: null
        },
        dataInizio: null,
        dataFine: null,
        nomeCalendario: null,
        calendarioEliminato: null
      };
      this.idEnte = null;
    }
    this.utilitiesService.hideSpinner();
  }

  onEnteChange() {
    const dataCt = this.ricercaForm.controls['ente'];
    if (dataCt.valid) {
      const sportello = this.listaEnti.find(e => e.id === +dataCt.value);
      this.searchParameters.sportello = sportello ? {
          gruppo_operatore: sportello.gruppo_operatore,
          cod_operatore: sportello.cod_operatore,
          subcodice: sportello.subcodice
        } : {
          gruppo_operatore: null,
          cod_operatore: null,
          subcodice: null
        };
    }
  }

  async onCerca(resetPage) {
    this.logService.log('ricercaForm', this.ricercaForm);
    this.selected = null;

    this.onChangeCalendarioEliminato(this.calendarioElimina);

    if (this.searchParameters.dataInizio
        && this.searchParameters.dataFine
        && this.searchParameters.dataInizio > this.searchParameters.dataFine) {
      const msg = await this.utilitiesService.getMessage('ME053');
      this.utilitiesService.showToastrErrorMessage(msg, RicercaCalendarioComponent.ricCALEN);
    } else {

      this.utilitiesService.showSpinner();
      this.ricercaExecute = false;
      const operatore = this.operatoreService.getOperatoreByRuolo();
      if (resetPage) {
        this.page = 1;
      }
      try {
        this.calendari = await this.ricercaCalendarioService.getCalendari(operatore, this.searchParameters);
        if (this.calendari.length === 1) {
          this.onCalendarioSelect(this.calendari[0].id_calendario);
        }
        this.ricercaExecute = true;
      } catch (e) {
        const errore = (e instanceof HttpErrorResponse) ? e.error : e;
        this.utilitiesService.showToastrErrorMessage(errore.errorMessage || errore.message, RicercaCalendarioComponent.ricCALEN);
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }

  onCalendarioSelect(id: number) {
    this.selected = this.calendari.find(c => c.id_calendario === +id);
    this.viewBlocca = !this.selected.bloccato;
  }

  isSelected(id: number) {
    if (isNullOrUndefined(this.selected) || id !== this.selected.id_calendario) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * torna alla pagina di home
   */
  onIndietro() {
    this.sessionStorageService.clearItem(SessionStorageService.PARAM_RICERCA_CALENDARIO);
    this.sessionStorageService.clearItem(SessionStorageService.CURRENT_PAGE);
    this.router.navigateByUrl('/home');
  }

  /**
   * Determines whether azione on
   * @param azione  da eseguire
   *
   *   NUOVO  DUPLICA  ELIMINA  BLOCCA  SBLOCCA  INCONTRI  MODIFICA  VISUALIZZA
   */
  async onAzione(azione: string) {
    this.sessionStorageService.setItem<SearchParameters>(SessionStorageService.PARAM_RICERCA_CALENDARIO, this.searchParameters);
    this.sessionStorageService.setItem<number>(SessionStorageService.CURRENT_PAGE, this.page);
    switch (azione) {
      case 'nuovo':
        this.sessionStorageService.clearItem(SessionStorageService.CONFIGURAZIONE_CALENDARIO);
        this.sessionStorageService.clearItem(SessionStorageService.READONLY);
        this.router.navigate([RicercaCalendarioComponent.datiGEN]);
        break;
      case 'duplica':
        this.sessionStorageService.clearItem(SessionStorageService.CONFIGURAZIONE_CALENDARIO);
        this.router.navigate(['/calendario/duplica'], { queryParams: { idCalendario: this.selected.id_calendario } } );
        break;
      case 'elimina':
        const esito = await this.ricercaCalendarioService.verificaEliminaCalendario(this.selected.id_calendario);
        this.messaggioElimina = esito.messaggioCittadino ? esito.messaggioCittadino
                                : 'Si desidera eliminare definitivamente il calendario?';
        $('#modal_elimina').modal('show');
        break;
      case 'blocca':
        $('#modal_blocca').modal('show');
        break;
      case 'sblocca':
        $('#modal_sblocca').modal('show');
        break;
      case 'incontri':
        this.sessionStorageService.clearItem(SessionStorageService.CONFIGURAZIONE_CALENDARIO);
        this.router.navigate(['/calendario/incontri'], { queryParams: { idCalendario: this.selected.id_calendario } } );
        break;
      case 'modifica':
        this.sessionStorageService.clearItem(SessionStorageService.CONFIGURAZIONE_CALENDARIO);
        this.sessionStorageService.clearItem(SessionStorageService.READONLY);
        this.router.navigate([RicercaCalendarioComponent.datiGEN], { queryParams: { idCalendario: this.selected.id_calendario } } );
        break;
      case 'visualizza':
        this.sessionStorageService.clearItem(SessionStorageService.CONFIGURAZIONE_CALENDARIO);
        this.sessionStorageService.setItem(SessionStorageService.READONLY, true);
        this.router.navigate([RicercaCalendarioComponent.datiGEN], { queryParams: { idCalendario: this.selected.id_calendario } } );
        break;
      default:
        break;
    }
  }

  /**
   * Do eliminazione calendario
   */
  async doEliminaCalendario() {
    this.utilitiesService.showSpinner();
    try {
      const esito = await this.ricercaCalendarioService.eliminaCalendario(this.selected.id_calendario);
      this.selected.eliminato = true;
      const msg = esito.messaggioCittadino ? esito.messaggioCittadino : 'Calendario eliminato';
      this.utilitiesService.showToastrInfoMessage(msg, RicercaCalendarioComponent.ricCALEN);
    } catch (e) {
      const errore: ErrorDef = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage, RicercaCalendarioComponent.ricCALEN);
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Do blocca calendario
   */
  async doBloccaCalendario() {
    this.utilitiesService.showSpinner();
    try {
      const esito = await this.ricercaCalendarioService.bloccaCalendario(this.selected.id_calendario);
      this.selected.bloccato = true;
      const msg = esito.messaggioCittadino ? esito.messaggioCittadino : 'Calendario bloccato';
      this.viewBlocca = false;
      this.utilitiesService.showToastrInfoMessage(msg, RicercaCalendarioComponent.ricCALEN);
    } catch (e) {
      const errore: ErrorDef = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage, RicercaCalendarioComponent.ricCALEN);
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Do sblocca calendario
   */
  async doSbloccaCalendario() {
    this.utilitiesService.showSpinner();
    try {
      const esito = await this.ricercaCalendarioService.sbloccaCalendario(this.selected.id_calendario);
      this.selected.bloccato = false;
      const msg = esito.messaggioCittadino ? esito.messaggioCittadino : 'Calendario sbloccato';
      this.viewBlocca = true;
      this.utilitiesService.showToastrInfoMessage(msg, RicercaCalendarioComponent.ricCALEN);
    } catch (e) {
      const errore: ErrorDef = (e instanceof HttpErrorResponse) ? e.error : e;
      this.utilitiesService.showToastrErrorMessage(errore.errorMessage, RicercaCalendarioComponent.ricCALEN);
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  goToPage(pageNumber: number): void {
    this.page = Math.max(1, Math.min(Math.ceil(this.calendari.length / this.pageSize), pageNumber));
  }

  getPage(): ConfigurazioneCalendarioHeader[] {
    if ((this.page - 1) * this.pageSize > this.calendari.length) {
      this.page = 1;
    }
    return this.calendari.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  /**
   * esporta risulati ricerca su
   *  file excel
   */
  onExportExcel() {
    const calendariExport: InterfacciaCalendarioExport[] = [];

    this.calendari.forEach(element => {
        const calItem: InterfacciaCalendarioExport = {
          nome: element.nome,
          descrizione_ambito: element.descrizione_ambito,
          descrizione_ente: element.descrizione_ente,
          giorni_attivi: element.giorni_attivi,
          eliminato: element.eliminato,
          bloccato: element.bloccato,
          messaggio_annullamento_appuntamento: element.messaggio_annullamento_appuntamento,
          messaggio_spostamento_appuntamento: element.messaggio_spostamento_appuntamento,
          numero_slot_liberi_oggi: element.numero_slot_liberi,
          numero_slot_prenotabili_oggi: element.numero_slot_prenotabili,
          periodo: element.periodo,
          promemoria: element.promemoria,
     //     ore_invio_promemoria: undefined,
          ore_limite_spostamento: element.ore_limite_spostamento,
          visibile_in_base: element.visibile_in_base,
          annulla_garanzia_giovani: element.annulla_garanzia_giovani
        };
        calendariExport.push(calItem);
      }
    );

    this.excelService.exportAsExcelFile(calendariExport, 'calendari');
  }
  get paginationFooter(): string {
    if (this.calendari.length === 0) {
      return '';
    }
    const firstElement = Math.min((this.page - 1) * this.pageSize + 1, this.calendari.length);
    const lastElement = Math.min(this.page * this.pageSize, this.calendari.length);
    return `${firstElement} - ${lastElement} di ${this.calendari.length}`;
  }


  onChangeCalendarioEliminato(calendarioEliminato: string) {
    if (calendarioEliminato === 'S') {
      this.searchParameters.calendarioEliminato = true;
    } else if (calendarioEliminato === 'N') {
      this.searchParameters.calendarioEliminato = false;
    } else if (calendarioEliminato === 'I') {
      this.searchParameters.calendarioEliminato = null;
    }
  }
}
