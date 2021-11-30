import { Component, OnInit, ViewChild} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, Params } from '@angular/router';
import { SpidUserService, ConfigService, OperatoreService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

/**
 * Component gestione  pagina login
 *  per accesso operatore
 *   in ambiente di sviluppo/test
 */
@Component({
  selector: 'pslshare-login-operatore',
  templateUrl: './login-operatore.component.html',
  styleUrls: ['./login-operatore.component.css']
})
export class LoginOperatoreComponent implements OnInit {

  @ViewChild('loginForm', { static: true }) loginForm: NgForm;

  constructor(
    private readonly router: Router,
    private readonly spidUserService: SpidUserService,
    private readonly operatoreService: OperatoreService

  ) { }

  ngOnInit() {
    if (!ConfigService.useAutenticationPage()) {
      const msg: Params = {message: 'Non è possibile usare la pagina di login per effettuare l\'autenticazione!'};
      this.router.navigate(['/error-page'], {queryParams: msg});
    }
  }

  onSubmit() {
    this.operatoreService.setOperatori(undefined);
    this.spidUserService.setUser({
      codFisc: this.loginForm.controls.cf.value,
      nome: this.loginForm.controls.nome.value,
      cognome: this.loginForm.controls.cognome.value
    });
    this.router.navigateByUrl('');
  }
}
