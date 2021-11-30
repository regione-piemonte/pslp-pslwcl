import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { MenuHelpVideo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { BaseCard, ComponenteHelp } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { ParametriSistemaService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

/**
 * Component per la visualizzazione
 *  pagina di aiuto
 *
 */
@Component({
  selector: 'pslshare-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {

  @Input() elencoCard: Array<BaseCard>;
  @Input() flgAccesso: boolean;
  @Input() msgAccesso: string;
  @ViewChild('accordionHelp', { static: false }) accordionHelp: NgbAccordion;
  @ViewChild('accordionVideo', { static: false }) accordionVideo: NgbAccordion;

  messaggioUtente: string;
  listaMessaggi: ComponenteHelp[];
  listaManuali: ComponenteHelp[];
  listaVideo: Array<MenuHelpVideo>;

  constructor(
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly utilitiesService: UtilitiesService,
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    const accesso: boolean = await this.parametriSistemaService.isAccessoCittadinoEnabled;
    this.flgAccesso = accesso;
    this.messaggioUtente =  await this.utilitiesService.getMessage('MI030');
    try {
    const help = await this.utilitiesService.getHelp('0');
    this.listaMessaggi  = help.listaMessaggi;
    this.listaManuali   = help.listaManuali;
    this.listaVideo     = help.listaVideo;
    }
    finally {
      this.utilitiesService.hideSpinner();
    }
  }

}
