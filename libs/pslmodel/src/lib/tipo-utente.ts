export enum CategoriaUtente {
  UTENTE,
  OPERATORE
}

export enum TipoUtenteCodice {
  APL,
  CIT,
  CPI,
  REG
}

export interface TipoUtenteInterface {
  codice: TipoUtenteCodice;
  valore: string;
  descrizione: string;
  categoria: CategoriaUtente;
}

export class TipoUtente {
  private static readonly data: TipoUtenteInterface[] = [
    { codice: TipoUtenteCodice.APL, valore: 'APL', descrizione: 'Operatore APL', categoria: CategoriaUtente.OPERATORE },
    { codice: TipoUtenteCodice.CIT, valore: 'CIT', descrizione: 'Cittadino', categoria: CategoriaUtente.UTENTE },
    { codice: TipoUtenteCodice.CPI, valore: 'CPI', descrizione: 'Operatore CpI', categoria: CategoriaUtente.OPERATORE },
    { codice: TipoUtenteCodice.REG, valore: 'REG', descrizione: 'Operatore Regionale', categoria: CategoriaUtente.OPERATORE }
  ];

  static get(): TipoUtenteInterface[] {
    return TipoUtente.data;
  }

  static getByCodice(codice: TipoUtenteCodice): TipoUtenteInterface {
    if (codice === null) {
      return null;
    }
    const r = TipoUtente.data.find(v => v.codice === codice);
    return r === undefined ? null : r;
  }

  static getByValore(valore: string): TipoUtenteInterface {
    if (!valore) {
      return null;
    }
    const r = TipoUtente.data.find(v => v.valore === valore.toLocaleUpperCase());
    return r === undefined ? null : r;
  }
}
