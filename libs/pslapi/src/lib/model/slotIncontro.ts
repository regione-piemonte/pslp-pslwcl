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


export interface SlotIncontro { 
    id_slot?: number;
    giorno?: string;
    da_ora?: string;
    a_ora?: string;
    disponibilita?: number;
    numero_prenotazioni_massimo?: number;
    numero_prenotazioni_valide?: number;
    flag_eccezione?: boolean;
}
