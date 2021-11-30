import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EsitoSaveErrato, NavigationEmitter, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

export interface FascicoloSezioniInterface {
  titolo: string;
  modificato: boolean;
  livello: boolean;
}

@Component({
  selector: 'pslfcwcl-esito-errato',
  templateUrl: './esito-errato.component.html'
})
export class EsitoErratoComponent implements OnInit {

  readOnly: boolean;

  nextButtonName: string;
  nextButtonDisabled = true;
  prevButtonName: string;
  titoloPagina = 'Esito Salvataggio';
  errore = false;

  esito: EsitoSaveErrato;
  messaggio: string;

  constructor(
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly commonFCService: CommonPslpService
  ) {

  }

   async ngOnInit() {
      this.readOnly = true;
      this.prevButtonName = 'INDIETRO';
      const messaggio98  = await this.utilitiesService.getMessage('ME098');

      const esito = await this.commonFCService.getEsitoSave();
      this.esito = esito;
      this.messaggio = messaggio98;
      if (!isNullOrUndefined(esito.esitoErr.messaggioInformativo)) {
          this.errore = false;
      } else {
          this.errore = true;
      }
      this.nextButtonName = "Torna a Gestione Fascicolo";
      this.nextButtonDisabled = false;
      this.readOnly = false;
      this.readOnly = false;
  }

  async onExitPage(nav: NavigationEmitter) {
    if (nav.exit === TypeExit.Back  || nav.exit === TypeExit.Prev) {
      if (!isNullOrUndefined(this.esito.urlReturn)) {
        return this.router.navigateByUrl(this.esito.urlReturn);
      }
    }
    if (nav.exit === TypeExit.Next) {
       this.commonFCService.azzeraStorageFascicolo();
    }
    this.router.navigateByUrl(nav.url);
  }

}
