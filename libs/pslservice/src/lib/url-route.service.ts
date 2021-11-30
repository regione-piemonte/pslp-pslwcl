import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UrlRouteService {
  private previousUrl: string;
  private currentUrl: string;

  constructor(
    private readonly router: Router
  ) {
    this.currentUrl = this.router.url;
    router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      console.log(event);
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
    });
  }
  public getCurrentUrl(): string {
    return this.currentUrl;
  }
  public getPreviousUrl(): string {
    return this.previousUrl;
  }
}
