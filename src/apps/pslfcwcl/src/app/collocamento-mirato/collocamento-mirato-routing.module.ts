import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllegatiRichiestaIscrizioneComponent, DatiGraduatoriaComponent, DisabileComponent, FamiliariRichiestaIscrizioneComponent, LavoratoreWrapperComponent, RedditoRichiestaIscrizioneComponent, RichiestaComponent, RiepilogoCMComponent, RiepilogoRichiestaIscrizioneComponent } from '@pslwcl/pslshare';
import { UtenteGuard } from '../guard/utente.guard';
import { CollocamentoMiratoComponent } from './collocamento-mirato.component';
import { PrivacyGuard } from './guard/privacy.guard';


const collocamentoMiratoRoutes: Routes = [
  {
    path: 'collocamento-mirato',
    component: CollocamentoMiratoComponent,
    canActivate: [UtenteGuard],
    canActivateChild: [PrivacyGuard],
    children: [
      {
        path: 'inizio',
        component: RiepilogoCMComponent
      },
      {
        path: 'riepilogo',
        component: RiepilogoCMComponent
      },
      {
        path: 'dati-graduatoria',
        component: DatiGraduatoriaComponent
      },
      {
        path: 'cittadino',
        component: LavoratoreWrapperComponent
      },
      {
        path: 'richiesta',
        component: RichiestaComponent
      },
      {
        path: 'disabile',
        component: DisabileComponent
      },
      {
        path: 'reddito-richiesta-iscrizione',
        component: RedditoRichiestaIscrizioneComponent
      },
      {
        path: 'familiari-richiesta-iscrizione',
        component: FamiliariRichiestaIscrizioneComponent
      },
      {
        path: 'allegati-richiesta-iscrizione',
        component: AllegatiRichiestaIscrizioneComponent
      },
      {
        path: 'riepilogo-richiesta-iscrizione',
        component: RiepilogoRichiestaIscrizioneComponent
      },
      {
        path: 'visualizza-richiesta-iscrizione',
        component: RiepilogoRichiestaIscrizioneComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(collocamentoMiratoRoutes)],
  exports: [RouterModule]
})

export class CollocamentoMiratoRoutingModule { }
