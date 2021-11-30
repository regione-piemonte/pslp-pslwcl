import { Injectable, Inject, Optional } from '@angular/core';
import { Subject } from 'rxjs';
import { UserInfo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService } from './log';
import { ENV_AMBIENTE } from './injection-token';
import { SessionStorageService } from './session-storage.service';
import { DOCUMENT } from '@angular/common';
import { isNullOrUndefined } from 'util';

@Injectable({
  providedIn: 'root'
})
export class SpidUserService {
  static readonly USER_SESSION_KEY = 'SpidUserService.user';
  static id = 0;

  userUpdate = new Subject<UserInfo>();

  private user: UserInfo;

  constructor(
    private readonly logService: LogService,
    private readonly storageService: SessionStorageService,
    @Inject(ENV_AMBIENTE) @Optional() private ambiente: string,
    @Inject(DOCUMENT) private document: Document
  ) { }

  getUser(): UserInfo {
    if (isNullOrUndefined(this.user) && (this.ambiente === 'dev' || this.ambiente === 'test')  ) {
      const user = this.storageService.getItem(SpidUserService.USER_SESSION_KEY, true);
      this.user = user;
    }
    return this.user;
  }

  setUser(value: UserInfo) {
    this.user = value;
    this.logService.log('spid.user setUser Utente loggato :', value);
    this.userUpdate.next(this.user);
    this.persistUser();
  }

  private persistUser() {
    if (this.ambiente === 'dev' || this.ambiente === 'test' || this.ambiente === 'coll') {
      this.storageService.setItem(SpidUserService.USER_SESSION_KEY, this.user);
    }
  }

  nullifyUser() {
    this.storageService.setItem(SpidUserService.USER_SESSION_KEY, null);
    this.userUpdate.next(null);
  }

  hydrateData() {
    if (this.document.location.search) {
      const urlSP = new URLSearchParams(this.document.location.search.substring(1));
      if (urlSP.get('user')) {
        try {
          this.setUser(JSON.parse(atob(urlSP.get('user'))));
          return () => Promise.resolve(null);
        } catch (error) {
          // ignorata eccezione
        }
      }
    }
    if (this.ambiente !== 'dev') {
      return () => Promise.resolve(null);
    }
    const user = this.storageService.getItem(SpidUserService.USER_SESSION_KEY, true);
    if (!user) {
      return () => Promise.resolve(null);
    }
    this.setUser(user);
  }

  getName(): string {
    this.logService.log('Utente loggato :', this.user);
    if (this.user) {
      let cognome = this.user.cognome;
      if (!isNullOrUndefined(cognome) && cognome.length > 1 ) {
        cognome = cognome.charAt(0).toUpperCase() + cognome.slice(1).toLowerCase();
      }
      let nome = this.user.nome;
      if (!isNullOrUndefined(nome) && nome.length > 1 ) {
        nome = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase();
      }
      return cognome + ' ' + nome;
    } else {
      return 'non definito';
    }
  }
}
