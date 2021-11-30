// #####################################################
// # Copyright Regione Piemonte - 2021                 #
// # SPDX-License-Identifier: EUPL-1.2-or-later        #
// #####################################################

// ANGULAR lib
// MODULI
import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule, HttpClientXsrfModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerI18n, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiModule, BASE_PATH } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PipeModule, PslshareModule } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserAppInitializerFactory, AppUserService, APP_VERSION, ConfigService, ENV_AMBIENTE, ENV_APPLICATION, ItalianDatepickerI18nService, JsonDateInterceptorService, LogService, NativeDatepickerAdapterService, NgbCustomDateParserFormatterService, SpidUserAppInitializerFactory, SpidUserService, XsrfInterceptorService, XsrfTokenAppInitializerFactory } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
// ANGULAR plug-in
import { TextMaskModule } from 'angular2-text-mask';
import { KeyboardShortcutsModule } from 'ng-keyboard-shortcuts';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { default as version } from '../../version.json';
import { environment } from '../environments/environment';
import { AppGgLandingComponent } from './app-gg-landing/app-gg-landing.component';
import { AppHomeComponent } from './app-home/app-home.component';
import { AppIscrizioneGaranziaLandingComponent } from './app-iscrizione-garanzia-landing/app-iscrizione-garanzia-landing.component';
import { AppRdcLandingComponent } from './app-rdc-landing/app-rdc-landing.component';
// ROUTING
import { AppRoutingModule } from './app-routing.module';
// APP BASE
import { AppComponent } from './app.component';
import { GaranziaGiovaniModule } from './garanzia-giovani/garanzia-giovani.module';
import { IscrizioneGaranziaModule } from './iscrizione-garanzia/iscrizione-garanzia.module';
import { RedditoCittadinanzaModule } from './reddito-cittadinanza/reddito-cittadinanza.module';
ConfigService.environment = environment;

@NgModule({
  declarations: [
    AppComponent,
    AppHomeComponent,
    AppGgLandingComponent,
    AppRdcLandingComponent,
    AppIscrizioneGaranziaLandingComponent,
  ],
  imports: [
    PslshareModule,
    RedditoCittadinanzaModule,
    GaranziaGiovaniModule,
    IscrizioneGaranziaModule,
    AppRoutingModule,
    BrowserModule,
    KeyboardShortcutsModule.forRoot(),
  ],
  providers: [
    { provide: BASE_PATH, useFactory: () => ConfigService.getBERootUrl() },
    { provide: APP_BASE_HREF, useValue: ConfigService.getBaseHref() },
    { provide: APP_VERSION, useValue: version },
    { provide: ENV_AMBIENTE, useValue: environment.ambiente },
    { provide: ENV_APPLICATION, useValue: environment.envApplication },
    { provide: LogService, useFactory: () => ConfigService.getLogService() },
    { provide: NgbDateAdapter, useClass: NativeDatepickerAdapterService },
    { provide: NgbDateParserFormatter, useClass: NgbCustomDateParserFormatterService },
    { provide: NgbDatepickerI18n, useClass: ItalianDatepickerI18nService },
    { provide: APP_INITIALIZER, useFactory: XsrfTokenAppInitializerFactory, deps: [AppUserService, Injector], multi: true },
    { provide: APP_INITIALIZER, useFactory: SpidUserAppInitializerFactory, deps: [SpidUserService, Injector], multi: true },
    { provide: APP_INITIALIZER, useFactory: AppUserAppInitializerFactory, deps: [ AppUserService, Injector ], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: XsrfInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JsonDateInterceptorService, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
