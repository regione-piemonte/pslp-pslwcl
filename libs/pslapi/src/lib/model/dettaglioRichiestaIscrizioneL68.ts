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
import { DettaglioDichiarazioneFamiliariACarico } from './dettaglioDichiarazioneFamiliariACarico';
import { Documento } from './documento';
import { Indirizzo } from './indirizzo';
import { IscrizioneL68 } from './iscrizioneL68';
import { MessaggioEsito } from './messaggioEsito';
import { ReferenteServizioTerritoriale } from './referenteServizioTerritoriale';
import { RichiestaIscrizioneL68Header } from './richiestaIscrizioneL68Header';
import { VerbaleL68 } from './verbaleL68';


export interface DettaglioRichiestaIscrizioneL68 { 
    richiesta_iscrizione_header?: RichiestaIscrizioneL68Header;
    /**
     * tipo operazione I = Inserimento se CALLER PSLP - A = Aggiornamento se CALLER PSLP o SILP - N = Annullamento logico se CALLER PSLP - O = Annullamento logico se CALLER SILP
     */
    tipo_operazione?: string;
    /**
     * cod tipo iscrizione   A = Altre Categorie Protette   -   D = Disabili
     */
    cod_tipo_iscrizione?: string;
    /**
     * cod motivo richiesta   L Ricerca Lavoro - O Gia' Occupato
     */
    cod_motivo_richiesta?: string;
    /**
     * Se cod tipo iscrizione A da valori da tab SIL_T_CAT_PROTETTA (01,02...)  -     Se D da tab. SIL_T_CATEG_PROTETTA_DISAB (1,2,3,4,5)
     */
    cod_categoria_appartenenza?: string;
    /**
     * P   Prima Iscrizione -  I  Iscrizione successiva -  T Trasferimento
     */
    cod_tipo_comunicazione?: string;
    id_cpi?: number;
    id_provincia?: string;
    id_cpi_ultima_iscrizione?: number;
    /**
     * Data dell'ultima iscrizione
     */
    data_ultima_iscrizione?: Date;
    /**
     * Data annullo
     */
    data_annullo?: Date;
    id_provincia_ultima_iscrizione?: string;
    descr_provincia_ultima_iscrizione?: string;
    domicilio_trasferimento?: Indirizzo;
    grado_invalidita?: number;
    cod_categoria_invalidita?: number;
    elenco_qualifica_non_vedenti?: Array<Decodifica>;
    verbale_collocamento_mirato?: VerbaleL68;
    verbale_invalidita_civile?: VerbaleL68;
    flg_autorizzazione_cpi_prenotazione_visita_collocamento_mirato?: string;
    flg_seguito_da_servizi_territoriali?: string;
    referente_servizi_territoriali?: ReferenteServizioTerritoriale;
    flg_licenziato_in_ultimo_rapporto?: string;
    anno_reddito?: number;
    importo_reddito?: string;
    note_reddito?: string;
    anno_riferimento_familiari_a_carico?: number;
    numero_familiari_a_carico?: number;
    elenco_familiari_a_carico?: Array<DettaglioDichiarazioneFamiliariACarico>;
    note?: string;
    elenco_allegati?: Array<Documento>;
    id_operatore_presa_in_carico?: string;
    /**
     * Data invio
     */
    data_invio?: Date;
    note_rifiuto?: string;
    iscrizione_legge68?: IscrizioneL68;
    elencoCheckList?: Array<MessaggioEsito>;
    /**
     * Data inserimento
     */
    data_inserimento?: Date;
    /**
     * Data aggiornamento
     */
    data_aggiornamento?: Date;
    riepilogHtml?: string;
    /**
     * flg per indicare che si tratta di una prima iscrizione
     */
    flg_prima_iscrizione?: string;
    /**
     * flg per indicare che esiste un codice per la dichiarazione
     */
    flg_dichiarazione_visita_revisione_collocamento_mirato?: string;
    /**
     * codice dichiarazione visita revisione invalidita civile
     */
    cod_dichiarazione_visita_revisione_invalidita_civile?: string;
}