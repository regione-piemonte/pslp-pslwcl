
import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogModaleMessage, TypeDialogMessage } from '@pslwcl/pslmodel';  // NOSONAR evita falso positivo rule typescript:S4328
import { DialogModaleComponent } from './plugins/dialog-modale/dialog-modale.component';
@Injectable({
  providedIn: 'root'
})
export class PslshareService {

  constructor(
    private modalService: NgbModal
  ) { }

  public openModal(data: DialogModaleMessage): Promise<any> {
    const modalRef = this.modalService.open(DialogModaleComponent, {
      keyboard: false,
      backdrop: 'static'
    });
    modalRef.componentInstance.fromParent = data;
    return modalRef.result;
  }

  public richiestaFinestraModale(data: DialogModaleMessage): Promise<any> {
    return this.openModal(data);
  }

  apriModale(messaggio: string, messaggioAggiuntivo: string, titoloPagina: string, tipo: TypeDialogMessage) {
    const data: DialogModaleMessage = {
      titolo: titoloPagina,
      tipo: tipo,
      messaggio: messaggio,
      messaggioAggiuntivo: messaggioAggiuntivo
    };
    return this.richiestaFinestraModale(data);
  }


}
