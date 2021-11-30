import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SecurityPslpService } from './security-pslp.service';
import { ConfigService } from './config.service';
import { catchError, retryWhen, timeout } from 'rxjs/operators';
import { SrvError } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { handleError, selectiveRetryStrategy } from './service.utils';
import { LogService } from './log';

@Injectable({
  providedIn: 'root'
})
export class KeepaliveService {

  constructor(
    private readonly http: HttpClient,
    private readonly securityService: SecurityPslpService,
    private readonly logService: LogService
  ) {
    this.logService.log('injected security service:' + this.securityService);
  }

  private getPingUrl(): string {
    return ConfigService.getBERootUrl() + '/ping';
  }
  /**
   *  Invocazione del metodo di keep-alive per il mantenimento della sessione server
   * N.B: il keep alive va sempre sul server locale al momento!!!!!
   */
  keepAlive(): Observable<String | SrvError> {
    const errorHandler = handleError.bind(this);
    return this.http.get(this.getPingUrl(), {responseType: 'text'}).pipe(
      timeout(1000),
      retryWhen(selectiveRetryStrategy({ scalingDuration: 50, excludedStatusCodes: [555, 302, 0], maxRetryAttempts: 2 })),
      catchError(errorHandler)
    );
  }
}
