import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WizardInterface } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice';



@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html'
})
export class WizardComponent implements OnInit {
  wizard: WizardInterface[] = [];
  loading: boolean;
  show: boolean;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly commonPslpService: CommonPslpService
  ) {}

  ngOnInit() {
    this.show = this.commonPslpService.wizard;
    if (!this.show) {
      return;
    }
    this.loading = true;
    this.wizard.push(
      { path: 'dati-anagrafici', text: 'dati<br>anagrafici',                     li: 'first', span: 'badge' },
      { path: 'informazioni',    text: 'informazioni<br>aggiuntive & documenti', li: 'center', span: 'badge' },
      { path: 'conferma',        text: 'conferma<br>dati',                       li: 'center', span: 'badge' },
      { path: 'appuntamento',    text: 'appuntamento',                           li: 'last',   span: 'badge' }
    );
    const path = this.activatedRoute.snapshot.url[0].path;
    for (let index = 0; index < this.wizard.length; index++) {
      const element = this.wizard[index];
      if (element.path === path) {
        element.li += ' active';
        element.span += ' secondary';
        break;
      }
      element.li += ' comp';
      element.span += ' primary';
    }
    this.loading = false;
  }

}
