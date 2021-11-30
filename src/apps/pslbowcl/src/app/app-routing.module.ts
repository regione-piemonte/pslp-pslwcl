import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorPageComponent, LoginOperatoreComponent, PageNotFoundComponent, SceltaOperatoreComponent } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { MainHomeComponent } from './base-page/main-home/main-home.component';
import { AuthorizedUserGuard } from './guard/authorized-user.guard';
import { OperatoreGuard } from './guard/operatore.guard';

const appRoutes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', canActivate: [OperatoreGuard], children: [
      { path: '', canActivate: [AuthorizedUserGuard], component: MainHomeComponent }
    ] },
  { path: 'login', component: LoginOperatoreComponent },
  { path: 'error-page', component: ErrorPageComponent },
  { path: 'not-found', component: ErrorPageComponent, data: {message: 'Page not found!'} },
  { path: 'scelta-operatore', component: SceltaOperatoreComponent, canActivate: [AuthorizedUserGuard] },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {
      useHash: false,
      scrollPositionRestoration: 'enabled',
      enableTracing: false})
  ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
