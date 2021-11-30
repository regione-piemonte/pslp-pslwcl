// #####################################################
// # Copyright Regione Piemonte - 2021                 #
// # SPDX-License-Identifier: EUPL-1.2-or-later        #
// #####################################################

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorPageComponent, LoginComponent, PageNotFoundComponent } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppGgLandingComponent } from './app-gg-landing/app-gg-landing.component';
import { AppHomeComponent } from './app-home/app-home.component';
import { AppIscrizioneGaranziaLandingComponent } from './app-iscrizione-garanzia-landing/app-iscrizione-garanzia-landing.component';
import { AppRdcLandingComponent } from './app-rdc-landing/app-rdc-landing.component';
import { UtenteGuard } from './guard/utente.guard';

const appRoutes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: AppHomeComponent, canActivate: [UtenteGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'cittadinanza-landing', component: AppRdcLandingComponent},
  { path: 'garanzia-landing', component: AppGgLandingComponent},
  { path: 'iscrizione-garanzia-landing', component: AppIscrizioneGaranziaLandingComponent},
  { path: 'error-page', component: ErrorPageComponent },
  { path: 'not-found', component: ErrorPageComponent, data: {message: 'Page not found!'} },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(appRoutes, {
    useHash: false,
    scrollPositionRestoration: 'enabled',
    enableTracing: false}) ],
 exports: [ RouterModule ]
})
export class AppRoutingModule { }
