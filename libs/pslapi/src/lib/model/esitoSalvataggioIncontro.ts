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
import { PrenotazioneIncontro } from './prenotazioneIncontro';


export interface EsitoSalvataggioIncontro { 
    messaggio_errore?: string;
    prenotazione_incontro?: PrenotazioneIncontro;
}