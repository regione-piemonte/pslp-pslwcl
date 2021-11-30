import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavigationEmitter, TypeExit, WizardInterface } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslfcwcl-wizard',
  templateUrl: './wizard.component.html'
})
export class WizardComponent implements OnInit {
  @Input() validLink = true;
  @Output() exitPage: EventEmitter<NavigationEmitter> = new EventEmitter<NavigationEmitter>();

  wizard: WizardInterface[] = [];
  loading: boolean;
  show: boolean;
  thisPath: string;
  thisIndex: number;
  private readonly FASCICOLO_CITTADINO = 'fascicolo-cittadino';
  activeLink = true;
  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly commonFCService: CommonPslpService
  ) {}

  async ngOnInit() {
    this.show = this.commonFCService.wizard;
    if (!this.show) {
      return;
    }
    this.loading = true;
   /* const minorenne = await this.commonFCService.isMinorenne$();
    if (minorenne) {
      this.wizard.push({ path: 'dati-anagrafici-tutore', text: 'dati<br>anagrafici<br>responsabile', li: 'center', span: 'badge' });
    } */
    this.wizard.push(
      { path: 'dati-anagrafici',     text: 'dati<br>anagrafici', li: 'first', span: 'badge', exitNav: TypeExit.Prev },
      { path: 'dati-amministrativi', text: 'dati<br>amministrativi',  li: 'center', span: 'badge', exitNav: TypeExit.Prev },
      { path: 'esperienze-lavoro',   text: 'esperienze<br>di lavoro', li: 'center', span: 'badge', exitNav: TypeExit.Prev },
      { path: 'dati-curriculari',    text: 'dati<br>curriculari',     li: 'center', span: 'badge', exitNav: TypeExit.Prev },
      { path: 'politiche-attive',    text: 'politiche<br>attive',     li: 'center', span: 'badge', exitNav: TypeExit.Prev }
     /* { path: 'esito',               text: 'riepilogo',   li: 'center',   span: 'badge', exitNav: TypeExit.Prev } */
    );

    const isModificata: boolean = await this.commonFCService.isSapModificata();
    if (isModificata) {
       this.wizard.push(
        { path: 'esito', text: 'invia modifiche',   li: 'center',   span: 'badge', exitNav: TypeExit.Prev }
       );
    }
    this.wizard[0].li = 'first';


    this.thisPath = this.activatedRoute.snapshot.url[0].path;
    if (this.thisPath.startsWith('registrazione-')) {
      this.thisPath = this.wizard[0].path;
      this.activeLink = false;
    }

    for (let index = 0; index < this.wizard.length; index++) {
      const element = this.wizard[index];
      if (element.path === this.thisPath) {
        this.thisIndex = index;
        element.li += ' active';
        element.span += ' secondary';
        break;
      }
      element.li += ' comp';
      element.span += ' primary';
    }
    this.loading = false;
  }

  onClick(path: string) {
    return '/' + this.FASCICOLO_CITTADINO + '/' + path;

  }

  onLink(index: number) {
    if (this.activeLink && this.validLink) {
      const path = '/' + this.FASCICOLO_CITTADINO + '/' + this.wizard[index].path;
      const nextEvent: NavigationEmitter = {exit: TypeExit.Wizard, url: path};
      this.exitPage.emit( nextEvent);
    }
  }
}
