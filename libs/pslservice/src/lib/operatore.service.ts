import { Injectable } from '@angular/core';
import { Subject, of} from 'rxjs';
import { Operatore, GestoreService } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { catchError, tap } from 'rxjs/operators';
import { SpidUserService } from './spid-user.service';
import { LogService } from './log';
import { TipoUtente, TipoUtenteCodice } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

/* NOTA:
  > UPDATE idSilp sulla getUtenteByCf
  > UPDATE idSAP  sulla getSAP
  > UPDATE Mail   sulle getSAP e saveSAP* e saveUtente*

  * valore impostato sulla chiamata
*/

@Injectable({
  providedIn: 'root'
})
export class OperatoreService {
  operatoriUpdate =  new Subject<Operatore[]>();
  ruoloUpdate = new Subject<TipoUtenteCodice>();
  private operatori: Operatore[] = undefined;
  private ruolo: TipoUtenteCodice;

  constructor(
    private readonly spidUserService: SpidUserService,
    private readonly gestoreService: GestoreService,
    private readonly logService: LogService,
  ) {}

  getRuolo(): TipoUtenteCodice {
    return this.ruolo;
  }
  setRuolo(ruolo: TipoUtenteCodice) {
    this.ruolo = ruolo;
    this.ruoloUpdate.next(ruolo);
    if (ruolo !== null && TipoUtente.getByCodice(ruolo) !== null) {
      this.logService.log('Ruolo:', ruolo, '-', TipoUtente.getByCodice(ruolo).valore);
    }
  }

  getOperatori(): Operatore[] {
    return this.operatori;
  }

  /**
  * Restituisce i dati dell'utente legato al ruolo scelto
  */
  getOperatoreByRuolo(): Operatore {
    if (isNullOrUndefined(this.ruolo)) {
      return null;
    }
    const ruolo = this.getCodTipoUtente();
    return this.operatori.find(op => op.codice_tipo_utente === ruolo);
  }
  /**
   * Restituisce il ruolo in formato stringa
   */
  getCodTipoUtente(): string {
    if (isNullOrUndefined(this.ruolo)) {
      return null;
    }
    return TipoUtente.getByCodice(this.ruolo).valore;
  }

  setOperatori(value: Operatore[]) {
    this.logService.log('Operatori:', value);
    this.operatori = value;
    if (this.operatori && this.operatori.length === 1) {
      this.setRuolo(TipoUtente.getByValore(this.operatori[0].codice_tipo_utente).codice);
    } else {
      this.setRuolo(undefined);
    }
    this.operatoriUpdate.next(value);
  }

  async isOperatore(): Promise<boolean> {
    await this.findOperatori();
    return !!this.operatori && this.operatori.length > 0;
  }

  async isOperatoreType(operatorType: TipoUtenteCodice): Promise<boolean> {
    const isOperatore = await this.isOperatore();
    const codTipoOperatore = TipoUtente.getByCodice(operatorType).valore;
    return isOperatore && this.operatori.filter( value => value.codice_tipo_utente.toLocaleUpperCase() === codTipoOperatore).length > 0;
  }

  private findOperatori(): any | Promise<any> {
    if (this.operatori !== undefined) {
      return ;
    }
    const user = this.spidUserService.getUser();
    if (!user || !user.codFisc) {
      return;
    }
    return this.gestoreService.getOperatoreByCf(user.codFisc).pipe(
      catchError( () => of([] as Operatore[])),
      tap( operatori => this.setOperatori(operatori))
    ).toPromise();
  }

}
