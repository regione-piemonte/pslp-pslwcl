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


export interface TipoContratto { 
    codice_ministeriale?: string;
    codice_silp?: string;
    descrizione?: string;
    data_inizio_validita?: Date;
    data_fine_validita?: Date;
    /**
     * rappresenta la categoria S subordinato, A autonomo, R speciale
     */
    codice_tipo_lavoro?: string;
    /**
     * indica se il tipo lavoro e' ammesso per legge 68
     */
    ammissibile_legge_68?: boolean;
    /**
     * indica se il tipo lavoro ammette la missione
     */
    ammissibile_missione?: boolean;
    /**
     * indica se il tipo di lavoro e' ammissibile pe mobilita'
     */
    ammissibile_mobilita?: boolean;
    /**
     * indica se il tipo di lavoro e' ammissibile come stagionale
     */
    ammissibile_stagionale?: boolean;
    /**
     * indica se il tipo di lavoro e' ammissibile per agricoltura
     */
    ammissibile_agricoltura?: boolean;
    /**
     * indica se il tipo di lavoro ammette come forma il tempo determinato
     */
    ammissibile_forma_TD?: boolean;
    /**
     * indica se il tipo di lavoro ammette come forma il tempo indeterminato
     */
    ammissibile_forma_TI?: boolean;
}
