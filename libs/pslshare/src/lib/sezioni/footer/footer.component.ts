import { Component, Optional, Inject, OnInit } from '@angular/core';
import { VersionData } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { APP_VERSION, ParametriSistemaService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

/**
 * Component per la gestione
 *  della parte dinamica del pie di pagina
 *  link isitutuzionali
 */
@Component({
  selector: 'pslshare-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  urlSpid: string;
  urlApl: string;
  urlFesr: string;
  urlCsi: string;
  urlLavPiemonte: string;
  urlRegPiemonte: string;
  urlTuPiemonte: string;

  constructor(
    private readonly parametriSistemaService: ParametriSistemaService,
    @Optional() @Inject(APP_VERSION) public appVersion: VersionData
  ) { }

  async ngOnInit() {
    this.urlSpid = await this.parametriSistemaService.urlSpid;
    this.urlApl = await this.parametriSistemaService.urlApl;
    this.urlFesr = await this.parametriSistemaService.urlFesr;
    this.urlCsi = await this.parametriSistemaService.urlCsi;
    this.urlLavPiemonte = await this.parametriSistemaService.urlLavPiemonte;
    this.urlRegPiemonte = await this.parametriSistemaService.urlRegPiemonte;
    this.urlTuPiemonte = await this.parametriSistemaService.urlTuPiemonte;
  }
}
