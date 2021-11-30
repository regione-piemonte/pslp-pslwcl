import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OperatoreService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, BusinessService, ConfigurazioneInformazioneAggiuntiva, GestoreService, Messaggio } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328


@Component({
  selector: 'pslbowcl-informazioni-aggiuntive',
  templateUrl: './informazioni-aggiuntive.component.html'
})
export class InformazioniAggiuntiveComponent implements OnInit {
  ambito: string;
  ambitoList: Ambito[];
  infoConfList: ConfigurazioneInformazioneAggiuntiva[];
  messaggioList: Messaggio[];
  showAggiungiInfo = false;
  flgBloccante = false;
  flgVisibile = true;
  configurazione: ConfigurazioneInformazioneAggiuntiva;
  readOnly = false;
  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly gestoreService: GestoreService,
    private readonly utilitiesService: UtilitiesService,
    private readonly businessService: BusinessService
  ) { }

  async ngOnInit() {
    // Initialize mail
    this.ambito = '';
    const op = this.operatoreService.getOperatoreByRuolo();

    const idUtente = op.id_utente;
    const [ambitoList] = await Promise.all([
      this.gestoreService.getAmbiti(idUtente).toPromise(),

    ]);
    this.ambitoList = ambitoList;


  }

  async onAmbitoChange(ambito: string) {
    // Re-init mail

    if (!this.ambito) {
      return;
    }
    this.utilitiesService.showSpinner();
    const [infoConfList] = await Promise.all([
      this.businessService.getConfigurazioniInformazioniAggiuntive(this.ambito, "S").pipe(
        catchError(e => of([] as ConfigurazioneInformazioneAggiuntiva[]))
      ).toPromise()
    ]);

    this.infoConfList = infoConfList;
    this.utilitiesService.hideSpinner();
  }

  onAggiungiInfo() {
    this.showAggiungiInfo = true;
    this.inizializzaConf();

  }

  private inizializzaConf() {
    this.configurazione = {
      bloccante: 'N',
      flag_visibile_pslp: 'S',
      valore: "N"
    };
    this.flgBloccante = false;
    this.flgVisibile = true;
  }

  onModificaInfo(info: ConfigurazioneInformazioneAggiuntiva) {
    this.configurazione = info;
    if (info.flag_visibile_pslp === 'S') {
      this.flgVisibile = true;
    } else {
      this.flgVisibile = false;
    }
    if (info.bloccante === 'S') {
      this.flgBloccante = true;
    } else {
      this.flgBloccante = false;
    }
    this.showAggiungiInfo = true;

  }

  annullaOrSuccessConfig() {
    this.showAggiungiInfo = false;
    this.onAmbitoChange(this.ambito);
    this.inizializzaConf();
  }
}
