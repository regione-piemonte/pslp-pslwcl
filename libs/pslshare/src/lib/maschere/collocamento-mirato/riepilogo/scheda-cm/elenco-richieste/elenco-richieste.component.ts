import { Component, Input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { DettaglioRichiestaIscrizioneL68, EsitoRiepilogoCollocamentoMirato, RichiestaIscrizioneL68Header, SchedaAnagraficoProfessionale } from "@pslwcl/pslapi";
import { DialogModaleMessage, TypeDialogMessage } from "@pslwcl/pslmodel";
import { AppUserService, CommonPslpService, UtilitiesService } from "@pslwcl/pslservice";
import { isNullOrUndefined } from "util";
import { PslshareService } from "../../../../../pslshare.service";


@Component({
  selector: 'pslshare-elenco-richieste-cm',
  templateUrl: './elenco-richieste.component.html'
})
export class ElencoRichiesteComponent implements OnInit {
  @Input() sap: SchedaAnagraficoProfessionale;
  @Input() riepilogoCOMI: EsitoRiepilogoCollocamentoMirato;
  @Input() isIscritto: boolean;
  @Input() elencoRichieste: RichiestaIscrizioneL68Header[];
  titoloPagina = 'Collocamento Mirato';
   num: number;
   idUtente: number;
   isOperatore = false;
   msgME166: string;
   msgME167: string;
  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService,
    private readonly pslshareService: PslshareService,
    private readonly appUserService: AppUserService,
    private readonly utilitiesService: UtilitiesService) {
  }

  async ngOnInit() {
    this.msgME166 = await this.utilitiesService.getMessage('ME166');
    this.msgME167 = await this.utilitiesService.getMessage('ME167');
    const operatore = this.appUserService.getOperatore();
    if (!isNullOrUndefined(operatore)) {
      this.isOperatore = true;
    }
    this.idUtente = this.appUserService.getIdUtente();
     this.num = 0;
     if (!isNullOrUndefined(this.elencoRichieste)) {
         this.num = this.elencoRichieste.length;
     }
  }

  primaIscrizione(ric: RichiestaIscrizioneL68Header): string {
    if (ric.descr_tipo_comunicazione === "P" ) {
       return "Si";
    }
    return "No";
  }

  isModificabile(ric: RichiestaIscrizioneL68Header): boolean {
    if (ric.cod_stato_richiesta === "B") {
       return true;
    }
    return false;
  }

  isVisualizzabile(ric: RichiestaIscrizioneL68Header): boolean {
    return true;
  }

  isCancellabile(ric: RichiestaIscrizioneL68Header): boolean {
    if (ric.cod_stato_richiesta === "B") {
      return true;
   }
   return false;
  }

  async onVisualizza(ric: RichiestaIscrizioneL68Header) {
    this.utilitiesService.showSpinner();

    const richiestaIscrizione = await this.commonPslpService.getDettaglioIscrizioneL68$(this.idUtente, ric.id_richiesta);

    if (!isNullOrUndefined(richiestaIscrizione)) {
      this.commonPslpService.setRichiestaIscrizioneStorage(richiestaIscrizione);
    }

    this.utilitiesService.hideSpinner();
    this.router.navigateByUrl('/collocamento-mirato/visualizza-richiesta-iscrizione');
  }

  async onModifica(ric: RichiestaIscrizioneL68Header) {

    // richiesta iscrizione in bozza non modificabile se esiste una iscrizione attiva
    if (ric.cod_stato_richiesta === 'B'  && !ric.descr_tipo_comunicazione.startsWith('T') &&
        this.utilitiesService.isIscrizioneAttiva(this.riepilogoCOMI) )  {
        return this.pslshareService.apriModale(this.msgME166, "", this.titoloPagina, TypeDialogMessage.Confirm);
    }
    if (ric.cod_stato_richiesta === 'B' && ric.descr_tipo_comunicazione.startsWith('T') &&
        !this.utilitiesService.isIscrizioneAttiva(this.riepilogoCOMI) )  {

        return this.pslshareService.apriModale(this.msgME167, "", this.titoloPagina, TypeDialogMessage.Confirm);
    }
    this.utilitiesService.showSpinner();
    const richiestaIscrizione = await this.commonPslpService.getDettaglioIscrizioneL68$(this.idUtente, ric.id_richiesta);
    this.commonPslpService.readOnlyCM = false;
    if (!isNullOrUndefined(richiestaIscrizione)) {

        this.commonPslpService.wizard = true;
        this.commonPslpService.wizardDisabile = this.isDisabile(richiestaIscrizione);
        this.commonPslpService.setRichiestaIscrizioneStorage(richiestaIscrizione);
        this.commonPslpService.setSapAndIdUtenteStorage(this.sap, this.idUtente);
        this.commonPslpService.firstPage = "riepilogo";
        this.utilitiesService.hideSpinner();
        this.router.navigateByUrl('/collocamento-mirato/cittadino');
    }
    this.utilitiesService.hideSpinner();
  }


  isDisabile(richiestaIscrizioneCm: DettaglioRichiestaIscrizioneL68): boolean {
    if (!isNullOrUndefined(richiestaIscrizioneCm) && richiestaIscrizioneCm.cod_tipo_iscrizione === "D") {
       return true;
    }
    return false;
  }

  async onCancella(ric: RichiestaIscrizioneL68Header) {
    const data: DialogModaleMessage = {
      titolo: "Collocamento Mirato",
      tipo: TypeDialogMessage.CancelOrConfirm,
      messaggio: "Sei sicuro di voler procedere alla cancellazione ?",
      messaggioAggiuntivo: "Confermando, il dettaglio non verr&agrave; pi&ugrave; proposto nell'elenco Richieste."
    };
    const res = await this.pslshareService.richiestaFinestraModale(data);
    if (res === 'NO') {
      return;
    }

    this.utilitiesService.showSpinner();
    const utente = this.commonPslpService.getUtenteStorage();
    const header: RichiestaIscrizioneL68Header = {
      id_richiesta: ric.id_richiesta,
      id_anagrafica: ric.id_anagrafica,
      cod_stato_richiesta: ric.cod_stato_richiesta,
      data_stato: ric.data_stato,
    };
    const richiestaIscrizione: DettaglioRichiestaIscrizioneL68 = {
      richiesta_iscrizione_header: header,
       tipo_operazione: 'N',
       data_annullo: new Date(),

    };
    const esito = await this.commonPslpService.saveRichiestaIscrizione( utente.id_utente, richiestaIscrizione, '1');
    /*
    *  controllare esito
    */
    if (esito.esitoPositivo) {
      this.utilitiesService.hideSpinner();
      this.utilitiesService.showToastrInfoMessage('salvataggio effettuato', 'dati anagrafici');
      this.commonPslpService.setRichiestaIscrizioneStorage(null);

      this.router.navigateByUrl("/collocamento-mirato/inizio");
    } else {
      this.utilitiesService.hideSpinner();
      this.pslshareService.apriModale(esito.messaggioCittadino, "", this.titoloPagina, TypeDialogMessage.Confirm);
    }

  }
}
