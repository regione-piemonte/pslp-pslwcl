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


/**
 * la singola voce di menu
 */
export interface MenuItem { 
    /**
     * condice univoco dell'elemento
     */
    cod?: string;
    /**
     * true se il menu e' abilitato
     */
    enabled?: boolean;
    /**
     * true se il menu e' visibile
     */
    visible?: boolean;
    submenu?: Array<MenuItem>;
}
