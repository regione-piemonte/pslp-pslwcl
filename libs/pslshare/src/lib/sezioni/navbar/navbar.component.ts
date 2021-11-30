import { Component, Inject, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { BaseCard, DialogModaleMessage, TypeApplicationCard, TypeDialogMessage, VersionData } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { APP_VERSION, ConfigService, LogService, SecurityPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';
import { HelpMessage } from '../../help-message';
import { PslshareService } from '../../pslshare.service';

/**
 * Component per valorizzazione
 *    menu barra laterale
 */
@Component({
  selector: 'pslshare-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly subscriptions = [] as Array<Subscription>;

  @Input() helpCache: Map<string, HelpMessage>;
  @Input() subheaderContent = '';

  descrizioneUtente: string;
  testoVers: string;
  testoHelp: string;

  hasUtente: boolean;

  urlUscita: string;
  elencoCard: BaseCard[];

  constructor(
    private readonly router: Router,
    private readonly pslbasepageService: PslshareService,
    private readonly logService: LogService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly utiliesService: UtilitiesService,
    @Optional() @Inject(APP_VERSION) public appVersion: VersionData,
    private readonly securityService: SecurityPslpService
  ) {}

  async ngOnInit() {
    this.elencoCard = await this.utiliesService.getMenu('0');
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  onHome() {
    const thisPath = window.location.href;

   this.urlUscita = '/home';
      if (thisPath.indexOf('/riepilogo') < 0) {
        this.openModal();
   } else {
      this.doUscita();
   }
  }

  async openModal() {
    const data: DialogModaleMessage = {
      titolo : 'Torna alla Home Page',
      tipo:  TypeDialogMessage.YesOrNo,
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
    if (ConfigService ||  isNullOrUndefined(ConfigService.getSSOLogoutURL())) {
      this.securityService.jumpToURL('/', TypeApplicationCard.Home);
    } else {
      window.location.href = ConfigService.getSSOLogoutURL();
    }
  }
}
