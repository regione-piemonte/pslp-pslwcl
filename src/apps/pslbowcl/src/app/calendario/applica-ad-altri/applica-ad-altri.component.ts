import { Component, OnInit } from '@angular/core';
import { ConfigurazioneCalendarioHeader, GestoreService, ParametriDatoCalendari, ParametriEccezioneCalendari, ParametriRicercaCalendari } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { CampoApplicabileAdAltriCalendari } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { OperatoreService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

/*
    -------------------------
    applica   eccezioni
    ad altri calendari
    -------------------------
*/
declare const $: any;

@Component({
  selector: 'pslbowcl-applica-ad-altri',
  templateUrl: './applica-ad-altri.component.html'
})
export class ApplicaAdAltriComponent implements OnInit {
  campoDaApplicare: CampoApplicabileAdAltriCalendari;
  calendari: ConfigurazioneCalendarioHeader[];
  calendariScelti: ConfigurazioneCalendarioHeader[] = [];
  allSelectedCalendari: boolean;
  larghezzaCampo: string;
  constructor(
    private readonly operatoreService: OperatoreService,
    private readonly utilitiesService: UtilitiesService,
    private readonly gestoreService: GestoreService
  ) { }

  ngOnInit() {

  }

  async show() {
    this.calendariScelti = [];
    const nome = "&nbsp;" + this.campoDaApplicare.nomeCampo;
    this.campoDaApplicare.nomeCampo = nome;
    this.larghezzaCampo = this.setWidthValore();
    this.allSelectedCalendari = false;
    this.utilitiesService.showSpinner();
    const operatore = this.operatoreService.getOperatoreByRuolo();
    const parametriRicercaCalendari: ParametriRicercaCalendari = {
      cod_ambito: this.campoDaApplicare.cod_ambito,
      cod_tipo_utente: operatore.codice_tipo_utente,
      calendario_eliminato: false,
      id_eccezione_applicabile: this.campoDaApplicare.idEccezione,
    };

    const [calendariElenco] = await Promise.all([
      this.gestoreService.findCalendari(operatore.id_utente, parametriRicercaCalendari).toPromise()
    ]);
    this.calendari = calendariElenco.filter(el => el.id_calendario !== this.campoDaApplicare.idCalendario);
    this.utilitiesService.hideSpinner();
    $('#modal_applica').modal({ backdrop: 'static', keyboard: false });
  }

  onChangeCheckCalendari(index: number) {
    const calendario = this.calendari[index];
    if (this.calendariScelti.some(el => el === calendario)) {
      this.allSelectedCalendari = false;
      this.calendariScelti = this.calendariScelti.filter(el => el !== calendario);
    } else {
      this.calendariScelti = [...this.calendariScelti, calendario];
      this.allSelectedCalendari = this.calendariScelti.length === this.calendari.length;
    }

  }

  isCheckedCalendari(index: number): boolean {
    return this.calendariScelti.some(c => c === this.calendari[index]);
  }

  onSelezioneAllCalendari(): void {

    if (this.allSelectedCalendari) {
      this.calendariScelti = [];
    } else {
      this.calendariScelti = [...this.calendari];
    }
    this.allSelectedCalendari = !this.allSelectedCalendari;
  }
  noOneChecked(): boolean {
    if (this.calendariScelti.length === 0) {
      return true;
    } else {
      return false;
    }
  }
  showAgain() {
  }

  chiediApplica() {
    $('#modal_conferma').modal({ backdrop: 'static', keyboard: false });
  }

  doApplica() {
    $('#modal_applica').modal('hide');
    this.utilitiesService.showSpinner();
    if (this.calendariScelti.length > 0) {
      this.eseguiApplica();
    }
    this.utilitiesService.hideSpinner();
  }

  async eseguiApplica() {
    try {
      const op = this.operatoreService.getOperatoreByRuolo();
      const idCal: Array<number> = (this.calendariScelti.map(it => it.id_calendario));
      const idUtente = op.id_utente;
      if (this.campoDaApplicare.codiceCampo !== "eccezione") {

        const parmDatoCalendari: ParametriDatoCalendari = {
          id_calendari: idCal,
          campo: this.campoDaApplicare.codiceCampo,
          valore: this.impostaValore(),
        };
        await this.gestoreService.applicaDatoACalendari(idUtente, parmDatoCalendari).toPromise();
      } else {
        const parmEccCalendari: ParametriEccezioneCalendari = {
          id_calendari: idCal,
          id_eccezione: this.campoDaApplicare.idEccezione,
        };
        await this.gestoreService.applicaEccezioneACalendari(idUtente, parmEccCalendari).toPromise();
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'Applica ad altri calendari');
    }
  }

  getValore(index: number) {
    let valore = "";
    const calendario = this.calendari[index];
    switch (this.campoDaApplicare.codiceCampo) {
      case "visibile_in_base":
        valore = calendario.visibile_in_base;
        break;
      case "ore_limite_spostamento":
        valore = calendario.ore_limite_spostamento > 0 ?
          "SI entro ore: " + calendario.ore_limite_spostamento :
          "NO";
        break;
      case "messaggio_spostamento_appuntamento":
        valore = calendario.messaggio_spostamento_appuntamento;
        break;
      case "messaggio_annullamento_appuntamento":
        valore = calendario.messaggio_annullamento_appuntamento;
        break;
      case "annulla_garanzia_giovani":
        valore = calendario.annulla_garanzia_giovani ? "SI" : "NO";
        break;
    }
    return valore;

  }

  impostaValore() {
    let valore = "";
    switch (this.campoDaApplicare.codiceCampo) {
      case "visibile_in_base":
        valore = this.campoDaApplicare.valore;
        break;
      case "ore_limite_spostamento":
        valore = "" + this.campoDaApplicare.valoreNum;
        break;
      case "messaggio_spostamento_appuntamento":
        valore = this.campoDaApplicare.valore;
        break;
      case "messaggio_annullamento_appuntamento":
        valore = this.campoDaApplicare.valore;
        break;
      case "annulla_garanzia_giovani":
        valore = this.campoDaApplicare.valoreLogico ? "S" : "N";
        break;
    }
    return valore;

  }

  setWidthValore() {
    // valore di default per  "visibile_in_base" e "ore_limite_spostamento":
    let valore = "20";
    switch (this.campoDaApplicare.codiceCampo) {
      case "messaggio_spostamento_appuntamento":
        valore = "30";
        break;
      case "messaggio_annullamento_appuntamento":
        valore = "30";
        break;
      case "annulla_garanzia_giovani":
        valore = "10";
        break;
    }
    return 'style="vertical-align:middle;width:' + valore + '%"';
  }
}
