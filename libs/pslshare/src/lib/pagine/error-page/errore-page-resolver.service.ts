import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorePageResolverService implements Resolve<string>  {
  private static readonly DEFAULT_MESSAGE = 'Si è verificato un errore';
  private message: string;
  constructor(
    private readonly utilitiesService: UtilitiesService

  ) {}

  clearMessage() {
    this.message = null;
  }
  setMessage(message: string) {
    this.message = message;
  }
  getMessage(): string {
    const m = this.message;
    this.clearMessage();
    return m;
  }
  async putMessage() {
    const mesCodice = this.getMessage();
    if (!mesCodice) {
      return null;
    }
    const message = await this.utilitiesService.getMessage(mesCodice);
    if (message.indexOf(mesCodice) < 0 ) {
           return message;
     }
     return mesCodice;
  }
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): string | Observable<string> | Promise<string> {
      const dataMessage: string = route.data ? route.data['message'] : null;
      return this.putMessage() || dataMessage || ErrorePageResolverService.DEFAULT_MESSAGE;
  }

}
