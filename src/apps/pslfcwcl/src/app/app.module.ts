// ANGULAR lib
// MODULI
import { APP_BASE_HREF } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerConfig, NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap';
import { BASE_PATH } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareModule } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserAppInitializerFactory, AppUserService, APP_VERSION, ConfigService, ENV_AMBIENTE, ENV_APPLICATION, ItalianDatepickerI18nService, JsonDateInterceptorService, LogService, NativeDatepickerAdapterService, NgbCustomDateParserFormatterService, SpidUserAppInitializerFactory, SpidUserService, XsrfInterceptorService, XsrfTokenAppInitializerFactory } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { KeyboardShortcutsModule } from 'ng-keyboard-shortcuts';
import { default as version } from '../../version.json';
import { environment } from '../environments/environment';
import { AppAccessoSpidLandingComponent } from './app-accesso-spid-landing/app-accesso-spid-landing.component';
import { AppCollocamentoLandingComponent } from './app-collocamento-landing/app-collocamento-landing.component';
import { AppDIDLandingComponent } from './app-did-landing/app-did-landing.component';
import { AppFascicoloLandingComponent } from './app-fascicolo-landing/app-fascicolo-landing.component';
import { AppHomeComponent } from './app-home/app-home.component';
import { AppLogoutSpidLandingComponent } from './app-logout-spid-landing/app-logout-spid-landing.component';
import { AppPrivacyLandingComponent } from './app-privacy-landing/app-privacy-landing.component';
// ROUTING
import { AppRoutingModule } from './app-routing.module';
// APP BASE
import { AppComponent } from './app.component';
import { CollocamentoMiratoModule } from './collocamento-mirato/collocamento-mirato.module';

import { DIDModule } from './did/did.module';
import { FascicoloCittadinoModule } from './fascicolo-cittadino/fascicolo-cittadino.module';
import { PrivacyModule } from './privacy/privacy.module';

ConfigService.environment = environment;

@NgModule({
  declarations: [
    AppComponent,
    AppHomeComponent,
    AppFascicoloLandingComponent,
    AppCollocamentoLandingComponent,
    AppPrivacyLandingComponent,
    AppDIDLandingComponent,
    AppAccessoSpidLandingComponent,
    AppLogoutSpidLandingComponent
  ],
  imports: [
    PslshareModule,

    FascicoloCittadinoModule,
    DIDModule,
    PrivacyModule,
    CollocamentoMiratoModule,
    AppRoutingModule,
    BrowserModule,
    KeyboardShortcutsModule.forRoot(),
  ],
  providers: [
    NgbDatepickerConfig,
    { provide: BASE_PATH, useFactory: () => ConfigService.getBERootUrl() },
    { provide: APP_BASE_HREF, useValue: ConfigService.getBaseHref() },
    { provide: ENV_AMBIENTE, useValue: environment.ambiente },
    { provide: ENV_APPLICATION, useValue: environment.envApplication },
    { provide: APP_VERSION, useValue: version },
    { provide: LogService, useFactory: () => ConfigService.getLogService() },
    { provide: NgbDateAdapter, useClass: NativeDatepickerAdapterService },
    { provide: NgbDateParserFormatter, useClass: NgbCustomDateParserFormatterService },
    { provide: NgbDatepickerI18n, useClass: ItalianDatepickerI18nService },
    { provide: APP_INITIALIZER, useFactory: XsrfTokenAppInitializerFactory, deps: [ AppUserService, Injector ], multi: true },
    { provide: APP_INITIALIZER, useFactory: SpidUserAppInitializerFactory, deps: [ SpidUserService, Injector ], multi: true },
    { provide: APP_INITIALIZER, useFactory: AppUserAppInitializerFactory, deps: [ AppUserService, Injector ], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JsonDateInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: XsrfInterceptorService, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
