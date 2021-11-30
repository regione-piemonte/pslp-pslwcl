import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarioComponent } from './calendario.component';
import { RicercaCalendarioComponent } from './ricerca-calendario/ricerca-calendario.component';
import { DatiGeneraliComponent } from './dati-generali/dati-generali.component';
import { ConfigurazioneComponent } from './configurazione/configurazione.component';
import { DatiOperativiComponent } from './dati-operativi/dati-operativi.component';
import { DatiMailComponent } from './dati-mail/dati-mail.component';
import { IncontriComponent } from './incontri/incontri.component';
import { AuthorizedUserGuard } from '../guard/authorized-user.guard';
import { CalendarioResolverService } from './calendario-resolver.service';
import { DuplicaComponent } from './duplica/duplica.component';

const calendarioRoutes: Routes = [
  {
    path: 'calendario',
    component: CalendarioComponent,
    canActivate: [AuthorizedUserGuard],
    canActivateChild: [AuthorizedUserGuard],
    children: [
      {
        path: 'ricerca',
        component: RicercaCalendarioComponent
      },
      {
        path: 'dati-generali',
        component: DatiGeneraliComponent,
        resolve: { configurazioneCalendario: CalendarioResolverService }
      },
      {
        path: 'configurazione',
        component: ConfigurazioneComponent,
        resolve: { configurazioneCalendario: CalendarioResolverService }
      },
      {
        path: 'dati-operativi',
        component: DatiOperativiComponent,
        resolve: { configurazioneCalendario: CalendarioResolverService }
      },
      {
        path: 'dati-mail',
        component: DatiMailComponent,
        resolve: { configurazioneCalendario: CalendarioResolverService }
      },
      {
        path: 'incontri',
        component: IncontriComponent,
        resolve: { configurazioneCalendario: CalendarioResolverService }
      },
      {
        path: 'duplica',
        component: DuplicaComponent,
        resolve: { configurazioneCalendario: CalendarioResolverService }
      }
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(calendarioRoutes)],
  exports: [RouterModule]
})
export class CalendarioRoutingModule { }
