import { Injectable } from '@angular/core';
import { LogService, LogConsoleService } from './log';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  static environment: any;

  /**
   * prefisso per i servizi di back end
   */
  static getBERootUrl(): string {
    return ConfigService.environment.beServerPrefix + ConfigService.environment.beService;
  }

  /**
   * Url di logout da SSO
   */
  static getSSOLogoutURL(): string {
    return ConfigService.environment.shibbolethSSOLogoutURL;
  }

  /**
   * URL a cui saltare in caso di logout locala
   */
  static getOnAppExitURL(): string {
    return ConfigService.environment.onAppExitURL;
  }

  /**
   * base href per l'index.html
   */
  static getBaseHref(): string {
    return ConfigService.environment.appBaseHref;
  }


  static useAutenticationPage(): boolean {
    console.log("AMBIENTE " + ConfigService.environment.ambiente);
    return !ConfigService.environment.shibbolethAuthentication;
  }

  static getLogService(): LogService {
    return new LogConsoleService();
  }

  static getHomeBaseURL(): string {
    return ConfigService.environment.appHomeURL;
  }

  static getCittadinoBaseURL(): string {
    return ConfigService.environment.appCittadinoURL;
  }

  static getFascicoloBaseURL(): string {
    return ConfigService.environment.appFascicoloURL;
  }

  static getBackOfficeBaseURL(): string {
    return ConfigService.environment.appBackOfficeURL;
  }

  static getMappeURL(): string {
    return ConfigService.environment.urlMappe;
  }

  static getAmbiente(): string {
    return ConfigService.environment.ambiente;
  }
}
