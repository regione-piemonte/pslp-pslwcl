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
import { HttpHeaders }                                       from '@angular/common/http';

import { Observable }                                        from 'rxjs';

import { ErrorDef } from '../model/errorDef';


import { Configuration }                                     from '../configuration';


export interface StampeServiceInterface {
    defaultHeaders: HttpHeaders;
    configuration: Configuration;
    

    /**
    * 
    * 
    * @param id_utente 
    * @param id_sil_lav_adesione 
    */
    creaStampaAdesione(id_utente: number, id_sil_lav_adesione: number, extraHttpRequestParams?: any): Observable<string>;

    /**
    * 
    * 
    * @param id_utente 
    */
    creaStampaIscrizioneCollocamentoMirato(id_utente: number, extraHttpRequestParams?: any): Observable<string>;

    /**
    * 
    * 
    * @param id_utente 
    * @param id_did 
    */
    creaStampaPattoDiServizio(id_utente: number, id_did: number, extraHttpRequestParams?: any): Observable<string>;

    /**
    * 
    * 
    * @param id_utente 
    */
    creaStampaRedditoDiCittadinanza(id_utente: number, extraHttpRequestParams?: any): Observable<string>;

    /**
    * 
    * 
    * @param id_utente 
    */
    creaStampaSap(id_utente: number, extraHttpRequestParams?: any): Observable<string>;

}
