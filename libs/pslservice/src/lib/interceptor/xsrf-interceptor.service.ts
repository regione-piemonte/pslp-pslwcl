import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUserService } from '../app-user.service';

const XSRF_HEADER_NAME = 'X-XSRF-TOKEN';

@Injectable()
export class XsrfInterceptorService implements HttpInterceptor {

  constructor(
    private readonly appUserService: AppUserService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let newReq = req;

    if (this.appUserService.xsrfToken) {
      newReq = req.clone({
        setHeaders: { [XSRF_HEADER_NAME]: this.appUserService.xsrfToken }
      });
    }
    return next.handle(newReq);
  }

}
