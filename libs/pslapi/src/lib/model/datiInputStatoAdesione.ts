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


export interface DatiInputStatoAdesione { 
    id_anagrafica?: number;
    codice_fiscale?: string;
    data_adesione?: Date;
    identificativo_sap?: string;
    id_adesione?: number;
    codice_stato_adesione?: string;
    data_stato_adesione?: Date;
    motivo?: string;
    codice_fiscale_operatore?: string;
    appuntamento_da_cancellare?: PrenotazioneIncontro;
}
