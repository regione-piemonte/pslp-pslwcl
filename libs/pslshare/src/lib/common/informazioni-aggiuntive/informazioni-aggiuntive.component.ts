import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { BusinessService, ConfigurazioneInformazioneAggiuntiva } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { InformazioneAggiuntivaExtend, informazioneAggiuntivaExtendSorter } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'pslshare-informazioni-aggiuntive',
  templateUrl: './informazioni-aggiuntive.component.html'
})
export class InformazioniAggiuntiveComponent implements OnInit, OnDestroy {
  private static readonly OBBLIGATORIO: string = 'S';

  @Output() dataChanged: EventEmitter<void> = new EventEmitter();
  @Output() loaded = new EventEmitter();
  @Output() valid: EventEmitter<boolean> = new EventEmitter();

  private readonly subscriptions = [] as Array<Subscription>;
  infoConfAll: ConfigurazioneInformazioneAggiuntiva[];
  infoUtente: InformazioneAggiuntivaExtend[];
  infoConfObb: ConfigurazioneInformazioneAggiuntiva[];
  flag: {
    infoConfAll: boolean,
    infoConfObb: boolean,
    infoUtente: boolean
  };
  tipoinfo: ConfigurazioneInformazioneAggiuntiva;
  showAggiungiInformazione = false;
  readOnly: boolean;
  informazioniAggiuntiveHelp: string;
  popdown: boolean;

  userMessage: string;

  get infoConfObbMancanti(): ConfigurazioneInformazioneAggiuntiva[] {
    return (this.infoConfObb || []).filter(c =>
      !(this.infoUtente || []).some(i => i.informazioneAggiuntiva.codice_configurazione === c.codice));
  }

  /**
   * Creates an instance of informazioni aggiuntive component.
   *
   */
  constructor(
    private readonly commonPslpService: CommonPslpService,
    private readonly businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService
  ) {
    this.flag = {
      infoConfAll: false,
      infoConfObb: false,
      infoUtente: false,
    };
  }

  async ngOnInit() {
    this.readOnly = this.commonPslpService.readOnly;
    this.popdown = !this.commonPslpService.wizard;
    const [infoConfAll, infoUtente, informazioniAggiuntiveHelp, noInfoMessage] = await Promise.all([
      this.businessService.getConfigurazioniInformazioniAggiuntive(this.commonPslpService.getAmbito(), "N").pipe(
        catchError(e => of([] as ConfigurazioneInformazioneAggiuntiva[]))
      ).toPromise(),
      this.commonPslpService.getInformazioneAggiuntivaExtend$(undefined, true),
      this.utilitiesService.getMessage('HC002'),
      this.utilitiesService.getMessage('MI014')
    ]);
    this.infoConfAll = infoConfAll;
    this.infoUtente = infoUtente;
    this.informazioniAggiuntiveHelp = informazioniAggiuntiveHelp;
    this.userMessage = noInfoMessage;
    this.initialization();

    this.subscriptions.push(
      this.commonPslpService.informazioniAggiuntiveExtendUpdate.subscribe(
        (info: InformazioneAggiuntivaExtend[]) => {
          this.infoUtente = info;
          this.initialization();
        }
      )
    );
    this.loaded.emit();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
  /**
   * Determines whether aggiungi informazione on
   */
  onAggiungiInformazione() {
    this.showAggiungiInformazione = !this.showAggiungiInformazione;
  }
  /**
   * Annullas informazione aggiuntiva
   */
  annullaInformazioneAggiuntiva() {
    this.tipoinfo = null;
    this.showAggiungiInformazione = false;
  }
  /**
   * Success informazione aggiuntiva
   */
  successInformazioneAggiuntiva() {
    this.tipoinfo = null;
    this.showAggiungiInformazione = false;
    this.dataChanged.emit();
  }
  /**
   * Eliminas informazione aggiuntiva
   * @param info InformazioneAggiuntivaExtend
   */
  eliminaInformazioneAggiuntiva(info: InformazioneAggiuntivaExtend) {
    this.commonPslpService.removeInformazioneAggiuntivaExtend(info);
  }
  /**
   * Determines whether obbligatorio is
   * @param conf InformazioneAggiuntivaExtend
   * @returns boolean
   */
  isObbligatorio(conf: ConfigurazioneInformazioneAggiuntiva) {
    return conf.bloccante === InformazioniAggiuntiveComponent.OBBLIGATORIO;
  }
  /**
   * Initializations informazioni aggiuntive component
   */
  private initialization() {
    this.setDescrizioni();
    this.setInfoConfObb();
    this.sortInfoUtente();
    this.setFlag();
    this.checkInfoValidity();
  }
  /**
   * Sorts info utente
   */
  private sortInfoUtente() {
    if (this.infoUtente) {
      this.infoUtente.sort((a, b) => informazioneAggiuntivaExtendSorter(a, b));
    }
  }
  /**
   * Sets descrizioni
   */
  private setDescrizioni() {
    if (this.infoUtente) {
      this.infoUtente.forEach(infoAggExt => {
        const confInfoAgg = this.infoConfAll.find(conf => conf.codice === infoAggExt.informazioneAggiuntiva.codice_configurazione);
        infoAggExt.descrizione = confInfoAgg
          ? confInfoAgg.descrizione
          : infoAggExt.informazioneAggiuntiva.descrizione_configurazione;
        infoAggExt.informazioneAggiuntiva.data = infoAggExt.informazioneAggiuntiva.data ?
          new Date(infoAggExt.informazioneAggiuntiva.data) : null;
      });
    }
  }
  /**
   * Sets info conf obb
   */
  private setInfoConfObb() {
    if (this.infoConfAll.length === 0) {
      this.infoConfObb = [] as ConfigurazioneInformazioneAggiuntiva[];
    } else {
      this.infoConfObb = this.infoConfAll.filter(ic =>
        this.isObbligatorio(ic)
        && this.infoUtente.every(iu => iu.informazioneAggiuntiva.codice !== ic.codice)
      );
    }
  }
  /**
   * Sets flag
   */
  private setFlag() {
    this.flag = {
      infoConfAll: this.infoConfAll.length > 0,
      infoConfObb: this.infoConfObb.length > 0,
      infoUtente: this.infoUtente.length > 0
    };
  }
  /**
   * Checks info validity
   */
  private checkInfoValidity(): void {
    const isValid = this.infoConfObb.reduce((acc, conf) => {
      // Short-circuit
      if (!acc) {
        return false;
      }
      return this.infoUtente.some(info => info.informazioneAggiuntiva.codice_configurazione === conf.codice, true);
    }, true);
    this.valid.emit(isValid);
  }
}
