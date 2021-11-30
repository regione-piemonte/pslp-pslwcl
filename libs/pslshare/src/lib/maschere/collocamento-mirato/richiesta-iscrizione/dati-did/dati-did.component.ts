import { Component, Input, OnInit } from '@angular/core';
import { DatiInputAggiornamentoDid, EsitoDettaglioDid } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, StatoDid } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import moment from 'moment';
import { isNullOrUndefined } from 'util';

const DD_MM_YYYY = 'DD/MM/YYYY';

@Component({
  selector: 'pslshare-dati-did',
  templateUrl: './dati-did.component.html'
})
export class DatiDIDComponent implements OnInit {
  @Input() idUtente: number;
  loadingData: boolean;
  loaded: boolean;
  message: string;
  textStatoDid: string;
  descrUltimoStato: string;
  msgStatoDid: string;
  msgStatoInvio: string;
  did: EsitoDettaglioDid;
  dataDid = "";
  dataStatoDid = "";
  terminata = "";
  enteTitolaritaDescrizione = "";

  constructor(
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService
  ) {
    this.loaded = false;
  }

  /**
   * on init
   *
   */
  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.commonPslpService.setAmbitoPrivacy(Ambito.COMI);

    if (this.loaded === true) {
      this.utilitiesService.hideSpinner();
      return;
    }
    this.loadingData = true;

    this.did = await this.commonPslpService.ricercaDettaglioDIDService(this.idUtente);

    if (this.isDidPresenteSenzaErrori()) {
      this.setEnteTitolaritaDescrizione();
      const didControlloConv: DatiInputAggiornamentoDid = {};
      didControlloConv.data_did = this.did.data_did;
      didControlloConv.data_stato_did = new Date();
      didControlloConv.id_did = this.did.id_did;
      didControlloConv.cod_stato_did = 'C';

      this.setVarieDid();

      this.setTerminata();

      if (this.did.flg_rifiuto === 'S') {
        // DID RESPINTA
        this.terminata = " - Terminata";
        this.msgStatoDid = !isNullOrUndefined(this.did.motivo_rifiuto) ? this.did.motivo_rifiuto : await this.utilitiesService.getMessage('MI040');
        if (!isNullOrUndefined(this.did.data_did_respinta)) {
          this.dataStatoDid = moment(this.did.data_did_respinta).format(DD_MM_YYYY);
        }
        this.textStatoDid = 'bg-danger text-white';
      } else if (this.did.flg_attesa_invio === 'S') {
        /** se il flag è 'N' significa che è stata "Da inviare" */
        this.textStatoDid = StatoDid.getColoreByCodice(this.did.cod_ultimo_stato);
        this.msgStatoInvio = await this.utilitiesService.getMessage('MI037');
      } else {
        /** se il flag è 'S' significa che è stata inviata correttamente */
        this.textStatoDid = StatoDid.getColoreByCodice(this.did.cod_ultimo_stato);
        this.msgStatoInvio = 'Inviata';
      }
    }
    this.loadingData = false;
    this.loaded = true;
    this.utilitiesService.hideSpinner();

  }
  /**
   * SETTA VARI CAMPI DELLA DID
   */
  private setVarieDid() {
    if (!isNullOrUndefined(this.did.data_did)) {
      this.dataDid = moment(this.did.data_did).format(DD_MM_YYYY);
    }
    if (!isNullOrUndefined(this.did.data_stato)) {
      this.dataStatoDid = moment(this.did.data_stato).format(DD_MM_YYYY);
    }
    if (!isNullOrUndefined(this.did.cod_ultimo_stato)) {
      this.descrUltimoStato = StatoDid.getDescrizioneByCodice(this.did.cod_ultimo_stato);
    }
  }

  /**
   * DETERMINA SE LO STATO DELLA DID E' TERMINATO O IN CORSO
   */
  private setTerminata() {
    if (this.did.flg_stato_finale === 'S') {
      this.terminata = " - Terminata";
    } else {
      this.terminata = " - In corso";
    }
  }

  /**
   * DETERMINA SE LA DID EVENTUALMENTE PRESENTE SIA SENZA ERRORI
   * @returns boolean
   */
  private isDidPresenteSenzaErrori() {
    return this.isDIDPresente() && !isNullOrUndefined(this.did) && isNullOrUndefined(this.did.errore_ricerca_did);
  }

  /**
   * DETERMINA SE E' PRESENTE O NO UNA DID PER L'UTENTE COLLEGATO
   * @returns boolean
   */
  isDIDPresente() {
    if (isNullOrUndefined(this.did)) {
      this.did = null;
      return false;
    } else if (isNullOrUndefined(this.did.errore_ricerca_did) && isNullOrUndefined(this.did.error)) {
      return true;
    }
  }

  /**
   * Sets ente titolarita descrizione
   */
   private setEnteTitolaritaDescrizione() {
    if (!isNullOrUndefined(this.did.ente_titolarita) && this.did.ente_titolarita.indexOf('-') >= 0) {
      this.enteTitolaritaDescrizione = this.did.ente_titolarita.substring(0, this.did.ente_titolarita.indexOf('-'));
    } else {
      this.enteTitolaritaDescrizione = this.did.ente_titolarita;
    }
  }

}
