import { Subject, BehaviorSubject } from 'rxjs';
import { LogService } from './log';
import { Utils } from './utils';

export abstract class BaseStorageService {
  public static readonly UTENTE = 'UTENTE';
  public static readonly SAP = 'SAP';
  public static readonly SAPBYSILP = 'SAPBYSILP';
  public static readonly IDUTENTESAP = 'IDUTENTESAP';
  public static readonly DATI_ANAGRAFICI_TUTORE = 'DATI_ANAGRAFICI_TUTORE';
  public static readonly DATI_ANAGRAFICI = 'DATI_ANAGRAFICI';
  public static readonly PROFILING_GG = 'PROFILING_GG';
  public static readonly INFORMAZIONI_AGGIUNTIVE = 'INFORMAZIONI_AGGIUNTIVE';
  public static readonly ALLEGATI = 'ALLEGATI';
  public static readonly OWN_APPUNTAMENTO = 'OWN_APPUNTAMENTO';
  public static readonly HAS_RIEPILOGO = 'HAS_RIEPILOGO';
  public static readonly ADESIONE_GG = 'ADESIONE_GG';
  public static readonly DOMANDA_RDC = 'DOMANDA_RDC';
  public static readonly COMUNI = 'COMUNI';
  public static readonly CENTRI_IMPIEGO = 'CENTRI_IMPIEGO';

  public static readonly SEZIONI_MODIFICATE_SAP = 'SEZIONI_MODIFICATE_SAP';
  public static readonly ESITO_SAVE_SAP = 'ESITO_SAVE_SAP';
  public static readonly OBBLIGOFORMATIVO = 'OBBLIGOFORMATIVO';

  public static readonly SAP_BACKUP = 'SAP_BACKUP';
  public static readonly IDUTENTESAP_BACKUP = 'IDUTENTESAP_BACKUP';
  public static readonly SEZIONI_MODIFICATE_SAP_BACKUP = 'SEZIONI_MODIFICATE_SAP_BACKUP';

  // collocamento mirato
  public static readonly COMI_ID_RICHIESTA_ISCRIZIONE = 'COMI_ID_RICHIESTA_ISCRIZIONE';  // id richiesta dettaglio iscrizione legge 68
  public static readonly COMI_DETTAGLIO_ISCRIZIONE = 'COMI_DETTAGLIO_ISCRIZIONE';        // dettaglio iscrizione legge 68
  public static readonly COMI_TIPO_ISCRIZIONE = 'COMI_TIPO_ISCRIZIONE';                  // elenco Tipo Iscrizione
  public static readonly COMI_MOTIVO_ISCRIZIONE = 'COMI_MOTIVO_ISCRIZIONE';              // elenco Motivo Iscrizione
  public static readonly COMI_STATO_ISCRIZIONE = 'COMI_STATO_ISCRIZIONE';                // elenco Stato Iscrizione
  public static readonly COMI_TIPO_COMUNICAZIONE = 'COMI_TIPO_COMUNICAZIONE';            // elenco Tipo Comunicazione
  public static readonly COMI_CATEG_PROTETTA_DISAB = 'COMI_CATEG_PROTETTA_DISAB';        // elenco Categoria Protetta Disabili
  public static readonly COMI_CATEG_PROTETTA = 'COMI_CATEG_PROTETTA';                     // elenco Categoria Protetta
  public static readonly COMI_QUALIF_NON_VEDENTI = 'COMI_QUALIF_NON_VEDENTI';             // elenco Qualifiche Non Vedenti
  public static readonly COMI_CATEG_INVALIDITA_DISAB = 'COMI_CATEG_INVALIDITA_DISAB';     // elenco Categoria Invalidita' Disabili
  public static readonly COMI_LIMITE_REDDITO_LORDO_AUTONOMO = 'COMI_LIMITE_REDDITO_LORDO_AUTONOMO';   // limite Reddito Lordo AnnuoRapporto Autonomo
  public static readonly COMI_LIMITE_REDDITO_LORDO_SUBORDINATO = 'COMI_LIMITE_REDDITO_LORDO_SUBORDINATO';  // limite Reddito Lordo Annuo Rapporto Subordinato
  public static readonly COMI_GRADO_DISAB_NON_VEDENTI = 'COMI_GRADO_DISAB_NON_VEDENTI';  // Grado Disabilita' Non Vedenti
  public static readonly COMI_GRADO_DISAB_SORDOMUTI = 'COMI_GRADO_DISAB_SORDOMUTI';  // Grado Disabilita Sordomuti
  public static readonly COMI_ELENCO_DICHIARAZIONE_VISITA_REVISIONE_INVALIDITA_CIVILE = 'COMI_ELENCO_DICHIARAZIONE_VISITA_REVISIONE_INVALIDITA_CIVILE' // Elenco Dichiarazione Visita Revisione Invalidita' Civile
  // operatore
  public static readonly PARAM_RICERCA_CALENDARIO = 'PARAM_RICERCA_CALENDARIO';
  public static readonly CURRENT_PAGE = 'CURRENT_PAGE';
  public static readonly CONFIGURAZIONE_CALENDARIO = 'CONFIGURAZIONE_CALENDARIO';
  public static readonly READONLY = 'READONLY';

  private storageSubject: Subject<Storage> = new BehaviorSubject(this.storage);

  get storage$() { return this.storageSubject.asObservable(); }

  constructor(
    protected logService: LogService,
    protected storage: Storage
  ) {}

  public setItem<T>(key: string, value: T): string {
    if (!value) {
      this.clearItem(key);
      return;
    }
    const val: string = this.isObject(value) ? JSON.stringify(value) : (value + '');
    this.storage.setItem(key, val);
    this.storageSubject.next(this.storage);
    return val;
  }

  public getItem<T>(key: string, parse: boolean = false): T {
    const item = this.storage.getItem(key);
    if (item === 'undefined') {
      return undefined;
    }
    return parse ? Utils.convertHandlingDate(JSON.parse(item)) : item;
  }

  public async getCachedValue<T>(key: string, initializer: () => Promise<T>, parse: boolean = true): Promise<T> {
    let result: T = this.getItem(key, parse);
    if (result) {
      return result;
    }
    result = await initializer();
    this.setItem(key, result);
    return result;
  }

  public clearItem(key: string): void {
    this.storage.removeItem(key);
    this.storageSubject.next(this.storage);
  }

  public clearItems(...keys: string[]): void {
    keys.forEach(key => this.storage.removeItem(key));
    this.storageSubject.next(this.storage);
  }

  /**
  * Clear all storage
  */
  public clearStorage(): void {
    this.storage.clear();
    this.storageSubject.next(this.storage);
  }

  private isObject(obj: any): boolean {
    const type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  }
}
