import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdesioneYG, BusinessService, DomandaRDC, PrenotazioneIncontro } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { NavigationEmitter } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice';
import { of, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'pslbowcl-appuntamento-bo-wrapper',
  templateUrl: './appuntamento-bo-wrapper.component.html'
})
export class AppuntamentoBoWrapperComponent implements OnInit {
  idSilLavRiferimentoAdesioneDomanda: number;
  confermato: boolean;
  private readonly subscriptions: Subscription[] = [];
   codAmbito: string;
   ambitoDescr: string;
   idUtente: number;
   idPrenotazioneOld: number;
  appuntamentoOld: PrenotazioneIncontro;
  msgSposta: string;

  constructor(
    private readonly businessService: BusinessService,
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly route: ActivatedRoute
  ) { }

  async ngOnInit() {
    this.confermato = false;
    this.codAmbito = this.route.snapshot.queryParams['ambito'];
    this.idUtente = this.route.snapshot.queryParams['idUtente'];
    this.idPrenotazioneOld = this.route.snapshot.queryParams['idPrenotazione'];
    this.msgSposta = this.route.snapshot.queryParams['msgSposta'];

    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      this.idUtente = params['idUtente'] ? +params['idUtente'] : null;
      this.codAmbito = params['ambito'];
      this.idPrenotazioneOld = params['idPrenotazione'] ? +params['idPrenotazione'] : null;

    }));

    this.appuntamentoOld = await this.getAppuntamento(this.idUtente, this.codAmbito, this.idPrenotazioneOld);
    this.idSilLavRiferimentoAdesioneDomanda = await this.getRiferimento(this.idUtente, this.codAmbito);
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

  onIndietro() {
    this.router.navigate(['/conto-terzi/ricerca'], { queryParams: { idUtente: this.idUtente } });
  }

  private async getAppuntamento(idUtente: number, codAmbito: string, idPrenotazione: number): Promise<PrenotazioneIncontro> {
    if (!idPrenotazione) {
      return null as PrenotazioneIncontro;
    }
    return this.businessService.findIncontri(idUtente, codAmbito).pipe(
      map(v => v.filter(i => i.id_prenotazione === idPrenotazione)),
      map(v => v.length === 1 ? v[0] : null as PrenotazioneIncontro),
      catchError(() => of(null as PrenotazioneIncontro))
    ).toPromise();
  }

  private async getRiferimento(idUtente: number, codAmbito: string): Promise<number> {
    let idSilRifAmbito: number;
    switch (codAmbito) {
      case 'GG':
        const adesioneGG: AdesioneYG = await this.getAdesioneGG(this.idUtente);
        idSilRifAmbito = adesioneGG.id_sil_lav_adesione;
        break;
      case 'RDC':
        const domandaRDC: DomandaRDC = await this.getDomandaRDC(this.idUtente);
        idSilRifAmbito = domandaRDC.id_sil_lav_domanda_rdc;
        break;
      default:
        throw new Error('Appuntamento: ambito non definito');
    }
    return idSilRifAmbito;
  }

  getAdesioneGG(idUtente: number): Promise<AdesioneYG> {
    return this.businessService.getAdesioneYG(idUtente).pipe(
      catchError(() => of({} as AdesioneYG))
    ).toPromise();
  }

  getDomandaRDC(idUtente: number): Promise<DomandaRDC> {
    return this.businessService.getDomandaRDC(idUtente).pipe(
      catchError(() => of({} as DomandaRDC))
    ).toPromise();
  }
}
