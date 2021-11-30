/**
 * Portale Servizi Lavoro API
 * API per il backend del portale servizi lavoro.
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { RedditoCollocamentoMirato } from './redditoCollocamentoMirato';


export interface EsitoSalvataggioRedditoCollocamentoMirato { 
    messaggio_errore?: string;
    codiceFiscaleOperatore?: string;
    codiceFiscale?: string;
    idAnagraficaSilp?: number;
    reddito?: RedditoCollocamentoMirato;
}