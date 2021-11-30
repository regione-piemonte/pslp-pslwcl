import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllegatiRichiestaIscrizioneComponent, DatiGraduatoriaComponent, DisabileComponent, FamiliariRichiestaIscrizioneComponent, GraduatoriaComponent, LavoratoreWrapperComponent, RedditoRichiestaIscrizioneComponent, RichiestaComponent, RiepilogoCMComponent, RiepilogoRichiestaIscrizioneComponent } from '@pslwcl/pslshare';
import { OperatoreGuard } from '../guard/operatore.guard';
import { CollocamentoMiratoOperatoreComponent } from './collocamento-mirato-operatore.component';

const collocamentoMiratoOperatoreRoutes: Routes = [
  {
    path: 'collocamento-mirato',
    component: CollocamentoMiratoOperatoreComponent,
  //  canActivate: [OperatoreGuard],

    children: [
      {
        path: 'inizio',
        component: RiepilogoCMComponent
      },
      {
        path: 'riepilogo',
        component: RiepilogoCMComponent, data:   { flgBackOffice: true }
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
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(collocamentoMiratoOperatoreRoutes)],
  exports: [RouterModule]
})

export class CollocamentoMiratoOperatoreRoutingModule { }
