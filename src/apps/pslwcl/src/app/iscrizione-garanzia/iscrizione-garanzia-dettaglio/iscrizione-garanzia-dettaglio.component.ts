import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, NavigationEmitter, TypeDialogMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';

export type WindowState = 'I' | 'V' | 'U';
const TITOLO_PAGINA = "ISCRIZIONE AL PROGRAMMA GARANZIA GIOVANI IN PIEMONTE";

@Component({
  selector: 'app-iscrizione-garanzia-dettaglio',
  templateUrl: './iscrizione-garanzia-dettaglio.component.html'
})
export class IscrizioneGaranziaDettaglioComponent implements OnInit {
  idUtente: number;
  prevButtonName = 'INDIETRO';
  statoMaschera: WindowState = 'V';
  hasSAP: boolean;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService,
    private readonly pslbasePageService: PslshareService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.commonPslpService.inizializzaHard();

    const utente = this.appUserService.getUtente();
    if (!isNullOrUndefined(this.commonPslpService.getIdUtenteMinore())) {
      // utente minore
      this.idUtente = this.commonPslpService.getIdUtenteMinore();
    } else {
      this.idUtente = this.appUserService.getIdUtente();
    }

    this.utilitiesService.hideSpinner();

  }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   *
   */
  async onExitPage(nav: NavigationEmitter) {
    if (this.statoMaschera === 'I') {
      const titoloPagina = TITOLO_PAGINA;
      const data: DialogModaleMessage = {
        titolo: titoloPagina,
        tipo: TypeDialogMessage.YesOrNo,
      };
      const res = await this.pslbasePageService.richiestaFinestraModale(data);
      if (res === 'NO') {
        return;
      }
    }
    const urlUscita = nav.url;
    this.router.navigateByUrl(urlUscita);
  }

}
