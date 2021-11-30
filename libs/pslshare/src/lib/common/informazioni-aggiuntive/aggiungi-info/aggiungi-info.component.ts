import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UtilitiesService, LogService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService } from '@pslwcl/pslservice';
import { InformazioneAggiuntiva } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslshare-aggiungi-info',
  templateUrl: './aggiungi-info.component.html',
  styles: ['.md-radio label { top: -6px }']
})
export class AggiungiInfoComponent implements OnInit {
  @Input() codice: number;
  @Input() descrizione: string;
  @Input() obbligatorio = false;
  @Output() success: EventEmitter<any> = new EventEmitter();
  @Output() annulla: EventEmitter<any> = new EventEmitter();

  @ViewChild('informazioneForm', { static: true }) form: NgForm;

  risposte = [
    {value: 'Si', id: (Math.random() * 10000)},
    {value: 'No', id: (Math.random() * 10000)}
  ];
  constructor(
    private readonly commonPslpService: CommonPslpService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  ngOnInit() {
  }

  /**
   * Determines whether submit on
   */
  async onSubmit() {
    const info: InformazioneAggiuntiva = {
      codice_configurazione: this.codice,
      valore: this.form.value.risposta,
      note: this.form.value.osservazioni,
      data: new  Date()
    };
    const ut = this.commonPslpService.getUtenteStorage();
    this.logService.log(ut);
    const updated = await this.commonPslpService.addInformazioneAggiuntivaExtend$(info);
    if (updated) {
      this.utilitiesService.showToastrInfoMessage('Informazione aggiunta correttamente.', 'Informazioni aggiuntive');
    } else {
      this.utilitiesService.showToastrErrorMessage('Informazione già presente.', 'Informazioni aggiuntive');
    }
    this.form.reset();
    this.success.emit();
  }
  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.form.reset();
    this.annulla.emit();
  }
}
