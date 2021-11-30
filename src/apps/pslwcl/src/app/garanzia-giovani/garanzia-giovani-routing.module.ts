import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PrivacyGuard } from './guard/privacy.guard';
import { GaranziaGiovaniComponent } from './garanzia-giovani.component';
import { PresentazioneComponent } from './presentazione/presentazione.component';
import { SceltaMinoreComponent } from './scelta-minore/scelta-minore.component';
import { ResponsabilitaComponent } from './responsabilita/responsabilita.component';
import { DatiAnagraficiTutoreComponent } from './dati-anagrafici-tutore/dati-anagrafici-tutore.component';
import { DatiAnagraficiWrapperComponent } from './dati-anagrafici-wrapper/dati-anagrafici-wrapper.component';
import { ProfilingComponent } from './profiling/profiling.component';
import { InformazioniComponent } from './informazioni/informazioni.component';
import { ConfermaComponent } from './conferma/conferma.component';
import { AppuntamentoGaranziaGiovaniWrapperComponent } from './appuntamento-garanzia-giovani-wrapper/appuntamento-garanzia-giovani-wrapper.component';
import { RiepilogoComponent } from './riepilogo/riepilogo.component';
import { UtenteGuard } from '../guard/utente.guard';


const garanziaGiovaniRoutes: Routes = [
  {
    path: 'garanzia-giovani',
    component: GaranziaGiovaniComponent,
    canActivate: [UtenteGuard],
    canActivateChild: [PrivacyGuard],
    children: [
      {
        path: 'presentazione',
        component: PresentazioneComponent
      },
      {
        path: 'scelta-minore',
        component: SceltaMinoreComponent
      },
      {
        path: 'responsabilita',
        component: ResponsabilitaComponent
      },
      {
        path: 'dati-anagrafici-tutore',
        component: DatiAnagraficiTutoreComponent
      },
      {
        path: 'dati-anagrafici',
        component: DatiAnagraficiWrapperComponent
      },
      {
        path: 'profiling',
        component: ProfilingComponent
      },
      {
        path: 'informazioni',
        component: InformazioniComponent
      },
      {
        path: 'conferma',
        component: ConfermaComponent
      },
      {
        path: 'appuntamento',
        component: AppuntamentoGaranziaGiovaniWrapperComponent
      },
      {
        path: 'riepilogo',
        component: RiepilogoComponent
      },
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(garanziaGiovaniRoutes)],
  exports: [RouterModule]
})
export class GaranziaGiovaniRoutingModule { }
