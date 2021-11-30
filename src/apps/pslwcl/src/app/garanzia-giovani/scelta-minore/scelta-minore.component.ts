import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdesioneYG, BusinessService, ErrorDef, EsitoVerificaMinore, PrenotazioneIncontro, Privacy, TipoResponsabilita, Utente, UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { Ambito, DialogModaleMessage, EsitoMinore, MinoreACaricoWrapperInterface, NavigationEmitter, StatoIncontro, TypeApplicationCard, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, ParametriSistemaService, SecurityPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { CommonPslpService } from '@pslwcl/pslservice';

@Component({
  selector: 'app-scelta-minore',
  templateUrl: './scelta-minore.component.html',
  styleUrls: ['./scelta-minore.component.css']
})
export class SceltaMinoreComponent implements OnInit {

  static readonly UTENTE_ETA_MINIMA_NON_RISPETTATA = 'UTENTE_ETA_MINIMA_NON_RISPETTATA';
  static readonly UTENTE_NON_MINORENNE = 'UTENTE_NON_MINORENNE';
  static readonly TUTORE_GIA_COLLEGATO = 'TUTORE_GIA_COLLEGATO';
  static readonly TUTORI_GIA_PRESENTI = 'TUTORI_GIA_PRESENTI';

  @ViewChild('modalPresaInCaricoContent', { static: true }) modalPresaInCarico: any;

  showAggiungiMinore = false;
  codiceFiscaleMinore: string;
  minore: UtenteACarico = {};
  tutore: Utente;
  minoreACarico: MinoreACaricoWrapperInterface;
  minoriACarico: MinoreACaricoWrapperInterface[];
  tipiResponsabilita: TipoResponsabilita[];
  tipoResponsabilita: string;

  etaMinima: number;

  elencoPrivacyMinore: Privacy[];
  message: string;
  messaggioUtente: string;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService,
    private readonly businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly modalService: NgbModal,
    private readonly securityService: SecurityPslpService,
    private readonly pslbasepageService: PslshareService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.etaMinima = await this.parametriSistemaService.minoreEta;
    this.tipiResponsabilita = await this.businessService.findTipiResponsabilita().toPromise();
    this.tutore = this.appUserService.getUtente();
    await this.loadMinoriACarico(this.tutore);
    if (this.minoriACarico) {
      if ((this.minoriACarico.findIndex(el => el.prenotabile === true)) < 0) {
        this.messaggioUtente = await this.utilitiesService.getMessage("MI031");
      }
    }

    this.utilitiesService.hideSpinner();
  }

  /**
   * Determines whether aggiungi minore on
   */
  onAggiungiMinore() {
    this.showAggiungiMinore = !this.showAggiungiMinore;
  }

  /**
   * Determines whether cerca on
   * @param c NgModel
   */
  async onCerca(c: NgModel) {
    this.utilitiesService.showSpinner();
    const cf = (c.value || '').toUpperCase();
    try {
      const esito = await this.verificaMinoreACarico(cf);
      this.utilitiesService.hideSpinner();
      // se presente esito Tutori già presenti insiema ad altri esiti elimino l'esito
      // questo perchè sono tutti bloccanti tranne tutori già presenti
      if (this.isEsitoConPiuSegnalazioni(esito)) {
        if (esito.codici_esito.indexOf(SceltaMinoreComponent.TUTORI_GIA_PRESENTI) >= 0) {
          const ind = esito.codici_esito.indexOf(SceltaMinoreComponent.TUTORI_GIA_PRESENTI);
          esito.codici_esito.splice(ind, 1);
        }
      }
      if (this.isEsitoValorizzato(esito)) {
        if (esito.codici_esito.indexOf(SceltaMinoreComponent.UTENTE_ETA_MINIMA_NON_RISPETTATA) >= 0) {
          const codMess = EsitoMinore.getMsgByCod(SceltaMinoreComponent.UTENTE_ETA_MINIMA_NON_RISPETTATA);
          let msg = await this.utilitiesService.getMessage(codMess);
          msg = msg.replace('{0}', '' + this.etaMinima);
          throw new Error(msg);
        } else if (esito.codici_esito.indexOf(SceltaMinoreComponent.UTENTE_NON_MINORENNE) >= 0) {
          await this.throwErrorMessage(SceltaMinoreComponent.UTENTE_NON_MINORENNE);
        } else if (esito.codici_esito.indexOf(SceltaMinoreComponent.TUTORE_GIA_COLLEGATO) >= 0) {
          await this.throwErrorMessage(SceltaMinoreComponent.TUTORE_GIA_COLLEGATO);
        } else if (esito.codici_esito.indexOf(SceltaMinoreComponent.TUTORI_GIA_PRESENTI) >= 0) {
          try {
            await this.modalService.open(this.modalPresaInCarico).result;
          } catch (e) {
            // 'Non è possibile collegare il minore selezionato in quanto risulta essere già collegato a un altro responsabile.';
            await this.throwErrorMessage(SceltaMinoreComponent.TUTORI_GIA_PRESENTI);
          }
        } else {
          await this.throwErrorMessage(esito.codici_esito[0]);
        }
      }

      const uac: UtenteACarico = {
        tutelato: esito.utente,
        tipo_responsabilita: {
          codice: null,
          descrizione: null
        }
      };
      const uacwi = await this.loadMinoreACarico(uac, false);
      this.minoreACarico = { ...uacwi, prenotabile: true };


    } catch (e) {
      this.utilitiesService.hideSpinner();
      this.utilitiesService.showToastrErrorMessage(e.message, 'Ricerca minore a carico');
    }

  }

  /**
   * Determines whether esito valorizzato is
   * @param esito EsitoVerificaMinore
   * @returns boolean
   */
  private isEsitoValorizzato(esito: EsitoVerificaMinore) {
    return !isNullOrUndefined(esito.codici_esito) && esito.codici_esito.length > 0;
  }

  /**
   * Determines whether esito con piu segnalazioni is
   * @param esito EsitoVerificaMinore
   * @returns boolean
   */
  private isEsitoConPiuSegnalazioni(esito: EsitoVerificaMinore) {
    return !isNullOrUndefined(esito.codici_esito) && esito.codici_esito.length > 1;
  }

  /**
   * Throws error message
   * @param str string
   */
  private async throwErrorMessage(str: string) {
    const codMess = EsitoMinore.getMsgByCod(str);
    const msg = await this.utilitiesService.getMessage(codMess);
    throw new Error(msg);
  }

  /**
   * Verificas minore acarico
   * @param cf string
   * @returns esito
   */
  async verificaMinoreACarico(cf: string) {

    try {
      const esito: EsitoVerificaMinore = await this.businessService.verificaMinore(this.tutore.id_utente, cf, this.commonPslpService.getAmbito()).pipe(
        catchError(err => {
          const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
          throw new Error(errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage);
        }),
      ).toPromise();


      return esito;
    } catch (e) {
      this.utilitiesService.hideSpinner();
      this.utilitiesService.showToastrErrorMessage(e.message, 'Ricerca minore a carico');
    }
  }
  /**
   * Determines whether save on
   */
  async onSave() {
    const desc = this.tipiResponsabilita.find(v => v.codice === this.tipoResponsabilita).descrizione;
    this.minoreACarico.utenteACarico.tipo_responsabilita.codice = this.tipoResponsabilita;
    this.minoreACarico.utenteACarico.tipo_responsabilita.descrizione = desc;
    const utente = this.appUserService.getUtente();
    try {
      await this.businessService.saveUtenteACarico(utente.id_utente, this.minoreACarico.utenteACarico).pipe(
        catchError(err => {
          const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
          throw new Error(errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage);
        }),
      ).toPromise();
      const utenteAC = await this.businessService.getUtenteByCf(this.minoreACarico.utenteACarico.tutelato.codice_fiscale).toPromise();
      this.minoreACarico.utenteACarico.tutelato.id_utente = utenteAC.id_utente;
      this.minoriACarico.push(this.minoreACarico);
      this.minoreACarico = null;
      this.codiceFiscaleMinore = null;
      this.showAggiungiMinore = false;
    } catch (error) {
      this.utilitiesService.showToastrErrorMessage(error.message, 'Minore a carico');
    }
  }

  /**
   * Loads minori acarico
   * @param utente Utente
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
   * Loads minore acar ico
   * @param uac UtenteACarico
   * @param verifica boolean
   * @returns minore acarico
   */
  private async loadMinoreACarico(uac: UtenteACarico, verifica: boolean): Promise<MinoreACaricoWrapperInterface> {
    let adesione: AdesioneYG;
    if (!isNullOrUndefined(uac.tutelato.id_sil_lav_anagrafica)) {
      adesione = await this.commonPslpService.getAdesioneBySilp$(uac.tutelato.id_sil_lav_anagrafica);
    }
    const appuntamento: PrenotazioneIncontro = uac.tutelato.id_utente ? await this.loadAppuntamento(uac.tutelato.id_utente) : null;
    let descrizione = "";
    let prenotabile = true;
    if (verifica) {
      const esito = await this.verificaMinoreACarico(uac.tutelato.codice_fiscale);
      for (const i in esito.codici_esito) {
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
   * @param str string
   * @returns true if esito non tutore
   */
  isEsitoNonTutore(str: string): boolean {
    return !isNullOrUndefined(str) && (str !==  SceltaMinoreComponent.TUTORE_GIA_COLLEGATO
      && str !== SceltaMinoreComponent.TUTORI_GIA_PRESENTI);
  }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  async onExitPage(nav: NavigationEmitter) {
    if (nav.exit === TypeExit.Next) {
      //  modificato controllo sulla privacy per via dell'elenco delle privacy che ha associate il minore
      if (!isNullOrUndefined(this.minore)) {
        this.elencoPrivacyMinore = await this.appUserService.loadPrivacyMinore(this.tutore.id_utente, this.minore.tutelato.id_utente);
        const laPrivacyDelMinoreDellAmbito = this.elencoPrivacyMinore.find(el => el.cod_ambito === this.commonPslpService.AMBITO);
        if (isNullOrUndefined(laPrivacyDelMinoreDellAmbito) || !laPrivacyDelMinoreDellAmbito.stato) {
          // 'per poter operare sul minore occorre prendere visione dell\'informativa sulla responsabilita\' genitoriale, in gestione minori';
          this.utilitiesService.hideSpinner();
          const msg = (await this.utilitiesService.getMessage('ME133')).replace('{0}', this.utilitiesService.getDescrAmbito(Ambito.GG));
          this.openModal(msg);
        } else {
          this.commonPslpService.setUtenteStorage(this.minore.tutelato);
          this.commonPslpService.utenteACarico = this.minore;
          this.commonPslpService.wizard = true;
          this.commonPslpService.readOnly = false;
          this.router.navigateByUrl(nav.url);
        }
      }
    } else {
      this.router.navigateByUrl(nav.url);
    }
  }
  /**
   * Loads appuntamento
   * @param idUtente identificativo utente
   * @returns appuntamento
   */
  private loadAppuntamento(idUtente): Promise<PrenotazioneIncontro> {
    return this.businessService.findIncontri(idUtente, this.commonPslpService.getAmbito()).pipe(
      map((incontri: PrenotazioneIncontro[]) => {
        incontri.sort((a: PrenotazioneIncontro, b: PrenotazioneIncontro) => b.id_prenotazione - a.id_prenotazione);
        if (incontri.length === 0) {
          return null;
        }
        return incontri[0];
      }),
      catchError(() => of({} as PrenotazioneIncontro))
    ).toPromise();
  }

  /**
   * Formats appuntamento
   * @param uacwi MinoreACaricoWrapperInterface
   * @returns appuntamento
   */
  public formatAppuntamento(uacwi: MinoreACaricoWrapperInterface): string {
    if (!uacwi.appuntamento || !uacwi.appuntamento.slot) {
      return 'NESSUN APPUNTAMENTO';
    }
    const st = StatoIncontro.getByCodice(uacwi.appuntamento.codice_anpal_stato_incontro);
    let res = `${uacwi.appuntamento.slot.giorno} alle ore ${uacwi.appuntamento.slot.da_ora}`;
    if (st) {
      res += `<br/><strong>Stato:</strong> ${st.descrizione}`;
    }
    return res;
  }
  /**
   * Appuntamentos in
   * @param appuntamento PrenotazioneIncontro
   * @param stati string[]
   * @returns true if in
   */
  public appuntamentoIn(appuntamento: PrenotazioneIncontro, ...stati: string[]): boolean {
    if (!appuntamento) {
      return false;
    }
    return stati.some(stato => appuntamento.codice_anpal_stato_incontro === stato);
  }

  /**
   * pop up
   * @param name string nome del popup
   */
  myPopUp(name) {
    const popup = document.getElementById(name);
    popup.classList.toggle("show");
  }

  /**
   * Opens modal
   * @param msg string
   */
  async openModal(msg: string) {
    const data: DialogModaleMessage = {
      titolo: 'Privacy',
      tipo: TypeDialogMessage.YesOrNo,
      messaggio: "",
      messaggioAggiuntivo: msg
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.GG, TypeApplicationCard.Fascicolo);
    }
  }

  /**
   * Determines whether gestione privacy eminori on
   */
  onGestionePrivacyEMinori() {
    this.securityService.jumpToURL('/privacy-landing?param=' + Ambito.GG, TypeApplicationCard.Fascicolo);
  }


}
