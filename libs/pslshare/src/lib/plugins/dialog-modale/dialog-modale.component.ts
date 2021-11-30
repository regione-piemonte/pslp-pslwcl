import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogModaleMessage, TypeDialogMessage } from '@pslwcl/pslmodel';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'pslshare-dialog-modale',
  templateUrl: './dialog-modale.component.html'
})

/**
 *  Componente che consente di visualizzare
 *  una finestra modale
 *
 *  con possibilità di indicare se si vogliono pulsanti SI/NO
 *     ANNULLA/CONFERMA   o solo CONFERMA
 * in base a cosa valorizzato in
 *  @input fromParent: DialogModaleMessage
 */
export class DialogModaleComponent implements OnInit {

  @Input() fromParent: DialogModaleMessage;
  testoBottoneAnnulla = 'No';
  testoBottoneConferma = 'Si';
  annullaPresente = true;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
    if (this.fromParent.tipo === TypeDialogMessage.Annulla) {
      this.testoBottoneConferma = 'ANNULLA';
    }

    if (this.fromParent.tipo === TypeDialogMessage.CancelOrConfirm || this.fromParent.tipo === TypeDialogMessage.Confirm) {
      this.testoBottoneAnnulla = 'ANNULLA';
      this.testoBottoneConferma = 'CONFERMA';
    }
    this.annullaPresente = this.fromParent.tipo === TypeDialogMessage.CancelOrConfirm
      || this.fromParent.tipo === TypeDialogMessage.YesOrNo;
    if (isNullOrUndefined(this.fromParent.messaggio)) {
      this.fromParent.messaggio = 'Sei sicuro di voler uscire?';
    }
    if (isNullOrUndefined(this.fromParent.messaggioAggiuntivo)) {
      this.fromParent.messaggioAggiuntivo = 'I dati modificati dall\'ultimo salvataggio andranno perduti.';
    }
  }

  /**
   * Closes modal
   *
   */
  closeModal(sendData) {
    this.activeModal.close(sendData);
  }

}
