import { Injectable } from '@angular/core';
import { BusinessService, CondizioneOccupazionale, GradoStudio, MotivoPresenzaInItalia, Provincia, TitoloStudio } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProfilingUtilitiesService {

  constructor(
    private readonly businessService: BusinessService
  ) { }

  /**
   * Compares descizione
   *
   */
  private compareDescizione(a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  }

  /**
   * Gets gradi studio
   * @returns gradi studio
   */
  getGradiStudio(): Promise<GradoStudio[]> {
    return this.businessService.getGradiStudio().pipe(
      map(value => {
        value.sort(this.compareDescizione);
        return value;
      } ),
      catchError(err => of([] as GradoStudio[]))
    ).toPromise();
  }

  /**
   * Gets titoli studio
   * @param idGradoStudio number
   * @returns titoli studio
   */
  getTitoliStudio(idGradoStudio?: number): Promise<TitoloStudio[]> {
    return this.businessService.getTitoliStudio(idGradoStudio).pipe(
      map(value => {
        value.sort(this.compareDescizione);
        return value;
      } ),
      catchError(err => of([] as TitoloStudio[]))
    ).toPromise();
  }

  /**
   * Gets condizioni occupazionali
   * @returns condizioni occupazionali
   */
  getCondizioniOccupazionali(): Promise<CondizioneOccupazionale[]> {
    return this.businessService.getCondizioniOccupazionali().pipe(
      map(value => {
        value.sort(this.compareDescizione);
        return value;
      }  ),
      catchError(err => of([] as CondizioneOccupazionale[]))
    ).toPromise();
  }

  /**
   * Gets motivi presenza in italia
   * @returns motivi presenza in italia
   */
  getMotiviPresenzaInItalia(): Promise<MotivoPresenzaInItalia[]> {
    return this.businessService.getMotiviPresenzaInItalia().pipe(
      map(value => {
        value.sort(this.compareDescizione);
        return value;
      }  ),
      catchError(err => of([] as MotivoPresenzaInItalia[]))
    ).toPromise();
  }

  /**
   * Gets provincia desc by cod ministeriale$
   * @param codiceMinisteriale string
   * @returns Provincia
   */
  getProvinciaDescByCodMinisteriale$(codiceMinisteriale: string) {
    return this.businessService.getProvince().pipe(
      map((province: Provincia[]) =>
        province
          .filter(provincia => provincia.codice_ministeriale === codiceMinisteriale)
          .pop()
          .descrizione),
      catchError(() => of(''))
    ).toPromise();
  }
}
