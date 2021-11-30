import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavigationEmitter, TypeExit, WizardInterface } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslshare-wizard-cm',
  templateUrl: './wizard-cm.component.html'
})
export class WizardCMComponent implements OnInit {

  @Input() validLink = true;
  @Output() exitPage: EventEmitter<NavigationEmitter> = new EventEmitter<NavigationEmitter>();

  wizard: WizardInterface[] = [];
  loading: boolean;
  show: boolean;
  isDisabile: boolean;
  thisPath: string;
  thisIndex: number;
  private readonly COLLOCAMENTO_MIRATO = 'collocamento-mirato';
  activeLink = true;
  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly commonFCService: CommonPslpService
  ) {}

  async ngOnInit() {
    this.show = this.commonFCService.wizard;
    this.isDisabile = this.commonFCService.wizardDisabile;
    if (!this.show) {
      return;
    }
    this.loading = true;
    this.wizard.push(
      { path: 'cittadino', text: 'Cittadino', li: 'first', span: 'badge', exitNav: TypeExit.Prev },
      { path: 'richiesta', text: 'Richiesta', li: 'center', span: 'badge', exitNav: TypeExit.Prev }
    );
    if (this.isDisabile) {
      this.wizard.push(
        { path: 'disabile', text: 'Disabile', li: 'center', span: 'badge', exitNav: TypeExit.Prev }
      );
    }
    this.wizard.push(
      { path: 'reddito-richiesta-iscrizione', text: 'Reddito', li: 'center', span: 'badge', exitNav: TypeExit.Prev },
      { path: 'familiari-richiesta-iscrizione', text: 'Familiari', li: 'center', span: 'badge', exitNav: TypeExit.Prev },
      { path: 'allegati-richiesta-iscrizione', text: 'Allegati', li: 'center', span: 'badge', exitNav: TypeExit.Prev },
      { path: 'riepilogo-richiesta-iscrizione', text: 'Riepilogo', li: 'last', span: 'badge', exitNav: TypeExit.Prev }
    );

   /* const isModificata: boolean = await this.commonFCService.isSapModificata();
    if (isModificata) {
       this.wizard.push(
        { path: 'esito', text: 'invia modifiche',   li: 'center',   span: 'badge', exitNav: TypeExit.Prev }
       );
    } */   // qui intervenire per eseguire invia
    this.wizard[0].li = 'first';

    this.thisPath = this.activatedRoute.snapshot.url[0].path;
   /* if (this.thisPath.startsWith('registrazione-')) {
      this.thisPath = this.wizard[0].path;
      this.activeLink = false;
    } */
    this.activeLink = false;

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
    return '/' + this.COLLOCAMENTO_MIRATO + '/' + path;
  }

  onLink(index: number) {
    if (this.activeLink && this.validLink) {
      const path = '/' + this.COLLOCAMENTO_MIRATO + '/' + this.wizard[index].path;
      const nextEvent: NavigationEmitter = {exit: TypeExit.Wizard, url: path};
      this.exitPage.emit( nextEvent);
    }
  }
}
