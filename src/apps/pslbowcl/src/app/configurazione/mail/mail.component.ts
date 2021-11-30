import { Component, OnInit } from '@angular/core';
import { UtilitiesService, OperatoreService, LogService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, GestoreService, ConfigurazioneMessaggiAggiuntivi, Esito, ErrorDef } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';

@Component({
  selector: 'pslbowcl-mail',
  templateUrl: './mail.component.html'
})
export class MailComponent implements OnInit {
  mailChanged = false;
  configurazioneMail: ConfigurazioneMessaggiAggiuntivi;
  ambitoList: Ambito[];
  messaggioList: ConfigurazioneMessaggiAggiuntivi[];
  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly gestoreService: GestoreService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {
    // Initialize mail
    this.configurazioneMail = {cod_ambito: ''};
    const op = this.operatoreService.getOperatoreByRuolo();

    const idUtente = op.id_utente;
    const [ ambitoList, messaggioList] = await Promise.all([
      this.gestoreService.getAmbiti(idUtente).toPromise(),
      this.gestoreService.getMessaggi(idUtente).toPromise()
    ]);
    this.ambitoList = ambitoList;
    this.messaggioList = messaggioList;

  }

  async onAmbitoChange(ambito: string) {
    // Re-init mail
    this.configurazioneMail = {cod_ambito: ambito};
    if (!ambito) {
      return;
    }
    this.utilitiesService.showSpinner();

    const op = this.operatoreService.getOperatoreByRuolo();
    const idUtente = op.id_utente;
    const [messaggioList] = await Promise.all([
      this.gestoreService.loadMessaggiAggiuntiviAmbito(idUtente, ambito).toPromise()
    ]);

    this.messaggioList = messaggioList;
    if (messaggioList.length > 0) {
        this.configurazioneMail = this.messaggioList[0];
    }
    this.mailChanged = false;
    this.utilitiesService.hideSpinner();
  }

  async onSalva() {

    try {
      this.utilitiesService.showSpinner();
      const op = this.operatoreService.getOperatoreByRuolo();

      const idUtente = op.id_utente;
      if (!isNullOrUndefined(this.configurazioneMail)) {

         const esito: Esito = await this.gestoreService.saveMessaggiAggiuntiviAmbito(idUtente, this.configurazioneMail).pipe(
            catchError( err => {
                this.logService.error('[mail.component::onSalva]', JSON.stringify(err));
              const errore: ErrorDef  = (err instanceof HttpErrorResponse) ? err.error : err;
              const esito2: Esito = {
              code: errore.code,
              messaggioCittadino: errore.messaggioCittadino ? errore.messaggioCittadino : errore.errorMessage
            };
            return of(esito2);
            })).toPromise();
            this.mailChanged = false;
            this.utilitiesService.hideSpinner();
        if (esito.code !== 'OK' && esito.code !== '200') {
          throw new Error(esito.messaggioCittadino);
        }
        this.utilitiesService.showToastrInfoMessage('Salvataggio Eseguito', 'ConfigurazioneMail');
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'ConfigurazioneMail');
    }


  }
}
