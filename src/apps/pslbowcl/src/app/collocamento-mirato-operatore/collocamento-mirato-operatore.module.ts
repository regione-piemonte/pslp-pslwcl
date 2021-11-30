import { NgModule } from '@angular/core';
import { PsldirectiveModule } from '@pslwcl/psldirective'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareModule } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { CollocamentoMiratoOperatoreRoutingModule } from './collocamento-mirato-operatore-routing.module';
import { CollocamentoMiratoOperatoreComponent } from './collocamento-mirato-operatore.component';

@NgModule({
  imports: [
    CollocamentoMiratoOperatoreRoutingModule,
    PslshareModule,
    PsldirectiveModule
  ],
  declarations: [
    CollocamentoMiratoOperatoreComponent

  ]
})
export class CollocamentoMiratoOperatoreModule { }
