import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { BusinessService, EsitoRiepilogoIscrizione, Operatore, Privacy, PrivacyService, Utente, UtenteACarico, UtentePresaVisione } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { of, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { ENV_AMBIENTE } from './injection-token';
import { LogService } from './log';
import { SessionStorageService } from './session-storage.service';
import { SpidUserService } from './spid-user.service';

/* NOTA:
  > UPDATE idSilp sulla getUtenteByCf
  > UPDATE idSAP  sulla getSAP
  > UPDATE Mail   sulle getSAP e saveSAP* e saveUtente*

  * valore impostato sulla chiamata
*/

@Injectable({
  providedIn: 'root'
})
export class AppUserService {

  static readonly USER_KEY = 'AppUserService.utente';
  static readonly UTENTE_SIMULATO_KEY = 'AppUserService.utenteSimulato';
  static readonly OPERATORE_KEY = 'AppUserService.operatore';
  utenteUpdate = new Subject<Utente>();
  utenteSimulatoUpdate = new Subject<Utente>();
  operatoreUpdate = new Subject<Operatore>();

  privacyUpdate = new Subject<UtentePresaVisione[]>();
  privacyGGUpdate = new Subject<boolean>();
  privacyRdcUpdate = new Subject<boolean>();
  privacyFCUpdate = new Subject<boolean>();

  xsrfToken: string;

  private readonly elencoPrivacyUtente: Record<number, Privacy[]> = {};
  private readonly elencoPrivacyMinore: Record<number, Record<number, Privacy[]>> = {};
  private utente: Utente;

  private backupPreseVisione: Array<UtentePresaVisione>;
  private originalPresaVisionePrivacy: boolean;
  private originalPresaVisionePrivacyRdc: boolean;
  private originalPresaVisionePrivacyFASC: boolean;

  private utenteSimulatoDaOperatore: Utente;
  private operatore: Operatore;


  constructor(
    private readonly spidUserService: SpidUserService,
    private readonly businessService: BusinessService,
    private readonly logService: LogService,
    private readonly sessionStorage: SessionStorageService,
    @Inject(ENV_AMBIENTE) @Optional() private ambiente: string,
    private readonly privacyService: PrivacyService
  ) { }

  getUtente(): Utente {
    return this.utente;
  }


  /**
   *  restituisco idUtente
   *   lo prende da utenteSimulatoOperatore se presente altrimenti lo prende da idUtente
   *
   * @returns id utente number
   */
  getIdUtente(): number {
    let id: number;
    if (!isNullOrUndefined(this.utenteSimulatoDaOperatore)) {
       id = this.utenteSimulatoDaOperatore.id_utente;
    } else if (!isNullOrUndefined(this.utente)) {
       id = this.utente.id_utente;
    }
    return id;
  }


  setUtente(value: Utente) {
    this.utente = value;
    this.originalPresaVisionePrivacy = this.getPrivacy(Ambito.GG);
    this.originalPresaVisionePrivacyRdc = this.getPrivacy(Ambito.RDC);
    this.originalPresaVisionePrivacyFASC = this.getPrivacy(Ambito.FASC);
    this.logService.log('Utente applicativo :', value);
    this.utenteUpdate.next(value);
    this.persistDataUtente();
  }

  setUtenteSimulato(utenteSimulato: Utente, operatore: Operatore) {
    this.utenteSimulatoDaOperatore = utenteSimulato;
    this.utenteSimulatoUpdate.next(utenteSimulato);

    this.operatore = operatore;
    this.operatoreUpdate.next(operatore);

    this.persistDataUtenteSimulato();
  }

  getUtenteSimulato(): Utente {
    return this.utenteSimulatoDaOperatore;
  }

  getOperatore(): Operatore {
    return this.operatore;
  }

  private persistDataUtente() {
    if (this.ambiente === 'dev') {
      this.sessionStorage.setItem(AppUserService.USER_KEY, this.utente);
    }
  }
  private persistDataUtenteSimulato() {
    if (this.ambiente === 'dev') {
      this.sessionStorage.setItem(AppUserService.UTENTE_SIMULATO_KEY, this.utenteSimulatoDaOperatore);
      this.sessionStorage.setItem(AppUserService.OPERATORE_KEY, this.operatore);
    }
  }

  hydrateData() {
    if (this.ambiente === 'dev') {
      const value = this.sessionStorage.getItem(AppUserService.USER_KEY, true);
      if (value) {
        this.setUtente(value);
      }
      const userSim = this.sessionStorage.getItem(AppUserService.UTENTE_SIMULATO_KEY, true);
      const operatore = this.sessionStorage.getItem(AppUserService.OPERATORE_KEY, true);
      if (userSim) {
        this.setUtenteSimulato(userSim, operatore);
      }
    }
  }

  getPrivacy(ambito: Ambito): boolean {
    const prese: Array<UtentePresaVisione> = this.utente.prese_visione;
    if (isNullOrUndefined(prese)) {
      return false;
    }
    return !isNullOrUndefined(prese.find(s => s.cod_ambito === ambito));

  }

  setPrivacy(ambito: Ambito, value: boolean) {
    if (value) {
      const tmp: UtentePresaVisione = { cod_ambito: ambito };
      if (isNullOrUndefined(this.utente.prese_visione)) {
        const arr = new Array<UtentePresaVisione>();
        this.utente.prese_visione = arr;
      }
      this.utente.prese_visione.push(tmp);
    } else {
      const ind = this.utente.prese_visione.findIndex(s => s.cod_ambito === ambito);
      this.utente.prese_visione = [
        ...this.utente.prese_visione.filter((el, idx) => idx !== ind)
      ];
    }
    this.privacyUpdate.next(this.utente.prese_visione);
    switch (ambito) {
      case Ambito.FASC:
        this.privacyFCUpdate.next(value);
        break;
      case Ambito.GG:
        this.privacyGGUpdate.next(value);
        break;
      case Ambito.RDC:
        this.privacyRdcUpdate.next(value);
        break;
      default:
        break;
    }
  }

  async save() {
    if (this.getPrivacy(Ambito.GG) !== this.originalPresaVisionePrivacy
      || this.getPrivacy(Ambito.RDC) !== this.originalPresaVisionePrivacyRdc
      || this.getPrivacy(Ambito.FASC) !== this.originalPresaVisionePrivacyFASC) {
      await this.businessService.saveUtente(this.utente).pipe(
        tap(usr => this.setUtente(usr)),
        catchError(err => {
          this.logService.log('Errore :', err);
          throw new Error(err.message);
        })
      ).toPromise();
      /*
      await this.businessService.getSAP(this.getUtente().id_utente).pipe(
        catchError( () => of(null))
      ).toPromise();
      */
      const saved = true;
    }
  }

  async saveUtente() {
    await this.businessService.saveUtente(this.utente).pipe(
      tap(usr => this.setUtente(usr)),
      catchError(err => {
        this.logService.log('Errore :', err);
        throw new Error(err.message);
      })
    ).toPromise();
    const saved = true;
  }

  getUtentiACarico(idUtente: number): Promise<Array<UtenteACarico>> {
    return this.businessService.findUtentiACarico(idUtente).pipe(
      catchError((err: HttpErrorResponse) => {
        const errore = err.error || err;
        throw new Error(errore.errorMessage || errore.message);
      })
    ).toPromise();

  }

  getRiepilogoIscrizione(idUtente: number): Promise<EsitoRiepilogoIscrizione> {
    return this.businessService.findRiepilogoUtentiIscrizione(idUtente).pipe(
      catchError((err: HttpErrorResponse) => {
        const errore = err.error || err;
        throw new Error(errore.errorMessage || errore.message);
      })
    ).toPromise();

  }

  verificaEsistenzaUtente(): Promise<Utente> {
    this.utente = {};
    this.logService.log("utente verifica " + this.spidUserService.getUser());
    const cf = this.spidUserService.getUser().codFisc;
    return this.businessService.getUtenteByCf(cf).pipe(
      catchError((err: HttpErrorResponse) => {
        const errore = err.error || err;
        switch (+errore.code || errore.status) {
          case 401:
            // Codice Fiscale e id non coincidono con quelli di SILP
            throw new Error(errore.errorMessage || errore.message);
          case 402:
            // Codice Fiscale presente più volte su SILP
            throw new Error(errore.errorMessage || errore.message);
          case 404:
            return of({
              codice_fiscale: this.spidUserService.getUser().codFisc,
              nome: this.spidUserService.getUser().nome,
              cognome: this.spidUserService.getUser().cognome,
            });
          case 500:
          default:
            // Errore generico
            throw new Error(errore.errorMessage || errore.message);
        }
      }),
      tap((utente: Utente) => this.setUtente(utente))
    ).toPromise();
  }
  public async loadPrivacyUtente(idUtente: number, forceReload = false) {
    if (!this.elencoPrivacyUtente[idUtente] || forceReload) {
      this.elencoPrivacyUtente[idUtente] = await this.privacyService.loadPrivacyUtente(idUtente).toPromise();
    }
    return this.elencoPrivacyUtente[idUtente];
  }

  public async loadPrivacyMinore(idUtente: number, idMinore: number, forceReload = false) {
    if (!this.elencoPrivacyMinore[idUtente]) {
      this.elencoPrivacyMinore[idUtente] = {};
    }
    if (!this.elencoPrivacyMinore[idUtente][idMinore] || forceReload) {
      this.elencoPrivacyMinore[idUtente][idMinore] = await this.privacyService.loadPrivacyMinore(idUtente, idMinore).toPromise();
    }
    return this.elencoPrivacyMinore[idUtente][idMinore];
  }

  public backupVisionePrivacy() {
    this.backupPreseVisione = this.utente.prese_visione;
  }
  public restoreVisionePrivacy() {
    this.utente.prese_visione = this.backupPreseVisione;
  }
}
