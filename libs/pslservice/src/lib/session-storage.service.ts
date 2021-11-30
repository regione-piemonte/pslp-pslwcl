import { Injectable } from '@angular/core';
import { LogService } from './log';
import { BaseStorageService } from './base-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService extends BaseStorageService {
  constructor(
    logService: LogService
  ) {
    super(logService, sessionStorage);
  }
}
