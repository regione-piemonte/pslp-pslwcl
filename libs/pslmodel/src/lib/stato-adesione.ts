export interface StatoAdesioneInterface {
    codice: string;
    statoIniziale: boolean;
    statoFinale: boolean;
    descrizione: string;
}

export class StatoAdesione {
    private static readonly data: StatoAdesioneInterface[] = [
      {'codice': 'A', statoIniziale: true,  statoFinale: false, 'descrizione': 'ATTIVA'},
      {'codice': 'C', statoIniziale: false, statoFinale: true, 'descrizione': 'CANCELLATA PER MANCANZA DEI REQUISITI'},
      {'codice': 'D', statoIniziale: false, statoFinale: true, 'descrizione': 'ANNULLATA DAL GIOVANE'},
      {'codice': 'F', statoIniziale: false, statoFinale: true, 'descrizione': 'FINE PARTECIPAZIONE'},
      {'codice': 'P', statoIniziale: false, statoFinale: false, 'descrizione': 'PRESO IN CARICO'},
      {'codice': 'R', statoIniziale: false, statoFinale: true, 'descrizione': 'RIFIUTO POLITICA ATTIVA'},
      {'codice': 'T', statoIniziale: false, statoFinale: false, 'descrizione': 'TRATTATO'},
      {'codice': 'X', statoIniziale: false, statoFinale: true, 'descrizione': 'RIFIUTO PRESA IN CARICO - NON FIRMA PAI'},
      {'codice': 'U', statoIniziale: false, statoFinale: true, 'descrizione': 'NON FIRMA PDS O NON SI PRESENTA PER PAI'},
      {'codice': 'N', statoIniziale: false, statoFinale: true, 'descrizione': 'CHIUSURA D\'UFFICIO PER PRESA IN CARICO DA ALTRE REGIONI'}
    ];

    static get(): StatoAdesioneInterface[] {
        return StatoAdesione.data;
    }

    static getByCodice(codice: string): StatoAdesioneInterface {
      return StatoAdesione.data.find(v => v.codice === codice.toUpperCase());
    }

}
