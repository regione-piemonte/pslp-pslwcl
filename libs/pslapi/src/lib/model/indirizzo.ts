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
import { Comune } from './comune';
import { Nazione } from './nazione';
import { Sedime } from './sedime';


export interface Indirizzo { 
    indirizzo_esteso?: string;
    toponimo?: Sedime;
    indirizzo?: string;
    numero_civico?: string;
    localita?: string;
    comune?: Comune;
    stato?: Nazione;
}
