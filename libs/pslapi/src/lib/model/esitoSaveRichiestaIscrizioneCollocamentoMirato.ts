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
import { DettaglioRichiestaIscrizioneL68 } from './dettaglioRichiestaIscrizioneL68';
import { EsitoSilp } from './esitoSilp';
import { MappaErrori } from './mappaErrori';


export interface EsitoSaveRichiestaIscrizioneCollocamentoMirato { 
    esitoPositivo?: boolean;
    messaggioCittadino?: string;
    messaggioErrori?: string;
    messaggioInfo?: string;
    messaggioWarning?: string;
    header?: string;
    error?: Array<MappaErrori>;
    info?: Array<MappaErrori>;
    warning?: Array<MappaErrori>;
    richiesta?: DettaglioRichiestaIscrizioneL68;
}
