import { NgModule } from '@angular/core';
import { PslshareModule } from '@pslwcl/pslshare';
import { PsldirectiveModule } from '@pslwcl/psldirective'; // NOSONAR evita falso positivo rule typescript:S4328
import { CollocamentoMiratoRoutingModule } from './collocamento-mirato-routing.module';
import { CollocamentoMiratoComponent } from './collocamento-mirato.component';

@NgModule({
  imports: [

    CollocamentoMiratoRoutingModule,
    PslshareModule,
    PsldirectiveModule
  ],
  declarations: [
    CollocamentoMiratoComponent

  ]
})
export class CollocamentoMiratoModule { }
