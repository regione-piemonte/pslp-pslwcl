import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WizardInterface } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328

declare const $: any;

/**
 * Component
 * gestione wizard lato operatore
 */
@Component({
  selector: 'pslbowcl-wizard',
  templateUrl: './wizard.component.html'
})
export class WizardComponent implements OnInit {
  @Input() titolo: string;
  wizard: WizardInterface[] = [];
  loading = true;
  flgTornaARicerca = false;
  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loading = true;

    this.wizard.push(
      { path: 'dati-generali', text: 'Dati<br>generali', li: 'first', span: 'badge' },
      { path: 'dati-mail', text: 'Dati<br>e-mail', li: 'center', span: 'badge' },
      { path: 'dati-operativi', text: 'Dati<br>operativi', li: 'center', span: 'badge' },
      { path: 'configurazione', text: 'Configurazione<br>disponibilit&agrave', li: 'center', span: 'badge' },
      { path: 'incontri', text: 'Incontri', li: 'last', span: 'badge' }
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

  plus(i: number): number {
    return 1 + i;
  }

  onExit() {
    $('#modal_ricerca').modal('show');
  }

  doExit() {
    this.router.navigate(['/calendario/ricerca']);
  }
}
