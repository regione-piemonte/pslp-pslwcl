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
import { UtenteRiepilogoIscrizione } from './utenteRiepilogoIscrizione';


export interface EsitoRiepilogoIscrizione { 
    messaggio_errore?: string;
    messaggio_eta_non_coerente?: string;
    /**
     * id utente
     */
    id_utente?: number;
    utente_tutore?: UtenteRiepilogoIscrizione;
    tutelati?: Array<UtenteRiepilogoIscrizione>;
}