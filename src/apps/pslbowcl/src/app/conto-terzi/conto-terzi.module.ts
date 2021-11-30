import { NgModule } from '@angular/core';
import { PsldirectiveModule } from '@pslwcl/psldirective'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareModule } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppuntamentoBoWrapperComponent } from './appuntamento-bo-wrapper/appuntamento-bo-wrapper.component';
import { ContoTerziRoutingModule } from './conto-terzi-routing.module';
import { ContoTerziComponent } from './conto-terzi.component';
import { DatiAnagraficiComponent } from './dati-anagrafici/dati-anagrafici.component';

import { RicercaComponent } from './ricerca/ricerca.component';
import { RicercaCollocamentoMiratoComponent } from './ricerca-collocamento-mirato/ricerca-collocamento-mirato.component';

@NgModule({
  imports: [
    ContoTerziRoutingModule,
    PsldirectiveModule,
    PslshareModule
  ],
  declarations: [
    ContoTerziComponent,
    RicercaComponent,
    RicercaCollocamentoMiratoComponent,
    DatiAnagraficiComponent,
    AppuntamentoBoWrapperComponent
  ],
  exports: [
  ]
})
export class ContoTerziModule { }
