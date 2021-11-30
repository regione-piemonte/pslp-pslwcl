import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleMessage, NavigationEmitter, TypeDialogMessage } from '@pslwcl/pslmodel';
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice';
import { PslshareService } from '../../../../pslshare.service';
import { Subscription } from 'rxjs';
import { WindowState } from '../../dati-graduatoria/dati-graduatoria.component';

@Component({
  selector: 'pslshare-graduatoria',
  templateUrl: './graduatoria.component.html',
})

export class GraduatoriaComponent implements OnInit, OnDestroy {

  readOnly: boolean;
  dataChanged = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  private readonly subscriptions: Subscription[] = [];
  messaggioErroreDati: string;
  titoloPagina = 'Dati Anagrafici';
  urlUscita: string;
  prevButtonName = 'INDIETRO';
  statoMaschera: WindowState = 'V';


  provinciaDomicilioOriginal: string;
  msgCambioDomicilio: string;
  private messaggioErroreProvincia: string;


  constructor(
    private readonly pslbasepageService: PslshareService,
    private readonly router: Router,
    private readonly utilitiesService: UtilitiesService,
    private readonly route: ActivatedRoute,
    private readonly commonPslpService: CommonPslpService
  ) { }

  async ngOnInit() {
    this.subscriptions.push(
      this.route.data.subscribe(data => this.sap = data.sap)
    );

    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    this.readOnly = this.commonPslpService.readOnlyCM;

  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  isValidData(): boolean {
    // this.checkData();
    const valido = !this.flagChanging
      && this.sap
      && (this.commonPslpService.wizard || this.dataChanged);
    return valido;
  }
 /**
   * Determines whether exit page on
   * @param nav NavigationEmitter
   *
   */
  async onExitPage(nav: NavigationEmitter) {
    if (this.statoMaschera === 'I') {
      let titoloPagina: string;
      const data: DialogModaleMessage = {
        titolo: titoloPagina,
        tipo: TypeDialogMessage.YesOrNo,
      };
      const res = await this.pslbasepageService.richiestaFinestraModale(data);
      if (res === 'NO') {
        return;
      }
    }
    const urlUscita = nav.url;
    this.router.navigateByUrl(urlUscita);
  }

  onSapChange(value: SchedaAnagraficoProfessionale) {
    this.sap = value;
  }

  /**
   * Determines whether data change on
   * @param value boolean
   */
   onDataChange(value: boolean) {
    this.dataChanged = value;
    this.nextButtonName = this.commonPslpService.wizard === false ? 'SALVA' : 'SALVA & PROSEGUI';
  }

  /**
   * Determines whether flag changing on
   * @param value boolean
   */
   onFlagChanging(value: boolean) {
    this.flagChanging = value;
  }
}
