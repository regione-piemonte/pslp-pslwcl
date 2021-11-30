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


export interface Calendario { 
    invio_conferma_prenotazione?: string;
    codice_ambito?: string;
    codice_operatore?: number;
    id_calendario?: number;
    flag_annulla_garanzia_giovani?: string;
    subcodice?: number;
    ore_invio_promemoria?: number;
    ore_limite_spostamento?: number;
    flag_visibile_cpi?: string;
    gruppo_operatore?: string;
    nome?: string;
    flag_bloccato?: string;
    messaggio_spostamento?: string;
    messaggio_annullamento?: string;
}
