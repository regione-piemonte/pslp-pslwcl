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
import { MenuHelpFile } from './menuHelpFile';
import { MenuHelpMsg } from './menuHelpMsg';
import { MenuHelpVideo } from './menuHelpVideo';


export interface MenuHelpPage { 
    id_page?: string;
    titolo?: string;
    messaggi?: Array<MenuHelpMsg>;
    manuali?: Array<MenuHelpFile>;
    video_tutorial?: Array<MenuHelpVideo>;
}
