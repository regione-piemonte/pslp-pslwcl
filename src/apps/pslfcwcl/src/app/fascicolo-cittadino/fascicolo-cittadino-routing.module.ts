import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UtenteGuard } from '../guard/utente.guard';
import { DatiAmministrativiComponent } from './dati-amministrativi/dati-amministrativi.component';
import { DatiAnagraficiNuovaSapComponent } from './dati-anagrafici-nuova-sap/dati-anagrafici-nuova-sap.component';
import { DatiAnagraficiWrapperComponent } from './dati-anagrafici-wrapper/dati-anagrafici-wrapper.component';
import { DatiCurriculariComponent } from './dati-curriculari/dati-curriculari.component';

import { EsitoAcquisizioneComponent } from './esito-acquisizione/esito-acquisizione.component';
import { EsitoErratoComponent } from './esito-errato/esito-errato.component';
import { EsperienzeLavoroComponent } from './esperienze-lavoro/esperienze-lavoro.component';
import { FascicoloCittadinoComponent } from './fascicolo-cittadino.component';
import { PoliticheAttiveComponent } from './politiche-attive/politiche-attive.component';
import { PresentazioneFCComponent } from './presentazione-fc/presentazione-fc.component';
import { RiepilogoFCComponent } from './riepilogo-fc/riepilogo-fc.component';

const fascicoloCittadinoRoutes: Routes = [
  {
    path: 'fascicolo-cittadino',
    component: FascicoloCittadinoComponent,
    canActivate: [UtenteGuard],
    children: [

      {
        path: 'presentazione',
        component: PresentazioneFCComponent
      },

      {
        path: 'riepilogo',
        component: RiepilogoFCComponent
      },

      {
        path: 'dati-anagrafici',
        component: DatiAnagraficiWrapperComponent
      },
      {
        path: 'dati-amministrativi',
        component: DatiAmministrativiComponent
      },
      {
        path: 'esperienze-lavoro',
        component: EsperienzeLavoroComponent
      },
      {
        path: 'dati-curriculari',
        component: DatiCurriculariComponent
      },
      {
        path: 'politiche-attive',
        component: PoliticheAttiveComponent
      },
      {
        path: 'esito',
        component: EsitoAcquisizioneComponent
      },
      {
        path: 'esito-errato',
        component: EsitoErratoComponent
      },
      {
        path: 'esito-errato-new',
        component: EsitoErratoComponent
      },
      {
        path: 'registrazione-dati-anagrafici',
        component: DatiAnagraficiNuovaSapComponent
      }
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(fascicoloCittadinoRoutes)],
  exports: [RouterModule]
})

export class FascicoloCittadinoRoutingModule { }
