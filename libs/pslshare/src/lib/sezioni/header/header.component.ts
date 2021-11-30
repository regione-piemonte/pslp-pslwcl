import { Component, Inject, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { NavigationStart, Router, RouterEvent } from '@angular/router';
import { DialogModaleMessage, TypeApplicationCard, TypeDialogMessage, VersionData } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { APP_VERSION, LogService, ParametriSistemaService, SecurityPslpService, SpidUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HelpMessage } from '../../help-message';
import { PslshareService } from '../../pslshare.service';

declare var require: any;

@Component({
  selector: 'pslshare-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly subscriptions = [] as Array<Subscription>;

  @Input() helpCache: Map<string, HelpMessage>;
  @Input() subheaderContent = '';

  descrizioneUtente: string;
  testoVers: string;
  testoHelp: string;

  hasUtente: boolean;
  urlUscita: string;
  urlLavPiemonte: string;
  urlTuPiemonte: string;

  constructor(
    private readonly router: Router,
    private readonly pslbasepageService: PslshareService,
    private readonly spidUserService: SpidUserService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService,
    @Optional() @Inject(APP_VERSION) public appVersion: VersionData,
    private readonly securityService: SecurityPslpService,
    private readonly parametriSistemaService: ParametriSistemaService
  ) { }

  async ngOnInit() {
    this.setDatiUtente();
    this.subscriptions.push(
      this.spidUserService.userUpdate.subscribe(() => this.setDatiUtente()),
      this.router.events
        .pipe(filter(e => e instanceof NavigationStart))
        .subscribe((e: RouterEvent) => this.onUrlChange(e))
    );
    this.urlLavPiemonte = await this.parametriSistemaService.urlLavPiemonte;
    this.urlTuPiemonte = await this.parametriSistemaService.urlTuPiemonte;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  onHome() {
    const thisPath = window.location.href;
    this.urlUscita = '/home';
    if (thisPath.indexOf('/riepilogo') < 0
      && thisPath.indexOf('/home') < 0
      && thisPath.indexOf('/mappa') < 0
      && thisPath.indexOf('/login') < 0
      && thisPath.indexOf('/assistenza') < 0
      && thisPath.indexOf('/iscrizione-garanzia') < 0
      && thisPath.indexOf('/page-not-found') < 0
      && thisPath.indexOf('/error-page') < 0) {
      this.openModal();
    } else {
      this.goHome();
    }
  }

  async openModal() {
    const data: DialogModaleMessage = {
      titolo: 'Torna alla Home Page',
      tipo: TypeDialogMessage.YesOrNo,
      messaggioAggiuntivo: 'Eventuali dati non confermati e salvati saranno perduti.'
    };
    const result = await this.pslbasepageService.openModal(data);
    if (result === 'SI') {
      this.goHome();
    }
  }

  goHome() {
    this.securityService.jumpToURL(this.urlUscita, TypeApplicationCard.Home);
  }

  async onExit() {
    this.logService.log('uscita');
    this.securityService.jumpToURL('/logout-spid-landing', TypeApplicationCard.Fascicolo);
  }

  private onUrlChange(e: RouterEvent) {

    let str1 = e.url;
    let index = str1.indexOf("&user");
    if (index < 1) {
      index = str1.indexOf("?user");
    }
    if (index > 1) {
      str1 = str1.substr(0, index);
    }
    index = str1.indexOf("&param");
    if (index < 1) {
      index = str1.indexOf("?param");
    }
    if (index > 1) {
      str1 = str1.substr(0, index);
    }
    const strDefault = 'Help per la pagina <strong>' + str1 + '</strong>.';
    if (!this.helpCache.has(str1)) {
      this.testoHelp = strDefault;
      return;
    }
    const cached = this.helpCache.get(str1);
    if (cached.message) {
      this.testoHelp = cached.message;
      return;
    }
    this.utilitiesService.getMessage(cached.code).then(msg => {
      if (msg) {
        cached.message = msg;
        this.testoHelp = cached.message;
      } else {
        this.testoHelp = strDefault;
      }
    });
  }

  private setDatiUtente() {
    this.descrizioneUtente = this.spidUserService.getName();
    this.hasUtente = !!this.spidUserService.getUser();
  }

  onAccediLink() {
    this.securityService.jumpToURL('/accesso-spid-landing', TypeApplicationCard.Fascicolo);
  }

}
