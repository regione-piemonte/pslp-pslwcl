import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import getDeepValue from 'get-deep-value';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { UtilitiesService, SessionStorageService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { BusinessService, Comune, Indirizzo, Nazione, Provincia, Sedime } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

@Component({
  selector: 'pslshare-indirizzo',
  templateUrl: './indirizzo.component.html',
  styleUrls: ['./indirizzo.component.css']
})
export class IndirizzoComponent implements OnInit, OnChanges {

  private static idSequence = 0;
  private static readonly ITALIA = {
    descrizione: 'ITALIA',
    codice_ministeriale: 'Z000'
  };

  @Input() name = 'Indirizzo';
  @Input() indirizzo: Indirizzo;
  @Input() mayUpdate = true;
  @Input() copiaDa: Indirizzo;
  @Input() copiaMsg: string;
  @Input() indirizzoRequired = true;
  @Input() capVisible = true;
  @Input() cpiVisible = false;
  @Input() nazioneVisibile = true;
  @Input() descCpi : string;
  @Input() edit: boolean = false;
  @Input() filtraProvincePiemonte: boolean = false;
  @Output() indirizzoChanged = new EventEmitter<Indirizzo>();
  @Output() indirizzoEditState = new EventEmitter<boolean>();

  @ViewChild('indirizzoForm', { static: false }) indirizzoForm: NgForm;

  idIndirizzo: number;

  indirizzoModel: {
    indirizzoEsteso: string;
    toponimo: string;
    indirizzo: string
    numero: string;
    comune: Comune;
    provincia: string;
    cap: string;
    nazione: string;
  };

  toponimiOptions: Sedime[];
  provinceOptions: Provincia[];
  nazioniOptions: Nazione[];
  searching = false;
  searchFailed = false;
  comuneNotFound: string;
  private nazioneDelete: string;
  private comuni: Comune[];
  private initialized = false;

  // edit = false;

  constructor(
    private readonly businessService: BusinessService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
  ) { }

  /**
   * Sort descrizione of indirizzo component
   */
  private readonly sortDescrizione = function (a: any, b: any) {
    return a.descrizione.localeCompare(b.descrizione);
  };

  async ngOnInit() {
    this.idIndirizzo = IndirizzoComponent.idSequence++;
    if (!this.mayUpdate) {
      return;
    }
    await this.inizializza();
  }
  /**
   * Inizializzas indirizzo component
   */
  private async inizializza() {
    if (this.edit && !this.indirizzoModel) {
      this.indirizzoModel = {} as any;
    }
    this.initialized = true;
    const [toponimi, province, nazioni, comuni, msgComuni, msgNazione] = await Promise.all([
      this.businessService.getSedimi().pipe(map((values: Sedime[]) => {
        values.sort(this.sortDescrizione);
        return values;
      })).toPromise(),
      this.storageService.getCachedValue(
        'PROVINCE', () => this.businessService.getProvince().pipe(map((values: Provincia[]) => {
          values.sort(this.sortDescrizione);
          return values;
        })).toPromise()
      ),
      this.storageService.getCachedValue(
        'NAZIONI', () => this.businessService.getNazioni().pipe(map((values: Nazione[]) => {
          values.sort(this.sortDescrizione);
          return values;
        })).toPromise()
      ),
      this.storageService.getCachedValue('COMUNI', () => this.utilitiesService.getAllComuni()),
      this.utilitiesService.getMessage('ME032'),
      this.utilitiesService.getMessage('MI013')
    ]);
    this.toponimiOptions = toponimi;
    if (this.filtraProvincePiemonte) {
      this.provinceOptions = province.filter((p: Provincia) => p.codice_regione_silp === '01' );
    } else {
      this.provinceOptions = province;
    }
    this.nazioniOptions = nazioni;
    this.comuni = comuni;
    this.comuneNotFound = msgComuni;
    this.nazioneDelete = msgNazione;
  }

  /**
   * on changes
   * @param changes SimpleChanges
   */
  async ngOnChanges(changes: SimpleChanges) {
    if (changes.mayUpdate && !changes.mayUpdate.isFirstChange()) {
      if (!this.initialized) {
        await this.inizializza();
      }
    }
  }

  formatMatches = (item: Comune) => item ? item.descrizione : '';

  /**
   * Search comune of indirizzo component
   */
  searchComune = (text$: Observable<string>): Observable<Comune[]> =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap(term => {
        let listaComuni = [] as Comune[];
        if (term && term.length >= 2) {
          listaComuni = this.comuni;
          if (this.indirizzoModel.provincia) {
            listaComuni = listaComuni.filter(
              comune => comune.provincia.codice_ministeriale === this.indirizzoModel.provincia
            );
          }
          const termUpper = term.toLocaleUpperCase();
          listaComuni = listaComuni.filter(
            comune => comune.descrizione.toLocaleUpperCase().includes(termUpper)
          );
        }
        return of(listaComuni);
      }),
      tap(() => this.searching = false)
    )

  /**
   * Determines whether toggle on
   */
  onToggle() {
    this.edit = !this.edit;
    if (this.edit && this.indirizzo) {
      this.indirizzoModel = {
        indirizzoEsteso: getDeepValue(this.indirizzo, 'indirizzo_esteso'),
        toponimo: getDeepValue(this.indirizzo, 'toponimo.codice_ministeriale'),
        indirizzo: getDeepValue(this.indirizzo, 'indirizzo'),
        numero: getDeepValue(this.indirizzo, 'numero_civico'),
        comune: getDeepValue(this.indirizzo, 'comune'),
        provincia: getDeepValue(this.indirizzo, 'comune.provincia.codice_ministeriale'),
        cap: getDeepValue(this.indirizzo, 'comune.cap'),
        nazione: getDeepValue(this.indirizzo, 'stato.codice_ministeriale')
      };
    }
    this.indirizzoEditState.emit(this.edit);
  }

  /**
   * Determines whether change provincia on
   */
  onChangeProvincia() {
    this.indirizzoModel.comune = null;
    this.indirizzoModel.nazione = null;
  }

  /**
   * Determines whether change nazione on
   */
  onChangeNazione() {
    if (this.indirizzoModel.nazione &&
      this.indirizzoModel.nazione.trim() !== '' &&
      this.indirizzoModel.nazione !== IndirizzoComponent.ITALIA.codice_ministeriale) {
      this.indirizzoModel.indirizzoEsteso = null;
      this.indirizzoModel.toponimo = null;
      this.indirizzoModel.indirizzo = null;
      this.indirizzoModel.numero = null;
      this.indirizzoModel.comune = null;
      this.indirizzoModel.provincia = null;
      this.indirizzoModel.cap = null;

      this.utilitiesService.showToastrInfoMessage(this.nazioneDelete, 'Indirizzo');
    }
  }

  /**
   * Determines whether submit on
   *
   */
  onSubmit() {
    let indirizzo: string;
    let numeroCivico: string;
    let toponimo: Sedime;
    let nazione: Nazione;
    let comune: Comune;
    let provincia: Provincia;
    let indirizzoEsteso: string;
    if (this.isItalia()) {
      indirizzo = this.indirizzoModel.indirizzo;
      numeroCivico = this.indirizzoModel.numero;
      toponimo = this.toponimiOptions.find(t => t.codice_ministeriale === this.indirizzoModel.toponimo);
      nazione = this.nazioniOptions.find(n => n.codice_ministeriale === this.indirizzoModel.nazione);
      provincia = this.provinceOptions.find(p => p.codice_ministeriale === this.indirizzoModel.provincia);
      comune = this.indirizzoModel.comune;
      if (comune) {
        if (typeof comune !== 'object') {
          this.indirizzoForm.controls.comune.setErrors({ noFound: this.comuneNotFound });
          return;
        }
        comune.cap = this.indirizzoModel.cap;
      }
      indirizzoEsteso = (toponimo ? toponimo.descrizione : '') + ' ' + (indirizzo ? indirizzo : '') + ' ' + (numeroCivico ? numeroCivico : '');
    } else {
      indirizzo = '';
      numeroCivico = '';
      toponimo = {};
      comune = {};
      indirizzoEsteso = '';
      nazione = this.nazioniOptions.find(n => n.codice_ministeriale === this.indirizzoModel.nazione);
    }

    this.indirizzo = {
      indirizzo_esteso: indirizzoEsteso.trim(),
      toponimo: toponimo,
      indirizzo: indirizzo,
      numero_civico: numeroCivico,
      comune: comune,
      stato: nazione
    };
    this.indirizzoChanged.emit(this.indirizzo);
    this.onToggle();
  }
  /**
   * Determines whether italia is
   * @returns true if italia
   */
  private isItalia(): boolean {
    return !this.indirizzoModel.nazione ||
      this.indirizzoModel.nazione.trim() === '' ||
      this.indirizzoModel.nazione === IndirizzoComponent.ITALIA.codice_ministeriale;
  }

  /**
   * Copia indirizzo
   */
  public copia() {
    this.indirizzo = {
      indirizzo_esteso: this.copiaDa.indirizzo_esteso,
      indirizzo: this.copiaDa.indirizzo,
      localita: this.copiaDa.localita,
      toponimo: { ...this.copiaDa.toponimo },
      numero_civico: this.copiaDa.numero_civico,
      comune: {
        ...this.copiaDa.comune,
      },
      stato: { ...this.copiaDa.stato },
    };
    if (this.indirizzo.comune && this.indirizzo.comune.provincia) {
      this.indirizzo.comune.provincia = { ...this.copiaDa.comune.provincia };
    }
    this.indirizzoChanged.emit(this.indirizzo);
  }

  /**
   * Cleans nazione
   */
  cleanNazione() {
    if (this.indirizzoModel.nazione &&
      this.indirizzoModel.nazione.trim() !== '' &&
      this.indirizzoModel.nazione !== IndirizzoComponent.ITALIA.codice_ministeriale) {
      this.indirizzoModel.nazione = null;
    }
  }
}
