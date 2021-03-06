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
import { RispostaQuestionario } from './rispostaQuestionario';


export interface DatiInputAggiornamentoDid { 
    id_anagrafica?: number;
    id_did?: number;
    cod_stato_did?: string;
    codice_fiscale?: string;
    /**
     * data did
     */
    data_did?: Date;
    /**
     * data stato did
     */
    data_stato_did?: Date;
    risposta_questionario?: Array<RispostaQuestionario>;
}
