import { Injectable } from '@angular/core';
import { BusinessService, Parametro } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ParametriSistemaService {
  private static readonly GG_PROFILING_FLG = 'GG_PROFILING_FLG';
  private static readonly RDC_FLG = 'RDC_FLG';
  private static readonly TEMPO_ESPO_MSG = 'TEMPO_ESPO_MSG';
  private static readonly PSLP_ACCESSO_CITT = 'PSLP_ACCESSO_CITT';
  private static readonly MODIF_SEZIONI_FLG = 'MODIF_SEZIONI_FLG';
  private static readonly DOMIC_PIEMONTE_FLG = 'DOMIC_PIEMONTE_FLG';
  private static readonly COMI_FLG = 'COMI_FLG';
  private static readonly MINORE_ETA = 'MINORE_ETA';
  private static readonly MINORE_ETA_ESP_LAV = 'MINORE_ETA_ESP_LAV';
  private static readonly MAX_REDDITO_COLL_MIRATO = 'MAX_REDDITO_COLL_MIR';
  private static readonly URL_SPID = 'URL_SPID';
  private static readonly URL_APL = 'URL_APL';
  private static readonly URL_FESR = 'URL_FESR';
  private static readonly URL_CSI = 'URL_CSI';
  private static readonly URL_LAV_PIEMONTE = 'URL_LAV_PIEMONTE';
  private static readonly URL_REG_PIEMONTE = 'URL_REG_PIEMONTE';
  private static readonly URL_TU_PIEMONTE = 'URL_TU_PIEMONTE';

  private static readonly OPER_CONTO_TERZI_FLG = 'OPER_CONTO_TERZI_FLG';
  private static readonly OPER_CALENDARIO = 'OPER_CALENDARIO';
  private static readonly OPER_CONFIGURAZIONI = 'OPER_CONFIGURAZIONI';
  private static readonly OPER_APPLICA_FLG = 'OPER_APPLICA_FLG';
  private static readonly PSLP_ACCESSO_OPER = 'PSLP_ACCESSO_OPER';
  private static readonly APPUNT_MARGINE_GG = 'APPUNT_MARGINE_GG';

  private static readonly GG_MINORE_ETA = 'GG_MINORE_ETA';
  private static readonly GG_MAGGIORE_ETA = 'GG_MAGGIORE_ETA';

  private static readonly DID_TITOLO_PATTO = 'DID_TITOLO_PATTO';
  private static readonly DID_SOTTOTIT_PATTO = 'DID_SOTTOTIT_PATTO';

  private static readonly DT_MIN_REV_VER_INV = 'DT_MIN_REV_VER_INV';

  private static readonly COMI_RICH_FLG  = 'COMI_RICH_FLG';


  isProfilingGGEnabled: Promise<boolean>;
  isRdcEnabled: Promise<boolean>;
  readonly isAccessoCittadinoEnabled: Promise<boolean>;
  tempoEspoMsgMs: Promise<number>;
  isModificabiliSezioni: Promise<boolean>;
  isObbligoDomicPiemonte: Promise<boolean>;
  isCoMiEnabled: Promise<boolean>;
  isCoMiRichiestaEnabled: Promise<boolean>;
  minoreEta: Promise<number>;
  minoreEtaEspLav: Promise<number>;
  maxRedditoCollMirato: Promise<string>;
  urlSpid: Promise<string>;
  urlApl: Promise<string>;
  urlFesr: Promise<string>;
  urlCsi: Promise<string>;
  urlLavPiemonte: Promise<string>;
  urlRegPiemonte: Promise<string>;
  urlTuPiemonte: Promise<string>;

  didTitoloPatto: Promise<string>;
  didSottotitoloPatto: Promise<string>;

  dataMinRevisioneVerbaleInvCivile: Promise<string>;

  readonly isOperatoriContoTerziEnabled: Promise<boolean>;
  readonly isOperatoriCalendarioEnabled: Promise<boolean>;
  readonly isOperatoriConfigurazioniEnabled: Promise<boolean>;
  readonly isOperatoriApplicaEnabled: Promise<boolean>;
  readonly isAccessoOperatoreEnabled: Promise<boolean>;
  readonly AppuntamentoMargineGiorni: Promise<number>;

  etaMinGG: Promise<number>;
  etaMaxGG: Promise<number>;

  constructor(
    private readonly businessService: BusinessService
  ) {
    this.isProfilingGGEnabled = this.businessService.getParametro(ParametriSistemaService.GG_PROFILING_FLG).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.isRdcEnabled = this.businessService.getParametro(ParametriSistemaService.RDC_FLG).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.tempoEspoMsgMs = this.businessService.getParametro(ParametriSistemaService.TEMPO_ESPO_MSG).pipe(
      map( (parametro: Parametro) => +parametro.valore_parametro),
      catchError( () => of(10)),
      map((value: number) => value * 1000)
    ).toPromise();
    this.isAccessoCittadinoEnabled = this.businessService.getParametro(ParametriSistemaService.PSLP_ACCESSO_CITT).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.isObbligoDomicPiemonte = this.businessService.getParametro(ParametriSistemaService.DOMIC_PIEMONTE_FLG).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.isModificabiliSezioni = this.businessService.getParametro(ParametriSistemaService.MODIF_SEZIONI_FLG).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.isCoMiEnabled = this.businessService.getParametro(ParametriSistemaService.COMI_FLG).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.minoreEta = this.businessService.getParametro(ParametriSistemaService.MINORE_ETA).pipe(
      map( (parametro: Parametro) => +parametro.valore_parametro),
      catchError( () => of(0))
    ).toPromise();
    this.minoreEtaEspLav = this.businessService.getParametro(ParametriSistemaService.MINORE_ETA_ESP_LAV).pipe(
      map( (parametro: Parametro) => +parametro.valore_parametro),
      catchError( () => of(0))
    ).toPromise();
    this.maxRedditoCollMirato = this.businessService.getParametro(ParametriSistemaService.MAX_REDDITO_COLL_MIRATO).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of('999999,99'))
    ).toPromise();
    this.AppuntamentoMargineGiorni = this.businessService.getParametro(ParametriSistemaService.APPUNT_MARGINE_GG).pipe(
      map( (parametro: Parametro) => +parametro.valore_parametro),
      catchError( () => of(0))
    ).toPromise();
    this.isOperatoriContoTerziEnabled = this.businessService.getParametro(ParametriSistemaService.OPER_CONTO_TERZI_FLG).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.isOperatoriCalendarioEnabled = this.businessService.getParametro(ParametriSistemaService.OPER_CALENDARIO).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.isOperatoriConfigurazioniEnabled = this.businessService.getParametro(ParametriSistemaService.OPER_CONFIGURAZIONI).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.isOperatoriApplicaEnabled = this.businessService.getParametro(ParametriSistemaService.OPER_APPLICA_FLG).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.isAccessoOperatoreEnabled = this.businessService.getParametro(ParametriSistemaService.PSLP_ACCESSO_OPER).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
    this.urlSpid = this.businessService.getParametro(ParametriSistemaService.URL_SPID).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.urlApl = this.businessService.getParametro(ParametriSistemaService.URL_APL).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.urlFesr = this.businessService.getParametro(ParametriSistemaService.URL_FESR).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.urlCsi = this.businessService.getParametro(ParametriSistemaService.URL_CSI).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.urlLavPiemonte = this.businessService.getParametro(ParametriSistemaService.URL_LAV_PIEMONTE).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.urlRegPiemonte = this.businessService.getParametro(ParametriSistemaService.URL_REG_PIEMONTE).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.urlTuPiemonte = this.businessService.getParametro(ParametriSistemaService.URL_TU_PIEMONTE).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.etaMinGG = this.businessService.getParametro(ParametriSistemaService.GG_MINORE_ETA).pipe(
      map( (parametro: Parametro) => +parametro.valore_parametro),
      catchError( () => of(15))
    ).toPromise();
    this.etaMaxGG = this.businessService.getParametro(ParametriSistemaService.GG_MAGGIORE_ETA).pipe(
      map( (parametro: Parametro) => +parametro.valore_parametro),
      catchError( () => of(29))
    ).toPromise();
    this.didTitoloPatto = this.businessService.getParametro(ParametriSistemaService.DID_TITOLO_PATTO).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.didSottotitoloPatto = this.businessService.getParametro(ParametriSistemaService.DID_SOTTOTIT_PATTO).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.dataMinRevisioneVerbaleInvCivile = this.businessService.getParametro(ParametriSistemaService.DT_MIN_REV_VER_INV).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro),
      catchError( () => of(''))
    ).toPromise();
    this.isCoMiRichiestaEnabled = this.businessService.getParametro(ParametriSistemaService.COMI_RICH_FLG).pipe(
      map( (parametro: Parametro) => parametro.valore_parametro === 'S'),
      catchError( () => of(false))
    ).toPromise();
  }
}
