import { NgModule } from '@angular/core';
import { PslshareModule } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { PsldirectiveModule } from '@pslwcl/psldirective'; // NOSONAR evita falso positivo rule typescript:S4328

import { DatiAmministrativiComponent } from './dati-amministrativi/dati-amministrativi.component';
import { DatiAnagraficiNuovaSapComponent } from './dati-anagrafici-nuova-sap/dati-anagrafici-nuova-sap.component';
import { DatiAnagraficiWrapperComponent } from './dati-anagrafici-wrapper/dati-anagrafici-wrapper.component';
import { AbilitazioniComponent } from './dati-curriculari/abilitazioni/abilitazioni.component';
import { ConoscenzeInformaticheComponent } from './dati-curriculari/conoscenze-informatiche/conoscenze-informatiche.component';
import { DatiCurriculariComponent } from './dati-curriculari/dati-curriculari.component';
import { FormazioneProfessionaleComponent } from './dati-curriculari/formazione-professionale/formazione-professionale.component';
import { IstruzioneComponent } from './dati-curriculari/istruzione/istruzione.component';
import { LingueStraniereComponent } from './dati-curriculari/lingue-straniere/lingue-straniere.component';
import { PanelTitleComponent } from './dati-curriculari/panel-title/panel-title.component';
import { PatentiComponent } from './dati-curriculari/patenti/patenti.component';
import { EsitoAcquisizioneComponent } from './esito-acquisizione/esito-acquisizione.component';
import { EsitoErratoComponent } from './esito-errato/esito-errato.component';
import { DettaglioLavoroComponent } from './esperienze-lavoro/dettaglio-lavoro/dettaglio-lavoro.component';
import { EsperienzeLavoroComponent } from './esperienze-lavoro/esperienze-lavoro.component';
import { FascicoloCittadinoRoutingModule } from './fascicolo-cittadino-routing.module';
import { FascicoloCittadinoComponent } from './fascicolo-cittadino.component';
import { NavigationButtonFCComponent } from './navigation-button-fc/navigation-button-fc.component';
import { PoliticheAttiveComponent } from './politiche-attive/politiche-attive.component';
import { PresentazioneFCComponent } from './presentazione-fc/presentazione-fc.component';
import { PrivacyFCComponent } from './privacy-fc/privacy-fc.component';
import { RiepilogoFCComponent } from './riepilogo-fc/riepilogo-fc.component';
import { SchedaFCComponent } from './riepilogo-fc/scheda-fc/scheda-fc.component';
import { WizardComponent } from './wizard/wizard.component';

@NgModule({
  imports: [
    PslshareModule,

    FascicoloCittadinoRoutingModule,
    PsldirectiveModule
  ],
  declarations: [
    FascicoloCittadinoComponent,
    PresentazioneFCComponent,
    RiepilogoFCComponent,
    SchedaFCComponent,
    PrivacyFCComponent,
    WizardComponent,
    NavigationButtonFCComponent,
    DatiAnagraficiWrapperComponent,
    DatiAmministrativiComponent,
    EsperienzeLavoroComponent,
    DatiCurriculariComponent,
    PoliticheAttiveComponent,
    EsitoAcquisizioneComponent,
    EsitoErratoComponent,
    IstruzioneComponent,
    FormazioneProfessionaleComponent,
    LingueStraniereComponent,
    ConoscenzeInformaticheComponent,
    DettaglioLavoroComponent,
    AbilitazioniComponent,
    PatentiComponent,
    PanelTitleComponent,
    DatiAnagraficiNuovaSapComponent
  ]
})
export class FascicoloCittadinoModule { }
