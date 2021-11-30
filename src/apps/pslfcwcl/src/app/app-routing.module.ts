import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorPageComponent, LoginComponent, PageNotFoundComponent } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppAccessoSpidLandingComponent } from './app-accesso-spid-landing/app-accesso-spid-landing.component';
import { AppCollocamentoLandingComponent } from './app-collocamento-landing/app-collocamento-landing.component';
import { AppDIDLandingComponent } from './app-did-landing/app-did-landing.component';
import { AppFascicoloLandingComponent } from './app-fascicolo-landing/app-fascicolo-landing.component';
import { AppHomeComponent } from './app-home/app-home.component';
import { AppLogoutSpidLandingComponent } from './app-logout-spid-landing/app-logout-spid-landing.component';
import { AppPrivacyLandingComponent } from './app-privacy-landing/app-privacy-landing.component';



const appRoutes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: AppHomeComponent},

  { path: 'fascicolo-cittadino-landing', component: AppFascicoloLandingComponent },
  { path: 'did-landing', component: AppDIDLandingComponent },
  { path: 'collocamento-mirato-landing', component: AppCollocamentoLandingComponent },
  { path: 'privacy-landing', component: AppPrivacyLandingComponent },
  { path: 'accesso-spid-landing', component: AppAccessoSpidLandingComponent },
  { path: 'logout-spid-landing', component: AppLogoutSpidLandingComponent },
  { path: 'login', component: LoginComponent },
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
