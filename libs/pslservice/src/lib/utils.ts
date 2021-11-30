import { ConfigurazioneCalendarioPeriodoValidita } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

export class Utils {
  // FORMATO ISO CAMBIATO PER PROBLEMATICA DELLE DATE SU SAFARI
  private static readonly ISO_DATE_FORMAT =  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:\+\d{2}:?\d{2})?Z?$/;

  static generateRandomString(length: number = 40) {
    const arr = new Uint8Array(length / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, Utils.dec2hex).join('');
  }

  static dec2hex (dec) {
    return ('0' + dec.toString(16)).substr(-2);
  }

  static convertHandlingDate<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj !== 'object') {
      return obj;
    }
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (Utils.isIsoDateString(value)) {
        obj[key] = new Date(value);
      } else if (typeof value === 'object') {
        Utils.convertHandlingDate(value);
      }
    }
    return obj;
  }

  static toWeekDay(dayNumber: number): string {
    switch (dayNumber) {
      case 1: return 'Lunedì';
      case 2: return 'Martedì';
      case 3: return 'Mercoledì';
      case 4: return 'Giovedì';
      case 5: return 'Venerdì';
      case 6: return 'Sabato';
      case 7: return 'Domenica';
      default: return String(dayNumber);
    }
  }

  static toHourMinute(orario: number) {
    if (!orario) {
      return '';
    }
    const ora = `00${Math.floor(orario / 60)}`.slice(-2);
    const minuto = `00${orario % 60}`.slice(-2);
    return `${ora}:${minuto}`;
  }

  static jsonParse(str: string): any {
    const tmp = JSON.parse(str);
    Utils.convertHandlingDate(tmp);
    return tmp;
  }

  static isIsoDateString(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string') {
      return Utils.ISO_DATE_FORMAT.test(value);
    }
    return false;
  }

  static getDeepValue(object: any, path: string) {
    if (!path || !object) {
      return object;
    }
    const props = path.split('.');
    let tmp = object;
    let i: number;
    for (i = 0; i < props.length - 1; i++) {
      const prop = props[i];
      const candidate = tmp[prop];
      if (candidate !== undefined) {
        tmp = candidate;
      } else {
        break;
      }
    }
    return tmp[props[i]];
  }

  static setDeepValue<T>(object: T, path: string, value: any): T {
    if (path && object) {
        const props = path.split('.');
        let tmp = object;
        let i: number;
        for (i = 0; i < props.length - 1; i++) {
          const prop = props[i];
          let candidate = tmp[prop];
          if (candidate === undefined) {
            tmp[prop] = candidate = {};
          }
          tmp = candidate;
        }
        tmp[props[i]] = value;
    }
    return object;
  }

  static sortPeriodiValidita(pv1: ConfigurazioneCalendarioPeriodoValidita, pv2: ConfigurazioneCalendarioPeriodoValidita): number {
    const delta = pv1.data_da.getTime() - pv2.data_a.getTime();
    return delta < 0 ? -1 : delta === 0 ? 0 : 1;
  }
}
