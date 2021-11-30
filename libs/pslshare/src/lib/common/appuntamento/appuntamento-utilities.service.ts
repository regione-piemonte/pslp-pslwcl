import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import getDeepValue from 'get-deep-value';
import { NOT_FOUND } from 'http-status-codes';
import * as moment from 'moment';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LogService} from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { StatoIncontro } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { BusinessService, Calendario, Ente, ErrorDef, ParametriRicercaDisponibilitaIncontri, ParametriRicercaPrimaDisponibilitaIncontri, ParametriSalvataggioIncontro, PrenotazioneIncontro, SchedaAnagraficoProfessionale, SlotIncontro, Sportello } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice';


@Injectable({
  providedIn: 'root'
})
export class AppuntamentoUtilitiesService {

  constructor(
    private readonly businessService: BusinessService,
    private readonly commonPslpService: CommonPslpService,

    private readonly logService: LogService,
    private readonly router: Router
  ) { }

  private readonly DATE_FORMAT = 'DD/MM/YYYY';
  public readonly DA_EROGARE = 'Da Erogare';

  /**
   * Compare descizione
   */
  private compareDescizione(a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  }
  /**
   * Gets sportelli
   * @param sap SchedaAnagraficoProfessionale
   * @returns sportelli
   */
  getSportelli(sap: SchedaAnagraficoProfessionale, codAmbito: string, codTipoUtente: string): Promise<Ente[]> {

    const codiceDomicilio = getDeepValue(sap, 'domicilio.comune.codice_ministeriale');
    const codiceResidenza = getDeepValue(sap, 'residenza.comune.codice_ministeriale');

    return this.businessService.findSportelli(
      codAmbito,
      codTipoUtente,
      codiceDomicilio,
      codiceResidenza
    ).pipe(
      map((value: Ente[]) => {
        value.sort((a: Ente, b: Ente) => a.descrizione.localeCompare(b.descrizione));
        return value;
      }),
      tap((value: Ente[]) => {
        value.forEach((e: Ente) => {
          e.sportelli.sort(this.compareDescizione);
          return e.sportelli;
        });
        return value;
      }),
      catchError((err) => {
        if (err.error && err.error.errorMessage) {
          const msg: Params = { 'message': err.error.errorMessage };
          this.router.navigate(['/error-page'], { queryParams: msg });
        }
        return of([] as Ente[]);
      })
    ).toPromise();
  }

  /**
   * Gets intervallo disponibile
   * @param sportello Sportello
   * @param codAmbito: string
   *
   * @returns intervallo disponibile
   */
  getIntervalloDisponibile(sportello: Sportello, codAmbito: string): Promise<Array<Date>> {
    const parametri: ParametriRicercaPrimaDisponibilitaIncontri = {
      cod_ambito: codAmbito,
      gruppo_operatore: sportello.gruppo_operatore,
      cod_operaratore: sportello.cod_operatore,
      subcodice: sportello.subcodice
    };

    return this.businessService.findIntervalloDisponibile(parametri).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status !== NOT_FOUND) {
          this.logService.log('primoGiornoDisponibile', err);
        }
        return of(null);
      })
    ).toPromise();
  }

  /**
   * Gets slots
   * @param dataDa moment.Moment
   * @param dataA  moment.Moment
   * @param sportello Sportello
   * @param codAmbito string
   *
   * @returns slots
   */
  getSlots(dataDa: moment.Moment, dataA: moment.Moment, sportello: Sportello, codAmbito: string): Promise<SlotIncontro[]> {
    const parametri: ParametriRicercaDisponibilitaIncontri = {
      data_da: dataDa.format(this.DATE_FORMAT),
      data_a: dataA.format(this.DATE_FORMAT),
      cod_ambito: codAmbito,
      gruppo_operatore: sportello.gruppo_operatore,
      cod_operaratore: sportello.cod_operatore,
      subcodice: sportello.subcodice
    };

    return this.businessService.findSlots(parametri).pipe(
      catchError(() => of([] as SlotIncontro[]))
    ).toPromise();
  }

  /**
   * Saves incontro
   * @param idSlot   number
   * @param note     string
   * @param idSilRifAmbito    idsilLavAdesione o idsillavDomanda
   * @param idUtente number
   * @param appuntamentoOld: PrenotazioneIncontro
   *
   */
  async saveIncontro(idSlot: number, note: string, idSilRifAmbito: number, idUtente: number, appuntamentoOld: PrenotazioneIncontro ) {

    const parametriSalvataggioIncontro: ParametriSalvataggioIncontro = {
      id_utente: idUtente,
      // vecchio  this.commonPslpService.getUtenteStorage().id_utente,
      id_slot: idSlot,
      id_stato_appuntamento: StatoIncontro.getByDescrizione(this.DA_EROGARE).codice,
      id_sil_rif_ambito: idSilRifAmbito,
      note: note
    };
    if (appuntamentoOld) {
      parametriSalvataggioIncontro.id_prenotazione_old = appuntamentoOld.id_prenotazione;
    }

    return this.businessService.saveIncontro(parametriSalvataggioIncontro).pipe(
      catchError(err => {
        const errore: ErrorDef = (err instanceof HttpErrorResponse) ? err.error : err;
        throw new Error(errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage);
      })
    ).toPromise();
  }

  /**
   * Gets calendario
   * Params appuntamento utilities service
   * @param sportello  : Sportello
   * @param codAmbito: string
   *
   * @returns calendario
   */
  async getCalendario(sportello: Sportello, codAmbito: string): Promise<Calendario> {
    const parametri: ParametriRicercaPrimaDisponibilitaIncontri = {
      cod_ambito: codAmbito,
      gruppo_operatore: sportello.gruppo_operatore,
      cod_operaratore: sportello.cod_operatore,
      subcodice: sportello.subcodice
    };

    return this.businessService.findCalendario(parametri).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status !== NOT_FOUND) {
          this.logService.log('getCalendario', err);
        }
        return of({} as Calendario);
      })
    ).toPromise();
  }

  /**
   * Gets sap
   * @param idUtente  number
   * @returns sap   SchedaAnagraficoProfessionale
   */
  async getSap(idUtente: number): Promise<SchedaAnagraficoProfessionale> {
    return this.businessService.getSAP(idUtente).pipe(
      catchError(() => of({} as SchedaAnagraficoProfessionale))
    ).toPromise();
  }

}
