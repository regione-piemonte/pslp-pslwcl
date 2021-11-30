import { NgModule } from '@angular/core';
import { PslshareModule } from '@pslwcl/pslshare';
import { PsldirectiveModule } from '@pslwcl/psldirective'; // NOSONAR evita falso positivo rule typescript:S4328
import { DettaglioDIDComponent } from './dettaglio-did/dettaglio-did.component';
import { DIDRoutingModule } from './did-routing.module';
import { DIDComponent } from './did.component';
import { NavigationButtonDIDComponent } from './navigation-button-did/navigation-button-did.component';
import { PattoServizioComponent } from './patto-servizio/patto-servizio.component';
import { RiepilogoDIDComponent } from './riepilogo-did/riepilogo-did.component';
import { SchedaDIDComponent } from './riepilogo-did/scheda-did/scheda-did.component';



@NgModule({
  imports: [
    PslshareModule,

    DIDRoutingModule,
    PsldirectiveModule
  ],
  declarations: [
    DIDComponent,
    RiepilogoDIDComponent,
    SchedaDIDComponent,
    DettaglioDIDComponent,
    NavigationButtonDIDComponent,
    PattoServizioComponent
  ]
})
export class DIDModule { }
