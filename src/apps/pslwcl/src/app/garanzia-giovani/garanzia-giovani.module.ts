import { NgModule } from '@angular/core';
import { PslshareModule } from '@pslwcl/pslshare';
import { PsldirectiveModule } from '@pslwcl/psldirective'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppuntamentoGaranziaGiovaniWrapperComponent } from './appuntamento-garanzia-giovani-wrapper/appuntamento-garanzia-giovani-wrapper.component';
import { ConfermaDatiAnagraficiTutoreComponent } from './conferma/conferma-dati-anagrafici-tutore/conferma-dati-anagrafici-tutore.component';
import { ConfermaProfilingComponent } from './conferma/conferma-profiling/conferma-profiling.component';
import { ConfermaComponent } from './conferma/conferma.component';
import { DatiAnagraficiTutoreComponent } from './dati-anagrafici-tutore/dati-anagrafici-tutore.component';
import { DatiAnagraficiWrapperComponent } from './dati-anagrafici-wrapper/dati-anagrafici-wrapper.component';
import { GaranziaGiovaniRoutingModule } from './garanzia-giovani-routing.module';
import { GaranziaGiovaniComponent } from './garanzia-giovani.component';
import { InformazioniComponent } from './informazioni/informazioni.component';
import { NavigationButtonComponent } from './navigation-button/navigation-button.component';
import { PresentazioneComponent } from './presentazione/presentazione.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { ProfilingComponent } from './profiling/profiling.component';
import { ResponsabilitaComponent } from './responsabilita/responsabilita.component';
import { RiepilogoComponent } from './riepilogo/riepilogo.component';
import { SchedaGGComponent } from './riepilogo/scheda-gg/scheda-gg.component';
import { SceltaMinoreComponent } from './scelta-minore/scelta-minore.component';
import { WizardComponent } from './wizard/wizard.component';




@NgModule({
  imports: [
    PslshareModule,
    GaranziaGiovaniRoutingModule,
    PsldirectiveModule
  ],
  declarations: [
    GaranziaGiovaniComponent,
    PresentazioneComponent,
    ProfilingComponent,
    InformazioniComponent,
    ConfermaComponent,
    WizardComponent,
    ResponsabilitaComponent,
    SceltaMinoreComponent,
    DatiAnagraficiTutoreComponent,
    PrivacyComponent,
    ConfermaDatiAnagraficiTutoreComponent,
    ConfermaProfilingComponent,
    NavigationButtonComponent,
    RiepilogoComponent,
    SchedaGGComponent,
    AppuntamentoGaranziaGiovaniWrapperComponent,
    DatiAnagraficiWrapperComponent
  ]
})
export class GaranziaGiovaniModule { }
