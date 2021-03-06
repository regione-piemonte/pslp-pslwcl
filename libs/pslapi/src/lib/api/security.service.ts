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

import { ErrorDef } from '../model/errorDef';
import { MenuItem } from '../model/menuItem';
import { Role } from '../model/role';
import { Screen } from '../model/screen';
import { UserInfo } from '../model/userInfo';
import { Widget } from '../model/widget';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';
import { SecurityServiceInterface }                            from './security.serviceInterface';


@Injectable()
export class SecurityService implements SecurityServiceInterface {

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
     * get current user
     * restituisce l&#39;utente corrente
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getCurrentUser(observe?: 'body', reportProgress?: boolean): Observable<UserInfo>;
    public getCurrentUser(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<UserInfo>>;
    public getCurrentUser(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<UserInfo>>;
    public getCurrentUser(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

        return this.httpClient.get<UserInfo>(`${this.basePath}/currentUser`,
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
     * restituisce la struttura di menu (con abilitazioni) per l&#39;utente corrente
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getMenuStructureForUser(observe?: 'body', reportProgress?: boolean): Observable<Array<MenuItem>>;
    public getMenuStructureForUser(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<MenuItem>>>;
    public getMenuStructureForUser(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<MenuItem>>>;
    public getMenuStructureForUser(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

        return this.httpClient.get<Array<MenuItem>>(`${this.basePath}/currentUser/menu`,
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
     * restituisce la struttura dello screen specificato, con le abilitazioni per l&#39;utente collegato
     * @param screen 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getScreenByCod(screen: string, observe?: 'body', reportProgress?: boolean): Observable<Screen>;
    public getScreenByCod(screen: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Screen>>;
    public getScreenByCod(screen: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Screen>>;
    public getScreenByCod(screen: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (screen === null || screen === undefined) {
            throw new Error('Required parameter screen was null or undefined when calling getScreenByCod.');
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

        return this.httpClient.get<Screen>(`${this.basePath}/currentUser/screens/${encodeURIComponent(String(screen))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * get current user role list
     * restituisce la lista di ruoli a cui appartiene l&#39;utente corrente
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getUserRoles(observe?: 'body', reportProgress?: boolean): Observable<Array<Role>>;
    public getUserRoles(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<Role>>>;
    public getUserRoles(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<Role>>>;
    public getUserRoles(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

        return this.httpClient.get<Array<Role>>(`${this.basePath}/currentUser/roles`,
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
     * restituisce il widget specificato. E&#39; utile per interrogazioni puntuali
     * @param screen 
     * @param widget 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getWidget(screen: string, widget: string, observe?: 'body', reportProgress?: boolean): Observable<Widget>;
    public getWidget(screen: string, widget: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Widget>>;
    public getWidget(screen: string, widget: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Widget>>;
    public getWidget(screen: string, widget: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (screen === null || screen === undefined) {
            throw new Error('Required parameter screen was null or undefined when calling getWidget.');
        }
        if (widget === null || widget === undefined) {
            throw new Error('Required parameter widget was null or undefined when calling getWidget.');
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

        return this.httpClient.get<Widget>(`${this.basePath}/currentUser/screens/${encodeURIComponent(String(screen))}/widgets/${encodeURIComponent(String(widget))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * l&#39;utente appartiene al ruolo?
     * challenge di appartenenza dell&#39;utente corrente al ruolo specificato
     * @param role 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public isUserInRole(role: string, observe?: 'body', reportProgress?: boolean): Observable<Role>;
    public isUserInRole(role: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Role>>;
    public isUserInRole(role: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Role>>;
    public isUserInRole(role: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (role === null || role === undefined) {
            throw new Error('Required parameter role was null or undefined when calling isUserInRole.');
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

        return this.httpClient.get<Role>(`${this.basePath}/currentUser/roles/${encodeURIComponent(String(role))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

}
