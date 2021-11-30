import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AppUserService, CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'pslfcwcl-privacy-template',
  templateUrl: './privacy-template.component.html'
})
export class PrivacyTemplateComponent implements OnInit, OnDestroy {
  @Output() loaded = new EventEmitter();
  @Output() privacyDefinita = new EventEmitter<boolean>();
  @Input() isReady: boolean;

  checkInformativaPrivacy: boolean;
  private readonly subscriptions = [] as Array<Subscription>;

  privacyTestata = "";
  privacyDettaglio = "";
  messaggioGenerale = "";
  elencoDettaglioTestoPrivacy: string[];

  constructor(
    private readonly appUserService: AppUserService,
    private readonly utilitiesService: UtilitiesService,
    private readonly commonFCService: CommonPslpService
  ) { }

  async ngOnInit() {
    if (!isNullOrUndefined(this.commonFCService.getAmbitoPrivacy)) {
      this.commonFCService.AMBITO = this.commonFCService.getAmbitoPrivacy();
    }
    this.checkInformativaPrivacy = this.isReady;
    this.privacyDefinita.emit(this.checkInformativaPrivacy);
    this.elencoDettaglioTestoPrivacy = this.commonFCService.getDettaglioTestoPrivacy();
    if (this.elencoDettaglioTestoPrivacy.length === 3) {
      this.messaggioGenerale = await this.utilitiesService.getMessage(this.elencoDettaglioTestoPrivacy[0]);
      this.privacyTestata = await this.utilitiesService.getMessage(this.elencoDettaglioTestoPrivacy[1]);
      this.privacyDettaglio = await this.utilitiesService.getMessage(this.elencoDettaglioTestoPrivacy[2]);
    } else if (this.elencoDettaglioTestoPrivacy.length === 1) {
      this.privacyTestata = await this.utilitiesService.getMessage(this.elencoDettaglioTestoPrivacy[0]);
    }
    this.loaded.emit();
  }

  onCheckInformativaPrivacy() {
    this.checkInformativaPrivacy = !this.checkInformativaPrivacy;
    this.appUserService.setPrivacy(this.commonFCService.AMBITO, this.checkInformativaPrivacy);
    this.privacyDefinita.emit(this.checkInformativaPrivacy);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
