/**
 *  interfaccia per esportazione in excel
 *  dell'oggetto calendario restituito dalla ricerca
 */

export interface InterfacciaCalendarioExport {
    nome?: string;
    descrizione_ambito?: string;
    descrizione_ente?: string;
    giorni_attivi?: string;
    eliminato?: boolean;
    bloccato?: boolean;
    messaggio_annullamento_appuntamento?: string;
    messaggio_spostamento_appuntamento?: string;
    numero_slot_liberi_oggi?: number;
    numero_slot_prenotabili_oggi?: number;
    periodo?: string;
    promemoria?: boolean;
    ore_invio_promemoria?: number;
    ore_limite_spostamento?: number;
    visibile_in_base?: string;
    annulla_garanzia_giovani?: boolean;
}
