import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdesioneYG, PrenotazioneIncontro } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, NavigationEmitter } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice';

@Component({
  selector: 'app-gg-appuntamento-wrapper',
  templateUrl: './appuntamento-garanzia-giovani-wrapper.component.html'
})
export class AppuntamentoGaranziaGiovaniWrapperComponent implements OnInit {

  confermato: boolean;
  msgSposta: string;
  appuntamentoOld: PrenotazioneIncontro;
  idUtente: number;
  codAmbito: string;
  idSilLavAdesione: number;

  constructor(
    private readonly router: Router,

    private readonly commonPslpService: CommonPslpService
  ) { }

  async ngOnInit() {
    this.codAmbito = Ambito.GG.valueOf();
    this.idUtente = this.commonPslpService.getUtenteStorage().id_utente;
    this.confermato = false;
    const adesioneGG: AdesioneYG = await this.commonPslpService.getAdesione$();
    this.idSilLavAdesione = adesioneGG.id_sil_lav_adesione;

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
