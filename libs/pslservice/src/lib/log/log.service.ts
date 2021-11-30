export abstract class LogService {
  /**
   * messaggio di log
   *
   * @param msg messaggio
   */
  abstract log(...msg: any[]): void;
  /**
   * messaggio di errore
   *
   * @param msg messaggio
   */
  abstract error(...msg: any[]): void;
}
