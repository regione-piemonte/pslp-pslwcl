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
import { DettaglioCompletoDichiarazioneFamiliariACarico } from './dettaglioCompletoDichiarazioneFamiliariACarico';
import { IscrizioneCollocamentoMirato } from './iscrizioneCollocamentoMirato';
import { RedditoCollocamentoMirato } from './redditoCollocamentoMirato';
import { RichiestaIscrizioneL68Header } from './richiestaIscrizioneL68Header';


export interface EsitoRiepilogoCollocamentoMirato { 
    messaggio_errore?: string;
    iscrizioneDisabili?: IscrizioneCollocamentoMirato;
    iscrizioneAltreCategorie?: IscrizioneCollocamentoMirato;
    redditi?: Array<RedditoCollocamentoMirato>;
    dettaglioCompletoDichiarazioneFamiliariACarico?: Array<DettaglioCompletoDichiarazioneFamiliariACarico>;
    elencoRichieste?: Array<RichiestaIscrizioneL68Header>;
}
