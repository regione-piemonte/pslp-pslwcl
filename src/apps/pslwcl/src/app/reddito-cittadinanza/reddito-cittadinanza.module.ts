import { NgModule } from '@angular/core';
import { PslshareModule } from '@pslwcl/pslshare';
import { AppuntamentoRedditoCittadinanzaWrapperComponent } from './appuntamento-reddito-cittadinanza-wrapper/appuntamento-reddito-cittadinanza-wrapper.component';
import { ConfermaComponent } from './conferma/conferma.component';
import { DatiAnagraficiWrapperComponent } from './dati-anagrafici-wrapper/dati-anagrafici-wrapper.component';
import { InformazioniComponent } from './informazioni/informazioni.component';
// tslint:disable-next-line: max-line-length
import { NavigationButtonComponent } from './navigation-button/navigation-button.component';
import { PresentazioneRDCComponent } from './presentazione/presentazione-rdc.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { RedditoCittadinanzaRoutingModule } from './reddito-cittadinanza-routing.module';
import { RedditoCittadinanzaComponent } from './reddito-cittadinanza.component';
import { RiepilogoRDCComponent } from './riepilogo/riepilogo-rdc.component';
import { SchedaRDCComponent } from './riepilogo/scheda-rdc/scheda-rdc.component';
import { WizardComponent } from './wizard/wizard.component';

@NgModule({
  imports: [
    PslshareModule,
    RedditoCittadinanzaRoutingModule
  ],
  declarations: [
    RedditoCittadinanzaComponent,
    PresentazioneRDCComponent,
    DatiAnagraficiWrapperComponent,
    InformazioniComponent,
    AppuntamentoRedditoCittadinanzaWrapperComponent,
    ConfermaComponent,
    WizardComponent,
    PrivacyComponent,
    NavigationButtonComponent,
    RiepilogoRDCComponent,
    SchedaRDCComponent
  ]
})
export class RedditoCittadinanzaModule { }
