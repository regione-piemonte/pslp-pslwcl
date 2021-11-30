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
import { AdesioneYG } from './adesioneYG';
import { PrenotazioneIncontro } from './prenotazioneIncontro';
import { SchedaAnagraficoProfessionale } from './schedaAnagraficoProfessionale';


export interface ControlliIscrizione { 
    sap?: SchedaAnagraficoProfessionale;
    adesione?: AdesioneYG;
    adesioneFuoriRegione?: boolean;
    appuntamento?: PrenotazioneIncontro;
    eta?: number;
    soggetto_idoneo?: boolean;
    presente_privacy?: boolean;
    domicilio_piemonte?: boolean;
    residenza_italia?: boolean;
    eta_coerente?: boolean;
    maggiorenne?: boolean;
    messaggi?: Array<string>;
    possibileIscrizione?: boolean;
    possibileAnnullamento?: boolean;
    possibileStampa?: boolean;
    possibileAppuntamento?: boolean;
}
