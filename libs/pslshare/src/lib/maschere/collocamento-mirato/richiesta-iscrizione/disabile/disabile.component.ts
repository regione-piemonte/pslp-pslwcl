import { AfterContentChecked, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDatepickerNavigateEvent } from '@ng-bootstrap/ng-bootstrap';
import { CategoriaProtettaDisab, ConfigurazioneCollocamentoMirato, Decodifica, DettaglioRichiestaIscrizioneL68, EsitoSaveRichiestaIscrizioneCollocamentoMirato, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, EsitoControlloRichiesta, NavigationEmitter, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel';
import { AppUserService, CommonPslpService, LogService, ParametriSistemaService, UtilitiesService } from '@pslwcl/pslservice';
import moment from 'moment';
import { isNullOrUndefined } from 'util';
import { PslshareService } from '../../../../pslshare.service';
import { WindowState } from '../../dati-graduatoria/dati-graduatoria.component';

@Component({
  selector: 'pslshare-disabile',
  templateUrl: './disabile.component.html',
  styleUrls: ['./disabile.component.css']
})


export class DisabileComponent implements OnInit, AfterContentChecked {
  TIPO_ISCRIZIONE_DISABILI = 'D';

  richiestaSalvata: DettaglioRichiestaIscrizioneL68;
  readOnly: boolean;
  dataChanged = false;
  flagChanging = false;
  popdown: boolean;
  messaggioUtente: string;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  messaggioErroreDati: string;
  titoloPagina = 'Richiesta per il Collocamento Mirato';
  urlUscita: string;
  prevButtonName = 'INDIETRO';
  statoMaschera: WindowState = 'V';
  helpInvaliditaCivile: string;
  helpCollMirato: string;
  helpServiziTerritoriali: string;
  configurazioneCollMirato: ConfigurazioneCollocamentoMirato;
  submitClicked = false;
  idUtente: number;
  disabilitaGradoInvalidita = false;
  disabilitaCategoriaInvalidita = false;
  disabilitaQualificheNonVedenti = true;
  disabilitaVerbaleInvCivile = true;
  disabilitaSituazioneVisitaRevIC = true;
  gradoInvaliditaMin: number = 0;
  dataMinRevisioneVerbaleInvCivile: Date;
  today: Date = new Date();


  meseAnnoRevisioneIC: string;
  meseAnnoRevisioneCM: string;
  firstChangeDataRevIC = true;
  firstChangeDataRevCM = true;

  liste = {
    categorieProtetteDisabili: [],
    categorieInvalidita: [],
    qualificheNonVedenti: [],
    comboSituazioneVisitaRevIC: [],
    messaggi: {}
  };

  disabileModel = {
    grado_invalidita: null,
    cod_categoria_invalidita: null,
    elenco_qualifica_non_vedenti: [],
    verbale_invalidita_civile: {
      data_emissione: null,
      flg_soggetto_a_revisione: null,
      data_prossima_revisione: null
    },
    cod_dichiarazione_visita_revisione_invalidita_civile: null,
    verbale_collocamento_mirato: {
      data_emissione: null,
      flg_soggetto_a_revisione: null,
      data_prossima_revisione: null
    },
    flg_dichiarazione_visita_revisione_collocamento_mirato: null,
    flg_autorizzazione_cpi_prenotazione_visita_collocamento_mirato: null,
    flg_seguito_da_servizi_territoriali: null,
    referente_servizi_territoriali: {
      cognome_referente: null,
      nome_referente: null,
      ente_referente: null,
      email_referente: null,
      telefono_referente: null,
      cellulare_referente: null
    },
    flg_licenziato_in_ultimo_rapporto: undefined
  };

  @ViewChild('formDisabile', { static: false }) formDisabile: NgForm;

  constructor(
    private readonly pslshareService: PslshareService,
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly commonPslpService: CommonPslpService,
    private readonly appUserService: AppUserService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly logService: LogService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.idUtente = this.appUserService.getIdUtente();

    await this.initDati(this.idUtente);
    this.messaggioUtente = this.liste.messaggi['HC072'];

    if (this.richiestaSalvata && this.richiestaSalvata.richiesta_iscrizione_header) {
      this.mapDtoToModel(this.richiestaSalvata);

      if (this.disabileModel.verbale_invalidita_civile && this.disabileModel.verbale_invalidita_civile.data_prossima_revisione) {
        if (this.disabileModel.verbale_invalidita_civile.data_prossima_revisione >= this.dataMinRevisioneVerbaleInvCivile &&
          this.disabileModel.verbale_invalidita_civile.data_prossima_revisione <= this.today) {
            this.disabilitaSituazioneVisitaRevIC = false;
        }
      }
    }

    if (this.richiestaSalvata && this.richiestaSalvata.cod_tipo_iscrizione === this.TIPO_ISCRIZIONE_DISABILI) {
      await this.initDatiDisabile();

      this.initModelsDateMeseAnno(this.richiestaSalvata);

    } else {
      this.router.navigateByUrl('/collocamento-mirato/reddito-richiesta-iscrizione');
    }

    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    this.utilitiesService.hideSpinner();
  }

  private async initDatiDisabile() {
    let categoriaRichiedente: CategoriaProtettaDisab = this.liste.categorieProtetteDisabili.find(
      (el: CategoriaProtettaDisab) => { return el.id_silp === (this.richiestaSalvata.cod_categoria_appartenenza + ''); });

    if (categoriaRichiedente.flg_attivare_grado_o_categoria === 'C') {
      this.disabilitaGradoInvalidita = true;
    } else if (categoriaRichiedente.flg_attivare_grado_o_categoria === 'G') {
      this.disabilitaCategoriaInvalidita = true;

      if (categoriaRichiedente.id_silp === '4') { // non vedenti
        this.disabilitaQualificheNonVedenti = false;
        this.disabilitaGradoInvalidita = true;
        this.disabileModel.grado_invalidita = await this.utilitiesService.getGradoDisabilitaNonVedenti();
      } else if (categoriaRichiedente.id_silp === '5') { // sordomuti
        this.disabilitaGradoInvalidita = true;
        this.disabileModel.grado_invalidita = await this.utilitiesService.getGradoDisabilitaSordomuti();
      } else {
        this.gradoInvaliditaMin = categoriaRichiedente.num_grado_disabilita_min;
      }
    }
  }

  /**
   * Metodo asincrono per il recupero dei dati dai servizi tramite coda di promise
   * @param idUtente
   */
  async initDati(idUtente: number) {
    const [sap, richiestaSalvata,
      dataMinRevisioneVerbaleInvCivile, ME163, ME164, ME165, MI065, MI066] = await Promise.all([
        this.commonPslpService.getSap$(),
        this.commonPslpService.getDettaglioIscrizioneL68$(idUtente),
        this.parametriSistemaService.dataMinRevisioneVerbaleInvCivile,
        this.utilitiesService.getMessage('ME163'),
        this.utilitiesService.getMessage('ME164'),
        this.utilitiesService.getMessage('ME165'),
        this.utilitiesService.getMessage('MI065'),
        this.utilitiesService.getMessage('MI066')
      ]);
    this.sap = sap;
    this.richiestaSalvata = richiestaSalvata;
    this.liste.categorieProtetteDisabili = await this.utilitiesService.getElencoCategoriaProtettaDisabili();
    this.liste.categorieInvalidita = await this.utilitiesService.getElencoCategoriaInvaliditaDisabili();
    this.liste.qualificheNonVedenti = await this.utilitiesService.getElencoQualificheNonVedenti();
    this.liste.comboSituazioneVisitaRevIC = await this.utilitiesService.getElencoDichiarazioneVisitaRevisioneInvaliditaCivile();
    this.dataMinRevisioneVerbaleInvCivile = moment(dataMinRevisioneVerbaleInvCivile, "MM/YYYY").toDate();
    this.liste.messaggi['ME163'] = ME163;
    this.liste.messaggi['ME164'] = ME164;
    this.liste.messaggi['ME165'] = ME165;
    this.liste.messaggi['MI065'] = MI065;
    this.liste.messaggi['MI066'] = MI066;

    const [HC053, HC054, HC055, HC056, HC057, HC058, HC059, HC060, HC061, HC062] = await Promise.all([
      this.utilitiesService.getMessage('HC053'),
      this.utilitiesService.getMessage('HC054'),
      this.utilitiesService.getMessage('HC055'),
      this.utilitiesService.getMessage('HC056'),
      this.utilitiesService.getMessage('HC057'),
      this.utilitiesService.getMessage('HC058'),
      this.utilitiesService.getMessage('HC059'),
      this.utilitiesService.getMessage('HC060'),
      this.utilitiesService.getMessage('HC061'),
      this.utilitiesService.getMessage('HC062')
    ]);
    this.liste.messaggi['HC053'] = HC053;
    this.liste.messaggi['HC054'] = HC054;
    this.liste.messaggi['HC055'] = HC055;
    this.liste.messaggi['HC056'] = HC056;
    this.liste.messaggi['HC057'] = HC057;
    this.liste.messaggi['HC058'] = HC058;
    this.liste.messaggi['HC059'] = HC059;
    this.liste.messaggi['HC060'] = HC060;
    this.liste.messaggi['HC061'] = HC061;
    this.liste.messaggi['HC062'] = HC062;

    const [HC063, HC064, HC065, HC066, HC067, HC072] = await Promise.all([
      this.utilitiesService.getMessage('HC063'),
      this.utilitiesService.getMessage('HC064'),
      this.utilitiesService.getMessage('HC065'),
      this.utilitiesService.getMessage('HC066'),
      this.utilitiesService.getMessage('HC067'),
      this.utilitiesService.getMessage('HC072')
    ]);
    this.liste.messaggi['HC063'] = HC063;
    this.liste.messaggi['HC064'] = HC064;
    this.liste.messaggi['HC065'] = HC065;
    this.liste.messaggi['HC066'] = HC066;
    this.liste.messaggi['HC067'] = HC067;
    this.liste.messaggi['HC072'] = HC072;

  }

  /**
   * metodo per inizializzare il campo di testo che mostra le date in formato MM/AAAA
   * @param richiesta
   */
  initModelsDateMeseAnno(richiesta: DettaglioRichiestaIscrizioneL68) {
    if (richiesta.verbale_invalidita_civile && richiesta.verbale_invalidita_civile.data_prossima_revisione) {
      const data = richiesta.verbale_invalidita_civile.data_prossima_revisione;
      this.meseAnnoRevisioneIC = (data.getMonth() + 1) + '/' + (data.getFullYear());
    }
    if (richiesta.verbale_collocamento_mirato && richiesta.verbale_collocamento_mirato.data_prossima_revisione) {
      const data = richiesta.verbale_collocamento_mirato.data_prossima_revisione;
      this.meseAnnoRevisioneCM = (data.getMonth() + 1) + '/' + (data.getFullYear());
    }
  }

  mapModelToDto(dto: DettaglioRichiestaIscrizioneL68) {
    let campi: string[] = Object.keys(this.disabileModel);
    campi.forEach(el => {
      if (this.disabileModel[el]) {
        dto[el] = this.disabileModel[el];
      }
    });
  }

  mapDtoToModel(dto: DettaglioRichiestaIscrizioneL68) {
    let campi: string[] = Object.keys(this.disabileModel);
    campi.forEach(el => {
      if (dto[el]) {
        this.disabileModel[el] = dto[el];
      }
    });
  }

  isQualificaPresente(codice_ministeriale: string): boolean {
    return !isNullOrUndefined(this.disabileModel.elenco_qualifica_non_vedenti.find(
      (el: Decodifica) => el.codice_ministeriale === codice_ministeriale));
  }

  checkQualifica(element, codice_ministeriale) {
    let qualificaSelezionata: Decodifica = this.liste.qualificheNonVedenti.find((el: Decodifica) => el.codice_ministeriale === codice_ministeriale);
    let index: number = this.disabileModel.elenco_qualifica_non_vedenti.map(e => e.codice_ministeriale)
      .indexOf(qualificaSelezionata.codice_ministeriale);
    if (element.target.checked && index === -1) {
      this.disabileModel.elenco_qualifica_non_vedenti.push(qualificaSelezionata);
    }
    if (!element.target.checked && index > -1) {
      this.disabileModel.elenco_qualifica_non_vedenti.splice(index, 1);
    }
    this.dataChanged = true;
  }

  onChangeSituazioneVisitaIC() {
    if (this.disabileModel.cod_dichiarazione_visita_revisione_invalidita_civile === '2' ||
      this.disabileModel.cod_dichiarazione_visita_revisione_invalidita_civile === '3') {
        this.pslshareService.apriModale('', this.liste.messaggi['MI065'], this.titoloPagina, TypeDialogMessage.Confirm);
      }
  }

  onChangeAutorizzazione() {
    if (this.disabileModel.flg_autorizzazione_cpi_prenotazione_visita_collocamento_mirato === 'S') {
      this.logService.log('[disabile.component] concessa autorizzazione alla prenotazione della visita per il collocamento mirato');
      this.pslshareService.apriModale('', this.liste.messaggi['MI066'], this.titoloPagina, TypeDialogMessage.Confirm);
      // prosegue normalmente
    } else {
      this.pslshareService.apriModale('', this.liste.messaggi['ME165'], this.titoloPagina, TypeDialogMessage.CancelOrConfirm).then(res => {
        this.logService.log('[disabile.component] negata autorizzazione alla prenotazione della visita per il collocamento mirato');
        if (res === 'SI') { this.salvaEdEsci(); }
      });
    }
  }

  onChangeDataRevIC(event: NgbDatepickerNavigateEvent) {
    if (this.firstChangeDataRevIC) {
      this.firstChangeDataRevIC = false;
    } else {
      this.dataChanged = true;
      let mese = event.next.month;
      let anno = event.next.year;
      this.meseAnnoRevisioneIC = mese + '/' + anno;
      let tempData = moment(this.meseAnnoRevisioneIC, "MM/YYYY").toDate();
      this.disabileModel.verbale_invalidita_civile.data_prossima_revisione = tempData;

      if (anno < this.today.getFullYear() || (anno === this.today.getFullYear() && mese <= (this.today.getMonth() + 1))) {
        this.disabilitaSituazioneVisitaRevIC = false;
      } else {
        this.disabilitaSituazioneVisitaRevIC = true;
        this.disabileModel.cod_dichiarazione_visita_revisione_invalidita_civile = null;
        this.richiestaSalvata.cod_dichiarazione_visita_revisione_invalidita_civile = null;
      }
    }
  }

  onChangeDataRevCM(event: NgbDatepickerNavigateEvent) {
    if (this.firstChangeDataRevCM) {
      this.firstChangeDataRevCM = false;
    } else {
      this.dataChanged = true;
      let mese = event.next.month;
      let anno = event.next.year;
      this.meseAnnoRevisioneCM = mese + '/' + anno;
      let tempData = moment(this.meseAnnoRevisioneCM, "MM/YYYY").toDate();
      this.disabileModel.verbale_collocamento_mirato.data_prossima_revisione = tempData;
    }
  }

  resetVerbaleInvCivile() {
    this.disabileModel.verbale_invalidita_civile = {
      data_emissione: this.disabileModel.verbale_invalidita_civile.data_emissione,
      flg_soggetto_a_revisione: this.disabileModel.verbale_invalidita_civile.flg_soggetto_a_revisione,
      data_prossima_revisione: null
    };
    this.disabileModel.cod_dichiarazione_visita_revisione_invalidita_civile = null;
    this.meseAnnoRevisioneIC = null;
    this.disabilitaSituazioneVisitaRevIC = true;

    this.firstChangeDataRevIC = true; // necessario per impedire che il datepicker si ricarichi la data corrente
  }

  resetVerbaleCollMirato() {
    this.disabileModel.verbale_collocamento_mirato = {
      data_emissione: null,
      flg_soggetto_a_revisione: null,
      data_prossima_revisione: null
    };

    this.firstChangeDataRevCM = true; // necessario per impedire che il datepicker si ricarichi la data corrente
  }

  resetDataRevisioneVerbaleCollMirato() {
    this.disabileModel.verbale_collocamento_mirato.data_prossima_revisione = null;
    this.meseAnnoRevisioneCM = null;
    this.firstChangeDataRevCM = true; // necessario per impedire che il datepicker si ricarichi la data corrente
  }

  resetAutorizzazioneCpi() {
    this.disabileModel.flg_autorizzazione_cpi_prenotazione_visita_collocamento_mirato = null;
    this.richiestaSalvata.flg_autorizzazione_cpi_prenotazione_visita_collocamento_mirato = null;
  }

  resetReferenteServiziTerritoriali() {
    this.disabileModel.referente_servizi_territoriali = {
      cognome_referente: null,
      nome_referente: null,
      ente_referente: null,
      email_referente: null,
      telefono_referente: null,
      cellulare_referente: null
    };
  }

  isValidData(): boolean {
    const valido = !this.flagChanging
      && this.sap
      && (this.commonPslpService.wizard || this.dataChanged);
    return valido;
  }

  /**
   * Non possono esistere flag a null, quindi vengono impostati a 'N' nel caso lo siano
   * @param obj
   */
  verificaFlag(obj: DettaglioRichiestaIscrizioneL68) {
    let flags: Array<string> = [
      'flg_autorizzazione_cpi_prenotazione_visita_collocamento_mirato',
      'flg_seguito_da_servizi_territoriali',
      'flg_licenziato_in_ultimo_rapporto'];

    flags.forEach((key: string) => {
      if (isNullOrUndefined(obj[key])) { obj[key] = 'N'; }
    });
  }

  verificaDataRevIC(nav: NavigationEmitter): EsitoControlloRichiesta {
      let esito: EsitoControlloRichiesta = {
            errore: false
          };
      if (this.disabileModel.verbale_invalidita_civile
         && this.disabileModel.verbale_invalidita_civile.data_prossima_revisione
         && this.disabileModel.verbale_invalidita_civile.data_prossima_revisione < this.dataMinRevisioneVerbaleInvCivile) {
          const msg = this.liste.messaggi['ME163'].replace('{0}', moment(this.dataMinRevisioneVerbaleInvCivile).format('MM/YYYY'));

          const esitoDid: EsitoControlloRichiesta = {
            errore: true,
            proporreModale: true,
            msgDaProporre: '',
            msgAggiuntivoModale: msg,
            titoloModale: this.titoloPagina,
            tipoMessaggioDaProporre: TypeDialogMessage.CancelOrConfirm,
            seModaleSiSalva: true,
            seModaleNoRestaSullaPagina: true,
            urlDaSeguireSeModaleSi: '/collocamento-mirato/riepilogo',

          };
          esito = esitoDid;
        }

        return esito;
  }

  verificaGradoInvalidita(richiesta: DettaglioRichiestaIscrizioneL68): EsitoControlloRichiesta   {
    let esito: EsitoControlloRichiesta = {
      errore: false
    };

    /** nel caso in cui venga inserito il grado di invalidita bisogna controllare che il valore sia
      * compreso nei limiti previsti
      *
      */
     if (!isNullOrUndefined(this.disabileModel.grado_invalidita) &&
      (this.disabileModel.grado_invalidita > 100 || this.disabileModel.grado_invalidita < this.gradoInvaliditaMin)) {
         const msg = "Il valore numerico del Grado di Invalidità Civile deve essere compreso tra " + this.gradoInvaliditaMin + ' e 100';


          const esitoDid: EsitoControlloRichiesta = {
            errore: true,
            proporreModale: true,
            msgDaProporre: '',
            msgAggiuntivoModale: msg,
            titoloModale: this.titoloPagina,
            tipoMessaggioDaProporre: TypeDialogMessage.Confirm,
            seModaleSiSalva: false,
            seModaleNoRestaSullaPagina: false,

          };
          esito = esitoDid;

     }
     return esito;
  }

  /**
   * verifica il flag di autorizzazione alla prenotazione della visita per il CM da parte del cpi
   * @returns
   */
  verificaAutorizzazioneCpi(nav: NavigationEmitter): EsitoControlloRichiesta  {

    let esito: EsitoControlloRichiesta = {
      errore: false
    };
    if (this.disabileModel.flg_dichiarazione_visita_revisione_collocamento_mirato === 'N' &&
      this.disabileModel.flg_autorizzazione_cpi_prenotazione_visita_collocamento_mirato === 'N') {

          this.logService.log('[disabile.component] negata autorizzazione alla prenotazione della visita per il collocamento mirato');
          const esitoDid: EsitoControlloRichiesta = {
            errore: true,
            proporreModale: true,
            msgDaProporre: '',
            msgAggiuntivoModale: this.liste.messaggi['ME165'],
            titoloModale: this.titoloPagina,
            tipoMessaggioDaProporre: TypeDialogMessage.CancelOrConfirm,
            seModaleSiSalva: true,
            seModaleNoRestaSullaPagina: true,
            urlDaSeguireSeModaleSi: '/collocamento-mirato/riepilogo',
          };
          esito = esitoDid;
    }
    return esito;
  }

  /**
    * Determines whether exit page on
    * @param nav NavigationEmitter
    *
    */
  async onExitPage(nav: NavigationEmitter) {
      // flag per segnalare effettuato tentativo di salvataggio
      let tentatoSalvataggio = false;

      // imposto esito positivo per l'ultimo controllo sul cambio pagina
      let esitoSalva: EsitoSaveRichiestaIscrizioneCollocamentoMirato = {
        esitoPositivo: true
      };
    try {
      if (this.isIndietroOrUscita(nav)) {
        const res = await this.pslshareService.richiestaFinestraModale(this.commonPslpService.modaleIndietroCOMI(this.titoloPagina));
        if (res === 'NO') {
          return;
        }
        this.router.navigateByUrl(nav.url);
      } else if (this.isAvantiOrSalva(nav)) {

          /*
           * non controlla dataChanged
           * per effettuare comunque i controlli che richiedono validazione
           * e eventuali conferme dall'utente
           */
          this.mapModelToDto(this.richiestaSalvata);

          const esitoCtl = await  this.verificaRichiesta(this.richiestaSalvata, nav);
          if (esitoCtl.errore && esitoCtl.proporreModale) {
            const finestra: DialogModaleMessage = {
            titolo: this.titoloPagina,
            messaggio: esitoCtl.msgDaProporre,
            messaggioAggiuntivo: esitoCtl.msgAggiuntivoModale,
            tipo: esitoCtl.tipoMessaggioDaProporre,
            }
            const res = await this.pslshareService.richiestaFinestraModale( finestra );
            if (res === "SI") {
                if (esitoCtl.seModaleSiSalva) {
                  tentatoSalvataggio = true;
                  esitoSalva  = await this.salvaRichiesta();
                }
                if (esitoCtl.urlDaSeguireSeModaleSi) {
                  nav.url = esitoCtl.urlDaSeguireSeModaleSi;
                } else {
                  esitoSalva.esitoPositivo = false;
              }
            } else if (res === "NO") {
              if (esitoCtl.urlDaSeguireSeModaleNo) {
                  nav.url = esitoCtl.urlDaSeguireSeModaleNo;
              } else {
                esitoSalva.esitoPositivo = false;
              }
            }
        } else if (esitoCtl.errore) {
          esitoSalva.messaggioCittadino = esitoCtl.msgDaProporre;
        } else if (this.dataChanged) {
            this.utilitiesService.showSpinner();
            tentatoSalvataggio = true;
            esitoSalva  = await this.salvaRichiesta();
        }
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, this.titoloPagina);
    }
     /*
        *  controllare esito
        */
    if (tentatoSalvataggio) {
      if (esitoSalva.esitoPositivo) {
        this.commonPslpService.setRichiestaIscrizioneStorage(esitoSalva.richiesta);
        this.utilitiesService.hideSpinner();
        this.utilitiesService.showToastrInfoMessage('salvataggio effettuato', 'richiesta Iscrizione');
      } else {
        this.utilitiesService.hideSpinner();
        this.pslshareService.apriModale( esitoSalva.messaggioCittadino, "", this.titoloPagina, TypeDialogMessage.Confirm);
      }
    }
    if (esitoSalva.esitoPositivo) {
        const urlUscita = nav.url;
        this.router.navigateByUrl(urlUscita);
    }
  }

  async salvaRichiesta(): Promise<EsitoSaveRichiestaIscrizioneCollocamentoMirato> {
    this.toUpperCaseReferente();
    this.richiestaSalvata.tipo_operazione = "A";

    const esito = await this.commonPslpService.saveRichiestaIscrizione(this.idUtente, this.richiestaSalvata, '2');
    return esito;
  }

  async verificaRichiesta(richiesta: DettaglioRichiestaIscrizioneL68, nav: NavigationEmitter): Promise<EsitoControlloRichiesta> {

    let  esito = this.verificaGradoInvalidita(richiesta);
    if (!esito.errore) {
       esito = this.verificaDataRevIC(nav);
    }
    if (!esito.errore) {
      const esitoCPi = this.verificaAutorizzazioneCpi(nav);
      esito = esitoCPi;
    }

    return esito;
  }


  async salvaEdEsci() {

      try {
        this.utilitiesService.showSpinner();
        this.mapModelToDto(this.richiestaSalvata);
        // this.verificaFlag(this.richiestaSalvata);
        this.toUpperCaseReferente();
        this.richiestaSalvata.tipo_operazione = "A";
        let esito = await this.commonPslpService.saveRichiestaIscrizione(this.idUtente, this.richiestaSalvata, '2');

        if (esito.esitoPositivo) {
          this.commonPslpService.setRichiestaIscrizioneStorage(esito.richiesta);
          this.utilitiesService.showToastrInfoMessage('salvataggio effettuato', 'richiesta Iscrizione');
          this.router.navigateByUrl('/collocamento-mirato/riepilogo');
        } else {
          this.pslshareService.apriModale(esito.messaggioCittadino, "", this.titoloPagina, TypeDialogMessage.Confirm);
        }
      } catch (e) {
        this.utilitiesService.showToastrErrorMessage(e.message, this.titoloPagina);
      } finally {
        this.utilitiesService.hideSpinner();
      }

  }


  private toUpperCaseReferente() {
    if (!isNullOrUndefined(this.richiestaSalvata.referente_servizi_territoriali)) {
      if (!isNullOrUndefined(this.richiestaSalvata.referente_servizi_territoriali.cognome_referente)) {
        this.richiestaSalvata.referente_servizi_territoriali.cognome_referente = this.richiestaSalvata.referente_servizi_territoriali.cognome_referente.toUpperCase();
      }
      if (!isNullOrUndefined(this.richiestaSalvata.referente_servizi_territoriali.nome_referente)) {
        this.richiestaSalvata.referente_servizi_territoriali.nome_referente = this.richiestaSalvata.referente_servizi_territoriali.nome_referente.toUpperCase();
      }
      if (!isNullOrUndefined(this.richiestaSalvata.referente_servizi_territoriali.ente_referente)) {
        this.richiestaSalvata.referente_servizi_territoriali.ente_referente = this.richiestaSalvata.referente_servizi_territoriali.ente_referente.toUpperCase();
      }
    }
  }

  /**
   * Determines whether flag changing on
   * @param value boolean
   */
  onFlagChanging(value: boolean) {
    this.flagChanging = value;
  }

  /**
   * Determina se avanti o  salva  e in questa pagina non controlla se i dati sono modificati
   * @param nav NavigationEmitter
   * @returns boolean
   */
  private isAvantiOrSalva(nav: NavigationEmitter) {
    return (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save);
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
    if (this.urlUscita.startsWith('/fascicolo-')) {
      this.commonPslpService.restoreStorageFascicolo();
    } else {
      this.commonPslpService.azzeraStorageFascicolo();
    }
    this.router.navigateByUrl(this.urlUscita);
  }

  ngAfterContentChecked(): void {

    if (this.formDisabile) {
       if (this.formDisabile.dirty && !this.dataChanged) {
          this.dataChanged = true;
          this.logService.log('userUtente-------------> ');
       }
    }
  }

}
