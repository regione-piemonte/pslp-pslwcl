import { NgModule } from '@angular/core';
import { PslshareModule } from '@pslwcl/pslshare';
import { PsldirectiveModule } from '@pslwcl/psldirective'; // NOSONAR evita falso positivo rule typescript:S4328
import { IscrizioneGaranziaDettaglioComponent } from './iscrizione-garanzia-dettaglio/iscrizione-garanzia-dettaglio.component';
import { IscrizioneGaranziaRiepilogoComponent } from './iscrizione-garanzia-riepilogo/iscrizione-garanzia-riepilogo.component';
import { IscrizioneGaranziaSchedaComponent } from './iscrizione-garanzia-riepilogo/iscrizione-garanzia-scheda/iscrizione-garanzia-scheda.component';
import { IscrizioneGaranziaRoutingModule } from './iscrizione-garanzia-routing.module';
import { IscrizioneGaranziaComponent } from './iscrizione-garanzia.component';

@NgModule({
  imports: [
    PslshareModule,
    IscrizioneGaranziaRoutingModule,
    PsldirectiveModule
  ],
  declarations: [
    IscrizioneGaranziaComponent,
    IscrizioneGaranziaRiepilogoComponent,
    IscrizioneGaranziaSchedaComponent,
    IscrizioneGaranziaDettaglioComponent,
  ]
})
export class IscrizioneGaranziaModule { }
