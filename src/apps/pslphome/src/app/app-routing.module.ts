import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorPageComponent, HelpComponent, LoginComponent, PageNotFoundComponent } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppHomeComponent } from './app-home/app-home.component';
import { MappaComponent } from './mappa/mappa.component';




const appRoutes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: AppHomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'mappa', component: MappaComponent },
  { path: 'assistenza', component: HelpComponent },
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
