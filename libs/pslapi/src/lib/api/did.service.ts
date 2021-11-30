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
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional }                      from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams,
         HttpResponse, HttpEvent }                           from '@angular/common/http';
import { CustomHttpUrlEncodingCodec }                        from '../encoder';

import { Observable }                                        from 'rxjs';

import { ConfigurazioneProfilingDid } from '../model/configurazioneProfilingDid';
import { DatiInputAggiornamentoDid } from '../model/datiInputAggiornamentoDid';
import { DatiInputProfilingDid } from '../model/datiInputProfilingDid';
import { ErrorDef } from '../model/errorDef';
import { EsitoDettaglioDid } from '../model/esitoDettaglioDid';
import { EsitoSaveDid } from '../model/esitoSaveDid';
import { EsitoSaveProfilingDid } from '../model/esitoSaveProfilingDid';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';
import { DidServiceInterface }                            from './did.serviceInterface';


@Injectable()
export class DidService implements DidServiceInterface {

    protected basePath = 'http://localhost:8080/restfacade/be';
    public defaultHeaders = new HttpHeaders();
    public configuration = new Configuration();

    constructor(protected httpClient: HttpClient, @Optional()@Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {
        if (basePath) {
            this.basePath = basePath;
        }
        if (configuration) {
            this.configuration = configuration;
            this.basePath = basePath || configuration.basePath || this.basePath;
        }
    }

    /**
     * @param consumes string[] mime-types
     * @return true: consumes contains 'multipart/form-data', false: otherwise
     */
    private canConsumeForm(consumes: string[]): boolean {
        const form = 'multipart/form-data';
        for (const consume of consumes) {
            if (form === consume) {
                return true;
            }
        }
        return false;
    }


    /**
     * 
     * 
     * @param id_utente 
     * @param parametri_sendDid 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public changeStateDidAfterInsertProfilingService(id_utente: number, parametri_sendDid: DatiInputAggiornamentoDid, observe?: 'body', reportProgress?: boolean): Observable<EsitoSaveDid>;
    public changeStateDidAfterInsertProfilingService(id_utente: number, parametri_sendDid: DatiInputAggiornamentoDid, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<EsitoSaveDid>>;
    public changeStateDidAfterInsertProfilingService(id_utente: number, parametri_sendDid: DatiInputAggiornamentoDid, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<EsitoSaveDid>>;
    public changeStateDidAfterInsertProfilingService(id_utente: number, parametri_sendDid: DatiInputAggiornamentoDid, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling changeStateDidAfterInsertProfilingService.');
        }
        if (parametri_sendDid === null || parametri_sendDid === undefined) {
            throw new Error('Required parameter parametri_sendDid was null or undefined when calling changeStateDidAfterInsertProfilingService.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post<EsitoSaveDid>(`${this.basePath}/did/${encodeURIComponent(String(id_utente))}/change_state_did`,
            parametri_sendDid,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * 
     * 
     * @param id_utente 
     * @param scrivere_log_su_db 
     * @param parametri_sendDid 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public controlloDidService(id_utente: number, scrivere_log_su_db: string, parametri_sendDid: DatiInputAggiornamentoDid, observe?: 'body', reportProgress?: boolean): Observable<EsitoSaveDid>;
    public controlloDidService(id_utente: number, scrivere_log_su_db: string, parametri_sendDid: DatiInputAggiornamentoDid, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<EsitoSaveDid>>;
    public controlloDidService(id_utente: number, scrivere_log_su_db: string, parametri_sendDid: DatiInputAggiornamentoDid, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<EsitoSaveDid>>;
    public controlloDidService(id_utente: number, scrivere_log_su_db: string, parametri_sendDid: DatiInputAggiornamentoDid, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling controlloDidService.');
        }
        if (scrivere_log_su_db === null || scrivere_log_su_db === undefined) {
            throw new Error('Required parameter scrivere_log_su_db was null or undefined when calling controlloDidService.');
        }
        if (parametri_sendDid === null || parametri_sendDid === undefined) {
            throw new Error('Required parameter parametri_sendDid was null or undefined when calling controlloDidService.');
        }

        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (scrivere_log_su_db !== undefined && scrivere_log_su_db !== null) {
            queryParameters = queryParameters.set('scrivere_log_su_db', <any>scrivere_log_su_db);
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post<EsitoSaveDid>(`${this.basePath}/did/${encodeURIComponent(String(id_utente))}/controllo_did_service`,
            parametri_sendDid,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * 
     * 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public loadConfigurazioneProfilingDid(observe?: 'body', reportProgress?: boolean): Observable<ConfigurazioneProfilingDid>;
    public loadConfigurazioneProfilingDid(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ConfigurazioneProfilingDid>>;
    public loadConfigurazioneProfilingDid(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ConfigurazioneProfilingDid>>;
    public loadConfigurazioneProfilingDid(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.get<ConfigurazioneProfilingDid>(`${this.basePath}/did/configurazione_profiling`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * 
     * 
     * @param id_utente 
     * @param msg 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public logService(id_utente: number, msg: string, observe?: 'body', reportProgress?: boolean): Observable<ErrorDef>;
    public logService(id_utente: number, msg: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ErrorDef>>;
    public logService(id_utente: number, msg: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ErrorDef>>;
    public logService(id_utente: number, msg: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling logService.');
        }
        if (msg === null || msg === undefined) {
            throw new Error('Required parameter msg was null or undefined when calling logService.');
        }

        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (msg !== undefined && msg !== null) {
            queryParameters = queryParameters.set('msg', <any>msg);
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.post<ErrorDef>(`${this.basePath}/did/${encodeURIComponent(String(id_utente))}/log_service`,
            null,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * 
     * 
     * @param id_utente 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public ricercaDettaglioDIDService(id_utente: number, observe?: 'body', reportProgress?: boolean): Observable<EsitoDettaglioDid>;
    public ricercaDettaglioDIDService(id_utente: number, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<EsitoDettaglioDid>>;
    public ricercaDettaglioDIDService(id_utente: number, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<EsitoDettaglioDid>>;
    public ricercaDettaglioDIDService(id_utente: number, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling ricercaDettaglioDIDService.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.get<EsitoDettaglioDid>(`${this.basePath}/did/${encodeURIComponent(String(id_utente))}/ricerca_did`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * 
     * 
     * @param id_utente 
     * @param parametri_sendDid 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public saveDidService(id_utente: number, parametri_sendDid: DatiInputAggiornamentoDid, observe?: 'body', reportProgress?: boolean): Observable<EsitoSaveDid>;
    public saveDidService(id_utente: number, parametri_sendDid: DatiInputAggiornamentoDid, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<EsitoSaveDid>>;
    public saveDidService(id_utente: number, parametri_sendDid: DatiInputAggiornamentoDid, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<EsitoSaveDid>>;
    public saveDidService(id_utente: number, parametri_sendDid: DatiInputAggiornamentoDid, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling saveDidService.');
        }
        if (parametri_sendDid === null || parametri_sendDid === undefined) {
            throw new Error('Required parameter parametri_sendDid was null or undefined when calling saveDidService.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post<EsitoSaveDid>(`${this.basePath}/did/${encodeURIComponent(String(id_utente))}/save_did_service`,
            parametri_sendDid,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * 
     * 
     * @param id_utente 
     * @param parametri_sendProfilingDid 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public saveProfilingDidService(id_utente: number, parametri_sendProfilingDid: DatiInputProfilingDid, observe?: 'body', reportProgress?: boolean): Observable<EsitoSaveProfilingDid>;
    public saveProfilingDidService(id_utente: number, parametri_sendProfilingDid: DatiInputProfilingDid, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<EsitoSaveProfilingDid>>;
    public saveProfilingDidService(id_utente: number, parametri_sendProfilingDid: DatiInputProfilingDid, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<EsitoSaveProfilingDid>>;
    public saveProfilingDidService(id_utente: number, parametri_sendProfilingDid: DatiInputProfilingDid, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling saveProfilingDidService.');
        }
        if (parametri_sendProfilingDid === null || parametri_sendProfilingDid === undefined) {
            throw new Error('Required parameter parametri_sendProfilingDid was null or undefined when calling saveProfilingDidService.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post<EsitoSaveProfilingDid>(`${this.basePath}/did/${encodeURIComponent(String(id_utente))}/save_profiling_did_service`,
            parametri_sendProfilingDid,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

}
