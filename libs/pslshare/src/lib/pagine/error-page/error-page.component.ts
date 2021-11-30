import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Router, RouterState, RouterStateSnapshot } from '@angular/router';
import { LogService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslshare-error-page',
  templateUrl: './error-page.component.html'
})
export class ErrorPageComponent implements OnInit, OnDestroy {
  errorMessage: String;
  sub;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService
  ) {
  }

  ngOnInit() {
    this.errorMessage = this.route.snapshot.data['message'] ||
                        this.route.snapshot.params['message'] ||
                        this.route.snapshot.queryParams['message'] ||
                        'Si è verificato un errore';
    const state: RouterState = this.router.routerState;
    const snapshot: RouterStateSnapshot = state.snapshot;
    const root: ActivatedRouteSnapshot = snapshot.root;
    const child = root.firstChild;
                        this.logService.log("URL =" + child.url.toString());
    this.sub = this.route
      .queryParams
      .subscribe(params => {
        // Defaults to 0 if no query param provided.
        this.logService.log(params['message']);
      });
    this.utilitiesService.hideSpinner();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
