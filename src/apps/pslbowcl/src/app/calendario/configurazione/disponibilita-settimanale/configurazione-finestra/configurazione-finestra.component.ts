import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { ConfigurazioneCalendarioFascia } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { SliderConfiguration } from '@pslwcl/pslmodel';
import { UtilitiesService, Utils } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { Subscription } from 'rxjs';

import { DisponibilitaSettimanaleService } from '../disponibilita-settimanale.service';


/**
 * Component gestione finestra
 *  configurazione disponibilità settimanale
 */
@Component({
  selector: 'pslbowcl-configurazione-finestra',
  templateUrl: './configurazione-finestra.component.html',
  viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class ConfigurazioneFinestraComponent implements OnInit, OnDestroy {
  durateAppuntamento: number[] = [30, 60, 90, 120];
  min: number;

  @Input() fascia: ConfigurazioneCalendarioFascia;
  @Input() linkedFascia: ConfigurazioneCalendarioFascia;
  @Input() sliderConfigFascia: SliderConfiguration;
  @Input() index: number;

  private readonly subsciptions: Subscription[] = [];

  constructor(
    private readonly disponibilitaSettimanaleService: DisponibilitaSettimanaleService,
    private readonly utilitiesService: UtilitiesService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.computeMin();
    this.subsciptions.push(
      this.disponibilitaSettimanaleService.changedDatiFascia$.subscribe(f => this.onChangeExternalFascia(f))
    );
  }

  ngOnDestroy() {
    this.subsciptions.forEach(sub => sub.unsubscribe());
  }

  onChangeFascia(e: {from: number, to: number}) {
    this.fascia.ora_inizio = e.from;
    this.fascia.ora_fine = e.to;
    this.disponibilitaSettimanaleService.changeDatiFascia(this.fascia);
    this.changeDetectorRef.detectChanges();
  }

  async onChangeMaxAppuntamenti(valore: number) {
    if (valore < 1) {
      const msg = await this.utilitiesService.getMessage('ME070');
      return this.utilitiesService.showToastrErrorMessage(msg);
    }
  }

  toHourMinute(orario: number) {
    return Utils.toHourMinute(orario);
  }

  private onChangeExternalFascia(externalFascia: ConfigurazioneCalendarioFascia) {
    if (this.linkedFascia === externalFascia) {
      this.computeMin(externalFascia);
      this.fascia.ora_inizio = Math.max(this.min, this.fascia.ora_inizio);
      this.changeDetectorRef.detectChanges();
    }
  }

  private computeMin(externalFascia?: ConfigurazioneCalendarioFascia) {
    this.min = Math.max(...[
      this.sliderConfigFascia.from_min,
      this.sliderConfigFascia.min,
      externalFascia ? externalFascia.ora_fine : undefined
    ].filter(el => el !== undefined));
  }
}
