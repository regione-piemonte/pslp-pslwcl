// ANGULAR lib
// MODULI
import { APP_BASE_HREF } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerConfig, NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap';
import { BASE_PATH } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareModule } from '@pslwcl/pslshare'; // NOSONAR evita falso positivo rule typescript:S4328
import {
  AppUserService, ConfigService, ENV_AMBIENTE, ItalianDatepickerI18nService, JsonDateInterceptorService, LogService, NativeDatepickerAdapterService, NgbCustomDateParserFormatterService,
  SpidUserAppInitializerFactory, SpidUserService, XsrfInterceptorService, XsrfTokenAppInitializerFactory // NOSONAR evita falso positivo rule typescript:S4328
} from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { KeyboardShortcutsModule } from 'ng-keyboard-shortcuts';
import { environment } from '../environments/environment';
// ROUTING
import { AppRoutingModule } from './app-routing.module';
// APP BASE
import { AppComponent } from './app.component';
import { MainHomeComponent } from './base-page/main-home/main-home.component';
import { WorkInProgressComponent } from './base-page/work-in-progress/work-in-progress.component';
import { CalendarioModule } from './calendario/calendario.module';
import { ConfigurazioneModule } from './configurazione/configurazione.module';
import { ContoTerziModule } from './conto-terzi/conto-terzi.module';
import { CollocamentoMiratoOperatoreModule } from './collocamento-mirato-operatore/collocamento-mirato-operatore.module';


ConfigService.environment = environment;

@NgModule({
  declarations: [
    AppComponent,
    WorkInProgressComponent,
    MainHomeComponent
  ],
  imports: [
    PslshareModule,
    ContoTerziModule,
    CollocamentoMiratoOperatoreModule,
    CalendarioModule,
    ConfigurazioneModule,
    AppRoutingModule,
    BrowserModule,
    KeyboardShortcutsModule.forRoot(),
  ],
  providers: [
    NgbDatepickerConfig,
    { provide: BASE_PATH, useFactory: () => ConfigService.getBERootUrl() },
    { provide: APP_BASE_HREF, useValue: ConfigService.getBaseHref() },
    { provide: ENV_AMBIENTE, useValue: environment.ambiente },
    { provide: LogService, useFactory: () => ConfigService.getLogService() },
    { provide: NgbDateAdapter, useClass: NativeDatepickerAdapterService },
    { provide: NgbDateParserFormatter, useClass: NgbCustomDateParserFormatterService },
    { provide: NgbDatepickerI18n, useClass: ItalianDatepickerI18nService },
    { provide: APP_INITIALIZER, useFactory: XsrfTokenAppInitializerFactory, deps: [ AppUserService, Injector ], multi: true },
    { provide: APP_INITIALIZER, useFactory: SpidUserAppInitializerFactory, deps: [ SpidUserService, Injector ], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JsonDateInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: XsrfInterceptorService, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
