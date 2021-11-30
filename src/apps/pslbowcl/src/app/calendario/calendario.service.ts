import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable, of } from 'rxjs';
import { OperatoreService, SessionStorageService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { GestoreService, ConfigurazioneCalendario } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private  readonly _readOnly: Subject<boolean> = new BehaviorSubject<boolean>(false);

  set readOnly(value: boolean) {
    this._readOnly.next(value);
  }
  get readOnly$(): Observable<boolean> {
    return this._readOnly.asObservable();
  }

  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly gestoreService: GestoreService,
    private readonly sessionStorageService: SessionStorageService
  ) { }

  loadCalendario(idCalendario: number): Observable<ConfigurazioneCalendario> {
    const operatore = this.operatoreService.getOperatoreByRuolo();
    return this.gestoreService.loadCalendario(operatore.id_utente, idCalendario).pipe(
      catchError( () => of({} as ConfigurazioneCalendario) ),
      tap( cc => this.sessionStorageService.setItem<ConfigurazioneCalendario>(SessionStorageService.CONFIGURAZIONE_CALENDARIO, cc))
    );
  }
}
