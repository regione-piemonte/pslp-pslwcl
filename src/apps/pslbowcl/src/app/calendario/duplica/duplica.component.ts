import { Component, OnInit, OnDestroy } from '@angular/core';
import { TipoUtente } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ente, ConfigurazioneCalendario, GestoreService, Ambito } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { OperatoreService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

/**
 * Component DuplicaComponent
 */
@Component({
  selector: 'pslbowcl-duplicazione',
  templateUrl: './duplica.component.html',
  styleUrls: ['./duplica.component.css']
})
export class DuplicaComponent implements OnInit, OnDestroy {

  confCalendario: ConfigurazioneCalendario;
  confCalendarioDuplicato: ConfigurazioneCalendario;
  entiOld: Ente[];
  entiNew: Ente[];
  ambitoList: Ambito[];
  loaded = false;

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly gestoreService: GestoreService,
    private readonly route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.subscriptions.push(
      this.route.data.subscribe(data => this.confCalendario = data.configurazioneCalendario)
    );
    if (!this.confCalendario) {
      this.confCalendario = {};
    }
    this.confCalendarioDuplicato = {
      codice_ambito: this.confCalendario.codice_ambito,
      codice_operatore: this.confCalendario.codice_operatore,
      gruppo_operatore: this.confCalendario.gruppo_operatore,
      subcodice: this.confCalendario.subcodice,
      id_calendario: this.confCalendario.id_calendario,
    };

    const op = this.operatoreService.getOperatoreByRuolo();
    const ruolo: string = TipoUtente.getByCodice(this.operatoreService.getRuolo()).valore;

    const [entiOld, entiNew, ambitoList] = await Promise.all([
      this.gestoreService.getEnti(op.id_utente, ruolo, 'M').toPromise(),
      this.gestoreService.getEnti(op.id_utente, ruolo, 'I').toPromise(),
      this.gestoreService.getAmbiti(op.id_utente).toPromise()
    ]);
    this.entiOld = entiOld || [];
    this.entiNew = entiNew || [];
    this.ambitoList = ambitoList || [];

    this.loaded = true;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
