import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DettaglioPrivacyComponent } from './dettaglio-privacy/dettaglio-privacy.component';

import { RiepilogoPrivacyComponent } from './riepilogo-privacy/riepilogo-privacy.component';
import { PresentazionePrivacyComponent } from './dettaglio-privacy/presentazione-privacy/presentazione-privacy.component';
import { GestioneMinorePrivacyComponent } from './riepilogo-privacy/gestione-minore-privacy/gestione-minore-privacy.component';
import { PrivacyComponent } from './privacy.component';
import { UtenteGuard } from '../guard/utente.guard';



const privacyRoutes: Routes = [
  {
    path: 'privacy',
    component: PrivacyComponent,
    canActivate: [UtenteGuard],
    children: [
      {
        path: 'dettaglio-privacy',
        component: DettaglioPrivacyComponent
      },

      {
        path: 'presentazione-privacy',
        component: PresentazionePrivacyComponent
      },

      {
        path: 'riepilogo-privacy',
        component: RiepilogoPrivacyComponent
      },


      {
        path: 'gestione-minore-privacy',
        component: GestioneMinorePrivacyComponent
      }
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(privacyRoutes)],
  exports: [RouterModule]
})

export class PrivacyRoutingModule { }
