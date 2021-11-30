import { AfterContentChecked, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BusinessService, CategoriaProtetta, CentroPerImpiego, DettaglioRichiestaIscrizioneL68, EsitoDettaglioDid, EsitoRiepilogoCollocamentoMirato, EsitoSaveRichiestaIscrizioneCollocamentoMirato, Indirizzo, IscrizioneCollocamentoMirato, Provincia, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, EsitoControlloRichiesta, NavigationEmitter, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { map } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { PslshareService } from '../../../../pslshare.service';

type WindowState = 'I' | 'V' | 'U';
@Component({
  selector: 'pslshare-richiesta',
  templateUrl: './richiesta.component.html',
  styleUrls: ['../richiesta-iscrizione.component.css']
})


export class RichiestaComponent implements OnInit, AfterContentChecked {

  STATO_BOZZA = 'B';
  TIPO_ISCRIZIONE_DISABILI = 'D';
  TIPO_ISCRIZIONE_ALTRE_CATEGORIE = 'A';
  STATO_DID_CONVALIDATA = 'C';
  STATO_DID_ISCRITTA = 'I';
  STATO_DID_SOSPESA = 'S';

  readOnly: boolean;
  submitClicked  = false;
  dataChanged = false;
  flagChanging = false;
  messaggioUtente: string;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName = 'PROSEGUI';
  messaggioErroreDati: string;
  titoloPagina = 'Richiesta per il Collocamento Mirato';
  intestazionePagina: string;
  urlUscita: string;
  prevButtonName = 'INDIETRO';
  statoMaschera: WindowState = 'V';
  isIscritto = false;
  iscrizioneAttiva = false;
  isBozza = false;
  idUtente: number;
  popdown: boolean;
  helpMessage = '';
  richiestaIscrizioneCm: DettaglioRichiestaIscrizioneL68;
  riepilogoCOMI: EsitoRiepilogoCollocamentoMirato;
  cpiProvincia: CentroPerImpiego[];
  indirizzoEdit = true;
  domicilioTrasferimento: Indirizzo = {} as Indirizzo;
  domicilioValido = false;
  msgCpiRichiesta: string;
  today: Date = new Date();

  bloccoCpiDomNonDisponibile = false;
  bloccoCpiResNonDisponibile = false;


  cod_tipo_iscrizione: string;
  richiestaModel = {
    cod_tipo_iscrizione: null,
    cod_motivo_richiesta: null,
    data_ultima_iscrizione: null,
    cod_categoria_appartenenza: null,
    id_provincia: null,
    id_provincia_ultima_iscrizione: null,
    flg_prima_iscrizione: null,
    id_cpi: null,
    id_cpi_ultima_iscrizione: null,
    domicilio_trasferimento: {}
  };

  @ViewChild('formRichiesta', { static: false }) formRichiesta: NgForm;

  liste = {
    tipiIscrizione: [],
    motiviIscrizione: [],
    categorie: [],
    province: [],
    listaCpi: [],
    messaggi: {}
  };
  did: EsitoDettaglioDid;
  isOperatore = false;

  get isTrasferimento() {
    if (this.riepilogoCOMI) {
      return this.utilitiesService.isIscrizioneAttiva(this.riepilogoCOMI);
    } else {
      return false;
    }
  }

  constructor(
    private readonly pslshareService: PslshareService,
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly commonPslpService: CommonPslpService,
    private readonly storageService: SessionStorageService,
    private readonly businessService: BusinessService,
    private readonly appUserService: AppUserService,
    private readonly logService: LogService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    const operatore = this.appUserService.getOperatore();
    if (!isNullOrUndefined(operatore)) {
      this.isOperatore = true;
    }
    this.idUtente = this.appUserService.getIdUtente();

    await this.initDati(this.idUtente);
    this.messaggioUtente = this.liste.messaggi['HC071'];

    this.isIscritto = this.commonPslpService.isIscritto(this.riepilogoCOMI);
    this.intestazionePagina = ": Iscrizione in Piemonte";
    if (this.isIscritto) {
      this.richiestaModel.flg_prima_iscrizione = false;
      this.iscrizioneAttiva = this.utilitiesService.isIscrizioneAttiva(this.riepilogoCOMI);

      if (this.iscrizioneAttiva) {
        this.intestazionePagina = ": Trasferimento Iscrizione in un'altra Provincia in Piemonte";
        await this.recuperaDatiUltimaIscrizione(this.getIscrizioneAttiva(this.riepilogoCOMI));
        this.msgCpiRichiesta = this.liste.messaggi['MI063'];
      } else {

        const domicilio: Indirizzo = this.sap.domicilio;
        this.richiestaModel.id_provincia = domicilio.comune.provincia.codice_ministeriale;
        this.richiestaModel.id_cpi = (await this.utilitiesService.getCpiDelComune(domicilio.comune.codice_ministeriale)).id_cpi_silp;
        this.msgCpiRichiesta = this.liste.messaggi['MI064'];
        await this.recuperaDatiUltimaIscrizione(this.getUltimaIscrizioneChiusa(this.riepilogoCOMI));
      }
    }


    if (this.richiestaIscrizioneCm && this.richiestaIscrizioneCm.richiesta_iscrizione_header) {
      this.isBozza = !isNullOrUndefined(this.richiestaIscrizioneCm.richiesta_iscrizione_header.cod_stato_richiesta);
      this.mapDtoToModel(this.richiestaIscrizioneCm);

      await this.popolaCategorie();

      if (!isNullOrUndefined(this.richiestaIscrizioneCm.domicilio_trasferimento)) {
        const loIndirizzo = this.richiestaIscrizioneCm.domicilio_trasferimento;
        this.richiestaIscrizioneCm.domicilio_trasferimento.indirizzo_esteso =
          (loIndirizzo.toponimo ? loIndirizzo.toponimo.descrizione : '') + ' ' +
          (loIndirizzo.indirizzo ? loIndirizzo.indirizzo : '') + ' ' +
          (loIndirizzo.numero_civico ? loIndirizzo.numero_civico : '');
        this.domicilioTrasferimento = this.richiestaIscrizioneCm.domicilio_trasferimento;
      }

      this.domicilioValido = true;
      this.indirizzoEdit = false;
      if (this.richiestaIscrizioneCm.cod_tipo_comunicazione === 'P') {
        this.richiestaModel.flg_prima_iscrizione = true;
        this.msgCpiRichiesta = this.liste.messaggi['MI062'];
      } else if (this.richiestaIscrizioneCm.cod_tipo_comunicazione === 'T') {
        this.richiestaModel.flg_prima_iscrizione = false;
        this.msgCpiRichiesta = this.liste.messaggi['MI063'];
      } else if (this.richiestaIscrizioneCm.cod_tipo_comunicazione === 'I') {
        this.richiestaModel.flg_prima_iscrizione = false;
        this.msgCpiRichiesta = this.liste.messaggi['MI064'];
      }
      this.popolaCpiByProvincia();
      this.richiestaModel.id_cpi_ultima_iscrizione = this.richiestaIscrizioneCm.id_cpi_ultima_iscrizione;
    } else {
      // inizializzo la richiesta
      let utente = this.appUserService.getUtente();
      if (this.isOperatore) {
         utente = this.appUserService.getUtenteSimulato();
      }
      this.logService.log("************************************");
      this.logService.log("utente idUtente "  + utente.id_utente);
      this.logService.log("utente id sil lav " + utente.id_sil_lav_anagrafica);
      this.logService.log("************************************");
      this.richiestaIscrizioneCm = {} as DettaglioRichiestaIscrizioneL68;
      this.richiestaIscrizioneCm.richiesta_iscrizione_header = {};
      this.richiestaIscrizioneCm.richiesta_iscrizione_header.id_anagrafica = utente.id_sil_lav_anagrafica;
      this.richiestaIscrizioneCm.flg_seguito_da_servizi_territoriali = "N";
      this.richiestaIscrizioneCm.flg_licenziato_in_ultimo_rapporto = "N";
    }

    await this.controllaCoerenzaDatiFascicolo();

    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    this.readOnly = this.commonPslpService.readOnlyCM;

    this.utilitiesService.hideSpinner();
    this.bloccoCpiDomOResCessati();

  }

  private async bloccoCpiDomOResCessati() {
    /** EFFETTUO UN CONTROLLO SULLA MANCANZA DI 1 DEI DUE CPI NON LO FACCIO PROSEGUIRE */
    /** Viene recuperato il corrispondente Cpi del comune  */
    let ilCentroDom: CentroPerImpiego = {};
    let ilCentroRes: CentroPerImpiego = {};
    if (!isNullOrUndefined(this.sap.domicilio.comune.codice_ministeriale)) {
       ilCentroDom = await  this.utilitiesService.getCpiDelComune(this.sap.domicilio.comune.codice_ministeriale);
    }
    if (!isNullOrUndefined(this.sap.residenza.comune.codice_ministeriale)) {
       ilCentroRes = await  this.utilitiesService.getCpiDelComune(this.sap.residenza.comune.codice_ministeriale);
    }
    if (isNullOrUndefined(ilCentroDom.descrizione)) {
      this.bloccoCpiDomNonDisponibile = true;
    }
    if (isNullOrUndefined(ilCentroRes.descrizione)) {
      this.bloccoCpiResNonDisponibile = true;
    }
    if (this.bloccoCpiDomNonDisponibile || this.bloccoCpiResNonDisponibile) {
      /** IN ATTESA DI UN MESSAGGIO PER L'ASSENZA DEI CPI  */
      let msg = (await this.utilitiesService.getMessage('MI067'));
      if (this.bloccoCpiDomNonDisponibile) {
        msg = msg.replace('{0}', "Domicilio");
        msg = msg.replace('{1}', this.sap.domicilio.comune.descrizione);
      } else {
        msg = msg.replace('{0}', "Residenza");
        msg = msg.replace('{1}', this.sap.residenza.comune.descrizione);
      }
      this.pslshareService.apriModale('', msg, this.titoloPagina, TypeDialogMessage.Confirm);
    }
  }

  /**
   * Metodo asincrono per il recupero dei dati dai servizi tramite coda di promise
   * @param idUtente numero
   */
  async initDati(idUtente: number) {
    const [tipiIscrizione, motiviIscrizione, province, listaCpi, sap, richiestaSalvata, esito, did] = await Promise.all([
      this.utilitiesService.getElencoTipoIscrizione(),
      this.utilitiesService.getElencoMotivoIscrizione(),
      this.storageService.getCachedValue('PROVINCE',
        () => this.businessService.getProvince().pipe(map((values: Provincia[]) => {
          values.sort(this.sortDescrizione);
          return values;
        })).toPromise()),
      this.utilitiesService.getAllCentriPerImpiego(),
      this.commonPslpService.getSap$(),
      this.commonPslpService.getDettaglioIscrizioneL68$(this.idUtente),
      this.commonPslpService.getCollocamentoMirato(idUtente),
      this.commonPslpService.ricercaDettaglioDIDService(this.idUtente)
    ]
    );
    const [MI060, MI061, MI062, MI063, MI064, ME157, ME158, ME159, ME160, ME161, ME164, HC071, HC043, HC044, HC045, HC046, HC047, HC048,
      HC049, HC050, HC051, ME002, ME173, ME177, ME179, ME178] = await Promise.all([
        this.utilitiesService.getMessage('MI060'),
        this.utilitiesService.getMessage('MI061'),
        this.utilitiesService.getMessage('MI062'),
        this.utilitiesService.getMessage('MI063'),
        this.utilitiesService.getMessage('MI064'),
        this.utilitiesService.getMessage('ME157'),
        this.utilitiesService.getMessage('ME158'),
        this.utilitiesService.getMessage('ME159'),
        this.utilitiesService.getMessage('ME160'),
        this.utilitiesService.getMessage('ME161'),
        this.utilitiesService.getMessage('ME164'),
        this.utilitiesService.getMessage('HC071'),
        this.utilitiesService.getMessage('HC043'),
        this.utilitiesService.getMessage('HC044'),
        this.utilitiesService.getMessage('HC045'),
        this.utilitiesService.getMessage('HC046'),
        this.utilitiesService.getMessage('HC047'),
        this.utilitiesService.getMessage('HC048'),
        this.utilitiesService.getMessage('HC049'),
        this.utilitiesService.getMessage('HC050'),
        this.utilitiesService.getMessage('HC051'),
        this.utilitiesService.getMessage('ME002'),
        this.utilitiesService.getMessage('ME173'),
        this.utilitiesService.getMessage('ME177'),
        this.utilitiesService.getMessage('ME179'),
        this.utilitiesService.getMessage('ME178'),
      ]);
    this.liste.tipiIscrizione = tipiIscrizione;
    this.liste.motiviIscrizione = motiviIscrizione;
    this.liste.province = province;
    this.liste.listaCpi = listaCpi;
    this.sap = sap;
    this.richiestaIscrizioneCm = richiestaSalvata;
    this.riepilogoCOMI = esito;
    this.liste.messaggi['MI060'] = MI060;
    this.liste.messaggi['MI061'] = MI061;
    this.liste.messaggi['MI062'] = MI062;
    this.liste.messaggi['MI063'] = MI063;
    this.liste.messaggi['MI064'] = MI064;
    this.liste.messaggi['ME157'] = ME157;
    this.liste.messaggi['ME158'] = ME158;
    this.liste.messaggi['ME159'] = ME159;
    this.liste.messaggi['ME160'] = ME160;
    this.liste.messaggi['ME161'] = ME161;
    this.liste.messaggi['ME164'] = ME164;
    this.liste.messaggi['HC071'] = HC071;
    this.liste.messaggi['HC043'] = HC043;
    this.liste.messaggi['HC044'] = HC044;
    this.liste.messaggi['HC045'] = HC045;
    this.liste.messaggi['HC046'] = HC046;
    this.liste.messaggi['HC047'] = HC047;
    this.liste.messaggi['HC048'] = HC048;
    this.liste.messaggi['HC049'] = HC049;
    this.liste.messaggi['HC050'] = HC050;
    this.liste.messaggi['HC051'] = HC051;
    this.liste.messaggi['ME002'] = ME002;
    this.liste.messaggi['ME173'] = ME173;
    this.liste.messaggi['ME177'] = ME177;
    this.liste.messaggi['ME179'] = ME179;
    this.liste.messaggi['ME178'] = ME178;
    this.did = did;
  }

  async controllaCoerenzaDatiFascicolo() {
    // Controllo se sono stati cambiati dati nel fascicolo e nel caso li aggiorno nella richieta
    if (this.isBozza) {
      if (this.richiestaIscrizioneCm.cod_tipo_comunicazione === 'P') {
        const idCpiSilp = (await this.utilitiesService.getCpiDelComune(this.sap.residenza.comune.codice_ministeriale)).id_cpi_silp;
        if (idCpiSilp !== this.richiestaIscrizioneCm.id_cpi) {
          this.dataChanged = true;
          this.pslshareService.apriModale('', this.liste.messaggi['MI060'], this.titoloPagina, TypeDialogMessage.Confirm).then(() => {
            this.utilitiesService.getCpiDelComune(this.sap.residenza.comune.codice_ministeriale).then(res => {
              this.richiestaModel.id_cpi = res.id_cpi_silp;
              this.richiestaModel.id_provincia = this.sap.residenza.comune.provincia.codice_ministeriale;
            });
            this.logService.log(
              '[richiesta.component] CpI della residenza del fascicolo cambiato rispetto a quello della richiesta. Nuovo CpI richiesta Id: ',
              this.richiestaModel.id_cpi
            );
          });
        }
      } else if (this.richiestaIscrizioneCm.cod_tipo_comunicazione === 'I') {
        const centro = await this.getCpiComune(this.sap.domicilio.comune.codice_ministeriale);
        if (!isNullOrUndefined(centro) && centro.id_cpi_silp !== this.richiestaIscrizioneCm.id_cpi) {
          this.dataChanged = true;
          this.pslshareService.apriModale('', this.liste.messaggi['MI061'], this.titoloPagina, TypeDialogMessage.Confirm).then(() => {
            this.utilitiesService.getCpiDelComune(this.sap.domicilio.comune.codice_ministeriale).then(res => {
              this.richiestaModel.id_cpi = res.id_cpi_silp;
              this.richiestaModel.id_provincia = this.sap.domicilio.comune.provincia.codice_ministeriale;
            });
            this.logService.log(
              '[richiesta.component] CpI del domicilio del fascicolo cambiato rispetto a quello della richiesta. Nuovo CpI richiesta Id: ',
              this.richiestaModel.id_cpi
            );
          });
        }
      }
    }
  }

  private async getCpiComune(codice: string): Promise<CentroPerImpiego> {

    let centro: CentroPerImpiego;
    if (!isNullOrUndefined(codice)) {
       centro = await this.utilitiesService.getCpiDelComune(codice);

    }

    return centro;
  }

  mapDtoToModel(dto: DettaglioRichiestaIscrizioneL68) {
    const campi: string[] = Object.keys(this.richiestaModel);
    campi.forEach(el => {
      if (dto[el]) {
        this.richiestaModel[el] = dto[el];
      }
    });
  }

  mapModelToDto(dto: DettaglioRichiestaIscrizioneL68) {
    const campi: string[] = Object.keys(this.richiestaModel);
    campi.forEach(el => {
      if (this.richiestaModel[el]) {
        dto[el] = this.richiestaModel[el];
      }
    });


    // DIVERSO DA CATEGORIA SORDOMUTI
    if (this.richiestaIscrizioneCm.cod_categoria_appartenenza !== '1') {
      this.richiestaIscrizioneCm.cod_categoria_invalidita = null;
    }
    // DIVERSO DA CATEGORIA INVALIDI DEL LAVORO E INVALIDI CIVILI
    if (this.richiestaIscrizioneCm.cod_categoria_appartenenza !== '2' && this.richiestaIscrizioneCm.cod_categoria_appartenenza !== '3') {
      this.richiestaIscrizioneCm.grado_invalidita = 0;
    }

    // DIVERSO DA CATEGORIA NON VEDENTI
    if (this.richiestaIscrizioneCm.cod_categoria_appartenenza !== '4') {
      /** nel caso non sia una qualifica non vedenti bisogna resettare l'elenco */
      this.richiestaIscrizioneCm.elenco_qualifica_non_vedenti = [];
    }

    this.impostaDatiRichiestaCM();
  }

  async onPrimaIscrizioneChange() {
    this.cleanFormForFlagPrimaIscrizione();

    // SE E' UNA PRIMA ISCRIZIONE
    if (this.richiestaModel.flg_prima_iscrizione) {
      if (this.utilitiesService.isSapResidenzaPiemonte(this.sap)) {
        const residenza: Indirizzo = this.sap.residenza;
        this.richiestaModel.id_provincia = residenza.comune.provincia.codice_ministeriale;
        this.richiestaModel.id_cpi = (await this.utilitiesService.getCpiDelComune(residenza.comune.codice_ministeriale)).id_cpi_silp;
        this.msgCpiRichiesta = this.liste.messaggi['MI062'];
      } else {
        if (this.isOperatore) {
          const msgOp =  this.liste.messaggi['ME177'];
          return this.pslshareService.apriModale('', msgOp, this.titoloPagina, TypeDialogMessage.Confirm);
        } else {
          this.pslshareService.apriModale('', this.liste.messaggi['ME157'], this.titoloPagina, TypeDialogMessage.YesOrNo).then(res => {
              if (res === 'SI') { this.goToFascicolo(); }
              if (res === 'NO') { this.goToRiepilogo(); }
            });
        }
      }
    } else { // SE NON E' UNA PRIMA ISCRIZIONE
      const domicilio = this.sap.domicilio;
      this.richiestaModel.id_provincia = domicilio.comune.provincia.codice_ministeriale;

      this.richiestaModel.id_cpi = (await this.utilitiesService.getCpiDelComune(domicilio.comune.codice_ministeriale)).id_cpi_silp;
      this.msgCpiRichiesta = this.liste.messaggi['MI064'];
      await this.recuperaDatiUltimaIscrizione(this.getUltimaIscrizioneChiusa(this.riepilogoCOMI));
    }
  }

  cleanFormForFlagPrimaIscrizione() {
    this.richiestaModel.data_ultima_iscrizione = null;
    this.richiestaModel.id_provincia = null;
    this.richiestaModel.id_provincia_ultima_iscrizione = null;
    this.richiestaModel.id_cpi = null;
    this.richiestaModel.id_cpi_ultima_iscrizione = null;
  }

  /**
   * Sort descrizione of indirizzo component
   */
  private readonly sortDescrizione = function (a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  };

  isValidData(): boolean {
    // this.checkData();
    const valido = !this.flagChanging
      && this.sap
      && (this.commonPslpService.wizard || this.dataChanged);
    return valido;
  }


  /**
   * recupera l'ultima iscrizione chiusa dell'ultima iscrizione chiusa
   * @param esito EsitoRiepilogoCollocamentoMirato  il riepilogo con eventuali iscrizioni dell'utente
   * @returns l'iscrizione chiusa individuata
   */
  getUltimaIscrizioneChiusa(esito: EsitoRiepilogoCollocamentoMirato): IscrizioneCollocamentoMirato {
    const listaIscrizioni: IscrizioneCollocamentoMirato[] = [];
    if (esito) {
      if (esito.iscrizioneAltreCategorie && esito.iscrizioneAltreCategorie.statoFinale) {
        listaIscrizioni.push(esito.iscrizioneAltreCategorie);
      }
      if (esito.iscrizioneDisabili && esito.iscrizioneDisabili.statoFinale) {
        listaIscrizioni.push(esito.iscrizioneDisabili);
      }

      if (listaIscrizioni.length === 1) {
        return listaIscrizioni[0];
      } else if (listaIscrizioni.length > 1) {
        if (listaIscrizioni[0].dataIscrizione > listaIscrizioni[1].dataIscrizione) {
          return listaIscrizioni[0];
        } else {
          return listaIscrizioni[1];
        }
      }
    }

    return null;
  }

  /**
   * recupera i dati dell'iscrizione attiva
   * @param esito EsitoRiepilogoCollocamentoMirato   riepilogo con le eventuali iscrizioni dell'utente
   * @returns l'iscrizione attiva individuata
   */
  getIscrizioneAttiva(esito: EsitoRiepilogoCollocamentoMirato): IscrizioneCollocamentoMirato {
    // N.B. non è possibile avere due iscrizioni attive
    if (esito) {
      if (esito.iscrizioneAltreCategorie && !esito.iscrizioneAltreCategorie.statoFinale) {
        return esito.iscrizioneAltreCategorie;
      }
      if (esito.iscrizioneDisabili && !esito.iscrizioneDisabili.statoFinale) {
        return esito.iscrizioneDisabili;
      }
    }

    return null;
  }

  /**
   * recupera i dati dall'iscrizion attiva e popola il model del form
   * @param iscrizione IscrizioneCollocamentoMirato recuperata dal riepilogo dell'utente
   */
  async recuperaDatiUltimaIscrizione(iscrizione: IscrizioneCollocamentoMirato) {
    if (iscrizione) {
      this.richiestaModel.id_provincia_ultima_iscrizione = iscrizione.provincia.codice_ministeriale;
      this.popolaCpiByProvincia();
      this.richiestaModel.id_cpi_ultima_iscrizione = iscrizione.idCpiSilp;
      this.richiestaModel.data_ultima_iscrizione = iscrizione.dataIscrizione;

      if (this.riepilogoCOMI.iscrizioneAltreCategorie &&
        this.riepilogoCOMI.iscrizioneAltreCategorie.idIscrizione === iscrizione.idIscrizione) {
        this.richiestaModel.cod_tipo_iscrizione = 'A';
      } else if (this.riepilogoCOMI.iscrizioneDisabili &&
        this.riepilogoCOMI.iscrizioneDisabili.idIscrizione === iscrizione.idIscrizione) {
        this.richiestaModel.cod_tipo_iscrizione = 'D';
      }
      await this.popolaCategorie();

      const categoria = this.liste.categorie.find(el => el.descrizione === iscrizione.categoria);
      this.richiestaModel.cod_categoria_appartenenza = categoria ? categoria.id_silp : null;
    }
  }

  async checkCpiUltimaIscrizione() {
    const ultimaIscrizioneChiusa = this.getUltimaIscrizioneChiusa(this.riepilogoCOMI);
    const cpi: CentroPerImpiego = await this.utilitiesService.getCpiPerId(this.richiestaModel.id_cpi_ultima_iscrizione);

    if (!ultimaIscrizioneChiusa) {
      if (this.utilitiesService.isProvinciaCodInPiemonte(cpi.codice_ministeriale_provincia)) {
        this.pslshareService.apriModale('', this.liste.messaggi['ME159'], this.titoloPagina, TypeDialogMessage.Confirm).then(() => {
          this.logService.log('[richiesta.component] Cpi ultima iscrizione indicato in piemonte');
        });
      }
    } else if (this.richiestaModel.id_cpi_ultima_iscrizione !== ultimaIscrizioneChiusa.idCpiSilp &&
      this.utilitiesService.isProvinciaCodInPiemonte(cpi.codice_ministeriale_provincia)) {
      this.pslshareService.apriModale('', this.liste.messaggi['ME160'], this.titoloPagina, TypeDialogMessage.Confirm).then(() => {
        this.logService.log('[richiesta.component] Cpi indicato diverso da Cpi risultante da ultima iscrizione chiusa');
      });
    }
  }



  async verificaRichiesta(richiesta: DettaglioRichiestaIscrizioneL68, nav: NavigationEmitter): Promise<EsitoControlloRichiesta> {

    let esito = this.verificaDid(richiesta);
    if (!esito.errore) {
        esito = this.verificaPrimaIscrizione(richiesta);
    }
    if (!esito.errore) {
      const esitoCPi = await this.verificaCpiUltimaIscrizione(richiesta);
      esito = esitoCPi;
    }

    return esito;
  }


  verificaPrimaIscrizione(richiesta: DettaglioRichiestaIscrizioneL68): EsitoControlloRichiesta {
    let esito: EsitoControlloRichiesta = {
      errore: false
    };
    if (richiesta.cod_tipo_comunicazione === 'P' ) {
      if (!this.utilitiesService.isSapResidenzaPiemonte(this.sap)) {

        const esitoDid: EsitoControlloRichiesta = {
          errore: true,
          proporreModale: true,
          msgDaProporre: '',
          msgAggiuntivoModale: this.liste.messaggi['ME157'],
          titoloModale: this.titoloPagina,
          tipoMessaggioDaProporre: TypeDialogMessage.YesOrNo,
          seModaleSiSalva: false,
          seModaleNoRestaSullaPagina: false,
          urlDaSeguireSeModaleSi: '/fascicolo-cittadino/riepilogo',
          urlDaSeguireSeModaleNo: '/collocamento-mirato/riepilogo'
        };
        // in caso sia collegato l'operatore non può andare al fascicolo
        // la segnalazione all'utente cambia
        if (this.isOperatore) {
          esitoDid.msgAggiuntivoModale = this.liste.messaggi['ME177'];
          esitoDid.tipoMessaggioDaProporre = TypeDialogMessage.Confirm;
          esitoDid.seModaleNoRestaSullaPagina = true;
          esitoDid.urlDaSeguireSeModaleSi = null;
          esitoDid.urlDaSeguireSeModaleNo = null;
        }

        esito = esitoDid;

      }

    } else if (!this.isTrasferimento  &&
      !this.utilitiesService.isSapDomicilioPiemonte(this.sap)) {
        const esitoDid: EsitoControlloRichiesta = {
          errore: true,
          proporreModale: true,
          msgDaProporre: '',
          msgAggiuntivoModale: this.liste.messaggi['ME173'],
          titoloModale: this.titoloPagina,
          tipoMessaggioDaProporre: TypeDialogMessage.YesOrNo,
          seModaleSiSalva: false,
          seModaleNoRestaSullaPagina: false,
          urlDaSeguireSeModaleSi: '/fascicolo-cittadino/riepilogo',
          urlDaSeguireSeModaleNo: '/collocamento-mirato/riepilogo'
        };

        // per operatore 178
        // in caso sia collegato l'operatore non può andare al fascicolo
        // la segnalazione all'utente cambia
        if (this.isOperatore) {
          esitoDid.msgAggiuntivoModale = this.liste.messaggi['ME178'];
          esitoDid.tipoMessaggioDaProporre = TypeDialogMessage.Confirm;
          esitoDid.seModaleNoRestaSullaPagina = true;
          esitoDid.urlDaSeguireSeModaleSi = null;
          esitoDid.urlDaSeguireSeModaleNo = null;
        }

        esito = esitoDid;
      } else if (this.isTrasferimento  &&
                richiesta.domicilio_trasferimento.comune.provincia.codice_ministeriale === richiesta.id_provincia_ultima_iscrizione) {

          const esitoDid: EsitoControlloRichiesta = {
            errore: true,
            proporreModale: true,
            msgDaProporre: '',
            msgAggiuntivoModale: this.liste.messaggi['ME164'],
            titoloModale: this.titoloPagina,
            tipoMessaggioDaProporre: TypeDialogMessage.Confirm,
            seModaleSiSalva: false,
            seModaleNoRestaSullaPagina: true,

          };
          esito = esitoDid;
        }
    return esito;
  }

  /*
  *
  *
  *
  */
  async verificaCpiUltimaIscrizione( richiesta: DettaglioRichiestaIscrizioneL68 ): Promise<EsitoControlloRichiesta> {
    let esito: EsitoControlloRichiesta = {
      errore: false
    };
    const ultimaIscrizioneChiusa = this.getUltimaIscrizioneChiusa(this.riepilogoCOMI);
    const cpi: CentroPerImpiego = await this.utilitiesService.getCpiPerId(richiesta.id_cpi_ultima_iscrizione);

    if (!ultimaIscrizioneChiusa) {
      if (this.utilitiesService.isProvinciaCodInPiemonte(cpi.codice_ministeriale_provincia)
        &&     richiesta.cod_tipo_comunicazione === 'I') {

          this.logService.log('[richiesta.component] Cpi ultima iscrizione indicato in piemonte');

        const esitoDid: EsitoControlloRichiesta = {
          errore: true,
          proporreModale: true,
          msgDaProporre: '',
          msgAggiuntivoModale: this.liste.messaggi['ME159'],
          titoloModale: this.titoloPagina,
          tipoMessaggioDaProporre: TypeDialogMessage.Confirm,
          seModaleSiSalva: false,
          seModaleNoRestaSullaPagina: true
        };
        esito = esitoDid;
      }
    } else if (richiesta.id_cpi_ultima_iscrizione !== ultimaIscrizioneChiusa.idCpiSilp &&
      this.utilitiesService.isProvinciaCodInPiemonte(cpi.codice_ministeriale_provincia)  &&     richiesta.cod_tipo_comunicazione === 'I') {

      this.logService.log('[richiesta.component] Cpi indicato diverso da Cpi risultante da ultima iscrizione chiusa');

      const esitoDid: EsitoControlloRichiesta = {
        errore: true,
        proporreModale: true,
        msgDaProporre: '',
        msgAggiuntivoModale: this.liste.messaggi['ME160'],
        titoloModale: this.titoloPagina,
        tipoMessaggioDaProporre: TypeDialogMessage.Confirm,
        seModaleSiSalva: false,
        seModaleNoRestaSullaPagina: true
      };
      esito = esitoDid;
    }
    return esito;
  }

  verificaDid(richiesta: DettaglioRichiestaIscrizioneL68 ): EsitoControlloRichiesta {
    let esito: EsitoControlloRichiesta = {
      errore: false
    };

    const listaCatConPrecedenza: CategoriaProtetta[] = this.liste.categorie.filter((el: CategoriaProtetta) => el.flg_speciale === 'S' );
    const isCatConPrecedenza: boolean = !isNullOrUndefined(listaCatConPrecedenza.find((el: CategoriaProtetta) => richiesta.cod_categoria_appartenenza === el.id_silp ));

    if (richiesta.cod_tipo_iscrizione === 'D' || (richiesta.cod_tipo_iscrizione === 'A' && !isCatConPrecedenza)) {
      if  (!isNullOrUndefined(this.did)) { // se e' presente una did proseguo con i controlli
        if (!isNullOrUndefined(this.did.error) || !isNullOrUndefined(this.did.errore_ricerca_did)) { // sono presenti degli errori
          const esitoDid: EsitoControlloRichiesta = {
            errore: true,
            proporreModale: true,
            msgDaProporre: '',
            msgAggiuntivoModale: this.liste.messaggi['ME002'],
            titoloModale: this.titoloPagina,
            tipoMessaggioDaProporre: TypeDialogMessage.Confirm,
            seModaleSiSalva: false,
            seModaleNoRestaSullaPagina: true
          };
          esito = esitoDid;

        }
       }
       if (!esito.errore) { // non sono presenti errori quindi controllo gli stati o assenza did
        if (isNullOrUndefined(this.did)  ||  !(this.did.cod_ultimo_stato === this.STATO_DID_CONVALIDATA ||
            this.did.cod_ultimo_stato === this.STATO_DID_ISCRITTA ||
            this.did.cod_ultimo_stato === this.STATO_DID_SOSPESA)) {
              const esitoDid: EsitoControlloRichiesta = {
                errore: true,
                proporreModale: true,
                msgDaProporre: 'Richiedere la DID',
                msgAggiuntivoModale: this.liste.messaggi['ME161'],
                titoloModale: this.titoloPagina,
                tipoMessaggioDaProporre: TypeDialogMessage.YesOrNo,
                seModaleSiSalva: true,                         //  attenzione salvo la richiesta pur mandando l'utente in gestione did
                urlDaSeguireSeModaleSi: '/did/riepilogo-did',
                seModaleNoRestaSullaPagina: true
               };
                // per operatore 179
                // in caso sia collegato l'operatore non può andare al fascicolo
                // la segnalazione all'utente cambia
                if (this.isOperatore) {
                    esitoDid.msgAggiuntivoModale = this.liste.messaggi['ME179'];
                    esitoDid.tipoMessaggioDaProporre = TypeDialogMessage.Confirm;
                    esitoDid.seModaleNoRestaSullaPagina = true;
                    esitoDid.seModaleSiSalva = false;
                    esitoDid.urlDaSeguireSeModaleSi = null;
                    esitoDid.urlDaSeguireSeModaleNo = null;
                }

          esito = esitoDid;
        }
      }
    }
    return esito;
  }

  /**
    * Determines whether exit page on
    * @param nav NavigationEmitter
    *
    */
  async onExitPage(nav: NavigationEmitter) {

    this.submitClicked = true;

    // flag per segnalare effettuato tentativo di salvataggio
    let tentatoSalvataggio = false;

    // imposto esito positivo per l'ultimo controllo sul cambio pagina
    let esitoSalva: EsitoSaveRichiestaIscrizioneCollocamentoMirato = {
      esitoPositivo: true
    };
    // mappo i campi dell'oggetto model sulla richiesta da salvare
    if (isNullOrUndefined(this.richiestaIscrizioneCm)) {
      this.richiestaIscrizioneCm = {} as DettaglioRichiestaIscrizioneL68;
    }

    this.mapModelToDto(this.richiestaIscrizioneCm);

    try {

        if (this.isIndietroOrUscita(nav)) {
          const res = await this.pslshareService.richiestaFinestraModale(this.commonPslpService.modaleIndietroCOMI(this.titoloPagina));
          if (res === 'NO') {
             esitoSalva.esitoPositivo = false;
          }
        } else if (this.isAvantiOrSalva(nav)) {

          /*
           * non controlla dataChanged
           * per effettuare comunque i controlli che richiedono validazione
           * e eventuali conferme dall'utente
           */


            const esitoCtl = await  this.verificaRichiesta(this.richiestaIscrizioneCm, nav);
              // c'è errore e si deve chiedere all'utente
            if (esitoCtl.errore && esitoCtl.proporreModale) {
                const finestra: DialogModaleMessage = {
                titolo: this.titoloPagina,
                messaggio: esitoCtl.msgDaProporre,
                messaggioAggiuntivo: esitoCtl.msgAggiuntivoModale,
                tipo: esitoCtl.tipoMessaggioDaProporre,
                };
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
        this.utilitiesService.hideSpinner();
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
    this.impostaDatiRichiestaCM();
    this.logService.log("salvaRichiesta idUtente " + this.idUtente);
    this.logService.log("salvaRichiesta " + this.richiestaIscrizioneCm.richiesta_iscrizione_header.id_anagrafica);
    const esito = await this.commonPslpService.saveRichiestaIscrizione(this.idUtente, this.richiestaIscrizioneCm, '1');
    return esito;
  }

  private impostaDatiRichiestaCM() {
    if (isNullOrUndefined(this.richiestaIscrizioneCm.richiesta_iscrizione_header.cod_stato_richiesta)) {
      this.richiestaIscrizioneCm.richiesta_iscrizione_header.cod_stato_richiesta = "B";
    }
    if (isNullOrUndefined(this.richiestaIscrizioneCm.richiesta_iscrizione_header.id_richiesta)) {
      this.richiestaIscrizioneCm.tipo_operazione = "I";
    } else {
      this.richiestaIscrizioneCm.tipo_operazione = "A";
    }
    if (this.richiestaModel.flg_prima_iscrizione) {
      this.richiestaIscrizioneCm.cod_tipo_comunicazione = "P";
    } else {
      if (this.getIscrizioneAttiva(this.riepilogoCOMI)) {
        this.richiestaIscrizioneCm.cod_tipo_comunicazione = "T";
      } else {
        this.richiestaIscrizioneCm.cod_tipo_comunicazione = "I";
      }
    }

    this.richiestaIscrizioneCm.richiesta_iscrizione_header.data_stato = new Date();
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

  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
  }

  /**
   * Determines whether data change on
   * @param value boolean
   */
  onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = 'PROSEGUI';
  }

  /**
   * Determines whether flag changing on
   * @param value boolean
   */
  onFlagChanging(value: boolean) {
    this.flagChanging = value;
  }

  /**
   * Domicilios edit state
   * @param stato boolean
   */
  domicilioEditState(stato: boolean) {
    this.flagChanging = true;
    if (stato) {
      this.domicilioValido = false;
    } else if (this.richiestaModel.id_cpi) {
      this.domicilioValido = true;
    }
  }

  /**
   * Domicilios changed
   * @param indirizzo Indirizzo
   */
  async domicilioChanged(indirizzo: Indirizzo) {
    const cpiRichiesta = indirizzo.comune.id_cpi_silp;
    const provinciaRichiesta = indirizzo.comune.provincia.codice_ministeriale;
    this.msgCpiRichiesta = this.liste.messaggi['MI063'];
    let res;



    if (indirizzo.comune.provincia.codice_ministeriale === this.richiestaModel.id_provincia_ultima_iscrizione) {
      this.richiestaModel.id_cpi = null;
      this.richiestaModel.id_provincia = null;
      res = await this.pslshareService.apriModale('', this.liste.messaggi['ME164'], this.titoloPagina, TypeDialogMessage.Confirm);
      this.indirizzoEdit = true;
      this.logService.log('[richiesta.component] Provincia di trasferimento uguale a provincia ultima iscrizione');

    } else {
      this.indirizzoEdit = false;
      this.richiestaModel.domicilio_trasferimento = indirizzo;
      this.domicilioTrasferimento = indirizzo;
      this.richiestaModel.id_cpi = cpiRichiesta;
      this.richiestaModel.id_provincia = provinciaRichiesta;
      this.domicilioValido = true;

      this.onDataChange(true);
    }

  }

  async popolaCategorie() {
    const now = new Date();

    // se è bozza, recupero il dato dalla richiesta salvata, quindi non va azzerato
    if (!this.isBozza) {
      this.richiestaModel.cod_categoria_appartenenza = null;
    }

    if (this.richiestaModel.cod_tipo_iscrizione === this.TIPO_ISCRIZIONE_DISABILI) {
      this.commonPslpService.wizardDisabile = true;
      this.utilitiesService.getElencoCategoriaProtettaDisabili().then(res => {
        this.liste.categorie = res;
      });

    } else if (this.richiestaModel.cod_tipo_iscrizione === this.TIPO_ISCRIZIONE_ALTRE_CATEGORIE) {
      this.commonPslpService.wizardDisabile = false;
      this.utilitiesService.getElencoCategoriaProtetta().then(res => {
        this.liste.categorie = res.filter((el: CategoriaProtetta) => { return el.data_inizio <= now && (!el.data_fine || el.data_fine > now); });
      });

    }
  }

  popolaCpiByProvincia() {
    this.richiestaModel.id_cpi_ultima_iscrizione = null;
    this.cpiProvincia = [];
    if (!isNullOrUndefined(this.richiestaModel.id_provincia_ultima_iscrizione)) {

      const codiceMinisterialeProvincia = this.liste.province.find(
        (prov: Provincia) => { return prov.codice_ministeriale === this.richiestaModel.id_provincia_ultima_iscrizione; }
      ).codice_ministeriale;

      if (this.richiestaModel.id_provincia_ultima_iscrizione) {
        this.utilitiesService.getCpiDellaprovincia(codiceMinisterialeProvincia).then(res => {
          res.map(el => this.cpiProvincia.push(el));
        });
      }
    }
  }

  /**
   * Determina se avanti o  salva  e in questa pagina non controlla se i dati sono modificati
   * @param nav NavigationEmitter
   * @returns boolean
   */
  private isAvantiOrSalva(nav: NavigationEmitter) {
    // senza controllare cambiamento dati
    return (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) ;
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

  goToFascicolo() {
    this.router.navigateByUrl('/fascicolo-cittadino/riepilogo');
  }

  goToRiepilogo() {
    this.router.navigateByUrl('/collocamento-mirato/riepilogo');
  }

  goToDID() {
    this.router.navigateByUrl('/did/riepilogo-did');
  }

  ngAfterContentChecked(): void {

    if (this.formRichiesta) {
       if (this.formRichiesta.dirty && !this.dataChanged) {
          this.dataChanged = true;
       }
    }
  }

}
