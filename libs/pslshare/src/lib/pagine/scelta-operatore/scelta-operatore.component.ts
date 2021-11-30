import { Component, OnInit } from '@angular/core';
import { OperatoreService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { TipoUtenteInterface, TipoUtente } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { Router } from '@angular/router';

/**
 * Component per la gestione della scelta del ruolo
 * con cui desidera operare l'operatore di back office
 */
@Component({
  selector: 'pslshare-scelta-operatore',
  templateUrl: './scelta-operatore.component.html'
})
export class SceltaOperatoreComponent implements OnInit {
  ruoli: TipoUtenteInterface[] = [];
  ruolo: TipoUtenteInterface;

  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly router: Router
  ) { }

  ngOnInit() {
    this.operatoreService.getOperatori().forEach(operatore => {
      this.ruoli.push(TipoUtente.getByValore(operatore.codice_tipo_utente));
    });
  }

  sceltaRuolo(value) {
    this.ruolo = value;
  }

  onOK() {
    this.operatoreService.setRuolo(this.ruolo.codice);
    this.router.navigateByUrl('/home');
  }

}
