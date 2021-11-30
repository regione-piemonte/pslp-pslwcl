import { Injectable } from '@angular/core';
import { ConfigurazioneProfilingDid, ConfigurazioneQuestionario, DatiInputAggiornamentoDid, DatiInputProfilingDid, Decodifica, DidService, Esito, EsitoDettaglioDid, EsitoSaveDid, EsitoSaveProfilingDid, GradoStudio, TitoloDiStudio, TitoloStudio } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

@Injectable({
  providedIn: 'root'
})
export class DettaglioDIDUtilitiesService {

  configurazioneProfilingDid: ConfigurazioneProfilingDid;


  constructor(
    private readonly didService: DidService) { }

  private compareDescizione(a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  }

  async getTitoliStudioPerInserimento(iTitoli: TitoloDiStudio[]): Promise<TitoloStudio[]> {
    if (isNullOrUndefined(iTitoli)) {
      return null;
    }
    const listaTitoliDiStudioPerGrado: Array<TitoloStudio> = [];
    this.configurazioneProfilingDid = await this.didService.loadConfigurazioneProfilingDid().pipe(catchError(e => of(null as ConfigurazioneProfilingDid))).toPromise();
    if (isNullOrUndefined(this.configurazioneProfilingDid)) {
      return null;
    } else {
      const elencoTitoliPerGradoFull = this.configurazioneProfilingDid.elencoTitoloStudioProfiling;
      for (let index = 0; index < iTitoli.length; index++) {
        const element = iTitoli[index];
        for (let indexFull = 0; indexFull < elencoTitoliPerGradoFull.length; indexFull++) {
          const ilTitoloDiStudio = elencoTitoliPerGradoFull[indexFull];
          if (ilTitoloDiStudio.codice === element.corso_di_studio.codice_ministeriale) {
            listaTitoliDiStudioPerGrado.push(ilTitoloDiStudio);
          }
        }
      }

      return listaTitoliDiStudioPerGrado.sort(this.compareDescizione);
    }
  }

  async getTitoliStudioFull(): Promise<TitoloStudio[]> {
    this.configurazioneProfilingDid = await this.didService.loadConfigurazioneProfilingDid().pipe(catchError(e => of(null as ConfigurazioneProfilingDid))).toPromise();
    if (isNullOrUndefined(this.configurazioneProfilingDid)) {
      return null;
    } else {
      return this.configurazioneProfilingDid.elencoTitoloStudioProfiling;
    }
  }

  async getGradiStudio(): Promise<GradoStudio[]> {
    this.configurazioneProfilingDid = await this.didService.loadConfigurazioneProfilingDid().pipe(catchError(e => of(null as ConfigurazioneProfilingDid))).toPromise();
    if (isNullOrUndefined(this.configurazioneProfilingDid)) {
      return null;
    } else {
      return this.configurazioneProfilingDid.elencoGradoStudio;
    }
  }

  async getCondizioniOccupazionali(): Promise<Decodifica[]> {
    this.configurazioneProfilingDid = await this.didService.loadConfigurazioneProfilingDid().pipe(catchError(e => of(null as ConfigurazioneProfilingDid))).toPromise();
    if (isNullOrUndefined(this.configurazioneProfilingDid)) {
      return null;
    } else {
      return this.configurazioneProfilingDid.elencoCondizioniOccupazionali.sort(this.compareDescizione);
    }
  }

  async getMotiviPresenzaInItalia(): Promise<Decodifica[]> {
    this.configurazioneProfilingDid = await this.didService.loadConfigurazioneProfilingDid().pipe(catchError(e => of(null as ConfigurazioneProfilingDid))).toPromise();
    if (isNullOrUndefined(this.configurazioneProfilingDid)) {
      return null;
    } else {
      return this.configurazioneProfilingDid.elencoPresenzaInItalia;
    }
  }

  async getIscrizioniCorso(): Promise<Decodifica[]> {
    this.configurazioneProfilingDid = await this.didService.loadConfigurazioneProfilingDid().pipe(catchError(e => of(null as ConfigurazioneProfilingDid))).toPromise();
    if (isNullOrUndefined(this.configurazioneProfilingDid)) {
      return null;
    } else {
      return this.configurazioneProfilingDid.elencoIscrizioneCorso.sort(this.compareDescizione);
    }
  }

  async getElenchiCategorieProfessionali(): Promise<Decodifica[]> {
    this.configurazioneProfilingDid = await this.didService.loadConfigurazioneProfilingDid().pipe(catchError(e => of(null as ConfigurazioneProfilingDid))).toPromise();
    if (isNullOrUndefined(this.configurazioneProfilingDid)) {
      return null;
    } else {
      return this.configurazioneProfilingDid.elencoPosizioneProfessionale.sort(this.compareDescizione);
    }
  }

  async getDomandeQuestionarioDid(): Promise<ConfigurazioneQuestionario> {
    this.configurazioneProfilingDid = await this.didService.loadConfigurazioneProfilingDid().pipe(catchError(e => of(null as ConfigurazioneProfilingDid))).toPromise();
    if (isNullOrUndefined(this.configurazioneProfilingDid)) {
      return null;
    } else {
      return this.configurazioneProfilingDid.configurazione_questionario;
    }
  }

  public async saveProfilingDidService(idUtente: number, profiling: DatiInputProfilingDid): Promise<EsitoSaveProfilingDid> {
    return await this.didService.saveProfilingDidService(idUtente, profiling).pipe(
      catchError(err => of(null as Esito))
    ).toPromise();
  }

  public async saveDidService(idUtente: number, did: DatiInputAggiornamentoDid): Promise<EsitoSaveDid> {
    return await this.didService.saveDidService(idUtente, did).pipe(
      catchError(err => of(null as Esito))
    ).toPromise();
  }

  public async changeStateDidAfterInsertProfilingService(idUtente: number, did: DatiInputAggiornamentoDid): Promise<EsitoSaveDid> {
    return await this.didService.changeStateDidAfterInsertProfilingService(idUtente, did).pipe(
      catchError(err => of(null as Esito))
    ).toPromise();
  }

  public controlloDidService(idUtente: number, scrivere_log_su_db: string, did: DatiInputAggiornamentoDid): Promise<EsitoSaveDid> {
    return this.didService.controlloDidService(idUtente, scrivere_log_su_db, did).pipe(
      catchError(err => of(null as Esito))
    ).toPromise();
  }

  public async ricercaDettaglioDIDService(idUtente: number): Promise<EsitoDettaglioDid> {
    return await this.didService.ricercaDettaglioDIDService(idUtente).pipe(
      catchError(err => of(null as EsitoDettaglioDid))
    ).toPromise();
  }

  public async logService(idUtente: number, msg: string) {
    return await this.didService.logService(idUtente, msg).pipe(
      catchError(err => of(null as Esito))
    ).toPromise();
  }

}
