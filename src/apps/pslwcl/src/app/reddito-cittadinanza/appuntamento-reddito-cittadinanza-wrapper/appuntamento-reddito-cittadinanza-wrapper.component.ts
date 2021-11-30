import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { NavigationEmitter } from '../navigation-button/navigation-button.component';
import { DomandaRDC, PrenotazioneIncontro } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito } from '@pslwcl/pslmodel';

@Component({
  selector: 'app-rdc-appuntamento-wrapper',
  templateUrl: './appuntamento-reddito-cittadinanza-wrapper.component.html'
})
export class AppuntamentoRedditoCittadinanzaWrapperComponent implements OnInit {

  idSilLavDomandaRDC: number;
  confermato: boolean;
  msgSposta: string;
  appuntamentoOld: PrenotazioneIncontro;
  idUtente: number;
  codAmbito: string;

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService
  ) { }

  async ngOnInit() {
    this.codAmbito = Ambito.RDC.valueOf();
    this.idUtente = this.commonPslpService.getUtenteStorage().id_utente;
    this.confermato = false;
    const domandaRDC: DomandaRDC = await this.commonPslpService.getDomanda$();
    this.idSilLavDomandaRDC = domandaRDC.id_sil_lav_domanda_rdc;

    if (this.commonPslpService.appuntamentoOld) {
      this.appuntamentoOld = this.commonPslpService.appuntamentoOld;
      this.msgSposta = this.commonPslpService.msgSposta;
    } else {
      this.msgSposta = null;
      this.appuntamentoOld = null;
    }
   }

  /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   */
  onExitPage(nav: NavigationEmitter) {
    this.commonPslpService.inizializzaSoft();
    this.router.navigateByUrl(nav.url);
  }

  /**
   * Determines whether confermato on
   */
  onConfermato() {
    this.confermato = true;
  }
}
