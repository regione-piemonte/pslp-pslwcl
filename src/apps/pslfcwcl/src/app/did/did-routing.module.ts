import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DettaglioDIDComponent } from './dettaglio-did/dettaglio-did.component';
import { UtenteGuard } from '../guard/utente.guard';
import { DIDComponent } from './did.component';
import { PattoServizioComponent } from './patto-servizio/patto-servizio.component';
import { RiepilogoDIDComponent } from './riepilogo-did/riepilogo-did.component';





const didRoutes: Routes = [
  {
    path: 'did',
    component: DIDComponent,
    canActivate: [UtenteGuard],
    children: [
      {
        path: 'riepilogo-did',
        component: RiepilogoDIDComponent
      },
      {
        path: 'richiesta-did',
        component: DettaglioDIDComponent
      },
      {
        path: 'visualizza-did',
        component: DettaglioDIDComponent
      },
      {
        path: 'aggiorna-profiling',
        component: DettaglioDIDComponent
      },
      {
        path: 'patto-servizio',
        component: PattoServizioComponent
      }

  ]}
];

@NgModule({
  imports: [RouterModule.forChild(didRoutes)],
  exports: [RouterModule]
})

export class DIDRoutingModule { }
