import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IscrizioneGaranziaDettaglioComponent } from './iscrizione-garanzia-dettaglio/iscrizione-garanzia-dettaglio.component';
import { IscrizioneGaranziaRiepilogoComponent } from './iscrizione-garanzia-riepilogo/iscrizione-garanzia-riepilogo.component';
import { IscrizioneGaranziaComponent } from './iscrizione-garanzia.component';

const iscrizioneRoutes: Routes = [
  {
    path: 'iscrizione-garanzia',
    component: IscrizioneGaranziaComponent,
    children: [
      {
        path: 'iscrizione-garanzia-riepilogo',
        component: IscrizioneGaranziaRiepilogoComponent
      },
      {
        path: 'iscrizione-garanzia-dettaglio',
        component: IscrizioneGaranziaDettaglioComponent
      }
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(iscrizioneRoutes)],
  exports: [RouterModule]
})

export class IscrizioneGaranziaRoutingModule { }
