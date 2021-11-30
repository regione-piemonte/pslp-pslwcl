export * from './business.service';
import { BusinessService } from './business.service';
export * from './business.serviceInterface'
export * from './collocamentoMirato.service';
import { CollocamentoMiratoService } from './collocamentoMirato.service';
export * from './collocamentoMirato.serviceInterface'
export * from './did.service';
import { DidService } from './did.service';
export * from './did.serviceInterface'
export * from './gestore.service';
import { GestoreService } from './gestore.service';
export * from './gestore.serviceInterface'
export * from './mappa.service';
import { MappaService } from './mappa.service';
export * from './mappa.serviceInterface'
export * from './privacy.service';
import { PrivacyService } from './privacy.service';
export * from './privacy.serviceInterface'
export * from './security.service';
import { SecurityService } from './security.service';
export * from './security.serviceInterface'
export * from './stampe.service';
import { StampeService } from './stampe.service';
export * from './stampe.serviceInterface'
export * from './system.service';
import { SystemService } from './system.service';
export * from './system.serviceInterface'
export const APIS = [BusinessService, CollocamentoMiratoService, DidService, GestoreService, MappaService, PrivacyService, SecurityService, StampeService, SystemService];
