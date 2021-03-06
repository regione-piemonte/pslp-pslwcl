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



import { Configuration }                                     from '../configuration';


export interface SystemServiceInterface {
    defaultHeaders: HttpHeaders;
    configuration: Configuration;
    

    /**
    * servizio per invalidazione sessione utente e cookie XSRF
    * Restituisce una stringa per confermare l&#39;avvenuto logout
    */
    logout(extraHttpRequestParams?: any): Observable<string>;

    /**
    * servizio di ping del backend
    * Restituisce una stringa per confermare la disponibilita&#39; del backend
    */
    ping(extraHttpRequestParams?: any): Observable<string>;

}
