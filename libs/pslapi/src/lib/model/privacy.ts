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


export interface Privacy { 
    descr_ambito?: string;
    id_utente?: number;
    id_tutelato?: number;
    stato?: boolean;
    cod_ambito?: string;
    code_msg?: Array<string>;
    data_presa_visione?: Date;
}