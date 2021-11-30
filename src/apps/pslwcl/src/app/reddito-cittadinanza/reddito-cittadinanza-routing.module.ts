import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PrivacyGuard } from './guard/privacy.guard';
import { RedditoCittadinanzaComponent } from './reddito-cittadinanza.component';
import { PresentazioneRDCComponent } from './presentazione/presentazione-rdc.component';
import { DatiAnagraficiWrapperComponent } from './dati-anagrafici-wrapper/dati-anagrafici-wrapper.component';
import { InformazioniComponent } from './informazioni/informazioni.component';
import { ConfermaComponent } from './conferma/conferma.component';
import { AppuntamentoRedditoCittadinanzaWrapperComponent } from './appuntamento-reddito-cittadinanza-wrapper/appuntamento-reddito-cittadinanza-wrapper.component';
import { RiepilogoRDCComponent } from './riepilogo/riepilogo-rdc.component';
import { UtenteGuard } from '../guard/utente.guard';

const redditoCittadinanzaRoutes: Routes = [
  {
    path: 'reddito-cittadinanza',
    component: RedditoCittadinanzaComponent,
    canActivate: [UtenteGuard],
    canActivateChild: [PrivacyGuard],
    children: [
      {
        path: 'presentazione-rdc',
        component: PresentazioneRDCComponent
      },
      {
        path: 'dati-anagrafici',
        component: DatiAnagraficiWrapperComponent
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
        component: AppuntamentoRedditoCittadinanzaWrapperComponent
      },
      {
        path: 'riepilogo-rdc',
        component: RiepilogoRDCComponent
      },
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(redditoCittadinanzaRoutes)],
  exports: [RouterModule]
})
export class RedditoCittadinanzaRoutingModule { }
