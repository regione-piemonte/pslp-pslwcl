import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizedUserGuard } from '../guard/authorized-user.guard';
import { ConfigurazioneComponent } from './configurazione.component';

const configurazioneRoutes: Routes = [
  {
    path: 'configurazione',
    component: ConfigurazioneComponent,
    canActivate: [AuthorizedUserGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(configurazioneRoutes)],
  exports: [RouterModule]
})
export class ConfigurazioneRoutingModule { }
