import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { Configuration } from './configuration';
import { HttpClient } from '@angular/common/http';


import { BusinessService } from './api/business.service';
import { CollocamentoMiratoService } from './api/collocamentoMirato.service';
import { DidService } from './api/did.service';
import { GestoreService } from './api/gestore.service';
import { MappaService } from './api/mappa.service';
import { PrivacyService } from './api/privacy.service';
import { SecurityService } from './api/security.service';
import { StampeService } from './api/stampe.service';
import { SystemService } from './api/system.service';

@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: [
    BusinessService,
    CollocamentoMiratoService,
    DidService,
    GestoreService,
    MappaService,
    PrivacyService,
    SecurityService,
    StampeService,
    SystemService ]
})
export class ApiModule {
    public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders {
        return {
            ngModule: ApiModule,
            providers: [ { provide: Configuration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: ApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
