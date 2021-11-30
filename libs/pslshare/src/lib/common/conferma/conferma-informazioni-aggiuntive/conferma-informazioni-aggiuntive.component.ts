import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BusinessService, ConfigurazioneInformazioneAggiuntiva, Documento, TipoDocumento } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, InformazioneAggiuntivaExtend, informazioneAggiuntivaExtendSorter, StatoDocumento } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'pslshare-conferma-informazioni-aggiuntive',
  templateUrl: './conferma-informazioni-aggiuntive.component.html',
  styles: ['ul.dett li { width: 100% }']
})
export class ConfermaInformazioniAggiuntiveComponent implements OnInit {
  @Output() loaded = new EventEmitter();
  infoUtente: InformazioneAggiuntivaExtend[];
  flagAllegati = false;
  listaDocumenti: Documento[] = [];

  private infoConfAll: ConfigurazioneInformazioneAggiuntiva[];
  listaTipiDocumento: TipoDocumento[] = [];

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly businessService: BusinessService
  ) { }

  async ngOnInit() {
    const [infoConfAll, infoUtente, listaDocumenti, tipiDocumento ] = await Promise.all([
      this.businessService.getConfigurazioniInformazioniAggiuntive(this.commonPslpService.getAmbito(), "N").pipe(
        catchError(e => of([] as ConfigurazioneInformazioneAggiuntiva[]))
      ).toPromise(),
      this.commonPslpService.getInformazioneAggiuntivaExtend$(undefined, true),
      this.businessService.findDocumenti(this.commonPslpService.getUtenteStorage().id_utente, this.commonPslpService.getAmbito()).pipe(
        catchError(e => of([] as Documento[])))
      .toPromise(),
      this.businessService.findTipiDocumenti(this.commonPslpService.getAmbito()).pipe(
        catchError(e => of([] as TipoDocumento[])))
      .toPromise()
    ]);

    this.infoConfAll = infoConfAll;
    this.infoUtente = infoUtente;
    this.listaDocumenti = listaDocumenti;
    this.listaTipiDocumento = tipiDocumento;
    this.setDescrizioni();
    this.sortInformazioni();
    this.flagAllegati = this.listaDocumenti && this.listaDocumenti.length > 0;
    this.loaded.emit();
  }
  /**
   * Sorts informazioni
   */
  private sortInformazioni() {
    if (this.infoUtente) {
      this.infoUtente.sort((a, b) => informazioneAggiuntivaExtendSorter(a, b));
    }
  }

  /**
   * Sets descrizioni
   */
  private setDescrizioni() {
    this.infoUtente.forEach(infoAggExt => {
      const confInfoAgg = this.infoConfAll.find(conf => conf.codice === infoAggExt.informazioneAggiuntiva.codice_configurazione);
      infoAggExt.descrizione = confInfoAgg
        ? confInfoAgg.descrizione
        : infoAggExt.informazioneAggiuntiva.descrizione_configurazione;
    });
  }

  /**
   * Determines whether informazioni aggiuntive on
   */
  onInformazioniAggiuntive() {
    switch (this.commonPslpService.AMBITO) {
      case Ambito.GG:
          this.router.navigateByUrl('/garanzia-giovani/informazioni');
        break;
        case Ambito.RDC:
          this.router.navigateByUrl('/reddito-cittadinanza/informazioni');
        break;
      default:
        break;
    }
  }

  /**
   * Gets stato descrizione
   * @param stato codice stato string
   * @returns descrizione
   */
  getStatoDescrizione(stato: string) {
    return StatoDocumento.getByCodice(stato).descrizione;
  }

  /**
   * Gets tipo documento descrizione
   * @param cod string
   * @returns descrizione
   */
  getTipoDocumentoDescrizione(cod: string) {
    const tipoDocumento = this.listaTipiDocumento.find(td => td.codice === cod);
    return tipoDocumento.descrizione;
  }
}
