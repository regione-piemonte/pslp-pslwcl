export interface StatoDocumentoInterface {
    codice: string;
    descrizione: string;
    order: number;
}

export class StatoDocumento {
  private static readonly data: StatoDocumentoInterface[] = [
      {'codice': 'NI', 'descrizione': 'Non inviato', 'order': 1 },
      {'codice': 'IN', 'descrizione': 'Inviato', 'order': 2 },
      {'codice': 'AC', 'descrizione': 'Accettato', 'order': 3 },
      {'codice': 'NA', 'descrizione': 'Non accettato', 'order': 4 }
  ];

  static get(): StatoDocumentoInterface[] {
      return StatoDocumento.data;
  }

  static getByCodice(codice: string): StatoDocumentoInterface {
      const r = StatoDocumento.data.find(v => v.codice === codice.toUpperCase());
      return r === undefined ? null : r;
  }

  static getByDescrizione(descrizione: string): StatoDocumentoInterface {
      const r = StatoDocumento.data.find(v => v.descrizione.toLowerCase() === descrizione.toLowerCase());
      return r === undefined ? null : r;
  }
}
