import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppUserService, CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslfcwcl-privacy-fc',
  templateUrl: './privacy-fc.component.html'
})
export class PrivacyFCComponent implements OnInit, OnDestroy {
  @Output() loaded = new EventEmitter();
  @Input() isReady: boolean;

  checkInformativaPrivacy: boolean;
  private readonly subscriptions = [] as Array<Subscription>;

  privacyTestata: string;
  privacyDettaglio: string;
  messaggioGenerale: string;

  constructor(
    private readonly appUserService: AppUserService,
    private readonly utilitiesService: UtilitiesService,
    private readonly commonFCService: CommonPslpService
  ) { }

  async ngOnInit() {
    this.checkInformativaPrivacy = this.appUserService.getPrivacy(this.commonFCService.AMBITO);
    const [messaggioGenerale, privacyTestata, privacyDettaglio] = await Promise.all([
      this.utilitiesService.getMessage('FGEN1'),
      this.utilitiesService.getMessage('FLAV1'),
      this.utilitiesService.getMessage('FLAV2')
    ]);
    this.messaggioGenerale = messaggioGenerale;
    this.privacyTestata = privacyTestata;
    this.privacyDettaglio = privacyDettaglio;
    this.loaded.emit();
  }

  onCheckInformativaPrivacy() {
    this.checkInformativaPrivacy = !this.checkInformativaPrivacy;
    this.appUserService.setPrivacy(this.commonFCService.AMBITO, this.checkInformativaPrivacy);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}

/*
ngAfterViewInit() {
    if (this.utenteService.isPrivacy()) {
      setTimeout(() => this.accordion.collapse('ngbpanel1'), 0);
    } else {
      setTimeout(() => this.accordion.expand('ngbpanel1'), 0);
    }
  }
 */
