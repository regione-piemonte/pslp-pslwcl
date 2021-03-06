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
import { Decodifica } from './decodifica';


export interface FormazioneProfessionale { 
    titolo_corso?: string;
    ente_erogatore?: string;
    /**
     * il codice ministeriale della regione
     */
    regione_sede?: Decodifica;
    durata?: number;
    /**
     * O ore, G giorni, M mesi, A anni
     */
    tipo_durata?: string;
    /**
     * Tabella ministeriale Attestazioni
     */
    certificazioni_attestazioni?: Decodifica;
    stage?: boolean;
    nome_azienda_stage?: string;
    /**
     * codice identificativo di un corso se ottenuto dai servizi FP di formazione professionale
     */
    codice_fp?: string;
}
