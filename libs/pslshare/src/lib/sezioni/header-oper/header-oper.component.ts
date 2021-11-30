import { Component, Inject, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { NavigationStart, Router, RouterEvent } from '@angular/router';
import { VersionData, TypeApplicationCard, TypeDialogMessage, DialogModaleMessage } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { APP_VERSION, ConfigService, LogService, SecurityPslpService, SessionStorageService, SpidUserService, UtilitiesService, ParametriSistemaService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { HelpMessage } from '../../help-message';
import { PslshareService } from '../../pslshare.service';
import { UserInfo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

declare var require: any;

/**
 * Componente  dedicato alla gestione dell'accesso
 *     alla parte dedicata all'operatore
 */
@Component({
  selector: 'pslshare-header-oper',
  templateUrl: './header-oper.component.html',
  styleUrls: ['./header-oper.component.css']
})
export class HeaderOperComponent implements OnInit, OnDestroy {
  private readonly subscriptions = [] as Array<Subscription>;
  private readonly userFarlocco: UserInfo;

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
    private readonly sessionStorageService: SessionStorageService,
    private readonly utiliesService: UtilitiesService,
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
      && thisPath.indexOf('/page-not-found') < 0
      && thisPath.indexOf('/error-page') < 0) {
      this.openModal();
    } else {
      this.doUscita();
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
      this.doUscita();
    }
  }

  doUscita() {
    this.securityService.jumpToURL(this.urlUscita, TypeApplicationCard.Home);
  }

  async onExit() {
    this.logService.log('uscita');
    await this.utiliesService.logout();
    this.sessionStorageService.clearStorage();
    this.spidUserService.setUser(this.userFarlocco);

    if (ConfigService || isNullOrUndefined(ConfigService.getSSOLogoutURL())) {
      this.securityService.jumpToURL('/', TypeApplicationCard.Home);
    } else {
      window.location.href = ConfigService.getSSOLogoutURL();
    }
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
    this.utiliesService.getMessage(cached.code).then(msg => {
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

  onGotoLink() {
    this.securityService.jumpToURL('/accesso-spid-landing', TypeApplicationCard.Fascicolo);
  }

}
