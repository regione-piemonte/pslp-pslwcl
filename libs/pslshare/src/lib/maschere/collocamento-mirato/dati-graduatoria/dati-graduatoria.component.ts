import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigurazioneFamiliariACarico, Decodifica, DettaglioCompletoDichiarazioneFamiliariACarico, EsitoRiepilogoCollocamentoMirato, RedditoCollocamentoMirato } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

import { Ambito, NavigationEmitter, DialogModaleMessage, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, ParametriSistemaService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';
import { PslshareService } from '../../../pslshare.service';
import { DettaglioRedditoComponent } from './dettaglio-reddito/dettaglio-reddito.component';
import { FamigliariACaricoComponent } from './famigliari-a-carico/famigliari-a-carico.component';

const TITOLO_PAGINA = "Dati graduatoria";
const REDDITO_MASSIMO = "Reddito massimo";
const REDDITO_COLLOCAMENTO_MIRATO = 'reddito collocamento mirato';
const TITOLO_PAGINA_REDDITO = 'Dichiarazione Reddito';
const TITOLO_PAGINA_DICHIARAZIONE = 'Dichiarazione Familiari a Carico';
const REDDITO_MAX_DA_SILP = '999999.99';

declare var $: any;
/* Rappresenta lo stato della maschera rispetto al singolo elemento selezionato
   I Inserimento, U Modifica, V visualizzazione */
export type WindowState = 'I' | 'V' | 'U';

@Component({
  selector: 'pslshare-dati-graduatoria',
  templateUrl: './dati-graduatoria.component.html',
  styleUrls: ['./dati-graduatoria.component.css']
})
export class DatiGraduatoriaComponent implements OnInit, OnDestroy {
  msgMI029: string;
  redditoChanged: boolean;
  msgME128: string;
  idUtente: number;
  isOperatore = false;

  constructor(
    private readonly commonFCService: CommonPslpService,
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly utilitiesService: UtilitiesService,
    private readonly pslbasepageService: PslshareService,
    private readonly parametriSistemaService: ParametriSistemaService
  ) { }

  private readonly subscriptions = [] as Array<Subscription>;
  isRichiestaIscrizione = false;
  readOnly: boolean;
  redditoChanging = false;
  familiariChanging = false;
  checkInformativaPrivacy: boolean;
  testoBenvenuto: string;
  messaggioUtente: string;
  completeNavigation: boolean;
  redditoSelezionato: RedditoCollocamentoMirato;
  dichiarazioneSelezionata: DettaglioCompletoDichiarazioneFamiliariACarico;
  statoMaschera: WindowState = 'V';
  prevButtonName = 'INDIETRO';
  private msgImpossibileAnnullareReddito: string;
  private msgReddidoScompareDaElenco: string;
  private msgConfermaElimina: string;
  private maxRedditoCollMirato: string;
  private msgNoDettaglioFamiliariACarico: string;
  private msgDettaglioFamiliariACaricoNonCaricati: string;
  private msgRedditoAnnullaOk: string;
  erroreDettaglioFamiliariPadre: string;
  titoloPagina: string;
  possoModificareEsisteIscrizioneValida = false;
  provinciaAttivaDaRecuperarePerNuovoReddito: Decodifica;
  cpiAttivoDaRecuperarePerNuovaDichiarazione: Decodifica;
  sap: string;
  riepilogoCOMI: EsitoRiepilogoCollocamentoMirato;
  configurazioneFamiliariCarico: ConfigurazioneFamiliariACarico;
  flagChanging: any;
  dataChanged: boolean;
  isAggiornamento: boolean;
  isVisualizza: boolean;
  updateIndex: number;
  annoInCorso: string;
  annoDichiarazione: string;
  indiceSelezionato = -1;
  now = moment(new Date()).startOf('day');
  year = moment().format('YYYY');
  year1 = moment().subtract(1, 'years').format('YYYY');
  isDuplicazioneDic = false;

  loaded = false;

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.titoloPagina = TITOLO_PAGINA;
    const [msgImpossibileAnnullareReddito,
      msgReddidoScompareDaElenco,
      msgConfermaElimina,
      msgNoDettaglioFamiliariACarico,
      msgDettaglioFamiliariACaricoNonCaricati,
      msgRedditoAnnullaOk,
      msgMI029,
      msgME128
    ] = await Promise.all([
      this.utilitiesService.getMessage('ME118'),
      this.utilitiesService.getMessage('ME119'),
      this.utilitiesService.getMessage('ME087'),
      this.utilitiesService.getMessage('ME117'),
      this.utilitiesService.getMessage('ME121'),
      this.utilitiesService.getMessage('ME125'),
      this.utilitiesService.getMessage("MI029"),
      this.utilitiesService.getMessage("ME128")
    ]);
    this.msgRedditoAnnullaOk = msgRedditoAnnullaOk;
    this.msgNoDettaglioFamiliariACarico = msgNoDettaglioFamiliariACarico;
    this.msgDettaglioFamiliariACaricoNonCaricati = msgDettaglioFamiliariACaricoNonCaricati;
    this.msgMI029 = msgMI029;
    this.msgME128 = msgME128;
    this.maxRedditoCollMirato = (await this.parametriSistemaService.maxRedditoCollMirato);
    this.msgImpossibileAnnullareReddito = msgImpossibileAnnullareReddito;
    this.msgReddidoScompareDaElenco = msgReddidoScompareDaElenco;
    this.msgConfermaElimina = msgConfermaElimina;
    this.commonFCService.AMBITO = Ambito.COMI;

    const operatore = this.appUserService.getOperatore();
    if (!isNullOrUndefined(operatore)) {
      this.isOperatore = true;
    }
    this.idUtente = this.appUserService.getIdUtente();


    this.riepilogoCOMI = await this.commonFCService.getCollocamentoMirato(this.idUtente);

    if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneDisabili)) {
      if (!this.riepilogoCOMI.iscrizioneDisabili.statoFinale) {
        this.possoModificareEsisteIscrizioneValida = true;
        this.provinciaAttivaDaRecuperarePerNuovoReddito = this.riepilogoCOMI.iscrizioneDisabili.provincia;
        if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneDisabili.cpi)) {
          this.cpiAttivoDaRecuperarePerNuovaDichiarazione = this.riepilogoCOMI.iscrizioneDisabili.cpi;
        }
      }
    }
    if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneAltreCategorie)) {
      if (!this.riepilogoCOMI.iscrizioneAltreCategorie.statoFinale) {
        this.possoModificareEsisteIscrizioneValida = true;
        this.provinciaAttivaDaRecuperarePerNuovoReddito = this.riepilogoCOMI.iscrizioneAltreCategorie.provincia;
        if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneAltreCategorie.cpi)) {
          this.cpiAttivoDaRecuperarePerNuovaDichiarazione = this.riepilogoCOMI.iscrizioneAltreCategorie.cpi;
        }
      }
    }

    this.readOnly = this.commonFCService.readOnlyCM;
    this.redditoSelezionato = null;
    this.dichiarazioneSelezionata = null;
    this.loaded = true;
    this.utilitiesService.hideSpinner();
    if (!this.possoModificareEsisteIscrizioneValida) {
      const data: DialogModaleMessage = {
        titolo: "Dati Graduatoria Collocamento Mirato",
        messaggio: this.msgME128,
        messaggioAggiuntivo: "",
        tipo: TypeDialogMessage.Confirm,
      };
      const res = await this.pslbasepageService.richiestaFinestraModale(data);
      this.readOnly = true;
    }
  }

  private sortAnno = function (a: any, b: any) {
    return a.anno_validita.toString().localeCompare(a.anno_validita.toString());
  };

  private sortIdDichiarazione = function (a: any, b: any) {
    return a.id_dichiarazione.toString().localeCompare(a.id_dichiarazione.toString());
  };

  redditoEditState(value: boolean) {
    this.redditoChanging = value;
  }

  familiariEditState(value: boolean) {
    this.familiariChanging = value;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Gets valore
   * @param el RedditoCollocamentoMirato
   * @returns valore
   */
  getValore(el: RedditoCollocamentoMirato): string {
    let valore = "n/a";
    if (el.valore === REDDITO_MAX_DA_SILP) {
      valore = REDDITO_MASSIMO;
    } else if (!isNullOrUndefined(el.valore)) {
      const valoreIn = el.valore.replace(',', '.');
      if (this.isNumber(valoreIn)) {
        valore = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(valoreIn));
      } else {
        valore = el.valore + " €";
      }
    }
    return valore;
  }

  /**
   * Gets intermediata
   * @param el RedditoCollocamentoMirato
   * @returns intermediata
   */
  getIntermediata(el: any): string {
    let risult = "n/a";
    if (el.fonte === 'SILP') {
      risult = 'SI';
    } else if (!isNullOrUndefined(el.fonte)) {
      risult = 'NO';
    }
    return risult;
  }

  /**
   * Redditos annullabile
   * @param el RedditoCollocamentoMirato
   * @returns true if annullabile
   */
  redditoAnnullabile(el: RedditoCollocamentoMirato): boolean {
    const annoAttuale: number = +this.year1;
    if (!isNullOrUndefined(el.anno) && !isNullOrUndefined(el.fonte) &&
      el.anno === annoAttuale) {
      return true;
    }
    return false;
  }
  /**
   * Gets intermediario
   * @param el RedditoCollocamentoMirato
   * @returns intermediario
   */
  getIntermediario(el: any): string {
    let risult = '';
    if (!isNullOrUndefined(el.cpi)) {
      risult = el.cpi.descrizione;
    }
    return risult;
  }

  /**
   * Determines whether number is
   */
  isNumber = function (num) {
    const n = Number(num);
    if (typeof (n) === 'number' && !isNaN(n)) {
      return true;
    }
    return false;
  };

  /**
   * Determines whether visualizza reddito on
   * @param el RedditoCollocamentoMirato
   */
  onVisualizzaReddito(el: RedditoCollocamentoMirato) {
    this.indiceSelezionato = this.riepilogoCOMI.redditi.findIndex(esp => esp === el);
    this.statoMaschera = 'V';
    this.redditoSelezionato = UtilitiesService.clone(el);
    if (!isNullOrUndefined(this.redditoSelezionato.note)) {
      this.redditoSelezionato.note = this.redditoSelezionato.note.toUpperCase();
    }
    this.annoDichiarazione = '' + (this.redditoSelezionato.anno);
    if (this.redditoSelezionato.valore === REDDITO_MAX_DA_SILP) {
      this.redditoSelezionato.valore = REDDITO_MASSIMO;
    } else {
      const valoreIn = this.redditoSelezionato.valore.replace(',', '.');
      if (this.isNumber(valoreIn)) {
        this.redditoSelezionato.valore = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(valoreIn));
      } else {
        this.redditoSelezionato.valore += " €";
      }
    }
    this.isAggiornamento = false;
    this.isVisualizza = true;
    this.redditoEditState(false);
    this.familiariEditState(true);
    this.utilitiesService.scrollTo(DettaglioRedditoComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether visualizza dichiarazione on
   * @param el DettaglioCompletoDichiarazioneFamiliariACarico
   */
  async onVisualizzaDichiarazione(el: DettaglioCompletoDichiarazioneFamiliariACarico) {
    this.indiceSelezionato = this.riepilogoCOMI.dettaglioCompletoDichiarazioneFamiliariACarico.findIndex(esp => esp === el);
    this.statoMaschera = 'V';
    this.dichiarazioneSelezionata = UtilitiesService.clone(el);

    if (!isNullOrUndefined(this.dichiarazioneSelezionata.note)) {
      this.dichiarazioneSelezionata.note = this.dichiarazioneSelezionata.note.toUpperCase();
    }

    this.isAggiornamento = false;
    this.isVisualizza = true;
    this.isDuplicazioneDic = false;

    if (this.dichiarazioneSelezionata.numero_familiari > 0
      && (isNullOrUndefined(this.dichiarazioneSelezionata.dettaglio_dichiarazione_familiari_a_carico)
        || this.dichiarazioneSelezionata.dettaglio_dichiarazione_familiari_a_carico.length === 0)) {
      this.erroreDettaglioFamiliariPadre = this.msgDettaglioFamiliariACaricoNonCaricati;
    } else if (this.dichiarazioneSelezionata.numero_familiari === 0) {
      this.erroreDettaglioFamiliariPadre = this.msgNoDettaglioFamiliariACarico;
    } else {
      this.erroreDettaglioFamiliariPadre = "";
    }
    this.redditoEditState(true);
    this.familiariEditState(false);
    this.utilitiesService.scrollTo(FamigliariACaricoComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether duplica dichiarazione on
   * @param el DettaglioCompletoDichiarazioneFamiliariACarico
   */
  async onDuplicaDichiarazione(el: DettaglioCompletoDichiarazioneFamiliariACarico) {
    this.erroreDettaglioFamiliariPadre = "";
    this.statoMaschera = 'I';
    this.dichiarazioneSelezionata = UtilitiesService.clone(el);
    // aggiunto flag per indicare tramite log che la  dichiarazione è stata duplicata
    this.dichiarazioneSelezionata.flag_duplicazione_dichiarazione = true;

    let utente = this.appUserService.getUtente();
    if (this.isOperatore) {
      utente = this.appUserService.getUtenteSimulato();
    }

    this.annoInCorso = this.year;
    this.dichiarazioneSelezionata.anno_validita = parseInt(this.annoInCorso, 10);
    this.dichiarazioneSelezionata.data_dichiarazione = this.now.toDate();
    this.dichiarazioneSelezionata.fonte = 'PSLP';
    this.dichiarazioneSelezionata.cpi = {};
    this.dichiarazioneSelezionata.id_sil_lav_anagrafica = utente.id_sil_lav_anagrafica;
    if (this.dichiarazioneSelezionata.numero_familiari === 0) {
      this.dichiarazioneSelezionata.numero_familiari = null;
    }
    this.dichiarazioneSelezionata.note = "";
    this.isAggiornamento = false;
    this.isVisualizza = false;
    this.redditoEditState(true);
    this.familiariEditState(false);
    this.isDuplicazioneDic = true;
    this.utilitiesService.scrollTo(FamigliariACaricoComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether annullamento reddito on
   * @param ilReddito RedditoCollocamentoMirato
   *
   */
  async onAnnullamentoReddito(ilReddito: RedditoCollocamentoMirato) {
    this.updateIndex = this.riepilogoCOMI.redditi.findIndex(esp => esp === ilReddito);
    if (ilReddito.fonte === "PSLP") {
      const data: DialogModaleMessage = {
        titolo: TITOLO_PAGINA,
        tipo: TypeDialogMessage.YesOrNo,
        messaggio: this.msgConfermaElimina,
        messaggioAggiuntivo: this.msgReddidoScompareDaElenco
      };
      const res = await this.pslbasepageService.richiestaFinestraModale(data);
      if (res === 'NO') {
        return;
      }
      this.statoMaschera = 'U';
      this.redditoSelezionato = UtilitiesService.clone(ilReddito);
      this.isAggiornamento = false;
      this.isVisualizza = false;
      const esito = await this.commonFCService.annullamentoRedditoCollocamentoMirato(this.appUserService.getIdUtente(), this.redditoSelezionato);
      this.utilitiesService.showSpinner();

      this.riepilogoCOMI.redditi = this.riepilogoCOMI.redditi.filter((el, idx) => idx !== this.updateIndex);
      this.redditoSelezionato = null;
      this.flagChanging = false;
      if (!isNullOrUndefined(esito) && !isNullOrUndefined(esito.messaggio_errore)) {
        this.utilitiesService.showToastrErrorMessage(esito.messaggio_errore, REDDITO_COLLOCAMENTO_MIRATO);
      } else {
        this.riepilogoCOMI = await this.commonFCService.getCollocamentoMirato(this.appUserService.getIdUtente());
        this.utilitiesService.showToastrInfoMessage(this.msgRedditoAnnullaOk, REDDITO_COLLOCAMENTO_MIRATO);
      }
      this.utilitiesService.hideSpinner();

    } else {
      const data: DialogModaleMessage = {
        titolo: TITOLO_PAGINA,
        tipo: TypeDialogMessage.Annulla,
        messaggio: this.msgImpossibileAnnullareReddito,
        messaggioAggiuntivo: ""
      };
      return await this.pslbasepageService.richiestaFinestraModale(data);
    }
  }

  /**
   * Determines whether valid data is
   * @returns true if valid data
   */
  isValidData(): boolean {
    const valido = !this.flagChanging
      && this.riepilogoCOMI
      && (this.commonFCService.wizard || this.dataChanged);
    return valido;
  }

  /**
   * Panels reddito
   * @returns true if reddito
   */
  panelReddito(): boolean {
    return this.redditoChanging;
  }
  /**
   * Panels familiari
   * @returns true if familiari
   */
  panelFamiliari(): boolean {
    return this.familiariChanging;
  }

  /**
   * Determines whether nuovo reddito on
   */
  onNuovoReddito() {
    this.annoInCorso = this.year;
    this.annoDichiarazione = this.year1;
    this.redditoSelezionato = {
      anno: parseInt(this.annoDichiarazione, 10),
      dataInserimento: this.now.toDate(),
      fonte: 'PSLP',
      provincia: this.provinciaAttivaDaRecuperarePerNuovoReddito
    };
    this.statoMaschera = 'I';
    this.flagChanging = true;
    this.isAggiornamento = false;
    this.isVisualizza = false;
    this.updateIndex = -1;
    this.redditoEditState(false);
    this.familiariEditState(true);
    this.utilitiesService.scrollTo(DettaglioRedditoComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether nuova dichiarazione on
   */
  onNuovaDichiarazione() {
    this.erroreDettaglioFamiliariPadre = "";
    this.annoInCorso = this.year;

    let utente = this.appUserService.getUtente();
    if (this.isOperatore) {
      utente = this.appUserService.getUtenteSimulato();
    }


    this.dichiarazioneSelezionata = {
      anno_validita: parseInt(this.annoInCorso, 10),
      data_dichiarazione: this.now.toDate(),
      fonte: 'PSLP',
      id_sil_lav_anagrafica: utente.id_sil_lav_anagrafica,
      cpi: {}
    };
    this.dichiarazioneSelezionata.flag_duplicazione_dichiarazione = false;
    this.statoMaschera = 'I';
    this.flagChanging = true;
    this.isAggiornamento = false;
    this.isVisualizza = false;
    this.updateIndex = -1;
    this.redditoEditState(true);
    this.familiariEditState(false);
    this.isDuplicazioneDic = false;
    this.utilitiesService.scrollTo(FamigliariACaricoComponent.SCROLL_TARGET);
  }

  /**
   * Determines whether flag changing on
   * @param flg boolean
   */
  onFlagChanging(flg: boolean) {
    this.flagChanging = flg;
  }

  /**
   * recupera dal form del figlio informazione se i dati sono cambiati
   * @param flg boolean
   */
   onFormRedditoChanged(flg: boolean) {
    this.redditoChanged = flg;
  }


  /**
   * Determines whether annulla dettaglio on
   */
  onAnnullaDettaglio() {
    this.erroreDettaglioFamiliariPadre = "";
    this.statoMaschera = 'V';
    this.redditoSelezionato = null;
    this.dichiarazioneSelezionata = null;
    this.flagChanging = false;
  }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   *
   */
  async onExitPage(nav: NavigationEmitter) {
    if (this.statoMaschera === 'I') {
      let titoloPagina: string;
      if (isNullOrUndefined(this.redditoSelezionato)) {
        titoloPagina = TITOLO_PAGINA_DICHIARAZIONE;
      } else {
        titoloPagina = TITOLO_PAGINA_REDDITO;
      }
      const data: DialogModaleMessage = {
        titolo: titoloPagina,
        tipo: TypeDialogMessage.YesOrNo,
      };
      const res = await this.pslbasepageService.richiestaFinestraModale(data);
      if (res === 'NO') {
        return;
      }
    }
    const urlUscita = nav.url;
    this.router.navigateByUrl(urlUscita);
  }
}
