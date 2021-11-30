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


export interface IscrizioneL68 { 
    /**
     * id iscrizione
     */
    id_iscrizione?: number;
    /**
     * Data iscrizione
     */
    data_iscrizione?: Date;
    /**
     * Data anzianita
     */
    data_anzianita?: Date;
    /**
     * codice stato iscrizione
     */
    cod_stato_iscrizione?: string;
    /**
     * descrizione stato iscrizione
     */
    descr_stato_iscrizione?: string;
    /**
     * num iscrizione provinciale
     */
    num_iscrizione_provinciale?: number;
}