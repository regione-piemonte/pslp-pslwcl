import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Ambito, ConfigurazioneCalendarioHeader, Esito, GestoreService, Operatore, ParametriRicercaCalendari, Sportello } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { OperatoreService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

export interface SportelloExtend extends Sportello {
  id: number;
}

export interface CodSportello {
  gruppo_operatore: string;
  cod_operatore: number;
  subcodice: number;
}

export interface SearchParameters {
  codiceAmbito: string;
  dataInizio: Date;
  dataFine: Date;
  nomeCalendario: string;
  calendarioEliminato: boolean;
  sportello: CodSportello;
}

@Injectable({
  providedIn: 'root'
})
export class RicercaCalendarioService {
  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly gestoreService: GestoreService
  ) { }

  getSportelliExtend(operatore: Operatore): Promise<SportelloExtend[]> {
    const ruolo = this.operatoreService.getCodTipoUtente();
    return this.gestoreService.getSportelli(operatore.id_utente, ruolo).pipe(
      map(sportelli => sportelli.map((sportello, index) => ({ ...sportello, id: index + 1 } as SportelloExtend)))
    ).toPromise();
  }

  getEntiExtend(operatore: Operatore): Promise<SportelloExtend[]> {
    const ruolo = this.operatoreService.getCodTipoUtente();
    return this.gestoreService.getEnti(operatore.id_utente, ruolo, 'I').pipe(
      map(sportelli => sportelli.map((sportello, index) => ({ ...sportello, id: index + 1 } as SportelloExtend)))
    ).toPromise();
  }

  getAmbiti(operatore: Operatore): Promise<Ambito[]> {
    return this.gestoreService.getAmbiti(operatore.id_utente).toPromise();
  }

  getCalendari(operatore: Operatore, searchParameters): Promise<ConfigurazioneCalendarioHeader[]> {
    const parametriRicercaCalendari: ParametriRicercaCalendari = {
      cod_ambito: searchParameters.codiceAmbito,
      gruppo_operatore: searchParameters.sportello ? searchParameters.sportello.gruppo_operatore : null,
      cod_operaratore: searchParameters.sportello ? searchParameters.sportello.cod_operatore : null,
      subcodice: searchParameters.sportello ? searchParameters.sportello.subcodice : null,
      data_da: searchParameters.dataInizio,
      data_a: searchParameters.dataFine,
      nome_calendario: searchParameters.nomeCalendario,
      calendario_eliminato: searchParameters.calendarioEliminato,
      cod_tipo_utente: operatore.codice_tipo_utente
    };
    return this.gestoreService.findCalendari(operatore.id_utente, parametriRicercaCalendari).toPromise();
  }

  getIdEnteSearchParameter(listaSportelli: SportelloExtend[], codSportello: CodSportello): number {
    if (!listaSportelli || !codSportello) {
      return null;
    }
    const sportello = listaSportelli.find(v =>
      codSportello.gruppo_operatore === v.gruppo_operatore &&
      codSportello.cod_operatore === v.cod_operatore &&
      codSportello.subcodice === v.subcodice
    );
    if (!sportello) {
      return null;
    }
    return sportello.id;
  }

  verificaEliminaCalendario(idCalendario: number): Promise<Esito> {
    const idUtente = this.operatoreService.getOperatoreByRuolo().id_utente;
    return this.gestoreService.verificaVincoliEliminazioneCalendario(idUtente, idCalendario).toPromise();
  }
  eliminaCalendario(idCalendario: number): Promise<Esito> {
    const idUtente = this.operatoreService.getOperatoreByRuolo().id_utente;
    return this.gestoreService.eliminaCalendario(idUtente, idCalendario).toPromise();
  }

  bloccaCalendario(idCalendario: number): Promise<Esito> {
    return this.setBloccaCalendario(idCalendario, true);
  }
  sbloccaCalendario(idCalendario: number): Promise<Esito> {
    return this.setBloccaCalendario(idCalendario, false);
  }
  private setBloccaCalendario(idCalendario: number, flag: boolean): Promise<Esito> {
    const idUtente = this.operatoreService.getOperatoreByRuolo().id_utente;
    return this.gestoreService.impostaBloccoCalendario(idUtente, idCalendario, flag).toPromise();
  }
}
