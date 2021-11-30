import { Esito } from "@pslwcl/pslapi";

/**
 * Esito save errato
 */
 export interface EsitoSaveErrato {
  urlReturn: string;
  esitoErr: Esito;
  nuovaSAP: boolean;
}
