import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { ConfigurazioneCalendario } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable } from 'rxjs';
import { SessionStorageService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { CalendarioService } from './calendario.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarioResolverService implements Resolve<ConfigurazioneCalendario> {

  constructor(
    private readonly sessionStorageService: SessionStorageService,
    private readonly calendarioService: CalendarioService

  ) { }

  resolve(
      route: ActivatedRouteSnapshot,
      state: RouterStateSnapshot): ConfigurazioneCalendario | Observable<ConfigurazioneCalendario> | Promise<ConfigurazioneCalendario> {
    const idCalendario: number = +route.queryParams['idCalendario'];
    if (isNaN(idCalendario)) {
      return {} as ConfigurazioneCalendario;
    }
    // tslint:disable-next-line: max-line-length
    const calendario = this.sessionStorageService.getItem<ConfigurazioneCalendario>(SessionStorageService.CONFIGURAZIONE_CALENDARIO, true);
    if (calendario && calendario.id_calendario === idCalendario) {
      return calendario;
    }
    return this.calendarioService.loadCalendario(idCalendario);
  }
}
