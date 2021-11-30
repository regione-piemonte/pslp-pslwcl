export interface StatoDidInterface {
  codice: string;
  descrizione: string;
  colore: string;
}

const TEXT_WHITE = 'bg-danger text-white';
export class StatoDid {
  private static readonly data: StatoDidInterface[] = [
    { 'codice': 'I', 'descrizione': 'INSERITA', colore: 'bg-success text-white' },
    { 'codice': 'C', 'descrizione': 'CONVALIDATA', colore: 'bg-secondary text-white' },
    { 'codice': 'S', 'descrizione': 'SOSPESA', colore: 'bg-warning text-white' },
    { 'codice': 'R', 'descrizione': 'REVOCATA', colore: TEXT_WHITE },
    { 'codice': 'A', 'descrizione': 'ANNULLATA', colore: TEXT_WHITE },
    { 'codice': 'E', 'descrizione': 'NON AMMESA', colore: TEXT_WHITE }
  ];

  static get(): StatoDidInterface[] {
    return StatoDid.data;
  }

  static getDescrizioneByCodice(codice: string) {
    const r = StatoDid.data.find(v => v.codice === codice.toUpperCase());
    return r === undefined ? null : r.descrizione;
  }

  static getCodiceByDescrizione(descrizione: string) {
    const r = StatoDid.data.find(v => v.descrizione === descrizione.toLowerCase());
    return r === undefined ? null : r.codice;
  }

  static getColoreByCodice(codice: string) {
    const r = StatoDid.data.find(v => v.codice === codice.toUpperCase());
    return r === undefined ? null : r.colore;
  }
}
