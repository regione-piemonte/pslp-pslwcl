import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Params, Router, RouterState, RouterStateSnapshot } from '@angular/router';

/**
 * Component gestione
 * pagina di atterraggio per segnalazione
 * URL errato / pagina non trovata
 *
 */
@Component({
  selector: 'pslshare-page-not-found',
  templateUrl: './page-not-found.component.html'
})
export class PageNotFoundComponent implements OnInit {
  errorMessage: String;
  sub;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    const state: RouterState = this.router.routerState;
    const snapshot: RouterStateSnapshot = state.snapshot;
    const root: ActivatedRouteSnapshot = snapshot.root;
    const child = root.firstChild;
    this.errorMessage = "la pagina <strong>'" + child.url.toString() + "'</strong> non è stata trovata!";
    const msg: Params = {message: this.errorMessage};
    this.router.navigate(['/error-page'], {queryParams: msg});
  }
}
