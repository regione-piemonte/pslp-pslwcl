import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConfigService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

export interface FascicoloSezioniInterface {
  titolo: string;
  modificato: boolean;
  livello: boolean;
}

@Component({
  selector: 'pslphome-mappa',
  templateUrl: './mappa.component.html'
})
export class MappaComponent implements OnInit {
  // andrà corretto per funzionare nei vari ambienti test collaudo e produzione
  // url = "https://tst-secure.sistemapiemonte.it/pslpublicweb/mappa/mappa.html";
  url = ConfigService.getMappeURL();
  urlSafe: SafeResourceUrl;

  constructor(public sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }
}
