import { Observable, Subject } from 'rxjs';
import { ConfigurazioneCalendarioFascia } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

export class DisponibilitaSettimanaleService {

  private readonly changedDatiFascia: Subject<ConfigurazioneCalendarioFascia> = new Subject();
  get changedDatiFascia$(): Observable<ConfigurazioneCalendarioFascia> { return this.changedDatiFascia.asObservable(); }

  changeDatiFascia(fascia: ConfigurazioneCalendarioFascia) {
    this.changedDatiFascia.next(fascia);
  }

}
