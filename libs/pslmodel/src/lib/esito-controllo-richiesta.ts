import { TypeDialogMessage } from "./type-dialog-message";

export interface EsitoControlloRichiesta {
    errore: boolean;                    // se true i controlli hanno verificato un errore

    proporreModale?: boolean;        // va proposta una modale
    msgDaProporre?: string;             // msg modale
    msgAggiuntivoModale?: string;       // msg aggiuntivo modale
    titoloModale?: string;
    tipoMessaggioDaProporre?: TypeDialogMessage;
    seModaleSiSalva?: boolean;
    seModaleSiRestaSullaPagina?: boolean;
    seModaleNoRestaSullaPagina?: boolean;             //
    urlDaSeguireSeModaleSi?: string;    // o conferma
    urlDaSeguireSeModaleNo?: string;    // o annulla   se null o undefined resta nella pagina
}
