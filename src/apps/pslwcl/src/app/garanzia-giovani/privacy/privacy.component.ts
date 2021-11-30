import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { AppUserService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { CommonPslpService } from '@pslwcl/pslservice';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html'
})
export class PrivacyComponent implements OnInit, OnDestroy {
  @Output() loaded = new EventEmitter();
  checkInformativaPrivacy: boolean;
  private readonly subscriptions = [] as Array<Subscription>;

  privacyTestata: string;
  privacyDettaglio: string;
  messaggioGenerale: string;

  constructor(
    private readonly appUserService: AppUserService,
    private readonly utilitiesService: UtilitiesService,
    private readonly commonPslpService: CommonPslpService
  ) { }

  async ngOnInit() {
    this.checkInformativaPrivacy = this.appUserService.getPrivacy(this.commonPslpService.AMBITO);
    const [messaggioGenerale, privacyTestata, privacyDettaglio] = await Promise.all([
      this.utilitiesService.getMessage('PGEN1'),
      this.utilitiesService.getMessage('PLAV1'),
      this.utilitiesService.getMessage('PLAV2')
    ]);
    this.messaggioGenerale = messaggioGenerale;
    this.privacyTestata = privacyTestata;
    this.privacyDettaglio = privacyDettaglio;
    this.loaded.emit();
  }

  /**
   * Determines whether check informativa privacy on
   */
  onCheckInformativaPrivacy() {
    this.checkInformativaPrivacy = !this.checkInformativaPrivacy;
    this.appUserService.setPrivacy(this.commonPslpService.AMBITO, this.checkInformativaPrivacy);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
