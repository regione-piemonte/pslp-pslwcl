import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AdesioneYG, BusinessService, ErrorDef, EsitoVerificaMinore, PrenotazioneIncontro, TipoResponsabilita, Utente, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, EsitoMinore, MinoreACaricoWrapperInterface, TypeApplicationCard, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, ParametriSistemaService, SecurityPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';


type ModalitaGestioneForm = 'I' | 'U';

@Component({
  selector: 'pslfcwcl-gestione-minore-privacy',
  templateUrl: './gestione-minore-privacy.component.html',
  styleUrls: ['./gestione-minore-privacy.component.css']
})
export class GestioneMinorePrivacyComponent implements OnInit, OnChanges {
  static readonly DATA_NASCITA_SESSION_PLACEHOLDER = 'GestioneMinorePrivacyComponent.dataNascita';

  static readonly UTENTE_ETA_MINIMA_NON_RISPETTATA = 'UTENTE_ETA_MINIMA_NON_RISPETTATA';
  static readonly UTENTE_NON_MINORENNE = 'UTENTE_NON_MINORENNE';
  static readonly TUTORE_GIA_COLLEGATO = 'TUTORE_GIA_COLLEGATO';
  static readonly TUTORI_GIA_PRESENTI = 'TUTORI_GIA_PRESENTI';

  @Input() hasSap = true;
  @Input() ilDestino: string;
  @Output() readonly loadedData: EventEmitter<void> = new EventEmitter();
  @Output() readonly editingData: EventEmitter<boolean> = new EventEmitter();

  showAggiungiMinore = false;
  showTastoAggiungi = true;
  codiceFiscaleMinore: string;
  minore: UtenteACarico = {};
  tutore: Utente;
  minoreACarico: MinoreACaricoWrapperInterface;
  minoriACarico: MinoreACaricoWrapperInterface[];

  updateIndex: number;

  tipiResponsabilita: TipoResponsabilita[];

  minoreCensito = false;
  dataDiNascita: Date;
  modalitaGestioneForm: ModalitaGestioneForm = 'I';

  isReady = true;
  checkTipoRespo: boolean;

  responsabilitaDettaglio: string;
  etaMinima: number;
  msgMe114: string;
  ritornaAllaFunzionalita: string;

  get isUpdate(): boolean { return this.modalitaGestioneForm === 'U'; }

  constructor(
    private readonly appUserService: AppUserService,
    private readonly commonFCService: CommonPslpService,
    private readonly businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly storageService: SessionStorageService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly securityService: SecurityPslpService,
    private readonly logService: LogService,
    private readonly pslbasepageService: PslshareService
  ) { }

  /**
   * on init
   */
  async ngOnInit() {
    this.tipiResponsabilita = await this.businessService.findTipiResponsabilita().toPromise();
    this.tutore = this.appUserService.getUtente();
    this.etaMinima = await this.parametriSistemaService.minoreEta;
    this.responsabilitaDettaglio = await this.utilitiesService.getMessage('FRES1');
    this.msgMe114 = await this.utilitiesService.getMessage('ME114');

    await this.loadMinoriACarico(this.tutore);
    this.logService.log('Il destino---------->' + this.ilDestino);
    this.ritornaAllaFunzionalita = this.ilDestino;
    this.loadedData.emit();
  }

  /**
   * Determines whether aggiungi minore on
   */
  onAggiungiMinore() {

    this.onEditing(true);
    this.showAggiungiMinore = true;
    this.onCheckTipoRespo();
    this.showTastoAggiungi = false;
    this.minoreACarico = null;
    this.modalitaGestioneForm = 'I';
    this.dataDiNascita = null;
    this.updateIndex = -1;

  }

  /**
   * Determines whether cerca on
   */
  async onCerca() {

    this.minoreCensito = true;
    this.dataDiNascita = null;
    this.utilitiesService.showSpinner();
    let ritorno = true;
    const cf = (this.codiceFiscaleMinore || '').toUpperCase();
    try {
      const esito = await this.verificaMinoreACarico(cf);
      if (this.isEsitoValorizzato(esito)) {
        // Verificare quando il minore non e' censito
        if (esito.codici_esito.indexOf('UTENTE_SILP_NON_PRESENTE') >= 0) {
          this.utilitiesService.showToastrInfoMessage(this.msgMe114, 'dati anagrafici');
          // Si permette la prosecuzione, con una nuova SAP
          if (isNullOrUndefined(esito.utente.id_utente)) {
            this.minoreCensito = false;
            esito.utente = {
              codice_fiscale: cf
            };
          }
        } else if (esito.codici_esito.indexOf(GestioneMinorePrivacyComponent.UTENTE_ETA_MINIMA_NON_RISPETTATA) >= 0) {
          const codMess = EsitoMinore.getMsgByCod(GestioneMinorePrivacyComponent.UTENTE_ETA_MINIMA_NON_RISPETTATA);
          let msg = await this.utilitiesService.getMessage(codMess);
          msg = msg.replace('{0}', '' + this.etaMinima);
          throw new Error(msg);
        } else if (esito.codici_esito.indexOf(GestioneMinorePrivacyComponent.UTENTE_NON_MINORENNE) >= 0) {
          await this.throwErrorMessage(GestioneMinorePrivacyComponent.UTENTE_NON_MINORENNE);
        } else if (esito.codici_esito.indexOf(GestioneMinorePrivacyComponent.TUTORE_GIA_COLLEGATO) >= 0) {
          await this.throwErrorMessage(GestioneMinorePrivacyComponent.TUTORE_GIA_COLLEGATO);
        } else if (esito.codici_esito.indexOf(GestioneMinorePrivacyComponent.TUTORI_GIA_PRESENTI) >= 0) {
          ritorno = await this.chiediConferma(ritorno);
        } else {
          await this.throwErrorMessage(esito.codici_esito[0]);
        }
      }

      if (ritorno) {
        const uac: UtenteACarico = {
          tutelato: esito.utente || {},
          tipo_responsabilita: {
            codice: null,
            descrizione: null
          }
        };
        const uacwi = await this.loadMinoreACarico(uac, false);
        this.minoreACarico = { ...uacwi, prenotabile: true };
      }

    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'Ricerca minore a carico');
    } finally {
      this.utilitiesService.hideSpinner();
    }

  }

  /**
   * Throws error message
   * @param str contiene il codice del messaggio di errore
   */
  private async throwErrorMessage(str: string) {
    const codMess = EsitoMinore.getMsgByCod(str);
    const msg = await this.utilitiesService.getMessage(codMess);
    throw new Error(msg);
  }

  /**
   * Chiedis conferma
   * @param ritorno  boolean con valore precedente
   * @returns nuovo valore ritorno
   */
  private async chiediConferma(ritorno: boolean) {
    let rest = ritorno;
    try {
      this.utilitiesService.hideSpinner();
      const data: DialogModaleMessage = {
        titolo: 'Conferma aggiunta Minore agganciato ad altro Responsabile',
        tipo: TypeDialogMessage.YesOrNo,
        messaggio: "",
        messaggioAggiuntivo: await this.utilitiesService.getMessage('MI054')
      };
      const result = await this.pslbasepageService.openModal(data);
      if (result === 'NO') {
        rest = false;
      }
      this.utilitiesService.showSpinner();
    } catch (e) {
      await this.throwErrorMessage(GestioneMinorePrivacyComponent.TUTORI_GIA_PRESENTI);
    }
    return rest;
  }

  /**
   * Determines whether esito valorizzato is
   * @param esito EsitoVerificaMinore
   * @returns true se valorizzato
   */
  private isEsitoValorizzato(esito: EsitoVerificaMinore) {
    return !isNullOrUndefined(esito.codici_esito) && esito.codici_esito.length > 0;
  }

  /**
   * Determines whether check tipo respo on
   * @returns true if check tipo respo
   */
  onCheckTipoRespo(): boolean {
    if (!isNullOrUndefined(this.minoreACarico)
      && !isNullOrUndefined(this.minoreACarico.utenteACarico)
      && !isNullOrUndefined(this.minoreACarico.utenteACarico.tipo_responsabilita)) {
      if (isNullOrUndefined(this.minoreACarico.utenteACarico.tipo_responsabilita.codice)) {
        this.checkTipoRespo = false;
        return false;
      } else {
        this.checkTipoRespo = true;
        return true;
      }
    }

  }

  /**
   * Verificas minore acarico
   * @param cf  codice fiscale minore
   * @returns EsitoVerificaMinore
   */
  async verificaMinoreACarico(cf: string) {
    try {
      return  await this.businessService.verificaMinore(this.tutore.id_utente, cf, this.commonFCService.getAmbito()).pipe(
        catchError(err => {
          const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
          throw new Error(errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage);
        }),
      ).toPromise();
    } catch (e) {
      this.utilitiesService.hideSpinner();
      this.utilitiesService.showToastrErrorMessage(e.message, 'Ricerca minore a carico');
    }
  }
  /**
   * Determines whether save on
   */
  async onSave() {
    this.utilitiesService.showSpinner();
    const utente = this.appUserService.getUtente();
    if (!isNullOrUndefined(this.minoreACarico)
     && !isNullOrUndefined(this.minoreACarico.utenteACarico)
     && !isNullOrUndefined(this.minoreACarico.utenteACarico.tutelato)) {
          this.setNomeTutelato();
          this.setCognomeTutelato();
    }
    try {
      await this.businessService.saveUtenteACarico(utente.id_utente, this.minoreACarico.utenteACarico).pipe(
        catchError(err => {
          const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
          throw new Error(errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage);
        }),
      ).toPromise();

      this.setDataNascitaInSessione();
      this.minoreACarico = null;
      this.codiceFiscaleMinore = null;
      this.dataDiNascita = null;
      this.showAggiungiMinore = false;
      this.showTastoAggiungi = true;
      await this.loadMinoriACarico(this.tutore);
      this.utilitiesService.hideSpinner();
      if (this.modalitaGestioneForm === 'I') {
        const result = await this.openModalConfirm(await this.utilitiesService.getMessage('MI032'));
        if (isNullOrUndefined(result) || result === "SI") {
          this.utilitiesService.showSpinner();
        }
      }
    } catch (error) {
      this.utilitiesService.showToastrErrorMessage(error.message, 'Minore a carico');
    } finally {
      if (!isNullOrUndefined(this.ritornaAllaFunzionalita)) {
        this.securityService.jumpToURL('/privacy/riepilogo-privacy?param=' + this.ritornaAllaFunzionalita, TypeApplicationCard.Fascicolo);
      } else {
        this.securityService.jumpToURL('/privacy/riepilogo-privacy', TypeApplicationCard.Fascicolo);
      }

    }
  }

  /**
   * Sets cognome tutelato
   */
  private setCognomeTutelato() {
    if (!isNullOrUndefined(this.minoreACarico.utenteACarico.tutelato.cognome)) {
      this.minoreACarico.utenteACarico.tutelato.cognome = this.minoreACarico.utenteACarico.tutelato.cognome.toUpperCase();
    }
  }

  /**
   * Sets nome tutelato
   */
  private setNomeTutelato() {
    if (!isNullOrUndefined(this.minoreACarico.utenteACarico.tutelato.nome)) {
      this.minoreACarico.utenteACarico.tutelato.nome = this.minoreACarico.utenteACarico.tutelato.nome.toUpperCase();
    }
  }

  /**
   * Determines whether chiudi on
   */
  onChiudi() {
    this.minoreACarico = null;
    this.showAggiungiMinore = false;
    this.showTastoAggiungi = true;
    this.codiceFiscaleMinore = null;
    this.onEditing(false);
  }

  /**
   * Loads minori a carico
   * @param utente di cui cercare minori
   */
  private async loadMinoriACarico(utente: Utente) {
    const uacs = await this.businessService.findUtentiACarico(utente.id_utente)
      .pipe(
        catchError(() => of([] as UtenteACarico[])),
      ).toPromise();
    this.minoriACarico = await Promise.all<MinoreACaricoWrapperInterface>([
      ...uacs.map(uac => this.loadMinoreACarico(uac, true))
    ]);
  }

  /**
   * Loads minore acarico
   * @param uac UtenteACarico
   * @param verifica      boolean
   * @returns minore a carico
   */
  private async loadMinoreACarico(uac: UtenteACarico, verifica: boolean): Promise<MinoreACaricoWrapperInterface> {
    const adesione: AdesioneYG = null;
    const appuntamento: PrenotazioneIncontro = null;
    let descrizione = '';
    let prenotabile = true;
    if (verifica && this.minoreCensito) {
      const esito = await this.verificaMinoreACarico(uac.tutelato.codice_fiscale);
      for (const i of esito.codici_esito) {
        if (this.isEsitoNonTutore(esito.codici_esito[i])) {
            if (prenotabile) {
              const codMess = EsitoMinore.getMsgByCod(esito.codici_esito[i]);
              descrizione = await this.utilitiesService.getMessage(codMess);
              prenotabile = false;
            }
        }
      }
    }
    return { utenteACarico: uac, adesione, appuntamento, descrizione, prenotabile } as MinoreACaricoWrapperInterface;
  }

  /**
   * Determines whether esito non tutore is
   * @param str string contenente codice errore
   * @returns true if esito non tutore
   */
  isEsitoNonTutore(str: string): boolean {
    return !isNullOrUndefined(str) && (str !== GestioneMinorePrivacyComponent.TUTORE_GIA_COLLEGATO
      && str !== GestioneMinorePrivacyComponent.TUTORI_GIA_PRESENTI);
  }

  /**
   * on changes
   * @param changes realtivo alla pagina
   * @returns on changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.utenteACarico || changes.utenteACarico.isFirstChange()) {
      return;
    }
    const m = { utenteACarico: changes.utenteACarico.currentValue, adesione: null } as MinoreACaricoWrapperInterface;
    this.onVisualizza(m);
  }

  /**
   * Determines whether visualizza on
   * @param m interfacciao Minore
   */
  onVisualizza(m: MinoreACaricoWrapperInterface) {
    this.showAggiungiMinore = false;
    this.showTastoAggiungi = false;
    this.onEditing(true);
    this.modalitaGestioneForm = 'U';
    this.minoreACarico = UtilitiesService.clone(m);
    this.readDataNascitaFromSessione();
    this.minoreCensito = !this.dataDiNascita;
    this.checkTipoRespo = !isNullOrUndefined(this.minoreACarico.utenteACarico.tipo_responsabilita.codice);
  }

  /**
   * pop up
   * @param name stringa nome del popup
   */
  myPopUp(name: string) {
    const popup = document.getElementById(name);
    popup.classList.toggle('show');
  }

  /**
   * Compares by codice
   * @param a stringa
   * @param b stringa
   * @returns true if by codice
   */
  compareByCodice(a: { codice: string }, b: { codice: string }): boolean {
    return a && b && a.codice === b.codice;
  }

  /**
   * Sets data nascita in sessione
   */
  private setDataNascitaInSessione() {
    if (!this.minoreCensito) {
      let gestioneDateNascitaMinore: { [key: string]: Date } = this.storageService.getItem(GestioneMinorePrivacyComponent.DATA_NASCITA_SESSION_PLACEHOLDER, true);
      if (!gestioneDateNascitaMinore) {
        gestioneDateNascitaMinore = {};
      }
      gestioneDateNascitaMinore[this.minoreACarico.utenteACarico.tutelato.codice_fiscale] = this.dataDiNascita;
      this.storageService.setItem(GestioneMinorePrivacyComponent.DATA_NASCITA_SESSION_PLACEHOLDER, gestioneDateNascitaMinore);
    }
  }

  /**
   * Reads data nascita from sessione
   */
  private readDataNascitaFromSessione() {
    const gestioneDateNascitaMinore: { [key: string]: Date } = this.storageService.getItem(GestioneMinorePrivacyComponent.DATA_NASCITA_SESSION_PLACEHOLDER, true);
    this.dataDiNascita = gestioneDateNascitaMinore ? gestioneDateNascitaMinore[this.minoreACarico.utenteACarico.tutelato.codice_fiscale] : null;
  }

  /**
   * Opens modal confirm
   * @param msg da visualizzare finestra modale
   * @returns risultato
   */
  async openModalConfirm(msg: string) {
    const data: DialogModaleMessage = {
      titolo: 'Privacy',
      tipo: TypeDialogMessage.Confirm,
      messaggio: msg,
      messaggioAggiuntivo: ''
    };
    return await this.pslbasepageService.openModal(data);
  }

  /**
   * Determines whether editing on
   * @param flg boolean per indicare che si sta editando
   */
  onEditing(flg: boolean) {
    this.editingData.emit(flg);
  }

}
