import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RicercaComponent } from './ricerca/ricerca.component';
import { ContoTerziComponent } from './conto-terzi.component';
import { DatiAnagraficiComponent } from './dati-anagrafici/dati-anagrafici.component';
import { AppuntamentoBoWrapperComponent } from './appuntamento-bo-wrapper/appuntamento-bo-wrapper.component';
import { RicercaCollocamentoMiratoComponent } from './ricerca-collocamento-mirato/ricerca-collocamento-mirato.component';


const contoTerziRoutes: Routes = [
  {
    path: 'conto-terzi',
    component: ContoTerziComponent,
    children: [
      {
        path: 'ricerca',
        component: RicercaComponent
      },
      {
        path: 'ricerca-collocamento-mirato',
        component: RicercaCollocamentoMiratoComponent
      },
      {
        path: 'dati-anagrafici',
        component: DatiAnagraficiComponent
      },
      {
        path: 'appuntamento',
        component: AppuntamentoBoWrapperComponent
      }
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(contoTerziRoutes)],
  exports: [RouterModule]
})
export class ContoTerziRoutingModule { }
