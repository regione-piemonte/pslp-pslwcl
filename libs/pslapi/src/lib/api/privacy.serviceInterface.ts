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
import { Privacy } from '../model/privacy';


import { Configuration }                                     from '../configuration';


export interface PrivacyServiceInterface {
    defaultHeaders: HttpHeaders;
    configuration: Configuration;
    

    /**
    * 
    * 
    * @param id_utente 
    * @param id_minore 
    */
    loadPrivacyMinore(id_utente: number, id_minore: number, extraHttpRequestParams?: any): Observable<Array<Privacy>>;

    /**
    * 
    * 
    * @param id_utente 
    */
    loadPrivacyUtente(id_utente: number, extraHttpRequestParams?: any): Observable<Array<Privacy>>;

}