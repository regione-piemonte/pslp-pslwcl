import { NgModule } from '@angular/core';
import { PslshareModule } from '@pslwcl/pslshare';
import { PsldirectiveModule } from '@pslwcl/psldirective'; // NOSONAR evita falso positivo rule typescript:S4328
import { DettaglioPrivacyComponent } from './dettaglio-privacy/dettaglio-privacy.component';
import { PresentazionePrivacyComponent } from './dettaglio-privacy/presentazione-privacy/presentazione-privacy.component';
import { PrivacyTemplateComponent } from './dettaglio-privacy/privacy-template/privacy-template.component';
import { PrivacyRoutingModule } from './privacy-routing.module';
import { PrivacyComponent } from './privacy.component';
import { GestioneMinorePrivacyComponent } from './riepilogo-privacy/gestione-minore-privacy/gestione-minore-privacy.component';
import { RiepilogoPrivacyComponent } from './riepilogo-privacy/riepilogo-privacy.component';
import { SchedaPrivacyComponent } from './riepilogo-privacy/scheda-privacy/scheda-privacy.component';



@NgModule({
  imports: [
    PslshareModule,

    PrivacyRoutingModule,
    PsldirectiveModule
  ],
  declarations: [
    PrivacyComponent,
    DettaglioPrivacyComponent,
    PrivacyTemplateComponent,
    GestioneMinorePrivacyComponent,

    RiepilogoPrivacyComponent,
    SchedaPrivacyComponent,
    PresentazionePrivacyComponent,
  ]
})
export class PrivacyModule { }
