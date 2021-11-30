export interface EsitoMinoreInterface {
  codice: string;
  descrizione: string;
  messaggio: string;
  order: number;
}
export class EsitoMinore {
  private static  readonly data: EsitoMinoreInterface[] = [
    {
      codice: 'TUTORI_GIA_PRESENTI',
      descrizione: 'Il minore è collegato anche ad altri Responsabili.',
      messaggio: 'ME080',
      order: 1
    },
    {
      codice: 'UTENTE_SILP_NON_PRESENTE',
      descrizione: 'Il soggetto non è presente nell\'anagrafica del sistema regionale Piemonte. Contattare il CpI di riferimento.',
      messaggio: 'ME081',
      order: 2
    },
    {
      codice: 'SAP_NON_PRESENTE',
      descrizione: 'Il soggetto non possiede una Scheda Anagrafico Professionale. Contattare il CpI di riferimento.',
      messaggio: 'ME082',
      order: 3
    },
    {
      codice: 'UTENTE_NON_MINORENNE',
      descrizione: 'Il soggetto non è un minore.',
      messaggio: 'ME021',
      order: 4
    },
    {
      codice: 'ADESIONE_NON_PRESENTE',
      descrizione: 'Il minore non possiede un\'Adesione a Garanzia Giovani valida.',
      messaggio: 'ME083',
      order: 5
    },
    {
      codice: 'INCONTRO_DE_ER',
      descrizione: 'Il minore possiede già un appuntamento Da Erogare o Erogato.',
      messaggio: 'ME023',
      order: 6
    },
    {
      codice: 'TUTORE_GIA_COLLEGATO',
      descrizione: 'Il minore e\' già collegato a questo Responsabile.',
      messaggio: 'ME084',
      order: 7
    },
    {
      codice: 'UTENTE_ETA_MINIMA_NON_RISPETTATA',
      descrizione: 'Il minore e\' troppo giovane.',
      messaggio: 'ME112',
      order: 8
    },
    {
      codice: 'ADESIONE_RESPINTA',
      descrizione: 'Il minore possiede un\'Adesione a Garanzia Giovani respinta.',
      messaggio: 'ME155',
      order: 9
    }
  ];
  static get(): EsitoMinoreInterface[] {
    return EsitoMinore.data;
  }
  static getByCodice(codice: string): EsitoMinoreInterface {
    const r = EsitoMinore.data.find(v => v.codice === codice.toUpperCase());
    return r === undefined ? null : r;
  }
  static getDescrByCod(codice: string): string {
    const r = this.getByCodice(codice);
    return r === null ? null : r.descrizione;
  }
  static getMsgByCod(codice: string): string {
    const r = this.getByCodice(codice);
    return r === null ? null : r.messaggio;
  }
  static getByDescrizione(descrizione: string): EsitoMinoreInterface {
    const r = EsitoMinore.data.find(v => v.descrizione.toLowerCase() === descrizione.toLowerCase());
    return r === undefined ? null : r;
  }
}
