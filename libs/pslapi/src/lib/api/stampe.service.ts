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


import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';
import { StampeServiceInterface }                            from './stampe.serviceInterface';


@Injectable()
export class StampeService implements StampeServiceInterface {

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
     * @param id_sil_lav_adesione
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public creaStampaAdesione(id_utente: number, id_sil_lav_adesione: number, observe?: 'body', reportProgress?: boolean): Observable<string>;
    public creaStampaAdesione(id_utente: number, id_sil_lav_adesione: number, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<string>>;
    public creaStampaAdesione(id_utente: number, id_sil_lav_adesione: number, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<string>>;
    public creaStampaAdesione(id_utente: number, id_sil_lav_adesione: number, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling creaStampaAdesione.');
        }
        if (id_sil_lav_adesione === null || id_sil_lav_adesione === undefined) {
            throw new Error('Required parameter id_sil_lav_adesione was null or undefined when calling creaStampaAdesione.');
        }

        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (id_sil_lav_adesione !== undefined && id_sil_lav_adesione !== null) {
            queryParameters = queryParameters.set('id_sil_lav_adesione', <any>id_sil_lav_adesione);
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/pdf'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.get(`${this.basePath}/stampe/${encodeURIComponent(String(id_utente))}/adesione`,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress,
                responseType: 'arraybuffer'
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
    public creaStampaRedditoDiCittadinanza(id_utente: number, observe?: 'body', reportProgress?: boolean): Observable<string>;
    public creaStampaRedditoDiCittadinanza(id_utente: number, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<string>>;
    public creaStampaRedditoDiCittadinanza(id_utente: number, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<string>>;
    public creaStampaRedditoDiCittadinanza(id_utente: number, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling creaStampaRedditoDiCittadinanza.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/pdf'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.get(`${this.basePath}/stampe/${encodeURIComponent(String(id_utente))}/reddito_di_cittadinanza`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress,
                responseType: 'arraybuffer'
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
    public creaStampaSap(id_utente: number, observe?: 'body', reportProgress?: boolean): Observable<string>;
    public creaStampaSap(id_utente: number, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<string>>;
    public creaStampaSap(id_utente: number, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<string>>;
    public creaStampaSap(id_utente: number, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling creaStampaSap.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/pdf'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.get(`${this.basePath}/stampe/${encodeURIComponent(String(id_utente))}/sap`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress,
                responseType: 'arraybuffer'
            }
        );
    }
    /**
     *
     *
     * @param id_utente
     * @param id_did
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public creaStampaPattoDiServizio(id_utente: number, id_did: number, observe?: 'body', reportProgress?: boolean): Observable<string>;
    public creaStampaPattoDiServizio(id_utente: number, id_did: number, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<string>>;
    public creaStampaPattoDiServizio(id_utente: number, id_did: number, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<string>>;
    public creaStampaPattoDiServizio(id_utente: number, id_did: number, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id_utente === null || id_utente === undefined) {
            throw new Error('Required parameter id_utente was null or undefined when calling creaStampaPattoDiServizio.');
        }
        if (id_did === null || id_did === undefined) {
            throw new Error('Required parameter id_did was null or undefined when calling creaStampaPattoDiServizio.');
        }

        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (id_did !== undefined && id_did !== null) {
            queryParameters = queryParameters.set('id_did', <any>id_did);
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/pdf'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.get(`${this.basePath}/stampe/${encodeURIComponent(String(id_utente))}/pattoDiServizio`,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress,
                responseType: 'arraybuffer'
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
     public creaStampaIscrizioneCollocamentoMirato(id_utente: number, observe?: 'body', reportProgress?: boolean): Observable<string>;
     public creaStampaIscrizioneCollocamentoMirato(id_utente: number, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<string>>;
     public creaStampaIscrizioneCollocamentoMirato(id_utente: number, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<string>>;
     public creaStampaIscrizioneCollocamentoMirato(id_utente: number, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
         if (id_utente === null || id_utente === undefined) {
             throw new Error('Required parameter id_utente was null or undefined when calling creaStampaIscrizioneCollocamentoMirato.');
         }
 
         let headers = this.defaultHeaders;
 
         // to determine the Accept header
         let httpHeaderAccepts: string[] = [
             'application/pdf'
         ];
         const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
         if (httpHeaderAcceptSelected != undefined) {
             headers = headers.set('Accept', httpHeaderAcceptSelected);
         }
 
         // to determine the Content-Type header
         const consumes: string[] = [
         ];
 
         return this.httpClient.get(`${this.basePath}/stampe/${encodeURIComponent(String(id_utente))}/iscrizione_collocamento_mirato`,
             {
                 withCredentials: this.configuration.withCredentials,
                 headers: headers,
                 observe: observe,
                 reportProgress: reportProgress,
                 responseType: 'arraybuffer'
             }
         );
     }
}
