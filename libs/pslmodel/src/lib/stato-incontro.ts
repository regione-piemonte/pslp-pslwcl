export interface StatoIncontroInterface {
    codice: string;
    descrizione: string;
    order: number;
}

export class StatoIncontro {
  private static readonly data: StatoIncontroInterface[] = [
      {'codice': 'DE', 'descrizione': 'Da Erogare', order: 1 },
      {'codice': 'DI', 'descrizione': 'Disdetto', order: 3 },
      {'codice': 'DC', 'descrizione': 'Disdetto dal cittadino', order: 4 },
      {'codice': 'ER', 'descrizione': 'Erogato', order: 2 },
      {'codice': 'NP', 'descrizione': 'Non Presentato', order: 5 },
      {'codice': 'SP', 'descrizione': 'Spostato', order: 6 }
  ];

  static get(): StatoIncontroInterface[] {
      return StatoIncontro.data;
  }

  static getByCodice(codice: string): StatoIncontroInterface {
      const r = StatoIncontro.data.find(v => v.codice === codice.toUpperCase());
      return r === undefined ? null : r;
  }

  static getByDescrizione(descrizione: string): StatoIncontroInterface {
      const r = StatoIncontro.data.find(v => v.descrizione.toLowerCase() === descrizione.toLowerCase());
      return r === undefined ? null : r;
  }
}
