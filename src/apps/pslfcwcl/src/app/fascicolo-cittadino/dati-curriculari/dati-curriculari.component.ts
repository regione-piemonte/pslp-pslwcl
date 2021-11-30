import { AfterContentChecked, ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { BusinessService, ElenchiDecodifiche, Provincia, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PslshareService } from '@pslwcl/pslshare';
import { DialogModaleMessage, NavigationEmitter, SezioniSAP, TypeDialogMessage, TypeExit } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { CommonPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { map } from 'rxjs/operators';


export interface DatiComponenteCurriculare {
  numeroRecordOrigine?: number;
  numeroRecordInseriti?: number;
  numeroRecordAggiornati?: number;
  numeroRecordEliminati?: number;
}

@Component({
  selector: 'pslfcwcl-dati-curriculari',
  templateUrl: './dati-curriculari.component.html',
  styleUrls: ['./dati-curriculari.component.css']
})
export class DatiCurriculariComponent implements OnInit, OnChanges, AfterContentChecked {

  readOnly: boolean;
  readOnlyDomicilio: boolean;
  dataChanged = false;
  flagChanging = false;
  sap: SchedaAnagraficoProfessionale;
  nextButtonName: string;
  prevButtonName: string;
  abilitazioniChanging = false;
  istruzioniChanging = false;
  formazioneProfessChanging = false;
  lingueChanging = false;
  conoscenzeChanging = false;
  patentiChanging = false;

  elenchiDecodifiche: ElenchiDecodifiche;
  listaProvince: Provincia[] = [];

  titoloPagina = "Dati curriculari";
  // verificare come gestire gli enum come chiave
  datiCurriculari: any = {};

  private readonly mapSezioniSapUsate: SezioniSAP[] = [];
  urlUscita: string;

  constructor(
    private readonly router: Router,
    private readonly commonFCService: CommonPslpService,
    private readonly utilitiesService: UtilitiesService,
    private readonly storageService: SessionStorageService,
    private readonly businessService: BusinessService,
    private readonly pslbasepageService: PslshareService,
    private readonly changeDedectionRef: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.nextButtonName = 'PROSEGUI';
    this.prevButtonName = 'INDIETRO';
    this.readOnly = this.commonFCService.readOnly || this.commonFCService.readOnlyDomicilio;
    this.readOnlyDomicilio = this.commonFCService.readOnlyDomicilio;
    const [sap, elenchiDecodifiche, listaProvince, msgCambioDomicilio] = await Promise.all([
      this.commonFCService.getSap$(),
      this.storageService.getCachedValue('ELENCHI_DECODIFICHE', () => this.businessService.findElenchiDecodificheSap().toPromise()),
      this.storageService.getCachedValue('PROVINCE', () =>
        this.businessService.getProvince().pipe(map((values: Provincia[]) => {
          values.sort(this.sortDescrizione);
          return values;
        })).toPromise()),
      this.utilitiesService.getMessage('ME085'),
    ]);

    this.sap = sap;
    this.elenchiDecodifiche = elenchiDecodifiche;
    this.listaProvince = listaProvince;
    this.utilitiesService.hideSpinner();
    if (this.readOnlyDomicilio) {
      this.utilitiesService.showToastrInfoMessage(msgCambioDomicilio);
    }
    this.commonFCService.restoreStorageFascicolo();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.sap.isFirstChange()) {
      return;
    }
    this.sanifySap();
  }

  private sanifySap() {
  }

  private sortDescrizione(a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  }

  onSapChange(value: SchedaAnagraficoProfessionale, sezioneSAP: SezioniSAP) {
    const areEquals = false;
    this.sap = value;
    if (!areEquals) {
      this.onDataChange(true, sezioneSAP);
    }
  }

  onDataChange(value: boolean, sezioneSAP: SezioniSAP) {
    this.dataChanged = value;
    this.nextButtonName = this.commonFCService.wizard === false ? 'CONFERMA' : 'CONFERMA & PROSEGUI';
    if (this.mapSezioniSapUsate.indexOf(sezioneSAP) === -1) {
      this.mapSezioniSapUsate.push(sezioneSAP);
    }
  }

  onFlagChanging(value: boolean) {
    this.flagChanging = value;
  }

  abilitazioniEditState(value: boolean) {
    this.abilitazioniChanging = value;
  }

  istruzioneEditState(value: boolean) {
    this.istruzioniChanging = value;
  }

  formazioneProfessEditState(value: boolean) {
    this.formazioneProfessChanging = value;
  }

  lingueEditState(value: boolean) {
    this.lingueChanging = value;
  }

  conoscenzeEditState(value: boolean) {
    this.conoscenzeChanging = value;
  }

  patentiEditState(value: boolean) {
    this.patentiChanging = value;
  }

  onDatiComponenteCurriculareChange(datiComponenteCurriculare: DatiComponenteCurriculare, sezioneSAP: string) {
    this.datiCurriculari[sezioneSAP] = datiComponenteCurriculare;
  }

  onExitPage(nav: NavigationEmitter) {
    try {
      if (this.dataChanged && (nav.exit === TypeExit.Back
        || nav.exit === TypeExit.Prev
        || nav.exit === TypeExit.Wizard)) {
        this.urlUscita = nav.url;
        this.openModal();
      } else {
        if (nav.exit === TypeExit.Next || nav.exit === TypeExit.Save) {

          if (!this.readOnly && this.dataChanged) {
            this.utilitiesService.showSpinner();
            this.commonFCService.setSapStorage(this.sap);
            this.commonFCService.setSapSezioniUpdate(...this.mapSezioniSapUsate);
            this.commonFCService.backupStorageFascicolo();
            // Salvataggio solo al termine dell'esecuzione
          }
        }
        this.router.navigateByUrl(nav.url);
      }
    } catch (e) {
      this.utilitiesService.showToastrErrorMessage(e.message, 'dati curriculari');
    }
  }

  async openModal() {


    const data: DialogModaleMessage = {
      titolo: 'Uscita ' + this.titoloPagina,
      tipo: TypeDialogMessage.YesOrNo
    };
    const result = await this.pslbasepageService.richiestaFinestraModale(data);

    if (result === 'SI') {
      this.doUscita();
    }



  }

  doUscita() {
    if (this.urlUscita.startsWith('/fascicolo-')) {
      this.commonFCService.restoreStorageFascicolo();
    } else {
      this.commonFCService.azzeraStorageFascicolo();
    }
    this.router.navigateByUrl(this.urlUscita);
  }

  isValidData(): boolean {
    const valido = !this.flagChanging
      && this.sap
      && (this.commonFCService.wizard || this.dataChanged)
      && this.abilitazioniChanging
      && this.istruzioniChanging
      && this.formazioneProfessChanging
      && this.lingueChanging
      && this.conoscenzeChanging
      && this.patentiChanging
      ;
    return valido;
  }

  panelIstruzione(): boolean {
    return this.istruzioniChanging;
  }
  panelCorsi(): boolean {
    return this.formazioneProfessChanging;
  }
  panelLingue(): boolean {
    return this.lingueChanging;
  }
  panelConoscenze(): boolean {
    return this.conoscenzeChanging;
  }
  panelAlbi(): boolean {
    return this.abilitazioniChanging;
  }
  panelPatentini(): boolean {
    return this.patentiChanging;
  }

  ngAfterContentChecked(): void {
    this.changeDedectionRef.detectChanges();
  }
}
