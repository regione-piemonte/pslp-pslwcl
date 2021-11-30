import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';

@Component({
  selector: 'pslshare-showdata',
  templateUrl: './showdata.component.html'
})
export class ShowdataComponent implements OnInit, OnDestroy {
  @Input() oggettoDati: any;
  active = false;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly utilitiesService: UtilitiesService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.utilitiesService.debug$.subscribe(debugMode => this.active = debugMode)
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
