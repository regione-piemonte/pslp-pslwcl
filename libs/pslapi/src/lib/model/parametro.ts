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


export interface Parametro { 
    /**
     * id parametro
     */
    id_parametro?: number;
    cod_parametro?: string;
    descr_parametro?: string;
    valore_parametro?: string;
    /**
     * data inizio
     */
    dt_inizio?: Date;
    /**
     * data fine
     */
    dt_fine?: Date;
}
