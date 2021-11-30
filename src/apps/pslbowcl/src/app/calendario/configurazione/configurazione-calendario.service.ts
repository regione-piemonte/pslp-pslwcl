import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ConfigurazioneCalendarioEccezione, ConfigurazioneCalendarioFascia, ConfigurazioneCalendarioPeriodoValidita } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

export interface Periodo {
  idPeriodo: number;
  dataDa: Date;
  dataA: Date;
}

/**
 * Injectable configurazione calendario service
 */
@Injectable()
export class ConfigurazioneCalendarioService implements OnInit, OnDestroy {
  private readonly periodoUpdate: Subject<ConfigurazioneCalendarioPeriodoValidita> = new BehaviorSubject(null);
  private readonly fasceUpdate: Subject<ConfigurazioneCalendarioFascia[]> = new BehaviorSubject([]);
  private readonly eccezioniUpdate: Subject<ConfigurazioneCalendarioEccezione[]> = new BehaviorSubject([]);

  get periodo$(): Observable<ConfigurazioneCalendarioPeriodoValidita> { return this.periodoUpdate.asObservable(); }
  get fasce$(): Observable<ConfigurazioneCalendarioFascia[]> { return this.fasceUpdate.asObservable(); }
  get eccezioni$(): Observable<ConfigurazioneCalendarioEccezione[]> { return this.eccezioniUpdate.asObservable(); }

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  /**
   * Updates periodo
   * @param periodo ConfigurazioneCalendarioPeriodoValidita
   */
  updatePeriodo(periodo: ConfigurazioneCalendarioPeriodoValidita) {
    if (!periodo) {
      periodo = {};
    }
    Utils.convertHandlingDate(periodo);
    this.periodoUpdate.next(periodo);
  }
  /**
   * Updates fasce
   * @param fasce [ConfigurazioneCalendarioFascia]
   */
  updateFasce(fasce: ConfigurazioneCalendarioFascia[]) {
    fasce = fasce || [];
    Utils.convertHandlingDate(fasce);
    fasce.sort((a, b) => this.sortFasce(a, b));
    this.fasceUpdate.next(fasce);
  }
  /**
   * Updates eccezioni
   * @param eccezioni ConfigurazioneCalendarioEccezione
   */
  updateEccezioni(eccezioni: ConfigurazioneCalendarioEccezione[]) {
    eccezioni = eccezioni || [];
    Utils.convertHandlingDate(eccezioni);
    this.eccezioniUpdate.next(eccezioni);
  }

  onSave() {

  }

  /**
   * Sorts fasce
   * @param a ConfigurazioneCalendarioFascia
   * @param b ConfigurazioneCalendarioFascia
   * @returns numero number
   */
  private sortFasce(a: ConfigurazioneCalendarioFascia, b: ConfigurazioneCalendarioFascia): number {
    if (a.id_giorno_settimana !== b.id_giorno_settimana) {
      return a.id_giorno_settimana - b.id_giorno_settimana;
    }
    return a.ora_inizio - b.ora_fine;
  }
}
