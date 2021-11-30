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
import { ControlliIscrizione } from './controlliIscrizione';
import { TipoResponsabilita } from './tipoResponsabilita';
import { Utente } from './utente';
import { UtentePresaVisione } from './utentePresaVisione';


export interface UtenteRiepilogoIscrizione { 
    utente?: Utente;
    tipo_responsabilita?: TipoResponsabilita;
    prese_visione?: Array<UtentePresaVisione>;
    dati?: ControlliIscrizione;
}
