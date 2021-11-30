import { Component, OnInit } from "@angular/core";
import { EsitoRiepilogoCollocamentoMirato } from "@pslwcl/pslapi";
import { AppUserService, CommonPslpService, UtilitiesService } from "@pslwcl/pslservice";
import moment from "moment";
import { isNullOrUndefined } from "util";

const DD_MM_YYYY = 'DD/MM/YYYY';


@Component({
  selector: 'pslshare-dati-iscrizioni',
  templateUrl: './dati-iscrizioni.component.html'
})
export class DatiIscrizioniComponent<T> implements OnInit {
  ISCRIZIONE_ALTRE_CATEGORIE = "ISCRIZIONE CATEGORIE PROTETTE in PIEMONTE";
  ISCRIZIONE_DISABILI = 'ISCRIZIONE DISABILI in PIEMONTE';

  redditoDescrizione: string;
  familiariDescrizione: string;

  categoriaIscrizione: string;
  categoriaIscrizioneDisabili = "";
  iscrizioneDisabiliStatoFinale: string;
  dataIscrizioneDisabili: string;
  dataIscrizioneCategorieProtette: string;
  iscrizioneAltreCategorieStatoFinale: string;
  cpiIscrizioneCategorieProtette: string;
  provinciaIscrizioneCategorieProtette: string;
  provinciaIscrizioneDisabili: string;
  cpiIscrizioneDisabili: string;
  categoriaIscrizioneAltre: string;
  isIscritto: boolean;
  riepilogoCOMI: EsitoRiepilogoCollocamentoMirato;
  msgNessunaIscrizione = "";


  constructor(
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService
  ) { }

  async ngOnInit() {

    const [
      msgNessunaIscrizione
    ] =
      await Promise.all([
        this.utilitiesService.getMessage('HC069')
      ]);
    this.msgNessunaIscrizione = msgNessunaIscrizione;

     const idUtente = this.appUserService.getIdUtente();
    // riepilogo dati delle iscrizioni
    const riepilogoCOMI = await this.commonPslpService.getCollocamentoMirato(idUtente);
    this.riepilogoCOMI = riepilogoCOMI;
    this.isIscritto = this.commonPslpService.isIscritto(this.riepilogoCOMI);

    this.setIscrizioneDisabiliStatoFinale(this.riepilogoCOMI);
    this.setIscrizioneAltreCategorieStatoFinale(this.riepilogoCOMI);

    this.setRedditoDescrizione(this.riepilogoCOMI);
    this.setFamiliariDescrizione(this.riepilogoCOMI);

  }

  /**
 * Sets reddito descrizione
 * @param riepilogoCOMI EsitoRiepilogoCollocamentoMirato
 */
  private setRedditoDescrizione(riepilogoCOMI: EsitoRiepilogoCollocamentoMirato) {
    if (isNullOrUndefined(riepilogoCOMI.redditi) || riepilogoCOMI.redditi.length === 0) {
      this.redditoDescrizione = 'Non presente';
    } else {
      if (!isNullOrUndefined(riepilogoCOMI.redditi[0]) &&
        !isNullOrUndefined(riepilogoCOMI.redditi[0].anno)) {
        this.redditoDescrizione = 'Ultimo Anno ' + riepilogoCOMI.redditi[0].anno;
      }
    }
  }


  /**
   * Sets familiari descrizione
   * @param riepilogoCOMI EsitoRiepilogoCollocamentoMirato
   */
  private setFamiliariDescrizione(riepilogoCOMI: EsitoRiepilogoCollocamentoMirato) {
    if (isNullOrUndefined(riepilogoCOMI.dettaglioCompletoDichiarazioneFamiliariACarico)
      || riepilogoCOMI.dettaglioCompletoDichiarazioneFamiliariACarico.length === 0) {
      this.familiariDescrizione = 'Non presente';
    } else {
      if (!isNullOrUndefined(riepilogoCOMI.dettaglioCompletoDichiarazioneFamiliariACarico[0]) &&
        !isNullOrUndefined(riepilogoCOMI.dettaglioCompletoDichiarazioneFamiliariACarico[0].anno_validita)) {
        this.familiariDescrizione = 'Ultimo Anno ' + riepilogoCOMI.dettaglioCompletoDichiarazioneFamiliariACarico[0].anno_validita;
      }
    }
  }
 /**
   * Sets iscrizione altre categorie stato finale
   * @param riepilogoCOMI EsitoRiepilogoCollocamentoMirato
   */
  private setIscrizioneAltreCategorieStatoFinale(riepilogoCOMI: EsitoRiepilogoCollocamentoMirato) {
    if (!isNullOrUndefined(riepilogoCOMI.iscrizioneAltreCategorie)) {
      this.dataIscrizioneCategorieProtette = moment(riepilogoCOMI.iscrizioneAltreCategorie.dataIscrizione).format(DD_MM_YYYY);
      if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneAltreCategorie.cpi.descrizione)) {
        this.cpiIscrizioneCategorieProtette = this.riepilogoCOMI.iscrizioneAltreCategorie.cpi.descrizione;
      } else {
        this.cpiIscrizioneCategorieProtette = "Dato non disponibile";
      }
      this.provinciaIscrizioneCategorieProtette = this.riepilogoCOMI.iscrizioneAltreCategorie.provincia.descrizione;
      this.categoriaIscrizioneAltre =
        !isNullOrUndefined(riepilogoCOMI.iscrizioneAltreCategorie.categoria) ?
          riepilogoCOMI.iscrizioneAltreCategorie.categoria : '';
      this.categoriaIscrizioneAltre +=
        !isNullOrUndefined(riepilogoCOMI.iscrizioneAltreCategorie.gradoInvalidita) ?
          ' (Categoria ' + riepilogoCOMI.iscrizioneAltreCategorie.gradoInvalidita + ') ' : '';
      if (riepilogoCOMI.iscrizioneAltreCategorie.statoFinale) {
        this.iscrizioneAltreCategorieStatoFinale = "CHIUSA";
      } else {
        this.iscrizioneAltreCategorieStatoFinale = "ATTIVA";
      }
    }
  }

  /**
   * Sets iscrizione disabili stato finale
   * @param riepilogoCOMI EsitoRiepilogoCollocamentoMirato
   */
  private setIscrizioneDisabiliStatoFinale(riepilogoCOMI: EsitoRiepilogoCollocamentoMirato) {
    if (!isNullOrUndefined(riepilogoCOMI.iscrizioneDisabili)) {
      this.dataIscrizioneDisabili = moment(riepilogoCOMI.iscrizioneDisabili.dataIscrizione).format(DD_MM_YYYY);
      if (!isNullOrUndefined(this.riepilogoCOMI.iscrizioneDisabili.cpi.descrizione)) {
        this.cpiIscrizioneDisabili = this.riepilogoCOMI.iscrizioneDisabili.cpi.descrizione;
      } else {
        this.cpiIscrizioneDisabili = 'Dato non disponibile';
      }

      this.provinciaIscrizioneDisabili = this.riepilogoCOMI.iscrizioneDisabili.provincia.descrizione;

      this.categoriaIscrizioneDisabili = !isNullOrUndefined(riepilogoCOMI.iscrizioneDisabili.categoria) ? riepilogoCOMI.iscrizioneDisabili.categoria : '';
      this.categoriaIscrizioneDisabili +=
        !isNullOrUndefined(riepilogoCOMI.iscrizioneDisabili.gradoInvalidita) ?
          ' (Categoria ' + riepilogoCOMI.iscrizioneDisabili.gradoInvalidita + ') ' : '';
      if (riepilogoCOMI.iscrizioneDisabili.statoFinale) {
        this.iscrizioneDisabiliStatoFinale = "CHIUSA";
      } else {
        this.iscrizioneDisabiliStatoFinale = "ATTIVA";
      }
    }
  }


}
